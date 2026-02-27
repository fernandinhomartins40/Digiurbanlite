import { config } from '../config/config';
import { normalizeText } from '../ingest/normalizer';
import { prisma } from '../models/prisma';
import { logger } from '../utils/logger';

type CatalogType = 'material' | 'service';

interface CatalogCandidate {
  code: string;
  type: CatalogType;
  description: string;
}

export interface ClassificationInput {
  description: string;
  normalizedDescription?: string;
  catmatCode?: string | null;
  catserCode?: string | null;
  typeHint?: CatalogType | 'both';
  allowDescriptionFallback?: boolean;
}

export interface ClassificationResult {
  catmatCode: string | null;
  catserCode: string | null;
  catmatDescription: string | null;
  confidence: number;
  strategy: 'code_lookup' | 'description_match' | 'none';
}

const CODE_CACHE_MAX_SIZE = 10_000;
const DESC_CACHE_MAX_SIZE = 5_000;

const codeCache = new Map<string, CatalogCandidate | null>();
const descriptionCache = new Map<string, ClassificationResult | null>();

const GENERIC_TOKENS = new Set([
  'servico', 'servicos', 'aquisicao', 'aquisição', 'material', 'itens', 'item',
  'fornecimento', 'prestacao', 'prestação', 'contratacao', 'contratação',
  'sistema', 'solucao', 'solução', 'apoio', 'geral', 'objeto', 'processo',
]);

const SERVICE_HINT_TOKENS = [
  'servico', 'servicos', 'manutencao', 'manutenção', 'locacao', 'locação',
  'consultoria', 'terceirizacao', 'terceirização', 'instalacao', 'instalação',
  'suporte', 'treinamento', 'higienizacao', 'higienização', 'limpeza',
];

export async function classifyCatalog(input: ClassificationInput): Promise<ClassificationResult> {
  const normalizedDescription = input.normalizedDescription?.trim() || normalizeText(input.description);
  const resolvedCatmat = sanitizeCode(input.catmatCode);
  const resolvedCatser = sanitizeCode(input.catserCode);

  if (resolvedCatmat) {
    const byCode = await lookupCatalogByCode(resolvedCatmat);
    if (byCode) return buildCodeResult(byCode, resolvedCatser);
  }

  if (resolvedCatser) {
    const byCode = await lookupCatalogByCode(resolvedCatser);
    if (byCode) return buildCodeResult(byCode, resolvedCatser);
  }

  const allowDescriptionFallback = input.allowDescriptionFallback ?? true;
  if (!allowDescriptionFallback || !config.catmat.autoClassifyEnabled) {
    return {
      catmatCode: resolvedCatmat,
      catserCode: resolvedCatser,
      catmatDescription: null,
      confidence: 0,
      strategy: 'none',
    };
  }

  if (!isClassifiable(normalizedDescription)) {
    return {
      catmatCode: resolvedCatmat,
      catserCode: resolvedCatser,
      catmatDescription: null,
      confidence: 0,
      strategy: 'none',
    };
  }

  const cacheKey = `${normalizedDescription}|${input.typeHint ?? 'both'}`;
  const cached = descriptionCache.get(cacheKey);
  if (cached !== undefined) {
    return cached ?? {
      catmatCode: resolvedCatmat,
      catserCode: resolvedCatser,
      catmatDescription: null,
      confidence: 0,
      strategy: 'none',
    };
  }

  const typeHint = input.typeHint ?? inferTypeHint(normalizedDescription);
  const candidates = await fetchCandidates(normalizedDescription, typeHint);
  if (candidates.length === 0) {
    writeCache(descriptionCache, cacheKey, null, DESC_CACHE_MAX_SIZE);
    return {
      catmatCode: resolvedCatmat,
      catserCode: resolvedCatser,
      catmatDescription: null,
      confidence: 0,
      strategy: 'none',
    };
  }

  const scored = rankCandidates(normalizedDescription, candidates);
  const best = scored[0];
  if (!best || best.score < config.catmat.autoClassifyMinScore) {
    writeCache(descriptionCache, cacheKey, null, DESC_CACHE_MAX_SIZE);
    return {
      catmatCode: resolvedCatmat,
      catserCode: resolvedCatser,
      catmatDescription: null,
      confidence: best?.score ?? 0,
      strategy: 'none',
    };
  }

  const result: ClassificationResult = {
    catmatCode: best.item.type === 'material' ? best.item.code : null,
    catserCode: best.item.type === 'service' ? best.item.code : null,
    catmatDescription: best.item.description,
    confidence: round3(best.score),
    strategy: 'description_match',
  };

  writeCache(descriptionCache, cacheKey, result, DESC_CACHE_MAX_SIZE);
  return result;
}

