import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../../utils/logger';
import type {
  CatmatMaterial,
  CatserServico,
  CatmatListResponse,
  CatmatSearchOptions,
} from './catmat.types';

// API de dados abertos do ComprasGov — CATMAT/CATSER
const BASE_URL = 'https://dadosabertos.compras.gov.br/modulo-material';
const BASE_SERVICE_URL = 'https://dadosabertos.compras.gov.br/modulo-servico';

export class CatmatClient {
  private http: AxiosInstance;
  private lastRequestTime = 0;
  private readonly rateLimitMs = 800;

  constructor() {
    this.http = axios.create({
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DigiUrban-Prices/1.0',
      },
    });

    axiosRetry(this.http, {
      retries: 3,
      retryDelay: (n) => n * 1500,
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

  async searchMateriais(options: CatmatSearchOptions = {}): Promise<CatmatMaterial[]> {
    const { q, page = 1, pageSize = 50 } = options;
    const params: Record<string, unknown> = {
      pagina: page,
      tamanhoDaPagina: pageSize,
    };
    if (q) params['descricao'] = q;

    await this.throttle();

    try {
      const response = await this.http.get<CatmatListResponse<CatmatMaterial>>(
        `${BASE_URL}/1-consulta-o-material/materiais`,
        { params },
      );
      return response.data?.resultado ?? [];
    } catch (err: unknown) {
      logger.warn('[CATMAT] Error searching materiais', { error: (err as Error).message });
      return [];
    }
  }

  async searchServicos(options: CatmatSearchOptions = {}): Promise<CatserServico[]> {
    const { q, page = 1, pageSize = 50 } = options;
    const params: Record<string, unknown> = {
      pagina: page,
      tamanhoDaPagina: pageSize,
    };
    if (q) params['descricao'] = q;

    await this.throttle();

    try {
      const response = await this.http.get<CatmatListResponse<CatserServico>>(
        `${BASE_SERVICE_URL}/1-consulta-o-servico/servicos`,
        { params },
      );
      return response.data?.resultado ?? [];
    } catch (err: unknown) {
      logger.warn('[CATMAT] Error searching servicos', { error: (err as Error).message });
      return [];
    }
  }

  // Busca conjunta de materiais + serviços
  async search(options: CatmatSearchOptions): Promise<{ code: string; type: 'material' | 'service'; description: string }[]> {
    const { type = 'both' } = options;
    const results: { code: string; type: 'material' | 'service'; description: string }[] = [];

    if (type === 'material' || type === 'both') {
      const materiais = await this.searchMateriais(options);
      results.push(...materiais.map((m) => ({
        code: m.codigo,
        type: 'material' as const,
        description: m.descricao,
      })));
    }

    if (type === 'service' || type === 'both') {
      const servicos = await this.searchServicos(options);
      results.push(...servicos.map((s) => ({
        code: s.codigo,
        type: 'service' as const,
        description: s.descricao,
      })));
    }

    return results;
  }

  // Busca todas as páginas de materiais (para seed completo)
  async *fetchAllMateriais(maxPages = 500): AsyncGenerator<CatmatMaterial[]> {
    let page = 1;
    while (page <= maxPages) {
      const data = await this.searchMateriais({ page, pageSize: 100 });
      if (!data || data.length === 0) break;
      yield data;
      if (data.length < 100) break;
      page++;
    }
  }

  // Busca todas as páginas de serviços (para seed completo)
  async *fetchAllServicos(maxPages = 200): AsyncGenerator<CatserServico[]> {
    let page = 1;
    while (page <= maxPages) {
      const data = await this.searchServicos({ page, pageSize: 100 });
      if (!data || data.length === 0) break;
      yield data;
      if (data.length < 100) break;
      page++;
    }
  }

  async ping(): Promise<boolean> {
    try {
      const results = await this.searchMateriais({ pageSize: 1 });
      return results.length >= 0;
    } catch {
      return false;
    }
  }
}

let instance: CatmatClient | null = null;
export function getCatmatClient(): CatmatClient {
  if (!instance) instance = new CatmatClient();
  return instance;
}
