/**
 * Dispatch / routing service for internal processes.
 */
import { DispatchAction, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import {
  assertOrganizationalUnitScope,
  assertProcessAccess,
  buildProcessVisibilityWhere,
} from './access-control.service';
import { FlowAuthContext } from '../middleware/auth.middleware';
import { tryAdvanceActiveWorkflowForProcess } from './workflow.service';

export interface DispatchInput {
  processId: string;
  action: DispatchAction;
  toDepartmentId?: string;
  toOrganizationalUnitId: string;
  toOrganizationalUnitName: string;
  toUserId?: string;
  toUserName?: string;
  note?: string;
  fromUserId: string;
  fromUserName: string;
}

export interface ReturnInput {
  processId: string;
  note: string;
  fromUserId: string;
  fromUserName: string;
}

export interface ReassignInput {
  processId: string;
  toUserId: string;
  toUserName: string;
  fromUserId: string;
  fromUserName: string;
  note?: string;
}

export interface ConcludeInput {
  processId: string;
  note?: string;
  userId: string;
  userName: string;
}

export async function dispatchProcess(input: DispatchInput, auth: FlowAuthContext) {
  await assertProcessAccess(prisma, input.processId, auth);

  const process = await prisma.internalProcess.findUnique({
    where: { id: input.processId },
  });

  if (!process) throw new Error('Processo nao encontrado');
  if (process.status === 'CONCLUIDO' || process.status === 'CANCELADO') {
    throw new Error('Nao e possivel tramitar um processo finalizado');
  }

  const result = await prisma.$transaction(async (tx) => {
    const dispatch = await tx.processDispatch.create({
      data: {
        processId: input.processId,
        action: input.action,
        fromDepartmentId: process.currentDepartmentId,
        fromOrganizationalUnitId: process.currentOrganizationalUnitId,
        fromOrganizationalUnitName: process.currentOrganizationalUnitName,
        toDepartmentId: input.toDepartmentId,
        toOrganizationalUnitId: input.toOrganizationalUnitId,
        toOrganizationalUnitName: input.toOrganizationalUnitName,
        fromUserId: input.fromUserId,
        fromUserName: input.fromUserName,
        toUserId: input.toUserId,
        toUserName: input.toUserName,
        note: input.note,
      },
    });

    await tx.internalProcess.update({
      where: { id: input.processId },
      data: {
        currentDepartmentId: input.toDepartmentId,
        currentOrganizationalUnitId: input.toOrganizationalUnitId,
        currentOrganizationalUnitName: input.toOrganizationalUnitName,
        currentUserId: input.toUserId || null,
        currentUserName: input.toUserName || null,
        status: 'EM_TRAMITACAO',
      },
    });

    await tx.internalProcessHistory.create({
      data: {
        processId: input.processId,
        action: input.action,
        description: `${
          input.action === 'ENCAMINHADO' ? 'Encaminhado' : 'Despachado'
        } para ${input.toOrganizationalUnitName}`,
        note: input.note,
        fromDepartmentId: process.currentDepartmentId,
        fromOrganizationalUnitId: process.currentOrganizationalUnitId,
        fromOrganizationalUnitName: process.currentOrganizationalUnitName,
        toDepartmentId: input.toDepartmentId,
        toOrganizationalUnitId: input.toOrganizationalUnitId,
        toOrganizationalUnitName: input.toOrganizationalUnitName,
        userId: input.fromUserId,
        userName: input.fromUserName,
      },
    });

    await tryAdvanceActiveWorkflowForProcess(tx, input.processId, {
      action: input.action,
      note: input.note,
      userId: input.fromUserId,
      userName: input.fromUserName,
    });

    return dispatch;
  });

  logger.info(`Processo ${process.number} despachado`, {
    from: process.currentOrganizationalUnitName,
    to: input.toOrganizationalUnitName,
  });

  return result;
}

export async function returnProcess(input: ReturnInput, auth: FlowAuthContext) {
  await assertProcessAccess(prisma, input.processId, auth);

  const process = await prisma.internalProcess.findUnique({
    where: { id: input.processId },
    include: {
      dispatches: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!process) throw new Error('Processo nao encontrado');
  if (process.status === 'CONCLUIDO' || process.status === 'CANCELADO') {
    throw new Error('Nao e possivel devolver um processo finalizado');
  }

  const lastDispatch = process.dispatches[0];
  if (!lastDispatch) {
    throw new Error('Nao ha unidade anterior para devolucao');
  }

  const result = await prisma.$transaction(async (tx) => {
    const dispatch = await tx.processDispatch.create({
      data: {
        processId: input.processId,
        action: 'DEVOLVIDO',
        fromDepartmentId: process.currentDepartmentId,
        fromOrganizationalUnitId: process.currentOrganizationalUnitId,
        fromOrganizationalUnitName: process.currentOrganizationalUnitName,
        toDepartmentId: lastDispatch.fromDepartmentId,
        toOrganizationalUnitId: lastDispatch.fromOrganizationalUnitId,
        toOrganizationalUnitName: lastDispatch.fromOrganizationalUnitName,
        fromUserId: input.fromUserId,
        fromUserName: input.fromUserName,
        note: input.note,
      },
    });

    await tx.internalProcess.update({
      where: { id: input.processId },
      data: {
        currentDepartmentId: lastDispatch.fromDepartmentId,
        currentOrganizationalUnitId: lastDispatch.fromOrganizationalUnitId,
        currentOrganizationalUnitName: lastDispatch.fromOrganizationalUnitName,
        currentUserId: lastDispatch.fromUserId,
        currentUserName: lastDispatch.fromUserName,
        status: 'EM_TRAMITACAO',
      },
    });

    await tx.internalProcessHistory.create({
      data: {
        processId: input.processId,
        action: 'DEVOLVIDO',
        description: `Devolvido para ${lastDispatch.fromOrganizationalUnitName}`,
        note: input.note,
        fromDepartmentId: process.currentDepartmentId,
        fromOrganizationalUnitId: process.currentOrganizationalUnitId,
        fromOrganizationalUnitName: process.currentOrganizationalUnitName,
        toDepartmentId: lastDispatch.fromDepartmentId,
        toOrganizationalUnitId: lastDispatch.fromOrganizationalUnitId,
        toOrganizationalUnitName: lastDispatch.fromOrganizationalUnitName,
        userId: input.fromUserId,
        userName: input.fromUserName,
      },
    });

    return dispatch;
  });

  logger.info(`Processo ${process.number} devolvido`, {
    to: lastDispatch.fromOrganizationalUnitName,
  });

  return result;
}

export async function reassignProcess(input: ReassignInput, auth: FlowAuthContext) {
  await assertProcessAccess(prisma, input.processId, auth);

  const process = await prisma.internalProcess.findUnique({
    where: { id: input.processId },
  });

  if (!process) throw new Error('Processo nao encontrado');
  if (process.status === 'CONCLUIDO' || process.status === 'CANCELADO') {
    throw new Error('Nao e possivel redistribuir um processo finalizado');
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.internalProcess.update({
      where: { id: input.processId },
      data: {
        currentUserId: input.toUserId,
        currentUserName: input.toUserName,
      },
    });

    await tx.processDispatch.create({
      data: {
        processId: input.processId,
        action: 'REDISTRIBUIDO',
        fromDepartmentId: process.currentDepartmentId,
        fromOrganizationalUnitId: process.currentOrganizationalUnitId,
        fromOrganizationalUnitName: process.currentOrganizationalUnitName,
        toDepartmentId: process.currentDepartmentId,
        toOrganizationalUnitId: process.currentOrganizationalUnitId,
        toOrganizationalUnitName: process.currentOrganizationalUnitName,
        fromUserId: input.fromUserId,
        fromUserName: input.fromUserName,
        toUserId: input.toUserId,
        toUserName: input.toUserName,
        note: input.note,
      },
    });

    await tx.internalProcessHistory.create({
      data: {
        processId: input.processId,
        action: 'REDISTRIBUIDO',
        description: `Redistribuido para ${input.toUserName}`,
        note: input.note,
        userId: input.fromUserId,
        userName: input.fromUserName,
      },
    });

    return process;
  });

  logger.info(`Processo ${process.number} redistribuido para ${input.toUserName}`);
  return result;
}

export async function concludeProcess(input: ConcludeInput, auth: FlowAuthContext) {
  await assertProcessAccess(prisma, input.processId, auth);

  const process = await prisma.internalProcess.findUnique({
    where: { id: input.processId },
  });

  if (!process) throw new Error('Processo nao encontrado');
  if (process.status === 'CONCLUIDO' || process.status === 'CANCELADO') {
    throw new Error('Processo ja esta finalizado');
  }

  const result = await prisma.$transaction(async (tx) => {
    const proc = await tx.internalProcess.update({
      where: { id: input.processId },
      data: {
        status: 'CONCLUIDO',
        concludedAt: new Date(),
      },
    });

    await tx.internalProcessHistory.create({
      data: {
        processId: input.processId,
        action: 'CONCLUSAO',
        description: `Processo concluido por ${input.userName}`,
        note: input.note,
        userId: input.userId,
        userName: input.userName,
      },
    });

    await tx.workflowInstance.updateMany({
      where: { processId: input.processId, status: 'ATIVO' },
      data: { status: 'CONCLUIDO', completedAt: new Date() },
    });

    return proc;
  });

  logger.info(`Processo ${process.number} concluido`, { id: input.processId });
  return result;
}

export async function archiveProcess(processId: string, userId: string, userName: string, auth: FlowAuthContext) {
  await assertProcessAccess(prisma, processId, auth);

  const process = await prisma.internalProcess.findUnique({
    where: { id: processId },
  });

  if (!process) throw new Error('Processo nao encontrado');
  if (process.status !== 'CONCLUIDO' && process.status !== 'CANCELADO') {
    throw new Error('Apenas processos concluidos ou cancelados podem ser arquivados');
  }

  const result = await prisma.$transaction(async (tx) => {
    const proc = await tx.internalProcess.update({
      where: { id: processId },
      data: {
        status: 'ARQUIVADO',
        archivedAt: new Date(),
      },
    });

    await tx.internalProcessHistory.create({
      data: {
        processId,
        action: 'ARQUIVAMENTO',
        description: `Processo arquivado por ${userName}`,
        userId,
        userName,
      },
    });

    return proc;
  });

  logger.info(`Processo ${process.number} arquivado`);
  return result;
}

export async function getInbox(
  organizationalUnitId: string,
  auth: FlowAuthContext,
  userId?: string,
) {
  assertOrganizationalUnitScope(auth, organizationalUnitId);

  const where: Prisma.InternalProcessWhereInput = {
    AND: [
      buildProcessVisibilityWhere(auth),
      {
        currentOrganizationalUnitId: organizationalUnitId,
        status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
      },
    ],
  };

  if (userId) {
    (where.AND as Prisma.InternalProcessWhereInput[]).push({ currentUserId: userId });
  }

  return prisma.internalProcess.findMany({
    where,
    include: {
      type: { select: { name: true, prefix: true } },
      dispatches: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          fromOrganizationalUnitName: true,
          fromUserName: true,
          note: true,
          createdAt: true,
          isRead: true,
        },
      },
      _count: {
        select: { documents: true, history: true },
      },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });
}

export async function getInboxCount(
  organizationalUnitId: string,
  auth: FlowAuthContext,
  userId?: string,
) {
  assertOrganizationalUnitScope(auth, organizationalUnitId);

  const visibilityWhere = buildProcessVisibilityWhere(auth);
  const baseWhere: Prisma.InternalProcessWhereInput = {
    AND: [
      visibilityWhere,
      { currentOrganizationalUnitId: organizationalUnitId },
      ...(userId ? [{ currentUserId: userId }] : []),
    ],
  };

  const [total, abertos, emTramitacao, pendentes, naoLidos] = await Promise.all([
    prisma.internalProcess.count({
      where: {
        AND: [baseWhere, { status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] } }],
      },
    }),
    prisma.internalProcess.count({ where: { AND: [baseWhere, { status: 'ABERTO' }] } }),
    prisma.internalProcess.count({ where: { AND: [baseWhere, { status: 'EM_TRAMITACAO' }] } }),
    prisma.internalProcess.count({ where: { AND: [baseWhere, { status: 'PENDENTE' }] } }),
    prisma.processDispatch.count({
      where: { toOrganizationalUnitId: organizationalUnitId, isRead: false },
    }),
  ]);

  return { total, abertos, emTramitacao, pendentes, naoLidos };
}
