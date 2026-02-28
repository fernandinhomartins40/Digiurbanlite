/**
 * Servico principal de CRUD de processos internos
 */
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { generateProcessNumber } from './numbering.service';
import { Prisma, ProcessStatus, SigiloLevel } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CreateProcessInput {
  typeId: string;
  subject: string;
  description?: string;
  sigilo?: SigiloLevel;
  priority?: number;
  originSectorId: string;
  originSectorName: string;
  createdById: string;
  createdByName: string;
  currentUserId?: string;
  currentUserName?: string;
  citizenProtocolId?: string;
  dueAt?: Date;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateProcessInput {
  subject?: string;
  description?: string;
  sigilo?: SigiloLevel;
  priority?: number;
  currentUserId?: string;
  currentUserName?: string;
  dueAt?: Date;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface ListProcessesFilter {
  status?: ProcessStatus;
  typeId?: string;
  currentSectorId?: string;
  currentUserId?: string;
  createdById?: string;
  citizenProtocolId?: string;
  sigilo?: SigiloLevel;
  priority?: number;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

// ============================================================================
// CRIAR PROCESSO
// ============================================================================

export async function createProcess(input: CreateProcessInput) {
  const processType = await prisma.internalProcessType.findUnique({
    where: { id: input.typeId },
    include: { defaultWorkflowTemplate: true },
  });

  if (!processType) {
    throw new Error('Tipo de processo nao encontrado');
  }

  if (!processType.isActive) {
    throw new Error('Tipo de processo inativo');
  }

  const number = await generateProcessNumber(processType.prefix);

  let dueAt = input.dueAt;
  if (!dueAt && processType.defaultSlaHours) {
    dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + processType.defaultSlaHours);
  }

  const process = await prisma.$transaction(async (tx) => {
    const proc = await tx.internalProcess.create({
      data: {
        number,
        typeId: input.typeId,
        subject: input.subject,
        description: input.description,
        sigilo: input.sigilo || processType.sigiloDefault,
        priority: input.priority || 0,
        status: 'ABERTO',
        originSectorId: input.originSectorId,
        originSectorName: input.originSectorName,
        currentSectorId: input.originSectorId,
        currentSectorName: input.originSectorName,
        createdById: input.createdById,
        createdByName: input.createdByName,
        currentUserId: input.currentUserId,
        currentUserName: input.currentUserName,
        citizenProtocolId: input.citizenProtocolId,
        dueAt,
        metadata: input.metadata as Prisma.InputJsonValue,
        tags: input.tags || [],
      },
    });

    await tx.internalProcessHistory.create({
      data: {
        processId: proc.id,
        action: 'DESPACHO',
        description: `Processo ${number} aberto por ${input.createdByName}`,
        note: input.description,
        fromSectorId: input.originSectorId,
        fromSectorName: input.originSectorName,
        toSectorId: input.originSectorId,
        toSectorName: input.originSectorName,
        userId: input.createdById,
        userName: input.createdByName,
      },
    });

    if (processType.defaultWorkflowTemplate) {
      const template = processType.defaultWorkflowTemplate;
      const steps = template.steps as Array<{ id: string; name: string }>;
      const firstStep = steps[0];

      if (firstStep) {
        const workflowInstance = await tx.workflowInstance.create({
          data: {
            processId: proc.id,
            templateId: template.id,
            currentStepId: firstStep.id,
            currentStepName: firstStep.name,
            status: 'ATIVO',
          },
        });

        await tx.workflowStepHistory.create({
          data: {
            instanceId: workflowInstance.id,
            stepId: firstStep.id,
            stepName: firstStep.name,
            action: 'iniciado',
            userId: input.createdById,
            userName: input.createdByName,
          },
        });
      }
    }

    return proc;
  });

  logger.info(`Processo criado: ${number}`, { id: process.id, type: processType.name });
  return process;
}

// ============================================================================
// LISTAR PROCESSOS
// ============================================================================

export async function listProcesses(filter: ListProcessesFilter) {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.InternalProcessWhereInput = {};

  if (filter.status) where.status = filter.status;
  if (filter.typeId) where.typeId = filter.typeId;
  if (filter.currentSectorId) where.currentSectorId = filter.currentSectorId;
  if (filter.currentUserId) where.currentUserId = filter.currentUserId;
  if (filter.createdById) where.createdById = filter.createdById;
  if (filter.citizenProtocolId) where.citizenProtocolId = filter.citizenProtocolId;
  if (filter.sigilo) where.sigilo = filter.sigilo;
  if (filter.priority !== undefined) where.priority = filter.priority;

  if (filter.search) {
    where.OR = [
      { number: { contains: filter.search, mode: 'insensitive' } },
      { subject: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
      { createdByName: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.InternalProcessOrderByWithRelationInput = {};
  const orderField = filter.orderBy || 'createdAt';
  const orderDir = filter.orderDir || 'desc';
  (orderBy as Record<string, string>)[orderField] = orderDir;

  const [processes, total] = await Promise.all([
    prisma.internalProcess.findMany({
      where,
      include: {
        type: { select: { name: true, prefix: true } },
        _count: {
          select: { dispatches: true, documents: true, history: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.internalProcess.count({ where }),
  ]);

  return {
    data: processes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// BUSCAR POR ID
// ============================================================================

export async function getProcessById(id: string) {
  const process = await prisma.internalProcess.findUnique({
    where: { id },
    include: {
      type: true,
      history: { orderBy: { createdAt: 'desc' } },
      dispatches: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      comments: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
      },
      signatures: { orderBy: { createdAt: 'desc' } },
      workflowInstance: {
        include: {
          template: true,
          stepHistory: { orderBy: { enteredAt: 'desc' } },
        },
      },
    },
  });

  if (!process) {
    throw new Error('Processo nao encontrado');
  }

  return process;
}

// ============================================================================
// ATUALIZAR PROCESSO
// ============================================================================

export async function updateProcess(id: string, input: UpdateProcessInput, userId: string, userName: string) {
  const existing = await prisma.internalProcess.findUnique({ where: { id } });
  if (!existing) throw new Error('Processo nao encontrado');

  if (existing.status === 'CONCLUIDO' || existing.status === 'CANCELADO') {
    throw new Error('Nao e possivel alterar um processo concluido ou cancelado');
  }

  const process = await prisma.internalProcess.update({
    where: { id },
    data: {
      ...(input.subject && { subject: input.subject }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.sigilo && { sigilo: input.sigilo }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.currentUserId !== undefined && { currentUserId: input.currentUserId }),
      ...(input.currentUserName !== undefined && { currentUserName: input.currentUserName }),
      ...(input.dueAt !== undefined && { dueAt: input.dueAt }),
      ...(input.metadata && { metadata: input.metadata as Prisma.InputJsonValue }),
      ...(input.tags && { tags: input.tags }),
    },
  });

  logger.info(`Processo atualizado: ${process.number}`, { id, userId, userName });
  return process;
}

// ============================================================================
// CANCELAR PROCESSO
// ============================================================================

export async function cancelProcess(id: string, userId: string, userName: string, reason: string) {
  const existing = await prisma.internalProcess.findUnique({ where: { id } });
  if (!existing) throw new Error('Processo nao encontrado');

  if (existing.status === 'CONCLUIDO' || existing.status === 'CANCELADO') {
    throw new Error('Processo ja esta finalizado');
  }

  const process = await prisma.$transaction(async (tx) => {
    const proc = await tx.internalProcess.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });

    await tx.internalProcessHistory.create({
      data: {
        processId: id,
        action: 'CANCELAMENTO',
        description: `Processo cancelado por ${userName}`,
        note: reason,
        userId,
        userName,
      },
    });

    await tx.workflowInstance.updateMany({
      where: { processId: id, status: 'ATIVO' },
      data: { status: 'CANCELADO', completedAt: new Date() },
    });

    return proc;
  });

  logger.info(`Processo cancelado: ${process.number}`, { id, reason });
  return process;
}