async function lookupCatalogByCode(code: string): Promise<CatalogCandidate | null> {
  const key = code.trim();
  if (!key) return null;
  const cached = codeCache.get(key);
  if (cached !== undefined) return cached;

  try {
    const item = await prisma.catmatItem.findUnique({
      where: { code: key },
      select: { code: true, type: true, description: true },
    });
    const mapped = item
      ? { code: item.code, type: item.type as CatalogType, description: item.description }
      : null;
    writeCache(codeCache, key, mapped, CODE_CACHE_MAX_SIZE);
    return mapped;
  } catch (err) {
    logger.warn('[CATMAT Classifier] Code lookup failed', { code: key, error: (err as Error).message });
    return null;
  }
}

function buildCodeResult(
  item: CatalogCandidate,
  fallbackCatser: string | null,
): ClassificationResult {
  return {
    catmatCode: item.type === 'material' ? item.code : null,
    catserCode: item.type === 'service' ? item.code : fallbackCatser,
    catmatDescription: item.description,
    confidence: 1,
    strategy: 'code_lookup',
  };
}

async function fetchCandidates(
  normalizedDescription: string,
  typeHint: CatalogType | 'both',
): Promise<CatalogCandidate[]> {
  const tokens = extractAnchorTokens(normalizedDescription);
  if (tokens.length === 0) return [];

  const orFilters = tokens.slice(0, 4).map((token) => ({
    description: { contains: token, mode: 'insensitive' as const },
  }));

  try {
    const rows = await prisma.catmatItem.findMany({
      where: {
        isActive: true,
        ...(typeHint !== 'both' ? { type: typeHint } : {}),
        OR: orFilters,
      },
      take: Math.max(20, config.catmat.autoClassifyMaxCandidates),
      select: { code: true, type: true, description: true },
    });

    return rows.map((row) => ({
      code: row.code,
      type: row.type as CatalogType,
      description: row.description,
    }));
  } catch (err) {
    logger.warn('[CATMAT Classifier] Candidate lookup failed', {
      typeHint,
      error: (err as Error).message,
    });
    return [];
  }
}

function rankCandidates(normalizedDescription: string, candidates: CatalogCandidate[]) {
  const queryTokens = new Set(tokenize(normalizedDescription));
  const firstToken = tokenize(normalizedDescription)[0] ?? '';

  return candidates
    .map((item) => {
      const normalizedCatalog = normalizeText(item.description);
      const catalogTokens = new Set(tokenize(normalizedCatalog));

      const intersection = countIntersection(queryTokens, catalogTokens);
      const union = new Set([...Array.from(queryTokens), ...Array.from(catalogTokens)]).size || 1;

      const coverage = queryTokens.size > 0 ? intersection / queryTokens.size : 0;
      const jaccard = intersection / union;
      const phraseBoost = normalizedCatalog.includes(normalizedDescription) ? 0.15 : 0;
      const prefixBoost = firstToken && normalizedCatalog.startsWith(firstToken) ? 0.06 : 0;
      const lengthPenalty = Math.abs(normalizedCatalog.length - normalizedDescription.length) > 80 ? 0.05 : 0;

      const score = clamp01(coverage * 0.58 + jaccard * 0.34 + phraseBoost + prefixBoost - lengthPenalty);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);
}

function isClassifiable(normalizedDescription: string): boolean {
  if (!normalizedDescription || normalizedDescription.length < 10) return false;
  const tokens = tokenize(normalizedDescription);
  if (tokens.length < 2) return false;
  const useful = tokens.filter((token) => token.length > 2 && !GENERIC_TOKENS.has(token));
  return useful.length >= 2;
}

function extractAnchorTokens(normalizedDescription: string): string[] {
  return tokenize(normalizedDescription)
    .filter((token) => token.length > 2 && !GENERIC_TOKENS.has(token))
    .sort((a, b) => b.length - a.length)
    .slice(0, 6);
}

function inferTypeHint(normalizedDescription: string): CatalogType | 'both' {
  return SERVICE_HINT_TOKENS.some((token) => normalizedDescription.includes(token))
    ? 'service'
    : 'both';
}

function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function countIntersection(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const token of a) {
    if (b.has(token)) count++;
  }
  return count;
}

function sanitizeCode(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function writeCache<T>(cache: Map<string, T>, key: string, value: T, maxSize: number) {
  if (cache.size >= maxSize) {
    const toDelete = Math.floor(maxSize / 2);
    let removed = 0;
    for (const existingKey of cache.keys()) {
      cache.delete(existingKey);
      removed++;
      if (removed >= toDelete) break;
    }
  }
  cache.set(key, value);
}
