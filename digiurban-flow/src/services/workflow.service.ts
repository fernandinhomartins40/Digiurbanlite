/**
 * Workflow template and instance service.
 */
import { Prisma, WorkflowInstance } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

export interface WorkflowStep {
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

export interface WorkflowTransition {
  fromStepId: string;
  toStepId: string;
  condition?: string;
  label: string;
}

export interface CreateWorkflowTemplateInput {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  transitions: WorkflowTransition[];
  isActive?: boolean;
}

export interface AdvanceWorkflowInput {
  instanceId: string;
  action: string;
  note?: string;
  userId: string;
  userName: string;
}

interface LoadedWorkflowInstance extends WorkflowInstance {
  template: {
    id: string;
    version: number;
    name: string;
    steps: Prisma.JsonValue;
    transitions: Prisma.JsonValue;
  };
}

function ensureString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function normalizeWorkflowSteps(raw: unknown): WorkflowStep[] {
  if (!Array.isArray(raw)) return [];
  const normalized = raw
    .map((step, index) => {
      if (!step || typeof step !== 'object') return null;
      const value = step as Record<string, unknown>;
      const id = ensureString(value.id, `step_${index + 1}`);
      const name = ensureString(value.name, `Etapa ${index + 1}`).trim() || `Etapa ${index + 1}`;
      const order =
        typeof value.order === 'number' && Number.isFinite(value.order) ? value.order : index;
      const actions = Array.isArray(value.actions)
        ? value.actions.filter(
            (action): action is string => typeof action === 'string' && action.length > 0,
          )
        : [];

      return {
        id,
        name,
        order,
        actions: actions.length > 0 ? actions : ['ENCAMINHADO'],
        departmentId: ensureString(value.departmentId) || undefined,
        organizationalUnitId: ensureString(value.organizationalUnitId) || undefined,
        organizationalUnitName: ensureString(value.organizationalUnitName) || undefined,
        slaHours: typeof value.slaHours === 'number' ? value.slaHours : undefined,
        documentRequired: ensureString(value.documentRequired) || undefined,
      } as WorkflowStep;
    })
    .filter((step): step is WorkflowStep => step !== null)
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({ ...step, order: index }));

  return normalized;
}

export function normalizeWorkflowTransitions(
  raw: unknown,
  steps: WorkflowStep[],
): WorkflowTransition[] {
  if (!Array.isArray(raw)) return [];
  const validStepIds = new Set(steps.map((step) => step.id));

  const transitions = raw
    .map((transition) => {
      if (!transition || typeof transition !== 'object') return null;
      const value = transition as Record<string, unknown>;
      const fromStepId = ensureString(value.fromStepId);
      const toStepId = ensureString(value.toStepId);
      if (!fromStepId || !toStepId) return null;
      if (!validStepIds.has(fromStepId) || !validStepIds.has(toStepId)) return null;
      return {
        fromStepId,
        toStepId,
        condition: ensureString(value.condition) || undefined,
        label: ensureString(value.label, 'ENCAMINHADO'),
      } as WorkflowTransition;
    })
    .filter((transition): transition is WorkflowTransition => transition !== null);

  return transitions;
}

function getInstanceSteps(instance: LoadedWorkflowInstance): WorkflowStep[] {
  const snapshot = normalizeWorkflowSteps(instance.stepsSnapshot as unknown);
  if (snapshot.length > 0) return snapshot;
  return normalizeWorkflowSteps(instance.template.steps as unknown);
}

function getInstanceTransitions(instance: LoadedWorkflowInstance, steps: WorkflowStep[]): WorkflowTransition[] {
  const snapshot = normalizeWorkflowTransitions(instance.transitionsSnapshot as unknown, steps);
  if (snapshot.length > 0) return snapshot;
  return normalizeWorkflowTransitions(instance.template.transitions as unknown, steps);
}

