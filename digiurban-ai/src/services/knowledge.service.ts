import { AiKnowledgeSource, AiKnowledgeSourceType, Prisma } from '@prisma/client';
import axios from 'axios';
import { createHash } from 'crypto';
import { config } from '../config/config';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { ollamaService } from './ollama.service';

type SourceConfig = {
  table?: string;
  where?: string;
  limit?: number;
  sql?: string;
  content?: string;
  url?: string;
  headers?: Record<string, string>;
  indexScope?: KnowledgeIndexScope;
};

type SearchResult = {
  content: string;
  sourceId: string;
  score: number;
};

type SearchCacheEntry = {
  expiresAt: number;
  results: SearchResult[];
};

type EmbeddingCacheEntry = {
  expiresAt: number;
  vector: number[];
};

type KnowledgeRuntimeStats = {
  ingestions: number;
  ingestedChunks: number;
  lastIngestedAt?: string;
  queryCacheHits: number;
  queryCacheMisses: number;
  queryEmbeddingCacheHits: number;
  queryEmbeddingCacheMisses: number;
  embeddingFailures: number;
};

export type KnowledgeIndexScope =
  | 'app_routes_index'
  | 'business_flows_index'
  | 'internal_docs_index'
  | 'live_metrics_tools';

const TABLE_NAME_REGEX = /^[A-Za-z0-9_]+$/;
const FIELD_NAME_REGEX = /[_\-.]+/g;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function estimateTokenCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function normalizeTerms(query: string): string[] {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9_]+/g)
    .filter((term) => term.length >= 3)
    .slice(0, 10);
}

function lexicalScore(content: string, terms: string[]): number {
  if (!terms.length) return 0;

  const normalized = content
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  let score = 0;
  for (const term of terms) {
    let index = normalized.indexOf(term);
    while (index !== -1) {
      score += 1;
      index = normalized.indexOf(term, index + term.length);
    }
  }

  return score;
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

function normalizeScore(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0 || max <= 0) {
    return 0;
  }

  return value / max;
}

