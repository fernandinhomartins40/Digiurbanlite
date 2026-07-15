/**
 * ============================================================================
 * REGISTRY F3/F5 — Materialização (customData → EntityRecord + RecordIndex)
 * ============================================================================
 * Núcleo reutilizável que transforma o customData de um protocolo COM_DADOS em
 * um EntityRecord canônico e projeta os campos `indexable` em record_indexes.
 *
 * Usado por:
 *   - Backfill (F3): scripts/registry/backfill.ts, sobre protocolos existentes.
 *   - Aprovação (F5): gancho em approveProtocol, na mesma transação.
 *
 * Idempotente por sourceProtocolId: re-materializar um protocolo atualiza o
 * mesmo EntityRecord e reprojeta seus índices (nunca duplica).
 *
 * A tenant extension escopa por tenant automaticamente. Escritas herdam o
 * tenantId do contexto ALS. Ver PLANO-IMPLEMENTACAO-REGISTRY.md (F3).
 * ============================================================================
 */

import { prisma } from '../../lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';
import { coerceIndexValue, normalizeNaturalKey, type RegistryDataType } from './registry.types';
import { logger } from '../../config/logger.config';

// Aceita tanto o prisma da app quanto um client de transação.
type Db = PrismaClient | Prisma.TransactionClient;

export interface MaterializeInput {
  protocolId: string;
  entityTypeCode: string; // = moduleType
  customData: unknown;
  citizenId?: string | null;
  status?: string; // ACTIVE | PENDING | INACTIVE
}

export interface MaterializeResult {
  recordId: string;
  created: boolean;
  indexedFields: number;
  relations: number; // relações criadas/confirmadas
  resolvedByNaturalKey?: boolean; // reusou registro existente (dedup)
  skipped?: string; // motivo, quando não materializou
}

/** Remove chaves de controle do customData, deixando só os dados do formulário. */
export function stripMeta(customData: unknown): Record<string, unknown> {
  if (!customData || typeof customData !== 'object') return {};
  const { _meta, _geoSource, ...rest } = customData as Record<string, unknown>;
  return rest;
}

/**
 * Materializa um protocolo. Requer que o EntityType (por code) já exista no
 * tenant (populado pela F1). Se não existir, retorna skipped — o backfill loga
 * e segue (não é erro fatal).
 */
export async function materializeProtocol(
  input: MaterializeInput,
  db: Db = prisma
): Promise<MaterializeResult> {
  const entityType = await db.entityType.findFirst({
    where: { code: input.entityTypeCode },
    include: { fields: true },
  });
  if (!entityType) {
    return {
      recordId: '',
      created: false,
      indexedFields: 0,
      relations: 0,
      skipped: `EntityType ausente: ${input.entityTypeCode}`,
    };
  }

  const data = stripMeta(input.customData);

  // naturalKey a partir de CPF/CNPJ (identificador natural para entity resolution)
  const naturalKey =
    normalizeNaturalKey((data as Record<string, unknown>).cpf) ??
    normalizeNaturalKey((data as Record<string, unknown>).cnpj) ??
    null;

  const recordData = {
    entityTypeId: entityType.id,
    data: data as Prisma.InputJsonValue,
    status: input.status ?? 'ACTIVE',
    sourceProtocolId: input.protocolId,
    citizenId: input.citizenId ?? null,
    naturalKey,
  };

  // ── Resolução do EntityRecord (ordem de precedência) ────────────────────
  // 1) mesmo protocolo já materializado → atualiza (idempotência);
  // 2) mesmo naturalKey no mesmo tipo → REUSA (dedup: mesmo produtor/empresa
  //    cadastrado por protocolos diferentes vira UM registro);
  // 3) senão → cria.
  let recordId: string;
  let created = false;
  let resolvedByNaturalKey = false;

  const byProtocol = await db.entityRecord.findFirst({
    where: { sourceProtocolId: input.protocolId },
    select: { id: true },
  });

  if (byProtocol) {
    await db.entityRecord.update({ where: { id: byProtocol.id }, data: recordData });
    recordId = byProtocol.id;
    // índices reprojetados por projectIndexes() abaixo (faz o deleteMany)
  } else if (naturalKey) {
    const byKey = await db.entityRecord.findFirst({
      where: { entityTypeId: entityType.id, naturalKey },
      select: { id: true },
    });
    if (byKey) {
      // Dedup: atualiza o registro existente com os dados mais recentes.
      await db.entityRecord.update({ where: { id: byKey.id }, data: recordData });
      recordId = byKey.id;
      resolvedByNaturalKey = true;
    } else {
      const record = await db.entityRecord.create({ data: recordData, select: { id: true } });
      recordId = record.id;
      created = true;
    }
  } else {
    const record = await db.entityRecord.create({ data: recordData, select: { id: true } });
    recordId = record.id;
    created = true;
  }

  // Projeção de índices + relações declarativas (reutilizável).
  const indexedFields = await projectIndexes(db, recordId, entityType.fields, data);
  const relations = await syncReferenceRelations(db, recordId, entityType.fields, data);

  return { recordId, created, indexedFields, relations, resolvedByNaturalKey };
}

