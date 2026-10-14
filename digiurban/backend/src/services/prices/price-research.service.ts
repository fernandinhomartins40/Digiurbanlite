/**
 * Pesquisa de preços (IN 65/2021): itens, busca nas fontes oficiais, decisão
 * do servidor sobre cada preço e documento do processo interno.
 *
 * Quem vê: quem criou, coordenador para cima, e quem enxerga o processo ligado.
 * Gerar o documento exige poder agir no processo (mesma regra das etapas).
 * A busca roda em segundo plano (as fontes levam ~10 s por chamada); a tela
 * pergunta o andamento a cada poucos segundos.
 */

import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../../lib/prisma';
import { runAsTenant, tryGetTenantId } from '../../lib/tenant-context';
import { getTenantUploadDir } from '../../config/upload';
import logger from '../../config/logger.config';
import { buildActor, InternalProcessError } from '../internal-process/internal-process.service';
import { createDocument, loadProcessFor, updateFields } from '../internal-process/flows/flow.service';
import {
  AutoFlag,
  PriceMethod,
  QuoteSource,
  SOURCE_INFO,
  buildDocumentTexts,
  dominantBaseUnit,
  dominantCapacity,
  flagQuotes,
  matchScore,
  normalizeUnit,
  quoteBase,
  summarizeItem,
} from './rules';
import { arpPrices, materialPrices, servicePrices } from './sources/compras';
import { guessItems } from './catalog.service';
import { bpsPrices } from './sources/bps';
import { pncpPrices } from './sources/pncp';
import { ipcaRates } from './sources/ipca';
import type { RawQuote } from './sources/types';

export class PriceResearchError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface PriceActor {
  id: string;
  role: string;
  name: string;
}

const MANAGERS = ['COORDINATOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
const METHODS: PriceMethod[] = ['MEDIANA', 'MEDIA', 'MENOR'];
const MANUAL_SOURCES: QuoteSource[] = ['FORNECEDOR', 'NOTA_FISCAL', 'OUTRO'];
const STALE_SEARCH_MS = 6 * 60 * 1000;
const MAX_PER_SOURCE: Partial<Record<QuoteSource, number>> = { COMPRAS: 300, ARP: 100, BPS: 200 };

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const positive = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// ─── acesso ───────────────────────────────────────────────────────────────

async function canSeeProcess(actor: PriceActor, processId: string): Promise<boolean> {
  try {
    await loadProcessFor(await buildActor(actor), processId, false);
    return true;
  } catch {
    return false;
  }
}

async function loadResearch(actor: PriceActor, id: string) {
  const research = await prisma.priceResearch.findFirst({ where: { id } });
  if (!research) throw new PriceResearchError('Pesquisa não encontrada', 404);
  const allowed =
    research.createdById === actor.id || MANAGERS.includes(actor.role) || (research.processId ? await canSeeProcess(actor, research.processId) : false);
  if (!allowed) throw new PriceResearchError('Pesquisa não encontrada', 404);
  return research;
}

async function loadItem(actor: PriceActor, itemId: string) {
  const item = await prisma.priceResearchItem.findFirst({ where: { id: itemId } });
  if (!item) throw new PriceResearchError('Item não encontrado', 404);
  const research = await loadResearch(actor, item.researchId);
  return { item, research };
}

async function loadQuote(actor: PriceActor, quoteId: string) {
  const quote = await prisma.priceQuote.findFirst({ where: { id: quoteId } });
  if (!quote) throw new PriceResearchError('Preço não encontrado', 404);
  const { item, research } = await loadItem(actor, quote.itemId);
  return { quote, item, research };
}

const assertOpen = (research: { status: string }) => {
  if (research.status === 'CONCLUIDA') throw new PriceResearchError('Pesquisa concluída: reabra para alterar.');
};

// ─── pesquisa ─────────────────────────────────────────────────────────────

export async function listResearches(actor: PriceActor, filters: { processId?: string; search?: string }) {
  const where: any = {};
  if (filters.processId) where.processId = filters.processId;
  if (filters.search?.trim()) where.title = { contains: filters.search.trim(), mode: 'insensitive' };
  if (!MANAGERS.includes(actor.role) && !filters.processId) where.createdById = actor.id;
  if (filters.processId && !(await canSeeProcess(actor, filters.processId)) && !MANAGERS.includes(actor.role)) where.createdById = actor.id;
  const rows = await prisma.priceResearch.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: { _count: { select: { items: true } } },
  });
  return rows.map(({ _count, ...row }) => ({ ...row, itemCount: _count.items }));
}

