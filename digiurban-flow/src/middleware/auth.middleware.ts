/**
 * Middleware de autenticação para o módulo digiurban-flow
 * Suporta:
 * 1. JWT do admin (mesmo secret do backend principal)
 * 2. Service Token (para comunicação backend → flow)
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userType?: string;
  userName?: string;
  departmentId?: string;
}

interface JWTPayload {
  userId: string;
  type: string;
  name?: string;
  departmentId?: string;
  iat: number;
  exp: number;
}

/**
 * Middleware de autenticação JWT (admin/servidor)
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;

  // 1. Verificar Service Token (comunicação interna)
  const serviceToken = req.headers['x-digiurban-flow-token'] as string;
  if (serviceToken && serviceToken === config.flowServiceToken) {
    authReq.userId = 'system';
    authReq.userType = 'service';
    authReq.userName = 'DigiUrban Backend';
    next();
    return;
  }

  // 2. Verificar JWT (cookie ou header Authorization)
  let token: string | undefined;

  // Cookie do admin
  const adminCookie = req.cookies?.digiurban_admin_token;
  if (adminCookie) {
    token = adminCookie;
  }

  // Header Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Header x-user-id (vindo do proxy do backend, já autenticado)
  const proxyUserId = req.headers['x-user-id'] as string;
  if (proxyUserId) {
    authReq.userId = proxyUserId;
    authReq.userType = 'admin';
    authReq.userName = (req.headers['x-user-name'] as string) || 'Servidor';
    authReq.departmentId = req.headers['x-department-id'] as string;
    next();
    return;
  }

  if (!token) {
    res.status(401).json({ error: 'Token de autenticação não fornecido' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;

    if (decoded.type !== 'admin') {
      res.status(403).json({ error: 'Acesso restrito a servidores públicos' });
      return;
    }

    authReq.userId = decoded.userId;
    authReq.userType = decoded.type;
    authReq.userName = decoded.name;
    authReq.departmentId = decoded.departmentId;
    next();
  } catch (error) {
    logger.warn('JWT verification failed', { error: (error as Error).message });
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

/**
 * Middleware que aceita APENAS service token (rotas internas)
 */
export function serviceAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const serviceToken = req.headers['x-digiurban-flow-token'] as string;
  if (!serviceToken || serviceToken !== config.flowServiceToken) {
    res.status(401).json({ error: 'Service token inválido' });
    return;
  }
  (req as AuthenticatedRequest).userId = 'system';
  (req as AuthenticatedRequest).userType = 'service';
  next();
}
