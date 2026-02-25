import { prisma } from '../models/prisma';
import { SearchResponse } from './search.service';
import { SearchFilters, SearchPeriod } from '../search_index/opensearch.queries';
import { config } from '../config/config';

export async function recordSearchAudit(
  searchResult: SearchResponse,
  req: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    isBatchSearch?: boolean;
    reportGenerated?: boolean;
    filters?: SearchFilters;
    period?: SearchPeriod;
  },
) {
  const period = req.period;
  return prisma.searchAudit.create({
    data: {
      userId: req.userId ?? null,
      query: searchResult.query,
      filters: (req.filters as Record<string, unknown> | undefined) ?? null,
      periodFrom: period?.from ? new Date(period.from) : null,
      periodTo: period?.to ? new Date(period.to) : null,
      resultsCount: searchResult.total,
      excludedCount: searchResult.statistics?.excludedCount ?? 0,
      avgPrice: searchResult.statistics?.mean ?? null,
      medianPrice: searchResult.statistics?.median ?? null,
      minPrice: searchResult.statistics?.min ?? null,
      maxPrice: searchResult.statistics?.max ?? null,
      algorithmVersion: searchResult.explanation.algorithmVersion,
      outlierMethod: config.outlier.method,
      outlierK: config.outlier.iqrK,
      isBatchSearch: req.isBatchSearch ?? false,
      reportGenerated: req.reportGenerated ?? false,
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      durationMs: searchResult.durationMs,
    },
  });
}

export async function listAudits(params: {
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const { userId, from, to, page = 1, pageSize = 20 } = params;

  const where = {
    ...(userId ? { userId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.searchAudit.count({ where }),
    prisma.searchAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        userId: true,
        query: true,
        filters: true,
        periodFrom: true,
        periodTo: true,
        resultsCount: true,
        excludedCount: true,
        avgPrice: true,
        medianPrice: true,
        minPrice: true,
        maxPrice: true,
        isBatchSearch: true,
        reportGenerated: true,
        durationMs: true,
        createdAt: true,
      },
    }),
  ]);

  return { total, page, pageSize, items };
}
