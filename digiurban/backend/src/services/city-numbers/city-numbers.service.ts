/**
 * "Prefeitura em números": página pública com números AGREGADOS do município
 * (nenhum nome, nenhum dado pessoal). Desligada por padrão; a prefeitura liga
 * no painel (Configurações › Sistema). A opção fica em `Tenant.branding`
 * (`cityNumbersPublic`), que já é a configuração pública do município.
 */

import { prisma } from '../../lib/prisma';
import { runAsPlatform } from '../../lib/tenant-context';
import { brasiliaDayBounds, brasiliaDayKey, weekDayOf } from '../agenda-medica/brasilia-time';

const DAY = 24 * 60 * 60 * 1000;
export const CITY_NUMBERS_KEY = 'cityNumbersPublic';

/** Página ligada? Só com a opção marcada como `true` (desligada por padrão). */
export function isCityNumbersEnabled(branding: unknown): boolean {
  return !!branding && typeof branding === 'object' && (branding as Record<string, unknown>)[CITY_NUMBERS_KEY] === true;
}

/** Começo do mês corrente em Brasília. */
export function brasiliaMonthStart(now: Date): Date {
  return brasiliaDayBounds(`${brasiliaDayKey(now).slice(0, 7)}-01`).start;
}

/** Segunda-feira (YYYY-MM-DD, Brasília) da semana de um instante. */
export function brasiliaWeekStartKey(now: Date): string {
  const key = brasiliaDayKey(now);
  const back = (weekDayOf(key) + 6) % 7;
  return brasiliaDayKey(new Date(brasiliaDayBounds(key).start.getTime() - back * DAY + 12 * 60 * 60 * 1000));
}

/** Média de dias entre abertura e conclusão (1 casa); null sem pedidos concluídos. */
export function averageResponseDays(rows: Array<{ createdAt: Date; concludedAt: Date | null }>): number | null {
  const valid = rows.filter((row) => row.concludedAt && row.concludedAt >= row.createdAt);
  if (!valid.length) return null;
  const total = valid.reduce((sum, row) => sum + (row.concludedAt!.getTime() - row.createdAt.getTime()), 0);
  return Math.round((total / valid.length / DAY) * 10) / 10;
}

/** Números do município do contexto atual (chamar dentro de runAsTenant). */
export async function getCityNumbers(now = new Date()) {
  const monthStart = brasiliaMonthStart(now);
  const since90 = new Date(now.getTime() - 90 * DAY);

  const [recebidosMes, resolvidosMes, concluded, rating, top] = await Promise.all([
    prisma.protocolSimplified.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.protocolSimplified.count({ where: { status: 'CONCLUIDO', concludedAt: { gte: monthStart } } }),
    prisma.protocolSimplified.findMany({
      where: { status: 'CONCLUIDO', concludedAt: { gte: since90 } },
      select: { createdAt: true, concludedAt: true },
      take: 5000,
    }),
    prisma.protocolEvaluationSimplified.aggregate({ where: { createdAt: { gte: since90 } }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.protocolSimplified.groupBy({
      by: ['serviceId'],
      where: { createdAt: { gte: since90 } },
      _count: { _all: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 5,
    }),
  ]);

  const services = top.length
    ? await prisma.serviceSimplified.findMany({ where: { id: { in: top.map((row) => row.serviceId) } }, select: { id: true, name: true } })
    : [];
  const nameOf = new Map(services.map((item) => [item.id, item.name]));

  return {
    mes: { inicio: monthStart, recebidos: recebidosMes, resolvidos: resolvidosMes },
    tempoMedioDias: averageResponseDays(concluded),
    satisfacao: rating._avg.rating === null ? null : Math.round(rating._avg.rating * 10) / 10,
    avaliacoes: rating._count._all,
    servicosMaisPedidos: top
      .map((row) => ({ nome: nameOf.get(row.serviceId) || '', pedidos: (row._count as { _all: number })._all }))
      .filter((row) => row.nome),
    geradoEm: now,
  };
}

/** Lê a opção do município. */
export async function getCityNumbersSetting(tenantId: string): Promise<boolean> {
  const tenant = await runAsPlatform(async () => prisma.tenant.findUnique({ where: { id: tenantId }, select: { branding: true } }));
  return isCityNumbersEnabled(tenant?.branding);
}

/** Liga/desliga, preservando o resto do branding (logo, cores...). */
export async function setCityNumbersSetting(tenantId: string, enabled: boolean): Promise<boolean> {
  const tenant = await runAsPlatform(async () => prisma.tenant.findUnique({ where: { id: tenantId }, select: { branding: true } }));
  if (!tenant) throw new Error('Município não encontrado');
  const { updateTenant } = await import('../tenant-provisioning.service');
  const branding = { ...((tenant.branding as Record<string, unknown> | null) || {}), [CITY_NUMBERS_KEY]: enabled };
  await updateTenant(tenantId, { branding }); // invalida o cache do TenantService
  return enabled;
}
