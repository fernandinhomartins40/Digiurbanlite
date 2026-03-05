/**
 * ============================================================================
 * MODULE WORKFLOW SERVICE - LEGADO (COMPATIBILIDADE)
 * ============================================================================
 *
 * ⚠️ DEPRECADO: Este serviço está sendo gradualmente substituído por service-workflow.service.ts
 * Mantido temporariamente para compatibilidade com código legado
 *
 * NOVO: Use service-workflow.service.ts para workflows por serviço
 */

import { prisma } from '../lib/prisma';
import type { CreateWorkflowData, UpdateWorkflowData, WorkflowStage, StageValidationResult } from '../types/workflow.types';
import { DocumentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { generateWorkflowFromService } from './workflow-template.service';
import * as ServiceWorkflowService from './service-workflow.service';

/**
 * Cria um novo workflow de módulo
 */
export async function createWorkflow(data: CreateWorkflowData) {
  // Adicionar IDs únicos às stages
  const stagesWithIds: WorkflowStage[] = data.stages.map((stage, index) => ({
    ...stage,
    id: randomUUID(),
    order: stage.order || index + 1
  }));

  // Ordenar stages
  const sortedStages = [...stagesWithIds].sort((a, b) => a.order - b.order);

  return await prisma.moduleWorkflow.create({
    data: {
      moduleType: data.moduleType,
      name: data.name,
      description: data.description,
      stages: sortedStages as any,
      defaultSLA: data.defaultSLA,
      rules: data.rules
    }
  });
}

/**
 * Obtém um workflow por tipo de módulo
 */
export async function getWorkflowByModuleType(moduleType: string) {
  return await prisma.moduleWorkflow.findUnique({
    where: { moduleType }
  });
}

/**
 * Lista todos os workflows
 */
export async function getAllWorkflows() {
  return await prisma.moduleWorkflow.findMany({
    orderBy: { name: 'asc' }
  });
}

/**
 * Atualiza um workflow
 */
export async function updateWorkflow(
  moduleType: string,
  data: UpdateWorkflowData
) {
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.defaultSLA !== undefined) updateData.defaultSLA = data.defaultSLA;
  if (data.rules !== undefined) updateData.rules = data.rules;

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

  return await prisma.moduleWorkflow.update({
    where: { moduleType },
    data: updateData
  });
}

/**
 * Deleta um workflow
 */
export async function deleteWorkflow(moduleType: string) {
  return await prisma.moduleWorkflow.delete({
    where: { moduleType }
  });
}

/**
 * Aplica workflow a um protocolo (cria as etapas)
 *
 * ✅ SIMPLIFICADO: Usa APENAS ServiceWorkflow (sem fallbacks complexos)
 * @deprecated Use ServiceWorkflowService.applyWorkflowToProtocol() diretamente
 */
export async function applyWorkflowToProtocol(
  protocolId: string,
  moduleType?: string
) {
  // ✅ RADICAL: Delegar 100% para ServiceWorkflow
  console.log(`🔄 Aplicando ServiceWorkflow ao protocolo ${protocolId}...`);
  const stages = await ServiceWorkflowService.applyWorkflowToProtocol(protocolId);

  if (!stages || stages.length === 0) {
    console.error(`❌ ServiceWorkflow não retornou stages para protocolo ${protocolId}`);
    return [];
  }

  console.log(`✅ ServiceWorkflow aplicado: ${stages.length} etapa(s) criada(s)`);
  return stages;
}

/**
 * Valida se todas as condições de uma etapa foram atendidas
 * ✅ ALINHADO COM SERVIÇOS
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

    // Documentos faltantes ou não aprovados
    const missingDocs = requiredDocTypes.filter(
      (docType: string) => !approvedDocTypes.includes(docType)
    );

    if (missingDocs.length > 0) {
      missingDocuments.push(...missingDocs);
      blockers.push(`Documentos pendentes: ${missingDocs.join(', ')}`);
    }
  }

  // ===== VALIDAR CAMPOS DO FORMULÁRIO =====
  const requiredFieldIds = metadata?.requiredInputFieldIds || [];

  if (requiredFieldIds.length > 0 && stage.protocol.customData) {
    const customData = stage.protocol.customData as any;

    // Verificar quais campos obrigatórios não foram preenchidos
    const missingFields = requiredFieldIds.filter((fieldId: string) => {
      const value = customData[fieldId];
      return value === null || value === undefined || value === '';
    });

    if (missingFields.length > 0) {
      // Buscar labels dos campos no formSchema do serviço
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

/**
 * Obtém estatísticas de workflows
 */
export async function getWorkflowStats() {
  const workflows = await getAllWorkflows();

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

  return {
    totalWorkflows: workflows.length,
    protocolsWithWorkflow,
    activeStages,
    workflows: workflows.map((w) => ({
      moduleType: w.moduleType,
      name: w.name,
      stagesCount: Array.isArray(w.stages) ? w.stages.length : 0,
      defaultSLA: w.defaultSLA
    }))
  };
}

/**
 * Busca serviço para criar workflow
 */
export async function getServiceForWorkflow(moduleType: string) {
  const service = await prisma.serviceSimplified.findUnique({
    where: { moduleType }
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
    moduleType: service.moduleType!,
    name: service.name,
    description: service.description,
    estimatedDays: service.estimatedDays,
    requiredDocuments,
    formFields
  };
}

/**
 * ✅ NOVA: Cria workflows padrão ALINHADOS com os serviços existentes
 */
export async function createDefaultWorkflows() {
  console.log('🔄 Criando workflows padrão alinhados com serviços...');

  const services = await prisma.serviceSimplified.findMany({
    where: {
      isActive: true,
      moduleType: { not: null }
    }
  });

  const created: any[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const service of services) {
    try {
      if (!service.moduleType) {
        skipped.push(`${service.name} (sem moduleType)`);
        continue;
      }

      // Verificar se já existe workflow
      const existing = await getWorkflowByModuleType(service.moduleType);
      if (existing) {
        skipped.push(`${service.name} (já existe)`);
        continue;
      }

      // Gerar workflow ALINHADO com o serviço
      const workflowData = generateWorkflowFromService(service);

      // Criar workflow
      const workflow = await createWorkflow(workflowData);

      created.push({
        moduleType: workflow.moduleType,
        name: workflow.name,
        stagesCount: (workflow.stages as any[]).length
      });

      console.log(`✅ ${workflow.name} - ${(workflow.stages as any[]).length} etapas`);
    } catch (error) {
      const errorMsg = `${service.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ Criados: ${created.length}`);
  console.log(`   ⏭️ Ignorados: ${skipped.length}`);
  console.log(`   ❌ Erros: ${errors.length}`);

  return created;
}
