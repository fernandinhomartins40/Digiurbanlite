import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import type {
  PncpContratacao,
  PncpContrato,
  PncpItem,
  PncpListResponse,
  PncpFetchOptions,
} from './pncp.types';

const PNCP_ITEMS_BASE_URL = 'https://pncp.gov.br/pncp-api/v1';
const PNCP_WINDOW_DAYS = 364;

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

  private async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < config.pncp.rateLimitMs) {
      await new Promise((resolve) => setTimeout(resolve, config.pncp.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async fetchContratacoes(options: PncpFetchOptions = {}): Promise<PncpContratacao[]> {
    const { page = 1 } = options;
    const pageSize = Math.max(10, options.pageSize ?? config.pncp.pageSize);
    const { dataInicial, dataFinal } = this.resolveDateRange(options);

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
      const response = await this.http.get<PncpListResponse<PncpContratacao>>('/contratacoes/proposta', { params });
      return response.data?.data ?? [];
    } catch (error: unknown) {
      logger.error('[PNCP] Error fetching contratacoes', { error: (error as Error).message, params });
      return [];
    }
  }

  async fetchContratacoesMultiWindow(
    sinceDays: number,
    options: { uf?: string; modality?: number; pageSize?: number; maxPagesPerWindow?: number } = {},
  ): Promise<PncpContratacao[]> {
    const pageSize = Math.max(10, options.pageSize ?? config.pncp.pageSize);
    const maxPagesPerWindow = options.maxPagesPerWindow ?? config.pncp.maxPagesContratacoes;

    return this.fetchMultiWindow<PncpContratacao>(sinceDays, maxPagesPerWindow, (dataInicial, dataFinal, page) =>
      this.fetchContratacoes({
        dataInicial,
        dataFinal,
        page,
        pageSize,
        uf: options.uf,
        modality: options.modality,
      }),
    );
  }

  async fetchItensContratacao(
    cnpjOrgao: string,
    anoCompra: number,
    sequencialCompra: number,
    page = 1,
    pageSize = 500,
  ): Promise<PncpItem[]> {
    await this.throttle();

    try {
      const response = await this.httpItems.get<PncpItem[] | { data?: PncpItem[] }>(
        `/orgaos/${cnpjOrgao}/compras/${anoCompra}/${sequencialCompra}/itens`,
        { params: { pagina: page, tamanhoPagina: pageSize } },
      );
      const body = response.data;
      if (Array.isArray(body)) return body;
      return body.data ?? [];
    } catch (error: unknown) {
      logger.warn('[PNCP] Error fetching itens', {
        cnpj: cnpjOrgao,
        ano: anoCompra,
        seq: sequencialCompra,
        page,
        error: (error as Error).message,
      });
      return [];
    }
  }

  async fetchAllItensContratacao(
    cnpjOrgao: string,
    anoCompra: number,
    sequencialCompra: number,
    pageSize = 500,
    maxPages = config.pncp.maxPagesItensContratacao,
  ): Promise<PncpItem[]> {
    const results = await this.fetchAllPages(
      (page) => this.fetchItensContratacao(cnpjOrgao, anoCompra, sequencialCompra, page, pageSize),
      maxPages,
      pageSize * Math.max(1, maxPages),
    );

    return results;
  }

  async fetchContratos(options: PncpFetchOptions = {}): Promise<PncpContrato[]> {
    const { page = 1 } = options;
    const pageSize = Math.max(10, options.pageSize ?? config.pncp.pageSize);
    const { dataInicial, dataFinal } = this.resolveDateRange(options, PNCP_WINDOW_DAYS);

    const params: Record<string, unknown> = {
      dataInicial: this.formatDate(dataInicial),
      dataFinal: this.formatDate(dataFinal),
      pagina: page,
      tamanhoPagina: pageSize,
    };

    if (options.uf) params.uf = options.uf;

    await this.throttle();

    try {
      const response = await this.http.get<PncpListResponse<PncpContrato>>('/contratos', { params });
      return response.data?.data ?? [];
    } catch (error: unknown) {
      logger.warn('[PNCP] Error fetching contratos', { error: (error as Error).message, params });
      return [];
    }
  }

  async fetchContratosMultiWindow(sinceDays: number, pageSize = config.pncp.pageSize, maxPagesPerWindow = config.pncp.maxPagesContratos): Promise<PncpContrato[]> {
    return this.fetchMultiWindow<PncpContrato>(sinceDays, maxPagesPerWindow, (dataInicial, dataFinal, page) =>
      this.fetchContratos({ dataInicial, dataFinal, page, pageSize }),
    );
  }

  async fetchAllPages<T>(
    fetcher: (page: number) => Promise<T[]>,
    maxPages = 200,
    maxResults = 250_000,
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    const safeMaxPages = Math.max(1, maxPages);

    while (page <= safeMaxPages) {
      const data = await fetcher(page);
      if (!data || data.length === 0) break;
      results.push(...data);
      if (results.length >= maxResults) {
        logger.warn('[PNCP] Pagination stopped by safety cap', { maxResults, page });
        break;
      }
      page += 1;
    }

    return results;
  }

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

  private async fetchMultiWindow<T>(
    sinceDays: number,
    maxPagesPerWindow: number,
    fetcher: (dataInicial: Date, dataFinal: Date, page: number) => Promise<T[]>,
  ): Promise<T[]> {
    const all: T[] = [];
    const now = new Date();
    const totalDays = Math.max(1, sinceDays);

    for (let startOffset = 0; startOffset < totalDays; startOffset += PNCP_WINDOW_DAYS) {
      const endOffset = Math.min(startOffset + PNCP_WINDOW_DAYS - 1, totalDays - 1);
      const dataFinal = this.shiftDate(now, startOffset);
      const dataInicial = this.shiftDate(now, endOffset);

      logger.info('[PNCP] Fetching window', {
        from: this.formatDate(dataInicial),
        to: this.formatDate(dataFinal),
      });

      const windowResults = await this.fetchAllPages(
        (page) => fetcher(dataInicial, dataFinal, page),
        maxPagesPerWindow,
      );

      all.push(...windowResults);
    }

    return all;
  }

  private resolveDateRange(options: PncpFetchOptions, maxWindowDays?: number): { dataInicial: Date; dataFinal: Date } {
    if (options.dataInicial && options.dataFinal) {
      return {
        dataInicial: options.dataInicial,
        dataFinal: options.dataFinal,
      };
    }

    const sinceDays = options.sinceDays ?? config.ingest.sinceDays;
    const effectiveDays = maxWindowDays ? Math.min(sinceDays, maxWindowDays) : sinceDays;
    const dataFinal = new Date();
    const dataInicial = new Date();
    dataInicial.setDate(dataFinal.getDate() - effectiveDays);
    return { dataInicial, dataFinal };
  }

  private shiftDate(baseDate: Date, daysAgo: number): Date {
    const shifted = new Date(baseDate);
    shifted.setDate(baseDate.getDate() - daysAgo);
    return shifted;
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
}

let pncpClientInstance: PncpClient | null = null;

export function getPncpClient(): PncpClient {
  if (!pncpClientInstance) {
    pncpClientInstance = new PncpClient();
  }
  return pncpClientInstance;
}
