import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import type {
  TransparenciaContrato,
  TransparenciaFetchOptions,
} from './transparencia.types';

// API do Portal da Transparência
// Requer chave gratuita: https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email
const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';

export class TransparenciaClient {
  private http: AxiosInstance;
  private lastRequestTime = 0;
  private readonly rateLimitMs = 1000; // 1 req/s (limite da API sem plano pago)

  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        'chave-api-dados': config.transparencia.apiKey,
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

  private formatDateBR(iso: string): string {
    // Converte "YYYY-MM-DD" para "dd/MM/yyyy"
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  async fetchContratos(options: TransparenciaFetchOptions = {}): Promise<TransparenciaContrato[]> {
    if (!config.transparencia.apiKey) {
      logger.debug('[Transparencia] API key não configurada, pulando');
      return [];
    }

    const { dataInicio, dataFim, codigoOrgao, page = 1, size = 50 } = options;

    const params: Record<string, unknown> = {
      pagina: page,
      tamanhoDaPagina: size,
    };

    if (dataInicio) params['dataInicio'] = this.formatDateBR(dataInicio);
    if (dataFim) params['dataFim'] = this.formatDateBR(dataFim);
    if (codigoOrgao) params['codigoOrgao'] = codigoOrgao;

    await this.throttle();

    try {
      const response = await this.http.get<TransparenciaContrato[]>('/contratos', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: unknown) {
      logger.warn('[Transparencia] Error fetching contratos', {
        error: (err as Error).message,
        params,
      });
      return [];
    }
  }

  async fetchAllPages(options: TransparenciaFetchOptions, maxPages = 20): Promise<TransparenciaContrato[]> {
    const results: TransparenciaContrato[] = [];
    let page = 1;

    while (page <= maxPages) {
      const data = await this.fetchContratos({ ...options, page });
      if (!data || data.length === 0) break;
      results.push(...data);
      if (data.length < (options.size ?? 50)) break;
      page++;
    }

    return results;
  }

  async ping(): Promise<boolean> {
    if (!config.transparencia.apiKey) return false;
    try {
      await this.throttle();
      await this.http.get('/contratos', {
        params: { pagina: 1, tamanhoDaPagina: 1 },
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

let instance: TransparenciaClient | null = null;
export function getTransparenciaClient(): TransparenciaClient {
  if (!instance) instance = new TransparenciaClient();
  return instance;
}
