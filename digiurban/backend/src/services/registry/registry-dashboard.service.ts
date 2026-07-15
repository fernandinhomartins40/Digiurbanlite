/**
 * ============================================================================
 * REGISTRY F4 — Gerador de dashboard automático (dirigido por metadados)
 * ============================================================================
 * Substitui o switch(moduleType) de analyzeCustomData por agregação genérica a
 * partir dos FieldDefinition:
 *   - KPIs         ← campos isMetric (SUM/AVG/MIN/MAX/COUNT sobre record_indexes)
 *   - Charts       ← campos facetable (distribuição / group-by)
 *   - Trends       ← série temporal por createdAt do EntityRecord
 *
 * Produz o MESMO formato consumido hoje pelo frontend:
 *   { kpis: [{label,value,format,icon,color}],
 *     charts: [{type:'pie'|'bar', title, data:[{name,value}]}],
 *     trends: [{name, value}] }
 *
 * Agrega sobre record_indexes (índice B-tree, projeção da F3), sem carregar os
 * registros em memória. Escopado por tenant pela extension.
 * Ver PLANO-IMPLEMENTACAO-REGISTRY.md (F4) e AUDITORIA (§21).
 * ============================================================================
 */

import { prisma } from '../../lib/prisma';
import { indexColumnFor, type RegistryDataType } from './registry.types';

export interface DashboardKpi {
  label: string;
  value: number;
  format: string;
  icon?: string;
  color?: string;
}
export interface DashboardChart {
  type: 'pie' | 'bar';
  title: string;
  data: Array<{ name: string; value: number }>;
}
export interface DashboardTrendPoint {
  name: string; // AAAA-MM
  value: number;
}
export interface RegistryDashboard {
  kpis: DashboardKpi[];
  charts: DashboardChart[];
  trends: DashboardTrendPoint[];
}

const AGG_ICON: Record<string, string> = {
  SUM: 'Sigma',
  AVG: 'TrendingUp',
  MIN: 'ArrowDownRight',
  MAX: 'ArrowUpRight',
  COUNT: 'Hash',
};

interface Options {
  dateFrom?: Date;
  dateTo?: Date;
  maxFacet?: number; // limite de fatias por chart
}

/**
 * Gera o dashboard de um EntityType (por code). Se o tipo não existir, retorna
 * um dashboard vazio (paridade com o `default` do switch atual).
 */
export async function generateDashboard(
  entityTypeCode: string,
  opts: Options = {}
): Promise<RegistryDashboard> {
  const empty: RegistryDashboard = { kpis: [], charts: [], trends: [] };

  const entityType = await prisma.entityType.findFirst({
    where: { code: entityTypeCode },
    include: { fields: true },
  });
  if (!entityType) return empty;

  const recordWhere = {
    entityTypeId: entityType.id,
    ...(opts.dateFrom || opts.dateTo
      ? { createdAt: { ...(opts.dateFrom ? { gte: opts.dateFrom } : {}), ...(opts.dateTo ? { lte: opts.dateTo } : {}) } }
      : {}),
  };

  // Filtro dos índices restrito aos records do tipo (e período).
  const indexRecordFilter = { record: { is: recordWhere } };

  const kpis: DashboardKpi[] = [];
  const charts: DashboardChart[] = [];

  const metricFields = entityType.fields.filter((f) => f.isMetric && f.indexable);
  const facetFields = entityType.fields.filter((f) => f.facetable && f.indexable);

  // ── KPIs (métricas) ────────────────────────────────────────────────────
  for (const f of metricFields) {
    const col = indexColumnFor(f.dataType as RegistryDataType);
    if (col !== 'valueNumber') continue; // métricas são numéricas
    const agg = (f.aggregation || 'SUM').toUpperCase();

    // Prisma rejeita chaves de agregação com valor undefined — montar só a
    // chave necessária.
    const aggArgs: Record<string, unknown> = { where: { fieldKey: f.key, ...indexRecordFilter } };
    switch (agg) {
      case 'AVG': aggArgs._avg = { valueNumber: true }; break;
      case 'MIN': aggArgs._min = { valueNumber: true }; break;
      case 'MAX': aggArgs._max = { valueNumber: true }; break;
      case 'COUNT': aggArgs._count = { _all: true }; break;
      default: aggArgs._sum = { valueNumber: true };
    }
    const grouped = (await prisma.recordIndex.aggregate(aggArgs as never)) as {
      _sum?: { valueNumber: number | null };
      _avg?: { valueNumber: number | null };
      _min?: { valueNumber: number | null };
      _max?: { valueNumber: number | null };
      _count?: { _all: number };
    };

    let value = 0;
    switch (agg) {
      case 'AVG': value = Math.round((grouped._avg?.valueNumber ?? 0) * 100) / 100; break;
      case 'MIN': value = grouped._min?.valueNumber ?? 0; break;
      case 'MAX': value = grouped._max?.valueNumber ?? 0; break;
      case 'COUNT': value = grouped._count?._all ?? 0; break;
      default: value = grouped._sum?.valueNumber ?? 0;
    }

    kpis.push({
      label: `${f.label}${agg === 'AVG' ? ' (média)' : agg === 'SUM' ? ' (total)' : ''}`,
      value,
      format: 'number',
      icon: AGG_ICON[agg] ?? 'BarChart',
      color: 'green',
    });
  }

  // ── Charts (distribuições por facet) ───────────────────────────────────
  const maxFacet = opts.maxFacet ?? 10;
  for (const f of facetFields) {
    const grouped = await prisma.recordIndex.groupBy({
      by: ['valueText'],
      where: { fieldKey: f.key, ...indexRecordFilter },
      _count: { _all: true },
      orderBy: { _count: { valueText: 'desc' } },
      take: maxFacet,
    });
    const data = grouped
      .filter((g) => g.valueText !== null && g.valueText !== '')
      .map((g) => ({ name: g.valueText as string, value: g._count._all }));
    if (data.length === 0) continue;
    charts.push({
      // Poucas categorias → pizza; muitas → barra (heurística de legibilidade)
      type: data.length <= 6 ? 'pie' : 'bar',
      title: `Distribuição por ${f.label}`,
      data,
    });
  }

  // ── Trends (novos registros por mês) ───────────────────────────────────
  const trends = await buildTrends(recordWhere);

  return { kpis, charts, trends };
}

/** Série temporal: contagem de EntityRecords por mês (AAAA-MM). */
async function buildTrends(recordWhere: Record<string, unknown>): Promise<DashboardTrendPoint[]> {
  const records = await prisma.entityRecord.findMany({
    where: recordWhere,
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const byMonth = new Map<string, number>();
  for (const r of records) {
    const d = r.createdAt;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  return Array.from(byMonth.entries()).map(([name, value]) => ({ name, value }));
}

/** Flag REGISTRY_DASHBOARD (off|on) — controla se o dashboard vem do Registry. */
export function isRegistryDashboardOn(): boolean {
  return String(process.env.REGISTRY_DASHBOARD ?? 'off').trim().toLowerCase() === 'on';
}
