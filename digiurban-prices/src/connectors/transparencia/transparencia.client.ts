import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const unzipper = require('unzipper');
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import { normalizeCsvHeader, normalizeDelimitedValue, parseDelimitedLine } from '../../utils/csv';
import type { TransparenciaContrato, TransparenciaFetchOptions } from './transparencia.types';
import { TRANSPARENCIA_ORGAOS_PRINCIPAIS } from './transparencia.types';

type BulkCsvRecord = Record<string, string>;

export class TransparenciaClient {
  private http: AxiosInstance;
  private lastRequestTime = 0;

  constructor() {
    this.http = axios.create({
      baseURL: config.transparencia.baseUrl,
      timeout: config.transparencia.timeoutMs,
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
    if (elapsed < config.transparencia.rateLimitMs) {
      await new Promise((resolve) => setTimeout(resolve, config.transparencia.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private formatDateBR(iso: string): string {
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  }

  async fetchContratos(options: TransparenciaFetchOptions = {}): Promise<TransparenciaContrato[]> {
    if (!config.transparencia.apiKey) {
      logger.debug('[Transparencia] API key not configured, skipping API mode');
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
        logger.info('[Transparencia] API orgao done', { orgao, count: data.length });
        all.push(...data);
      }
    }
    return all;
  }

  async *streamBulkContracts(dataInicio?: string, dataFim?: string): AsyncGenerator<TransparenciaContrato> {
    const csvPath = await this.downloadBulkContractsCsv();

    try {
      const rl = createInterface({
        input: createReadStream(csvPath, { encoding: 'latin1' }),
        crlfDelay: Infinity,
      });

      let headers: string[] = [];
      let lineCount = 0;

      for await (const line of rl) {
        if (lineCount === 0) {
          headers = parseDelimitedLine(line, ';').map((header) => normalizeCsvHeader(header));
          lineCount += 1;
          continue;
        }

        const values = parseDelimitedLine(line, ';');
        if (values.length < 5) {
          lineCount += 1;
          continue;
        }

        const record: BulkCsvRecord = {};
        headers.forEach((header, index) => {
          record[header] = normalizeDelimitedValue(values[index] ?? '');
        });

        const contrato = this.mapBulkRecord(record);
        if (!contrato) {
          lineCount += 1;
          continue;
        }

        const referenceDate = contrato.dataPublicacaoDOU ?? contrato.dataAssinatura ?? contrato.dataInicioVigencia;
        if (referenceDate && !this.isWithinRange(referenceDate, dataInicio, dataFim)) {
          lineCount += 1;
          continue;
        }

        lineCount += 1;
        yield contrato;
      }

      logger.info('[Transparencia] Bulk CSV parsed', { lines: lineCount });
    } finally {
      try {
        fs.unlinkSync(csvPath);
      } catch {
        // ignore cleanup error
      }
    }
  }

  async ping(): Promise<boolean> {
    if (config.transparencia.preferBulkDownload && config.transparencia.bulkZipUrl) {
      try {
        const response = await axios.head(config.transparencia.bulkZipUrl, {
          timeout: config.transparencia.timeoutMs,
          headers: { 'User-Agent': 'DigiUrban-Prices/1.0' },
          validateStatus: (status) => status >= 200 && status < 500,
        });
        return response.status >= 200 && response.status < 300;
      } catch {
        return false;
      }
    }

    if (!config.transparencia.apiKey) return false;

    try {
      await this.throttle();
      const today = new Date().toISOString().split('T')[0];
      await this.fetchContratos({
        codigoOrgao: config.transparencia.orgaosPrincipais[0] ?? TRANSPARENCIA_ORGAOS_PRINCIPAIS[0],
        dataInicio: today,
        dataFim: today,
        page: 1,
      });
      return true;
    } catch {
      return false;
    }
  }

  private async downloadBulkContractsCsv(): Promise<string> {
    if (!config.transparencia.bulkZipUrl) {
      throw new Error('TRANSPARENCIA_BULK_ZIP_URL not configured');
    }

    const tmpZip = path.join(os.tmpdir(), `transparencia_contratos_${Date.now()}.zip`);
    const tmpCsv = path.join(os.tmpdir(), `transparencia_contratos_${Date.now()}.csv`);

    logger.info('[Transparencia] Downloading bulk ZIP', { url: config.transparencia.bulkZipUrl });

    const response = await axios.get(config.transparencia.bulkZipUrl, {
      responseType: 'stream',
      timeout: Math.max(config.transparencia.timeoutMs, 180000),
      headers: { 'User-Agent': 'DigiUrban-Prices/1.0' },
    });

    await new Promise<void>((resolve, reject) => {
      const writer = fs.createWriteStream(tmpZip);
      (response.data as NodeJS.ReadableStream).pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    await new Promise<void>((resolve, reject) => {
      const parser: any = unzipper.Parse();
      fs.createReadStream(tmpZip).pipe(parser);
      parser
        .on('entry', (entry: any) => {
          if (entry.type === 'File' && String(entry.path).toLowerCase().endsWith('.csv')) {
            const writer = fs.createWriteStream(tmpCsv);
            entry.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
            return;
          }

          entry.autodrain();
        })
        .on('error', reject)
        .on('finish', () => {
          if (fs.existsSync(tmpCsv)) {
            resolve();
          }
        });
    });

    try {
      fs.unlinkSync(tmpZip);
    } catch {
      // ignore cleanup error
    }

    if (!fs.existsSync(tmpCsv)) {
      throw new Error('Bulk Transparencia CSV was not extracted');
    }

    return tmpCsv;
  }

  private mapBulkRecord(record: BulkCsvRecord): TransparenciaContrato | null {
    const numeroContrato = record.NUMERO_CONTRATO || '';
    const codigoUnidadeGestora = record.CODIGO_UNIDADE_GESTORA || '';

    if (!numeroContrato || !codigoUnidadeGestora || !record.OBJETO) {
      return null;
    }

    const supplierDocument = this.normalizeDigits(record.CPF_OU_CNPJ);
    const id = `bulk_${codigoUnidadeGestora}_${numeroContrato}_${supplierDocument ?? 'sem_fornecedor'}`
      .replace(/[^a-z0-9_]/gi, '_');

    return {
      id,
      numero: numeroContrato,
      numeroProcesso: record.NUMERO_PROCESSO || undefined,
      objeto: record.OBJETO,
      fundamentoLegal: record.FUNDAMENTO_LEGAL || undefined,
      situacaoContrato: record.SITUACAO_CONTRATO || undefined,
      valorInicialCompra: this.parseBrazilianNumber(record.VALOR_CONTRATO),
      valorFinalCompra: this.parseBrazilianNumber(record.VALOR_CONTRATO),
      dataAssinatura: this.normalizeIsoDate(record.DATA_PUBLICACAO_DOU) ?? this.normalizeIsoDate(record.INICIO_VIGENCIA),
      dataPublicacaoDOU: this.normalizeIsoDate(record.DATA_PUBLICACAO_DOU),
      dataInicioVigencia: this.normalizeIsoDate(record.INICIO_VIGENCIA),
      dataFimVigencia: this.normalizeIsoDate(record.FIM_VIGENCIA),
      modalidadeCompra: record.MODALIDADE_LICITACAO || undefined,
      unidadeGestora: {
        codigo: codigoUnidadeGestora,
        nome: record.NOME_UNIDADE_GESTORA || 'Unidade Gestora Federal',
        orgaoVinculado: {
          codigoSIAFI: record.CODIGO_ORGAO || undefined,
          nome: record.NOME_ORGAO || undefined,
        },
        orgaoMaximo: {
          codigo: record.CODIGO_ORGAO_SUPERIOR || undefined,
          nome: record.NOME_ORGAO_SUPERIOR || undefined,
        },
      },
      fornecedor: {
        cnpjFormatado: supplierDocument ?? undefined,
        nome: record.NOME_EMPRESA || undefined,
      },
    };
  }

  private parseBrazilianNumber(value?: string): number | undefined {
    if (!value) return undefined;

    const normalized = value
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private normalizeIsoDate(value?: string): string | undefined {
    if (!value) return undefined;
    const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : undefined;
  }

  private normalizeDigits(value?: string): string | null {
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    return digits.length > 0 ? digits : null;
  }

  private isWithinRange(referenceDate: string, dataInicio?: string, dataFim?: string): boolean {
    if (!referenceDate) return true;
    if (dataInicio && referenceDate < dataInicio) return false;
    if (dataFim && referenceDate > dataFim) return false;
    return true;
  }
}

let instance: TransparenciaClient | null = null;
export function getTransparenciaClient(): TransparenciaClient {
  if (!instance) instance = new TransparenciaClient();
  return instance;
}
