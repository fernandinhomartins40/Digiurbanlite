import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import type {
  TransparenciaContrato,
  TransparenciaFetchOptions,
} from './transparencia.types';
import { TRANSPARENCIA_ORGAOS_PRINCIPAIS } from './transparencia.types';

const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';

export class TransparenciaClient {
  private http: AxiosInstance;
  private lastRequestTime = 0;
  private readonly rateLimitMs = 1000;

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
      retryDelay: (attempt) => attempt * 2000,
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === 429 ||
        error.response?.status === 503,
    });
  }

  private async throttle() {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.rateLimitMs) {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private formatDateBR(iso: string): string {
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  }

  async fetchContratos(options: TransparenciaFetchOptions = {}): Promise<TransparenciaContrato[]> {
    if (!config.transparencia.apiKey) {
      logger.debug('[Transparencia] API key not configured, skipping');
      return [];
    }

    const { dataInicio, dataFim, codigoOrgao, page = 1 } = options;
    const params: Record<string, unknown> = { pagina: page };

    if (dataInicio) params.dataInicialCompra = this.formatDateBR(dataInicio);
    if (dataFim) params.dataFinalCompra = this.formatDateBR(dataFim);
    if (codigoOrgao) params.codigoOrgao = codigoOrgao;

    await this.throttle();

    try {
      const response = await this.http.get<TransparenciaContrato[]>('/contratos', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: unknown) {
      logger.warn('[Transparencia] Error fetching contratos', {
        error: (err as Error).message,
        orgao: codigoOrgao,
        params,
      });
      return [];
    }
  }

  async fetchAllPagesForOrgao(
    codigoOrgao: string,
    dataInicio: string,
    dataFim: string,
    maxPages = config.transparencia.maxPagesPerOrgao,
  ): Promise<TransparenciaContrato[]> {
    const results: TransparenciaContrato[] = [];
    let page = 1;

    while (page <= maxPages) {
      const data = await this.fetchContratos({ codigoOrgao, dataInicio, dataFim, page });
      if (!data || data.length === 0) break;
      results.push(...data);
      if (data.length < 15) break;
      page += 1;
    }

    return results;
  }

  async fetchAllOrgaos(
    dataInicio: string,
    dataFim: string,
    orgaos: string[] = config.transparencia.orgaosPrincipais.length > 0
      ? config.transparencia.orgaosPrincipais
      : TRANSPARENCIA_ORGAOS_PRINCIPAIS,
    maxPagesPerOrgao = config.transparencia.maxPagesPerOrgao,
  ): Promise<TransparenciaContrato[]> {
    const all: TransparenciaContrato[] = [];
    for (const orgao of orgaos) {
      const data = await this.fetchAllPagesForOrgao(orgao, dataInicio, dataFim, maxPagesPerOrgao);
      if (data.length > 0) {
        logger.info('[Transparencia] Orgao done', { orgao, count: data.length });
        all.push(...data);
      }
    }
    return all;
  }

  async ping(): Promise<boolean> {
    if (!config.transparencia.apiKey) return false;

    try {
      await this.throttle();
      const today = new Date().toISOString().split('T')[0];
      await this.fetchContratos({
        codigoOrgao: (config.transparencia.orgaosPrincipais[0] ?? TRANSPARENCIA_ORGAOS_PRINCIPAIS[0]),
        dataInicio: today,
        dataFim: today,
        page: 1,
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
