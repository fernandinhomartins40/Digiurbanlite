/**
 * Acesso aos apps de secretaria pela EQUIPE DO PRÓPRIO DEPARTAMENTO.
 *
 * Regra (decisão do produto, 2026-09-28):
 * - ADMIN / SUPER_ADMIN: acessam todos os apps;
 * - USER / COORDINATOR / MANAGER: só o app das secretarias a que pertencem
 *   (departamento principal `User.departmentId` + vínculos ativos em
 *   `UserDepartment`);
 * - cidadão: nunca (o token de cidadão é recusado pelo adminAuthMiddleware).
 *
 * Antes: os apps usavam `authenticateAdmin` (só ADMIN — a própria equipe da
 * secretaria recebia 403) e saúde/TFD/farmácia usavam `authenticateToken`
 * (aceitava token de CIDADÃO — um cidadão lia solicitações de TFD de outros).
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from './admin-auth';

const FULL_ACCESS_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

export async function getUserDepartmentCodes(user: {
  id: string;
  department?: { code?: string | null } | null;
}): Promise<string[]> {
  const codes = new Set<string>();
  if (user.department?.code) codes.add(user.department.code.toUpperCase());

  const links = await prisma.userDepartment.findMany({
    where: { userId: user.id, isActive: true },
    select: { department: { select: { code: true } } },
  });
  for (const link of links) {
    if (link.department?.code) codes.add(link.department.code.toUpperCase());
  }
  return [...codes];
}

export function canAccessDepartmentApp(role: string, userCodes: string[], allowedCodes: string[]): boolean {
  if (FULL_ACCESS_ROLES.has(role)) return true;
  const allowed = new Set(allowedCodes.map((c) => c.toUpperCase()));
  return userCodes.some((code) => allowed.has(code));
}

/** Middleware (após adminAuthMiddleware) que restringe à equipe dos departamentos informados */
export function requireDepartmentMembership(...allowedCodes: string[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }
      if (FULL_ACCESS_ROLES.has(String(user.role))) return next();

      const codes = await getUserDepartmentCodes(user);
      if (canAccessDepartmentApp(String(user.role), codes, allowedCodes)) return next();

      res.status(403).json({ error: 'Acesso restrito à equipe da secretaria responsável' });
    } catch (error) {
      next(error);
    }
  };
}

/** Autenticação de servidor + restrição por departamento, para `router.use(...)` */
export function requireDepartmentAccess(...allowedCodes: string[]): RequestHandler[] {
  return [adminAuthMiddleware, requireDepartmentMembership(...allowedCodes)];
}