// Tipo mínimo de um FieldDefinition usado na projeção.
type FieldLike = { key: string; dataType: string; indexable: boolean; validation?: unknown };

/**
 * Projeta os campos `indexable` de um registro em record_indexes (apaga os
 * antigos e recria). Retorna a quantidade projetada. Reutilizado por
 * materialização, cadastro/edição manual (F6/UI) e reindex.
 */
export async function projectIndexes(
  db: Db,
  recordId: string,
  fields: FieldLike[],
  data: Record<string, unknown>
): Promise<number> {
  await db.recordIndex.deleteMany({ where: { recordId } });
  const indexRows: Prisma.RecordIndexCreateManyInput[] = [];
  for (const field of fields) {
    if (!field.indexable) continue;
    const coerced = coerceIndexValue(field.dataType as RegistryDataType, data[field.key]);
    if (!coerced) continue;
    indexRows.push({
      recordId,
      fieldKey: field.key,
      [coerced.column]: coerced.value,
    } as Prisma.RecordIndexCreateManyInput);
  }
  if (indexRows.length > 0) await db.recordIndex.createMany({ data: indexRows });
  return indexRows.length;
}

/**
 * Cria/confirma EntityRelation para campos REFERENCE (valor = naturalKey do
 * alvo; validation.referenceType/relType). Idempotente. Retorna nº de relações.
 */
export async function syncReferenceRelations(
  db: Db,
  recordId: string,
  fields: FieldLike[],
  data: Record<string, unknown>
): Promise<number> {
  let relations = 0;
  for (const field of fields) {
    if (field.dataType !== 'REFERENCE') continue;
    const targetKey = normalizeNaturalKey(data[field.key]);
    if (!targetKey) continue;

    const validation = (field.validation ?? {}) as { referenceType?: string; relType?: string };
    if (!validation.referenceType) continue;

    const targetType = await db.entityType.findFirst({
      where: { code: validation.referenceType },
      select: { id: true },
    });
    if (!targetType) continue;

    const targetRecord = await db.entityRecord.findFirst({
      where: { entityTypeId: targetType.id, naturalKey: targetKey },
      select: { id: true },
    });
    if (!targetRecord || targetRecord.id === recordId) continue;

    const relType = validation.relType || 'REFERENCES';
    const existingRel = await db.entityRelation.findFirst({
      where: { fromRecordId: recordId, toRecordId: targetRecord.id, relType },
      select: { id: true },
    });
    if (!existingRel) {
      await db.entityRelation.create({
        data: { fromRecordId: recordId, toRecordId: targetRecord.id, relType },
      });
    }
    relations++;
  }
  return relations;
}

/** Flag REGISTRY_WRITE (off|on) — controla a materialização na aprovação. */
export function isRegistryWriteOn(): boolean {
  return String(process.env.REGISTRY_WRITE ?? 'off').trim().toLowerCase() === 'on';
}

/**
 * Gancho de aprovação (F5). Materializa o protocolo aprovado no Registry, NA
 * MESMA transação `db`. Só roda quando REGISTRY_WRITE=on.
 *
 * NÃO-FATAL: qualquer erro é logado e engolido — a aprovação NUNCA falha por
 * causa do Registry (o backfill/F3 reconcilia depois). Ver PLANO (F5, §25).
 */
export async function materializeOnApproval(
  input: MaterializeInput,
  db: Db
): Promise<void> {
  if (!isRegistryWriteOn()) return;
  try {
    const result = await materializeProtocol({ ...input, status: input.status ?? 'ACTIVE' }, db);
    if (result.skipped) {
      logger.info('[registry-write] materialização pulada na aprovação', {
        protocolId: input.protocolId,
        reason: result.skipped,
      });
    } else {
      logger.info('[registry-write] protocolo materializado na aprovação', {
        protocolId: input.protocolId,
        recordId: result.recordId,
        created: result.created,
        resolvedByNaturalKey: result.resolvedByNaturalKey,
        indexedFields: result.indexedFields,
        relations: result.relations,
      });
    }
  } catch (error) {
    logger.error('[registry-write] materialização falhou na aprovação (ignorada)', {
      protocolId: input.protocolId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
