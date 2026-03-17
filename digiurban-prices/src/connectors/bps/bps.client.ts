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
import { normalizeCsvHeader, normalizeDelimitedValue, parseDelimitedLine } from '../../utils/csv';
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

    const resources = years.map((year) => ({
      id: `bps_${year}`,
      name: `BPS ${year}`,
      url: `${BPS_S3_BASE}/${year}.csv.zip`,
      format: 'csv',
      last_modified: `${year}-12-31`,
    }));

    if (!config.bps.validateResourceExists) {
      return resources;
    }

    const checks = await Promise.all(
      resources.map(async (resource) => ({
        resource,
        exists: await this.resourceExists(resource.url),
      })),
    );

    const available = checks.filter((item) => item.exists).map((item) => item.resource);
    logger.info('[BPS] Resources available', { requested: resources.length, available: available.length });
    return available;
  }

  async downloadCsv(url: string): Promise<string> {
    const isZip = url.endsWith('.zip');
    const tmpCsv = path.join(os.tmpdir(), `bps_${Date.now()}.csv`);
    logger.info('[BPS] Downloading file', { url, isZip });

    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: config.bps.timeoutMs,
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
        headers = parseDelimitedLine(line, sep).map((header) => normalizeCsvHeader(header));
        lineCount += 1;
        continue;
      }

      const sep = line.includes(';') ? ';' : ',';
      const values = parseDelimitedLine(line, sep);
      if (values.length < 2) {
        lineCount += 1;
        continue;
      }

      const item: Record<string, string> = {};
      headers.forEach((header, index) => {
        item[header] = normalizeDelimitedValue(values[index] ?? '');
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

  private async resourceExists(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        timeout: config.bps.probeTimeoutMs,
        headers: { 'User-Agent': 'DigiUrban-Prices/1.0' },
        validateStatus: (status) => status >= 200 && status < 500,
      });
      return response.status >= 200 && response.status < 300;
    } catch (error: unknown) {
      logger.warn('[BPS] Resource probe failed', {
        url,
        error: (error as Error).message,
      });
      return false;
    }
  }
}

let instance: BpsClient | null = null;
export function getBpsClient(): BpsClient {
  if (!instance) instance = new BpsClient();
  return instance;
}
