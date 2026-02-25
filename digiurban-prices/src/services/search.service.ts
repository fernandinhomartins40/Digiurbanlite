import { getOpenSearchClient } from '../search_index/opensearch.client';
import { buildSearchQuery, SearchFilters, SearchPeriod } from '../search_index/opensearch.queries';
import { calculateStatistics, StatisticsResult } from './statistics.service';
import { normalizeText } from '../ingest/normalizer';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export interface SearchItem {
  id: string;
  description: string;
  normalizedDescription: string;
  unit: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  quantity: number | null;
  contractDate: string | null;
  uf: string | null;
  city: string | null;
  organizationName: string | null;
  modality: string | null;
  score: number;
}

export interface SearchResponse {
  query: string;
  normalizedQuery: string;
  total: number;
  page: number;
  pageSize: number;
  items: SearchItem[];
  statistics: StatisticsResult | null;
  aggregations: {
    byUf: { key: string; count: number }[];
    byUnit: { key: string; count: number }[];
    overTime: { date: string; avgPrice: number | null; count: number }[];
  };
  explanation: {
    methodology: string;
    filters: string[];
    period: { from: string; to: string };
    algorithmVersion: string;
  };
  durationMs: number;
}

export interface BatchSearchItem {
  item: string;
  quantity?: number;
  unit?: string;
}

export interface BatchSearchResponse {
  items: {
    inputItem: string;
    results: SearchResponse;
    estimatedTotal: number | null;
  }[];
  grandTotalMin: number | null;
  grandTotalMax: number | null;
  grandTotalMedian: number | null;
}

export async function searchPrices(
  query: string,
  filters: SearchFilters = {},
  period?: SearchPeriod,
  page = 1,
  pageSize = 20,
): Promise<SearchResponse> {
  const startMs = Date.now();
  const normalizedQuery = normalizeText(query);

  const searchParams = buildSearchQuery({
    query: normalizedQuery || query,
    filters,
    period,
    page,
    pageSize,
  });

  let osResponse: Record<string, unknown>;

  try {
    const client = getOpenSearchClient();
    const response = await client.search(searchParams as Parameters<typeof client.search>[0]);
    osResponse = response.body as Record<string, unknown>;
  } catch (err) {
    logger.error('[Search] OpenSearch error', { error: (err as Error).message, query });
    // Fallback: retornar resposta vazia
    return buildEmptyResponse(query, normalizedQuery, page, pageSize, Date.now() - startMs);
  }

  const hits = (osResponse as { hits?: { hits?: unknown[]; total?: { value?: number } } }).hits;
  const rawItems = (hits?.hits ?? []) as Array<{
    _id: string;
    _score: number;
    _source: {
      description: string;
      normalized_description: string;
      unit: string | null;
      unit_price: number | null;
      total_price: number | null;
      quantity: number | null;
      contract_date: string | null;
      uf: string | null;
      city: string | null;
      organization_name: string | null;
      modality: string | null;
    };
  }>;

  const items: SearchItem[] = rawItems.map((hit) => ({
    id: hit._id,
    description: hit._source.description,
    normalizedDescription: hit._source.normalized_description,
    unit: hit._source.unit,
    unitPrice: hit._source.unit_price,
    totalPrice: hit._source.total_price,
    quantity: hit._source.quantity,
    contractDate: hit._source.contract_date,
    uf: hit._source.uf,
    city: hit._source.city,
    organizationName: hit._source.organization_name,
    modality: hit._source.modality,
    score: hit._score,
  }));

  // Extrair valores para estatísticas
  const prices = items
    .map((i) => i.unitPrice)
    .filter((v): v is number => v !== null && v > 0);

  const statistics = calculateStatistics({ values: prices });

  // Agregações
  const aggs = (osResponse as { aggregations?: Record<string, unknown> }).aggregations ?? {};

  const byUfBuckets = ((aggs.by_uf as { buckets?: { key: string; doc_count: number }[] })?.buckets ?? []);
  const byUnitBuckets = ((aggs.by_unit as { buckets?: { key: string; doc_count: number }[] })?.buckets ?? []);
  const overTimeBuckets = ((aggs.over_time as { buckets?: { key_as_string: string; doc_count: number; avg_price: { value: number | null } }[] })?.buckets ?? []);

  // Construir explicação
  const filtersApplied: string[] = [];
  if (filters.uf) filtersApplied.push(`UF: ${filters.uf}`);
  if (filters.unit) filtersApplied.push(`Unidade: ${filters.unit}`);
  if (filters.minPrice) filtersApplied.push(`Preço mínimo: R$ ${filters.minPrice}`);
  if (filters.maxPrice) filtersApplied.push(`Preço máximo: R$ ${filters.maxPrice}`);

  const periodFrom = period?.from ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const periodTo = period?.to ?? new Date().toISOString().split('T')[0];

  return {
    query,
    normalizedQuery,
    total: hits?.total?.value ?? 0,
    page,
    pageSize,
    items,
    statistics,
    aggregations: {
      byUf: byUfBuckets.map((b) => ({ key: b.key, count: b.doc_count })),
      byUnit: byUnitBuckets.map((b) => ({ key: b.key, count: b.doc_count })),
      overTime: overTimeBuckets.map((b) => ({
        date: b.key_as_string,
        avgPrice: b.avg_price?.value ?? null,
        count: b.doc_count,
      })),
    },
    explanation: {
      methodology: statistics?.methodology ?? 'Sem dados suficientes para análise estatística.',
      filters: filtersApplied,
      period: { from: periodFrom, to: periodTo },
      algorithmVersion: '1.0',
    },
    durationMs: Date.now() - startMs,
  };
}

export async function batchSearchPrices(
  items: BatchSearchItem[],
  filters: SearchFilters = {},
  period?: SearchPeriod,
): Promise<BatchSearchResponse> {
  const results = await Promise.all(
    items.map(async (item) => {
      const searchResult = await searchPrices(item.item, filters, period, 1, 30);
      const qty = item.quantity ?? 1;
      const estimatedTotal = searchResult.statistics?.median
        ? round2(searchResult.statistics.median * qty)
        : null;

      return {
        inputItem: item.item,
        results: searchResult,
        estimatedTotal,
      };
    }),
  );

  const totalsMin = results
    .map((r) => r.results.statistics?.min)
    .filter((v): v is number => v !== null);
  const totalsMax = results
    .map((r) => r.results.statistics?.max)
    .filter((v): v is number => v !== null);
  const totalsMedian = results
    .map((r) => r.estimatedTotal)
    .filter((v): v is number => v !== null);

  return {
    items: results,
    grandTotalMin: totalsMin.length > 0 ? round2(totalsMin.reduce((a, b) => a + b, 0)) : null,
    grandTotalMax: totalsMax.length > 0 ? round2(totalsMax.reduce((a, b) => a + b, 0)) : null,
    grandTotalMedian: totalsMedian.length > 0 ? round2(totalsMedian.reduce((a, b) => a + b, 0)) : null,
  };
}

function buildEmptyResponse(
  query: string,
  normalizedQuery: string,
  page: number,
  pageSize: number,
  durationMs: number,
): SearchResponse {
  return {
    query,
    normalizedQuery,
    total: 0,
    page,
    pageSize,
    items: [],
    statistics: null,
    aggregations: { byUf: [], byUnit: [], overTime: [] },
    explanation: {
      methodology: 'Sem resultados encontrados.',
      filters: [],
      period: {
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
      algorithmVersion: '1.0',
    },
    durationMs,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
