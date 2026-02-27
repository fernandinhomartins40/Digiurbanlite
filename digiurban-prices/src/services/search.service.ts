import { getOpenSearchClient } from '../search_index/opensearch.client';
import { buildSearchQuery, SearchFilters, SearchPeriod } from '../search_index/opensearch.queries';
import { calculateStatistics, StatisticsResult } from './statistics.service';
import { normalizeText } from '../ingest/normalizer';
import { buildQueryIntelligence, evidenceScore, semanticSimilarityScore } from './query-intelligence.service';
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
  source: string | null;
  supplierName: string | null;
  supplierCnpj: string | null;
  catmatCode: string | null;
  confidenceScore: number | null;
  score: number;
}

export interface SupplierAgg {
  name: string;
  count: number;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  lastSeen: string | null;
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
    bySource: { key: string; count: number }[];
    byModality: { key: string; count: number }[];
    bySupplier: SupplierAgg[];
    overTime: { date: string; avgPrice: number | null; minPrice: number | null; maxPrice: number | null; count: number }[];
    avgConfidence: number | null;
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
  const queryIntelligence = buildQueryIntelligence(query);
  const candidatePageSize = Math.min(200, Math.max(pageSize, pageSize * 4));

  const searchParams = buildSearchQuery({
    query: queryIntelligence.normalized || normalizedQuery || query,
    expandedQuery: queryIntelligence.expandedQuery,
    filters,
    period,
    page,
    pageSize: candidatePageSize,
    preferTechnicalTerms: queryIntelligence.technicalTerms,
  });

  let osResponse: Record<string, unknown>;

  try {
    const client = getOpenSearchClient();
    const response = await client.search(searchParams as Parameters<typeof client.search>[0]);
    osResponse = response.body as Record<string, unknown>;
  } catch (err) {
    logger.error('[Search] OpenSearch error', { error: (err as Error).message, query });
    return buildEmptyResponse(query, normalizedQuery, page, pageSize, Date.now() - startMs);
  }

