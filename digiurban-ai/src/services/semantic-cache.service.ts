import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { config } from '../config/config';
import { ChatCompletionResult, InferenceRouteKind } from '../types';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { llamaCppService } from './llamacpp.service';

type ChatSource = 'ADMIN_CHAT' | 'INTERNAL_API' | 'PUBLIC_API';

type CacheHitKind = 'exact' | 'semantic';

export type SemanticCacheHit = {
  id: string;
  content: string;
  model: string;
  routeKind: InferenceRouteKind;
  latencyMs: number;
  score: number;
  hitKind: CacheHitKind;
};

type CacheRuntimeStats = {
  exactHits: number;
  semanticHits: number;
  misses: number;
  stores: number;
  skipped: number;
  embeddingFailures: number;
};

function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function readEmbedding(value: Prisma.JsonValue | null | undefined): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const vector = value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
  return vector.length ? vector : undefined;
}

function isPossiblyPersonalized(normalized: string): boolean {
  if (!normalized) return true;

  const personalSignals = [
    'meu ',
    'minha ',
    'meus ',
    'minhas ',
    'me ',
    'eu ',
    'cpf',
    'cnpj',
    'telefone',
    'email',
    'e mail',
    'numero do protocolo',
    'numero do chamado',
    'meu protocolo',
    'meu chamado',
    'meu ticket',
  ];

  return personalSignals.some((signal) => normalized.includes(signal)) || /\b\d{4,}\b/.test(normalized);
}

function isCacheableRoute(routeKind: InferenceRouteKind): boolean {
  return routeKind === 'free_draft' || routeKind === 'context_navigation' || routeKind === 'context_documents';
}

export class SemanticCacheService {
  private readonly stats: CacheRuntimeStats = {
    exactHits: 0,
    semanticHits: 0,
    misses: 0,
    stores: 0,
    skipped: 0,
    embeddingFailures: 0,
  };

  shouldUseCache(params: {
    query: string;
    routeKind: InferenceRouteKind;
    source: ChatSource;
    hasAttachments?: boolean;
    responseFormat?: unknown;
    webSearch?: boolean;
    useBuiltInTools?: boolean;
  }): boolean {
    if (!config.semanticCacheEnabled) return false;
    if (!isCacheableRoute(params.routeKind)) return false;
    if (params.hasAttachments || params.responseFormat || params.webSearch || params.useBuiltInTools) return false;

    const normalized = normalizeQuery(params.query);
    if (normalized.length < 12 || normalized.length > 420) return false;
    if (isPossiblyPersonalized(normalized)) return false;

    return true;
  }