function pickTransition(
  action: string,
  instance: LoadedWorkflowInstance,
  steps: WorkflowStep[],
  transitions: WorkflowTransition[],
): { nextStep: WorkflowStep | null } {
  const currentStep = steps.find((step) => step.id === instance.currentStepId);
  if (!currentStep) {
    throw new Error('Etapa atual do workflow nao encontrada');
  }

  if (currentStep.actions.length > 0 && !currentStep.actions.includes(action)) {
    throw new Error('Acao nao permitida para a etapa atual');
  }

  const availableTransitions = transitions.filter(
    (transition) => transition.fromStepId === instance.currentStepId,
  );

  if (availableTransitions.length === 0) {
    return { nextStep: null };
  }

  const selectedTransition =
    availableTransitions.find((transition) => transition.label === action) ||
    availableTransitions[0];

  const nextStep = steps.find((step) => step.id === selectedTransition.toStepId);
  if (!nextStep) {
    throw new Error('Proxima etapa do workflow nao encontrada');
  }

  return { nextStep };
}

async function advanceLoadedInstance(
  tx: PrismaClientLike,
  instance: LoadedWorkflowInstance,
  input: AdvanceWorkflowInput,
) {
  if (instance.status !== 'ATIVO') {
    throw new Error('Workflow nao esta ativo');
  }

  const steps = getInstanceSteps(instance);
  const transitions = getInstanceTransitions(instance, steps);
  const { nextStep } = pickTransition(input.action, instance, steps, transitions);

  await tx.workflowStepHistory.create({
    data: {
      instanceId: instance.id,
      stepId: instance.currentStepId,
      stepName: instance.currentStepName,
      action: input.action,
      note: input.note,
      userId: input.userId,
      userName: input.userName,
      completedAt: new Date(),
    },
  });

  if (!nextStep) {
    const updated = await tx.workflowInstance.update({
      where: { id: instance.id },
      data: {
        status: 'CONCLUIDO',
        completedAt: new Date(),
      },
    });
    logger.info('Workflow concluido', { instanceId: instance.id });
    return updated;
  }

  await tx.workflowStepHistory.create({
    data: {
      instanceId: instance.id,
      stepId: nextStep.id,
      stepName: nextStep.name,
      action: 'iniciado',
      userId: input.userId,
      userName: input.userName,
    },
  });

  const updated = await tx.workflowInstance.update({
    where: { id: instance.id },
    data: {
      currentStepId: nextStep.id,
      currentStepName: nextStep.name,
    },
  });

  logger.info(`Workflow avancou para ${nextStep.name}`, { instanceId: instance.id });
  return updated;
}

// ============================================================================
// TEMPLATES
// ============================================================================

export async function createWorkflowTemplate(input: CreateWorkflowTemplateInput) {
  const steps = normalizeWorkflowSteps(input.steps);
  if (steps.length === 0) {
    throw new Error('Workflow template precisa de ao menos uma etapa');
  }

  const transitions = normalizeWorkflowTransitions(input.transitions, steps);

  const template = await prisma.workflowTemplate.create({
    data: {
      name: input.name,
      description: input.description,
      steps: steps as unknown as Prisma.InputJsonValue,
      transitions: transitions as unknown as Prisma.InputJsonValue,
      isActive: input.isActive !== false,
      version: 1,
    },
  });

  logger.info(`Workflow template criado: ${template.name}`, { id: template.id });
  return template;
}

export async function listWorkflowTemplates() {
  return prisma.workflowTemplate.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: {
      _count: { select: { instances: true } },
    },
  });
}

export async function getWorkflowTemplate(id: string) {
  const template = await prisma.workflowTemplate.findUnique({
    where: { id },
    include: {
      _count: { select: { instances: true } },
    },
  });

  if (!template) throw new Error('Workflow template nao encontrado');
  return template;
}

