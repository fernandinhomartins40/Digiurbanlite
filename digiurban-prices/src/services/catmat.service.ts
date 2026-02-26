import { prisma } from '../models/prisma';
import { getCatmatClient } from '../connectors/catmat/catmat.client';
import { logger } from '../utils/logger';

export interface CatmatSearchResult {
  code: string;
  type: 'material' | 'service';
  description: string;
  groupDescription?: string;
  classDescription?: string;
}

// Busca local no banco de dados (muito mais rápida que a API)
export async function searchCatmatLocal(
  q: string,
  type?: 'material' | 'service' | 'both',
  limit = 20,
): Promise<CatmatSearchResult[]> {
  const where: Record<string, unknown> = {
    isActive: true,
    description: { contains: q, mode: 'insensitive' },
  };

  if (type && type !== 'both') {
    where['type'] = type;
  }

  const items = await prisma.catmatItem.findMany({
    where,
    take: limit,
    select: {
      code: true,
      type: true,
      description: true,
      groupDescription: true,
      classDescription: true,
    },
    orderBy: { description: 'asc' },
  });

  return items.map((i) => ({
    code: i.code,
    type: i.type as 'material' | 'service',
    description: i.description,
    groupDescription: i.groupDescription ?? undefined,
    classDescription: i.classDescription ?? undefined,
  }));
}

// Busca na API CATMAT (fallback se banco vazio)
export async function searchCatmatApi(
  q: string,
  type?: 'material' | 'service' | 'both',
  limit = 20,
): Promise<CatmatSearchResult[]> {
  const client = getCatmatClient();
  const results = await client.search({ q, type: type ?? 'both', pageSize: limit });
  return results.map((r) => ({
    code: r.code,
    type: r.type,
    description: r.description,
  }));
}

// Busca unificada: tenta local primeiro, cai na API se necessário
export async function searchCatmat(
  q: string,
  type?: 'material' | 'service' | 'both',
  limit = 20,
): Promise<CatmatSearchResult[]> {
  if (!q || q.trim().length < 2) return [];

  // Contar itens no banco
  const localCount = await prisma.catmatItem.count({ where: { isActive: true } });

  if (localCount > 1000) {
    // Usar banco local (seed já foi executado)
    return searchCatmatLocal(q.trim(), type, limit);
  }

  // Fallback: API CATMAT
  logger.debug('[CATMAT] Using API fallback (local DB has <1000 items)', { localCount });
  return searchCatmatApi(q.trim(), type, limit);
}

// Seed do catálogo CATMAT/CATSER no banco local
// Deve ser executado uma vez na inicialização e mensalmente via cron
export async function syncCatmatCatalog(): Promise<{ synced: number; errors: number }> {
  const client = getCatmatClient();
  let synced = 0;
  let errors = 0;

  logger.info('[CATMAT] Starting catalog sync');

  try {
    // Materiais
    for await (const batch of client.fetchAllMateriais(500)) {
      for (const mat of batch) {
        try {
          await prisma.catmatItem.upsert({
            where: { code: mat.codigo },
            create: {
              code: mat.codigo,
              type: 'material',
              description: mat.descricao,
              groupCode: mat.grupoCodigo,
              groupDescription: mat.grupoDescricao,
              classCode: mat.classeCodigo,
              classDescription: mat.classeDescricao,
              pdmCode: mat.pdmCodigo,
              pdmDescription: mat.pdmDescricao,
              isActive: mat.statusCode !== 'I',
            },
            update: {
              description: mat.descricao,
              groupDescription: mat.grupoDescricao,
              classDescription: mat.classeDescricao,
              isActive: mat.statusCode !== 'I',
              syncedAt: new Date(),
            },
          });
          synced++;
        } catch { errors++; }
      }

      if (synced % 1000 === 0) {
        logger.info('[CATMAT] Sync progress (materiais)', { synced });
      }
    }

    // Serviços
    for await (const batch of client.fetchAllServicos(200)) {
      for (const svc of batch) {
        try {
          await prisma.catmatItem.upsert({
            where: { code: svc.codigo },
            create: {
              code: svc.codigo,
              type: 'service',
              description: svc.descricao,
              groupCode: svc.grupoCodigo,
              groupDescription: svc.grupoDescricao,
              classCode: svc.classeCodigo,
              classDescription: svc.classeDescricao,
              isActive: svc.statusCode !== 'I',
            },
            update: {
              description: svc.descricao,
              groupDescription: svc.grupoDescricao,
              isActive: svc.statusCode !== 'I',
              syncedAt: new Date(),
            },
          });
          synced++;
        } catch { errors++; }
      }
    }
  } catch (err: unknown) {
    logger.error('[CATMAT] Sync error', { error: (err as Error).message });
    errors++;
  }

  logger.info('[CATMAT] Catalog sync done', { synced, errors });
  return { synced, errors };
}

// Enriquecer um LineItem com a descrição do CATMAT
export async function enrichWithCatmat(catmatCode: string | null): Promise<string | null> {
  if (!catmatCode) return null;
  try {
    const item = await prisma.catmatItem.findUnique({
      where: { code: catmatCode },
      select: { description: true },
    });
    return item?.description ?? null;
  } catch {
    return null;
  }
}
