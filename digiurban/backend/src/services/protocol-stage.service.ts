/**
 * Serviço para gerenciamento de Etapas de Protocolos (Workflow)
 */

import { CentralCalendarSourceType, SituacaoVinculo, StageStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { checkAllDocumentsApproved } from './protocol-document.service';
import {
  buildStageSupportAssignmentsSnapshot,
  getWorkflowByServiceId
} from './service-workflow.service';
import { centralCalendarService } from './central-calendar.service';
import type {
  WorkflowStage,
  WorkflowStageSupportAssignment
} from '../types/workflow.types';

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

export interface StageExecutionAccess {
  canExecute: boolean
  blockers: string[]
  requiredAssignments: WorkflowStageSupportAssignment[]
}

async function syncProtocolStageWithCentral(stageId: string) {
  try {
    await centralCalendarService.syncProtocolStageEventByStageId(stageId);
  } catch (error) {
    console.warn('Falha ao sincronizar etapa do protocolo com agenda centralizada', {
      stageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function removeProtocolStageFromCentral(stageId: string) {
  try {
    await centralCalendarService.removeSourceEvent(CentralCalendarSourceType.PROTOCOL_STAGE, stageId);
  } catch (error) {
    console.warn('Falha ao remover etapa do protocolo da agenda centralizada', {
      stageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function formatExecutionRule(assignment: WorkflowStageSupportAssignment) {
  if (assignment.targetType === 'USER') {
    return assignment.user?.name || assignment.userName || 'servidor vinculado'
  }

  if (assignment.targetType === 'DEPARTMENT') {
    return `departamento ${assignment.department?.name || assignment.departmentName || 'vinculado'}`
  }

  return `setor ${assignment.organizationalUnit?.nome || assignment.organizationalUnitName || 'vinculado'}`
}

function isReceptionStageMetadata(stageName: string | undefined, metadata: Record<string, any>) {
  const stageType = typeof metadata.stageType === 'string' ? metadata.stageType.trim() : '';
  if (stageType === 'RECEPTION') {
    return true;
  }

  const normalizedStageName = typeof stageName === 'string' ? stageName.toLowerCase() : '';
  return normalizedStageName.includes('recep') || normalizedStageName.includes('receb');
}

function isConclusionStageMetadata(stageName: string | undefined, metadata: Record<string, any>) {
  const stageType = typeof metadata.stageType === 'string' ? metadata.stageType.trim() : '';
  if (stageType === 'CONCLUSION') {
    return true;
  }

  const normalizedStageName = typeof stageName === 'string' ? stageName.toLowerCase() : '';
  return normalizedStageName.includes('conclus') || normalizedStageName.includes('conclu');
}

function hasStageRequirements(metadata: Record<string, any>) {
  const requiredDocumentTypes = Array.isArray(metadata.requiredDocumentTypes) ? metadata.requiredDocumentTypes : [];
  const requiredInputFieldIds = Array.isArray(metadata.requiredInputFieldIds) ? metadata.requiredInputFieldIds : [];
  const requiredStageOutputs = Array.isArray(metadata.requiredStageOutputs) ? metadata.requiredStageOutputs : [];
  const allowedActions = Array.isArray(metadata.allowedActions) ? metadata.allowedActions : [];

  return (
    requiredDocumentTypes.length > 0 ||
    requiredInputFieldIds.length > 0 ||
    requiredStageOutputs.length > 0 ||
    allowedActions.some(action => action === 'REJECT' || action === 'REQUEST_INFO' || action === 'CREATE_PENDING')
  );
}

function isDocumentGenerationStageMetadata(stageName: string | undefined, metadata: Record<string, any>) {
  const primaryTab = typeof metadata.primaryTab === 'string' ? metadata.primaryTab.trim() : '';
  const availableTabs = Array.isArray(metadata.availableTabs) ? metadata.availableTabs : [];
  const stageType = typeof metadata.stageType === 'string' ? metadata.stageType.trim() : '';
  const normalizedStageName = typeof stageName === 'string' ? stageName.toLowerCase() : '';
  const hasGeneratedTab = primaryTab === 'documentos-gerados' || availableTabs.includes('documentos-gerados');
  const hasGenerationName = [
    'emiss',
    'emitir',
    'expedi',
    'impress',
    'disponibil',
    'gerar',
    'gerac',
    'assin',
    'publica',
    'homolog'
  ].some(keyword => normalizedStageName.includes(keyword));
  const hasAnalysisName = [
    'analis',
    'analise',
    'valid',
    'vistoria',
    'triagem',
    'parecer',
    'fiscal',
    'tecnic',
    'socioeconom'
  ].some(keyword => normalizedStageName.includes(keyword));

  if (hasGeneratedTab) {
    return true;
  }

  if (hasStageRequirements(metadata) || hasAnalysisName) {
    return false;
  }

  if (stageType === 'DOCUMENT_GENERATION') {
    return true;
  }

  return hasGenerationName;
}

function sanitizeProtocolStageMetadata(stageName: string | undefined, metadata: Record<string, any>) {
  if (isReceptionStageMetadata(stageName, metadata)) {
    return {
      ...metadata,
      stageType: 'RECEPTION',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      requiredStageOutputs: []
    };
  }

  if (isConclusionStageMetadata(stageName, metadata)) {
    return {
      ...metadata,
      stageType: 'CONCLUSION'
    };
  }

  const isDocumentGeneration = isDocumentGenerationStageMetadata(stageName, metadata);
  const nextMetadata = {
    ...metadata,
    stageType: isDocumentGeneration ? 'DOCUMENT_GENERATION' : undefined
  };

  if (!isDocumentGeneration) {
    delete nextMetadata.stageType;
  }

  return nextMetadata;
}

function enrichStageWithWorkflowSupport<T extends { protocolId: string; metadata: any; stageName?: string }>(
  stage: T,
  workflowStagesById: Map<string, WorkflowStage>
): T {
  const metadata = (stage.metadata as Record<string, any> | null) || {};
  const currentSupportAssignments = Array.isArray(metadata.stageSupportAssignments)
    ? metadata.stageSupportAssignments
    : [];
  const currentDocumentTemplateIds = Array.isArray(metadata.documentTemplateIds)
    ? metadata.documentTemplateIds
    : [];

  const workflowStageId =
    typeof metadata.stageId === 'string' && metadata.stageId ? metadata.stageId : null;

  const workflowStage = workflowStageId ? workflowStagesById.get(workflowStageId) : null;
  const workflowSupportAssignments = workflowStage
    ? buildStageSupportAssignmentsSnapshot(workflowStage)
    : [];
  const nextMetadata = sanitizeProtocolStageMetadata(stage.stageName as string | undefined, {
    ...metadata,
    stageType: workflowStage ? workflowStage.stageType : metadata.stageType,
    availableTabs: workflowStage?.availableTabs || metadata.availableTabs || [],
    primaryTab: workflowStage?.primaryTab || metadata.primaryTab,
    requiredDocumentTypes:
      workflowStage?.requiredDocumentTypes ??
      metadata.requiredDocumentTypes ??
      [],
    requiredInputFieldIds:
      workflowStage?.requiredInputFieldIds ??
      metadata.requiredInputFieldIds ??
      [],
    requiredStageOutputs:
      workflowStage?.requiredStageOutputs ??
      metadata.requiredStageOutputs ??
      [],
    documentTemplateIds:
      workflowStage?.documentTemplateIds ??
      currentDocumentTemplateIds,
    allowedActions: workflowStage?.allowedActions || metadata.allowedActions || [],
    canSkip: workflowStage?.canSkip ?? metadata.canSkip ?? false,
    requiresApproval: workflowStage?.requiresApproval ?? metadata.requiresApproval,
    stageSupportAssignments:
      currentSupportAssignments.length > 0
        ? currentSupportAssignments
        : workflowSupportAssignments
  });

  return {
    ...stage,
    metadata: nextMetadata
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

export async function getStageExecutionAccess(
  stageId: string,
  userId: string
): Promise<StageExecutionAccess> {
  const stage = await getStageById(stageId);

  if (!stage) {
    throw new Error('Etapa não encontrada');
  }

  const metadata = (stage.metadata as Record<string, any> | null) || {};
  const requiredAssignments = Array.isArray(metadata.stageSupportAssignments)
    ? (metadata.stageSupportAssignments as WorkflowStageSupportAssignment[]).filter(
        assignment => assignment.mode === 'REQUIRED_EXECUTION'
      )
    : [];

  if (requiredAssignments.length === 0) {
    return {
      canExecute: true,
      blockers: [],
      requiredAssignments: []
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userDepartments: {
        where: {
          isActive: true
        },
        select: {
          departmentId: true
        }
      },
      assignments: {
        where: {
          situacao: SituacaoVinculo.ATIVO
        },
        select: {
          departmentId: true,
          organizationalUnitId: true
        }
      },
      unidadesResponsavel: {
        select: {
          id: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('Servidor não encontrado');
  }

  const departmentIds = new Set<string>();
  const organizationalUnitIds = new Set<string>();

  if (user.departmentId) {
    departmentIds.add(user.departmentId);
  }

  for (const userDepartment of user.userDepartments) {
    departmentIds.add(userDepartment.departmentId);
  }

  for (const assignment of user.assignments) {
    if (assignment.departmentId) {
      departmentIds.add(assignment.departmentId);
    }

    if (assignment.organizationalUnitId) {
      organizationalUnitIds.add(assignment.organizationalUnitId);
    }
  }

  for (const unit of user.unidadesResponsavel) {
    organizationalUnitIds.add(unit.id);
  }

  const canExecute = requiredAssignments.some((assignment) => {
    if (assignment.targetType === 'USER') {
      return assignment.userId === user.id
    }

    if (assignment.targetType === 'DEPARTMENT') {
      return Boolean(assignment.departmentId && departmentIds.has(assignment.departmentId))
    }

    return Boolean(
      assignment.organizationalUnitId && organizationalUnitIds.has(assignment.organizationalUnitId)
    )
  });

  if (canExecute) {
    return {
      canExecute: true,
      blockers: [],
      requiredAssignments
    };
  }

  return {
    canExecute: false,
    blockers: [
      `Execução restrita: apenas ${requiredAssignments.map(formatExecutionRule).join(', ')} podem atuar nesta etapa.`
    ],
    requiredAssignments
  };
}

async function assertUserCanExecuteStage(stageId: string, userId: string) {
  const executionAccess = await getStageExecutionAccess(stageId, userId);

  if (!executionAccess.canExecute) {
    throw new Error(executionAccess.blockers[0] || 'Usuário não autorizado a executar esta etapa');
  }
}

/**
 * Cria uma nova etapa de protocolo
 */
export async function createStage(data: CreateStageData) {
  const stage = await prisma.protocolStage.create({
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

  await syncProtocolStageWithCentral(stage.id);

  return stage;
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
  const stage = await prisma.protocolStage.update({
    where: { id: stageId },
    data
        });

  await syncProtocolStageWithCentral(stage.id);

  return stage;
}

/**
 * Inicia uma etapa
 * ✅ FASE 1: Atualiza currentStageId do protocolo
 */
export async function startStage(stageId: string, userId?: string) {
  if (userId) {
    await assertUserCanExecuteStage(stageId, userId);
  }

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

  await syncProtocolStageWithCentral(stage.id);

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
  await assertUserCanExecuteStage(stageId, userId);

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

  await syncProtocolStageWithCentral(completedStage.id);

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
  await assertUserCanExecuteStage(stageId, userId);

  const skippedStage = await prisma.protocolStage.update({
    where: { id: stageId },
    data: {
      status: StageStatus.SKIPPED,
      completedAt: new Date(),
      completedBy: userId,
      notes: reason
        }
        });

  await syncProtocolStageWithCentral(skippedStage.id);

  return skippedStage;
}

/**
 * Marca etapa como falha
 */
export async function failStage(
  stageId: string,
  userId: string,
  reason: string
) {
  await assertUserCanExecuteStage(stageId, userId);

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

  await syncProtocolStageWithCentral(failedStage.id);

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
  const deletedStage = await prisma.protocolStage.delete({
    where: { id: stageId }
        });

  await removeProtocolStageFromCentral(stageId);

  return deletedStage;
}

/**
 * Deleta todas as etapas de um protocolo
 */
export async function deleteProtocolStages(protocolId: string) {
  const stageIds = await prisma.protocolStage.findMany({
    where: { protocolId },
    select: { id: true },
  });

  const result = await prisma.protocolStage.deleteMany({
    where: { protocolId }
        });

  await Promise.all(stageIds.map((stage) => removeProtocolStageFromCentral(stage.id)));

  return result;
}