export async function updateWorkflowTemplate(
  id: string,
  input: Partial<CreateWorkflowTemplateInput>,
) {
  const existing = await prisma.workflowTemplate.findUnique({
    where: { id },
    include: {
      _count: { select: { instances: true } },
      processTypes: { select: { id: true } },
    },
  });

  if (!existing) throw new Error('Workflow template nao encontrado');

  const steps = normalizeWorkflowSteps(
    input.steps ?? (existing.steps as unknown as WorkflowStep[]),
  );
  if (steps.length === 0) {
    throw new Error('Workflow template precisa de ao menos uma etapa');
  }
  const transitions = normalizeWorkflowTransitions(
    input.transitions ?? (existing.transitions as unknown as WorkflowTransition[]),
    steps,
  );

  const mergedData = {
    name: input.name ?? existing.name,
    description: input.description !== undefined ? input.description : existing.description || undefined,
    steps: steps as unknown as Prisma.InputJsonValue,
    transitions: transitions as unknown as Prisma.InputJsonValue,
    isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
  };

  if (existing._count.instances > 0) {
    const nextVersion = existing.version + 1;

    const cloned = await prisma.$transaction(async (tx) => {
      const created = await tx.workflowTemplate.create({
        data: {
          ...mergedData,
          version: nextVersion,
        },
      });

      await tx.internalProcessType.updateMany({
        where: { defaultWorkflowTemplateId: existing.id },
        data: { defaultWorkflowTemplateId: created.id },
      });

      await tx.workflowTemplate.update({
        where: { id: existing.id },
        data: { isActive: false },
      });

      return created;
    });

    logger.info(
      `Workflow template versionado: ${existing.name} v${existing.version} -> v${cloned.version}`,
      { originalTemplateId: existing.id, newTemplateId: cloned.id },
    );

    return cloned;
  }

  const updated = await prisma.workflowTemplate.update({
    where: { id },
    data: {
      ...mergedData,
      version: existing.version + 1,
    },
  });

  logger.info(`Workflow template atualizado: ${updated.name} v${updated.version}`);
  return updated;
}

export async function deleteWorkflowTemplate(id: string) {
  const existing = await prisma.workflowTemplate.findUnique({ where: { id } });
  if (!existing) throw new Error('Workflow template nao encontrado');

  const activeInstances = await prisma.workflowInstance.count({
    where: { templateId: id, status: 'ATIVO' },
  });
  if (activeInstances > 0) {
    throw new Error(
      `Nao e possivel desativar: ${activeInstances} processo(s) usando este fluxo ativamente`,
    );
  }

  await prisma.workflowTemplate.update({
    where: { id },
    data: { isActive: false },
  });

  logger.info(`Workflow template desativado: ${existing.name}`);
}

// ============================================================================
// INSTANCES
// ============================================================================

export async function instantiateWorkflow(
  processId: string,
  templateId: string,
  userId: string,
  userName: string,
) {
  const template = await prisma.workflowTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error('Workflow template nao encontrado');
  if (!template.isActive) throw new Error('Workflow template inativo');

  const steps = normalizeWorkflowSteps(template.steps as unknown as WorkflowStep[]);
  if (!steps.length) throw new Error('Workflow template nao possui etapas');

  const transitions = normalizeWorkflowTransitions(
    template.transitions as unknown as WorkflowTransition[],
    steps,
  );
  const firstStep = steps[0];

  const instance = await prisma.$transaction(async (tx) => {
    const created = await tx.workflowInstance.create({
      data: {
        processId,
        templateId,
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
        instanceId: created.id,
        stepId: firstStep.id,
        stepName: firstStep.name,
        action: 'iniciado',
        userId,
        userName,
      },
    });

    return created;
  });

  logger.info(`Workflow instanciado para processo ${processId}`, { instanceId: instance.id });
  return instance;
}

export async function advanceWorkflow(input: AdvanceWorkflowInput) {
  const result = await prisma.$transaction(async (tx) => {
    const instance = await tx.workflowInstance.findUnique({
      where: { id: input.instanceId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            version: true,
            steps: true,
            transitions: true,
          },
        },
      },
    });

    if (!instance) throw new Error('Instancia de workflow nao encontrada');
    return advanceLoadedInstance(tx, instance as LoadedWorkflowInstance, input);
  });

  return result;
}

export async function tryAdvanceActiveWorkflowForProcess(
  tx: PrismaClientLike,
  processId: string,
  input: Omit<AdvanceWorkflowInput, 'instanceId'>,
) {
  const instance = await tx.workflowInstance.findFirst({
    where: {
      processId,
      status: 'ATIVO',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          version: true,
          steps: true,
          transitions: true,
        },
      },
    },
  });

  if (!instance) {
    return null;
  }

  return advanceLoadedInstance(tx, instance as LoadedWorkflowInstance, {
    ...input,
    instanceId: instance.id,
  });
}