interface ItemInput {
  description?: unknown;
  kind?: unknown;
  catalogCode?: unknown;
  catalogName?: unknown;
  unit?: unknown;
  baseUnit?: unknown;
  unitCapacity?: unknown;
  quantity?: unknown;
  justification?: unknown;
}

function itemData(input: ItemInput, partial: boolean) {
  const data: Record<string, any> = {};
  if (!partial || input.description !== undefined) {
    const description = text(input.description, 2000);
    if (!description) throw new PriceResearchError('Descreva o item.');
    data.description = description;
  }
  if (input.kind !== undefined) data.kind = input.kind === 'SERVICO' ? 'SERVICO' : 'MATERIAL';
  if (input.catalogCode !== undefined) {
    const code = Number(input.catalogCode);
    data.catalogCode = Number.isInteger(code) && code > 0 ? code : null;
    if (!data.catalogCode) data.catalogName = null;
  }
  if (input.catalogName !== undefined && data.catalogName !== null) data.catalogName = text(input.catalogName, 2000) || null;
  if (input.unit !== undefined) data.unit = normalizeUnit(text(input.unit, 30)) || 'UN';
  if (input.baseUnit !== undefined) data.baseUnit = normalizeUnit(text(input.baseUnit, 30)) || null;
  if (input.unitCapacity !== undefined) data.unitCapacity = positive(input.unitCapacity, 1);
  if (input.quantity !== undefined) data.quantity = positive(input.quantity, 1);
  if (input.justification !== undefined) data.justification = text(input.justification, 4000) || null;
  return data;
}

export async function createResearch(actor: PriceActor, input: { title?: unknown; processId?: unknown; items?: ItemInput[] }) {
  const processId = text(input.processId, 60) || null;
  let title = text(input.title, 300);
  if (processId) {
    const process = await loadProcessFor(await buildActor(actor), processId, false).catch(() => null);
    if (!process) throw new PriceResearchError('Processo não encontrado', 404);
    if (!title) title = `${process.number} — ${process.subject}`.slice(0, 300);
  }
  if (!title) throw new PriceResearchError('Dê um nome à pesquisa (o objeto da compra).');
  const tenantId = tryGetTenantId() || null;
  const tenant = tenantId ? await prisma.tenant.findFirst({ where: { id: tenantId }, select: { ufMunicipio: true } }).catch(() => null) : null;
  const items = (Array.isArray(input.items) ? input.items : []).slice(0, 200).map((item, index) => ({ ...itemData(item, false), position: index + 1, tenantId }));
  return prisma.priceResearch.create({
    data: {
      title,
      processId,
      uf: tenant?.ufMunicipio || null,
      createdById: actor.id,
      createdByName: actor.name,
      // a extension não injeta tenantId em gravação aninhada
      items: items.length ? { create: items as any } : undefined,
    },
  });
}

export async function getResearch(actor: PriceActor, id: string) {
  const research = await loadResearch(actor, id);
  const items = await prisma.priceResearchItem.findMany({
    where: { researchId: id },
    orderBy: { position: 'asc' },
    include: { quotes: { orderBy: [{ included: 'desc' }, { date: 'desc' }] } },
  });
  const rates = research.applyIpca ? await ipcaRates() : [];
  const now = Date.now();
  const shaped = items.map((item) => {
    const stale = item.searchStatus === 'BUSCANDO' && now - item.updatedAt.getTime() > STALE_SEARCH_MS;
    const summary = summarizeItem(item, item.quotes.map((quote) => ({ ...quote, source: quote.source as QuoteSource })), research.method as PriceMethod, rates);
    return {
      ...item,
      searchStatus: stale ? 'ERRO' : item.searchStatus,
      searchMessage: stale ? 'A busca demorou demais. Tente de novo.' : item.searchMessage,
      summary,
      quotes: item.quotes.map((quote) => ({ ...quote, attachmentPath: undefined, hasAttachment: !!quote.attachmentPath })),
    };
  });
  const total = Math.round(shaped.reduce((sum, item) => sum + (item.summary.total || 0), 0) * 100) / 100;
  let process: { id: string; number: string; subject: string } | null = null;
  if (research.processId) {
    const row = await prisma.internalProcess.findFirst({ where: { id: research.processId }, select: { id: true, number: true, subject: true } });
    process = row || null;
  }
  return { ...research, process, items: shaped, total, ipcaAvailable: rates.length > 0 };
}

