/**
 * Catálogo de materiais e serviços para achar o código pelo texto.
 * A API oficial só busca por código, então mantemos uma cópia local
 * (price_catalog): famílias de material (PDM, ~15 mil), serviços (CATSER,
 * ~3 mil) e TODOS os itens de material (CATMAT, ~250 mil, com a descrição
 * completa: "PAPEL… SULFITE… 297 X 210 MM… 75 G/M2"). É a descrição do item
 * que permite achar o código pelo texto, como fazia o sistema antigo.
 */

import { prisma } from '../../lib/prisma';
import logger from '../../config/logger.config';
import { catalogPage, materialByCode, materialsOfPdm } from './sources/compras';
import { PNCP_MATCH_MIN, keywords, matchScore, normalizeText } from './rules';

export type CatalogKind = 'PDM' | 'MATERIAL' | 'SERVICO';

export interface CatalogHit {
  kind: CatalogKind;
  code: number;
  name: string;
  className: string | null;
  pdmCode: number | null;
}

/** Copia uma lista inteira (PDM ou SERVICO). Devolve quantos itens leu. */
export async function syncCatalogKind(kind: 'PDM' | 'SERVICO'): Promise<number> {
  let page = 1;
  let total = 0;
  for (;;) {
    const data = await catalogPage(kind, page);
    const rows = (data?.resultado || []).map((row: any) => {
      const code = Number(kind === 'PDM' ? row.codigoPdm : row.codigoServico);
      const name = String(kind === 'PDM' ? row.nomePdm : row.nomeServico || '').trim();
      return { kind, code, pdmCode: kind === 'PDM' ? code : null, name, className: row.nomeClasse || null, searchText: normalizeText(`${name} ${row.nomeClasse || ''}`) };
    }).filter((row) => row.code && row.name);
    for (const row of rows) {
      await prisma.priceCatalogEntry.upsert({
        where: { kind_code: { kind, code: row.code } },
        create: row,
        update: { name: row.name, className: row.className, searchText: row.searchText, active: true },
      });
    }
    total += rows.length;
    if (!data || page >= (data.totalPaginas || 1)) break;
    page++;
  }
  logger.info(`[prices] catálogo ${kind}: ${total} itens`);
  return total;
}

export async function catalogSize(): Promise<number> {
  return prisma.priceCatalogEntry.count({ where: { kind: { in: ['PDM', 'SERVICO'] } } });
}

