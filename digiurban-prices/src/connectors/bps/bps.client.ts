import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const unzipper = require('unzipper');
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import type { BpsItem } from './bps.types';

const BPS_S3_BASE = 'https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/BPS/csv';

export interface BpsResource {
  id: string;
  name: string;
  url: string;
  format: string;
  last_modified?: string;
}

export class BpsClient {
  async listResources(): Promise<BpsResource[]> {
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2010, config.bps.startYear);
    const years: number[] = [];

    for (let year = currentYear; year >= startYear; year -= 1) {
      years.push(year);
    }

    return years.map((year) => ({
      id: `bps_${year}`,
      name: `BPS ${year}`,
      url: `${BPS_S3_BASE}/${year}.csv.zip`,
      format: 'csv',
      last_modified: `${year}-12-31`,
    }));
  }

  async downloadCsv(url: string): Promise<string> {
    const isZip = url.endsWith('.zip');
    const tmpCsv = path.join(os.tmpdir(), `bps_${Date.now()}.csv`);
    logger.info('[BPS] Downloading file', { url, isZip });

    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 300000,
      headers: { 'User-Agent': 'DigiUrban-Prices/1.0' },
    });

    if (isZip) {
      await new Promise<void>((resolve, reject) => {
        const parser: any = unzipper.Parse();
        (response.data as NodeJS.ReadableStream).pipe(parser);
        parser
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
      throw new Error(`[BPS] CSV not found after download: ${url}`);
    }

    logger.info('[BPS] CSV ready', { tmpCsv, size: fs.statSync(tmpCsv).size });
    return tmpCsv;
  }

  async *parseCsvStream(filePath: string): AsyncGenerator<BpsItem> {
    const rl = createInterface({
      input: createReadStream(filePath, { encoding: 'latin1' }),
      crlfDelay: Infinity,
    });

    let headers: string[] = [];
    let lineCount = 0;

    for await (const line of rl) {
      if (lineCount === 0) {
        const sep = line.includes(';') ? ';' : ',';
        headers = line.split(sep).map((header) => header.trim().replace(/^"|"$/g, '').toUpperCase());
        lineCount += 1;
        continue;
      }

      const sep = line.includes(';') ? ';' : ',';
      const values = parseCsvLine(line, sep);
      if (values.length < 2) {
        lineCount += 1;
        continue;
      }

      const item: Record<string, string> = {};
      headers.forEach((header, index) => {
        item[header] = (values[index] ?? '').trim().replace(/^"|"$/g, '');
      });

      lineCount += 1;
      yield item as unknown as BpsItem;
    }

    logger.debug('[BPS] CSV parsed', { lines: lineCount });
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

function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
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
