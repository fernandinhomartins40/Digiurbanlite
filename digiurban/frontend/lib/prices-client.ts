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

// ─────────────────────────────────────────────
// Cliente
// ─────────────────────────────────────────────

export class PricesClient {
  // Usado com o api client (que já tem /api como base)
  private readonly baseUrl = '/prices';
  // Usado com fetch direto (sem base automática)
  private readonly fetchBaseUrl = '/api/prices';

  /** Busca por item (texto livre) */
  async search(params: PriceSearchRequest): Promise<PriceSearchResponse> {
    const { data } = await api.post<PriceSearchResponse>(`${this.baseUrl}/search`, params);
    if (!data) throw new Error('Erro ao buscar preços');
    return data;
  }

  /** Busca em lote via JSON */
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

  /** Gera relatório PDF — usa fetch direto para suportar responseType blob */
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

  /** Download de relatório — abre no browser ou força download */
  async downloadReport(params: ReportRequest): Promise<void> {
    const blob = await this.generateReport(params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pesquisa_precos_${params.query.replace(/\s+/g, '_').substring(0, 30)}.${params.format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Status da ingestão */
  async getIngestStatus(): Promise<IngestStatus> {
    const { data } = await api.get<IngestStatus>(`${this.baseUrl}/ingest/status`);
    if (!data) throw new Error('Erro ao obter status de ingestão');
    return data;
  }

  /** Trigger ingestão manual */
  async triggerIngest(options?: { since_days?: number; uf?: string }): Promise<{ jobId: string }> {
    const { data } = await api.post<{ jobId: string }>(`${this.baseUrl}/ingest/run`, options ?? {});
    if (!data) throw new Error('Erro ao iniciar ingestão');
    return data;
  }

  /** Lista auditorias */
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

  /** Health check do módulo */
  async health(): Promise<{ status: string }> {
    const { data } = await api.get<{ status: string }>(`${this.baseUrl}/health`);
    if (!data) throw new Error('Módulo de preços indisponível');
    return data;
  }
}

// Singleton
export const pricesClient = new PricesClient();
