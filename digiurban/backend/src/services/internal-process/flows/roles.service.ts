/**
 * "Quem faz cada etapa" do município: papel → unidade do organograma.
 * Preenchido uma vez (com sugestão pelo nome das unidades) e usado por todos
 * os fluxos para encaminhar sozinho ao avançar de etapa.
 */

import { prisma } from '../../../lib/prisma';
import { InternalProcessError } from '../internal-process.service';
import { CONFIGURABLE_ROLES, FLOW_ROLES, FlowRole, isFlowRole, suggestRoleUnits } from './roles';

export type RoleUnits = Partial<Record<FlowRole, { unitId: string; unitName: string }>>;

/** Papéis ligados (só unidades ativas) */
export async function getRoleUnits(): Promise<RoleUnits> {
  const rows = await prisma.internalProcessRoleUnit.findMany();
  if (rows.length === 0) return {};
  const active = await prisma.organizationalUnit.findMany({
    where: { id: { in: rows.map((row) => row.unitId) }, isActive: true },
    select: { id: true, nome: true },
  });
  const names = new Map(active.map((unit) => [unit.id, unit.nome]));
  const result: RoleUnits = {};
  for (const row of rows) {
    if (isFlowRole(row.role) && names.has(row.unitId)) result[row.role] = { unitId: row.unitId, unitName: names.get(row.unitId)! };
  }
  return result;
}

/** Só os ids (para as regras puras) */
export function roleUnitIds(roleUnits: RoleUnits): Partial<Record<string, string>> {
  return Object.fromEntries(Object.entries(roleUnits).map(([role, value]) => [role, value!.unitId]));
}

/** Tela "Quem faz cada etapa": papéis, unidade ligada e sugestão */
export async function getRoleSettings() {
  const [roleUnits, units] = await Promise.all([
    getRoleUnits(),
    prisma.organizationalUnit.findMany({
      where: { isActive: true },
      orderBy: [{ nivel: 'asc' }, { nome: 'asc' }],
      select: { id: true, nome: true, sigla: true, nivel: true, competencias: true, department: { select: { name: true } } },
    }),
  ]);
  const suggestions = suggestRoleUnits(units);
  const nameOf = new Map(units.map((unit) => [unit.id, unit.nome]));
  return {
    roles: Object.values(FLOW_ROLES).map((role) => ({
      key: role.key,
      name: role.name,
      hint: role.hint,
      configurable: role.configurable,
      unitId: roleUnits[role.key]?.unitId || null,
      unitName: roleUnits[role.key]?.unitName || null,
      suggestedUnitId: suggestions[role.key] || null,
      suggestedUnitName: suggestions[role.key] ? nameOf.get(suggestions[role.key]!) || null : null,
    })),
    units: units.map((unit) => ({ id: unit.id, nome: unit.nome, sigla: unit.sigla, department: unit.department?.name || null })),
    configured: Object.keys(roleUnits).length,
  };
}

/** Salvar (administrador). unitId vazio = desligar o papel */
export async function saveRoleSettings(actor: { id: string; name: string }, input: Record<string, unknown>) {
  const entries = Object.entries(input || {}).filter(([role]) => (CONFIGURABLE_ROLES as string[]).includes(role));
  const unitIds = [...new Set(entries.map(([, unitId]) => (typeof unitId === 'string' ? unitId : '')).filter(Boolean))];
  const units = unitIds.length
    ? await prisma.organizationalUnit.findMany({ where: { id: { in: unitIds }, isActive: true }, select: { id: true, nome: true } })
    : [];
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  for (const [role, unitId] of entries) {
    const existing = await prisma.internalProcessRoleUnit.findFirst({ where: { role } });
    if (typeof unitId !== 'string' || !unitId) {
      if (existing) await prisma.internalProcessRoleUnit.delete({ where: { id: existing.id } });
      continue;
    }
    const unit = unitById.get(unitId);
    if (!unit) throw new InternalProcessError(`Unidade não encontrada para "${FLOW_ROLES[role as FlowRole].name}".`);
    if (existing) {
      await prisma.internalProcessRoleUnit.update({ where: { id: existing.id }, data: { unitId: unit.id, unitName: unit.nome, updatedBy: actor.name } });
    } else {
      await prisma.internalProcessRoleUnit.create({ data: { role, unitId: unit.id, unitName: unit.nome, updatedBy: actor.name } });
    }
  }
  return getRoleSettings();
}