function humanizeKey(value: string): string {
  return value
    .replace(FIELD_NAME_REGEX, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatScalar(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized || undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatScalar(item))
      .filter((item): item is string => Boolean(item))
      .slice(0, 12);
    return items.length ? items.join(', ') : undefined;
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function readMetadataEmbedding(metadata: Prisma.JsonValue | null | undefined): number[] | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const embedding = (metadata as Record<string, unknown>).embedding;
  if (!Array.isArray(embedding)) {
    return undefined;
  }

  const vector = embedding.filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
  return vector.length > 0 ? vector : undefined;
}

function resolveConfiguredIndexScope(configValue: Prisma.JsonValue | null | undefined): KnowledgeIndexScope {
  if (configValue && typeof configValue === 'object' && !Array.isArray(configValue)) {
    const rawScope = (configValue as Record<string, unknown>).indexScope;
    if (
      rawScope === 'app_routes_index' ||
      rawScope === 'business_flows_index' ||
      rawScope === 'internal_docs_index' ||
      rawScope === 'live_metrics_tools'
    ) {
      return rawScope;
    }
  }

  return 'internal_docs_index';
}

export class KnowledgeService {
  private readonly searchCache = new Map<string, SearchCacheEntry>();

  private readonly queryEmbeddingCache = new Map<string, EmbeddingCacheEntry>();

  private readonly runtimeStats: KnowledgeRuntimeStats = {
    ingestions: 0,
    ingestedChunks: 0,
    queryCacheHits: 0,
    queryCacheMisses: 0,
    queryEmbeddingCacheHits: 0,
    queryEmbeddingCacheMisses: 0,
    embeddingFailures: 0,
  };

  async listSources(tenantId: string): Promise<AiKnowledgeSource[]> {
    return prisma.aiKnowledgeSource.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createSource(params: {
    tenantId: string;
    name: string;
    type: AiKnowledgeSourceType;
    config: Prisma.InputJsonValue;
    createdBy?: string;
  }): Promise<AiKnowledgeSource> {
    return prisma.aiKnowledgeSource.create({
      data: {
        tenantId: params.tenantId,
        name: params.name,
        type: params.type,
        config: params.config,
        createdBy: params.createdBy,
      },
    });
  }

  async updateSource(params: {
    tenantId: string;
    sourceId: string;
    payload: Partial<{
      name: string;
      isActive: boolean;
      config: Prisma.InputJsonValue;
    }>;
  }): Promise<AiKnowledgeSource> {
    const existing = await prisma.aiKnowledgeSource.findFirst({
      where: { id: params.sourceId, tenantId: params.tenantId },
    });

    if (!existing) {
      throw new Error('Knowledge source not found');
    }

    return prisma.aiKnowledgeSource.update({
      where: { id: params.sourceId },
      data: {
        ...(params.payload.name !== undefined ? { name: params.payload.name } : {}),
        ...(params.payload.isActive !== undefined ? { isActive: params.payload.isActive } : {}),
        ...(params.payload.config !== undefined ? { config: params.payload.config } : {}),
      },
    });
  }

  async ingestSource(
    tenantId: string,
    sourceId: string,
  ): Promise<{
    sourceId: string;
    chunks: number;
    ingestedAt: string;
  }> {
    const source = await prisma.aiKnowledgeSource.findFirst({
      where: { id: sourceId, tenantId },
    });

    if (!source) {
      throw new Error('Knowledge source not found');
    }

    const documents = await this.extractDocumentsFromSource(source);
    const chunks = await this.buildChunks(
      documents,
      source.type,
      (source.config ?? {}) as unknown as SourceConfig,
    );

    await prisma.$transaction([
      prisma.aiKnowledgeChunk.deleteMany({
        where: {
          sourceId: source.id,
        },
      }),
      prisma.aiKnowledgeChunk.createMany({
        data: chunks.map((chunk) => ({
          sourceId: source.id,
          tenantId,
          hash: chunk.hash,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          metadata: chunk.metadata,
        })),
        skipDuplicates: true,
      }),
      prisma.aiKnowledgeSource.update({
        where: { id: source.id },
        data: { lastIngestedAt: new Date() },
      }),
    ]);

    this.runtimeStats.ingestions += 1;
    this.runtimeStats.ingestedChunks += chunks.length;
    this.runtimeStats.lastIngestedAt = new Date().toISOString();
    this.searchCache.clear();

    logger.info('Knowledge source ingested', {
      tenantId,
      sourceId,
      chunks: chunks.length,
      sourceType: source.type,
      embeddingsEnabled: config.embeddingsEnabled,
    });

    return {
      sourceId: source.id,
      chunks: chunks.length,
      ingestedAt: new Date().toISOString(),
    };
  }

  async searchRelevantChunks(params: {
    tenantId: string;
    query: string;
    limit?: number;
    scopes?: KnowledgeIndexScope[];
  }): Promise<SearchResult[]> {
    const normalizedQuery = params.query.trim();
    if (!normalizedQuery) {
      return [];
    }

    this.pruneCaches();

    const limit = clamp(params.limit ?? config.maxContextChunks, 1, 20);
    const cacheKey = `${params.tenantId}:${limit}:${normalizedQuery.toLowerCase()}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.runtimeStats.queryCacheHits += 1;
      return cached.results;
    }

    this.runtimeStats.queryCacheMisses += 1;
    const terms = normalizeTerms(normalizedQuery);
    let scopedSourceIds: string[] | undefined;
    const requestedScopes = Array.isArray(params.scopes)
      ? Array.from(new Set(params.scopes)).filter(Boolean)
      : [];

    if (requestedScopes.length > 0) {
      const scopedSources = await prisma.aiKnowledgeSource.findMany({
        where: {
          tenantId: params.tenantId,
          isActive: true,
        },
        select: {
          id: true,
          config: true,
        },
      });

      scopedSourceIds = scopedSources
        .filter((source) => requestedScopes.includes(resolveConfiguredIndexScope(source.config)))
        .map((source) => source.id);

      if (!scopedSourceIds.length) {
        return [];
      }
    }

    const lexicalWhere =
      terms.length > 0
        ? {
            tenantId: params.tenantId,
            ...(scopedSourceIds ? { sourceId: { in: scopedSourceIds } } : {}),
            OR: terms.map((term) => ({
              content: {
                contains: term,
                mode: 'insensitive' as const,
              },
            })),
          }
        : {
            tenantId: params.tenantId,
            ...(scopedSourceIds ? { sourceId: { in: scopedSourceIds } } : {}),
          };

    const lexicalCandidates = await prisma.aiKnowledgeChunk.findMany({
      where: lexicalWhere,
      orderBy: { createdAt: 'desc' },
      take: clamp(config.ragCandidateLimit, 20, 250),
    });

    let candidates = lexicalCandidates;
    if (candidates.length < limit * 4) {
      const supplemental = await prisma.aiKnowledgeChunk.findMany({
        where: {
          tenantId: params.tenantId,
          ...(scopedSourceIds ? { sourceId: { in: scopedSourceIds } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(clamp(config.ragCandidateLimit, 20, 250), limit * 12),
      });

      const existingIds = new Set(candidates.map((item) => item.id));
      candidates = [
        ...candidates,
        ...supplemental.filter((item) => {
          if (existingIds.has(item.id)) {
            return false;
          }
          existingIds.add(item.id);
          return true;
        }),
      ];
    }

    const lexicalScores = candidates.map((chunk) => lexicalScore(chunk.content, terms));
    const maxLexicalScore = Math.max(0, ...lexicalScores);
    const queryEmbedding = await this.resolveQueryEmbedding(normalizedQuery);

    const results = candidates
      .map((chunk, index) => {
        const lexical = lexicalScores[index] ?? 0;
        const semantic = queryEmbedding
          ? cosineSimilarity(queryEmbedding, readMetadataEmbedding(chunk.metadata) || [])
          : 0;
        const normalizedLexical = normalizeScore(lexical, maxLexicalScore);
        const queryBoost = chunk.content.toLowerCase().includes(normalizedQuery.toLowerCase()) ? 0.15 : 0;
        const score =
          semantic * config.ragSemanticWeight +
          normalizedLexical * config.ragLexicalWeight +
          queryBoost;

        return {
          content: chunk.content,
          sourceId: chunk.sourceId,
          score,
          lexical,
          semantic,
        };
      })
      .filter((item) => item.score > 0 || item.lexical > 0 || item.semantic > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ content, sourceId, score }) => ({
        content,
        sourceId,
        score: Number(score.toFixed(4)),
      }));

    this.searchCache.set(cacheKey, {
      expiresAt: Date.now() + Math.max(10_000, config.ragQueryCacheTtlMs),
      results,
    });

    return results;
  }

  async bootstrapSystemSources(
    tenantId: string,
    createdBy?: string,
  ): Promise<{
    created: number;
    updated: number;
    ingestedSources: number;
  }> {
    const defaults: Array<{
      name: string;
      type: AiKnowledgeSourceType;
      config: SourceConfig;
    }> = [
      {
        name: 'Catalogo de Servicos',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: {
          table: 'services_simplified',
          where: '"isActive" = true',
          limit: 5000,
          indexScope: 'internal_docs_index',
        },
      },
      {
        name: 'Workflows por Servico',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: {
          table: 'service_workflows',
          where: '"isActive" = true',
          limit: 5000,
          indexScope: 'business_flows_index',
        },
      },
      {
        name: 'Estrutura de Departamentos',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: {
          table: 'departments',
          where: '"isActive" = true',
          limit: 1000,
          indexScope: 'internal_docs_index',
        },
      },
      {
        name: 'Organograma de Unidades',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: {
          table: 'organizational_units',
          where: '"isActive" = true',
          limit: 10000,
          indexScope: 'internal_docs_index',
        },
      },
      {
        name: 'Cargos',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: {
          table: 'positions',
          where: '"isActive" = true',
          limit: 5000,
          indexScope: 'internal_docs_index',
        },
      },
      {
        name: 'Funcoes',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: {
          table: 'functions',
          where: '"isActive" = true',
          limit: 5000,
          indexScope: 'internal_docs_index',
        },
      },
      {
        name: 'Fluxos Conversacionais',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: {
          table: 'flow_definitions',
          where: '"isActive" = true',
          limit: 2000,
          indexScope: 'business_flows_index',
        },
      },
    ];

    let created = 0;
    let updated = 0;
    let ingestedSources = 0;

    for (const source of defaults) {
      const existing = await prisma.aiKnowledgeSource.findFirst({
        where: { tenantId, name: source.name },
      });

      const saved = existing
        ? await prisma.aiKnowledgeSource.update({
            where: { id: existing.id },
            data: {
              type: source.type,
              config: source.config as Prisma.InputJsonValue,
              isActive: true,
            },
          })
        : await prisma.aiKnowledgeSource.create({
            data: {
              tenantId,
              name: source.name,
              type: source.type,
              config: source.config as Prisma.InputJsonValue,
              createdBy,
              isActive: true,
            },
          });

      if (existing) {
        updated += 1;
      } else {
        created += 1;
      }

      try {
        await this.ingestSource(tenantId, saved.id);
        ingestedSources += 1;
      } catch (error) {
        logger.warn('Failed to ingest bootstrap source', {
          tenantId,
          sourceId: saved.id,
          name: source.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { created, updated, ingestedSources };
  }

  getRuntimeStats(): Record<string, unknown> {
    return {
      embeddingsEnabled: config.embeddingsEnabled,
      embeddingsModel: config.embeddingsModel,
      queryCacheSize: this.searchCache.size,
      queryEmbeddingCacheSize: this.queryEmbeddingCache.size,
      stats: this.runtimeStats,
    };
  }

  private async extractDocumentsFromSource(source: AiKnowledgeSource): Promise<string[]> {
    const sourceConfig = (source.config ?? {}) as unknown as SourceConfig;

    if (source.type === AiKnowledgeSourceType.MANUAL_TEXT) {
      const content = typeof sourceConfig.content === 'string' ? sourceConfig.content.trim() : '';
      return content ? [content] : [];
    }

    if (source.type === AiKnowledgeSourceType.SYSTEM_TABLE) {
      const table = typeof sourceConfig.table === 'string' ? sourceConfig.table.trim() : '';
      const where = typeof sourceConfig.where === 'string' ? sourceConfig.where.trim() : '';
      const limit = clamp(Number(sourceConfig.limit || 1000), 1, 20000);

      if (!table || !TABLE_NAME_REGEX.test(table)) {
        throw new Error(`Invalid system table name: ${table || 'empty'}`);
      }

      const whereClause = where ? `WHERE ${where}` : '';
      const sql = `SELECT * FROM "${table}" ${whereClause} LIMIT ${limit}`;
      const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql);
      return rows
        .map((row) => this.buildReadableDocument(table, row))
        .filter((item): item is string => Boolean(item));
    }

    if (source.type === AiKnowledgeSourceType.SQL_QUERY) {
      const sql = typeof sourceConfig.sql === 'string' ? sourceConfig.sql.trim() : '';

      if (!sql.toLowerCase().startsWith('select')) {
        throw new Error('SQL_QUERY sources must start with SELECT');
      }

      const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql);
      return rows
        .map((row, index) => {
          if (typeof row.content === 'string' && row.content.trim()) {
            return row.content.trim();
          }

          return this.buildReadableDocument(`sql_result_${index + 1}`, row);
        })
        .filter((item): item is string => Boolean(item));
    }

    if (source.type === AiKnowledgeSourceType.HTTP_ENDPOINT) {
      const url = typeof sourceConfig.url === 'string' ? sourceConfig.url.trim() : '';
      if (!url) {
        throw new Error('HTTP endpoint URL is required');
      }

      const headers =
        sourceConfig.headers && typeof sourceConfig.headers === 'object'
          ? sourceConfig.headers
          : undefined;
      const response = await axios.get(url, { headers, timeout: 60000 });
      const payload = response.data;

      if (typeof payload === 'string') {
        return [payload];
      }

      if (Array.isArray(payload)) {
        return payload
          .map((item, index) =>
            this.buildReadableDocument(`http_endpoint_${index + 1}`, item as Record<string, unknown>),
          )
          .filter((item): item is string => Boolean(item));
      }

      if (payload && typeof payload === 'object') {
        const doc = this.buildReadableDocument('http_endpoint', payload as Record<string, unknown>);
        return doc ? [doc] : [];
      }

      return [JSON.stringify(payload)];
    }

    return [];
  }

  private buildReadableDocument(
    sourceName: string,
    row: Record<string, unknown>,
  ): string | undefined {
    const entries = Object.entries(row)
      .map(([key, value]) => [key, formatScalar(value)] as const)
      .filter(([, value]) => Boolean(value));

    if (!entries.length) {
      return undefined;
    }

    const titleCandidate =
      entries.find(([key]) => ['name', 'title', 'nome', 'titulo', 'label'].includes(key.toLowerCase()))?.[1] ||
      entries.find(([key]) => key.toLowerCase().endsWith('name'))?.[1];
    const descriptionCandidate =
      entries.find(([key]) =>
        ['description', 'descricao', 'summary', 'resumo', 'content'].includes(key.toLowerCase()),
      )?.[1];
    const identifierCandidate =
      entries.find(([key]) => ['id', 'code', 'codigo', 'slug'].includes(key.toLowerCase()))?.[1];

    const headerLines = [
      `Origem: ${sourceName}`,
      titleCandidate ? `Titulo: ${titleCandidate}` : undefined,
      identifierCandidate ? `Identificador: ${identifierCandidate}` : undefined,
      descriptionCandidate ? `Resumo: ${descriptionCandidate}` : undefined,
    ].filter((item): item is string => Boolean(item));

    const bodyLines = entries
      .slice(0, 40)
      .map(([key, value]) => `${humanizeKey(key)}: ${value}`);

    return [...headerLines, ...bodyLines].join('\n');
  }

  private async buildChunks(
    documents: string[],
    sourceType: AiKnowledgeSourceType,
    sourceConfig?: SourceConfig,
  ): Promise<
    Array<{
      hash: string;
      content: string;
      tokenCount: number;
      metadata: Prisma.JsonObject;
    }>
  > {
    const chunkSize = clamp(config.maxChunkSizeChars, 400, 5000);
    const overlap = clamp(config.chunkOverlapChars, 0, Math.floor(chunkSize / 3));
    const chunks: Array<{
      hash: string;
      content: string;
      tokenCount: number;
      metadata: Prisma.JsonObject;
    }> = [];

    documents.forEach((document, docIndex) => {
      const normalizedDoc = document.trim();
      if (!normalizedDoc) {
        return;
      }

      const parts = this.splitDocument(normalizedDoc, chunkSize, overlap);
      parts.forEach((piece, chunkIndex) => {
        const hash = createHash('sha256').update(piece).digest('hex');
        chunks.push({
          hash,
          content: piece,
          tokenCount: estimateTokenCount(piece),
          metadata: {
            chunkIndex,
            documentIndex: docIndex,
            originalLength: normalizedDoc.length,
            sourceType,
            indexScope: sourceConfig?.indexScope || 'internal_docs_index',
          },
        });
      });
    });

    await this.attachEmbeddings(chunks);
    return chunks;
  }

  private splitDocument(document: string, chunkSize: number, overlap: number): string[] {
    if (document.length <= chunkSize) {
      return [document];
    }

    const paragraphUnits = document
      .split(/\n{2,}/g)
      .flatMap((paragraph) => this.splitLongUnit(paragraph.trim(), chunkSize))
      .filter(Boolean);

    if (!paragraphUnits.length) {
      return this.splitLongUnit(document, chunkSize);
    }

    const chunks: string[] = [];
    let current = '';

    paragraphUnits.forEach((unit) => {
      const candidate = current ? `${current}\n\n${unit}` : unit;
      if (candidate.length <= chunkSize) {
        current = candidate;
        return;
      }

      if (current) {
        chunks.push(current.trim());
      }

      const overlapTail =
        overlap > 0 && current ? current.slice(Math.max(0, current.length - overlap)).trim() : '';
      current = overlapTail ? `${overlapTail}\n${unit}`.trim() : unit;

      while (current.length > chunkSize) {
        chunks.push(current.slice(0, chunkSize).trim());
        current = current.slice(Math.max(1, chunkSize - overlap)).trim();
      }
    });

    if (current.trim()) {
      chunks.push(current.trim());
    }

    return chunks.filter(Boolean);
  }

  private splitLongUnit(text: string, chunkSize: number): string[] {
    if (!text.trim()) {
      return [];
    }

    if (text.length <= chunkSize) {
      return [text.trim()];
    }

    const sentences = text
      .split(/(?<=[.!?])\s+/g)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      const chunks: string[] = [];
      let cursor = 0;
      while (cursor < text.length) {
        chunks.push(text.slice(cursor, cursor + chunkSize).trim());
        cursor += chunkSize;
      }
      return chunks.filter(Boolean);
    }

    const result: string[] = [];
    let current = '';
    sentences.forEach((sentence) => {
      const candidate = current ? `${current} ${sentence}` : sentence;
      if (candidate.length <= chunkSize) {
        current = candidate;
        return;
      }

      if (current) {
        result.push(current.trim());
      }
      current = sentence;
    });

    if (current.trim()) {
      result.push(current.trim());
    }

    return result;
  }

  private async attachEmbeddings(
    chunks: Array<{
      hash: string;
      content: string;
      tokenCount: number;
      metadata: Prisma.JsonObject;
    }>,
  ): Promise<void> {
    if (!config.embeddingsEnabled || !chunks.length) {
      return;
    }

    const batchSize = clamp(config.embeddingsBatchSize, 1, 32);

    for (let index = 0; index < chunks.length; index += batchSize) {
      const batch = chunks.slice(index, index + batchSize);
      try {
        const embeddings = await ollamaService.embed(
          batch.map((item) => item.content),
          config.embeddingsModel,
        );

        batch.forEach((chunk, offset) => {
          const vector = embeddings[offset];
          if (!vector?.length) {
            this.runtimeStats.embeddingFailures += 1;
            return;
          }

          chunk.metadata = {
            ...chunk.metadata,
            embeddingModel: config.embeddingsModel,
            embedding: vector,
          };
        });
      } catch (error) {
        this.runtimeStats.embeddingFailures += batch.length;
        logger.warn('Failed to attach embeddings to knowledge chunks', {
          model: config.embeddingsModel,
          batchSize: batch.length,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async resolveQueryEmbedding(query: string): Promise<number[] | undefined> {
    if (!config.embeddingsEnabled) {
      return undefined;
    }

    const cacheKey = query.toLowerCase();
    const cached = this.queryEmbeddingCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.runtimeStats.queryEmbeddingCacheHits += 1;
      return cached.vector;
    }

    this.runtimeStats.queryEmbeddingCacheMisses += 1;

    try {
      const [vector] = await ollamaService.embed(query, config.embeddingsModel);
      if (!vector?.length) {
        return undefined;
      }

      this.queryEmbeddingCache.set(cacheKey, {
        expiresAt: Date.now() + Math.max(30_000, config.embeddingsQueryCacheTtlMs),
        vector,
      });

      return vector;
    } catch (error) {
      this.runtimeStats.embeddingFailures += 1;
      logger.warn('Failed to resolve query embedding', {
        model: config.embeddingsModel,
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  private pruneCaches(): void {
    const now = Date.now();

    for (const [key, value] of this.searchCache.entries()) {
      if (value.expiresAt <= now) {
        this.searchCache.delete(key);
      }
    }

    for (const [key, value] of this.queryEmbeddingCache.entries()) {
      if (value.expiresAt <= now) {
        this.queryEmbeddingCache.delete(key);
      }
    }
  }
}

export const knowledgeService = new KnowledgeService();
