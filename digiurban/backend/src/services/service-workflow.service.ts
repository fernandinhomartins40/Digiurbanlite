/**
 * ============================================================================
 * SERVICE WORKFLOW SERVICE - NOVO MODELO
 * ============================================================================
 *
 * Gerenciamento de Workflows por Serviço (não por ModuleType)
 * Permite que TODOS os serviços tenham workflow customizado
 */

import { prisma } from '../lib/prisma';
import type { WorkflowStage, StageValidationResult } from '../types/workflow.types';
import { DocumentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateServiceWorkflowData {
  serviceId: string;
  name: string;
  description?: string;
  stages: Omit<WorkflowStage, 'id'>[];
  defaultSLA?: number;
  rules?: any;
}

export interface UpdateServiceWorkflowData {
  name?: string;
  description?: string;
  stages?: Omit<WorkflowStage, 'id'>[];
  defaultSLA?: number;
  rules?: any;
  isActive?: boolean;
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

  // Adicionar IDs únicos às stages
  const stagesWithIds: WorkflowStage[] = data.stages.map((stage, index) => ({
    ...stage,
    id: randomUUID(),
    order: stage.order || index + 1
  }));

  // Ordenar stages
  const sortedStages = [...stagesWithIds].sort((a, b) => a.order - b.order);

  return await prisma.serviceWorkflow.create({
    data: {
      serviceId: data.serviceId,
      name: data.name,
      description: data.description,
      stages: sortedStages as any,
      defaultSLA: data.defaultSLA,
      rules: data.rules
    },
    include: {
      service: true
    }
  });
}

/**
 * Obtém workflow por ID do serviço
 */
export async function getWorkflowByServiceId(serviceId: string) {
  return await prisma.serviceWorkflow.findUnique({
    where: { serviceId },
    include: {
      service: true
    }
  });
}

/**
 * Obtém workflow por ID
 */
export async function getWorkflowById(id: string) {
  return await prisma.serviceWorkflow.findUnique({
    where: { id },
    include: {
      service: true
    }
  });
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

  return await prisma.serviceWorkflow.findMany({
    where,
    include: {
      service: {
        include: {
          department: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

/**
 * Atualiza um workflow
 */
export async function updateServiceWorkflow(
  serviceId: string,
  data: UpdateServiceWorkflowData
) {
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.defaultSLA !== undefined) updateData.defaultSLA = data.defaultSLA;
  if (data.rules !== undefined) updateData.rules = data.rules;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (data.stages) {
    // Adicionar IDs se não existirem
    const stagesWithIds: WorkflowStage[] = data.stages.map((stage, index) => ({
      ...stage,
      id: (stage as any).id || randomUUID(),
      order: stage.order || index + 1
    }));

    const sortedStages = [...stagesWithIds].sort((a, b) => a.order - b.order);
    updateData.stages = sortedStages;
  }

  return await prisma.serviceWorkflow.update({
    where: { serviceId },
    data: updateData,
    include: {
      service: true
    }
  });
}

/**
 * Deleta um workflow
 */
export async function deleteServiceWorkflow(serviceId: string) {
  return await prisma.serviceWorkflow.delete({
    where: { serviceId }
  });
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

  const stages = workflow.stages as any as WorkflowStage[];

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
          metadata: {
            stageId: stage.id,
            description: stage.description,

            // ✅ METADADOS DE UI - Definem estrutura da página
            availableTabs: stage.availableTabs || ['resumo', 'comunicacao'],
            primaryTab: stage.primaryTab || 'resumo',

            // Requisitos
            requiredDocumentTypes: stage.requiredDocumentTypes || [],
            requiredFormFields: stage.requiredFormFields || [],
            requiredFormFieldIds: stage.requiredFormFieldIds || [],

            // Ações e regras
            allowedActions: stage.allowedActions || [],
            canSkip: stage.canSkip || false,
            skipCondition: stage.skipCondition,
            role: stage.role,
            department: stage.department,
            requiresApproval: stage.requiresApproval
          }
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

  // ===== VALIDAR CAMPOS DO FORMULÁRIO =====
  const requiredFieldIds = metadata?.requiredFormFieldIds || [];

  if (requiredFieldIds.length > 0 && stage.protocol.customData) {
    const customData = stage.protocol.customData as any;

    const missingFields = requiredFieldIds.filter((fieldId: string) => {
      const value = customData[fieldId];
      return value === null || value === undefined || value === '';
    });

    if (missingFields.length > 0) {
      let formSchemaRaw = service?.formSchema as any;
      if (typeof formSchemaRaw === 'string') {
        try {
          formSchemaRaw = JSON.parse(formSchemaRaw);
        } catch (e) {
          formSchemaRaw = null;
        }
      }

      const missingFieldLabels = missingFields.map((fieldId: string) => {
        const field = formSchemaRaw?.properties?.[fieldId];
        return field?.title || fieldId;
      });

      missingFormFields.push(...missingFieldLabels);
      blockers.push(`Campos obrigatórios não preenchidos: ${missingFieldLabels.join(', ')}`);
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

  return {
    totalWorkflows: workflows.length,
    protocolsWithWorkflow,
    activeStages,
    servicesWithoutWorkflow,
    workflows: workflows.map((w) => ({
      serviceId: w.serviceId,
      serviceName: w.service.name,
      workflowName: w.name,
      stagesCount: Array.isArray(w.stages) ? w.stages.length : 0,
      defaultSLA: w.defaultSLA,
      isActive: w.isActive
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
