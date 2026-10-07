/**
 * Processo interno: memorando, ofício interno, requisição, pedido de parecer e
 * processo administrativo, tramitando entre as unidades do organograma.
 *
 * Tudo dentro do backend e por município (o antigo digiurban-flow era um
 * serviço separado, sem município, com motor de fluxo próprio, e nunca subiu).
 * Usa o que o DigiUrban já tem: organograma (lotação), dias úteis do SLA,
 * central de avisos e o histórico do protocolo do cidadão.
 */

import { prisma } from '../../lib/prisma';
import { tryGetTenantId } from '../../lib/tenant-context';

/** a extension não põe o município em gravação aninhada (movements.create) */
const nestedTenant = () => ({ tenantId: tryGetTenantId() || null });
import notificationService from '../notification.service';
import { addWorkingDays } from '../protocol-sla.service';
import { getUserDepartmentIds, getUserUnitIds, WORKING_ASSIGNMENT_STATUSES } from '../staff-scope.service';
import { findDepartmentRootOrganizationalUnit } from '../department-organogram.service';
import {
  canActOnProcess,
  canViewProcess,
  isOpen,
  ProcessActor,
  suggestUnits,
} from './rules';

export class InternalProcessError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export const DEFAULT_TYPES = [
  { prefix: 'MEM', name: 'Memorando', description: 'Comunicação entre unidades da prefeitura', defaultDays: 5, sortOrder: 1 },
  { prefix: 'OFI', name: 'Ofício interno', description: 'Comunicação formal entre secretarias', defaultDays: 10, sortOrder: 2 },
  { prefix: 'REQ', name: 'Requisição', description: 'Pedido de material, serviço ou providência a outra unidade', defaultDays: 5, sortOrder: 3 },
  { prefix: 'PAR', name: 'Pedido de parecer', description: 'Pedido de análise técnica ou jurídica a outra unidade', defaultDays: 5, sortOrder: 4 },
  { prefix: 'PAD', name: 'Processo administrativo', description: 'Processo com várias etapas e unidades', defaultDays: 30, sortOrder: 5 },
];

export interface ActorInput {
  id: string;
  role: string;
  name: string;
}

/** Tipos do município (cria os padrão na primeira vez) */
export async function ensureDefaultTypes() {
  const existing = await prisma.internalProcessType.findMany({ select: { prefix: true } });
  const have = new Set(existing.map((type) => type.prefix));
  for (const type of DEFAULT_TYPES) {
    if (!have.has(type.prefix)) {
      await prisma.internalProcessType.create({ data: type }).catch(() => undefined);
    }
  }
  return prisma.internalProcessType.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
}

/** Unidades e secretarias do servidor (lotação; sem lotação, a unidade raiz da secretaria) */
export async function buildActor(user: ActorInput): Promise<ProcessActor & { name: string }> {
  const [unitIds, departmentIds] = await Promise.all([getUserUnitIds(user.id), getUserDepartmentIds(user.id)]);
  let units = unitIds;
  if (units.length === 0 && departmentIds.length) {
    const roots = await Promise.all(departmentIds.map((departmentId) => findDepartmentRootOrganizationalUnit(prisma as any, departmentId)));
    units = roots.filter(Boolean).map((root: any) => root.id);
  }
  return { id: user.id, role: user.role, name: user.name, unitIds: units, departmentIds };
}

async function getUnit(unitId: string) {
  const unit = await prisma.organizationalUnit.findFirst({
    where: { id: unitId, isActive: true },
    select: { id: true, nome: true, departmentId: true, responsavelId: true },
  });
  if (!unit) throw new InternalProcessError('Unidade não encontrada', 404);
  return unit;
}

async function nextNumber(prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const sequence = await prisma.$transaction(async (tx) => {
    const current = await tx.internalProcessSequence.findFirst({ where: { prefix, year } });
    if (current) {
      return tx.internalProcessSequence.update({ where: { id: current.id }, data: { last: { increment: 1 } } });
    }
    return tx.internalProcessSequence.create({ data: { prefix, year, last: 1 } });
  });
  return `${prefix}-${year}-${String(sequence.last).padStart(5, '0')}`;
}

