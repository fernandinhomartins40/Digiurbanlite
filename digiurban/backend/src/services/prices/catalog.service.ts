/**
 * Catálogo de materiais e serviços para achar o código pelo texto.
 * A API oficial só busca por código, então mantemos uma cópia local
 * (price_catalog): famílias de material (PDM, ~20 mil) e serviços (CATSER,
 * ~3 mil) atualizados toda semana; os itens de uma família (CATMAT) são
 * baixados quando alguém abre a família e ficam guardados.
 */

import { prisma } from '../../lib/prisma';
import logger from '../../config/logger.config';
import { catalogPage, materialByCode, materialsOfPdm } from './sources/compras';
import { keywords, matchScore, normalizeText } from './rules';

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
  const rows = await prisma.priceCatalogEntry.findMany({
    where: {
      kind: { in: kinds },
      active: true,
      OR: [
        { AND: words.map((word) => ({ searchText: { contains: word } })) },
        ...(Number.isInteger(code) && code > 0 ? [{ code }] : []),
      ],
    },
    take: 200,
  });
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
