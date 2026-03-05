import { NextFunction, Request, Response } from 'express';
import { config } from '../config/config';
import { AuthenticatedProxyRequest } from '../types';

function extractServiceToken(req: Request): string | null {
  const explicit = req.headers['x-digiurban-ai-token'];
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim();
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export function proxyAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const providedToken = extractServiceToken(req);
  const expectedToken = config.aiServiceToken;

  if (!expectedToken) {
    res.status(500).json({ error: 'AI service token is not configured' });
    return;
  }

  if (!providedToken || providedToken !== expectedToken) {
    res.status(401).json({ error: 'Invalid AI service token' });
    return;
  }

  const tenantIdRaw = req.headers['x-tenant-id'];
  const userIdRaw = req.headers['x-user-id'];
  const userNameRaw = req.headers['x-user-name'];
  const departmentIdRaw = req.headers['x-department-id'];

  const tenantId =
    typeof tenantIdRaw === 'string' && tenantIdRaw.trim()
      ? tenantIdRaw.trim()
      : config.defaultTenantId;
  const userId =
    typeof userIdRaw === 'string' && userIdRaw.trim() ? userIdRaw.trim() : 'system';
  const userName =
    typeof userNameRaw === 'string' && userNameRaw.trim() ? userNameRaw.trim() : undefined;
  const departmentId =
    typeof departmentIdRaw === 'string' && departmentIdRaw.trim()
      ? departmentIdRaw.trim()
      : undefined;

  (req as AuthenticatedProxyRequest).auth = {
    tenantId,
    userId,
    userName,
    departmentId,
    viaServiceToken: true,
  };

  next();
}

export function requireUserContext(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authReq = req as AuthenticatedProxyRequest;

  if (!authReq.auth?.userId || authReq.auth.userId === 'system') {
    res.status(403).json({ error: 'User context is required for this route' });
    return;
  }

  next();
}

export function serviceOnlyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const providedToken = extractServiceToken(req);
  const expectedToken = config.aiServiceToken;

  if (!providedToken || providedToken !== expectedToken) {
    res.status(401).json({ error: 'Invalid AI service token' });
    return;
  }

  const tenantIdRaw = req.headers['x-tenant-id'];
  const tenantId =
    typeof tenantIdRaw === 'string' && tenantIdRaw.trim()
      ? tenantIdRaw.trim()
      : config.defaultTenantId;

  (req as AuthenticatedProxyRequest).auth = {
    tenantId,
    userId: 'system',
    viaServiceToken: true,
  };

  next();
}
