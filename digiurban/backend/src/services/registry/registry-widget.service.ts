/**
 * ============================================================================
 * REGISTRY — Widgets do módulo de Gestão de Dados (W0/W1)
 * ============================================================================
 * CRUD de DataWidget + SUGESTÃO AUTOMÁTICA de layout a partir dos metadados do
 * EntityType (tem GEO → Mapa; tem DATE → Agenda; INSCRICAO → Inscritos; tem
 * métrica → Stats/Gráfico; sempre Tabela/Busca/Ficha/Aprovação).
 *
 * scope SHARED (secretaria) e PERSONAL (servidor). Escopado por tenant.
 * Ver PLANO-MODULO-GESTAO-DADOS-WIDGETS.md.
 * ============================================================================
 */

import { prisma } from '../../lib/prisma';
import type { Prisma } from '@prisma/client';
import { tryGetTenantId } from '../../lib/tenant-context';

export class RegistryWidgetError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = 'RegistryWidgetError';
  }
}

export type WidgetType =
  | 'TABLE' | 'CARDS' | 'DETAIL' | 'FILTER' | 'STATS' | 'CHART'
  | 'MAP' | 'AGENDA' | 'TIMELINE' | 'ENROLLMENT' | 'APPROVAL'
  | 'RELATIONS' | 'SAVED_QUERY';

export interface WidgetInput {
  entityTypeId: string;
  scope?: 'SHARED' | 'PERSONAL';
  type: WidgetType;
  title: string;
  config?: unknown;
  layout?: unknown;
  order?: number;
}

const VALID_TYPES = new Set<WidgetType>([
  'TABLE', 'CARDS', 'DETAIL', 'FILTER', 'STATS', 'CHART',
  'MAP', 'AGENDA', 'TIMELINE', 'ENROLLMENT', 'APPROVAL', 'RELATIONS', 'SAVED_QUERY',
]);

// ── Sugestão automática (W1) ────────────────────────────────────────────────

interface SuggestedWidget {
  type: WidgetType;
  title: string;
  config?: Record<string, unknown>;
  order: number;
  suggested: true;
}

// Campo mínimo para a decisão de sugestão (lógica pura, testável sem banco).
export interface FieldForSuggestion {
  dataType: string;
  isMetric?: boolean;
  facetable?: boolean;
}

/**
 * Lógica PURA: deriva os widgets sugeridos a partir do code + campos. Sem I/O.
 */
export function deriveWidgets(entityTypeCode: string, fields: FieldForSuggestion[]): SuggestedWidget[] {
  const hasGeo = fields.some((f) => f.dataType === 'GEO');
  const hasDate = fields.some((f) => f.dataType === 'DATE');
  const hasMetric = fields.some((f) => f.isMetric);
  const hasFacet = fields.some((f) => f.facetable);
  const code = entityTypeCode.toUpperCase();
  const isEnrollment = /^(INSCRICAO|PROGRAMA|MATRICULA)/.test(code);
  const isOccurrence = /^(DENUNCIA|RECLAMACAO|VISTORIA|VISITA)/.test(code);
  const isScheduling = /^(AGENDAMENTO|RESERVA|USO|SOLICITACAO|AUTORIZACAO|LICENCA|ALVARA)/.test(code);

  const w: SuggestedWidget[] = [];
  let order = 0;
  const push = (type: WidgetType, title: string, config?: Record<string, unknown>) =>
    w.push({ type, title, config, order: order++, suggested: true });

  push('STATS', 'Visão geral');
  if (hasFacet) push('FILTER', 'Filtros rápidos');
  push('TABLE', 'Registros');
  if (isEnrollment) push('ENROLLMENT', 'Inscritos');
  if (hasDate || isScheduling) push('AGENDA', 'Agenda');
  if (hasGeo || isOccurrence) push('MAP', 'Mapa');
  if (hasMetric || hasFacet) push('CHART', 'Indicadores');
  push('TIMELINE', 'Evolução');
  push('APPROVAL', 'Aprovação');
  push('RELATIONS', 'Relações');

  return w;
}

/**
 * Deriva os widgets sugeridos para um EntityType (carrega os campos do banco).
 * Layout default quando o servidor ainda não customizou.
 */
export async function suggestWidgets(entityTypeCode: string): Promise<SuggestedWidget[]> {
  const et = await prisma.entityType.findFirst({
    where: { code: entityTypeCode },
    include: { fields: true },
  });
  if (!et) throw new RegistryWidgetError(`Tipo não encontrado: ${entityTypeCode}`, 404);
  return deriveWidgets(et.code, et.fields);
}

// ── CRUD ────────────────────────────────────────────────────────────────────

