/**
 * "Quem faz cada etapa" do município: papel → unidade do organograma.
 * Preenchido uma vez (com sugestão pelo nome das unidades) e usado por todos
 * os fluxos para encaminhar sozinho ao avançar de etapa.
 */

import { prisma } from '../../../lib/prisma';
import { InternalProcessError } from '../internal-process.service';
import { CONFIGURABLE_ROLES, FLOW_ROLES, FlowRole, isFlowRole, suggestRoleUnits } from './roles';
import { FlowDefinition, RoleRoute } from './flows';

export type RoleUnits = Partial<Record<FlowRole, { unitId: string; unitName: string; userId: string | null; userName: string | null }>>;

/** Papéis ligados (só unidades ativas) */
export async function getRoleUnits(): Promise<RoleUnits> {
  const rows = await prisma.internalProcessRoleUnit.findMany();
  if (rows.length === 0) return {};
  const active = await prisma.organizationalUnit.findMany({
    where: { id: { in: rows.map((row) => row.unitId) }, isActive: true },
    select: { id: true, nome: true },
  });
  const names = new Map(active.map((unit) => [unit.id, unit.nome]));
  const userIds = rows.map((row) => row.userId).filter(Boolean) as string[];
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds }, isActive: true }, select: { id: true, name: true } }) : [];
  const userNames = new Map(users.map((user) => [user.id, user.name]));
  const result: RoleUnits = {};
  for (const row of rows) {
    if (!isFlowRole(row.role) || !names.has(row.unitId)) continue;
    const userName = row.userId ? userNames.get(row.userId) || null : null;
    result[row.role] = { unitId: row.unitId, unitName: names.get(row.unitId)!, userId: userName ? row.userId : null, userName };
  }
  return result;
}

/** Papéis no formato das regras puras (stageRoute) */
export function roleRoutes(roleUnits: RoleUnits): Partial<Record<string, RoleRoute>> {
  return roleUnits as Partial<Record<string, RoleRoute>>;
}

/**
 * Confere no banco os destinos fixos das etapas de um fluxo editado (unidade
 * ativa; pessoa ativa) e grava os nomes. Destino que não existe é tirado.
 */
export async function hydrateStageTargets(flow: FlowDefinition): Promise<FlowDefinition> {
  const unitIds = [...new Set(flow.stages.map((stage) => stage.unitId).filter(Boolean) as string[])];
  const userIds = [...new Set(flow.stages.map((stage) => stage.userId).filter(Boolean) as string[])];
  const [units, users] = await Promise.all([
    unitIds.length ? prisma.organizationalUnit.findMany({ where: { id: { in: unitIds }, isActive: true }, select: { id: true, nome: true } }) : Promise.resolve([]),
    userIds.length ? prisma.user.findMany({ where: { id: { in: userIds }, isActive: true }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  const unitName = new Map(units.map((unit) => [unit.id, unit.nome]));
  const userName = new Map(users.map((user) => [user.id, user.name]));
  return {
    ...flow,
    stages: flow.stages.map((stage) => {
      const unit = stage.unitId && unitName.has(stage.unitId) ? stage.unitId : null;
      const user = unit && stage.userId && userName.has(stage.userId) ? stage.userId : null;
      return { ...stage, unitId: unit, unitName: unit ? unitName.get(unit)! : null, userId: user, userName: user ? userName.get(user)! : null };
    }),
  };
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
      userId: roleUnits[role.key]?.userId || null,
      userName: roleUnits[role.key]?.userName || null,
      suggestedUnitId: suggestions[role.key] || null,
      suggestedUnitName: suggestions[role.key] ? nameOf.get(suggestions[role.key]!) || null : null,
    })),
    units: units.map((unit) => ({ id: unit.id, nome: unit.nome, sigla: unit.sigla, department: unit.department?.name || null })),
    configured: Object.keys(roleUnits).length,
  };
}

/**
 * Salvar (administrador). Cada papel: { unitId, userId? } (ou só o unitId).
 * unitId vazio = desligar o papel. userId = o servidor que recebe; sem ele, a
 * unidade toda recebe.
 */
export async function saveRoleSettings(actor: { id: string; name: string }, input: Record<string, unknown>) {
  const entries = Object.entries(input || {})
    .filter(([role]) => (CONFIGURABLE_ROLES as string[]).includes(role))
    .map(([role, value]) => {
      const unitId = typeof value === 'string' ? value : typeof (value as any)?.unitId === 'string' ? (value as any).unitId : '';
      const userId = typeof (value as any)?.userId === 'string' ? (value as any).userId : '';
      return { role, unitId, userId };
    });
  const unitIds = [...new Set(entries.map((entry) => entry.unitId).filter(Boolean))];
  const userIds = [...new Set(entries.map((entry) => entry.userId).filter(Boolean))];
  const [units, users] = await Promise.all([
    unitIds.length ? prisma.organizationalUnit.findMany({ where: { id: { in: unitIds }, isActive: true }, select: { id: true, nome: true } }) : Promise.resolve([]),
    userIds.length ? prisma.user.findMany({ where: { id: { in: userIds }, isActive: true }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const userById = new Map(users.map((user) => [user.id, user]));
  for (const { role, unitId, userId } of entries) {
    const existing = await prisma.internalProcessRoleUnit.findFirst({ where: { role } });
    if (!unitId) {
      if (existing) await prisma.internalProcessRoleUnit.delete({ where: { id: existing.id } });
      continue;
    }
    const unit = unitById.get(unitId);
    if (!unit) throw new InternalProcessError(`Unidade não encontrada para "${FLOW_ROLES[role as FlowRole].name}".`);
    const user = userId ? userById.get(userId) : null;
    if (userId && !user) throw new InternalProcessError(`Servidor não encontrado para "${FLOW_ROLES[role as FlowRole].name}".`);
    const data = { unitId: unit.id, unitName: unit.nome, userId: user?.id || null, userName: user?.name || null, updatedBy: actor.name };
    if (existing) {
      await prisma.internalProcessRoleUnit.update({ where: { id: existing.id }, data });
    } else {
      await prisma.internalProcessRoleUnit.create({ data: { role, ...data } });
    }
  }
  return getRoleSettings();
}
