import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const unzipper = require('unzipper');
import { logger } from '../../utils/logger';
import type { BpsItem } from './bps.types';

// BPS — Banco de Preços em Saúde (Ministério da Saúde)
// Portal migrou para: https://dadosabertos.saude.gov.br/dataset/bps
// Arquivos CSV hospedados no S3: s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/BPS/csv/[ANO].csv.zip
// Anos disponíveis: 2020-2025 (atualização trimestral)

const BPS_S3_BASE = 'https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/BPS/csv';
const BPS_AVAILABLE_YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

export interface BpsResource {
  id: string;
  name: string;
  url: string;
  format: string;
  last_modified?: string;
}

export class BpsClient {
  // Lista os recursos CSV direto do S3 (um por ano, 2020-2025)
  async listResources(): Promise<BpsResource[]> {
    const currentYear = new Date().getFullYear();
    const years = BPS_AVAILABLE_YEARS.filter((y) => y <= currentYear);
    return years.map((year) => ({
      id: `bps_${year}`,
      name: `BPS ${year}`,
      url: `${BPS_S3_BASE}/${year}.csv.zip`,
      format: 'csv',
      last_modified: `${year}-12-31`,
    }));
  }

  // Baixa CSV ou ZIP contendo CSV para arquivo temporário e retorna o path do CSV
  async downloadCsv(url: string): Promise<string> {
    const isZip = url.endsWith('.zip');
    const tmpCsv = path.join(os.tmpdir(), `bps_${Date.now()}.csv`);
    logger.info('[BPS] Baixando arquivo', { url, isZip });

    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 300000, // 5 min — arquivos grandes
      headers: { 'User-Agent': 'DigiUrban-Prices/1.0' },
    });

    if (isZip) {
      // Descompactar ZIP em memória e extrair o primeiro .csv
      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parser: any = unzipper.Parse();
        (response.data as NodeJS.ReadableStream).pipe(parser);
        parser
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on('entry', (entry: any) => {
            if (entry.type === 'File' && (entry.path as string).toLowerCase().endsWith('.csv')) {
              const writer = fs.createWriteStream(tmpCsv);
              entry.pipe(writer);
              writer.on('finish', resolve);
              writer.on('error', reject);
            } else {
              entry.autodrain();
            }
          })
          .on('error', reject)
          .on('finish', () => {
            if (!fs.existsSync(tmpCsv)) resolve();
          });
      });
    } else {
      await new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(tmpCsv);
        (response.data as NodeJS.ReadableStream).pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    }

    if (!fs.existsSync(tmpCsv)) {
      throw new Error(`[BPS] Arquivo CSV não encontrado após download: ${url}`);
    }

    logger.info('[BPS] CSV pronto', { tmpCsv, size: fs.statSync(tmpCsv).size });
    return tmpCsv;
  }

  // Parseia CSV linha a linha (streaming para não explodir a memória)
  async *parseCsvStream(filePath: string): AsyncGenerator<BpsItem> {
    const rl = createInterface({
      input: createReadStream(filePath, { encoding: 'latin1' }),
      crlfDelay: Infinity,
    });

    let headers: string[] = [];
    let lineCount = 0;

    for await (const line of rl) {
      if (lineCount === 0) {
        // Cabeçalho — detectar separador
        const sep = line.includes(';') ? ';' : ',';
        headers = line.split(sep).map((h) => h.trim().replace(/^"|"$/g, '').toUpperCase());
        lineCount++;
        continue;
      }

      // Detectar separador da linha de dados
      const sep = line.includes(';') ? ';' : ',';
      const values = parseCsvLine(line, sep);
      if (values.length < 2) { lineCount++; continue; }

      const item: Record<string, string> = {};
      headers.forEach((h, i) => {
        item[h] = (values[i] ?? '').trim().replace(/^"|"$/g, '');
      });

      lineCount++;
      yield item as unknown as BpsItem;
    }

    logger.debug('[BPS] CSV parseado', { lines: lineCount });
  }

  async ping(): Promise<boolean> {
    try {
      const resources = await this.listResources();
      return resources.length > 0;
    } catch {
      return false;
    }
  }
}

// Parse simples de linha CSV com suporte a aspas
function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

let instance: BpsClient | null = null;
export function getBpsClient(): BpsClient {
  if (!instance) instance = new BpsClient();
  return instance;
}
