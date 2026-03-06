/**
 * Internal process CRUD service.
 */
import { Prisma, ProcessStatus, SigiloLevel } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { generateProcessNumber } from './numbering.service';
import {
  assertProcessAccess,
  buildProcessVisibilityWhere,
} from './access-control.service';
import { FlowAuthContext } from '../middleware/auth.middleware';

interface SnapshotWorkflowStep {
  id: string;
  name: string;
  order: number;
  actions: string[];
  departmentId?: string;
  organizationalUnitId?: string;
  organizationalUnitName?: string;
  slaHours?: number;
  documentRequired?: string;
}

interface SnapshotWorkflowTransition {
  fromStepId: string;
  toStepId: string;
  condition?: string;
  label: string;
}

// ============================================================================
// INPUTS
// ============================================================================

export interface CreateProcessInput {
  typeId: string;
  subject: string;
  description?: string;
  sigilo?: SigiloLevel;
  priority?: number;
  originDepartmentId?: string;
  originOrganizationalUnitId: string;
  originOrganizationalUnitName: string;
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
  currentDepartmentId?: string;
  currentOrganizationalUnitId?: string;
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

function normalizeSteps(raw: unknown): SnapshotWorkflowStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((step, index) => {
      if (!step || typeof step !== 'object') return null;
      const value = step as Record<string, unknown>;
      const id = typeof value.id === 'string' ? value.id : `step_${index + 1}`;
      const name =
        typeof value.name === 'string' && value.name.trim().length > 0
          ? value.name.trim()
          : `Etapa ${index + 1}`;
      const order =
        typeof value.order === 'number' && Number.isFinite(value.order) ? value.order : index;
      const actions = Array.isArray(value.actions)
        ? value.actions.filter(
            (action): action is string => typeof action === 'string' && action.length > 0,
          )
        : ['ENCAMINHADO'];

      return {
        id,
        name,
        order,
        actions: actions.length > 0 ? actions : ['ENCAMINHADO'],
        departmentId: typeof value.departmentId === 'string' ? value.departmentId : undefined,
        organizationalUnitId:
          typeof value.organizationalUnitId === 'string'
            ? value.organizationalUnitId
            : undefined,
        organizationalUnitName:
          typeof value.organizationalUnitName === 'string'
            ? value.organizationalUnitName
            : undefined,
        slaHours: typeof value.slaHours === 'number' ? value.slaHours : undefined,
        documentRequired:
          typeof value.documentRequired === 'string' ? value.documentRequired : undefined,
      } as SnapshotWorkflowStep;
    })
    .filter((step): step is SnapshotWorkflowStep => step !== null)
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({ ...step, order: index }));
}

function normalizeTransitions(raw: unknown, steps: SnapshotWorkflowStep[]): SnapshotWorkflowTransition[] {
  if (!Array.isArray(raw)) return [];
  const validStepIds = new Set(steps.map((step) => step.id));
  return raw
    .map((transition) => {
      if (!transition || typeof transition !== 'object') return null;
      const value = transition as Record<string, unknown>;
      const fromStepId = typeof value.fromStepId === 'string' ? value.fromStepId : '';
      const toStepId = typeof value.toStepId === 'string' ? value.toStepId : '';
      if (!fromStepId || !toStepId) return null;
      if (!validStepIds.has(fromStepId) || !validStepIds.has(toStepId)) return null;
      return {
        fromStepId,
        toStepId,
        condition: typeof value.condition === 'string' ? value.condition : undefined,
        label: typeof value.label === 'string' && value.label ? value.label : 'ENCAMINHADO',
      } as SnapshotWorkflowTransition;
    })
    .filter((transition): transition is SnapshotWorkflowTransition => transition !== null);
}

// ============================================================================
// CREATE
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
        originDepartmentId: input.originDepartmentId,
        originOrganizationalUnitId: input.originOrganizationalUnitId,
        originOrganizationalUnitName: input.originOrganizationalUnitName,
        currentDepartmentId: input.originDepartmentId,
        currentOrganizationalUnitId: input.originOrganizationalUnitId,
        currentOrganizationalUnitName: input.originOrganizationalUnitName,
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
        fromDepartmentId: input.originDepartmentId,
        fromOrganizationalUnitId: input.originOrganizationalUnitId,
        fromOrganizationalUnitName: input.originOrganizationalUnitName,
        toDepartmentId: input.originDepartmentId,
        toOrganizationalUnitId: input.originOrganizationalUnitId,
        toOrganizationalUnitName: input.originOrganizationalUnitName,
        userId: input.createdById,
        userName: input.createdByName,
      },
    });

    if (processType.defaultWorkflowTemplate) {
      const template = processType.defaultWorkflowTemplate;
      const steps = normalizeSteps(template.steps);
      const transitions = normalizeTransitions(template.transitions, steps);
      const firstStep = steps[0];

      if (firstStep) {
        const workflowInstance = await tx.workflowInstance.create({
          data: {
            processId: proc.id,
            templateId: template.id,
            templateVersion: template.version,
            templateName: template.name,
            stepsSnapshot: steps as unknown as Prisma.InputJsonValue,
            transitionsSnapshot: transitions as unknown as Prisma.InputJsonValue,
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
// LIST
// ============================================================================

export async function listProcesses(filter: ListProcessesFilter, auth: FlowAuthContext) {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.InternalProcessWhereInput = {
    AND: [buildProcessVisibilityWhere(auth)],
  };
  const andConditions = where.AND as Prisma.InternalProcessWhereInput[];

  if (filter.status) andConditions.push({ status: filter.status });
  if (filter.typeId) andConditions.push({ typeId: filter.typeId });
  if (filter.currentDepartmentId) andConditions.push({ currentDepartmentId: filter.currentDepartmentId });
  if (filter.currentOrganizationalUnitId) {
    andConditions.push({ currentOrganizationalUnitId: filter.currentOrganizationalUnitId });
  }
  if (filter.currentUserId) andConditions.push({ currentUserId: filter.currentUserId });
  if (filter.createdById) andConditions.push({ createdById: filter.createdById });
  if (filter.citizenProtocolId) andConditions.push({ citizenProtocolId: filter.citizenProtocolId });
  if (filter.sigilo) andConditions.push({ sigilo: filter.sigilo });
  if (filter.priority !== undefined) andConditions.push({ priority: filter.priority });

  if (filter.search) {
    andConditions.push({
      OR: [
        { number: { contains: filter.search, mode: 'insensitive' } },
        { subject: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { createdByName: { contains: filter.search, mode: 'insensitive' } },
      ],
    });
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
// GET BY ID
// ============================================================================

export async function getProcessById(id: string, auth: FlowAuthContext) {
  const process = await prisma.internalProcess.findFirst({
    where: {
      id,
      AND: [buildProcessVisibilityWhere(auth)],
    },
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
    throw new Error('Processo nao encontrado ou acesso negado');
  }

  return process;
}

// ============================================================================
// UPDATE
// ============================================================================

export async function updateProcess(
  id: string,
  input: UpdateProcessInput,
  auth: FlowAuthContext,
) {
  await assertProcessAccess(prisma, id, auth);

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

  logger.info(`Processo atualizado: ${process.number}`, {
    id,
    userId: auth.userId,
    userName: auth.userName,
  });
  return process;
}

// ============================================================================
// CANCEL
// ============================================================================

export async function cancelProcess(
  id: string,
  auth: FlowAuthContext,
  reason: string,
) {
  await assertProcessAccess(prisma, id, auth);

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
        description: `Processo cancelado por ${auth.userName}`,
        note: reason,
        userId: auth.userId,
        userName: auth.userName,
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
