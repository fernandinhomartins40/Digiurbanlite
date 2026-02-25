/**
 * Serviço de tramitação / despacho de processos entre setores
 */
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { DispatchAction } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DispatchInput {
  processId: string;
  action: DispatchAction;
  toSectorId: string;
  toSectorName: string;
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

// ============================================================================
// DESPACHAR PARA OUTRO SETOR
// ============================================================================

export async function dispatchProcess(input: DispatchInput) {
  const process = await prisma.internalProcess.findUnique({
    where: { id: input.processId },
  });

  if (!process) throw new Error('Processo não encontrado');
  if (process.status === 'CONCLUIDO' || process.status === 'CANCELADO') {
    throw new Error('Não é possível tramitar um processo finalizado');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Criar despacho
    const dispatch = await tx.processDispatch.create({
      data: {
        processId: input.processId,
        action: input.action,
        fromSectorId: process.currentSectorId,
        fromSectorName: process.currentSectorName,
        toSectorId: input.toSectorId,
        toSectorName: input.toSectorName,
        fromUserId: input.fromUserId,
        fromUserName: input.fromUserName,
        toUserId: input.toUserId,
        toUserName: input.toUserName,
        note: input.note,
      },
    });

    // Atualizar processo
    await tx.internalProcess.update({
      where: { id: input.processId },
      data: {
        currentSectorId: input.toSectorId,
        currentSectorName: input.toSectorName,
        currentUserId: input.toUserId || null,
        currentUserName: input.toUserName || null,
        status: 'EM_TRAMITACAO',
      },
    });

    // Registrar no histórico
    await tx.internalProcessHistory.create({
      data: {
        processId: input.processId,
        action: input.action,
        description: `${input.action === 'ENCAMINHADO' ? 'Encaminhado' : 'Despachado'} para ${input.toSectorName}`,
        note: input.note,
        fromSectorId: process.currentSectorId,
        fromSectorName: process.currentSectorName,
        toSectorId: input.toSectorId,
        toSectorName: input.toSectorName,
        userId: input.fromUserId,
        userName: input.fromUserName,
      },
    });

    return dispatch;
  });

  logger.info(`Processo ${process.number} despachado`, {
    from: process.currentSectorName,
    to: input.toSectorName,
  });

  return result;
}

// ============================================================================
// DEVOLVER AO SETOR ANTERIOR
// ============================================================================

export async function returnProcess(input: ReturnInput) {
  const process = await prisma.internalProcess.findUnique({
    where: { id: input.processId },
    include: {
      dispatches: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!process) throw new Error('Processo não encontrado');
  if (process.status === 'CONCLUIDO' || process.status === 'CANCELADO') {
    throw new Error('Não é possível devolver um processo finalizado');
  }

  // Encontrar o setor anterior
  const lastDispatch = process.dispatches[0];
  if (!lastDispatch) {
    throw new Error('Não há setor anterior para devolver');
  }

  const result = await prisma.$transaction(async (tx) => {
    const dispatch = await tx.processDispatch.create({
      data: {
        processId: input.processId,
        action: 'DEVOLVIDO',
        fromSectorId: process.currentSectorId,
        fromSectorName: process.currentSectorName,
        toSectorId: lastDispatch.fromSectorId,
        toSectorName: lastDispatch.fromSectorName,
        fromUserId: input.fromUserId,
        fromUserName: input.fromUserName,
        note: input.note,
      },
    });

    await tx.internalProcess.update({
      where: { id: input.processId },
      data: {
        currentSectorId: lastDispatch.fromSectorId,
        currentSectorName: lastDispatch.fromSectorName,
        currentUserId: lastDispatch.fromUserId,
        currentUserName: lastDispatch.fromUserName,
        status: 'EM_TRAMITACAO',
      },
    });

    await tx.internalProcessHistory.create({
      data: {
        processId: input.processId,
        action: 'DEVOLVIDO',
        description: `Devolvido para ${lastDispatch.fromSectorName}`,
        note: input.note,
        fromSectorId: process.currentSectorId,
        fromSectorName: process.currentSectorName,
        toSectorId: lastDispatch.fromSectorId,
        toSectorName: lastDispatch.fromSectorName,
        userId: input.fromUserId,
        userName: input.fromUserName,
      },
    });

    return dispatch;
  });

  logger.info(`Processo ${process.number} devolvido`, {
    to: lastDispatch.fromSectorName,
  });

  return result;
}

// ============================================================================
// REDISTRIBUIR DENTRO DO SETOR
// ============================================================================

export async function reassignProcess(input: ReassignInput) {
  const process = await prisma.internalProcess.findUnique({
    where: { id: input.processId },
  });

  if (!process) throw new Error('Processo não encontrado');
  if (process.status === 'CONCLUIDO' || process.status === 'CANCELADO') {
    throw new Error('Não é possível redistribuir um processo finalizado');
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
        fromSectorId: process.currentSectorId,
        fromSectorName: process.currentSectorName,
        toSectorId: process.currentSectorId,
        toSectorName: process.currentSectorName,
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
        description: `Redistribuído para ${input.toUserName}`,
        note: input.note,
        userId: input.fromUserId,
        userName: input.fromUserName,
      },
    });

    return process;
  });

  logger.info(`Processo ${process.number} redistribuído para ${input.toUserName}`);
  return result;
}

