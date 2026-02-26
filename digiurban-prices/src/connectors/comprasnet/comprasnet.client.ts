import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../../utils/logger';
import type {
  ComprasnetContrato,
  ComprasnetContratoItem,
  ComprasnetFetchOptions,
} from './comprasnet.types';

// Nova API de Contratos do SIASG (versão 2.0, fev/2026)
// URL base: https://api.compras.dados.gov.br
// Docs: https://api.compras.dados.gov.br/openapi.yaml
// Sem autenticação — pública
const BASE_URL = 'https://api.compras.dados.gov.br';

export class ComprasnetClient {
  private http: AxiosInstance;
  private lastRequestTime = 0;
  private readonly rateLimitMs = 1000; // 1 req/s

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

  async fetchContratos(options: ComprasnetFetchOptions = {}): Promise<ComprasnetContrato[]> {
    const { dataAssinaturaMin, dataAssinaturaMax, orgaoNome, fornecedorNome, offset = 0, pageSize = 500 } = options;

    const params: Record<string, unknown> = {
      offset,
      order: 'data_assinatura',
      order_by: 'desc',
    };

    if (dataAssinaturaMin) params['data_assinatura_min'] = dataAssinaturaMin;
    if (dataAssinaturaMax) params['data_assinatura_max'] = dataAssinaturaMax;
    if (orgaoNome) params['orgao_nome'] = orgaoNome;
    if (fornecedorNome) params['fornecedor_nome'] = fornecedorNome;

    await this.throttle();

    try {
      // API retorna array direto ou objeto com data
      const response = await this.http.get<ComprasnetContrato[] | { data?: ComprasnetContrato[] }>(
        '/comprasContratos/v1/contratos',
        { params },
      );
      const body = response.data;
      if (Array.isArray(body)) return body;
      return (body as { data?: ComprasnetContrato[] })?.data ?? [];
    } catch (err: unknown) {
      logger.warn('[ComprasNet] Error fetching contratos', {
        error: (err as Error).message,
        params,
      });
      return [];
    }
  }

  async fetchItensContrato(contratoId: string): Promise<ComprasnetContratoItem[]> {
    await this.throttle();

    try {
      const response = await this.http.get<ComprasnetContratoItem[] | { data?: ComprasnetContratoItem[] }>(
        `/comprasContratos/doc/contrato/${contratoId}/itens_compras_contratos`,
      );
      const body = response.data;
      if (Array.isArray(body)) return body;
      return (body as { data?: ComprasnetContratoItem[] })?.data ?? [];
    } catch (err: unknown) {
      logger.warn('[ComprasNet] Error fetching itens', {
        error: (err as Error).message,
        contratoId,
      });
      return [];
    }
  }

  async fetchAllPages(options: ComprasnetFetchOptions, maxPages = 10): Promise<ComprasnetContrato[]> {
    const results: ComprasnetContrato[] = [];
    const pageSize = options.pageSize ?? 500;
    let page = 0;

    while (page < maxPages) {
      const data = await this.fetchContratos({ ...options, offset: page * pageSize, pageSize });
      if (!data || data.length === 0) break;
      results.push(...data);
      if (data.length < pageSize) break;
      page++;
    }

    return results;
  }

  async ping(): Promise<boolean> {
    try {
      await this.throttle();
      const data = await this.fetchContratos({ pageSize: 1 });
      return data.length >= 0; // retorna true mesmo com 0 — API respondeu
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
