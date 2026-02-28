/**
 * Serviço de gerenciamento de Workflow Templates e Instâncias
 */
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface WorkflowStep {
  id: string;
  name: string;
  sectorId?: string;
  sectorName?: string;
  slaHours?: number;
  documentRequired?: string;
  order: number;
  actions: string[]; // ["aprovar", "rejeitar", "despachar"]
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

// ============================================================================
// CRUD DE WORKFLOW TEMPLATES
// ============================================================================

export async function createWorkflowTemplate(input: CreateWorkflowTemplateInput) {
  const template = await prisma.workflowTemplate.create({
    data: {
      name: input.name,
      description: input.description,
      steps: input.steps as unknown as Prisma.InputJsonValue,
      transitions: input.transitions as unknown as Prisma.InputJsonValue,
    },
  });

  logger.info(`Workflow template criado: ${template.name}`, { id: template.id });
  return template;
}

export async function listWorkflowTemplates() {
  return prisma.workflowTemplate.findMany({
    orderBy: [
      { isActive: 'desc' },
      { name: 'asc' },
    ],
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

  if (!template) throw new Error('Workflow template não encontrado');
  return template;
}

export async function updateWorkflowTemplate(
  id: string,
  input: Partial<CreateWorkflowTemplateInput>
) {
  const existing = await prisma.workflowTemplate.findUnique({ where: { id } });
  if (!existing) throw new Error('Workflow template não encontrado');

  const template = await prisma.workflowTemplate.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.steps && { steps: input.steps as unknown as Prisma.InputJsonValue }),
      ...(input.transitions && { transitions: input.transitions as unknown as Prisma.InputJsonValue }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      version: existing.version + 1,
    },
  });

  logger.info(`Workflow template atualizado: ${template.name} v${template.version}`);
  return template;
}

// ============================================================================
// DESATIVAR (SOFT-DELETE) WORKFLOW TEMPLATE
// ============================================================================

export async function deleteWorkflowTemplate(id: string) {
  const existing = await prisma.workflowTemplate.findUnique({ where: { id } });
  if (!existing) throw new Error('Workflow template não encontrado');

  const activeInstances = await prisma.workflowInstance.count({
    where: { templateId: id, status: 'ATIVO' },
  });
  if (activeInstances > 0) {
    throw new Error(`Não é possível desativar: ${activeInstances} processo(s) usando este fluxo ativamente`);
  }

  await prisma.workflowTemplate.update({
    where: { id },
    data: { isActive: false },
  });

  logger.info(`Workflow template desativado: ${existing.name}`);
}

// ============================================================================
// INSTANCIAR WORKFLOW PARA UM PROCESSO
// ============================================================================

export async function instantiateWorkflow(processId: string, templateId: string, userId: string, userName: string) {
  const template = await prisma.workflowTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error('Workflow template não encontrado');

  const steps = template.steps as unknown as WorkflowStep[];
  if (!steps.length) throw new Error('Workflow template não possui etapas');

  const firstStep = steps.sort((a, b) => a.order - b.order)[0];

  const instance = await prisma.$transaction(async (tx) => {
    const inst = await tx.workflowInstance.create({
      data: {
        processId,
        templateId,
        currentStepId: firstStep.id,
        currentStepName: firstStep.name,
        status: 'ATIVO',
      },
    });

    await tx.workflowStepHistory.create({
      data: {
        instanceId: inst.id,
        stepId: firstStep.id,
        stepName: firstStep.name,
        action: 'iniciado',
        userId,
        userName,
      },
    });

    return inst;
  });

  logger.info(`Workflow instanciado para processo ${processId}`, { instanceId: instance.id });
  return instance;
}

// ============================================================================
// AVANÇAR WORKFLOW (transição de step)
// ============================================================================

export async function advanceWorkflow(input: AdvanceWorkflowInput) {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: input.instanceId },
    include: { template: true },
  });

  if (!instance) throw new Error('Instância de workflow não encontrada');
  if (instance.status !== 'ATIVO') throw new Error('Workflow não está ativo');

  const steps = instance.template.steps as unknown as WorkflowStep[];
  const transitions = instance.template.transitions as unknown as WorkflowTransition[];
  const currentStep = steps.find((step) => step.id === instance.currentStepId);

  if (currentStep && currentStep.actions.length > 0 && !currentStep.actions.includes(input.action)) {
    throw new Error('Ação não permitida para a etapa atual');
  }

  // Encontrar transições possíveis a partir do step atual
  const possibleTransitions = transitions.filter((t) => t.fromStepId === instance.currentStepId);

  if (!possibleTransitions.length) {
    // Última etapa — concluir workflow
    const result = await prisma.$transaction(async (tx) => {
      await tx.workflowStepHistory.create({
        data: {
          instanceId: input.instanceId,
          stepId: instance.currentStepId,
          stepName: instance.currentStepName,
          action: input.action,
          note: input.note,
          userId: input.userId,
          userName: input.userName,
          completedAt: new Date(),
        },
      });

      const inst = await tx.workflowInstance.update({
        where: { id: input.instanceId },
        data: { status: 'CONCLUIDO', completedAt: new Date() },
      });

      return inst;
    });

    logger.info('Workflow concluído', { instanceId: input.instanceId });
    return result;
  }

  // Selecionar a próxima transição (primeira válida)
  const nextTransition = possibleTransitions.find((transition) => transition.label === input.action) || possibleTransitions[0];
  const nextStep = steps.find((s) => s.id === nextTransition.toStepId);

  if (!nextStep) throw new Error('Próxima etapa não encontrada no template');

  const result = await prisma.$transaction(async (tx) => {
    // Completar step atual
    await tx.workflowStepHistory.create({
      data: {
        instanceId: input.instanceId,
        stepId: instance.currentStepId,
        stepName: instance.currentStepName,
        action: input.action,
        note: input.note,
        userId: input.userId,
        userName: input.userName,
        completedAt: new Date(),
      },
    });

    // Iniciar próximo step
    await tx.workflowStepHistory.create({
      data: {
        instanceId: input.instanceId,
        stepId: nextStep.id,
        stepName: nextStep.name,
        action: 'iniciado',
        userId: input.userId,
        userName: input.userName,
      },
    });

    // Atualizar instância
    const inst = await tx.workflowInstance.update({
      where: { id: input.instanceId },
      data: {
        currentStepId: nextStep.id,
        currentStepName: nextStep.name,
      },
    });

    return inst;
  });

  logger.info(`Workflow avançou para: ${nextStep.name}`, { instanceId: input.instanceId });
  return result;
}
