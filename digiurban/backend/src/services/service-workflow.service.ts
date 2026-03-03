/**
 * ============================================================================
 * SERVICE WORKFLOW SERVICE - NOVO MODELO
 * ============================================================================
 *
 * Gerenciamento de Workflows por Serviço (não por ModuleType)
 * Permite que TODOS os serviços tenham workflow customizado
 */

import { prisma } from '../lib/prisma';
import type {
  WorkflowStage,
  WorkflowStageInput,
  StageValidationResult,
  WorkflowStageSupportAssignment
} from '../types/workflow.types';
import {
  DocumentStatus,
  Prisma,
  WorkflowStageSupportMode as DbWorkflowStageSupportMode,
  WorkflowStageSupportTargetType as DbWorkflowStageSupportTargetType
} from '@prisma/client';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateServiceWorkflowData {
  serviceId: string;
  name: string;
  description?: string;
  stages: WorkflowStageInput[];
  defaultSLA?: number;
  rules?: any;
}

export interface UpdateServiceWorkflowData {
  name?: string;
  description?: string;
  stages?: WorkflowStageInput[];
  defaultSLA?: number;
  rules?: any;
  isActive?: boolean;
}

const workflowInclude = {
  service: {
    include: {
      department: true
    }
  }
} as const satisfies Prisma.ServiceWorkflowInclude;

const workflowStageSupportInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  organizationalUnit: {
    select: {
      id: true,
      nome: true,
      sigla: true,
      tipo: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} as const satisfies Prisma.WorkflowStageSupportAssignmentInclude;

type ServiceWorkflowWithRelations = Prisma.ServiceWorkflowGetPayload<{
  include: typeof workflowInclude;
}>;

type WorkflowStageSupportRecord = Prisma.WorkflowStageSupportAssignmentGetPayload<{
  include: typeof workflowStageSupportInclude;
}>;

function normalizeStageSupportAssignment(
  assignment: WorkflowStageSupportAssignment | Record<string, any> | null | undefined
): WorkflowStageSupportAssignment | null {
  if (!assignment || typeof assignment !== 'object') {
    return null;
  }

  const targetType =
    assignment.targetType === 'USER' || assignment.targetType === 'ORGANIZATIONAL_UNIT'
      ? assignment.targetType
      : null;

  if (!targetType) {
    return null;
  }

  const mode = assignment.mode === 'SUGGEST_ASSIGNMENT' ? 'SUGGEST_ASSIGNMENT' : 'REFERENCE_ONLY';
  const userId = typeof assignment.userId === 'string' && assignment.userId ? assignment.userId : undefined;
  const organizationalUnitId =
    typeof assignment.organizationalUnitId === 'string' && assignment.organizationalUnitId
      ? assignment.organizationalUnitId
      : undefined;

  if (targetType === 'USER' && !userId) {
    return null;
  }

  if (targetType === 'ORGANIZATIONAL_UNIT' && !organizationalUnitId) {
    return null;
  }

  return {
    id: typeof assignment.id === 'string' && assignment.id ? assignment.id : randomUUID(),
    targetType,
    mode,
    userId,
    organizationalUnitId,
    user: assignment.user,
    organizationalUnit: assignment.organizationalUnit
  };
}

function normalizeWorkflowStage(stage: WorkflowStage | Record<string, any>, index: number): WorkflowStage {
  const availableTabs = Array.isArray(stage.availableTabs) ? stage.availableTabs : ['resumo', 'comunicacao'];
  const primaryTab =
    typeof stage.primaryTab === 'string' && stage.primaryTab
      ? stage.primaryTab
      : availableTabs[0] || 'resumo';
  const requiredFormFieldIds = Array.isArray(stage.requiredFormFieldIds)
    ? stage.requiredFormFieldIds
    : Array.isArray((stage as any).requiredFormFields)
      ? (stage as any).requiredFormFields
      : [];

  const supportAssignments = Array.isArray(stage.supportAssignments)
    ? stage.supportAssignments
        .map(normalizeStageSupportAssignment)
        .filter((assignment): assignment is WorkflowStageSupportAssignment => Boolean(assignment))
    : [];

  return {
    ...(stage as WorkflowStage),
    id: typeof stage.id === 'string' && stage.id ? stage.id : randomUUID(),
    name: typeof stage.name === 'string' ? stage.name : '',
    description: typeof stage.description === 'string' && stage.description ? stage.description : undefined,
    order: typeof stage.order === 'number' && stage.order > 0 ? stage.order : index + 1,
    slaDays: typeof stage.slaDays === 'number' && stage.slaDays > 0 ? stage.slaDays : undefined,
    availableTabs,
    primaryTab,
    requiredDocumentTypes: Array.isArray(stage.requiredDocumentTypes) ? stage.requiredDocumentTypes : [],
    requiredFormFieldIds,
    allowedActions: Array.isArray(stage.allowedActions) ? stage.allowedActions : [],
    canSkip: Boolean(stage.canSkip),
    skipCondition:
      typeof stage.skipCondition === 'string' && stage.skipCondition ? stage.skipCondition : undefined,
    stageType: typeof stage.stageType === 'string' && stage.stageType ? stage.stageType : undefined,
    actionLabels: stage.actionLabels && typeof stage.actionLabels === 'object' ? stage.actionLabels : undefined,
    role: typeof stage.role === 'string' && stage.role ? stage.role : undefined,
    department: typeof stage.department === 'string' && stage.department ? stage.department : undefined,
    requiresApproval: Boolean(stage.requiresApproval),
    supportAssignments
  };
}

function sortWorkflowStages(stages: WorkflowStage[]) {
  return [...stages].sort((a, b) => a.order - b.order);
}

function getWorkflowStagesFromJson(stages: unknown): WorkflowStage[] {
  if (!Array.isArray(stages)) {
    return [];
  }

  return sortWorkflowStages(stages.map((stage, index) => normalizeWorkflowStage(stage, index)));
}

function buildSupportAssignmentCreateManyInput(
  workflowId: string,
  stages: WorkflowStage[]
): Prisma.WorkflowStageSupportAssignmentCreateManyInput[] {
  const seen = new Set<string>();
  const records: Prisma.WorkflowStageSupportAssignmentCreateManyInput[] = [];

  for (const stage of stages) {
    for (const assignment of stage.supportAssignments || []) {
      const normalizedAssignment = normalizeStageSupportAssignment(assignment);

      if (!normalizedAssignment) {
        continue;
      }

      const targetId =
        normalizedAssignment.targetType === 'USER'
          ? normalizedAssignment.userId
          : normalizedAssignment.organizationalUnitId;

      if (!targetId) {
        continue;
      }

      const key = [
        stage.id,
        normalizedAssignment.targetType,
        normalizedAssignment.mode,
        targetId
      ].join(':');

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      records.push({
        serviceWorkflowId: workflowId,
        workflowStageId: stage.id,
        targetType: normalizedAssignment.targetType as DbWorkflowStageSupportTargetType,
        mode: normalizedAssignment.mode as DbWorkflowStageSupportMode,
        userId: normalizedAssignment.targetType === 'USER' ? normalizedAssignment.userId : null,
        organizationalUnitId:
          normalizedAssignment.targetType === 'ORGANIZATIONAL_UNIT'
            ? normalizedAssignment.organizationalUnitId
            : null
      });
    }
  }

  return records;
}

function serializeSupportAssignmentRecord(
  assignment: WorkflowStageSupportRecord
): WorkflowStageSupportAssignment {
  return {
    id: assignment.id,
    targetType: assignment.targetType,
    mode: assignment.mode,
    userId: assignment.userId || undefined,
    organizationalUnitId: assignment.organizationalUnitId || undefined,
    user: assignment.user
      ? {
          id: assignment.user.id,
          name: assignment.user.name,
          email: assignment.user.email,
          departmentId: assignment.user.departmentId || undefined,
          departmentName: assignment.user.department?.name || undefined
        }
      : undefined,
    organizationalUnit: assignment.organizationalUnit
      ? {
          id: assignment.organizationalUnit.id,
          nome: assignment.organizationalUnit.nome,
          sigla: assignment.organizationalUnit.sigla || undefined,
          tipo: assignment.organizationalUnit.tipo,
          departmentId: assignment.organizationalUnit.departmentId,
          departmentName: assignment.organizationalUnit.department?.name || undefined
        }
      : undefined
  };
}

async function enrichWorkflowsWithSupportAssignments<T extends ServiceWorkflowWithRelations | ServiceWorkflowWithRelations[] | null>(
  workflowOrWorkflows: T
): Promise<T> {
  if (!workflowOrWorkflows) {
    return workflowOrWorkflows;
  }

  const workflows = Array.isArray(workflowOrWorkflows) ? workflowOrWorkflows : [workflowOrWorkflows];
  const workflowIds = workflows.map(workflow => workflow.id);

  const supportAssignments = workflowIds.length > 0
    ? await prisma.workflowStageSupportAssignment.findMany({
        where: {
          serviceWorkflowId: {
            in: workflowIds
          }
        },
        include: workflowStageSupportInclude,
        orderBy: [
          { workflowStageId: 'asc' },
          { createdAt: 'asc' }
        ]
      })
    : [];

  const assignmentsByStage = new Map<string, WorkflowStageSupportAssignment[]>();

  for (const assignment of supportAssignments) {
    const key = `${assignment.serviceWorkflowId}:${assignment.workflowStageId}`;
    const currentAssignments = assignmentsByStage.get(key) || [];
    currentAssignments.push(serializeSupportAssignmentRecord(assignment));
    assignmentsByStage.set(key, currentAssignments);
  }

  const enrichedWorkflows = workflows.map(workflow => {
    const stages = getWorkflowStagesFromJson(workflow.stages).map(stage => ({
      ...stage,
      supportAssignments: assignmentsByStage.get(`${workflow.id}:${stage.id}`) || []
    }));

    return {
      ...workflow,
      stages,
      supportAssignmentsCount: stages.reduce(
        (total, stage) => total + (stage.supportAssignments?.length || 0),
        0
      )
    };
  });

  return (Array.isArray(workflowOrWorkflows) ? enrichedWorkflows : enrichedWorkflows[0]) as T;
}

export function buildStageSupportAssignmentsSnapshot(stage: WorkflowStage) {
  return (stage.supportAssignments || []).map(assignment => ({
    id: assignment.id,
    targetType: assignment.targetType,
    mode: assignment.mode || 'REFERENCE_ONLY',
    userId: assignment.userId,
    userName: assignment.user?.name,
    userEmail: assignment.user?.email,
    userDepartmentId: assignment.user?.departmentId,
    userDepartmentName: assignment.user?.departmentName,
    organizationalUnitId: assignment.organizationalUnitId,
    organizationalUnitName: assignment.organizationalUnit?.nome,
    organizationalUnitSigla: assignment.organizationalUnit?.sigla,
    organizationalUnitType: assignment.organizationalUnit?.tipo,
    organizationalUnitDepartmentId: assignment.organizationalUnit?.departmentId,
    organizationalUnitDepartmentName: assignment.organizationalUnit?.departmentName
  }));
}

export function buildProtocolStageMetadataFromWorkflowStage(stage: WorkflowStage) {
  return {
    stageId: stage.id,
    description: stage.description,
    stageType: (stage as any).stageType,
    actionLabels: (stage as any).actionLabels,
    availableTabs: stage.availableTabs || ['resumo', 'comunicacao'],
    primaryTab: stage.primaryTab || 'resumo',
    requiredDocumentTypes: stage.requiredDocumentTypes || [],
    requiredFormFields: stage.requiredFormFieldIds || [],
    requiredFormFieldIds: stage.requiredFormFieldIds || [],
    allowedActions: stage.allowedActions || [],
    canSkip: stage.canSkip || false,
    skipCondition: stage.skipCondition,
    role: stage.role,
    department: stage.department,
    requiresApproval: stage.requiresApproval,
    stageSupportAssignments: buildStageSupportAssignmentsSnapshot(stage)
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Cria um novo workflow de serviço
 */
export async function createServiceWorkflow(data: CreateServiceWorkflowData) {
  // Validar que serviço existe
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: data.serviceId }
  });

  if (!service) {
    throw new Error(`Serviço não encontrado: ${data.serviceId}`);
  }

  // Verificar se já existe workflow para este serviço
  const existing = await prisma.serviceWorkflow.findUnique({
    where: { serviceId: data.serviceId }
  });

  if (existing) {
    throw new Error(`Serviço já possui workflow: ${service.name}`);
  }

  const stages = getWorkflowStagesFromJson(data.stages);
  const stagesForStorage = stages.map(({ supportAssignments, ...stage }) => stage);

  const workflow = await prisma.$transaction(async (tx) => {
    const createdWorkflow = await tx.serviceWorkflow.create({
      data: {
        serviceId: data.serviceId,
        name: data.name,
        description: data.description,
        stages: stagesForStorage as any,
        defaultSLA: data.defaultSLA,
        rules: data.rules
      },
      include: workflowInclude
    });

    const supportAssignments = buildSupportAssignmentCreateManyInput(createdWorkflow.id, stages);

    if (supportAssignments.length > 0) {
      await tx.workflowStageSupportAssignment.createMany({
        data: supportAssignments
      });
    }

    return createdWorkflow;
  });

  return await enrichWorkflowsWithSupportAssignments(workflow);
}

