import { prisma } from '../models/prisma';

export interface CoverageBySource {
  source: string;
  count: number;
  withSupplier: number;
  withCatmat: number;
  lastContractDate: string | null;
  freshnessDays: number | null;
}

export interface CoverageGovernance {
  complianceScore: number;
  status: 'ok' | 'attention' | 'critical';
  legalReferences: string[];
  quality: {
    supplierCoveragePct: number;
    catalogCoveragePct: number;
    inferredCoveragePct: number;
    technicalCoveragePct: number;
  };
  ingest: {
    lastRunAt: string | null;
    lastRunStatus: string | null;
    runs24h: number;
    runs7d: number;
    failedRuns7d: number;
  };
  riskFlags: string[];
}

export interface CoverageOverview {
  generatedAt: string;
  totals: {
    lineItems: number;
    organizations: number;
    suppliers: number;
    withSupplier: number;
    withCatmat: number;
    inferredFromObject: number;
    technicalItems: number;
  };
  bySource: CoverageBySource[];
  byUf: Array<{ uf: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
  governance: CoverageGovernance;
}

const KNOWN_SOURCES = ['pncp', 'comprasnet', 'transparencia', 'bps', 'fnde'];

export async function getCoverageOverview(): Promise<CoverageOverview> {
  const now = new Date();
  const nowMs = now.getTime();
  const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(nowMs - 24 * 60 * 60 * 1000);

  const [
    totalItems,
    totalOrganizations,
    totalSuppliers,
    withSupplier,
    withCatmat,
    inferredFromObject,
    technicalItems,
    sourceStats,
    sourceWithSupplierRaw,
    sourceWithCatalogRaw,
    byUfRaw,
    byMonthRaw,
    lastRun,
    runs24h,
    runs7d,
    failedRuns7d,
  ] = await Promise.all([
    prisma.lineItem.count(),
    prisma.organization.count(),
    prisma.supplier.count(),
    prisma.lineItem.count({
      where: {
        OR: [{ supplierName: { not: null } }, { supplierCnpj: { not: null } }, { supplierId: { not: null } }],
      },
    }),
    prisma.lineItem.count({
      where: {
        OR: [{ catmatCode: { not: null } }, { catmatDescription: { not: null } }, { catserCode: { not: null } }],
      },
    }),
    prisma.lineItem.count({
      where: {
        OR: [
          { inferredFromObject: true },
          { sourceId: { contains: '_inferred_' } },
        ],
      },
    }),
    prisma.lineItem.count({
      where: {
        OR: [
          { normalizedDescription: { contains: 'i3', mode: 'insensitive' } },
          { normalizedDescription: { contains: 'i5', mode: 'insensitive' } },
          { normalizedDescription: { contains: 'i7', mode: 'insensitive' } },
          { normalizedDescription: { contains: 'i9', mode: 'insensitive' } },
          { normalizedDescription: { contains: 'ryzen', mode: 'insensitive' } },
          { normalizedDescription: { contains: 'ssd', mode: 'insensitive' } },
          { normalizedDescription: { contains: 'notebook', mode: 'insensitive' } },
          { normalizedDescription: { contains: 'computador', mode: 'insensitive' } },
        ],
      },
    }),
    prisma.lineItem.groupBy({
      by: ['source'],
      _count: { _all: true },
      _max: { contractDate: true },
    }),
    prisma.lineItem.groupBy({
      by: ['source'],
      where: {
        OR: [{ supplierName: { not: null } }, { supplierCnpj: { not: null } }, { supplierId: { not: null } }],
      },
      _count: { _all: true },
    }),
    prisma.lineItem.groupBy({
      by: ['source'],
      where: {
        OR: [{ catmatCode: { not: null } }, { catmatDescription: { not: null } }, { catserCode: { not: null } }],
      },
      _count: { _all: true },
    }),
    prisma.lineItem.groupBy({
      by: ['uf'],
      where: { uf: { not: null } },
      _count: { _all: true },
    }),
    prisma.lineItem.groupBy({
      by: ['yearMonth'],
      where: { yearMonth: { not: null } },
      _count: { _all: true },
    }),
    prisma.ingestRun.findFirst({
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true, status: true },
    }),
    prisma.ingestRun.count({
      where: { startedAt: { gte: oneDayAgo } },
    }),
    prisma.ingestRun.count({
      where: { startedAt: { gte: sevenDaysAgo } },
    }),
    prisma.ingestRun.count({
      where: { startedAt: { gte: sevenDaysAgo }, status: 'failed' },
    }),
  ]);