function validate(input: WidgetInput) {
  if (!input.entityTypeId) throw new RegistryWidgetError('entityTypeId é obrigatório');
  if (!VALID_TYPES.has(input.type)) throw new RegistryWidgetError(`Tipo de widget inválido: ${input.type}`);
  if (!input.title?.trim()) throw new RegistryWidgetError('title é obrigatório');
  if (input.scope && input.scope !== 'SHARED' && input.scope !== 'PERSONAL') {
    throw new RegistryWidgetError('scope inválido (SHARED|PERSONAL)');
  }
}

/**
 * Lista o layout efetivo de um tipo para o servidor: widgets SHARED da
 * secretaria + PERSONAL do servidor. Se não houver nenhum salvo, retorna a
 * SUGESTÃO automática (marcada como suggested, sem id).
 */
export async function getWorkspace(entityTypeCode: string, userId?: string) {
  const et = await prisma.entityType.findFirst({ where: { code: entityTypeCode }, select: { id: true, name: true, code: true } });
  if (!et) throw new RegistryWidgetError(`Tipo não encontrado: ${entityTypeCode}`, 404);

  const saved = await prisma.dataWidget.findMany({
    where: {
      entityTypeId: et.id,
      active: true,
      OR: [{ scope: 'SHARED' }, { scope: 'PERSONAL', ownerUserId: userId ?? '__none__' }],
    },
    orderBy: { order: 'asc' },
  });

  if (saved.length > 0) {
    return { entityType: et.code, entityTypeName: et.name, widgets: saved, source: 'saved' as const };
  }

  const suggested = await suggestWidgets(entityTypeCode);
  return { entityType: et.code, entityTypeName: et.name, widgets: suggested, source: 'suggested' as const };
}

export async function createWidget(input: WidgetInput, userId?: string) {
  validate(input);
  const scope = input.scope ?? 'SHARED';
  const widget = await prisma.dataWidget.create({
    data: {
      tenantId: tryGetTenantId(),
      entityTypeId: input.entityTypeId,
      scope,
      ownerUserId: scope === 'PERSONAL' ? (userId ?? null) : null,
      type: input.type,
      title: input.title.trim(),
      config: (input.config ?? undefined) as Prisma.InputJsonValue | undefined,
      layout: (input.layout ?? undefined) as Prisma.InputJsonValue | undefined,
      order: input.order ?? 0,
    },
  });
  return widget;
}

export async function updateWidget(id: string, patch: Partial<WidgetInput> & { active?: boolean }, userId?: string) {
  const current = await prisma.dataWidget.findFirst({ where: { id } });
  if (!current) throw new RegistryWidgetError('Widget não encontrado', 404);
  // PERSONAL só o dono edita.
  if (current.scope === 'PERSONAL' && current.ownerUserId && current.ownerUserId !== userId) {
    throw new RegistryWidgetError('Sem permissão para editar este widget', 403);
  }
  const widget = await prisma.dataWidget.update({
    where: { id },
    data: {
      title: patch.title?.trim() ?? current.title,
      type: patch.type ?? current.type,
      config: (patch.config as Prisma.InputJsonValue) ?? current.config ?? undefined,
      layout: (patch.layout as Prisma.InputJsonValue) ?? current.layout ?? undefined,
      order: patch.order ?? current.order,
      active: patch.active ?? current.active,
    },
  });
  return widget;
}

export async function deleteWidget(id: string, userId?: string) {
  const current = await prisma.dataWidget.findFirst({ where: { id } });
  if (!current) throw new RegistryWidgetError('Widget não encontrado', 404);
  if (current.scope === 'PERSONAL' && current.ownerUserId && current.ownerUserId !== userId) {
    throw new RegistryWidgetError('Sem permissão para remover este widget', 403);
  }
  await prisma.dataWidget.delete({ where: { id } });
  return { deleted: true };
}

/** Salva o layout sugerido como widgets SHARED (materializa a sugestão). */
export async function adoptSuggestedLayout(entityTypeCode: string) {
  const et = await prisma.entityType.findFirst({ where: { code: entityTypeCode }, select: { id: true } });
  if (!et) throw new RegistryWidgetError(`Tipo não encontrado: ${entityTypeCode}`, 404);
  const existing = await prisma.dataWidget.count({ where: { entityTypeId: et.id, scope: 'SHARED' } });
  if (existing > 0) throw new RegistryWidgetError('Este tipo já tem layout configurado', 409);

  const suggested = await suggestWidgets(entityTypeCode);
  const tenantId = tryGetTenantId();
  await prisma.dataWidget.createMany({
    data: suggested.map((s) => ({
      tenantId,
      entityTypeId: et.id,
      scope: 'SHARED',
      type: s.type,
      title: s.title,
      config: (s.config ?? undefined) as Prisma.InputJsonValue | undefined,
      order: s.order,
    })),
  });
  return getWorkspace(entityTypeCode);
}
