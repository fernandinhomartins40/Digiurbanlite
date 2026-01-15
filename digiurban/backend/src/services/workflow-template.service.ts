/**
 * ============================================================================
 * WORKFLOW TEMPLATE SERVICE - ATUALIZADO
 * ============================================================================
 *
 * Gera workflows ALINHADOS com serviços:
 * - Usa referências aos documentos do serviço
 * - Usa referências aos campos do formulário
 * - Não duplica dados
 */

import type { CreateWorkflowData, WorkflowStage } from '../types/workflow.types';
import type { ServiceSimplified } from '@prisma/client';

export interface GenerateWorkflowFromServiceInput {
  moduleType: string;
  serviceName: string;
  serviceDescription?: string | null;
  estimatedDays?: number | null;
  departmentName?: string;

  // ✅ NOVO: Documentos e campos do serviço
  requiredDocuments: Array<{ type: string; name: string }>;
  formFields: Array<{ id: string; label: string; required: boolean }>;
}

/**
 * Gera workflow padrão ALINHADO com o serviço
 */
export function generateDefaultWorkflow(
  input: GenerateWorkflowFromServiceInput
): CreateWorkflowData {
  const {
    moduleType,
    serviceName,
    serviceDescription,
    estimatedDays,
    departmentName,
    requiredDocuments,
    formFields
  } = input;

  // Calcular SLA total
  const totalSLA = estimatedDays || 10;

  // Distribuir SLA entre etapas
  const analysisTime = Math.ceil(totalSLA * 0.4);  // 40% análise
  const reviewTime = Math.ceil(totalSLA * 0.3);    // 30% revisão
  const approvalTime = Math.ceil(totalSLA * 0.3);  // 30% aprovação

  // Separar documentos por categoria
  const identityDocs = requiredDocuments.filter(d =>
    d.type.includes('RG') || d.type.includes('CPF') || d.type.includes('IDENTIDADE')
  ).map(d => d.type);

  const addressDocs = requiredDocuments.filter(d =>
    d.type.includes('RESIDENCIA') || d.type.includes('ENDERECO')
  ).map(d => d.type);

  const otherDocs = requiredDocuments.filter(d =>
    !identityDocs.includes(d.type) && !addressDocs.includes(d.type)
  ).map(d => d.type);

  // IDs de campos obrigatórios do formulário
  const requiredFieldIds = formFields.filter(f => f.required).map(f => f.id);
  const allFieldIds = formFields.map(f => f.id);

  // ✅ REMOVIDA ETAPA "NOVO" - Protocolo já nasce novo!
  const stages: Omit<WorkflowStage, 'id'>[] = [
    {
      name: 'Recepcao',
      description: 'Recebimento e inicio do protocolo',
      order: 1,
      slaDays: 1,
      requiredDocumentTypes: [],
      requiredFormFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false,
      requiresApproval: true,
      stageType: 'RECEPTION',
      actionLabels: { APPROVE: 'Iniciar/Aceitar protocolo' }
    },
    {
      name: 'Análise Documental',
      description: 'Verificação de documentos de identificação e comprovação',
      order: 1,
      slaDays: analysisTime,
      requiredDocumentTypes: [...identityDocs, ...addressDocs], // Docs de identidade
      requiredFormFieldIds: requiredFieldIds, // Campos obrigatórios do form
      allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING'],
      canSkip: false,
      requiresApproval: true
    }
  ];

  // Adicionar etapa intermediária se houver documentos específicos
  if (otherDocs.length > 0) {
    stages.push({
      name: 'Análise Técnica',
      description: 'Verificação de documentação específica e técnica',
      order: 2,
      slaDays: reviewTime,
      requiredDocumentTypes: otherDocs,    // Documentos específicos
      requiredFormFieldIds: allFieldIds,   // Todos os campos preenchidos
      allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING', 'REQUEST_INFO'],
      canSkip: false,
      requiresApproval: true
    });

    stages.push({
      name: 'Aprovação Final',
      description: 'Aprovação final e conclusão do processo',
      order: 3,
      slaDays: approvalTime,
      requiredDocumentTypes: requiredDocuments.map(d => d.type), // TODOS os docs
      requiredFormFieldIds: allFieldIds,   // TODOS os campos
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false,
      requiresApproval: true
    });

    stages.push({
      name: 'Conclusao',
      description: 'Finalizacao do protocolo',
      order: 4,
      slaDays: 1,
      requiredDocumentTypes: [],
      requiredFormFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false,
      requiresApproval: false,
      stageType: 'CONCLUSION',
      actionLabels: { APPROVE: 'Concluir protocolo' }
    });
  } else {
    // Workflow simples (sem docs técnicos)
    stages.push({
      name: 'Aprovação',
      description: 'Aprovação e conclusão do processo',
      order: 2,
      slaDays: approvalTime,
      requiredDocumentTypes: requiredDocuments.map(d => d.type),
      requiredFormFieldIds: allFieldIds,
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false,
      requiresApproval: true
    });

    stages.push({
      name: 'Conclusao',
      description: 'Finalizacao do protocolo',
      order: 3,
      slaDays: 1,
      requiredDocumentTypes: [],
      requiredFormFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false,
      requiresApproval: false,
      stageType: 'CONCLUSION',
      actionLabels: { APPROVE: 'Concluir protocolo' }
    });
  }

  stages.forEach((stage, index) => {
    stage.order = index + 1;
  });

  return {
    moduleType,
    name: serviceName,
    description: serviceDescription || `Workflow automático para ${serviceName}`,
    defaultSLA: totalSLA,
    stages,
    rules: {
      autoGenerated: true,
      generatedAt: new Date().toISOString(),
      source: 'service_creation',
      department: departmentName,
      version: '2.0',  // Nova versão alinhada
      alignment: 'SERVICE_BASED'  // Baseado no serviço
    }
  };
}