/**
 * Obtém workflow por ID do serviço
 */
export async function getWorkflowByServiceId(serviceId: string) {
  const workflow = await prisma.serviceWorkflow.findUnique({
    where: { serviceId },
    include: workflowInclude
  });

  return await enrichWorkflowsWithSupportAssignments(workflow);
}

/**
 * Obtém workflow por ID
 */
export async function getWorkflowById(id: string) {
  const workflow = await prisma.serviceWorkflow.findUnique({
    where: { id },
    include: workflowInclude
  });

  return await enrichWorkflowsWithSupportAssignments(workflow);
}

/**
 * Lista todos os workflows
 */
export async function getAllServiceWorkflows(filters?: {
  isActive?: boolean;
  departmentId?: string;
}) {
  const where: any = {};

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.departmentId) {
    where.service = {
      departmentId: filters.departmentId
    };
  }

  const workflows = await prisma.serviceWorkflow.findMany({
    where,
    include: workflowInclude,
    orderBy: { name: 'asc' }
  });

  return await enrichWorkflowsWithSupportAssignments(workflows);
}

/**
 * Atualiza um workflow
 */
export async function updateServiceWorkflow(
  serviceId: string,
  data: UpdateServiceWorkflowData
) {
  const updateData: any = {};
  let normalizedStages: WorkflowStage[] | undefined;

  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.defaultSLA !== undefined) updateData.defaultSLA = data.defaultSLA;
  if (data.rules !== undefined) updateData.rules = data.rules;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (data.stages) {
    normalizedStages = getWorkflowStagesFromJson(data.stages);
    updateData.stages = normalizedStages.map(({ supportAssignments, ...stage }) => stage);
  }

  const workflow = await prisma.$transaction(async (tx) => {
    const updatedWorkflow = await tx.serviceWorkflow.update({
      where: { serviceId },
      data: updateData,
      include: workflowInclude
    });

    if (normalizedStages) {
      await tx.workflowStageSupportAssignment.deleteMany({
        where: {
          serviceWorkflowId: updatedWorkflow.id
        }
      });

      const supportAssignments = buildSupportAssignmentCreateManyInput(updatedWorkflow.id, normalizedStages);

      if (supportAssignments.length > 0) {
        await tx.workflowStageSupportAssignment.createMany({
          data: supportAssignments
        });
      }
    }

    return updatedWorkflow;
  });

  return await enrichWorkflowsWithSupportAssignments(workflow);
}

