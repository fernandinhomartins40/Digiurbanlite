/**
 * ============================================================================
 * REGISTRY F6 — Admin (CRUD de EntityType/FieldDefinition) + reindex
 * ============================================================================
 * Lógica de negócio por trás do editor no-code: valida e persiste a definição
 * de tipos/campos, e REPROJETA os índices dos registros existentes quando um
 * campo passa a ser indexável (ou muda de tipo). Assim a secretaria cria/edita
 * um serviço estruturado sem deploy e as buscas/dashboards passam a funcionar
 * imediatamente. Ver PLANO-IMPLEMENTACAO-REGISTRY.md (F6, F0-camada 1 §19).
 *
 * Escopado por tenant pela extension. Uniques compostas [tenantId, …] → usar
 * findFirst (ver CLAUDE.md).
 * ============================================================================
 */

import { prisma } from '../../lib/prisma';
import type { Prisma } from '@prisma/client';
import { tryGetTenantId } from '../../lib/tenant-context';
import {
  coerceIndexValue,
  OPERATORS_BY_TYPE,
  type RegistryDataType,
} from './registry.types';

const VALID_DATATYPES = new Set(Object.keys(OPERATORS_BY_TYPE));
const VALID_KINDS = new Set(['PERSON_ROLE', 'PROPERTY', 'ORG', 'EVENT']);
const VALID_AGG = new Set(['SUM', 'AVG', 'MIN', 'MAX', 'COUNT']);

export class RegistryAdminError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = 'RegistryAdminError';
  }
}

export interface FieldDefinitionInput {
  key: string;
  label: string;
  dataType: string;
  required?: boolean;
  validation?: unknown;
  indexable?: boolean;
  filterable?: boolean;
  facetable?: boolean;
  searchable?: boolean;
  isMetric?: boolean;
  aggregation?: string | null;
  isPII?: boolean;
  displayInTable?: boolean;
  displayInCard?: boolean;
  order?: number;
}

export interface EntityTypeInput {
  code: string;
  name: string;
  kind?: string;
  department?: string | null;
  icon?: string | null;
  color?: string | null;
  materializesFrom?: string[];
  active?: boolean;
  fields?: FieldDefinitionInput[];
}

// ── Validação ───────────────────────────────────────────────────────────────

function validateField(f: FieldDefinitionInput): void {
  if (!f.key || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(f.key)) {
    throw new RegistryAdminError(`key inválida: "${f.key}" (use letras/números/_, sem espaços)`);
  }
  if (!f.label?.trim()) throw new RegistryAdminError(`label obrigatório para o campo ${f.key}`);
  const dt = String(f.dataType || '').toUpperCase();
  if (!VALID_DATATYPES.has(dt)) {
    throw new RegistryAdminError(`dataType inválido para ${f.key}: ${f.dataType}`);
  }
  if (f.isMetric) {
    if (dt !== 'NUMBER') throw new RegistryAdminError(`isMetric só é válido em campos NUMBER (${f.key})`);
    if (f.aggregation && !VALID_AGG.has(String(f.aggregation).toUpperCase())) {
      throw new RegistryAdminError(`aggregation inválida para ${f.key}: ${f.aggregation}`);
    }
  }
  // Facet/filtro/busca performáticos exigem projeção.
  if ((f.facetable || f.filterable) && f.indexable === false) {
    // Permite, mas o motor de query só usa índice se indexable — aviso semântico
    // fica a cargo do frontend; aqui não bloqueia.
  }
}

function normalizeField(f: FieldDefinitionInput, idx: number): Required<Omit<FieldDefinitionInput, 'validation'>> & { validation: Prisma.InputJsonValue | undefined } {
  const dt = String(f.dataType).toUpperCase();
  return {
    key: f.key.trim(),
    label: f.label.trim(),
    dataType: dt,
    required: Boolean(f.required),
    validation: (f.validation ?? undefined) as Prisma.InputJsonValue | undefined,
    indexable: Boolean(f.indexable),
    filterable: Boolean(f.filterable),
    facetable: Boolean(f.facetable),
    searchable: Boolean(f.searchable),
    isMetric: Boolean(f.isMetric),
    aggregation: f.isMetric ? (f.aggregation ? String(f.aggregation).toUpperCase() : 'SUM') : null,
    isPII: Boolean(f.isPII),
    displayInTable: Boolean(f.displayInTable),
    displayInCard: Boolean(f.displayInCard),
    order: Number.isFinite(f.order) ? Number(f.order) : idx,
  };
}

