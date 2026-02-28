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
  expandedQuery?: string;
  filters?: SearchFilters;
  period?: SearchPeriod;
  page?: number;
  pageSize?: number;
  relaxMatching?: boolean;
  preferTechnicalTerms?: string[];
  includeExcluded?: boolean;
}

export function buildSearchQuery(params: SearchQueryParams) {
  const {
    query,
    expandedQuery,
    filters = {},
    period,
    page = 1,
    pageSize = 20,
    relaxMatching = false,
    preferTechnicalTerms = [],
  } = params;

  const must: unknown[] = [];
  const should: unknown[] = [];
  const filter: unknown[] = [];
  const tokenCount = query.trim().split(/\s+/).filter(Boolean).length;
  const strictSingleTerm = tokenCount === 1 && (!expandedQuery || expandedQuery === query) && !relaxMatching;
  const fuzziness: 'AUTO' | 0 = strictSingleTerm ? 0 : 'AUTO';
  const minimumShouldMatch = relaxMatching
    ? '35%'
    : tokenCount <= 2
      ? '100%'
      : tokenCount <= 4
        ? '75%'
        : '60%';

  // Query principal: multi_match em campos seguros (existem no mapping original + novo)
  must.push({
    multi_match: {
      query,
      fields: ['normalized_description^2.4', 'description^2', 'catmat_description^1.6', 'organization_name'],
      type: 'best_fields',
      fuzziness,
      minimum_should_match: minimumShouldMatch,
    },
  });

  // Boost de frase para aproximar itens tecnicamente equivalentes
  should.push({
    match_phrase: {
      normalized_description: {
        query,
        slop: 0,
        boost: strictSingleTerm ? 2.2 : 1.6,
      },
    },
  });

  should.push({
    match_phrase: {
      description: {
        query,
        slop: 3,
        boost: relaxMatching ? 0.8 : 1.3,
      },
    },
  });

  if (expandedQuery && expandedQuery.trim().length > 2 && expandedQuery !== query) {
    should.push({
      multi_match: {
        query: expandedQuery,
        fields: ['normalized_description^1.6', 'description^1.2', 'catmat_description^1.2'],
        type: 'most_fields',
        fuzziness,
        minimum_should_match: relaxMatching ? '25%' : '35%',
        boost: 0.65,
      },
    });
  }

  for (const technicalTerm of preferTechnicalTerms.slice(0, 8)) {
    should.push({
      match: {
        normalized_description: {
          query: technicalTerm,
          boost: 1.1,
        },
      },
    });
  }

  // Filtros base
  if (filters.uf) filter.push({ term: { uf: filters.uf } });
  if (filters.unit) filter.push({ term: { unit: filters.unit } });
  if (filters.modality) filter.push({ term: { modality: filters.modality } });
  if (filters.catmatCode) {
    filter.push({
      bool: {
        should: [
          { term: { catmat_code: filters.catmatCode } },
          { term: { catser_code: filters.catmatCode } },
        ],
        minimum_should_match: 1,
      },
    });
  }
  if (filters.source) filter.push({ term: { source: filters.source } });
  if (filters.yearMonth) filter.push({ term: { year_month: filters.yearMonth } });
  if (filters.organization) {
    filter.push({ match: { 'organization_name.keyword': filters.organization } });
  }

  if (strictSingleTerm) {
    filter.push({
      bool: {
        should: [
          { match_phrase: { normalized_description: { query } } },
          { match_phrase: { description: { query } } },
          { match_phrase: { catmat_description: { query } } },
        ],
        minimum_should_match: 1,
      },
    });
  }

  // Faixa de preço
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const range: Record<string, number> = {};
    if (filters.minPrice !== undefined) range.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) range.lte = filters.maxPrice;
    filter.push({ range: { unit_price: range } });
  }

  // Confiabilidade mínima (campo novo — só filtra se o campo existir)
  if (filters.minConfidence !== undefined) {
    filter.push({
      bool: {
        should: [
          { range: { confidence_score: { gte: filters.minConfidence } } },
          { bool: { must_not: { exists: { field: 'confidence_score' } } } },
        ],
        minimum_should_match: 1,
      },
    });
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
    // Padrão: últimos 60 meses (5 anos) para cobrir fontes históricas como BPS (2020+)
    const from = new Date();
    from.setFullYear(from.getFullYear() - 5);
    filter.push({ range: { contract_date: { gte: from.toISOString().split('T')[0] } } });
  }

  // function_score: boost para documentos mais recentes
  // IMPORTANTE: usar filter na function para que documentos sem contract_date
  // não recebam score 0 (com boost_mode: sum, score base é preservado)
  const query_body = {
    function_score: {
      query: {
        bool: {
          must,
          should,
          minimum_should_match: should.length > 0 ? 1 : 0,
          filter,
        },
      },
      functions: [
        {
          gauss: {
            contract_date: {
              origin: 'now',
              scale: '365d',
              offset: '30d',
              decay: 0.5,
            },
          },
          weight: 1.5,
          // Só aplica o decay em documentos que têm contract_date
          filter: { exists: { field: 'contract_date' } },
        },
      ],
      score_mode: 'sum',
      boost_mode: 'sum',  // sum preserva o score base mesmo quando a function retorna 0
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
          terms: {
            field: 'supplier_name.keyword',
            size: 20,
            order: { _count: 'desc' },
          },
          aggs: {
            avg_price: { avg: { field: 'unit_price' } },
            min_price: { min: { field: 'unit_price' } },
            max_price: { max: { field: 'unit_price' } },
            last_seen: { max: { field: 'contract_date' } },
          },
        },
        // avg_confidence: só funciona com novo mapping, mas não causa erro (retorna null)
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
