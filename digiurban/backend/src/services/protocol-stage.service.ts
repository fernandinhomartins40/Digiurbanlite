/**
 * Serviço para gerenciamento de Etapas de Protocolos (Workflow)
 */

import { StageStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { checkAllDocumentsApproved } from './protocol-document.service';

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
  return await prisma.protocolStage.findMany({
    where: { protocolId },
    orderBy: { stageOrder: 'asc' }
        });
}

/**
 * Obtém uma etapa por ID
 */
export async function getStageById(stageId: string) {
  return await prisma.protocolStage.findUnique({
    where: { id: stageId }
        });
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
 */
export async function startStage(stageId: string, userId?: string) {
  return await prisma.protocolStage.update({
    where: { id: stageId },
    data: {
      status: StageStatus.IN_PROGRESS,
      startedAt: new Date(),
      assignedTo: userId
        }
        });
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
    const workflowService = await import('./module-workflow.service');
    const validation = await workflowService.validateStageConditions(
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
  await workflowOrchestrator.onStageCompleted(stageId, userId);

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
  return await prisma.protocolStage.findFirst({
    where: {
      protocolId,
      status: {
        in: [StageStatus.PENDING, StageStatus.IN_PROGRESS]
        }
        },
    orderBy: { stageOrder: 'asc' }
        });
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
