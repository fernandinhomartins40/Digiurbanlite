/**
 * Serviço para gerenciamento de Etapas de Protocolos (Workflow)
 */

import { StageStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { checkAllDocumentsApproved } from './protocol-document.service';
import {
  buildStageSupportAssignmentsSnapshot,
  getWorkflowByServiceId
} from './service-workflow.service';
import type { WorkflowStage } from '../types/workflow.types';

/**
 * Interface para criação de etapa
 */
export interface CreateStageData {
  protocolId: string;
  stageName: string;
  stageOrder: number;
  assignedTo?: string;
  dueDate?: Date;
  metadata?: any;
}

/**
 * Interface para atualização de etapa
 */
export interface UpdateStageData {
  status?: StageStatus;
  assignedTo?: string;
  dueDate?: Date;
  result?: string;
  notes?: string;
  metadata?: any;
}

function enrichStageWithWorkflowSupport<T extends { protocolId: string; metadata: any }>(
  stage: T,
  workflowStagesById: Map<string, WorkflowStage>
): T {
  const metadata = (stage.metadata as Record<string, any> | null) || {};
  const currentSupportAssignments = Array.isArray(metadata.stageSupportAssignments)
    ? metadata.stageSupportAssignments
    : [];

  if (currentSupportAssignments.length > 0) {
    return stage;
  }

  const workflowStageId =
    typeof metadata.stageId === 'string' && metadata.stageId ? metadata.stageId : null;

  if (!workflowStageId) {
    return stage;
  }

  const workflowStage = workflowStagesById.get(workflowStageId);

  if (!workflowStage || (workflowStage.supportAssignments?.length || 0) === 0) {
    return stage;
  }

  return {
    ...stage,
    metadata: {
      ...metadata,
      requiredFormFields:
        metadata.requiredFormFields ||
        metadata.requiredFormFieldIds ||
        workflowStage.requiredFormFieldIds ||
        [],
      stageSupportAssignments: buildStageSupportAssignmentsSnapshot(workflowStage)
    }
  };
}

async function hydrateProtocolStagesSupport<T extends { protocolId: string; metadata: any }>(
  protocolId: string,
  stages: T[]
) {
  if (stages.length === 0) {
    return stages;
  }

  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: { serviceId: true }
  });

  if (!protocol) {
    return stages;
  }

  const workflow = await getWorkflowByServiceId(protocol.serviceId);
  const workflowStages = Array.isArray(workflow?.stages)
    ? (workflow.stages as unknown as WorkflowStage[])
    : [];

  if (workflowStages.length === 0) {
    return stages;
  }

  const workflowStagesById = new Map(
    workflowStages.map(stage => [stage.id, stage])
  );

  return stages.map(stage => enrichStageWithWorkflowSupport(stage, workflowStagesById));
}

/**
 * Cria uma nova etapa de protocolo
 */
export async function createStage(data: CreateStageData) {
  return await prisma.protocolStage.create({
    data: {
      protocolId: data.protocolId,
      stageName: data.stageName,
      stageOrder: data.stageOrder,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      metadata: data.metadata,
      status: StageStatus.PENDING
        }
        });
}

/**
 * Lista todas as etapas de um protocolo
 */
export async function getProtocolStages(protocolId: string) {
  const stages = await prisma.protocolStage.findMany({
    where: { protocolId },
    orderBy: { stageOrder: 'asc' }
        });

  return await hydrateProtocolStagesSupport(protocolId, stages);
}

/**
 * Obtém uma etapa por ID
 */
export async function getStageById(stageId: string) {
  const stage = await prisma.protocolStage.findUnique({
    where: { id: stageId }
        });

  if (!stage) {
    return null;
  }

  const [hydratedStage] = await hydrateProtocolStagesSupport(stage.protocolId, [stage]);
  return hydratedStage || null;
}

/**
 * Atualiza uma etapa
 */
export async function updateStage(stageId: string, data: UpdateStageData) {
  return await prisma.protocolStage.update({
    where: { id: stageId },
    data
        });
}

/**
 * Inicia uma etapa
 * ✅ FASE 1: Atualiza currentStageId do protocolo
 */
export async function startStage(stageId: string, userId?: string) {
  const stage = await prisma.protocolStage.update({
    where: { id: stageId },
    data: {
      status: StageStatus.IN_PROGRESS,
      startedAt: new Date(),
      assignedTo: userId
    }
  });

  // ✅ FASE 1: Atualizar currentStageId do protocolo
  await prisma.protocolSimplified.update({
    where: { id: stage.protocolId },
    data: { currentStageId: stageId }
  });

  return stage;
}

