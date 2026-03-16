/**
 * Cliente TypeScript para o módulo digiurban-prices
 * Chama o proxy no backend DigiUrban (/api/prices)
 * NÃO contém lógica de negócio — apenas comunicação HTTP.
 */
import api from './api';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface PriceSearchFilters {
  uf?: string;
  unit?: string;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  organization?: string;
  modality?: string;
  source?: string;
  minConfidence?: number;
}

export interface PriceSearchPeriod {
  from?: string; // YYYY-MM-DD
  to?: string;
}

export interface PriceSearchRequest {
  query: string;
  filters?: PriceSearchFilters;
  period?: PriceSearchPeriod;
  page?: number;
  page_size?: number;
}

export interface PriceSearchItem {
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
  source: string;
  supplierName: string | null;
  supplierCnpj: string | null;
  catmatCode: string | null;
  confidenceScore: number;
  score: number;
}

export interface PriceStatistics {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  excludedCount: number;
  methodology: string;
}

export interface SupplierAgg {
  supplierName: string;
  supplierCnpj: string | null;
  contractCount: number;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  lastSeen: string | null;
}

export interface PriceSearchResponse {
  query: string;
  normalizedQuery: string;
  total: number;
  page: number;
  pageSize: number;
  items: PriceSearchItem[];
  statistics: PriceStatistics | null;
  aggregations: {
    byUf: { key: string; count: number }[];
    byUnit: { key: string; count: number }[];
    bySource: { key: string; count: number }[];
    byModality: { key: string; count: number }[];
    bySupplier: SupplierAgg[];
    overTime: { date: string; avgPrice: number | null; minPrice?: number | null; maxPrice?: number | null; count: number }[];
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

export interface BatchSearchItemInput {
  item: string;
  quantity?: number;
  unit?: string;
}

export interface BatchSearchResponse {
  items: {
    inputItem: string;
    results: PriceSearchResponse;
    estimatedTotal: number | null;
  }[];
  grandTotalMin: number | null;
  grandTotalMax: number | null;
  grandTotalMedian: number | null;
}

export interface ReportRequest {
  query: string;
  filters?: PriceSearchFilters;
  period?: PriceSearchPeriod;
  format: 'pdf' | 'html';
  includeTermoReferencia?: boolean;
  unit?: string;
  orgaoSolicitante?: string;
}

export interface IngestStatus {
  queue: { active: number; waiting: number; completed: number; failed: number };
  lastRun: {
    id: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    itemsIngested: number;
    errors: number;
    triggeredBy: string | null;
  } | null;
}

export interface PricesCoverageResponse {
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
  bySource: Array<{
    source: string;
    count: number;
    withSupplier: number;
    withCatmat: number;
    lastContractDate: string | null;
    freshnessDays: number | null;
  }>;
  byUf: Array<{ uf: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
  governance: {
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
  };
}

export interface AuditListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: {
    id: string;
    userId: string | null;
    query: string;
    resultsCount: number;
    avgPrice: number | null;
    medianPrice: number | null;
    isBatchSearch: boolean;
    reportGenerated: boolean;
    createdAt: string;
  }[];
}

export interface CatmatSearchResult {
  code: string;
  type: 'material' | 'service';
  description: string;
  groupDescription: string | null;
  classDescription: string | null;
  pdmDescription: string | null;
}

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

// ─────────────────────────────────────────────
// Cliente
// ─────────────────────────────────────────────

export class PricesClient {
  private readonly baseUrl = '/prices';
  private readonly fetchBaseUrl = '/api/prices';

  async search(params: PriceSearchRequest): Promise<PriceSearchResponse> {
    const { data } = await api.post<PriceSearchResponse>(`${this.baseUrl}/search`, params);
    if (!data) throw new Error('Erro ao buscar preços');
    return data;
  }

  async searchBatch(
    items: BatchSearchItemInput[],
    filters?: PriceSearchFilters,
    period?: PriceSearchPeriod,
  ): Promise<BatchSearchResponse> {
    const { data } = await api.post<BatchSearchResponse>(`${this.baseUrl}/search/batch`, {
      items,
      filters,
      period,
    });
    if (!data) throw new Error('Erro ao realizar busca em lote');
    return data;
  }

  async generateReport(params: ReportRequest): Promise<Blob> {
    const response = await fetch(`${this.fetchBaseUrl}/reports/price-research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Erro ao gerar relatório');
    return response.blob();
  }

  async downloadReport(params: ReportRequest): Promise<void> {
    const blob = await this.generateReport(params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pesquisa_precos_${params.query.replace(/\s+/g, '_').substring(0, 30)}.${params.format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async getIngestStatus(): Promise<IngestStatus> {
    const { data } = await api.get<IngestStatus>(`${this.baseUrl}/ingest/status`);
    if (!data) throw new Error('Erro ao obter status de ingestão');
    return data;
  }

  async getCoverage(): Promise<PricesCoverageResponse> {
    const { data } = await api.get<PricesCoverageResponse>(`${this.baseUrl}/coverage`);
    if (!data) throw new Error('Erro ao obter cobertura da base');
    return data;
  }

  async triggerIngest(options?: { since_days?: number; uf?: string; source?: string; bps_max_files?: number }): Promise<{ jobId: string }> {
    const { data } = await api.post<{ jobId: string }>(`${this.baseUrl}/ingest/run`, options ?? {});
    if (!data) throw new Error('Erro ao iniciar ingestão');
    return data;
  }

  async listAudits(params?: {
    from?: string;
    to?: string;
    page?: number;
    page_size?: number;
  }): Promise<AuditListResponse> {
    const { data } = await api.get<AuditListResponse>(`${this.baseUrl}/audits`, params);
    if (!data) throw new Error('Erro ao listar auditorias');
    return data;
  }

  async health(): Promise<{ status: string }> {
    const { data } = await api.get<{ status: string }>(`${this.baseUrl}/health`);
    if (!data) throw new Error('Módulo de preços indisponível');
    return data;
  }

  /** Busca no catálogo CATMAT/CATSER */
  async searchCatmat(q: string, type?: 'material' | 'service', limit = 10): Promise<CatmatSearchResult[]> {
    const { data } = await api.get<{ results: CatmatSearchResult[] }>(`${this.baseUrl}/catmat/search`, {
      q,
      type,
      limit,
    });
    return data?.results ?? [];
  }

  /** Mapa de fornecedores */
  async getSupplierMap(
    q: string,
    options?: { uf?: string; source?: string; period?: string; limit?: number },
  ): Promise<SupplierMapResponse> {
    const { data } = await api.get<SupplierMapResponse>(`${this.baseUrl}/suppliers/map`, {
      q,
      ...options,
    });
    if (!data) throw new Error('Erro ao obter mapa de fornecedores');
    return data;
  }
}

export const pricesClient = new PricesClient();