export async function updateResearch(actor: PriceActor, id: string, input: Record<string, unknown>) {
  const research = await loadResearch(actor, id);
  const data: Record<string, any> = {};
  if (input.status === 'RASCUNHO') data.status = 'RASCUNHO'; // reabrir
  else assertOpen(research);
  if (input.title !== undefined) {
    const title = text(input.title, 300);
    if (!title) throw new PriceResearchError('Dê um nome à pesquisa.');
    data.title = title;
  }
  if (METHODS.includes(input.method as PriceMethod)) data.method = input.method;
  if (typeof input.applyIpca === 'boolean') data.applyIpca = input.applyIpca;
  if (typeof input.nationwide === 'boolean') data.nationwide = input.nationwide;
  if (input.uf !== undefined) data.uf = /^[A-Z]{2}$/.test(String(input.uf || '').toUpperCase()) ? String(input.uf).toUpperCase() : null;
  if (input.notes !== undefined) data.notes = text(input.notes, 4000) || null;
  return prisma.priceResearch.update({ where: { id }, data });
}

export async function deleteResearch(actor: PriceActor, id: string) {
  const research = await loadResearch(actor, id);
  if (research.createdById !== actor.id && !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) throw new PriceResearchError('Só quem criou pode apagar.', 403);
  const quotes = await prisma.priceQuote.findMany({ where: { item: { researchId: id }, attachmentPath: { not: null } }, select: { attachmentPath: true } });
  await prisma.priceResearch.delete({ where: { id } });
  for (const quote of quotes) if (quote.attachmentPath) fs.promises.unlink(quote.attachmentPath).catch(() => undefined);
}

// ─── itens ────────────────────────────────────────────────────────────────

export async function addItem(actor: PriceActor, researchId: string, input: ItemInput) {
  const research = await loadResearch(actor, researchId);
  assertOpen(research);
  const last = await prisma.priceResearchItem.findFirst({ where: { researchId }, orderBy: { position: 'desc' }, select: { position: true } });
  return prisma.priceResearchItem.create({ data: { ...(itemData(input, false) as any), researchId, position: (last?.position || 0) + 1 } });
}

export async function updateItem(actor: PriceActor, itemId: string, input: ItemInput) {
  const { item, research } = await loadItem(actor, itemId);
  assertOpen(research);
  const data = itemData(input, true);
  const updated = await prisma.priceResearchItem.update({ where: { id: itemId }, data });
  // trocou a unidade de comparação: remarca os preços (sem desfazer decisões do servidor)
  if (data.baseUnit !== undefined && data.baseUnit !== item.baseUnit) await reflag(updated.id, updated.baseUnit);
  return updated;
}

export async function deleteItem(actor: PriceActor, itemId: string) {
  const { research } = await loadItem(actor, itemId);
  assertOpen(research);
  await prisma.priceResearchItem.delete({ where: { id: itemId } });
}

async function reflag(itemId: string, baseUnit: string | null) {
  const item = await prisma.priceResearchItem.findFirst({ where: { id: itemId }, select: { description: true, catalogCode: true } });
  const quotes = await prisma.priceQuote.findMany({ where: { itemId } });
  // achado pelo texto = PNCP, ou qualquer fonte quando o código não foi escolhido: a semelhança é recalculada
  const byText = (quote: { source: string; manual: boolean }) => !quote.manual && (quote.source === 'PNCP' || !item?.catalogCode);
  const flagged = flagQuotes(
    quotes.map((quote) => ({ ...quote, source: quote.source as QuoteSource, matchScore: byText(quote) ? matchScore(item?.description || '', quote.description) : null })),
    baseUnit
  );
  for (const quote of flagged) {
    if (quote.decidedById) continue;
    await prisma.priceQuote.update({ where: { id: quote.id }, data: { autoFlag: quote.autoFlag, included: quote.included, excludedReason: quote.excludedReason } });
  }
}

// ─── busca nas fontes ─────────────────────────────────────────────────────

/** Marca o item como "buscando" e roda a busca em segundo plano */
export async function startSearch(actor: PriceActor, itemId: string) {
  const { item, research } = await loadItem(actor, itemId);
  assertOpen(research);
  if (item.searchStatus === 'BUSCANDO' && Date.now() - item.updatedAt.getTime() < STALE_SEARCH_MS) return item;
  const updated = await prisma.priceResearchItem.update({ where: { id: itemId }, data: { searchStatus: 'BUSCANDO', searchMessage: null } });
  const tenantId = tryGetTenantId();
  const run = () => runSearch(itemId).catch((error) => logger.error('[prices] busca falhou', { itemId, error: String(error?.message || error) }));
  setImmediate(() => (tenantId ? runAsTenant(tenantId, run) : run()));
  return updated;
}

