// Conector para a API dadosabertos.compras.gov.br
// Portal de Compras do Governo Federal — dados abertos SIASG/ComprasNet
// Documentação: https://dadosabertos.compras.gov.br/swagger-ui/index.html
// Sem autenticação. Paginação 1-based. tamanhoPagina: 10–500.

import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../../utils/logger';
import type {
  DadosAbertosResponse,
  ComprasnetItemPregao,
  ComprasnetARPItem,
  ComprasnetPregaoOptions,
  ComprasnetARPOptions,
} from './comprasnet.types';

const BASE_URL = 'https://dadosabertos.compras.gov.br';

export class ComprasnetClient {
  private http: AxiosInstance;
  private lastRequestTime = 0;
  private readonly rateLimitMs = 1200;

  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 45000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DigiUrban-Prices/1.0',
      },
    });

    axiosRetry(this.http, {
      retries: 3,
      retryDelay: (n) => n * 3000,
      retryCondition: (err) =>
        axiosRetry.isNetworkOrIdempotentRequestError(err) ||
        err.response?.status === 429 ||
        err.response?.status === 503,
      onRetry: (n, err) => { logger.warn('[ComprasNet] Retry', { attempt: n, url: err.config?.url }); },
    });
  }

  private async throttle() {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.rateLimitMs) {
      await new Promise((r) => setTimeout(r, this.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  // ── Pregões homologados (/modulo-legado/4_consultarItensPregoes) ──────────
  // Retorna itens de pregão com valorHomologadoItem (preço unitário real)
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
      const res = await this.http.get<DadosAbertosResponse<ComprasnetItemPregao>>(
        '/modulo-legado/4_consultarItensPregoes',
        { params },
      );
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

  // ── Itens de ATAs de Registro de Preço (/modulo-arp/2_consultarARPItem) ──
  // Usar janelas <= 30 dias para evitar timeout
  async fetchARPItens(options: ComprasnetARPOptions): Promise<ComprasnetARPItem[]> {
    const { dataVigenciaInicialMin, dataVigenciaInicialMax, pagina = 1, tamanhoPagina = 500 } = options;

    await this.throttle();

    try {
      const res = await this.http.get<DadosAbertosResponse<ComprasnetARPItem>>(
        '/modulo-arp/2_consultarARPItem',
        {
          params: {
            dataVigenciaInicialMin,
            dataVigenciaInicialMax,
            pagina,
            tamanhoPagina: Math.min(500, Math.max(10, tamanhoPagina)),
          },
        },
      );
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

  // ── Paginação automática para pregões ─────────────────────────────────────
  // Divide o período em janelas mensais para não sobrecarregar
  async fetchAllPregoes(sinceDays: number, maxPagesPerWindow = 100): Promise<ComprasnetItemPregao[]> {
    const all: ComprasnetItemPregao[] = [];
    const now = new Date();
    const WINDOW_DAYS = 30;

    for (let offset = 0; offset < sinceDays; offset += WINDOW_DAYS) {
      const windowEnd = new Date(now);
      windowEnd.setDate(now.getDate() - offset);
      const windowStart = new Date(now);
      windowStart.setDate(now.getDate() - Math.min(offset + WINDOW_DAYS, sinceDays));

      const dtHomInicial = this.formatDate(windowStart);
      const dtHomFinal = this.formatDate(windowEnd);

      logger.debug('[ComprasNet] Fetching pregoes window', { dtHomInicial, dtHomFinal });

      const windowResults = await this.fetchAllPagesPregoes(
        { dtHomInicial, dtHomFinal, tamanhoPagina: 500 },
        maxPagesPerWindow,
      );
      all.push(...windowResults);
    }

    return all;
  }

  // ── Paginação automática para ARPs ────────────────────────────────────────
  // Janelas de 30 dias para evitar timeout do endpoint
  async fetchAllARPItens(sinceDays: number, maxPagesPerWindow = 50): Promise<ComprasnetARPItem[]> {
    const all: ComprasnetARPItem[] = [];
    const now = new Date();
    const WINDOW_DAYS = 30;

    for (let offset = 0; offset < sinceDays; offset += WINDOW_DAYS) {
      const windowEnd = new Date(now);
      windowEnd.setDate(now.getDate() - offset);
      const windowStart = new Date(now);
      windowStart.setDate(now.getDate() - Math.min(offset + WINDOW_DAYS, sinceDays));

      const min = this.formatDate(windowStart);
      const max = this.formatDate(windowEnd);

      logger.debug('[ComprasNet] Fetching ARP itens window', { min, max });

      const windowResults = await this.fetchAllPagesARP(
        { dataVigenciaInicialMin: min, dataVigenciaInicialMax: max, tamanhoPagina: 500 },
        maxPagesPerWindow,
      );
      all.push(...windowResults);
    }

    return all;
  }

  private async fetchAllPagesPregoes(
    options: ComprasnetPregaoOptions,
    maxPages: number,
  ): Promise<ComprasnetItemPregao[]> {
    const results: ComprasnetItemPregao[] = [];
    let page = 1;

    while (page <= maxPages) {
      const data = await this.fetchItensPregoes({ ...options, pagina: page });
      if (!data || data.length === 0) break;
      results.push(...data);
      if (data.length < (options.tamanhoPagina ?? 500)) break;
      page++;
    }

    return results;
  }

  private async fetchAllPagesARP(
    options: ComprasnetARPOptions,
    maxPages: number,
  ): Promise<ComprasnetARPItem[]> {
    const results: ComprasnetARPItem[] = [];
    let page = 1;

    while (page <= maxPages) {
      const data = await this.fetchARPItens({ ...options, pagina: page });
      if (!data || data.length === 0) break;
      results.push(...data);
      if (data.length < (options.tamanhoPagina ?? 500)) break;
      page++;
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

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
  }
}

let instance: ComprasnetClient | null = null;
export function getComprasnetClient(): ComprasnetClient {
  if (!instance) instance = new ComprasnetClient();
  return instance;
}
