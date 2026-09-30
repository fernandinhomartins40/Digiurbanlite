/**
 * ============================================================================
 * AUTENTICAÇÃO DO CONSOLE DA PLATAFORMA (/super-admin)
 * ============================================================================
 * Parte das telas do console ainda chama rotas antigas em /api/super-admin/*
 * (e-mail, auditoria, logs, monitoramento, modelos de e-mail), que só aceitavam
 * o SUPER_ADMIN legado (usuário DE TENANT, cookie digiurban_admin_token).
 *
 * Este middleware aceita as DUAS identidades, com a Equipe da plataforma como
 * fonte de verdade:
 *   1. PlatformUser (cookie digiurban_platform_token) — identidade nova;
 *   2. SUPER_ADMIN legado — vale o espelho PlatformUser de mesmo e-mail:
 *      desativado na Equipe → bloqueado; papel do espelho → aplicado.
 *
 * PLATFORM_SUPPORT só consulta: métodos de escrita recebem 403.
 * O contexto de tenant da requisição NÃO é alterado (mesmo comportamento do
 * superAdminAuth que ele substitui).
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';
import { PLATFORM_TOKEN_COOKIE, type PlatformAuthenticatedRequest } from './platform-auth';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

type ConsoleIdentity = { id: string; email: string; name: string; role: string; mustChangePassword: boolean };

function verify(token: string | undefined): any | null {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

export async function resolveConsoleIdentity(
  req: Request
): Promise<{ platformUser: ConsoleIdentity; legacyUser: any | null } | { error: string; status: number }> {
  // 1) Identidade de plataforma
  const platformToken = verify(req.cookies?.[PLATFORM_TOKEN_COOKIE]);
  if (platformToken?.type === 'platform' && platformToken.platformUserId) {
    const platformUser = await runAsPlatform(async () =>
      prisma.platformUser.findFirst({
        where: { id: platformToken.platformUserId, isActive: true },
        select: { id: true, email: true, name: true, role: true, mustChangePassword: true },
      })
    );
    if (platformUser) return { platformUser, legacyUser: null };
  }

  // 2) SUPER_ADMIN legado (cookie de admin ou Bearer)
  const auth = req.headers.authorization;
  const adminToken = verify(req.cookies?.digiurban_admin_token || (auth?.startsWith('Bearer ') ? auth.substring(7) : undefined));
  if (adminToken?.userId) {
    const user = await runAsPlatform(async () =>
      prisma.user.findFirst({ where: { id: adminToken.userId, isActive: true }, include: { department: true } })
    );
    if (user && user.role === UserRole.SUPER_ADMIN) {
      const mirror = await runAsPlatform(async () =>
        prisma.platformUser.findFirst({
          where: { email: user.email },
          select: { id: true, email: true, name: true, role: true, mustChangePassword: true, isActive: true },
        })
      );
      if (mirror && !mirror.isActive) return { error: 'Acesso desativado na Equipe da plataforma', status: 403 };
      const platformUser: ConsoleIdentity = mirror
        ? { id: mirror.id, email: mirror.email, name: mirror.name, role: mirror.role, mustChangePassword: mirror.mustChangePassword }
        : { id: `legacy:${user.id}`, email: user.email, name: user.name, role: 'PLATFORM_ADMIN', mustChangePassword: false };
      return { platformUser, legacyUser: user };
    }
  }

  return { error: 'Faça login no console da plataforma', status: 401 };
}

export const platformConsoleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await resolveConsoleIdentity(req);
    if ('error' in result) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    const { platformUser, legacyUser } = result;

    if (platformUser.role === 'PLATFORM_SUPPORT' && !READ_METHODS.has(req.method)) {
      res.status(403).json({ error: 'Seu acesso (Suporte) permite apenas consultar' });
      return;
    }

    (req as PlatformAuthenticatedRequest).platformUser = platformUser;
    if (legacyUser) {
      (req as any).user = legacyUser;
      (req as any).userId = legacyUser.id;
      (req as any).userRole = legacyUser.role;
    }
    next();
  } catch (error) {
    console.error('[platformConsoleAuth] erro:', error);
    res.status(500).json({ error: 'Erro interno na autenticação' });
  }
};

export default platformConsoleAuth;