async function collect(label: string, fn: () => Promise<RawQuote[]>, failures: string[]): Promise<RawQuote[]> {
  try {
    return await fn();
  } catch (error: any) {
    failures.push(`${label} (${error?.message || 'sem resposta'})`);
    return [];
  }
}

export async function runSearch(itemId: string): Promise<void> {
  const item = await prisma.priceResearchItem.findFirst({ where: { id: itemId }, include: { research: true } });
  if (!item) return;
  try {
    const failures: string[] = [];
    const code = item.catalogCode;
    const uf = item.research.nationwide ? null : item.research.uf;
    const isService = item.kind === 'SERVICO';
    const tasks: Array<Promise<RawQuote[]>> = [
      collect('PNCP', () => pncpPrices(item.description, isService ? 'SERVICO' : 'MATERIAL', uf), failures),
    ];
    let families: string[] = [];
    if (code) {
      tasks.push(collect('Compras.gov.br', () => (isService ? servicePrices(code) : materialPrices(code)), failures));
      if (!isService) {
        tasks.push(collect('Atas de registro de preços', () => arpPrices(code), failures));
        tasks.push(collect('Banco de Preços em Saúde', () => bpsPrices(code), failures));
      }
    } else {
      // sem código: os itens do catálogo mais parecidos com o texto (como o sistema antigo)
      const guessed = await guessItems(item.description, isService ? 'SERVICO' : 'MATERIAL').catch(() => []);
      families = guessed.map((hit) => `${hit.code}`);
      for (const hit of guessed) {
        const tag = (rows: RawQuote[]) => rows.map((row) => ({ ...row, matchScore: hit.score }));
        tasks.push(collect('Compras.gov.br', async () => tag(isService ? await servicePrices(hit.code, 1) : await materialPrices(hit.code, 1)), failures));
        if (!isService) {
          tasks.push(collect('Atas de registro de preços', async () => tag(await arpPrices(hit.code)), failures));
          tasks.push(collect('Banco de Preços em Saúde', async () => tag(await bpsPrices(hit.code)), failures));
        }
      }
    }
    const raw = (await Promise.all(tasks)).flat();

    // um preço por compra/fonte; as fontes maiores ficam com os mais recentes
    const seen = new Set<string>();
    const bySource = new Map<QuoteSource, RawQuote[]>();
    for (const quote of raw.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))) {
      const key = `${quote.source}:${quote.sourceRef || quote.description}:${quote.unitPrice}`;
      if (seen.has(key) || !(quote.unitPrice > 0)) continue;
      seen.add(key);
      const list = bySource.get(quote.source) || [];
      if (list.length < (MAX_PER_SOURCE[quote.source] || Infinity)) list.push(quote);
      bySource.set(quote.source, list);
    }
    const quotes = [...bySource.values()].flat();

    // unidade de comparação: a do servidor ou a que mais aparece nos preços oficiais
    const official = quotes.filter((quote) => quote.source === 'COMPRAS' || quote.source === 'BPS');
    const baseUnit = item.baseUnit || dominantBaseUnit(official.length ? official : quotes);
    const unitCapacity = item.baseUnit ? item.unitCapacity : baseUnit ? dominantCapacity(official.length ? official : quotes, baseUnit) : 1;
    const flagged = flagQuotes(quotes.map((quote) => ({ ...quote, manual: false })), baseUnit);

    const kept = await prisma.priceQuote.findMany({ where: { itemId, OR: [{ manual: true }, { decidedById: { not: null } }] } });
    const keptKeys = new Set(kept.map((quote) => `${quote.source}:${quote.sourceRef}`));
    const tenantId = item.tenantId;
    await prisma.$transaction([
      prisma.priceQuote.deleteMany({ where: { itemId, manual: false, decidedById: null } }),
      prisma.priceQuote.createMany({
        data: flagged
          .filter((quote) => !keptKeys.has(`${quote.source}:${quote.sourceRef}`))
          .map((quote) => ({
            tenantId,
            itemId,
            source: quote.source,
            sourceRef: quote.sourceRef,
            sourceUrl: quote.sourceUrl,
            description: quote.description.slice(0, 4000),
            buyer: quote.buyer,
            buyerCity: quote.buyerCity,
            buyerUf: quote.buyerUf,
            sphere: quote.sphere,
            supplier: quote.supplier,
            supplierDoc: quote.supplierDoc,
            brand: quote.brand,
            date: quote.date,
            quantity: quote.quantity,
            unitLabel: quote.unitLabel,
            capacity: quote.capacity,
            measureUnit: quote.measureUnit,
            unitPrice: quote.unitPrice,
            baseUnit: quote.baseUnit,
            basePrice: quote.basePrice,
            included: quote.included,
            autoFlag: quote.autoFlag,
            excludedReason: quote.excludedReason,
          })),
      }),
      prisma.priceResearchItem.update({
        where: { id: itemId },
        data: {
          baseUnit,
          unitCapacity,
          searchStatus: 'PRONTO',
          searchedAt: new Date(),
          searchMessage: [
            `${flagged.length} preço(s) encontrado(s), ${flagged.filter((quote) => quote.included).length} no cálculo.`,
            !code
              ? families.length
                ? `Sem código escolhido: buscamos pela descrição no PNCP e nos itens do catálogo mais parecidos (${isService ? 'CATSER' : 'CATMAT'} ${families.join(', ')}) no Compras.gov.br${isService ? '' : ', nas atas e no BPS'}. Para mais precisão, escolha o código.`
                : 'Sem código escolhido: buscamos pela descrição só no PNCP (nenhum item do catálogo parecido). Escolha o código para buscar também no Compras.gov.br, nas atas e no BPS.'
              : '',
            failures.length ? `Não responderam agora: ${failures.join('; ')}.` : '',
          ].filter(Boolean).join(' '),
        },
      }),
    ]);
  } catch (error: any) {
    logger.error('[prices] erro na busca', { itemId, error: String(error?.message || error) });
    await prisma.priceResearchItem
      .update({ where: { id: itemId }, data: { searchStatus: 'ERRO', searchMessage: 'Não foi possível buscar agora. Tente de novo em alguns minutos.' } })
      .catch(() => undefined);
  }
}

