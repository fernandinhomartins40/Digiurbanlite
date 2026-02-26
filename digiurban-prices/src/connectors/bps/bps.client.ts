import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { logger } from '../../utils/logger';
import type { BpsItem } from './bps.types';

// BPS — Banco de Preços em Saúde (Ministério da Saúde)
// Dados públicos CSV em: https://opendatasus.saude.gov.br/dataset/bps
// CKAN API para listar datasets e recursos

const CKAN_BASE = 'https://opendatasus.saude.gov.br';
const BPS_DATASET_ID = 'bps';

export interface BpsResource {
  id: string;
  name: string;
  url: string;
  format: string;
  last_modified?: string;
}

export class BpsClient {
  // Lista os recursos CSV do dataset BPS
  async listResources(): Promise<BpsResource[]> {
    try {
      const response = await axios.get<{
        result?: { resources?: BpsResource[] };
      }>(
        `${CKAN_BASE}/api/3/action/package_show?id=${BPS_DATASET_ID}`,
        { timeout: 30000, headers: { 'User-Agent': 'DigiUrban-Prices/1.0' } },
      );
      const resources = response.data?.result?.resources ?? [];
      return resources.filter((r) => r.format?.toLowerCase() === 'csv' || r.url?.endsWith('.csv'));
    } catch (err: unknown) {
      logger.warn('[BPS] Erro ao listar recursos', { error: (err as Error).message });
      return [];
    }
  }

  // Baixa CSV para arquivo temporário e retorna o path
  async downloadCsv(url: string): Promise<string> {
    const tmpFile = path.join(os.tmpdir(), `bps_${Date.now()}.csv`);
    logger.info('[BPS] Baixando CSV', { url, tmpFile });

    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 120000,
      headers: { 'User-Agent': 'DigiUrban-Prices/1.0' },
    });

    await new Promise<void>((resolve, reject) => {
      const writer = fs.createWriteStream(tmpFile);
      (response.data as NodeJS.ReadableStream).pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    logger.info('[BPS] CSV baixado', { tmpFile, size: fs.statSync(tmpFile).size });
    return tmpFile;
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
