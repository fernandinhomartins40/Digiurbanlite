/**
 * Mapa dos pedidos (protocolos) — para TODO servidor, no escopo dele:
 * atendente vê os pedidos com ele, gerente/coordenador os da(s) sua(s)
 * secretaria(s), administrador e Gabinete do Prefeito o município todo.
 *
 * Só lê coordenadas já gravadas: procurar endereço no mapa (geocodificação)
 * é feito por uma rotina em segundo plano (jobs/protocol-geocoding.job.ts),
 * não na hora em que alguém abre a tela.
 */

import { Router, Request, Response } from 'express';
import { ProtocolStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { hasGabineteAccess } from '../middleware/gabinete-auth';
import { buildProtocolScopeWhere } from '../services/protocol-access.service';

const router = Router();
router.use(adminAuthMiddleware as any);

const MAX_POINTS = 3000;
const STATUSES = new Set(Object.values(ProtocolStatus));

/** Filtros e escopo do mapa (o Gabinete vê tudo) */
function mapWhere(req: Request) {
  const user = (req as any).user;
  const and: any[] = hasGabineteAccess(user)
    ? []
    : buildProtocolScopeWhere({ id: user.id, role: user.role, departmentId: user.departmentId, departmentIds: user.departmentIds } as any);
  const { status, departmentId, serviceId, from, to, situacao } = req.query as Record<string, string | undefined>;
  if (status && STATUSES.has(status as ProtocolStatus)) and.push({ status });
  if (situacao === 'abertos') and.push({ status: { notIn: ['CONCLUIDO', 'CANCELADO'] } });
  if (situacao === 'atrasados') and.push({ status: { notIn: ['CONCLUIDO', 'CANCELADO'] }, sla: { is: { isOverdue: true } } });
  if (departmentId) and.push({ departmentId });
  if (serviceId) and.push({ serviceId });
  if (from || to) {
    and.push({ createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } });
  }
  return and;
}

/** GET /api/map/protocols — pontos do mapa */
router.get('/protocols', async (req: Request, res: Response) => {
  try {
    const and = mapWhere(req);
    const where = { AND: [...and, { latitude: { not: null } }, { longitude: { not: null } }] };
    const [items, withoutLocation] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: MAX_POINTS,
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          latitude: true,
          longitude: true,
          address: true,
          specificLocation: true,
          locationType: true,
          geocodingProvider: true,
          createdAt: true,
          service: { select: { name: true, category: true } },
          department: { select: { id: true, name: true } },
          sla: { select: { isOverdue: true, daysOverdue: true } },
        },
      }),
      prisma.protocolSimplified.count({ where: { AND: [...and, { OR: [{ latitude: null }, { longitude: null }] }] } }),
    ]);
    res.json({
      success: true,
      data: items.map((item) => ({
        ...item,
        overdue: !!item.sla?.isOverdue && !['CONCLUIDO', 'CANCELADO'].includes(item.status),
        geocodingPrecision: item.locationType === 'GPS' || item.locationType === 'MANUAL_PIN' ? 'exact' : item.geocodingProvider ? 'geocoded' : 'exact',
      })),
      meta: { shown: items.length, limit: MAX_POINTS, withoutLocation },
    });
  } catch (error) {
    console.error('[mapa] pontos:', error);
    res.status(500).json({ success: false, error: 'Não foi possível carregar o mapa' });
  }
});

/** GET /api/map/stats — números do mapa (mesmo escopo e filtros) */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const and = mapWhere(req);
    const located = { AND: [...and, { latitude: { not: null } }] };
    const [byStatus, byDepartment, total] = await Promise.all([
      prisma.protocolSimplified.groupBy({ by: ['status'], where: located, _count: { _all: true } }),
      prisma.protocolSimplified.groupBy({ by: ['departmentId'], where: located, _count: { _all: true } }),
      prisma.protocolSimplified.count({ where: located }),
    ]);
    const departments = await prisma.department.findMany({
      where: { id: { in: byDepartment.map((item) => item.departmentId).filter(Boolean) as string[] } },
      select: { id: true, name: true },
    });
    const names = new Map(departments.map((item) => [item.id, item.name]));
    res.json({
      success: true,
      data: {
        totalWithLocation: total,
        byStatus: byStatus.map((item) => ({ status: item.status, count: item._count._all })),
        byDepartment: byDepartment
          .map((item) => ({ departmentId: item.departmentId, name: names.get(item.departmentId as string) || 'Sem secretaria', count: item._count._all }))
          .sort((a, b) => b.count - a.count),
      },
    });
  } catch (error) {
    console.error('[mapa] números:', error);
    res.status(500).json({ success: false, error: 'Não foi possível carregar os números do mapa' });
  }
});

export default router;
