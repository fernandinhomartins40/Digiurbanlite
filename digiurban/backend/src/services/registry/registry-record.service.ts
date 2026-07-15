/**
 * ============================================================================
 * REGISTRY — CRUD de EntityRecord avulso (cadastro/edição/aprovação manual)
 * ============================================================================
 * Suporta o módulo Dados da secretaria: cadastrar/editar/aprovar um registro
 * direto (sem passar por protocolo), com validação contra os FieldDefinition e
 * reprojeção de índices/relações (reusa registry-materialize). Escopado por
 * tenant. Ver PLANO-MODULOS-GERAIS-SECRETARIA.md (UI-3).
 * ============================================================================
 */

import { prisma } from '../../lib/prisma';
import type { Prisma } from '@prisma/client';
import { tryGetTenantId } from '../../lib/tenant-context';
import { normalizeNaturalKey } from './registry.types';
import { projectIndexes, syncReferenceRelations } from './registry-materialize.service';

export class RegistryRecordError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = 'RegistryRecordError';
  }
}

function validateData(fields: Array<{ key: string; label: string; required: boolean; dataType: string }>, data: Record<string, unknown>) {
  for (const f of fields) {
    if (f.required) {
      const v = data[f.key];
      if (v === undefined || v === null || v === '') {
        throw new RegistryRecordError(`Campo obrigatório: ${f.label} (${f.key})`);
      }
    }
  }
}

async function loadType(code: string) {
  const entityType = await prisma.entityType.findFirst({
    where: { code },
    include: { fields: true },
  });
  if (!entityType) throw new RegistryRecordError(`Tipo não encontrado: ${code}`, 404);
  return entityType;
}

function naturalKeyFrom(data: Record<string, unknown>): string | null {
  return normalizeNaturalKey(data.cpf) ?? normalizeNaturalKey(data.cnpj) ?? null;
}

/** Cria um EntityRecord manualmente (status default PENDING → entra na fila). */
export async function createRecord(code: string, data: Record<string, unknown>, status = 'PENDING') {
  const entityType = await loadType(code);
  validateData(entityType.fields, data);
  const tenantId = tryGetTenantId();

  const record = await prisma.entityRecord.create({
    data: {
      tenantId,
      entityTypeId: entityType.id,
      data: data as Prisma.InputJsonValue,
      status,
      naturalKey: naturalKeyFrom(data),
    },
    select: { id: true },
  });

  await projectIndexes(prisma, record.id, entityType.fields, data);
  await syncReferenceRelations(prisma, record.id, entityType.fields, data);
  return getRecord(record.id);
}

/** Atualiza os dados de um EntityRecord e reprojeta índices/relações. */
export async function updateRecord(id: string, data: Record<string, unknown>) {
  const current = await prisma.entityRecord.findFirst({
    where: { id },
    include: { entityType: { include: { fields: true } } },
  });
  if (!current) throw new RegistryRecordError('Registro não encontrado', 404);
  validateData(current.entityType.fields, data);

  await prisma.entityRecord.update({
    where: { id },
    data: { data: data as Prisma.InputJsonValue, naturalKey: naturalKeyFrom(data) },
  });
  await projectIndexes(prisma, id, current.entityType.fields, data);
  await syncReferenceRelations(prisma, id, current.entityType.fields, data);
  return getRecord(id);
}

/** Aprova (ACTIVE) ou rejeita (INACTIVE) um registro da fila. */
export async function setRecordStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
  const current = await prisma.entityRecord.findFirst({ where: { id }, select: { id: true } });
  if (!current) throw new RegistryRecordError('Registro não encontrado', 404);
  await prisma.entityRecord.update({ where: { id }, data: { status } });
  return getRecord(id);
}

/** Detalhe de um registro (dados + tipo). */
export async function getRecord(id: string) {
  const rec = await prisma.entityRecord.findFirst({
    where: { id },
    include: { entityType: { select: { code: true, name: true, kind: true } } },
  });
  if (!rec) throw new RegistryRecordError('Registro não encontrado', 404);
  return {
    id: rec.id,
    entityType: rec.entityType.code,
    entityTypeName: rec.entityType.name,
    status: rec.status,
    data: rec.data,
    sourceProtocolId: rec.sourceProtocolId,
    citizenId: rec.citizenId,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
  };
}

/** Lista registros de um tipo com filtro de status (fila de aprovação usa PENDING). */
export async function listRecords(code: string, opts: { status?: string; page?: number; pageSize?: number } = {}) {
  const entityType = await loadType(code);
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));
  const where: Prisma.EntityRecordWhereInput = {
    entityTypeId: entityType.id,
    ...(opts.status ? { status: opts.status } : {}),
  };
  const [total, records] = await Promise.all([
    prisma.entityRecord.count({ where }),
    prisma.entityRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, data: true, status: true, createdAt: true },
    }),
  ]);
  return { total, page, pageSize, records };
}
