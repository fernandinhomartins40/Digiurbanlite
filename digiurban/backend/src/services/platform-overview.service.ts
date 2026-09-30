/**
 * Resumo da plataforma para o Dashboard do super-admin (todos os municípios).
 *
 * Antes o Dashboard usava /api/super-admin/stats, que roda no contexto do
 * tenant da requisição e mostrava só o município padrão como se fosse o todo.
 * Aqui tudo roda em runAsPlatform (sem filtro de município).
 */

import os from 'os';
import { getMemoryUsage } from '../lib/memory-usage';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';

export type AttentionReason = 'SUSPENDED' | 'OVERDUE_INVOICE' | 'PLAN_ENDING' | 'NEAR_USER_LIMIT' | 'NEAR_CITIZEN_LIMIT';

export interface AttentionItem {
  tenantId: string;
  name: string;
  uf: string;
  reasons: { code: AttentionReason; detail: string }[];
}

const DAY = 24 * 60 * 60 * 1000;
const NEAR_LIMIT = 0.9;

const pct = (used: number, max: number) => (max > 0 ? used / max : 0);

export async function getPlatformOverview() {
  return runAsPlatform(async () => {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * DAY);
    const last30Days = new Date(now.getTime() - 30 * DAY);

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true, nomeMunicipio: true, ufMunicipio: true, status: true, plan: true,
        planEndsAt: true, maxUsers: true, maxCitizens: true, suspensionReason: true,
      },
    });

    const [usersBy, citizensBy, protocolsBy, protocols30d, openInvoices, paidThisMonth, newLeads, leads30d] = await Promise.all([
      prisma.user.groupBy({ by: ['tenantId'], where: { isActive: true }, _count: { _all: true } }),
      prisma.citizen.groupBy({ by: ['tenantId'], _count: { _all: true } }),
      prisma.protocolSimplified.groupBy({ by: ['tenantId'], _count: { _all: true } }),
      prisma.protocolSimplified.count({ where: { createdAt: { gte: last30Days } } }),
      prisma.invoice.findMany({
        where: { status: { in: ['PENDING', 'OVERDUE'] } },
        select: { tenantId: true, amount: true, status: true, dueDate: true },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PAID', paidAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
        _sum: { amount: true },
      }),
      prisma.lead.count({ where: { status: 'NEW' } }),
      prisma.lead.count({ where: { createdAt: { gte: last30Days } } }),
    ]);

    const countMap = (rows: any[]) => new Map(rows.map((r) => [r.tenantId, r._count._all as number]));
    const users = countMap(usersBy);
    const citizens = countMap(citizensBy);
    const protocols = countMap(protocolsBy);

    const overdue = openInvoices.filter((i) => i.status === 'OVERDUE' || i.dueDate < now);
    const overdueByTenant = new Map<string, number>();
    for (const inv of overdue) if (inv.tenantId) overdueByTenant.set(inv.tenantId, (overdueByTenant.get(inv.tenantId) || 0) + 1);

    const attention: AttentionItem[] = [];
    for (const t of tenants) {
      const reasons: AttentionItem['reasons'] = [];
      if (t.status === 'SUSPENDED') reasons.push({ code: 'SUSPENDED', detail: t.suspensionReason || 'Município suspenso' });
      const overdueCount = overdueByTenant.get(t.id) || 0;
      if (overdueCount) reasons.push({ code: 'OVERDUE_INVOICE', detail: `${overdueCount} fatura(s) vencida(s)` });
      if (t.status === 'ACTIVE' && t.planEndsAt && t.planEndsAt <= in30Days) {
        const days = Math.ceil((t.planEndsAt.getTime() - now.getTime()) / DAY);
        reasons.push({ code: 'PLAN_ENDING', detail: days < 0 ? 'Plano vencido' : `Plano vence em ${days} dia(s)` });
      }
      const u = users.get(t.id) || 0;
      if (t.maxUsers > 0 && pct(u, t.maxUsers) >= NEAR_LIMIT) reasons.push({ code: 'NEAR_USER_LIMIT', detail: `${u} de ${t.maxUsers} usuários` });
      const c = citizens.get(t.id) || 0;
      if (t.maxCitizens > 0 && pct(c, t.maxCitizens) >= NEAR_LIMIT) reasons.push({ code: 'NEAR_CITIZEN_LIMIT', detail: `${c} de ${t.maxCitizens} cidadãos` });
      if (reasons.length) attention.push({ tenantId: t.id, name: t.nomeMunicipio, uf: t.ufMunicipio, reasons });
    }

    let databaseOk = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseOk = false;
    }

    const sum = (m: Map<string, number>) => Array.from(m.values()).reduce((a, b) => a + b, 0);
    const byStatus = (s: string) => tenants.filter((t) => t.status === s).length;

    return {
      tenants: {
        total: tenants.length,
        active: byStatus('ACTIVE'),
        suspended: byStatus('SUSPENDED'),
        other: tenants.length - byStatus('ACTIVE') - byStatus('SUSPENDED'),
      },
      usage: {
        activeUsers: sum(users),
        citizens: sum(citizens),
        protocols: sum(protocols),
        protocolsLast30Days: protocols30d,
      },
      billing: {
        openCount: openInvoices.length,
        openAmount: openInvoices.reduce((a, i) => a + i.amount, 0),
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((a, i) => a + i.amount, 0),
        paidThisMonth: paidThisMonth._sum.amount || 0,
      },
      leads: { new: newLeads, last30Days: leads30d },
      health: {
        database: databaseOk,
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsedPct: Math.round(getMemoryUsage().usagePercent),
      },
      attention: attention.sort((a, b) => b.reasons.length - a.reasons.length),
      generatedAt: now.toISOString(),
    };
  });
}
