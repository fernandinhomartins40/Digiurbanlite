import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../../utils/logger';
import type { FndeContrato, FndeFetchOptions } from './fnde.types';

// FNDE Dados Abertos
// Portal: https://www.fnde.gov.br/dadosabertos
// API CKAN: https://www.fnde.gov.br/dadosabertos/api/3/action/package_search
const FNDE_CKAN = 'https://www.fnde.gov.br/dadosabertos';
const FNDE_API = 'https://www.fnde.gov.br/sigecon-web/api/v1'; // API REST do SIGECON

export class FndeClient {
  private http: AxiosInstance;
  private lastRequestTime = 0;
  private readonly rateLimitMs = 1500;

  constructor() {
    this.http = axios.create({
      baseURL: FNDE_API,
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

  // Busca contratos do PNAE (Programa Nacional de Alimentação Escolar)
  async fetchContratosAlimentacao(options: FndeFetchOptions = {}): Promise<FndeContrato[]> {
    const { uf, anoInicio, anoFim, page = 1, pageSize = 50 } = options;

    const params: Record<string, unknown> = {
      pagina: page,
      tamanhoPagina: pageSize,
    };

    if (uf) params['uf'] = uf;
    if (anoInicio) params['anoInicio'] = anoInicio;
    if (anoFim) params['anoFim'] = anoFim;

    await this.throttle();

    try {
      const response = await this.http.get<{ contratos?: FndeContrato[] }>(
        '/pnae/contratos',
        { params },
      );
      return response.data?.contratos ?? [];
    } catch (err: unknown) {
      logger.warn('[FNDE] Error fetching PNAE contratos', {
        error: (err as Error).message,
        params,
      });
      // Fallback: retornar vazio sem falhar a ingestão geral
      return [];
    }
  }

  // Lista datasets CKAN do FNDE para download de CSVs
  async listDatasets(query = 'contratos'): Promise<{ id: string; name: string; resources: { url: string; format: string; name: string }[] }[]> {
    try {
      const response = await axios.get<{
        result?: {
          results?: Array<{
            id: string;
            name: string;
            resources?: { url: string; format: string; name: string }[];
          }>;
        };
      }>(
        `${FNDE_CKAN}/api/3/action/package_search`,
        {
          params: { q: query, rows: 10 },
          timeout: 20000,
          headers: { 'User-Agent': 'DigiUrban-Prices/1.0' },
        },
      );

      return (response.data?.result?.results ?? []).map((ds) => ({
        id: ds.id,
        name: ds.name,
        resources: ds.resources ?? [],
      }));
    } catch (err: unknown) {
      logger.warn('[FNDE] Error listing datasets', { error: (err as Error).message });
      return [];
    }
  }

  async ping(): Promise<boolean> {
    try {
      const datasets = await this.listDatasets('pnae');
      return datasets.length > 0;
    } catch {
      return false;
    }
  }
}

let instance: FndeClient | null = null;
export function getFndeClient(): FndeClient {
  if (!instance) instance = new FndeClient();
  return instance;
}
