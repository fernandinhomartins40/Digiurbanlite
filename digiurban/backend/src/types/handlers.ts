// ============================================================================
// FASE 1 - HANDLERS COMPATÍVEIS - PADRÃO MODERNO 2024
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
// Handler básico
export type BaseHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

// Handler autenticado - requer userId e user
export type AuthHandler = (
  req: Request & Required<Pick<Request, 'userId' | 'user'>>,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// Handler completo - requer autenticação
export type AuthenticatedHandler = (
  req: Request & Required<Pick<Request, 'userId' | 'user'>>,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// Handler com role específico
export type RoleHandler<T extends UserRole> = (
  req: Request &
    Required<Pick<Request, 'userId' | 'user'>> & {
      user: { role: T } & Request['user'];
    },
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// Handler admin
export type AdminHandler = RoleHandler<'ADMIN' | 'SUPER_ADMIN'>;

// Handler manager
export type ManagerHandler = RoleHandler<'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'>;

// Wrapper para compatibilidade com middleware existente
export type MiddlewareHandler = BaseHandler;

// Helper para criar handlers tipados
export const createHandler = <TReq extends Request = Request>(
  handler: (req: TReq, res: Response, next: NextFunction) => Promise<void> | void
): BaseHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as TReq, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Helper para criar handlers autenticados
export const createAuthHandler = (handler: AuthHandler): BaseHandler => {
  return createHandler(handler);
};


// Helper para criar handlers autenticados
export const createAuthenticatedHandler = (handler: AuthenticatedHandler): BaseHandler => {
  return createHandler(handler);
};