/**
 * Completa uma etapa com validação de documentos
 */
export async function completeStage(
  stageId: string,
  userId: string,
  result?: string,
  notes?: string
) {
  // Buscar informações da stage
  const stage = await prisma.protocolStage.findUnique({
    where: { id: stageId },
    select: {
      protocolId: true,
      stageName: true,
      stageOrder: true
    }
  });

  if (!stage) {
    throw new Error('Etapa não encontrada');
  }

  // ✅ VALIDAÇÃO ALINHADA: Verificar condições da etapa baseado no workflow
  if (result === 'APPROVED') {
    const serviceWorkflowService = await import('./service-workflow.service');
    const validation = await serviceWorkflowService.validateStageConditions(
      stage.protocolId,
      stage.stageOrder
    );

    if (!validation.canProgress) {
      throw new Error(
        `Não é possível aprovar a etapa "${stage.stageName}". ` +
        `Pendências: ${validation.blockers.join('; ')}`
      );
    }
  }

  // Completar etapa
  const completedStage = await prisma.protocolStage.update({
    where: { id: stageId },
    data: {
      status: StageStatus.COMPLETED,
      completedAt: new Date(),
      completedBy: userId,
      result,
      notes
        }
        });

  // ✨ NOVO: Disparar orquestrador de workflow
  const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
  await workflowOrchestrator.onStageCompleted(stageId, userId, result, notes);

  return completedStage;
}

/**
 * Pula uma etapa
 */
export async function skipStage(
  stageId: string,
  userId: string,
  reason?: string
) {
  return await prisma.protocolStage.update({
    where: { id: stageId },
    data: {
      status: StageStatus.SKIPPED,
      completedAt: new Date(),
      completedBy: userId,
      notes: reason
        }
        });
}

/**
 * Marca etapa como falha
 */
export async function failStage(
  stageId: string,
  userId: string,
  reason: string
) {
  const failedStage = await prisma.protocolStage.update({
    where: { id: stageId },
    data: {
      status: StageStatus.FAILED,
      completedAt: new Date(),
      completedBy: userId,
      result: 'FAILED',
      notes: reason
        }
        });

  // ✨ NOVO: Disparar orquestrador de workflow
  const { workflowOrchestrator } = await import('./protocol-workflow-orchestrator.service');
  await workflowOrchestrator.onStageFailed(stageId, userId, reason);

  return failedStage;
}

/**
 * Obtém a etapa atual do protocolo (primeira PENDING ou IN_PROGRESS)
 */
export async function getCurrentStage(protocolId: string) {
  const stage = await prisma.protocolStage.findFirst({
    where: {
      protocolId,
      status: {
        in: [StageStatus.PENDING, StageStatus.IN_PROGRESS]
        }
        },
    orderBy: { stageOrder: 'asc' }
        });

  if (!stage) {
    return null;
  }

  const [hydratedStage] = await hydrateProtocolStagesSupport(protocolId, [stage]);
  return hydratedStage || null;
}

/**
 * Verifica se todas as etapas foram completadas
 */
export async function allStagesCompleted(protocolId: string): Promise<boolean> {
  const stages = await prisma.protocolStage.findMany({
    where: { protocolId }
        });

  if (stages.length === 0) return false;

  return stages.every(
    (stage) =>
      stage.status === StageStatus.COMPLETED ||
      stage.status === StageStatus.SKIPPED
  );
}

/**
 * Conta etapas por status
 */
export async function countStagesByStatus(protocolId: string) {
  const stages = await prisma.protocolStage.findMany({
    where: { protocolId }
        });

  return {
    [StageStatus.PENDING]: stages.filter((s) => s.status === StageStatus.PENDING)
      .length,
    [StageStatus.IN_PROGRESS]: stages.filter(
      (s) => s.status === StageStatus.IN_PROGRESS
    ).length,
    [StageStatus.COMPLETED]: stages.filter(
      (s) => s.status === StageStatus.COMPLETED
    ).length,
    [StageStatus.SKIPPED]: stages.filter((s) => s.status === StageStatus.SKIPPED)
      .length,
    [StageStatus.FAILED]: stages.filter((s) => s.status === StageStatus.FAILED)
      .length
        };
}

/**
 * Deleta uma etapa
 */
export async function deleteStage(stageId: string) {
  return await prisma.protocolStage.delete({
    where: { id: stageId }
        });
}

/**
 * Deleta todas as etapas de um protocolo
 */
export async function deleteProtocolStages(protocolId: string) {
  return await prisma.protocolStage.deleteMany({
    where: { protocolId }
        });
}
