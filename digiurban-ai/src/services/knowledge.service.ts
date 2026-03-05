import { AiKnowledgeSource, AiKnowledgeSourceType, Prisma } from '@prisma/client';
import axios from 'axios';
import { createHash } from 'crypto';
import { config } from '../config/config';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

type SourceConfig = {
  table?: string;
  where?: string;
  limit?: number;
  sql?: string;
  content?: string;
  url?: string;
  headers?: Record<string, string>;
};

const TABLE_NAME_REGEX = /^[A-Za-z0-9_]+$/;

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
    .slice(0, 8);
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

export class KnowledgeService {
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

  async ingestSource(tenantId: string, sourceId: string): Promise<{
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
    const chunks = this.buildChunks(documents);

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

    logger.info('Knowledge source ingested', {
      tenantId,
      sourceId,
      chunks: chunks.length,
      sourceType: source.type,
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
  }): Promise<Array<{ content: string; sourceId: string; score: number }>> {
    const limit = clamp(params.limit ?? config.maxContextChunks, 1, 20);
    const terms = normalizeTerms(params.query);

    const where =
      terms.length > 0
        ? {
            tenantId: params.tenantId,
            OR: terms.map((term) => ({
              content: {
                contains: term,
                mode: 'insensitive' as const,
              },
            })),
          }
        : { tenantId: params.tenantId };

    const candidates = await prisma.aiKnowledgeChunk.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return candidates
      .map((chunk) => ({
        content: chunk.content,
        sourceId: chunk.sourceId,
        score: terms.length ? lexicalScore(chunk.content, terms) : 1,
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async bootstrapSystemSources(tenantId: string, createdBy?: string): Promise<{
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
        name: 'Catálogo de Serviços',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: { table: 'services_simplified', where: "\"isActive\" = true", limit: 5000 },
      },
      {
        name: 'Workflows por Serviço',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: { table: 'service_workflows', where: "\"isActive\" = true", limit: 5000 },
      },
      {
        name: 'Estrutura de Departamentos',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: { table: 'departments', where: "\"isActive\" = true", limit: 1000 },
      },
      {
        name: 'Organograma de Unidades',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: { table: 'organizational_units', where: "\"isActive\" = true", limit: 10000 },
      },
      {
        name: 'Cargos',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: { table: 'positions', where: "\"isActive\" = true", limit: 5000 },
      },
      {
        name: 'Funções',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: { table: 'functions', where: "\"isActive\" = true", limit: 5000 },
      },
      {
        name: 'Fluxos Conversacionais',
        type: AiKnowledgeSourceType.SYSTEM_TABLE,
        config: { table: 'flow_definitions', where: "\"isActive\" = true", limit: 2000 },
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

  private async extractDocumentsFromSource(source: AiKnowledgeSource): Promise<string[]> {
    const configJson = (source.config ?? {}) as unknown as SourceConfig;

    if (source.type === AiKnowledgeSourceType.MANUAL_TEXT) {
      const content = typeof configJson.content === 'string' ? configJson.content.trim() : '';
      return content ? [content] : [];
    }

    if (source.type === AiKnowledgeSourceType.SYSTEM_TABLE) {
      const table = typeof configJson.table === 'string' ? configJson.table.trim() : '';
      const where = typeof configJson.where === 'string' ? configJson.where.trim() : '';
      const limit = clamp(Number(configJson.limit || 1000), 1, 20000);

      if (!table || !TABLE_NAME_REGEX.test(table)) {
        throw new Error(`Invalid system table name: ${table || 'empty'}`);
      }

      const whereClause = where ? `WHERE ${where}` : '';
      const sql = `SELECT row_to_json(t)::text as content FROM "${table}" t ${whereClause} LIMIT ${limit}`;
      const rows = await prisma.$queryRawUnsafe<Array<{ content: string }>>(sql);
      return rows.map((row) => row.content).filter(Boolean);
    }

    if (source.type === AiKnowledgeSourceType.SQL_QUERY) {
      const sql = typeof configJson.sql === 'string' ? configJson.sql.trim() : '';

      if (!sql.toLowerCase().startsWith('select')) {
        throw new Error('SQL_QUERY sources must start with SELECT');
      }

      const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql);
      return rows.map((row) =>
        typeof row.content === 'string' ? row.content : JSON.stringify(row),
      );
    }

    if (source.type === AiKnowledgeSourceType.HTTP_ENDPOINT) {
      const url = typeof configJson.url === 'string' ? configJson.url.trim() : '';
      if (!url) {
        throw new Error('HTTP endpoint URL is required');
      }

      const headers =
        configJson.headers && typeof configJson.headers === 'object'
          ? configJson.headers
          : undefined;
      const response = await axios.get(url, { headers, timeout: 60000 });
      const payload = response.data;

      if (typeof payload === 'string') {
        return [payload];
      }

      if (Array.isArray(payload)) {
        return payload.map((item) => JSON.stringify(item));
      }

      return [JSON.stringify(payload)];
    }

    return [];
  }

  private buildChunks(documents: string[]): Array<{
    hash: string;
    content: string;
    tokenCount: number;
    metadata: Prisma.JsonObject;
  }> {
    const chunkSize = clamp(config.maxChunkSizeChars, 400, 5000);
    const overlap = clamp(config.chunkOverlapChars, 0, Math.floor(chunkSize / 2));
    const step = Math.max(1, chunkSize - overlap);

    const chunks: Array<{
      hash: string;
      content: string;
      tokenCount: number;
      metadata: Prisma.JsonObject;
    }> = [];

    for (const doc of documents) {
      const normalizedDoc = doc.trim();
      if (!normalizedDoc) continue;

      if (normalizedDoc.length <= chunkSize) {
        const hash = createHash('sha256').update(normalizedDoc).digest('hex');
        chunks.push({
          hash,
          content: normalizedDoc,
          tokenCount: estimateTokenCount(normalizedDoc),
          metadata: {
            chunkIndex: 0,
            originalLength: normalizedDoc.length,
          },
        });
        continue;
      }

      let cursor = 0;
      let index = 0;
      while (cursor < normalizedDoc.length) {
        const piece = normalizedDoc.slice(cursor, cursor + chunkSize).trim();
        if (piece) {
          const hash = createHash('sha256').update(piece).digest('hex');
          chunks.push({
            hash,
            content: piece,
            tokenCount: estimateTokenCount(piece),
            metadata: {
              chunkIndex: index,
              startAt: cursor,
              endAt: Math.min(cursor + chunkSize, normalizedDoc.length),
              originalLength: normalizedDoc.length,
            },
          });
        }

        cursor += step;
        index += 1;
      }
    }

    return chunks;
  }
}

export const knowledgeService = new KnowledgeService();
