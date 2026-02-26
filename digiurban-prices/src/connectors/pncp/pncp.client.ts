import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import type {
  PncpContratacao,
  PncpContrato,
  PncpListResponse,
  PncpFetchOptions,
} from './pncp.types';

// A API do PNCP tem dois base paths distintos:
// - /api/consulta/v1  → busca/listagem de contratações e contratos
// - /pncp-api/v1      → itens de contratações específicas
const PNCP_ITEMS_BASE_URL = 'https://pncp.gov.br/pncp-api/v1';

export class PncpClient {
  private http: AxiosInstance;
  private httpItems: AxiosInstance;
  private lastRequestTime = 0;

  constructor() {
    this.http = axios.create({
      baseURL: config.pncp.baseUrl,
      timeout: config.pncp.timeoutMs,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DigiUrban-Prices/1.0',
      },
    });

    this.httpItems = axios.create({
      baseURL: PNCP_ITEMS_BASE_URL,
      timeout: config.pncp.timeoutMs,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DigiUrban-Prices/1.0',
      },
    });

    const retryConfig = {
      retries: config.pncp.maxRetries,
      retryDelay: (retryCount: number) => retryCount * config.pncp.retryDelayMs,
      retryCondition: (error: import('axios').AxiosError) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === 429 ||
        error.response?.status === 503,
      onRetry: (retryCount: number, error: import('axios').AxiosError) => {
        logger.warn('[PNCP] Retry', {
          attempt: retryCount,
          url: error.config?.url,
          status: error.response?.status,
        });
      },
    };
    axiosRetry(this.http, retryConfig);
    axiosRetry(this.httpItems, retryConfig);
  }

  // Rate limit básico entre requisições
  private async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < config.pncp.rateLimitMs) {
      await new Promise((r) => setTimeout(r, config.pncp.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  // Busca contratações (editais/compras)
  // Endpoint correto: /contratacoes/proposta (tamanhoPagina mínimo: 10)
  async fetchContratacoes(options: PncpFetchOptions = {}): Promise<PncpContratacao[]> {
    const { sinceDays = config.ingest.sinceDays, page = 1 } = options;
    // PNCP exige tamanhoPagina >= 10; usar 50 como padrão produtivo
    const pageSize = Math.max(10, options.pageSize ?? config.pncp.pageSize);

    const dataFinal = new Date();
    const dataInicial = new Date();
    dataInicial.setDate(dataFinal.getDate() - sinceDays);

    const params: Record<string, unknown> = {
      dataInicial: this.formatDate(dataInicial),
      dataFinal: this.formatDate(dataFinal),
      pagina: page,
      tamanhoPagina: pageSize,
    };

    if (options.uf) params.uf = options.uf;
    if (options.modality) params.modalidadeId = options.modality;

    await this.throttle();

    try {
      logger.debug('[PNCP] Fetching contratacoes', { params });
      const response = await this.http.get<PncpListResponse<PncpContratacao>>(
        '/contratacoes/proposta',
        { params },
      );
      return response.data?.data ?? [];
    } catch (error: unknown) {
      logger.error('[PNCP] Error fetching contratacoes', { error: (error as Error).message });
      return [];
    }
  }

  // Busca todos os itens de uma contratação
  // Usa o base path /pncp-api/v1 (distinto do /api/consulta/v1)
  // Retorna array direto (não wrappado em { data: [] })
  async fetchItensContratacao(
    cnpjOrgao: string,
    anoCompra: number,
    sequencialCompra: number,
  ): Promise<PncpContratacao['itens']> {
    await this.throttle();

    try {
      const response = await this.httpItems.get<PncpContratacao['itens']>(
        `/orgaos/${cnpjOrgao}/compras/${anoCompra}/${sequencialCompra}/itens`,
        { params: { pagina: 1, tamanhoPagina: 500 } },
      );
      // API retorna array direto ou { data: [] } dependendo da versão
      const body = response.data;
      if (Array.isArray(body)) return body;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (body as any)?.data ?? [];
    } catch (error: unknown) {
      logger.warn('[PNCP] Error fetching itens', {
        cnpj: cnpjOrgao,
        ano: anoCompra,
        seq: sequencialCompra,
        error: (error as Error).message,
      });
      return [];
    }
  }

  // Busca contratos (não compras)
  // Endpoint correto: /contratos (tamanhoPagina mínimo: 10, formato data: yyyyMMdd)
  async fetchContratos(options: PncpFetchOptions = {}): Promise<PncpContrato[]> {
    const { sinceDays = config.ingest.sinceDays, page = 1 } = options;
    const pageSize = Math.max(10, options.pageSize ?? config.pncp.pageSize);

    const dataFinal = new Date();
    const dataInicial = new Date();
    dataInicial.setDate(dataFinal.getDate() - sinceDays);

    const params: Record<string, unknown> = {
      dataInicial: this.formatDate(dataInicial),
      dataFinal: this.formatDate(dataFinal),
      pagina: page,
      tamanhoPagina: pageSize,
    };

    if (options.uf) params.uf = options.uf;

    await this.throttle();

    try {
      const response = await this.http.get<PncpListResponse<PncpContrato>>(
        '/contratos',
        { params },
      );
      return response.data?.data ?? [];
    } catch (error: unknown) {
      logger.warn('[PNCP] Error fetching contratos', { error: (error as Error).message });
      return [];
    }
  }

  // Paginação automática (busca TODAS as páginas)
  async fetchAllPages<T>(
    fetcher: (page: number) => Promise<T[]>,
    maxPages = 20,
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;

    while (page <= maxPages) {
      const data = await fetcher(page);
      if (!data || data.length === 0) break;
      results.push(...data);
      if (data.length < config.pncp.pageSize) break;
      page++;
    }

    return results;
  }

  // Verifica disponibilidade da API PNCP
  async ping(): Promise<boolean> {
    try {
      await this.throttle();
      const dataFinal = new Date();
      const dataInicial = new Date();
      dataInicial.setDate(dataFinal.getDate() - 7);
      await this.http.get('/contratacoes/proposta', {
        params: {
          dataInicial: this.formatDate(dataInicial),
          dataFinal: this.formatDate(dataFinal),
          pagina: 1,
          tamanhoPagina: 10,
        },
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }

  // PNCP exige formato yyyyMMdd (sem hífens), ex: 20260226
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
}

// Singleton
let pncpClientInstance: PncpClient | null = null;

export function getPncpClient(): PncpClient {
  if (!pncpClientInstance) {
    pncpClientInstance = new PncpClient();
  }
  return pncpClientInstance;
}