  async find(params: {
    tenantId: string;
    query: string;
    routeKind: InferenceRouteKind;
    source: ChatSource;
  }): Promise<SemanticCacheHit | null> {
    const startedAt = Date.now();
    const normalizedQuery = normalizeQuery(params.query);
    if (!normalizedQuery) {
      this.stats.misses += 1;
      return null;
    }

    const queryHash = sha256(normalizedQuery);
    const now = new Date();
    const whereBase = {
      tenantId: params.tenantId,
      routeKind: params.routeKind,
      source: params.source,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    const exact = await prisma.aiSemanticCache.findFirst({
      where: {
        ...whereBase,
        queryHash,
      },
    });

    if (exact) {
      await this.markHit(exact.id);
      this.stats.exactHits += 1;
      return {
        id: exact.id,
        content: exact.response,
        model: 'semantic-cache-exact',
        routeKind: 'semantic_cache',
        latencyMs: Date.now() - startedAt,
        score: 1,
        hitKind: 'exact',
      };
    }

    if (!config.embeddingsEnabled) {
      this.stats.misses += 1;
      return null;
    }

    const queryEmbedding = await this.resolveEmbedding(normalizedQuery);
    if (!queryEmbedding?.length) {
      this.stats.misses += 1;
      return null;
    }

    const candidates = await prisma.aiSemanticCache.findMany({
      where: whereBase,
      orderBy: [{ hitCount: 'desc' }, { updatedAt: 'desc' }],
      take: Math.max(20, Math.min(config.semanticCacheMaxCandidates, 1000)),
    });

    let best:
      | {
          id: string;
          response: string;
          score: number;
        }
      | undefined;

    for (const candidate of candidates) {
      const embedding = readEmbedding(candidate.embedding);
      if (!embedding) continue;

      const score = cosineSimilarity(queryEmbedding, embedding);
      if (!best || score > best.score) {
        best = {
          id: candidate.id,
          response: candidate.response,
          score,
        };
      }
    }

    if (best && best.score >= config.semanticCacheSimilarityThreshold) {
      await this.markHit(best.id);
      this.stats.semanticHits += 1;
      return {
        id: best.id,
        content: best.response,
        model: 'semantic-cache',
        routeKind: 'semantic_cache',
        latencyMs: Date.now() - startedAt,
        score: Number(best.score.toFixed(4)),
        hitKind: 'semantic',
      };
    }

    this.stats.misses += 1;
    return null;
  }

  async store(params: {
    tenantId: string;
    query: string;
    source: ChatSource;
    completion: ChatCompletionResult;
    routeKind: InferenceRouteKind;
    contextSources?: string[];
  }): Promise<void> {
    if (!config.semanticCacheEnabled || !isCacheableRoute(params.routeKind)) {
      this.stats.skipped += 1;
      return;
    }

    const normalizedQuery = normalizeQuery(params.query);
    const response = params.completion.content.trim();
    if (
      !normalizedQuery ||
      !response ||
      normalizedQuery.length < 12 ||
      response.length < 12 ||
      response.length > config.semanticCacheMaxResponseChars ||
      params.completion.toolCalls?.length ||
      params.completion.model.includes('fallback') ||
      params.completion.deterministicResponse ||
      isPossiblyPersonalized(normalizedQuery)
    ) {
      this.stats.skipped += 1;
      return;
    }

    const embedding = config.embeddingsEnabled ? await this.resolveEmbedding(normalizedQuery) : undefined;
    const ttlDays = Math.max(1, config.semanticCacheTtlDays);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    const queryHash = sha256(normalizedQuery);

    try {
      await prisma.aiSemanticCache.upsert({
        where: {
          tenantId_queryHash_routeKind_source: {
            tenantId: params.tenantId,
            queryHash,
            routeKind: params.routeKind,
            source: params.source,
          },
        },
        create: {
          tenantId: params.tenantId,
          queryHash,
          normalizedQuery,
          response,
          model: params.completion.model,
          routeKind: params.routeKind,
          source: params.source,
          embedding: embedding as Prisma.InputJsonValue | undefined,
          expiresAt,
          metadata: {
            originalRouteKind: params.routeKind,
            contextSources: params.contextSources?.slice(0, 6) || [],
            finishReason: params.completion.finishReason,
          },
        },
        update: {
          response,
          model: params.completion.model,
          embedding: embedding as Prisma.InputJsonValue | undefined,
          expiresAt,
          metadata: {
            originalRouteKind: params.routeKind,
            contextSources: params.contextSources?.slice(0, 6) || [],
            finishReason: params.completion.finishReason,
          },
        },
      });
      this.stats.stores += 1;
    } catch (error) {
      logger.warn('Failed to store semantic cache entry', {
        tenantId: params.tenantId,
        routeKind: params.routeKind,
        source: params.source,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  getRuntimeStats(): Record<string, unknown> {
    return {
      enabled: config.semanticCacheEnabled,
      embeddingsEnabled: config.embeddingsEnabled,
      similarityThreshold: config.semanticCacheSimilarityThreshold,
      maxCandidates: config.semanticCacheMaxCandidates,
      ttlDays: config.semanticCacheTtlDays,
      stats: this.stats,
    };
  }

  private async resolveEmbedding(text: string): Promise<number[] | undefined> {
    try {
      const [embedding] = await llamaCppService.embed(text, config.embeddingsModel);
      return embedding?.length ? embedding : undefined;
    } catch (error) {
      this.stats.embeddingFailures += 1;
      logger.warn('Semantic cache embedding lookup failed', {
        model: config.embeddingsModel,
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  private async markHit(id: string): Promise<void> {
    await prisma.aiSemanticCache.update({
      where: { id },
      data: {
        hitCount: { increment: 1 },
        lastHitAt: new Date(),
      },
    }).catch((error) => {
      logger.warn('Failed to update semantic cache hit stats', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
}

export const semanticCacheService = new SemanticCacheService();