/** Busca por palavras (todas precisam aparecer); o que mais se parece vem primeiro */
export async function searchCatalog(text: string, kind?: 'MATERIAL' | 'SERVICO'): Promise<CatalogHit[]> {
  const words = keywords(text, 5);
  if (!words.length) return [];
  const code = Number(text.trim());
  const kinds: CatalogKind[] = kind === 'SERVICO' ? ['SERVICO'] : kind === 'MATERIAL' ? ['PDM', 'MATERIAL'] : ['PDM', 'MATERIAL', 'SERVICO'];
  const find = (list: string[]) =>
    prisma.priceCatalogEntry.findMany({
      where: {
        kind: { in: kinds },
        active: true,
        OR: [
          { AND: list.map((word) => ({ searchText: { contains: word } })) },
          ...(Number.isInteger(code) && code > 0 ? [{ code }] : []),
        ],
      },
      take: 200,
    });
  // "papel sulfite a4": o catálogo escreve "297 X 210 MM" — sem resultado, tenta só as duas primeiras palavras
  let rows = await find(words);
  if (!rows.length && words.length > 2) rows = await find(words.slice(0, 2));
  return rows
    .map((row) => ({ row, score: matchScore(text, row.name) - row.name.length / 2000 + (row.code === code ? 2 : 0) + (row.kind === 'PDM' ? 0.05 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map(({ row }) => ({ kind: row.kind as CatalogKind, code: row.code, name: row.name, className: row.className, pdmCode: row.pdmCode }));
}

/** Itens (CATMAT) de uma família, ordenados pelo texto procurado; guarda para buscas futuras */
export async function itemsOfFamily(pdm: number, text?: string): Promise<CatalogHit[]> {
  const items = await materialsOfPdm(pdm);
  for (const item of items) {
    await prisma.priceCatalogEntry
      .upsert({
        where: { kind_code: { kind: 'MATERIAL', code: item.code } },
        create: { kind: 'MATERIAL', code: item.code, pdmCode: pdm, name: item.name, className: item.className, searchText: normalizeText(item.name) },
        update: { pdmCode: pdm, name: item.name, className: item.className, searchText: normalizeText(item.name), active: true },
      })
      .catch(() => undefined);
  }
  const hits = items.map((item) => ({ kind: 'MATERIAL' as const, code: item.code, name: item.name, className: item.className, pdmCode: pdm }));
  return text?.trim() ? hits.map((hit) => ({ hit, score: matchScore(text, hit.name) })).sort((a, b) => b.score - a.score).map(({ hit }) => hit) : hits;
}

/** Descrição oficial de um código digitado pelo servidor */
export async function describeCode(kind: 'MATERIAL' | 'SERVICO', code: number): Promise<CatalogHit | null> {
  const local = await prisma.priceCatalogEntry.findFirst({ where: { kind: kind === 'SERVICO' ? 'SERVICO' : 'MATERIAL', code } });
  if (local) return { kind: local.kind as CatalogKind, code: local.code, name: local.name, className: local.className, pdmCode: local.pdmCode };
  if (kind === 'SERVICO') return null;
  const remote = await materialByCode(code).catch(() => null);
  return remote ? { kind: 'MATERIAL', code: remote.code, name: remote.name, className: remote.className, pdmCode: remote.pdmCode } : null;
}

/**
 * Copia todos os itens de material ativos (~500 páginas de 500; a API leva
 * ~10 s por página). Retoma de onde parou se o servidor reiniciar no meio
 * (página guardada em price_source_cache). Só acrescenta itens novos.
 */
export async function syncMaterialItems(fresh = false): Promise<number> {
  const KEY = 'prices:catalog-material-page';
  const saved = fresh ? null : await prisma.priceSourceCache.findUnique({ where: { key: KEY } }).catch(() => null);
  let page = Number((saved?.payload as any)?.next) || 1;
  let total = 0;
  let pages = Infinity;
  while (page <= pages) {
    const batch = [page, page + 1].filter((n) => n <= pages);
    const results = await Promise.all(batch.map((n) => catalogPage('MATERIAL', n)));
    for (const data of results) {
      pages = Math.max(1, Number(data?.totalPaginas) || 1);
      const rows = (data?.resultado || [])
        .map((row: any) => {
          const name = String(row.descricaoItem || '').trim();
          return {
            kind: 'MATERIAL',
            code: Number(row.codigoItem),
            pdmCode: Number(row.codigoPdm) || null,
            name,
            className: row.nomeClasse || null,
            searchText: normalizeText(`${name} ${row.nomePdm || ''}`),
          };
        })
        .filter((row: any) => row.code && row.name);
      if (rows.length) await prisma.priceCatalogEntry.createMany({ data: rows, skipDuplicates: true });
      total += rows.length;
    }
    page += batch.length;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const payload = page > pages ? { next: 1, doneAt: new Date().toISOString() } : { next: page };
    await prisma.priceSourceCache.upsert({ where: { key: KEY }, create: { key: KEY, payload, expiresAt }, update: { payload, expiresAt } });
  }
  logger.info(`[prices] catálogo MATERIAL: ${total} itens lidos`);
  return total;
}

export async function materialItemsCount(): Promise<number> {
  return prisma.priceCatalogEntry.count({ where: { kind: 'MATERIAL' } });
}

export interface GuessedItem extends CatalogHit {
  score: number;
}

/**
 * Sem código escolhido: os itens do catálogo cuja descrição mais se parece com
 * o texto (até 3). A busca nas fontes usa os códigos deles; cada preço leva a
 * semelhança do item (parecido o bastante entra no cálculo com etiqueta).
 */
export async function guessItems(text: string, kind: 'MATERIAL' | 'SERVICO', limit = 3): Promise<GuessedItem[]> {
  const words = keywords(text, 6);
  if (!words.length) return [];
  const where = (list: string[]) => ({
    kind: kind === 'SERVICO' ? 'SERVICO' : 'MATERIAL',
    active: true,
    AND: list.map((word) => ({ searchText: { contains: /^\d+[a-z]+$/.test(word) ? word.replace(/[a-z]+$/, '') : word } })),
  });
  // todas as palavras; sem resultado, as duas primeiras (o nome do produto costuma vir antes)
  let rows = await prisma.priceCatalogEntry.findMany({ where: where(words), take: 300 });
  if (!rows.length && words.length > 2) rows = await prisma.priceCatalogEntry.findMany({ where: where(words.slice(0, 2)), take: 300 });
  return rows
    .map((row) => ({ row, score: matchScore(text, row.name) }))
    .filter((entry) => entry.score >= PNCP_MATCH_MIN)
    .sort((a, b) => b.score - a.score || a.row.name.length - b.row.name.length)
    .slice(0, limit)
    .map(({ row, score }) => ({ kind: row.kind as CatalogKind, code: row.code, name: row.name, className: row.className, pdmCode: row.pdmCode, score }));
}
