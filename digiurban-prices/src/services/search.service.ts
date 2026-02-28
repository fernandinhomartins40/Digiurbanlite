import { getOpenSearchClient } from '../search_index/opensearch.client';
import { buildSearchQuery, SearchFilters, SearchPeriod } from '../search_index/opensearch.queries';
import { calculateStatistics, StatisticsResult } from './statistics.service';
import { normalizeText } from '../ingest/normalizer';
import {
  buildQueryIntelligence,
  evidenceScore,
  lexicalIntentScore,
  semanticSimilarityScore,
  shouldKeepSearchHit,
} from './query-intelligence.service';
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

type RankedSearchItem = SearchItem & { keep: boolean };

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
    normalizedDescription: hit._source.normalized_description || normalizeText(hit._source.description),
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
  const rankedItems: RankedSearchItem[] = candidateItems
    .map((item) => {
      const normalizedDescription = item.normalizedDescription || normalizeText(item.description);
      const osScoreNormalized = (item.score || 0) / maxOsScore;
      const semanticScore = semanticSimilarityScore(queryIntelligence.expandedTokens, normalizedDescription);
      const lexicalScore = lexicalIntentScore(queryIntelligence, normalizedDescription);
      const keep = shouldKeepSearchHit(queryIntelligence, normalizedDescription, lexicalScore, semanticScore);
      const evidence = evidenceScore({
        source: item.source,
        confidenceScore: item.confidenceScore,
        contractDate: item.contractDate,
        hasSupplier: Boolean(item.supplierName || item.supplierCnpj),
        hasCatmat: Boolean(item.catmatCode),
      });
      const confidence = item.confidenceScore ?? 0.5;
      const rankingScore = (
        (osScoreNormalized * 0.32) +
        (lexicalScore * 0.28) +
        (semanticScore * 0.2) +
        (evidence * 0.15) +
        (confidence * 0.05)
      );

      return {
        ...item,
        normalizedDescription,
        keep,
        score: Math.round(rankingScore * 10_000) / 10_000,
      };
    })
    .sort((a, b) => b.score - a.score);

  const filteredItems = rankedItems.filter((item) => item.keep);
  const relevantItems = filteredItems.length > 0
    ? filteredItems
    : rankedItems.filter((item) => item.score >= 0.3);

  const dedupedItems = dedupeBySimilarity(relevantItems);
  const items = dedupedItems.slice(0, pageSize);

  const prices = dedupedItems
    .map((item) => item.unitPrice)
    .filter((value): value is number => value !== null && value > 0);

  const statistics = calculateStatistics({ values: prices });
  const aggregations = buildAggregations(dedupedItems);

  const filtersApplied: string[] = [];
  if (filters.uf) filtersApplied.push(`UF: ${filters.uf}`);
  if (filters.source) filtersApplied.push(`Fonte: ${filters.source}`);
  if (filters.unit) filtersApplied.push(`Unidade: ${filters.unit}`);
  if (filters.catmatCode) filtersApplied.push(`CATMAT: ${filters.catmatCode}`);
  if (filters.modality) filtersApplied.push(`Modalidade: ${filters.modality}`);
  if (filters.minPrice) filtersApplied.push(`Preco minimo: R$ ${filters.minPrice}`);
  if (filters.maxPrice) filtersApplied.push(`Preco maximo: R$ ${filters.maxPrice}`);
  if (filters.minConfidence) filtersApplied.push(`Confiabilidade >= ${Math.round(filters.minConfidence * 100)}%`);
  if (relevantItems.length < candidateItems.length) filtersApplied.push('Relevancia: matches incidentais removidos');

  const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const periodFrom = period?.from ?? twoYearsAgo;
  const periodTo = period?.to ?? new Date().toISOString().split('T')[0];
  const totalHits = hits?.total?.value ?? 0;
  const totalRelevant = estimateRelevantTotal(totalHits, candidateItems.length, dedupedItems.length);

  return {
    query,
    normalizedQuery,
    total: totalRelevant,
    page,
    pageSize,
    items,
    statistics,
    aggregations,
    explanation: {
      methodology: statistics?.methodology ?? 'Sem dados suficientes para analise estatistica.',
      filters: filtersApplied,
      period: { from: periodFrom, to: periodTo },
      algorithmVersion: '2.2-hybrid-lexical',
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

  for (const result of results) {
    const minVal = result.results.statistics?.min;
    const maxVal = result.results.statistics?.max;
    if (typeof minVal === 'number') totalsMin.push(minVal);
    if (typeof maxVal === 'number') totalsMax.push(maxVal);
    if (result.estimatedTotal !== null) totalsMedian.push(result.estimatedTotal);
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
      algorithmVersion: '2.2-hybrid-lexical',
    },
    durationMs,
  };
}