  let hits = (osResponse as { hits?: { hits?: unknown[]; total?: { value?: number } } }).hits;
  let rawItems = (hits?.hits ?? []) as Array<{
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
      source: string | null;
      supplier_name: string | null;
      supplier_cnpj: string | null;
      catmat_code: string | null;
      confidence_score: number | null;
    };
  }>;

  // Fallback de recall: relaxa o matching quando não há resultados na busca principal.
  if (rawItems.length === 0 && queryIntelligence.expandedQuery.trim().length > 2) {
    try {
      const client = getOpenSearchClient();
      const relaxedSearchParams = buildSearchQuery({
        query: queryIntelligence.normalized || query,
        expandedQuery: queryIntelligence.expandedQuery,
        filters,
        period,
        page,
        pageSize: candidatePageSize,
        relaxMatching: true,
        preferTechnicalTerms: queryIntelligence.technicalTerms,
      });
      const fallbackRes = await client.search(relaxedSearchParams as Parameters<typeof client.search>[0]);
      osResponse = fallbackRes.body as Record<string, unknown>;
      hits = (osResponse as { hits?: { hits?: unknown[]; total?: { value?: number } } }).hits;
      rawItems = (hits?.hits ?? []) as typeof rawItems;
    } catch (err) {
      logger.warn('[Search] Relaxed fallback failed', { error: (err as Error).message, query });
    }
  }

  const candidateItems: SearchItem[] = rawItems.map((hit) => ({
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
    source: hit._source.source,
    supplierName: hit._source.supplier_name,
    supplierCnpj: hit._source.supplier_cnpj,
    catmatCode: hit._source.catmat_code,
    confidenceScore: hit._source.confidence_score,
    score: hit._score,
  }));

  const maxOsScore = candidateItems.reduce((acc, item) => Math.max(acc, item.score || 0), 0) || 1;
  const scoredItems = candidateItems
    .map((item) => {
      const osScoreNormalized = (item.score || 0) / maxOsScore;
      const semanticScore = semanticSimilarityScore(queryIntelligence.expandedTokens, item.normalizedDescription || item.description);
      const evidence = evidenceScore({
        source: item.source,
        confidenceScore: item.confidenceScore,
        contractDate: item.contractDate,
        hasSupplier: Boolean(item.supplierName || item.supplierCnpj),
        hasCatmat: Boolean(item.catmatCode),
      });
      const confidence = item.confidenceScore ?? 0.5;
      const rankingScore = (
        osScoreNormalized * 0.45 +
        semanticScore * 0.25 +
        evidence * 0.2 +
        confidence * 0.1
      );
      return {
        ...item,
        score: Math.round(rankingScore * 10_000) / 10_000,
      };
    })
    .sort((a, b) => b.score - a.score);

  const dedupedItems = dedupeBySimilarity(scoredItems);
  const items = dedupedItems.slice(0, pageSize);

  // Estatísticas com remoção de outliers
  const prices = items
    .map((i) => i.unitPrice)
    .filter((v): v is number => v !== null && v > 0);

  const statistics = calculateStatistics({ values: prices });

  // Agregações
  const aggs = (osResponse as { aggregations?: Record<string, unknown> }).aggregations ?? {};

  const byUfBuckets = ((aggs.by_uf as { buckets?: { key: string; doc_count: number }[] })?.buckets ?? []);
  const byUnitBuckets = ((aggs.by_unit as { buckets?: { key: string; doc_count: number }[] })?.buckets ?? []);
  const bySourceBuckets = ((aggs.by_source as { buckets?: { key: string; doc_count: number }[] })?.buckets ?? []);
  const byModalityBuckets = ((aggs.by_modality as { buckets?: { key: string; doc_count: number }[] })?.buckets ?? []);
  const bySupplierBuckets = ((aggs.by_supplier as {
    buckets?: {
      key: string;
      doc_count: number;
      avg_price?: { value: number | null };
      min_price?: { value: number | null };
      max_price?: { value: number | null };
      last_seen?: { value_as_string?: string };
    }[];
  })?.buckets ?? []);
  const overTimeBuckets = ((aggs.over_time as {
    buckets?: {
      key_as_string: string;
      doc_count: number;
      avg_price?: { value: number | null };
      min_price?: { value: number | null };
      max_price?: { value: number | null };
    }[];
  })?.buckets ?? []);
  const avgConfidence = ((aggs.avg_confidence as { value?: number | null })?.value) ?? null;

  // Filtros aplicados
  const filtersApplied: string[] = [];
  if (filters.uf) filtersApplied.push(`UF: ${filters.uf}`);
  if (filters.source) filtersApplied.push(`Fonte: ${filters.source}`);
  if (filters.unit) filtersApplied.push(`Unidade: ${filters.unit}`);
  if (filters.catmatCode) filtersApplied.push(`CATMAT: ${filters.catmatCode}`);
  if (filters.modality) filtersApplied.push(`Modalidade: ${filters.modality}`);
  if (filters.minPrice) filtersApplied.push(`Preço mínimo: R$ ${filters.minPrice}`);
  if (filters.maxPrice) filtersApplied.push(`Preço máximo: R$ ${filters.maxPrice}`);
  if (filters.minConfidence) filtersApplied.push(`Confiabilidade ≥ ${Math.round(filters.minConfidence * 100)}%`);

  const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const periodFrom = period?.from ?? twoYearsAgo;
  const periodTo = period?.to ?? new Date().toISOString().split('T')[0];
  const totalHits = hits?.total?.value ?? 0;

  return {
    query,
    normalizedQuery,
    total: totalHits,
    page,
    pageSize,
    items,
    statistics,
    aggregations: {
      byUf: byUfBuckets.map((b) => ({ key: b.key, count: b.doc_count })),
      byUnit: byUnitBuckets.map((b) => ({ key: b.key, count: b.doc_count })),
      bySource: bySourceBuckets.map((b) => ({ key: b.key, count: b.doc_count })),
      byModality: byModalityBuckets.map((b) => ({ key: b.key, count: b.doc_count })),
      bySupplier: bySupplierBuckets.map((b) => ({
        name: b.key,
        count: b.doc_count,
        avgPrice: b.avg_price?.value ?? null,
        minPrice: b.min_price?.value ?? null,
        maxPrice: b.max_price?.value ?? null,
        lastSeen: b.last_seen?.value_as_string ?? null,
      })),
      overTime: overTimeBuckets.map((b) => ({
        date: b.key_as_string,
        avgPrice: b.avg_price?.value ?? null,
        minPrice: b.min_price?.value ?? null,
        maxPrice: b.max_price?.value ?? null,
        count: b.doc_count,
      })),
      avgConfidence,
    },
    explanation: {
      methodology: statistics?.methodology ?? 'Sem dados suficientes para análise estatística.',
      filters: filtersApplied,
      period: { from: periodFrom, to: periodTo },
      algorithmVersion: '2.1-hybrid',
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

  const totalsMin: number[] = [];
  const totalsMax: number[] = [];
  const totalsMedian: number[] = [];

  for (const r of results) {
    const minVal = r.results.statistics?.min;
    const maxVal = r.results.statistics?.max;
    if (typeof minVal === 'number') totalsMin.push(minVal);
    if (typeof maxVal === 'number') totalsMax.push(maxVal);
    if (r.estimatedTotal !== null) totalsMedian.push(r.estimatedTotal);
  }

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
  const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return {
    query,
    normalizedQuery,
    total: 0,
    page,
    pageSize,
    items: [],
    statistics: null,
    aggregations: {
      byUf: [],
      byUnit: [],
      bySource: [],
      byModality: [],
      bySupplier: [],
      overTime: [],
      avgConfidence: null,
    },
    explanation: {
      methodology: 'Sem resultados encontrados.',
      filters: [],
      period: { from: twoYearsAgo, to: new Date().toISOString().split('T')[0] },
      algorithmVersion: '2.1-hybrid',
    },
    durationMs,
  };
}

function dedupeBySimilarity(items: SearchItem[]): SearchItem[] {
  const seen = new Set<string>();
  const result: SearchItem[] = [];
  for (const item of items) {
    const normalized = (item.normalizedDescription || item.description || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
    const month = item.contractDate ? item.contractDate.slice(0, 7) : 'na';
    const priceBucket = item.unitPrice ? Math.round(item.unitPrice / 10) : 'na';
    const key = `${normalized}|${month}|${item.uf ?? 'na'}|${item.unit ?? 'na'}|${priceBucket}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
