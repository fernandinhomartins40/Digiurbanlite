/**
 * ============================================================================
 * PLATFORM AUTH MIDDLEWARE (Fase C Multi-Tenant)
 * ============================================================================
 * Autentica OPERADORES DE PLATAFORMA (model PlatformUser) — identidade
 * separada do espaço de tenant, para gestão de municípios em /api/platform.
 *
 * Fecha o achado R2 da auditoria: os endpoints de plataforma eram guardados
 * pelo role SUPER_ADMIN, que é um usuário DO tenant — qualquer município com
 * um SUPER_ADMIN podia operar a plataforma inteira.
 *
 * Contrato do token:
 *   Cookie: digiurban_platform_token (httpOnly) | Authorization: Bearer
 *   Payload: { platformUserId, type: 'platform', role, iat, exp }
 *   - type !== 'platform' → 401 (tokens de admin/cidadão NUNCA passam aqui)
 *   - sem claim de tenant por design: o middleware estabelece runAsPlatform
 *
 * requirePlatformRole('PLATFORM_ADMIN') restringe operações de escrita.
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';

export const PLATFORM_TOKEN_COOKIE = 'digiurban_platform_token';

export interface PlatformTokenPayload {
  platformUserId: string;
  type: 'platform';
  role: string;
}

export interface PlatformAuthenticatedRequest extends Request {
  platformUser?: {
    id: string;
    email: string;
    name: string;
    role: string;
    mustChangePassword: boolean;
  };
}

export const platformAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.[PLATFORM_TOKEN_COOKIE];
    const authHeader = req.headers.authorization;
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      res.status(401).json({ error: 'Autenticação de plataforma necessária' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'Configuração de segurança inválida' });
      return;
    }

    let decoded: PlatformTokenPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as PlatformTokenPayload;
    } catch {
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }

    // Tokens de tenant (admin/cidadão) não são aceitos — identidade separada.
    if (decoded.type !== 'platform' || !decoded.platformUserId) {
      res.status(401).json({ error: 'Token não é de operador de plataforma' });
      return;
    }

    const platformUser = await runAsPlatform(async () =>
      prisma.platformUser.findFirst({
        where: { id: decoded.platformUserId, isActive: true },
        select: { id: true, email: true, name: true, role: true, mustChangePassword: true },
      })
    );

    if (!platformUser) {
      res.status(401).json({ error: 'Operador de plataforma não encontrado ou inativo' });
      return;
    }

    (req as PlatformAuthenticatedRequest).platformUser = platformUser;

    // Todo o request handler roda como plataforma (cross-tenant auditável)
    runAsPlatform(() => next());
  } catch (error) {
    console.error('Erro na autenticação de plataforma:', error);
    res.status(500).json({ error: 'Erro interno na autenticação' });
  }
};

/** Restringe a um role de plataforma específico (após platformAuthMiddleware). */
export function requirePlatformRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as PlatformAuthenticatedRequest).platformUser;
    if (!user || user.role !== role) {
      res.status(403).json({ error: 'Permissão de plataforma insuficiente' });
      return;
    }
    next();
  };
}

export default platformAuthMiddleware;
