import { getOpenSearchClient } from '../search_index/opensearch.client';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export interface SupplierMapEntry {
  supplierName: string;
  supplierCnpj: string | null;
  contractCount: number;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  lastSeen: string | null;
  ufs: string[];
  sources: string[];
}

export interface SupplierMapResponse {
  query: string;
  total: number;
  suppliers: SupplierMapEntry[];
  durationMs: number;
}

export async function getSupplierMap(
  query: string,
  options: {
    uf?: string;
    source?: string;
    period?: string; // "6m" | "12m" | "24m"
    limit?: number;
  } = {},
): Promise<SupplierMapResponse> {
  const startMs = Date.now();
  const { uf, source, period = '24m', limit = 20 } = options;

  const client = getOpenSearchClient();

  // Converter período
  const periodMonths = parseInt(period.replace('m', ''), 10) || 24;
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - periodMonths);

  const filters: Record<string, unknown>[] = [
    { range: { contract_date: { gte: fromDate.toISOString().split('T')[0] } } },
    { exists: { field: 'supplier_name' } },
  ];

  if (uf) filters.push({ term: { uf } });
  if (source) filters.push({ term: { source } });

  try {
    const response = await client.search({
      index: config.opensearch.indexLineItems,
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['description^3', 'normalized_description^2', 'catmat_description'],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                  minimum_should_match: '60%',
                },
              },
            ],
            filter: filters,
          },
        },
        aggs: {
          by_supplier: {
            terms: {
              field: 'supplier_name.keyword',
              size: limit,
              order: { _count: 'desc' },
            },
            aggs: {
              avg_price: { avg: { field: 'unit_price' } },
              min_price: { min: { field: 'unit_price' } },
              max_price: { max: { field: 'unit_price' } },
              last_seen: { max: { field: 'contract_date' } },
              supplier_cnpj: {
                terms: { field: 'supplier_cnpj', size: 1 },
              },
              by_uf: {
                terms: { field: 'uf', size: 10 },
              },
              by_source: {
                terms: { field: 'source', size: 10 },
              },
            },
          },
          total_suppliers: {
            cardinality: { field: 'supplier_name.keyword' },
          },
        },
      },
    });

    const body = response.body as Record<string, unknown>;
    const aggs = (body as { aggregations?: Record<string, unknown> }).aggregations ?? {};

    type SupplierBucket = {
      key: string;
      doc_count: number;
      avg_price?: { value: number | null };
      min_price?: { value: number | null };
      max_price?: { value: number | null };
      last_seen?: { value_as_string?: string };
      supplier_cnpj?: { buckets?: { key: string }[] };
      by_uf?: { buckets?: { key: string }[] };
      by_source?: { buckets?: { key: string }[] };
    };

    const supplierBuckets = ((aggs.by_supplier as { buckets?: SupplierBucket[] })?.buckets ?? []);
    const totalSuppliers = ((aggs.total_suppliers as { value?: number })?.value) ?? 0;

    const suppliers: SupplierMapEntry[] = supplierBuckets.map((b) => ({
      supplierName: b.key,
      supplierCnpj: b.supplier_cnpj?.buckets?.[0]?.key ?? null,
      contractCount: b.doc_count,
      avgPrice: b.avg_price?.value ?? null,
      minPrice: b.min_price?.value ?? null,
      maxPrice: b.max_price?.value ?? null,
      lastSeen: b.last_seen?.value_as_string ?? null,
      ufs: (b.by_uf?.buckets ?? []).map((u) => u.key),
      sources: (b.by_source?.buckets ?? []).map((s) => s.key),
    }));

    return {
      query,
      total: totalSuppliers,
      suppliers,
      durationMs: Date.now() - startMs,
    };
  } catch (err: unknown) {
    logger.error('[SupplierMap] OpenSearch error', { error: (err as Error).message, query });
    return { query, total: 0, suppliers: [], durationMs: Date.now() - startMs };
  }
}