/**
 * Deleta um workflow
 */
export async function deleteServiceWorkflow(serviceId: string) {
  return await prisma.serviceWorkflow.delete({
    where: { serviceId }
  });
}

/**
 * Deleta todos os workflows
 */
export async function deleteAllServiceWorkflows() {
  const result = await prisma.serviceWorkflow.deleteMany({});
  return result.count;
}

// ============================================================================
// APLICAÇÃO DE WORKFLOW A PROTOCOLOS
// ============================================================================

/**
 * Aplica workflow a um protocolo
 * Busca workflow pelo serviceId do protocolo
 */
export async function applyWorkflowToProtocol(protocolId: string) {
  // Buscar protocolo com serviço
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: { service: true }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // Buscar workflow do serviço
  const workflow = await getWorkflowByServiceId(protocol.serviceId);

  if (!workflow) {
    console.warn(`⚠️  Serviço "${protocol.service.name}" não possui workflow configurado`);
    console.log(`   → Protocolo ${protocol.number} criado SEM workflow`);
    return [];
  }

  if (!workflow.isActive) {
    console.warn(`⚠️  Workflow do serviço "${protocol.service.name}" está INATIVO`);
    return [];
  }

  const stages = sortWorkflowStages((workflow.stages || []) as unknown as WorkflowStage[]);

  // Verificar se já existem stages para este protocolo
  const existingStages = await prisma.protocolStage.findMany({
    where: { protocolId }
  });

  if (existingStages.length > 0) {
    console.warn(`⚠️  Protocolo ${protocol.number} já possui ${existingStages.length} stage(s)`);
    return existingStages;
  }

  // Criar todas as etapas do workflow
  const createdStages = await Promise.all(
    stages.map((stage) => {
      // ✅ PRIMEIRA ETAPA SEMPRE INICIA COMO IN_PROGRESS
      const isFirstStage = stage.order === 1;

      return prisma.protocolStage.create({
        data: {
          protocolId,
          stageName: stage.name,
          stageOrder: stage.order,
          status: isFirstStage ? 'IN_PROGRESS' : 'PENDING',
          startedAt: isFirstStage ? new Date() : undefined,
          dueDate: stage.slaDays
            ? new Date(Date.now() + stage.slaDays * 24 * 60 * 60 * 1000)
            : undefined,
          metadata: buildProtocolStageMetadataFromWorkflowStage(stage)
        }
      });
    })
  );

  // ✅ FASE 1: Atualizar protocolo para PROGRESSO e setar currentStageId
  const firstStage = createdStages.find(s => s.stageOrder === 1);
  if (firstStage) {
    await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        status: 'PROGRESSO', // Status muda automaticamente quando workflow inicia
        currentStageId: firstStage.id
      }
    });
    console.log(`✅ Protocolo ${protocol.number} → status PROGRESSO (stage: ${firstStage.stageName})`);
  }

  console.log(`✅ Workflow "${workflow.name}" aplicado ao protocolo ${protocol.number}`);
  console.log(`   → ${createdStages.length} etapa(s) criada(s)`);

  return createdStages;
}

