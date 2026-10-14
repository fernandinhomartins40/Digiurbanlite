/**
 * Banco de Preços em Saúde (Ministério da Saúde) — arquivos anuais em
 * https://dadosabertos.saude.gov.br/dataset/bps. Endereço conferido em
 * 2026-10-14: .../BPS/csv/{ano}_csv.zip (o antigo {ano}.csv.zip é uma cópia
 * PARADA de ago/2025 — não usar). Atualizado todo dia; a rotina copia o ano
 * atual e o anterior para price_bps (≈ 10 a 30 mil linhas por ano).
 */

import * as zlib from 'zlib';
import { prisma } from '../../../lib/prisma';
import { sourceHttp } from '../http';
import { quoteBase } from '../rules';
import type { RawQuote } from './types';

export const BPS_URL = (year: number) => `https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/BPS/csv/${year}_csv.zip`;

/** Primeiro arquivo de um .zip (sem biblioteca: diretório central + inflate) */
export function unzipFirst(buffer: Buffer): Buffer {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65_557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('arquivo zip inválido');
  const central = buffer.readUInt32LE(eocd + 16);
  if (buffer.readUInt32LE(central) !== 0x02014b50) throw new Error('zip sem diretório central');
  const method = buffer.readUInt16LE(central + 10);
  const compressed = buffer.readUInt32LE(central + 20);
  const local = buffer.readUInt32LE(central + 42);
  const nameLength = buffer.readUInt16LE(local + 26);
  const extraLength = buffer.readUInt16LE(local + 28);
  const start = local + 30 + nameLength + extraLength;
  const data = buffer.subarray(start, start + compressed);
  if (method === 0) return Buffer.from(data);
  if (method === 8) return zlib.inflateRawSync(data);
  throw new Error(`zip com compressão ${method} não suportada`);
}

/** CSV com ";" e aspas (campo pode ter ";" e quebra de linha dentro das aspas) */
export function parseCsv(text: string, separator = ';'): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === separator) { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

const num = (value: string | undefined) => {
  const text = String(value || '').trim();
  if (!text) return null;
  const n = Number(text.includes(',') && !text.includes('.') ? text.replace(',', '.') : text);
  return Number.isFinite(n) ? n : null;
};

const brDate = (value: string | undefined) => {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? new Date(`${match[3]}-${match[2]}-${match[1]}T12:00:00Z`) : null;
};

export interface BpsRow {
  id: string;
  year: number;
  catmat: number | null;
  pdmCode: number | null;
  description: string;
  uf: string | null;
  sphere: string | null;
  institution: string | null;
  city: string | null;
  purchaseDate: Date | null;
  supplyUnit: string | null;
  capacity: number | null;
  measureUnit: string | null;
  quantity: number | null;
  unitPrice: number;
  supplier: string | null;
  modality: string | null;
}

export function bpsRowsFromCsv(text: string, year: number): BpsRow[] {
  const [header, ...lines] = parseCsv(text.replace(/^﻿/, ''));
  if (!header) return [];
  const col = (name: string) => header.findIndex((value) => value.trim().toLowerCase() === name);
  const at = {
    id: col('co_seq_bps'), catmat: col('co_catmat'), pdm: col('co_pdm'), item: col('ds_item'), uf: col('sg_uf'), esfera: col('ds_esfera'),
    inst: col('no_instituicao'), city: col('no_municipio'), date: col('dt_compra'), supply: col('un_fornecimento'), cap: col('vl_capacidade'),
    measure: col('sg_unidade_medida'), qty: col('qt_medicamento'), price: col('vl_preco_unitario'), supplier: col('no_fornecedor'), modality: col('modalidade'),
  };
  if (at.id < 0 || at.price < 0 || at.item < 0) throw new Error('colunas do BPS mudaram');
  const out: BpsRow[] = [];
  for (const line of lines) {
    const price = num(line[at.price]);
    const id = String(line[at.id] || '').trim();
    if (!id || !price || price <= 0) continue;
    const esfera = String(line[at.esfera] || '').toUpperCase();
    out.push({
      id,
      year,
      catmat: num(line[at.catmat]),
      pdmCode: num(line[at.pdm]),
      description: String(line[at.item] || '').trim(),
      uf: line[at.uf]?.trim() || null,
      sphere: esfera.startsWith('FED') ? 'F' : esfera.startsWith('EST') ? 'E' : esfera.startsWith('MUN') ? 'M' : null,
      institution: line[at.inst]?.trim() || null,
      city: line[at.city]?.trim() || null,
      purchaseDate: brDate(line[at.date]),
      supplyUnit: line[at.supply]?.trim() || null,
      capacity: num(line[at.cap]),
      measureUnit: line[at.measure]?.trim() || null,
      quantity: num(line[at.qty]),
      unitPrice: price,
      supplier: line[at.supplier]?.trim() || null,
      modality: line[at.modality]?.trim() || null,
    });
  }
  return out;
}

/** Copia um ano do BPS para o banco (substitui o ano inteiro). Devolve as linhas gravadas. */
export async function importBpsYear(year: number): Promise<number> {
  const response = await sourceHttp.get<ArrayBuffer>(BPS_URL(year), { responseType: 'arraybuffer', timeout: 180_000 });
  const csv = unzipFirst(Buffer.from(response.data)).toString('utf8');
  const rows = bpsRowsFromCsv(csv, year);
  if (!rows.length) return 0;
  await prisma.$transaction(async (tx) => {
    await tx.priceBpsEntry.deleteMany({ where: { year } });
    for (let i = 0; i < rows.length; i += 1000) {
      await tx.priceBpsEntry.createMany({ data: rows.slice(i, i + 1000), skipDuplicates: true });
    }
  }, { timeout: 180_000 });
  return rows.length;
}

/**
 * Preços do BPS para um CATMAT. O preço do BPS é por unidade de fornecimento
 * (frasco, comprimido...): compara pela própria unidade, sem converter.
 */
export async function bpsPrices(catmat: number): Promise<RawQuote[]> {
  const since = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000);
  const rows = await prisma.priceBpsEntry.findMany({
    where: { catmat, OR: [{ purchaseDate: { gte: since } }, { purchaseDate: null }] },
    orderBy: { purchaseDate: 'desc' },
    take: 400,
  });
  return rows.map((row) => {
    const unit = { unitPrice: row.unitPrice, unitLabel: row.supplyUnit, capacity: null, measureUnit: null };
    return {
      source: 'BPS' as const,
      sourceRef: row.id,
      sourceUrl: 'https://dadosabertos.saude.gov.br/dataset/bps',
      description: row.description,
      buyer: row.institution,
      buyerCity: row.city,
      buyerUf: row.uf,
      sphere: row.sphere,
      supplier: row.supplier,
      supplierDoc: null,
      brand: null,
      date: row.purchaseDate,
      quantity: row.quantity,
      ...unit,
      ...quoteBase(unit),
    };
  });
}
