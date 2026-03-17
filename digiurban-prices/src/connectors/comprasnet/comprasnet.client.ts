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
    const deduped = new Map<string, ComprasnetItemPregao>();

    for (const window of this.buildRollingWindows(sinceDays, 30)) {
      const windowResults = await this.fetchAllPagesPregoes(
        {
          dtHomInicial: this.formatDate(window.start),
          dtHomFinal: this.formatDate(window.end),
          tamanhoPagina: 500,
        },
        maxPagesPerWindow,
      );

      for (const item of windowResults) {
        if (!this.isUsablePregaoItem(item)) {
          continue;
        }

        deduped.set(this.buildPregaoKey(item), item);
      }
    }

    return Array.from(deduped.values());
  }

  async fetchAllARPItens(sinceDays: number, maxPagesPerWindow = config.comprasnet.maxPagesArp): Promise<ComprasnetARPItem[]> {
    const deduped = new Map<string, ComprasnetARPItem>();

    for (const window of this.buildRollingWindows(sinceDays, 30)) {
      const windowResults = await this.fetchAllPagesARP(
        {
          dataVigenciaInicialMin: this.formatDate(window.start),
          dataVigenciaInicialMax: this.formatDate(window.end),
          tamanhoPagina: 500,
        },
        maxPagesPerWindow,
      );

      for (const item of windowResults) {
        deduped.set(this.buildArpKey(item), item);
      }
    }

    return Array.from(deduped.values());
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

  private buildRollingWindows(sinceDays: number, windowDays: number): Array<{ start: Date; end: Date }> {
    const windows: Array<{ start: Date; end: Date }> = [];
    const end = new Date();
    end.setHours(0, 0, 0, 0);

    const minDate = new Date(end);
    minDate.setDate(minDate.getDate() - Math.max(0, sinceDays - 1));

    let currentEnd = new Date(end);
    while (currentEnd >= minDate) {
      const start = new Date(currentEnd);
      start.setDate(start.getDate() - (windowDays - 1));
      if (start < minDate) {
        start.setTime(minDate.getTime());
      }

      windows.push({ start: new Date(start), end: new Date(currentEnd) });

      currentEnd = new Date(start);
      currentEnd.setDate(currentEnd.getDate() - 1);
    }

    return windows;
  }

  private isUsablePregaoItem(item: ComprasnetItemPregao): boolean {
    const unitPrice = item.valorHomologadoItem ? Number(item.valorHomologadoItem.replace(',', '.')) : NaN;
    const situacao = (item.situacaoItem ?? '').toLowerCase();

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return false;
    }

    if (situacao.includes('cancelado')) {
      return false;
    }

    return true;
  }

  private buildPregaoKey(item: ComprasnetItemPregao): string {
    return `${item.idCompraItem ?? item.idCompra ?? 'pregao'}_${item.tbVwItensPregaoId?.coItem ?? 'item'}`;
  }

  private buildArpKey(item: ComprasnetARPItem): string {
    return `${item.numeroControlePncpAta ?? item.numeroAtaRegistroPreco ?? 'arp'}_${item.codigoItem ?? 'item'}`;
  }
}

let instance: ComprasnetClient | null = null;
export function getComprasnetClient(): ComprasnetClient {
  if (!instance) instance = new ComprasnetClient();
  return instance;
}