// ─── decisões sobre cada preço ────────────────────────────────────────────

export async function decideQuote(actor: PriceActor, quoteId: string, input: { included?: unknown; reason?: unknown }) {
  const { research } = await loadQuote(actor, quoteId);
  assertOpen(research);
  const included = input.included === true;
  const reason = text(input.reason, 1000);
  if (!included && !reason) throw new PriceResearchError('Diga o motivo de tirar este preço (vai para o documento).');
  return prisma.priceQuote.update({
    where: { id: quoteId },
    data: { included, excludedReason: included ? null : reason, decidedById: actor.id, decidedByName: actor.name },
  });
}

export interface ManualQuoteInput {
  source?: unknown;
  description?: unknown;
  supplier?: unknown;
  supplierDoc?: unknown;
  date?: unknown;
  unitPrice?: unknown;
  unitLabel?: unknown;
  capacity?: unknown;
  measureUnit?: unknown;
  sourceUrl?: unknown;
}

export async function addManualQuote(actor: PriceActor, itemId: string, input: ManualQuoteInput, file?: { buffer: Buffer; originalname: string; mimetype: string }) {
  const { item, research } = await loadItem(actor, itemId);
  assertOpen(research);
  const source = MANUAL_SOURCES.includes(input.source as QuoteSource) ? (input.source as QuoteSource) : 'FORNECEDOR';
  const unitPrice = Number(String(input.unitPrice ?? '').replace(',', '.'));
  if (!(unitPrice > 0)) throw new PriceResearchError('Informe o preço unitário.');
  const date = input.date ? new Date(`${String(input.date).slice(0, 10)}T12:00:00Z`) : new Date();
  if (Number.isNaN(date.getTime())) throw new PriceResearchError('Data inválida.');
  const supplier = text(input.supplier, 200);
  if (source !== 'OUTRO' && !supplier) throw new PriceResearchError('Informe o fornecedor.');
  const sourceUrl = text(input.sourceUrl, 1000) || null;
  if (source === 'OUTRO' && !sourceUrl) throw new PriceResearchError('Informe o endereço (site) consultado.');
  const capacity = Number(input.capacity) > 0 ? Number(input.capacity) : null;
  const unit = { unitPrice, unitLabel: text(input.unitLabel, 30) || item.unit, capacity, measureUnit: capacity ? text(input.measureUnit, 30) || item.baseUnit : null };
  const base = quoteBase(unit);
  const [flag] = flagQuotes([{ source, date, baseUnit: base.baseUnit, basePrice: base.basePrice, manual: true }], item.baseUnit);

  let attachmentPath: string | null = null;
  let attachmentName: string | null = null;
  if (file) {
    const dir = getTenantUploadDir(item.tenantId, 'pesquisa-precos');
    await fs.promises.mkdir(dir, { recursive: true });
    const ext = file.mimetype === 'application/pdf' ? '.pdf' : file.mimetype === 'image/png' ? '.png' : '.jpg';
    attachmentPath = path.join(dir, `${itemId}-${Date.now()}${ext}`);
    await fs.promises.writeFile(attachmentPath, file.buffer);
    attachmentName = text(file.originalname, 200) || `anexo${ext}`;
  }

  return prisma.priceQuote.create({
    data: {
      itemId,
      source,
      manual: true,
      description: text(input.description, 2000) || item.description,
      supplier: supplier || null,
      supplierDoc: text(input.supplierDoc, 20) || null,
      sourceUrl,
      date,
      ...unit,
      ...base,
      included: flag.included,
      autoFlag: flag.autoFlag,
      excludedReason: flag.excludedReason,
      decidedById: actor.id,
      decidedByName: actor.name,
      attachmentPath,
      attachmentName,
    },
  });
}