/** Avisa quem recebe: a pessoa indicada, senão o responsável e quem está lotado na unidade */
async function notifyUnit(unitId: string, toUserId: string | null, title: string, message: string, processId: string, exceptUserId?: string) {
  try {
    let recipients: string[] = [];
    if (toUserId) {
      recipients = [toUserId];
    } else {
      const [unit, assignments] = await Promise.all([
        prisma.organizationalUnit.findFirst({ where: { id: unitId }, select: { responsavelId: true } }),
        prisma.employeeAssignment.findMany({
          where: { organizationalUnitId: unitId, situacao: { in: WORKING_ASSIGNMENT_STATUSES } },
          select: { userId: true },
          take: 30,
        }),
      ]);
      recipients = [...new Set([...(unit?.responsavelId ? [unit.responsavelId] : []), ...assignments.map((item) => item.userId)])];
    }
    for (const userId of recipients.filter((id) => id !== exceptUserId)) {
      await notificationService
        .notify({ recipientType: 'user', recipientId: userId, type: 'INTERNAL_PROCESS', title, message, data: { actionUrl: `/admin/processos-internos/${processId}` } })
        .catch(() => undefined);
    }
  } catch (error) {
    console.warn('[processo-interno] aviso não enviado:', error instanceof Error ? error.message : error);
  }
}

async function loadForAccess(id: string) {
  const process = await prisma.internalProcess.findFirst({
    where: { id },
    include: { movements: { select: { fromUnitId: true, toUnitId: true, toUserId: true, userId: true } } },
  });
  if (!process) throw new InternalProcessError('Processo não encontrado', 404);
  const involvedUnitIds = [...new Set(process.movements.flatMap((move) => [move.fromUnitId, move.toUnitId]).filter(Boolean) as string[])];
  const involvedUserIds = [...new Set(process.movements.flatMap((move) => [move.userId, move.toUserId]).filter(Boolean) as string[])];
  return { process, access: { ...process, involvedUnitIds, involvedUserIds } };
}

async function assertCanAct(actor: ProcessActor, id: string) {
  const { process, access } = await loadForAccess(id);
  if (!canViewProcess(actor, access)) throw new InternalProcessError('Processo não encontrado', 404);
  if (!isOpen(process.status)) throw new InternalProcessError('Este processo já foi encerrado.');
  if (!canActOnProcess(actor, process)) throw new InternalProcessError('O processo não está com a sua unidade.', 403);
  return process;
}

export interface CreateInput {
  typeId: string;
  subject: string;
  body?: string;
  originUnitId?: string;
  toUnitId?: string;
  toUserId?: string;
  priority?: number;
  confidential?: boolean;
  protocolId?: string;
  parentId?: string;
}

export async function createProcess(actor: ProcessActor & { name: string }, input: CreateInput) {
  const subject = String(input.subject || '').trim().slice(0, 200);
  if (subject.length < 3) throw new InternalProcessError('Escreva o assunto.');
  const type = await prisma.internalProcessType.findFirst({ where: { id: input.typeId, isActive: true } });
  if (!type) throw new InternalProcessError('Escolha o tipo do processo.');

  const originUnitId = input.originUnitId && actor.unitIds.includes(input.originUnitId) ? input.originUnitId : actor.unitIds[0];
  if (!originUnitId) {
    throw new InternalProcessError('Você não está lotado em nenhuma unidade do organograma. Peça ao gestor para ajustar a sua lotação.');
  }
  const origin = await getUnit(originUnitId);
  const destination = input.toUnitId ? await getUnit(input.toUnitId) : null;
  const toUser = input.toUserId ? await prisma.user.findFirst({ where: { id: input.toUserId, isActive: true }, select: { id: true, name: true } }) : null;

  if (input.protocolId) {
    const protocol = await prisma.protocolSimplified.findFirst({ where: { id: input.protocolId }, select: { id: true } });
    if (!protocol) throw new InternalProcessError('Protocolo do cidadão não encontrado.');
  }

  const number = await nextNumber(type.prefix);
  const current = destination || origin;
  const process = await prisma.internalProcess.create({
    data: {
      number,
      typeId: type.id,
      subject,
      body: input.body ? String(input.body).slice(0, 20000) : null,
      priority: input.priority === 1 ? 1 : 0,
      confidential: Boolean(input.confidential),
      status: destination ? 'EM_TRAMITE' : 'ABERTO',
      originUnitId: origin.id,
      originUnitName: origin.nome,
      originDepartmentId: origin.departmentId,
      currentUnitId: current.id,
      currentUnitName: current.nome,
      currentDepartmentId: current.departmentId,
      currentUserId: toUser?.id || null,
      currentUserName: toUser?.name || null,
      createdById: actor.id,
      createdByName: actor.name,
      protocolId: input.protocolId || null,
      parentId: input.parentId || null,
      dueAt: addWorkingDays(new Date(), type.defaultDays),
      movements: {
        create: [
          { ...nestedTenant(), action: 'CRIADO', userId: actor.id, userName: actor.name, toUnitId: origin.id, toUnitName: origin.nome, readAt: new Date() },
          ...(destination
            ? [{
                ...nestedTenant(),
                action: 'ENCAMINHADO',
                userId: actor.id,
                userName: actor.name,
                fromUnitId: origin.id,
                fromUnitName: origin.nome,
                toUnitId: destination.id,
                toUnitName: destination.nome,
                toUserId: toUser?.id || null,
                toUserName: toUser?.name || null,
              }]
            : []),
        ],
      },
    },
  });

  if (destination) {
    await notifyUnit(destination.id, toUser?.id || null, `${type.name} recebido: ${number}`, `${origin.nome} enviou: ${subject}`, process.id, actor.id);
  }
  return process;
}

