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
    return { recordId: '', created: false, indexedFields: 0, skipped: `EntityType ausente: ${input.entityTypeCode}` };
  }

  const data = stripMeta(input.customData);

  // naturalKey a partir de CPF/CNPJ (entity resolution na F5; aqui só grava)
  const naturalKey =
    normalizeNaturalKey((data as Record<string, unknown>).cpf) ??
    normalizeNaturalKey((data as Record<string, unknown>).cnpj) ??
    null;

  // Upsert do EntityRecord por sourceProtocolId (idempotente)
  const existing = await db.entityRecord.findFirst({
    where: { sourceProtocolId: input.protocolId },
    select: { id: true },
  });

  const recordData = {
    entityTypeId: entityType.id,
    data: data as Prisma.InputJsonValue,
    status: input.status ?? 'ACTIVE',
    sourceProtocolId: input.protocolId,
    citizenId: input.citizenId ?? null,
    naturalKey,
  };

  let recordId: string;
  let created: boolean;
  if (existing) {
    await db.entityRecord.update({ where: { id: existing.id }, data: recordData });
    recordId = existing.id;
    created = false;
    // Reprojeção: apaga índices antigos deste record
    await db.recordIndex.deleteMany({ where: { recordId } });
  } else {
    const record = await db.entityRecord.create({ data: recordData, select: { id: true } });
    recordId = record.id;
    created = true;
  }

  // Projetar campos indexáveis
  const indexRows: Prisma.RecordIndexCreateManyInput[] = [];
  for (const field of entityType.fields) {
    if (!field.indexable) continue;
    const raw = (data as Record<string, unknown>)[field.key];
    const coerced = coerceIndexValue(field.dataType as RegistryDataType, raw);
    if (!coerced) continue;
    indexRows.push({
      recordId,
      fieldKey: field.key,
      [coerced.column]: coerced.value,
    } as Prisma.RecordIndexCreateManyInput);
  }

  if (indexRows.length > 0) {
    await db.recordIndex.createMany({ data: indexRows });
  }

  return { recordId, created, indexedFields: indexRows.length };
}