function dedupeBySimilarity<T extends SearchItem>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

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

function estimateRelevantTotal(totalHits: number, candidateCount: number, relevantCount: number): number {
  if (totalHits <= candidateCount) return relevantCount;
  if (candidateCount === 0) return 0;

  const relevantRatio = relevantCount / candidateCount;
  const estimated = Math.round(totalHits * relevantRatio);
  return Math.max(relevantCount, Math.min(totalHits, estimated));
}

function buildAggregations(items: SearchItem[]): SearchResponse['aggregations'] {
  const byUf = buildBucketCounts(items.map((item) => item.uf));
  const byUnit = buildBucketCounts(items.map((item) => item.unit));
  const bySource = buildBucketCounts(items.map((item) => item.source));
  const byModality = buildBucketCounts(items.map((item) => item.modality));

  const supplierMap = new Map<string, { name: string; count: number; prices: number[]; lastSeen: string | null }>();
  const overTimeMap = new Map<string, { prices: number[]; count: number }>();
  const confidences: number[] = [];

  for (const item of items) {
    if (item.confidenceScore !== null) confidences.push(item.confidenceScore);

    if (item.supplierName) {
      const key = `${item.supplierCnpj ?? 'na'}|${item.supplierName}`;
      const current = supplierMap.get(key) ?? {
        name: item.supplierName,
        count: 0,
        prices: [],
        lastSeen: null,
      };

      current.count += 1;
      if (typeof item.unitPrice === 'number' && item.unitPrice > 0) current.prices.push(item.unitPrice);
      if (item.contractDate && (!current.lastSeen || item.contractDate > current.lastSeen)) {
        current.lastSeen = item.contractDate;
      }
      supplierMap.set(key, current);
    }

    if (item.contractDate) {
      const month = item.contractDate.slice(0, 7);
      const current = overTimeMap.get(month) ?? { prices: [], count: 0 };
      current.count += 1;
      if (typeof item.unitPrice === 'number' && item.unitPrice > 0) current.prices.push(item.unitPrice);
      overTimeMap.set(month, current);
    }
  }

  const bySupplier = Array.from(supplierMap.values())
    .map((supplier) => ({
      name: supplier.name,
      count: supplier.count,
      avgPrice: supplier.prices.length > 0 ? round2(supplier.prices.reduce((sum, price) => sum + price, 0) / supplier.prices.length) : null,
      minPrice: supplier.prices.length > 0 ? Math.min(...supplier.prices) : null,
      maxPrice: supplier.prices.length > 0 ? Math.max(...supplier.prices) : null,
      lastSeen: supplier.lastSeen,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 20);

  const overTime = Array.from(overTimeMap.entries())
    .map(([date, entry]) => ({
      date,
      avgPrice: entry.prices.length > 0 ? round2(entry.prices.reduce((sum, price) => sum + price, 0) / entry.prices.length) : null,
      minPrice: entry.prices.length > 0 ? Math.min(...entry.prices) : null,
      maxPrice: entry.prices.length > 0 ? Math.max(...entry.prices) : null,
      count: entry.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    byUf,
    byUnit,
    bySource,
    byModality,
    bySupplier,
    overTime,
    avgConfidence: confidences.length > 0
      ? round2((confidences.reduce((sum, value) => sum + value, 0) / confidences.length) * 100) / 100
      : null,
  };
}

function buildBucketCounts(values: Array<string | null>): Array<{ key: string; count: number }> {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