export async function forwardProcess(actor: ProcessActor & { name: string }, id: string, input: { toUnitId: string; toUserId?: string; note?: string }) {
  const process = await assertCanAct(actor, id);
  const destination = await getUnit(input.toUnitId);
  const toUser = input.toUserId ? await prisma.user.findFirst({ where: { id: input.toUserId, isActive: true }, select: { id: true, name: true } }) : null;
  const updated = await prisma.internalProcess.update({
    where: { id },
    data: {
      status: 'EM_TRAMITE',
      currentUnitId: destination.id,
      currentUnitName: destination.nome,
      currentDepartmentId: destination.departmentId,
      currentUserId: toUser?.id || null,
      currentUserName: toUser?.name || null,
      movements: {
        create: {
          ...nestedTenant(),
          action: 'ENCAMINHADO',
          note: input.note?.slice(0, 5000) || null,
          userId: actor.id,
          userName: actor.name,
          fromUnitId: process.currentUnitId,
          fromUnitName: process.currentUnitName,
          toUnitId: destination.id,
          toUnitName: destination.nome,
          toUserId: toUser?.id || null,
          toUserName: toUser?.name || null,
        },
      },
    },
  });
  await notifyUnit(destination.id, toUser?.id || null, `Processo ${process.number} encaminhado`, `${process.currentUnitName} encaminhou: ${process.subject}`, id, actor.id);
  return updated;
}