// ============================================================================
// CONCLUIR PROCESSO
// ============================================================================

export async function concludeProcess(input: ConcludeInput) {
  const process = await prisma.internalProcess.findUnique({
    where: { id: input.processId },
  });

  if (!process) throw new Error('Processo não encontrado');
  if (process.status === 'CONCLUIDO' || process.status === 'CANCELADO') {
    throw new Error('Processo já está finalizado');
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
        description: `Processo concluído por ${input.userName}`,
        note: input.note,
        userId: input.userId,
        userName: input.userName,
      },
    });

    // Concluir workflow se existir
    await tx.workflowInstance.updateMany({
      where: { processId: input.processId, status: 'ATIVO' },
      data: { status: 'CONCLUIDO', completedAt: new Date() },
    });

    return proc;
  });

  logger.info(`Processo ${process.number} concluído`, { id: input.processId });
  return result;
}

// ============================================================================
// ARQUIVAR PROCESSO
// ============================================================================

export async function archiveProcess(processId: string, userId: string, userName: string) {
  const process = await prisma.internalProcess.findUnique({
    where: { id: processId },
  });

  if (!process) throw new Error('Processo não encontrado');
  if (process.status !== 'CONCLUIDO' && process.status !== 'CANCELADO') {
    throw new Error('Apenas processos concluídos ou cancelados podem ser arquivados');
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

// ============================================================================
// CAIXA DE ENTRADA (INBOX)
// ============================================================================

export async function getInbox(sectorId: string, userId?: string) {
  const where: Record<string, unknown> = {
    currentSectorId: sectorId,
    status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
  };

  if (userId) {
    where.currentUserId = userId;
  }

  const processes = await prisma.internalProcess.findMany({
    where,
    include: {
      type: { select: { name: true, prefix: true } },
      dispatches: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          fromSectorName: true,
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
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  return processes;
}

/**
 * Contagem de processos na caixa de entrada por status
 */
export async function getInboxCount(sectorId: string, userId?: string) {
  const baseWhere = {
    currentSectorId: sectorId,
    ...(userId ? { currentUserId: userId } : {}),
  };

  const [total, abertos, emTramitacao, pendentes, naoLidos] = await Promise.all([
    prisma.internalProcess.count({
      where: { ...baseWhere, status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] } },
    }),
    prisma.internalProcess.count({ where: { ...baseWhere, status: 'ABERTO' } }),
    prisma.internalProcess.count({ where: { ...baseWhere, status: 'EM_TRAMITACAO' } }),
    prisma.internalProcess.count({ where: { ...baseWhere, status: 'PENDENTE' } }),
    prisma.processDispatch.count({
      where: { toSectorId: sectorId, isRead: false },
    }),
  ]);

  return { total, abertos, emTramitacao, pendentes, naoLidos };
}