function validateEntityType(input: EntityTypeInput, requireCode = true): void {
  if (requireCode && (!input.code || !/^[A-Z][A-Z0-9_]*$/.test(input.code))) {
    throw new RegistryAdminError(`code inválido: "${input.code}" (use MAIÚSCULAS/números/_, ex.: CADASTRO_IMOVEL)`);
  }
  if (!input.name?.trim()) throw new RegistryAdminError('name é obrigatório');
  if (input.kind && !VALID_KINDS.has(input.kind)) {
    throw new RegistryAdminError(`kind inválido: ${input.kind} (PERSON_ROLE|PROPERTY|ORG|EVENT)`);
  }
  for (const f of input.fields ?? []) validateField(f);
  // keys duplicadas
  const keys = (input.fields ?? []).map((f) => f.key);
  const dup = keys.find((k, i) => keys.indexOf(k) !== i);
  if (dup) throw new RegistryAdminError(`campo duplicado: ${dup}`);
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function createEntityType(input: EntityTypeInput) {
  validateEntityType(input);
  const exists = await prisma.entityType.findFirst({ where: { code: input.code }, select: { id: true } });
  if (exists) throw new RegistryAdminError(`Já existe um tipo com code ${input.code}`, 409);

  // A tenant extension injeta tenantId no `data` de topo, mas NÃO em nested
  // creates — por isso o tenantId é propagado explicitamente aos fields.
  const tenantId = tryGetTenantId();

  const entityType = await prisma.entityType.create({
    data: {
      code: input.code,
      name: input.name.trim(),
      kind: input.kind ?? 'EVENT',
      department: input.department ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      materializesFrom: input.materializesFrom ?? [],
      active: input.active ?? true,
      fields: input.fields?.length
        ? { create: input.fields.map((f, i) => ({ ...normalizeField(f, i), tenantId })) }
        : undefined,
    },
    include: { fields: { orderBy: { order: 'asc' } } },
  });
  return entityType;
}

/**
 * Atualiza um EntityType e seus campos (diff completo). Detecta campos que
 * passaram a exigir projeção (indexável novo/alterado) e dispara reindex.
 */
export async function updateEntityType(code: string, input: EntityTypeInput) {
  validateEntityType({ ...input, code }, false);
  const current = await prisma.entityType.findFirst({
    where: { code },
    include: { fields: true },
  });
  if (!current) throw new RegistryAdminError(`Tipo não encontrado: ${code}`, 404);

  await prisma.entityType.update({
    where: { id: current.id },
    data: {
      name: input.name.trim(),
      kind: input.kind ?? current.kind,
      department: input.department ?? current.department,
      icon: input.icon ?? current.icon,
      color: input.color ?? current.color,
      materializesFrom: input.materializesFrom ?? current.materializesFrom,
      active: input.active ?? current.active,
    },
  });

  let reindexNeeded = false;
  if (input.fields) {
    const currentByKey = new Map(current.fields.map((f) => [f.key, f]));
    const incomingKeys = new Set(input.fields.map((f) => f.key));

    // Upsert dos campos recebidos
    for (let i = 0; i < input.fields.length; i++) {
      const norm = normalizeField(input.fields[i], i);
      const existing = currentByKey.get(norm.key);
      if (existing) {
        // Mudança que afeta projeção?
        if (existing.indexable !== norm.indexable || existing.dataType !== norm.dataType) {
          reindexNeeded = true;
        }
        await prisma.fieldDefinition.update({ where: { id: existing.id }, data: norm });
      } else {
        await prisma.fieldDefinition.create({ data: { entityTypeId: current.id, tenantId: tryGetTenantId(), ...norm } });
        if (norm.indexable) reindexNeeded = true;
      }
    }
    // Remover campos que sumiram
    for (const f of current.fields) {
      if (!incomingKeys.has(f.key)) {
        await prisma.fieldDefinition.delete({ where: { id: f.id } });
        if (f.indexable) reindexNeeded = true;
      }
    }
  }

  if (reindexNeeded) {
    await reindexEntityType(current.id);
  }

  return prisma.entityType.findFirst({
    where: { id: current.id },
    include: { fields: { orderBy: { order: 'asc' } } },
  });
}

export async function deleteEntityType(code: string, hard = false) {
  const current = await prisma.entityType.findFirst({ where: { code }, select: { id: true, _count: { select: { records: true } } } });
  if (!current) throw new RegistryAdminError(`Tipo não encontrado: ${code}`, 404);
  if (hard) {
    // Só permite hard-delete se não houver registros materializados.
    if (current._count.records > 0) {
      throw new RegistryAdminError(`Tipo ${code} tem ${current._count.records} registros — desative em vez de excluir`, 409);
    }
    await prisma.entityType.delete({ where: { id: current.id } });
    return { deleted: true };
  }
  await prisma.entityType.update({ where: { id: current.id }, data: { active: false } });
  return { deactivated: true };
}

/**
 * Reprojeta record_indexes de TODOS os registros de um EntityType conforme os
 * FieldDefinitions atuais. Idempotente: apaga e recria os índices por record.
 * Usado quando o schema de campos muda (indexável novo, tipo alterado, remoção).
 */
export async function reindexEntityType(entityTypeId: string): Promise<{ records: number; indexed: number }> {
  const fields = await prisma.fieldDefinition.findMany({
    where: { entityTypeId, indexable: true },
    select: { key: true, dataType: true },
  });

  let recordsProcessed = 0;
  let indexed = 0;
  const BATCH = 500;
  let cursor: string | undefined;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const records = await prisma.entityRecord.findMany({
      where: { entityTypeId },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: { id: true, data: true },
    });
    if (records.length === 0) break;
    cursor = records[records.length - 1].id;

    for (const rec of records) {
      recordsProcessed++;
      await prisma.recordIndex.deleteMany({ where: { recordId: rec.id } });
      const data = (rec.data ?? {}) as Record<string, unknown>;
      const rows: Prisma.RecordIndexCreateManyInput[] = [];
      for (const f of fields) {
        const coerced = coerceIndexValue(f.dataType as RegistryDataType, data[f.key]);
        if (!coerced) continue;
        rows.push({ recordId: rec.id, fieldKey: f.key, [coerced.column]: coerced.value } as Prisma.RecordIndexCreateManyInput);
      }
      if (rows.length) {
        await prisma.recordIndex.createMany({ data: rows });
        indexed += rows.length;
      }
    }
  }

  return { records: recordsProcessed, indexed };
}
