/**
 * Quem pode ver e mexer no organograma (unidades, cargos, funções, lotações,
 * hierarquia, equipes, dados profissionais):
 *  - VER: Coordenador ou acima (o menu já mostrava para eles, mas a rota exigia
 *    Administrador e devolvia "acesso negado"; o gestor nem conseguia escolher
 *    a unidade ao cadastrar servidor);
 *  - MEXER: Administrador em tudo; Gerente só na(s) própria(s) secretaria(s).
 *
 * Usa o login completo do painel (adminAuthMiddleware: município, sessão),
 * no lugar do `authenticateAdmin` antigo.
 */

import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from './admin-auth';
import { getUserDepartmentIds } from '../services/staff-scope.service';

type Resource = 'unit' | 'position' | 'function' | 'assignment' | 'hierarchy' | 'team' | 'professional';

const READ_ROLES = ['COORDINATOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
const FULL_WRITE_ROLES = ['ADMIN', 'SUPER_ADMIN'];

const ID_LIKE = /^c[a-z0-9]{20,}$/i;

/** Secretaria do que está sendo criado/alterado (ou null quando não dá para saber) */
async function departmentOf(resource: Resource, req: Request): Promise<string | null> {
  const body = req.body || {};
  const segments = req.path.split('/').filter(Boolean);
  const pathId = segments.find((segment) => ID_LIKE.test(segment)) || null;

  if (resource === 'professional') {
    const userId = body.userId || (segments[1] && ID_LIKE.test(segments[1]) ? segments[1] : null);
    if (!userId) return null;
    const user = await prisma.user.findFirst({ where: { id: String(userId) }, select: { departmentId: true } });
    return user?.departmentId || null;
  }

  if (resource === 'hierarchy') {
    const unitId = body.organizationalUnitId
      || (pathId ? (await prisma.employeeHierarchy.findFirst({ where: { id: pathId }, select: { organizationalUnitId: true } }))?.organizationalUnitId : null);
    if (unitId) {
      const unit = await prisma.organizationalUnit.findFirst({ where: { id: String(unitId) }, select: { departmentId: true } });
      if (unit) return unit.departmentId;
    }
    const subordinateId = body.subordinadoId;
    if (subordinateId) {
      const user = await prisma.user.findFirst({ where: { id: String(subordinateId) }, select: { departmentId: true } });
      return user?.departmentId || null;
    }
    return null;
  }

  if (body.departmentId && !pathId) return String(body.departmentId);
  if (!pathId) return body.departmentId ? String(body.departmentId) : null;

  const select = { departmentId: true } as const;
  const record =
    resource === 'unit' ? await prisma.organizationalUnit.findFirst({ where: { id: pathId }, select })
    : resource === 'position' ? await prisma.position.findFirst({ where: { id: pathId }, select })
    : resource === 'function' ? await prisma.function.findFirst({ where: { id: pathId }, select })
    : resource === 'assignment' ? await prisma.employeeAssignment.findFirst({ where: { id: pathId }, select })
    : resource === 'team' ? await prisma.team.findFirst({ where: { id: pathId }, select })
    : null;
  return record?.departmentId || (body.departmentId ? String(body.departmentId) : null);
}

export function orgChartGuard(resource: Resource) {
  return [
    adminAuthMiddleware as any,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = (req as any).user as { id: string; role: string } | undefined;
        if (!user || !READ_ROLES.includes(user.role)) {
          res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'O organograma é visto por coordenadores, gerentes e administradores.' });
          return;
        }
        if (req.method === 'GET' || FULL_WRITE_ROLES.includes(user.role)) return next();

        if (user.role !== 'MANAGER') {
          res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Só gerentes e administradores alteram o organograma.' });
          return;
        }
        const departmentId = await departmentOf(resource, req);
        const mine = await getUserDepartmentIds(user.id);
        if (!departmentId || !mine.includes(departmentId)) {
          res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Você só pode alterar o organograma da sua secretaria.' });
          return;
        }
        // mudar de secretaria também precisa ser para uma das minhas
        if (req.body?.departmentId && !mine.includes(String(req.body.departmentId))) {
          res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Você só pode alterar o organograma da sua secretaria.' });
          return;
        }
        return next();
      } catch (error) {
        console.error('[org-chart-auth]', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Erro ao conferir permissão' });
      }
    },
  ];
}
