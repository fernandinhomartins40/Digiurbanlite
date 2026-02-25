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

export class PncpClient {
  private http: AxiosInstance;
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

    axiosRetry(this.http, {
      retries: config.pncp.maxRetries,
      retryDelay: (retryCount) => retryCount * config.pncp.retryDelayMs,
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === 429 ||
        error.response?.status === 503,
      onRetry: (retryCount, error, requestConfig) => {
        logger.warn('[PNCP] Retry', {
          attempt: retryCount,
          url: requestConfig.url,
          status: error.response?.status,
        });
      },
    });
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
  async fetchContratacoes(options: PncpFetchOptions = {}): Promise<PncpContratacao[]> {
    const { sinceDays = config.ingest.sinceDays, page = 1, pageSize = config.pncp.pageSize } = options;

    const dataInicial = new Date();
    dataInicial.setDate(dataInicial.getDate() - sinceDays);
    const dataFinal = new Date();

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
        '/contratacoes/publicacoes',
        { params },
      );
      return response.data?.data ?? [];
    } catch (error: unknown) {
      logger.error('[PNCP] Error fetching contratacoes', { error: (error as Error).message });
      return [];
    }
  }

  // Busca todos os itens de uma contratação
  async fetchItensContratacao(
    cnpjOrgao: string,
    anoCompra: number,
    sequencialCompra: number,
  ): Promise<PncpContratacao['itens']> {
    await this.throttle();

    try {
      const response = await this.http.get<{ data: PncpContratacao['itens'] }>(
        `/orgaos/${cnpjOrgao}/compras/${anoCompra}/${sequencialCompra}/itens`,
        { params: { pagina: 1, tamanhoPagina: 500 } },
      );
      return response.data?.data ?? [];
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
  async fetchContratos(options: PncpFetchOptions = {}): Promise<PncpContrato[]> {
    const { sinceDays = config.ingest.sinceDays, page = 1, pageSize = config.pncp.pageSize } = options;

    const dataInicial = new Date();
    dataInicial.setDate(dataInicial.getDate() - sinceDays);

    const params: Record<string, unknown> = {
      dataInicial: this.formatDate(dataInicial),
      dataFinal: this.formatDate(new Date()),
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
      await this.http.get('/contratacoes/publicacoes', {
        params: {
          dataInicial: this.formatDate(new Date()),
          dataFinal: this.formatDate(new Date()),
          pagina: 1,
          tamanhoPagina: 1,
        },
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
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