/**
 * Valida se todas as condições de uma etapa foram atendidas
 */
export async function validateStageConditions(
  protocolId: string,
  stageOrder: number
): Promise<StageValidationResult> {
  const stage = await prisma.protocolStage.findFirst({
    where: {
      protocolId,
      stageOrder
    },
    include: {
      protocol: {
        include: {
          service: true
        }
      }
    }
  });

  if (!stage) {
    return {
      canProgress: false,
      blockers: ['Etapa não encontrada'],
      warnings: [],
      missingDocuments: [],
      missingFormFields: []
    };
  }

  const metadata = stage.metadata as any;
  const service = stage.protocol.service;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const missingDocuments: string[] = [];
  const missingFormFields: string[] = [];

  // ===== VALIDAR DOCUMENTOS =====
  const requiredDocTypes = metadata?.requiredDocumentTypes || [];

  if (requiredDocTypes.length > 0) {
    const documents = await prisma.protocolDocument.findMany({
      where: {
        protocolId,
        documentType: { in: requiredDocTypes }
      }
    });

    const approvedDocs = documents.filter(d => d.status === DocumentStatus.APPROVED);
    const approvedDocTypes = approvedDocs.map(d => d.documentType);

    const missingDocs = requiredDocTypes.filter(
      (docType: string) => !approvedDocTypes.includes(docType)
    );

    if (missingDocs.length > 0) {
      missingDocuments.push(...missingDocs);
      blockers.push(`Documentos pendentes: ${missingDocs.join(', ')}`);
    }
  }

  // ===== VALIDAR CAMPOS DO FORMULÁRIO (usando ProtocolDataField.status) =====
  const requiredFieldIds = metadata?.requiredFormFieldIds || [];

  if (requiredFieldIds.length > 0) {
    // ✅ CORREÇÃO: Buscar status dos ProtocolDataField ao invés de verificar customData
    const dataFields = await prisma.protocolDataField.findMany({
      where: {
        protocolId,
        fieldKey: { in: requiredFieldIds }
      }
    });

    // Campos aprovados
    const approvedFields = dataFields.filter(f => f.status === 'APPROVED');
    const approvedFieldKeys = approvedFields.map(f => f.fieldKey);

    // Campos pendentes (não aprovados ou rejeitados)
    const pendingOrRejectedFields = dataFields.filter(f => f.status !== 'APPROVED');

    // Campos que não existem no ProtocolDataField (ainda não enviados)
    const missingFields = requiredFieldIds.filter(
      (fieldId: string) => !dataFields.find(f => f.fieldKey === fieldId)
    );

    // Se há campos não aprovados
    const unapprovedFieldIds = [
      ...pendingOrRejectedFields.map(f => f.fieldKey),
      ...missingFields
    ];

    if (unapprovedFieldIds.length > 0) {
      // Buscar labels do formSchema para exibição amigável
      let formSchemaRaw = service?.formSchema as any;
      if (typeof formSchemaRaw === 'string') {
        try {
          formSchemaRaw = JSON.parse(formSchemaRaw);
        } catch (e) {
          formSchemaRaw = null;
        }
      }

      const fieldLabels = unapprovedFieldIds.map((fieldId: string) => {
        const field = formSchemaRaw?.properties?.[fieldId];
        return field?.title || fieldId;
      });

      missingFormFields.push(...fieldLabels);
      blockers.push(`Campos não aprovados: ${fieldLabels.join(', ')}`);
    }
  }

  // ===== VALIDAR PENDÊNCIAS BLOQUEANTES =====
  const blockingPendings = await prisma.protocolPending.count({
    where: {
      protocolId,
      blocksProgress: true,
      status: { in: ['OPEN', 'IN_PROGRESS'] }
    }
  });

  if (blockingPendings > 0) {
    blockers.push(`Existem ${blockingPendings} pendência(s) bloqueante(s) ativa(s)`);
  }

  return {
    canProgress: blockers.length === 0,
    blockers,
    warnings,
    missingDocuments,
    missingFormFields
  };
}