/**
 * Gera workflow a partir de um ServiceSimplified completo
 */
export function generateWorkflowFromService(service: ServiceSimplified): CreateWorkflowData {
  // Extrair documentos - fazer parse se for string JSON
  let docsRaw = service.requiredDocuments;
  if (typeof docsRaw === 'string') {
    try {
      docsRaw = JSON.parse(docsRaw);
    } catch (e) {
      console.error(`[WORKFLOW ERROR] Failed to parse requiredDocuments for ${service.name}:`, e);
      docsRaw = [];
    }
  }

  const requiredDocuments = Array.isArray(docsRaw)
    ? (docsRaw as any[]).map(doc => ({
        type: typeof doc === 'string' ? doc : doc.type,
        name: typeof doc === 'string' ? doc : doc.name
      }))
    : [];

  // Extrair campos do formulário do formSchema - fazer parse se for string JSON
  let formSchemaRaw = service.formSchema as any;
  if (typeof formSchemaRaw === 'string') {
    try {
      formSchemaRaw = JSON.parse(formSchemaRaw);
    } catch (e) {
      console.error(`[WORKFLOW ERROR] Failed to parse formSchema for ${service.name}:`, e);
      formSchemaRaw = null;
    }
  }

  const formFields: Array<{ id: string; label: string; required: boolean }> = [];

  if (formSchemaRaw && formSchemaRaw.properties) {
    const requiredFields = formSchemaRaw.required || [];

    Object.keys(formSchemaRaw.properties).forEach(fieldId => {
      const field = formSchemaRaw.properties[fieldId];
      formFields.push({
        id: fieldId,
        label: field.title || fieldId,
        required: requiredFields.includes(fieldId)
      });
    });
  }

  return generateDefaultWorkflow({
    moduleType: service.moduleType!,
    serviceName: service.name,
    serviceDescription: service.description,
    estimatedDays: service.estimatedDays,
    requiredDocuments,
    formFields
  });
}

/**
 * Valida se workflow gerado está correto
 */
export function validateGeneratedWorkflow(workflow: CreateWorkflowData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Verificar campos obrigatórios
  if (!workflow.moduleType) {
    errors.push('moduleType é obrigatório');
  }

  if (!workflow.name) {
    errors.push('name é obrigatório');
  }

  if (!workflow.stages || workflow.stages.length === 0) {
    errors.push('Workflow precisa ter pelo menos uma etapa');
  }

  // Verificar se tem pelo menos 3 etapas
  if (workflow.stages && workflow.stages.length < 3) {
    errors.push('Workflow precisa ter pelo menos 3 etapas');
  }

  // Verificar ordenação das etapas
  if (workflow.stages) {
    const orders = workflow.stages.map(s => s.order);
    const sortedOrders = [...orders].sort((a, b) => a - b);

    if (JSON.stringify(orders) !== JSON.stringify(sortedOrders)) {
      errors.push('Etapas não estão ordenadas corretamente');
    }

    // Verificar se não há ordens duplicadas
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      errors.push('Existem etapas com order duplicado');
    }

    // Verificar se todas as etapas têm nome
    workflow.stages.forEach((stage, index) => {
      if (!stage.name) {
        errors.push(`Etapa ${index + 1} não tem nome`);
      }
      if (!stage.allowedActions || stage.allowedActions.length === 0) {
        errors.push(`Etapa "${stage.name}" não tem ações permitidas`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}













