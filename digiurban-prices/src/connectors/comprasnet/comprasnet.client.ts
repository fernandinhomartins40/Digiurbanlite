import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../../utils/logger';
import type {
  ComprasnetLicitacao,
  ComprasnetItem,
  ComprasnetFetchOptions,
} from './comprasnet.types';

// API de dados abertos do SIASG / ComprasNet (histórico 2015–2021)
const BASE_URL = 'https://compras.dados.gov.br';

export class ComprasnetClient {
  private http: AxiosInstance;
  private lastRequestTime = 0;
  private readonly rateLimitMs = 1000; // 1 req/s — API pública sem chave

  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DigiUrban-Prices/1.0',
      },
    });

    axiosRetry(this.http, {
      retries: 3,
      retryDelay: (n) => n * 2000,
      retryCondition: (err) =>
        axiosRetry.isNetworkOrIdempotentRequestError(err) ||
        err.response?.status === 429 ||
        err.response?.status === 503,
    });
  }

  private async throttle() {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.rateLimitMs) {
      await new Promise((r) => setTimeout(r, this.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async fetchLicitacoes(options: ComprasnetFetchOptions = {}): Promise<ComprasnetLicitacao[]> {
    const { dataAberturaMim, dataAberturaMax, uf, page = 1, pageSize = 50 } = options;

    const params: Record<string, unknown> = {
      _page: page - 1, // API usa 0-indexed
      _pageSize: pageSize,
    };

    if (dataAberturaMim) params['data_abertura_min'] = dataAberturaMim;
    if (dataAberturaMax) params['data_abertura_max'] = dataAberturaMax;
    if (uf) params['uf'] = uf;

    await this.throttle();

    try {
      const response = await this.http.get<{
        _embedded?: { licitacoes?: ComprasnetLicitacao[] };
        page?: { totalElements?: number };
      }>('/licitacoes/v1/licitacoes.json', { params });

      return response.data?._embedded?.licitacoes ?? [];
    } catch (err: unknown) {
      logger.warn('[ComprasNet] Error fetching licitacoes', {
        error: (err as Error).message,
        params,
      });
      return [];
    }
  }

  async fetchItensLicitacao(idLicitacao: string): Promise<ComprasnetItem[]> {
    await this.throttle();

    try {
      const response = await this.http.get<{
        _embedded?: { itens?: ComprasnetItem[] };
      }>(`/licitacoes/v1/licitacoes/${idLicitacao}/itens.json`);

      return response.data?._embedded?.itens ?? [];
    } catch (err: unknown) {
      logger.warn('[ComprasNet] Error fetching itens', {
        error: (err as Error).message,
        idLicitacao,
      });
      return [];
    }
  }

  async fetchAllPages(options: ComprasnetFetchOptions, maxPages = 10): Promise<ComprasnetLicitacao[]> {
    const results: ComprasnetLicitacao[] = [];
    let page = 1;

    while (page <= maxPages) {
      const data = await this.fetchLicitacoes({ ...options, page });
      if (!data || data.length === 0) break;
      results.push(...data);
      if (data.length < (options.pageSize ?? 50)) break;
      page++;
    }

    return results;
  }

  async ping(): Promise<boolean> {
    try {
      await this.throttle();
      await this.http.get('/licitacoes/v1/licitacoes.json', {
        params: { _pageSize: 1 },
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

let instance: ComprasnetClient | null = null;
export function getComprasnetClient(): ComprasnetClient {
  if (!instance) instance = new ComprasnetClient();
  return instance;
}
