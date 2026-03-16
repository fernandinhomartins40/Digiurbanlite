import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import type {
  DadosAbertosResponse,
  ComprasnetItemPregao,
  ComprasnetARPItem,
  ComprasnetPregaoOptions,
  ComprasnetARPOptions,
} from './comprasnet.types';

export class ComprasnetClient {
  private http: AxiosInstance;
  private lastRequestTime = 0;

  constructor() {
    this.http = axios.create({
      baseURL: config.comprasnet.baseUrl,
      timeout: config.comprasnet.timeoutMs,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DigiUrban-Prices/1.0',
      },
    });

    axiosRetry(this.http, {
      retries: 3,
      retryDelay: (attempt) => attempt * 3000,
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === 429 ||
        error.response?.status === 503,
      onRetry: (attempt, error) => {
        logger.warn('[ComprasNet] Retry', { attempt, url: error.config?.url });
      },
    });
  }

  private async throttle() {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < config.comprasnet.rateLimitMs) {
      await new Promise((resolve) => setTimeout(resolve, config.comprasnet.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async fetchItensPregoes(options: ComprasnetPregaoOptions): Promise<ComprasnetItemPregao[]> {
    const { dtHomInicial, dtHomFinal, coUasg, pagina = 1, tamanhoPagina = 500 } = options;

    const params: Record<string, unknown> = {
      dt_hom_inicial: dtHomInicial,
      dt_hom_final: dtHomFinal,
      pagina,
      tamanhoPagina: Math.min(500, Math.max(10, tamanhoPagina)),
    };
    if (coUasg) params.co_uasg = coUasg;

    await this.throttle();

    try {
      const res = await this.http.get<DadosAbertosResponse<ComprasnetItemPregao>>('/modulo-legado/4_consultarItensPregoes', { params });
      return res.data?.resultado ?? [];
    } catch (err: unknown) {
      logger.warn('[ComprasNet] Error fetching itens pregoes', {
        error: (err as Error).message,
        dtHomInicial,
        dtHomFinal,
      });
      return [];
    }
  }

  async fetchARPItens(options: ComprasnetARPOptions): Promise<ComprasnetARPItem[]> {
    const { dataVigenciaInicialMin, dataVigenciaInicialMax, pagina = 1, tamanhoPagina = 500 } = options;

    await this.throttle();

    try {
      const res = await this.http.get<DadosAbertosResponse<ComprasnetARPItem>>('/modulo-arp/2_consultarARPItem', {
        params: {
          dataVigenciaInicialMin,
          dataVigenciaInicialMax,
          pagina,
          tamanhoPagina: Math.min(500, Math.max(10, tamanhoPagina)),
        },
      });
      return res.data?.resultado ?? [];
    } catch (err: unknown) {
      logger.warn('[ComprasNet] Error fetching ARP itens', {
        error: (err as Error).message,
        dataVigenciaInicialMin,
        dataVigenciaInicialMax,
      });
      return [];
    }
  }

  async fetchAllPregoes(sinceDays: number, maxPagesPerWindow = config.comprasnet.maxPagesPregoes): Promise<ComprasnetItemPregao[]> {
    const all: ComprasnetItemPregao[] = [];
    const now = new Date();
    const windowDays = 30;

    for (let offset = 0; offset < sinceDays; offset += windowDays) {
      const windowEnd = new Date(now);
      windowEnd.setDate(now.getDate() - offset);
      const windowStart = new Date(now);
      windowStart.setDate(now.getDate() - Math.min(offset + windowDays, sinceDays));

      const windowResults = await this.fetchAllPagesPregoes(
        {
          dtHomInicial: this.formatDate(windowStart),
          dtHomFinal: this.formatDate(windowEnd),
          tamanhoPagina: 500,
        },
        maxPagesPerWindow,
      );

      all.push(...windowResults);
    }

    return all;
  }

  async fetchAllARPItens(sinceDays: number, maxPagesPerWindow = config.comprasnet.maxPagesArp): Promise<ComprasnetARPItem[]> {
    const all: ComprasnetARPItem[] = [];
    const now = new Date();
    const windowDays = 30;

    for (let offset = 0; offset < sinceDays; offset += windowDays) {
      const windowEnd = new Date(now);
      windowEnd.setDate(now.getDate() - offset);
      const windowStart = new Date(now);
      windowStart.setDate(now.getDate() - Math.min(offset + windowDays, sinceDays));

      const windowResults = await this.fetchAllPagesARP(
        {
          dataVigenciaInicialMin: this.formatDate(windowStart),
          dataVigenciaInicialMax: this.formatDate(windowEnd),
          tamanhoPagina: 500,
        },
        maxPagesPerWindow,
      );

      all.push(...windowResults);
    }

    return all;
  }

  private async fetchAllPagesPregoes(options: ComprasnetPregaoOptions, maxPages: number): Promise<ComprasnetItemPregao[]> {
    const results: ComprasnetItemPregao[] = [];
    let page = 1;

    while (page <= maxPages) {
      const data = await this.fetchItensPregoes({ ...options, pagina: page });
      if (!data || data.length === 0) break;
      results.push(...data);
      if (data.length < (options.tamanhoPagina ?? 500)) break;
      page += 1;
    }

    return results;
  }

  private async fetchAllPagesARP(options: ComprasnetARPOptions, maxPages: number): Promise<ComprasnetARPItem[]> {
    const results: ComprasnetARPItem[] = [];
    let page = 1;

    while (page <= maxPages) {
      const data = await this.fetchARPItens({ ...options, pagina: page });
      if (!data || data.length === 0) break;
      results.push(...data);
      if (data.length < (options.tamanhoPagina ?? 500)) break;
      page += 1;
    }

    return results;
  }

  async ping(): Promise<boolean> {
    try {
      const now = new Date();
      const last7 = new Date(now);
      last7.setDate(now.getDate() - 7);
      const data = await this.fetchItensPregoes({
        dtHomInicial: this.formatDate(last7),
        dtHomFinal: this.formatDate(now),
        tamanhoPagina: 10,
      });
      return Array.isArray(data);
    } catch {
      return false;
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

let instance: ComprasnetClient | null = null;
export function getComprasnetClient(): ComprasnetClient {
  if (!instance) instance = new ComprasnetClient();
  return instance;
}
