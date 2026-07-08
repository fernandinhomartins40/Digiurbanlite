import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';
import {
  AuthenticatedRequest,
  UserWithRelations,
  JWTPayload
} from '../types';
import { DEFAULT_TENANT_ID } from '../lib/tenant-context';

/**
 * Middleware de autenticação para SUPER_ADMIN
 * Verifica se o usuário é SUPER_ADMIN
 */
export const superAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obter token do cookie ou header
    let token = req.cookies?.digiurban_admin_token;
    const authHeader = req.headers.authorization;

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      res.status(401).json({ error: 'Token de acesso necessário' });
      return;
    }

    // Verificar token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Configuração de segurança inválida' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload & { tenantId?: string };

    // ✅ Fase 4 Multi-Tenant: claim de tenant deve casar com o tenant da request
    // (na Fase 5 SUPER_ADMIN migra para PlatformUser cross-tenant).
    const requestTenant = (req as any).tenantId || DEFAULT_TENANT_ID;
    if (decoded.tenantId && decoded.tenantId !== requestTenant) {
      res.status(401).json({ error: 'Token não pertence a este município' });
      return;
    }

    // Buscar usuário
    const user: UserWithRelations | null = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        isActive: true
      },
      include: {
        department: true
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
      return;
    }

    // Verificar se é SUPER_ADMIN
    if (user.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({
        error: 'Acesso negado: apenas SUPER_ADMIN tem permissão',
        currentRole: user.role
      });
      return;
    }

    // Adicionar usuário à requisição
    (req as AuthenticatedRequest).userId = user.id;
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).userRole = user.role;

    next();
  } catch (error: unknown) {
    console.error('Erro na autenticação do super admin:', error);

    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Token inválido' });
        return;
      }

      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expirado' });
        return;
      }
    }

    res.status(500).json({ error: 'Erro interno na autenticação' });
  }
};