/** Devolve para a unidade que mandou por último */
export async function returnProcess(actor: ProcessActor & { name: string }, id: string, note: string) {
  const process = await assertCanAct(actor, id);
  if (!String(note || '').trim()) throw new InternalProcessError('Diga por que está devolvendo.');
  const lastIn = await prisma.internalProcessMovement.findFirst({
    where: { processId: id, toUnitId: process.currentUnitId, fromUnitId: { not: null }, action: { in: ['ENCAMINHADO', 'DEVOLVIDO'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (!lastIn?.fromUnitId) throw new InternalProcessError('Não há para quem devolver: o processo começou nesta unidade.');
  const back = await getUnit(lastIn.fromUnitId);
  const updated = await prisma.internalProcess.update({
    where: { id },
    data: {
      currentUnitId: back.id,
      currentUnitName: back.nome,
      currentDepartmentId: back.departmentId,
      currentUserId: lastIn.userId,
      currentUserName: lastIn.userName,
      movements: {
        create: {
          ...nestedTenant(),
          action: 'DEVOLVIDO',
          note: note.slice(0, 5000),
          userId: actor.id,
          userName: actor.name,
          fromUnitId: process.currentUnitId,
          fromUnitName: process.currentUnitName,
          toUnitId: back.id,
          toUnitName: back.nome,
          toUserId: lastIn.userId,
          toUserName: lastIn.userName,
        },
      },
    },
  });
  await notifyUnit(back.id, lastIn.userId, `Processo ${process.number} devolvido`, `${process.currentUnitName} devolveu: ${note.slice(0, 120)}`, id, actor.id);
  return updated;
}

/** Passa para um servidor da unidade atual cuidar */
export async function assignProcess(actor: ProcessActor & { name: string }, id: string, toUserId: string) {
  const process = await assertCanAct(actor, id);
  const toUser = await prisma.user.findFirst({ where: { id: toUserId, isActive: true }, select: { id: true, name: true } });
  if (!toUser) throw new InternalProcessError('Servidor não encontrado', 404);
  const updated = await prisma.internalProcess.update({
    where: { id },
    data: {
      currentUserId: toUser.id,
      currentUserName: toUser.name,
      movements: { create: { ...nestedTenant(), action: 'ATRIBUIDO', userId: actor.id, userName: actor.name, toUnitId: process.currentUnitId, toUnitName: process.currentUnitName, toUserId: toUser.id, toUserName: toUser.name } },
    },
  });
  await notifyUnit(process.currentUnitId, toUser.id, `Processo ${process.number} com você`, process.subject, id, actor.id);
  return updated;
}

/** Despacho / anotação (fica no histórico; não muda de unidade) */
export async function addNote(actor: ProcessActor & { name: string }, id: string, note: string) {
  const { access } = await loadForAccess(id);
  if (!canViewProcess(actor, access)) throw new InternalProcessError('Processo não encontrado', 404);
  const text = String(note || '').trim();
  if (!text) throw new InternalProcessError('Escreva o despacho.');
  return prisma.internalProcessMovement.create({
    data: { processId: id, action: 'DESPACHO', note: text.slice(0, 5000), userId: actor.id, userName: actor.name, readAt: new Date() },
  });
}

/** Pede parecer a outra unidade: abre um "Pedido de parecer" ligado a este processo */
export async function requestOpinion(actor: ProcessActor & { name: string }, id: string, input: { toUnitId: string; question: string }) {
  const process = await assertCanAct(actor, id);
  const question = String(input.question || '').trim();
  if (!question) throw new InternalProcessError('Escreva o que precisa no parecer.');
  const types = await ensureDefaultTypes();
  const parecer = types.find((type) => type.prefix === 'PAR') || types[0];
  const child = await createProcess(actor, {
    typeId: parecer.id,
    subject: `Parecer: ${process.subject}`.slice(0, 200),
    body: question,
    originUnitId: actor.unitIds.includes(process.currentUnitId) ? process.currentUnitId : undefined,
    toUnitId: input.toUnitId,
    confidential: process.confidential,
    protocolId: process.protocolId || undefined,
    parentId: process.id,
  });
  await prisma.internalProcessMovement.create({
    data: {
      processId: id,
      action: 'PARECER_PEDIDO',
      note: `${question.slice(0, 2000)}\n(${child.number})`,
      userId: actor.id,
      userName: actor.name,
      toUnitId: child.currentUnitId,
      toUnitName: child.currentUnitName,
      readAt: new Date(),
    },
  });
  return child;
}

/**
 * Concluir. Pedido de parecer concluído volta como resposta no processo de
 * origem; ligado a protocolo do cidadão, vira nota interna no protocolo.
 */
export async function concludeProcess(actor: ProcessActor & { name: string }, id: string, note?: string) {
  const process = await assertCanAct(actor, id);
  const conclusion = String(note || '').trim().slice(0, 5000) || null;
  const updated = await prisma.internalProcess.update({
    where: { id },
    data: {
      status: 'CONCLUIDO',
      concludedAt: new Date(),
      conclusion,
      movements: { create: { ...nestedTenant(), action: 'CONCLUIDO', note: conclusion, userId: actor.id, userName: actor.name, fromUnitId: process.currentUnitId, fromUnitName: process.currentUnitName, readAt: new Date() } },
    },
  });

  if (process.parentId) {
    const parent = await prisma.internalProcess.findFirst({ where: { id: process.parentId } });
    if (parent) {
      await prisma.internalProcessMovement.create({
        data: {
          processId: parent.id,
          action: 'PARECER_RESPONDIDO',
          note: `${process.currentUnitName} respondeu (${process.number}): ${conclusion || 'sem observações'}`,
          userId: actor.id,
          userName: actor.name,
          fromUnitId: process.currentUnitId,
          fromUnitName: process.currentUnitName,
          toUnitId: parent.currentUnitId,
          toUnitName: parent.currentUnitName,
        },
      });
      await notifyUnit(parent.currentUnitId, parent.currentUserId, `Parecer respondido no ${parent.number}`, `${process.currentUnitName}: ${(conclusion || '').slice(0, 120)}`, parent.id, actor.id);
    }
  }

  if (process.protocolId) {
    await prisma.protocolInteraction
      .create({
        data: {
          protocolId: process.protocolId,
          type: 'NOTE',
          authorType: 'SERVER',
          authorId: actor.id,
          authorName: actor.name,
          message: `Processo interno ${process.number} (${process.currentUnitName}) concluído: ${conclusion || 'sem observações'}`,
          isInternal: true,
        },
      })
      .catch((error) => console.warn('[processo-interno] nota no protocolo não registrada:', error?.message || error));
  }

  if (process.createdById !== actor.id) {
    await notificationService
      .notify({ recipientType: 'user', recipientId: process.createdById, type: 'INTERNAL_PROCESS', title: `Processo ${process.number} concluído`, message: conclusion || process.subject, data: { actionUrl: `/admin/processos-internos/${id}` } })
      .catch(() => undefined);
  }
  return updated;
}

export async function closeProcess(actor: ProcessActor & { name: string }, id: string, action: 'ARQUIVADO' | 'CANCELADO', note?: string) {
  const process = await assertCanAct(actor, id);
  if (action === 'CANCELADO' && process.createdById !== actor.id && !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) {
    throw new InternalProcessError('Só quem abriu o processo pode cancelar.', 403);
  }
  return prisma.internalProcess.update({
    where: { id },
    data: { status: action, movements: { create: { ...nestedTenant(), action, note: note?.slice(0, 2000) || null, userId: actor.id, userName: actor.name, readAt: new Date() } } },
  });
}

export async function reopenProcess(actor: ProcessActor & { name: string }, id: string, note: string) {
  const { process, access } = await loadForAccess(id);
  if (!canViewProcess(actor, access)) throw new InternalProcessError('Processo não encontrado', 404);
  if (isOpen(process.status)) throw new InternalProcessError('O processo já está aberto.');
  if (!actor.unitIds.includes(process.currentUnitId) && process.createdById !== actor.id) {
    throw new InternalProcessError('Só a unidade que encerrou ou quem abriu pode reabrir.', 403);
  }
  return prisma.internalProcess.update({
    where: { id },
    data: {
      status: 'EM_TRAMITE',
      concludedAt: null,
      movements: { create: { ...nestedTenant(), action: 'REABERTO', note: String(note || '').slice(0, 2000) || null, userId: actor.id, userName: actor.name, readAt: new Date() } },
    },
  });
}

export type Box = 'entrada' | 'enviados' | 'todos';

export async function listProcesses(actor: ProcessActor, filters: { box?: Box; status?: string; search?: string; protocolId?: string; page?: number }) {
  const box = filters.box || 'entrada';
  const and: any[] = [];

  if (filters.protocolId) {
    // no protocolo do cidadão: sigiloso só para quem participa
    and.push({ protocolId: filters.protocolId });
    and.push({ OR: [{ confidential: false }, { createdById: actor.id }, { currentUnitId: { in: actor.unitIds } }, { originUnitId: { in: actor.unitIds } }] });
  } else if (box === 'entrada') {
    and.push({ OR: [{ currentUnitId: { in: actor.unitIds } }, { currentUserId: actor.id }] });
    if (!filters.status) and.push({ status: { in: ['ABERTO', 'EM_TRAMITE'] } });
  } else if (box === 'enviados') {
    and.push({ OR: [{ createdById: actor.id }, { originUnitId: { in: actor.unitIds } }] });
  } else {
    // todos: administrador vê tudo (menos sigiloso de que não participa); gestor, as suas secretarias
    if (['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) {
      and.push({ OR: [{ confidential: false }, { createdById: actor.id }, { currentUnitId: { in: actor.unitIds } }, { originUnitId: { in: actor.unitIds } }] });
    } else if (['MANAGER', 'COORDINATOR'].includes(actor.role)) {
      and.push({
        OR: [
          { AND: [{ confidential: false }, { OR: [{ originDepartmentId: { in: actor.departmentIds } }, { currentDepartmentId: { in: actor.departmentIds } }] }] },
          { createdById: actor.id },
          { currentUnitId: { in: actor.unitIds } },
        ],
      });
    } else {
      and.push({ OR: [{ createdById: actor.id }, { currentUserId: actor.id }, { currentUnitId: { in: actor.unitIds } }, { originUnitId: { in: actor.unitIds } }] });
    }
  }
  if (filters.status) and.push({ status: filters.status });
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    and.push({ OR: [{ number: { contains: term, mode: 'insensitive' } }, { subject: { contains: term, mode: 'insensitive' } }] });
  }

  const page = Math.max(1, Number(filters.page) || 1);
  const where = and.length ? { AND: and } : {};
  const [items, total] = await Promise.all([
    prisma.internalProcess.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * 30,
      take: 30,
      include: { type: { select: { name: true, prefix: true } } },
    }),
    prisma.internalProcess.count({ where }),
  ]);

  // não lidos: movimento para a minha unidade/pessoa ainda sem leitura
  const unread = items.length
    ? await prisma.internalProcessMovement.findMany({
        where: { processId: { in: items.map((item) => item.id) }, readAt: null, OR: [{ toUnitId: { in: actor.unitIds } }, { toUserId: actor.id }] },
        select: { processId: true },
      })
    : [];
  const unreadSet = new Set(unread.map((item) => item.processId));
  return { items: items.map((item) => ({ ...item, unread: unreadSet.has(item.id), overdue: !!item.dueAt && isOpen(item.status) && item.dueAt < new Date() })), total, page };
}

export async function inboxCount(actor: ProcessActor): Promise<number> {
  if (actor.unitIds.length === 0) return 0;
  const unread = await prisma.internalProcessMovement.findMany({
    where: { readAt: null, OR: [{ toUnitId: { in: actor.unitIds } }, { toUserId: actor.id }], process: { status: { in: ['ABERTO', 'EM_TRAMITE'] } } },
    select: { processId: true },
    distinct: ['processId'],
  });
  return unread.length;
}

export async function getProcess(actor: ProcessActor, id: string) {
  const { process, access } = await loadForAccess(id);
  if (!canViewProcess(actor, access)) throw new InternalProcessError('Processo não encontrado', 404);
  // abrir marca como lido o que chegou para mim/minha unidade
  await prisma.internalProcessMovement.updateMany({
    where: { processId: id, readAt: null, OR: [{ toUnitId: { in: actor.unitIds } }, { toUserId: actor.id }] },
    data: { readAt: new Date() },
  });
  const [full, protocol] = await Promise.all([
    prisma.internalProcess.findFirst({
      where: { id },
      include: {
        type: true,
        movements: { orderBy: { createdAt: 'asc' } },
        children: { select: { id: true, number: true, subject: true, status: true, currentUnitName: true, conclusion: true } },
        parent: { select: { id: true, number: true, subject: true } },
      },
    }),
    process.protocolId
      ? prisma.protocolSimplified.findFirst({ where: { id: process.protocolId }, select: { id: true, number: true, title: true, status: true } })
      : Promise.resolve(null),
  ]);
  return {
    ...full,
    protocol,
    canAct: isOpen(process.status) && canActOnProcess(actor, process),
    overdue: !!process.dueAt && isOpen(process.status) && process.dueAt < new Date(),
  };
}

/** Unidades para escolher como destino (todas do município) + sugestão pelo texto */
export async function destinationUnits(text?: string) {
  const units = await prisma.organizationalUnit.findMany({
    where: { isActive: true },
    orderBy: [{ nivel: 'asc' }, { nome: 'asc' }],
    select: { id: true, nome: true, sigla: true, tipo: true, descricao: true, competencias: true, department: { select: { name: true } } },
  });
  const suggested = text
    ? suggestUnits(
        text,
        units.map((unit) => ({ id: unit.id, nome: unit.nome, sigla: unit.sigla, descricao: unit.descricao, competencias: unit.competencias, departmentName: unit.department?.name })),
      )
    : [];
  return {
    units: units.map((unit) => ({ id: unit.id, nome: unit.nome, sigla: unit.sigla, tipo: unit.tipo, department: unit.department?.name || null })),
    suggested,
  };
}

/** Servidores lotados numa unidade (para "passar para") */
export async function unitPeople(unitId: string) {
  const assignments = await prisma.employeeAssignment.findMany({
    where: { organizationalUnitId: unitId, situacao: { in: WORKING_ASSIGNMENT_STATUSES } },
    select: { user: { select: { id: true, name: true } } },
  });
  const seen = new Set<string>();
  return assignments
    .map((item) => item.user)
    .filter((user) => user && !seen.has(user.id) && seen.add(user.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}