// ============================================================================
// ESTATÍSTICAS E RELATÓRIOS
// ============================================================================

/**
 * Obtém estatísticas de workflows
 */
export async function getWorkflowStats() {
  const workflows = await getAllServiceWorkflows({ isActive: true });

  // Contar protocolos com workflow aplicado
  const protocolsWithWorkflow = await prisma.protocolSimplified.count({
    where: {
      stages: {
        some: {}
      }
    }
  });

  // Contar stages ativas
  const activeStages = await prisma.protocolStage.count({
    where: {
      status: 'IN_PROGRESS'
    }
  });

  // Serviços sem workflow
  const servicesWithoutWorkflow = await prisma.serviceSimplified.count({
    where: {
      isActive: true,
      workflow: null
    }
  });

  const stageSupportAssignments = await prisma.workflowStageSupportAssignment.count();
  const workflowsWithStageSupport = workflows.filter(
    (workflow: any) => (workflow.supportAssignmentsCount || 0) > 0
  ).length;

  return {
    totalWorkflows: workflows.length,
    protocolsWithWorkflow,
    activeStages,
    servicesWithoutWorkflow,
    stageSupportAssignments,
    workflowsWithStageSupport,
    workflows: workflows.map((w) => ({
      serviceId: w.serviceId,
      serviceName: w.service.name,
      workflowName: w.name,
      stagesCount: Array.isArray(w.stages) ? w.stages.length : 0,
      defaultSLA: w.defaultSLA,
      isActive: w.isActive,
      supportAssignmentsCount: (w as any).supportAssignmentsCount || 0
    }))
  };
}

/**
 * Obtém informações do serviço para criar workflow
 */
export async function getServiceForWorkflow(serviceId: string) {
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
    include: {
      department: true
    }
  });

  if (!service) {
    return null;
  }

  // Extrair documentos
  const requiredDocuments = Array.isArray(service.requiredDocuments)
    ? (service.requiredDocuments as any[]).map(doc => ({
        type: typeof doc === 'string' ? doc : doc.type,
        name: typeof doc === 'string' ? doc : (doc.name || doc.type),
        required: typeof doc === 'object' ? doc.required !== false : true
      }))
    : [];

  // Extrair campos do formulário
  const formFieldsConfig = service.formFieldsConfig as any;
  const formFields = Array.isArray(formFieldsConfig)
    ? formFieldsConfig.map(field => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: field.required || false
      }))
    : [];

  return {
    id: service.id,
    name: service.name,
    description: service.description,
    departmentId: service.departmentId,
    departmentName: service.department.name,
    serviceType: service.serviceType,
    moduleType: service.moduleType,
    estimatedDays: service.estimatedDays,
    requiredDocuments,
    formFields
  };
}