  const sourceMap = new Map(sourceStats.map((s) => [s.source, s]));
  const sourceWithSupplierMap = new Map(sourceWithSupplierRaw.map((s) => [s.source, s._count._all]));
  const sourceWithCatalogMap = new Map(sourceWithCatalogRaw.map((s) => [s.source, s._count._all]));

  const sourceOrder = [
    ...KNOWN_SOURCES,
    ...Array.from(sourceMap.keys()).filter((src) => !KNOWN_SOURCES.includes(src)),
  ];

  const bySource: CoverageBySource[] = sourceOrder.map((source) => {
    const stat = sourceMap.get(source);
    const lastDate = stat?._max?.contractDate ?? null;
    const freshnessDays = lastDate
      ? Math.max(0, Math.floor((nowMs - lastDate.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      source,
      count: stat?._count?._all ?? 0,
      withSupplier: sourceWithSupplierMap.get(source) ?? 0,
      withCatmat: sourceWithCatalogMap.get(source) ?? 0,
      lastContractDate: lastDate?.toISOString() ?? null,
      freshnessDays,
    };
  });

  const byUf = byUfRaw
    .filter((row) => row.uf)
    .map((row) => ({ uf: row.uf as string, count: row._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 27);

  const byMonth = byMonthRaw
    .filter((row) => row.yearMonth)
    .map((row) => ({ month: row.yearMonth as string, count: row._count._all }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-24);

  const supplierCoveragePct = percentage(withSupplier, totalItems);
  const catalogCoveragePct = percentage(withCatmat, totalItems);
  const inferredCoveragePct = percentage(inferredFromObject, totalItems);
  const technicalCoveragePct = percentage(technicalItems, totalItems);

  const activeSources = bySource.filter((s) => s.count > 0);
  const freshSources = activeSources.filter((s) => (s.freshnessDays ?? Infinity) <= 365);

  const sourceCoverageScore = Math.min(1, activeSources.length / 4);
  const freshnessScore = activeSources.length > 0 ? freshSources.length / activeSources.length : 0;
  const ingestSuccessScore = runs7d > 0 ? (runs7d - failedRuns7d) / runs7d : 0.8;

  const complianceScore = Math.round(
    sourceCoverageScore * 30 +
    (supplierCoveragePct / 100) * 20 +
    (catalogCoveragePct / 100) * 25 +
    freshnessScore * 15 +
    ingestSuccessScore * 10,
  );

  const riskFlags: string[] = [];
  if (activeSources.length < 3) riskFlags.push('Menos de 3 fontes ativas de contratos.');
  if (catalogCoveragePct < 35) riskFlags.push('Cobertura CATMAT/CATSER abaixo de 35%.');
  if (supplierCoveragePct < 45) riskFlags.push('Cobertura de fornecedores abaixo de 45%.');
  if (failedRuns7d > 0) riskFlags.push(`Foram detectadas ${failedRuns7d} falhas de ingestão nos últimos 7 dias.`);
  if (activeSources.some((s) => (s.freshnessDays ?? Infinity) > 365)) {
    riskFlags.push('Há fontes sem atualização recente (mais de 365 dias).');
  }

  const governance: CoverageGovernance = {
    complianceScore,
    status: complianceScore >= 75 ? 'ok' : complianceScore >= 50 ? 'attention' : 'critical',
    legalReferences: [
      'Lei 14.133/2021 (pesquisa de preços e vantajosidade).',
      'IN SEGES/ME 65/2021 (parâmetros de estimativa de preços).',
      'Preferência por múltiplas fontes, dados recentes e trilha de auditoria.',
    ],
    quality: {
      supplierCoveragePct,
      catalogCoveragePct,
      inferredCoveragePct,
      technicalCoveragePct,
    },
    ingest: {
      lastRunAt: lastRun?.startedAt?.toISOString() ?? null,
      lastRunStatus: lastRun?.status ?? null,
      runs24h,
      runs7d,
      failedRuns7d,
    },
    riskFlags,
  };

  return {
    generatedAt: now.toISOString(),
    totals: {
      lineItems: totalItems,
      organizations: totalOrganizations,
      suppliers: totalSuppliers,
      withSupplier,
      withCatmat,
      inferredFromObject,
      technicalItems,
    },
    bySource,
    byUf,
    byMonth,
    governance,
  };
}

function percentage(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 10_000) / 100;
}
