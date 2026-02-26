import { config } from '../config/config';

export interface SearchFilters {
  uf?: string;
  unit?: string;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  organization?: string;
  modality?: string;
  catmatCode?: string;
  source?: string;         // pncp | comprasnet | bps | transparencia | fnde
  minConfidence?: number;  // 0.0 – 1.0
  yearMonth?: string;      // "2024-03"
}

export interface SearchPeriod {
  from?: string; // ISO date string
  to?: string;
}

export interface SearchQueryParams {
  query: string;
  filters?: SearchFilters;
  period?: SearchPeriod;
  page?: number;
  pageSize?: number;
  includeExcluded?: boolean;
}

export function buildSearchQuery(params: SearchQueryParams) {
  const { query, filters = {}, period, page = 1, pageSize = 20 } = params;

  const must: unknown[] = [];
  const filter: unknown[] = [];

  // Query principal: multi_match com boost por campo + fuzzy
  must.push({
    multi_match: {
      query,
      fields: [
        'description^3',
        'normalized_description^2.5',
        'catmat_description^2',
        'description.autocomplete^1.5',
        'organization_name^1',
        'supplier_name^0.8',
      ],
      type: 'best_fields',
      fuzziness: 'AUTO',
      prefix_length: 2,
      operator: 'or',
      minimum_should_match: '60%',
    },
  });

  // Filtros
  if (filters.uf) filter.push({ term: { uf: filters.uf } });
  if (filters.unit) filter.push({ term: { unit: filters.unit } });
  if (filters.modality) filter.push({ term: { modality: filters.modality } });
  if (filters.catmatCode) filter.push({ term: { catmat_code: filters.catmatCode } });
  if (filters.source) filter.push({ term: { source: filters.source } });
  if (filters.yearMonth) filter.push({ term: { year_month: filters.yearMonth } });
  if (filters.organization) {
    filter.push({ match: { 'organization_name.keyword': filters.organization } });
  }

  // Faixa de preço
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const range: Record<string, number> = {};
    if (filters.minPrice !== undefined) range.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) range.lte = filters.maxPrice;
    filter.push({ range: { unit_price: range } });
  }

  // Confiabilidade mínima
  if (filters.minConfidence !== undefined) {
    filter.push({ range: { confidence_score: { gte: filters.minConfidence } } });
  }

  // Faixa de quantidade
  if (filters.minQuantity !== undefined || filters.maxQuantity !== undefined) {
    const range: Record<string, number> = {};
    if (filters.minQuantity !== undefined) range.gte = filters.minQuantity;
    if (filters.maxQuantity !== undefined) range.lte = filters.maxQuantity;
    filter.push({ range: { quantity: range } });
  }

  // Período
  if (period?.from || period?.to) {
    const range: Record<string, string> = {};
    if (period.from) range.gte = period.from;
    if (period.to) range.lte = period.to;
    filter.push({ range: { contract_date: range } });
  } else {
    // Padrão: últimos 24 meses (ampliado de 12)
    const from = new Date();
    from.setFullYear(from.getFullYear() - 2);
    filter.push({ range: { contract_date: { gte: from.toISOString().split('T')[0] } } });
  }

  // function_score: boost por recência + confiabilidade
  const query_body = {
    function_score: {
      query: {
        bool: {
          must,
          filter,
        },
      },
      functions: [
        {
          gauss: {
            contract_date: {
              origin: 'now',
              scale: '180d',
              offset: '30d',
              decay: 0.5,
            },
          },
          weight: 1.5,
        },
        {
          field_value_factor: {
            field: 'confidence_score',
            factor: 0.5,
            modifier: 'sqrt',
            missing: 0.5,
          },
          weight: 1.0,
        },
      ],
      score_mode: 'sum',
      boost_mode: 'multiply',
    },
  };

  return {
    index: config.opensearch.indexLineItems,
    from: (page - 1) * pageSize,
    size: pageSize,
    body: {
      query: query_body,
      aggs: {
        stats_unit_price: {
          stats: { field: 'unit_price' },
        },
        percentiles_unit_price: {
          percentiles: {
            field: 'unit_price',
            percents: [25, 50, 75, 90, 95],
          },
        },
        by_uf: {
          terms: { field: 'uf', size: 30 },
        },
        by_unit: {
          terms: { field: 'unit', size: 20 },
        },
        by_source: {
          terms: { field: 'source', size: 10 },
        },
        by_modality: {
          terms: { field: 'modality', size: 10 },
        },
        by_supplier: {
          terms: { field: 'supplier_name.keyword', size: 20, min_doc_count: 2 },
          aggs: {
            avg_price: { avg: { field: 'unit_price' } },
            min_price: { min: { field: 'unit_price' } },
            max_price: { max: { field: 'unit_price' } },
            last_seen: { max: { field: 'contract_date' } },
          },
        },
        avg_confidence: {
          avg: { field: 'confidence_score' },
        },
        over_time: {
          date_histogram: {
            field: 'contract_date',
            calendar_interval: 'month',
            min_doc_count: 1,
          },
          aggs: {
            avg_price: { avg: { field: 'unit_price' } },
            min_price: { min: { field: 'unit_price' } },
            max_price: { max: { field: 'unit_price' } },
          },
        },
      },
      sort: [{ _score: { order: 'desc' } }, { contract_date: { order: 'desc', missing: '_last' } }],
    },
  };
}

export function buildBatchSearchQuery(itemDescription: string, filters?: SearchFilters, period?: SearchPeriod) {
  return buildSearchQuery({
    query: itemDescription,
    filters,
    period,
    pageSize: 50,
  });
}
