/**
 * Authentication middleware for digiurban-flow.
 * Supports:
 * 1. Service token (backend -> flow)
 * 2. JWT admin token (cookie/header)
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userType?: 'admin' | 'service';
  userRole?: string;
  userName?: string;
  departmentId?: string;
  departmentIds?: string[];
  organizationalUnitIds?: string[];
  canAccessConfidential?: boolean;
}

interface JWTPayload {
  userId: string;
  type?: string;
  role?: string;
  name?: string;
  departmentId?: string;
  departmentIds?: string[];
  organizationalUnitIds?: string[];
  iat?: number;
  exp?: number;
}

export interface FlowAuthContext {
  userId: string;
  userType: 'admin' | 'service';
  userRole?: string;
  userName: string;
  departmentId?: string;
  departmentIds: string[];
  organizationalUnitIds: string[];
  canAccessConfidential: boolean;
}

function parseHeaderList(value: unknown): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(',') : String(value);
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function isPrivilegedRole(role?: string): boolean {
  const normalized = (role || '').toUpperCase();
  return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
}

function buildDepartmentIds(primaryDepartmentId?: string, headerList?: string[]): string[] {
  const values = [...(headerList || [])];
  if (primaryDepartmentId) {
    values.unshift(primaryDepartmentId);
  }
  return Array.from(new Set(values.filter(Boolean)));
}

function applyServiceContext(authReq: AuthenticatedRequest): void {
  authReq.userId = 'system';
  authReq.userType = 'service';
  authReq.userRole = 'SERVICE';
  authReq.userName = 'DigiUrban Backend';
  authReq.departmentIds = [];
  authReq.organizationalUnitIds = [];
  authReq.canAccessConfidential = true;
}

export function toFlowAuthContext(req: AuthenticatedRequest): FlowAuthContext {
  if (!req.userId || !req.userType) {
    throw new Error('Requisicao sem contexto de autenticacao');
  }

  return {
    userId: req.userId,
    userType: req.userType,
    userRole: req.userRole,
    userName: req.userName || 'Servidor',
    departmentId: req.departmentId,
    departmentIds: req.departmentIds || [],
    organizationalUnitIds: req.organizationalUnitIds || [],
    canAccessConfidential: Boolean(req.canAccessConfidential),
  };
}

/**
 * JWT/service auth middleware.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;

  const serviceToken = req.headers['x-digiurban-flow-token'] as string | undefined;
  const hasValidServiceToken =
    Boolean(serviceToken) &&
    Boolean(config.flowServiceToken) &&
    serviceToken === config.flowServiceToken;

  const proxyUserId = req.headers['x-user-id'] as string | undefined;
  if (proxyUserId) {
    if (!hasValidServiceToken) {
      res.status(401).json({ error: 'Cabecalhos de proxy exigem service token valido' });
      return;
    }

    const proxyRole = (req.headers['x-user-role'] as string | undefined) || 'USER';
    const proxyName = (req.headers['x-user-name'] as string | undefined) || 'Servidor';
    const proxyDepartmentId = req.headers['x-department-id'] as string | undefined;
    const proxyDepartmentIds = buildDepartmentIds(
      proxyDepartmentId,
      parseHeaderList(req.headers['x-department-ids']),
    );
    const proxyOrganizationalUnitIds = parseHeaderList(req.headers['x-organizational-unit-ids']);
    const canAccessConfidentialHeader = String(req.headers['x-access-confidential'] || '');
    const canAccessConfidential =
      canAccessConfidentialHeader === '1' ||
      canAccessConfidentialHeader.toLowerCase() === 'true' ||
      isPrivilegedRole(proxyRole);

    authReq.userId = proxyUserId;
    authReq.userType = 'admin';
    authReq.userRole = proxyRole;
    authReq.userName = proxyName;
    authReq.departmentId = proxyDepartmentId;
    authReq.departmentIds = proxyDepartmentIds;
    authReq.organizationalUnitIds = proxyOrganizationalUnitIds;
    authReq.canAccessConfidential = canAccessConfidential;
    next();
    return;
  }

  if (hasValidServiceToken) {
    applyServiceContext(authReq);
    next();
    return;
  }

  let token: string | undefined;
  const adminCookie = req.cookies?.digiurban_admin_token as string | undefined;
  if (adminCookie) {
    token = adminCookie;
  }

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Token de autenticacao nao fornecido' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    if (!decoded.userId) {
      res.status(401).json({ error: 'Token invalido' });
      return;
    }

    const role = decoded.role || decoded.type || 'USER';
    authReq.userId = decoded.userId;
    authReq.userType = 'admin';
    authReq.userRole = role;
    authReq.userName = decoded.name || 'Servidor';
    authReq.departmentId = decoded.departmentId;
    authReq.departmentIds = buildDepartmentIds(decoded.departmentId, decoded.departmentIds || []);
    authReq.organizationalUnitIds = Array.isArray(decoded.organizationalUnitIds)
      ? Array.from(new Set(decoded.organizationalUnitIds.filter(Boolean)))
      : [];
    authReq.canAccessConfidential = isPrivilegedRole(role);
    next();
  } catch (error) {
    logger.warn('JWT verification failed', { error: (error as Error).message });
    res.status(401).json({ error: 'Token invalido ou expirado' });
  }
}

/**
 * Middleware that accepts only service token.
 */
export function serviceAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const serviceToken = req.headers['x-digiurban-flow-token'] as string | undefined;
  if (!serviceToken || serviceToken !== config.flowServiceToken) {
    res.status(401).json({ error: 'Service token invalido' });
    return;
  }

  applyServiceContext(req as AuthenticatedRequest);
  next();
}