export async function deleteQuote(actor: PriceActor, quoteId: string) {
  const { quote, research } = await loadQuote(actor, quoteId);
  assertOpen(research);
  if (!quote.manual) throw new PriceResearchError('Preço das fontes oficiais não se apaga: tire do cálculo com o motivo.');
  await prisma.priceQuote.delete({ where: { id: quoteId } });
  if (quote.attachmentPath) fs.promises.unlink(quote.attachmentPath).catch(() => undefined);
}

export async function quoteAttachment(actor: PriceActor, quoteId: string) {
  const { quote } = await loadQuote(actor, quoteId);
  if (!quote.attachmentPath || !fs.existsSync(quote.attachmentPath)) throw new PriceResearchError('Arquivo não encontrado', 404);
  return { filePath: quote.attachmentPath, fileName: quote.attachmentName || path.basename(quote.attachmentPath) };
}

// ─── documento do processo interno ────────────────────────────────────────

export async function generateDocument(actor: PriceActor, researchId: string) {
  const research = await getResearch(actor, researchId);
  if (!research.processId) throw new PriceResearchError('Ligue a pesquisa a um processo interno para gerar o documento.');
  if (!research.items.length) throw new PriceResearchError('Inclua ao menos um item.');
  const missing = research.items.filter((item) => item.summary.unitPrice === null).map((item) => `item ${item.position}`);
  if (missing.length) throw new PriceResearchError(`Sem preço no cálculo: ${missing.join(', ')}.`);
  const pending = research.items.filter((item) => item.summary.warnings.some((warning) => /justific/i.test(warning))).map((item) => `item ${item.position}`);
  if (pending.length) throw new PriceResearchError(`Falta justificativa: ${pending.join(', ')} (menos de 3 preços, só fornecedores ou preço antigo).`);

  const texts = buildDocumentTexts({
    method: research.method as PriceMethod,
    applyIpca: research.applyIpca && research.ipcaAvailable,
    generatedAt: new Date(),
    items: research.items.map((item) => ({
      position: item.position,
      description: item.catalogCode ? `${item.description} (código ${item.catalogCode})` : item.description,
      unit: item.unit,
      quantity: item.quantity,
      baseUnit: item.baseUnit,
      unitCapacity: item.unitCapacity,
      justification: item.justification,
      summary: item.summary,
      quotes: item.quotes.map((quote) => ({ ...quote, source: quote.source as QuoteSource })),
    })),
  });
  const processActor = await buildActor(actor);
  const valor = `R$ ${texts.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  let document;
  try {
    document = await createDocument(processActor, research.processId, 'PESQUISA_PRECOS', {
      parametros: texts.parametros,
      mapa: texts.mapa,
      tratamento: texts.tratamento,
      valor,
    });
    await updateFields(processActor, research.processId, { valorEstimado: texts.total });
  } catch (error) {
    if (error instanceof InternalProcessError) throw new PriceResearchError(error.message, error.status);
    throw error;
  }
  await prisma.priceResearch.update({ where: { id: researchId }, data: { documentId: document.id, status: 'CONCLUIDA' } });
  return { document, total: texts.total };
}

export const SOURCE_LABELS = Object.fromEntries(Object.entries(SOURCE_INFO).map(([key, info]) => [key, info.label]));
export type { AutoFlag };
