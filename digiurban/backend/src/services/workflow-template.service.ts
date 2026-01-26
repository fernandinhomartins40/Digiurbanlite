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

/**
 * ============================================================================
 * PILAR 1: WORKFLOW MINIMALISTA PARA SERVIÇOS SEM_DADOS
 * ============================================================================
 */

/**
 * Gera workflow minimalista para serviços SEM_DADOS
 * Fluxo: Recepção → Atendimento → Conclusão
 */
export function generateMinimalWorkflowForSemDados(
  serviceName: string,
  serviceDescription: string | null | undefined,
  estimatedDays: number | null | undefined
): CreateWorkflowData {
  const totalSLA = estimatedDays || 7;
  const atendimentoSLA = Math.max(1, totalSLA - 2); // Reserva 1 dia para recepção e 1 para conclusão

  const stages: Omit<WorkflowStage, 'id'>[] = [
    {
      name: 'Recepção',
      description: 'Registro da solicitação',
      order: 1,
      slaDays: 1,
      requiredDocumentTypes: [],
      requiredFormFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false,
      requiresApproval: true,
      stageType: 'RECEPTION',
      actionLabels: { APPROVE: 'Iniciar atendimento' },
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo'
    },
    {
      name: 'Atendimento',
      description: 'Processamento da solicitação',
      order: 2,
      slaDays: atendimentoSLA,
      requiredDocumentTypes: [],
      requiredFormFieldIds: [],
      allowedActions: ['APPROVE', 'CREATE_PENDING', 'REJECT'],
      canSkip: false,
      requiresApproval: true,
      actionLabels: {
        APPROVE: 'Aprovar e avançar',
        CREATE_PENDING: 'Solicitar informações',
        REJECT: 'Rejeitar solicitação'
      },
      availableTabs: ['resumo', 'pendencias', 'comunicacao'],
      primaryTab: 'resumo'
    },
    {
      name: 'Conclusão',
      description: 'Finalização do atendimento',
      order: 3,
      slaDays: 1,
      requiredDocumentTypes: [],
      requiredFormFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false,
      requiresApproval: false,
      stageType: 'CONCLUSION',
      actionLabels: { APPROVE: 'Concluir protocolo' },
      availableTabs: ['resumo-final', 'comunicacao'],
      primaryTab: 'resumo-final'
    }
  ];

  return {
    moduleType: `WORKFLOW_PLACEHOLDER`, // Será substituído por moduleType único
    name: `Workflow - ${serviceName}`,
    description: serviceDescription || `Fluxo simplificado para ${serviceName}`,
    defaultSLA: totalSLA,
    stages,
    rules: {
      autoGenerated: true,
      generatedAt: new Date().toISOString(),
      source: 'service_creation_sem_dados',
      version: '2.0',
      alignment: 'SEM_DADOS_MINIMAL'
    }
  };
}

/**
 * ============================================================================
 * PILAR 2: ANÁLISE INTELIGENTE DE SERVIÇOS
 * ============================================================================
 */

export interface ServiceAnalysis {
  hasIdentityDocuments: boolean;      // RG, CPF, Certidão
  hasAddressDocuments: boolean;       // Comprovante Residência
  hasSpecificDocuments: boolean;      // Laudos, Exames, etc
  hasComplexFields: boolean;          // > 10 campos ou dependências
  hasMedicalContext: boolean;         // Serviço de saúde
  hasFinancialContext: boolean;       // Renda, valores
  requiresScheduling: boolean;        // Data/hora de atendimento
  requiresApproval: boolean;          // Aprovação de superior
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  documentCount: number;
  fieldCount: number;
  requiredFieldCount: number;
}

/**
 * Analisa um serviço para determinar complexidade e características
 */
export function analyzeService(input: {
  departmentCode?: string;
  requiredDocuments: Array<{ type: string; name: string }>;
  formFields: Array<{ id: string; label: string; required: boolean }>;
  priority?: number;
}): ServiceAnalysis {
  const { departmentCode, requiredDocuments, formFields, priority } = input;

  const fieldCount = formFields.length;
  const requiredFieldCount = formFields.filter(f => f.required).length;
  const documentCount = requiredDocuments.length;

  // Análise de documentos
  const hasIdentityDocuments = requiredDocuments.some(d =>
    d.type.toUpperCase().includes('RG') ||
    d.type.toUpperCase().includes('CPF') ||
    d.type.toUpperCase().includes('CERTIDAO') ||
    d.type.toUpperCase().includes('IDENTIDADE')
  );

  const hasAddressDocuments = requiredDocuments.some(d =>
    d.type.toUpperCase().includes('COMPROVANTE') &&
    (d.type.toUpperCase().includes('RESIDENCIA') || d.type.toUpperCase().includes('ENDERECO'))
  );

  const hasSpecificDocuments = requiredDocuments.filter(d => {
    const type = d.type.toUpperCase();
    return !type.includes('RG') &&
           !type.includes('CPF') &&
           !type.includes('IDENTIDADE') &&
           !(type.includes('COMPROVANTE') && type.includes('RESIDENCIA'));
  }).length > 0;

  // Análise de campos
  const hasComplexFields = fieldCount > 10 || formFields.some(f =>
    f.id.includes('dependenc') || f.id.includes('condicional')
  );

  const hasMedicalContext = departmentCode === 'SAUDE' ||
    formFields.some(f =>
      f.id.includes('medic') || f.id.includes('saude') || f.id.includes('doenca')
    );

  const hasFinancialContext = formFields.some(f =>
    f.id.includes('renda') || f.id.includes('valor') || f.id.includes('salario')
  );

  const requiresScheduling = formFields.some(f =>
    f.id.includes('data') || f.id.includes('horario') || f.id.includes('agendamento')
  );

  const requiresApproval = (priority && priority >= 4) ||
    hasMedicalContext ||
    hasFinancialContext ||
    documentCount > 5;

  // Determinar complexidade
  let estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  if (fieldCount > 15 || documentCount > 5 || hasComplexFields) {
    estimatedComplexity = 'HIGH';
  } else if (fieldCount > 8 || documentCount > 3 || hasSpecificDocuments) {
    estimatedComplexity = 'MEDIUM';
  } else {
    estimatedComplexity = 'LOW';
  }

  return {
    hasIdentityDocuments,
    hasAddressDocuments,
    hasSpecificDocuments,
    hasComplexFields,
    hasMedicalContext,
    hasFinancialContext,
    requiresScheduling,
    requiresApproval,
    estimatedComplexity,
    documentCount,
    fieldCount,
    requiredFieldCount
  };
}

/**
 * ============================================================================
 * PILAR 2: GERAÇÃO INTELIGENTE DE WORKFLOWS ESPECIALIZADOS
 * ============================================================================
 */

/**
 * Gera workflow especializado baseado na análise do serviço
 */
export function generateSpecializedWorkflow(input: {
  moduleType: string;
  serviceName: string;
  serviceDescription?: string | null;
  estimatedDays?: number | null;
  departmentCode?: string;
  departmentName?: string;
  priority?: number;
  requiredDocuments: Array<{ type: string; name: string }>;
  formFields: Array<{ id: string; label: string; required: boolean }>;
}): CreateWorkflowData {
  const {
    moduleType,
    serviceName,
    serviceDescription,
    estimatedDays,
    departmentCode,
    departmentName,
    priority,
    requiredDocuments,
    formFields
  } = input;

  // Análise inteligente
  const analysis = analyzeService({
    departmentCode,
    requiredDocuments,
    formFields,
    priority
  });

  console.log(`[WORKFLOW] Gerando workflow especializado para ${serviceName}:`, analysis);

  const totalSLA = estimatedDays || 10;
  const stages: Omit<WorkflowStage, 'id'>[] = [];
  let currentOrder = 1;
  let remainingSLA = totalSLA;

  // Separar documentos por categoria
  const identityDocs = requiredDocuments
    .filter(d => {
      const type = d.type.toUpperCase();
      return type.includes('RG') || type.includes('CPF') || type.includes('IDENTIDADE') || type.includes('CERTIDAO');
    })
    .map(d => d.type);

  const addressDocs = requiredDocuments
    .filter(d => {
      const type = d.type.toUpperCase();
      return type.includes('COMPROVANTE') && (type.includes('RESIDENCIA') || type.includes('ENDERECO'));
    })
    .map(d => d.type);

  const specificDocs = requiredDocuments
    .filter(d => !identityDocs.includes(d.type) && !addressDocs.includes(d.type))
    .map(d => d.type);

  const requiredFieldIds = formFields.filter(f => f.required).map(f => f.id);
  const allFieldIds = formFields.map(f => f.id);

  // ======== STAGE 1: RECEPÇÃO (SEMPRE) ========
  stages.push({
    name: 'Recepção',
    description: 'Registro e validação inicial da solicitação',
    order: currentOrder++,
    slaDays: 1,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false,
    requiresApproval: true,
    stageType: 'RECEPTION',
    actionLabels: { APPROVE: 'Iniciar protocolo' },
    availableTabs: ['resumo', 'comunicacao'],
    primaryTab: 'resumo'
  });
  remainingSLA -= 1;

  // ======== STAGE 2: ANÁLISE DOCUMENTAL (se houver docs de identidade/endereço) ========
  if (analysis.hasIdentityDocuments || analysis.hasAddressDocuments) {
    const docSLA = Math.ceil(remainingSLA * 0.2);
    stages.push({
      name: 'Análise Documental',
      description: 'Verificação de documentos de identificação e comprovantes',
      order: currentOrder++,
      slaDays: docSLA,
      requiredDocumentTypes: [...identityDocs, ...addressDocs],
      requiredFormFieldIds: [], // Não valida dados aqui, só documentos
      allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING'],
      canSkip: false,
      requiresApproval: true,
      actionLabels: {
        APPROVE: 'Aprovar documentos',
        REJECT: 'Rejeitar por documentação',
        CREATE_PENDING: 'Solicitar correção de documentos'
      },
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos'
    });
    remainingSLA -= docSLA;
  }

  // ======== STAGE 3: ANÁLISE DE DADOS (se houver campos do formulário) ========
  if (formFields.length > 0) {
    const dataSLA = Math.ceil(remainingSLA * 0.25);
    stages.push({
      name: 'Análise de Dados',
      description: 'Validação das informações específicas do serviço',
      order: currentOrder++,
      slaDays: dataSLA,
      requiredDocumentTypes: [],
      requiredFormFieldIds: requiredFieldIds, // TODOS os campos obrigatórios
      allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING', 'REQUEST_INFO'],
      canSkip: false,
      requiresApproval: true,
      actionLabels: {
        APPROVE: 'Aprovar dados informados',
        REJECT: 'Rejeitar por dados incorretos',
        CREATE_PENDING: 'Solicitar correção de dados',
        REQUEST_INFO: 'Solicitar informações adicionais'
      },
      availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'dados'
    });
    remainingSLA -= dataSLA;
  }

  // ======== STAGE 4: ANÁLISE TÉCNICA (se houver docs específicos ou complexidade) ========
  if (analysis.hasSpecificDocuments || analysis.hasComplexFields) {
    const techSLA = Math.ceil(remainingSLA * 0.3);

    let stageName = 'Análise Técnica';
    let stageDescription = 'Avaliação técnica de documentos específicos';

    if (analysis.hasMedicalContext) {
      stageName = 'Análise Médica';
      stageDescription = 'Avaliação técnica pela equipe médica de laudos e exames';
    } else if (analysis.hasFinancialContext) {
      stageName = 'Análise Financeira';
      stageDescription = 'Avaliação financeira e orçamentária';
    }

    stages.push({
      name: stageName,
      description: stageDescription,
      order: currentOrder++,
      slaDays: techSLA,
      requiredDocumentTypes: specificDocs,
      requiredFormFieldIds: allFieldIds, // Valida dados + docs específicos juntos
      allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING', 'REQUEST_INFO'],
      canSkip: false,
      requiresApproval: true,
      actionLabels: {
        APPROVE: 'Aprovar análise técnica',
        REJECT: 'Reprovar por questões técnicas',
        CREATE_PENDING: 'Solicitar documentação adicional',
        REQUEST_INFO: 'Solicitar esclarecimentos'
      },
      availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos'
    });
    remainingSLA -= techSLA;
  }

  // ======== STAGE 5: AGENDAMENTO (se necessário) ========
  if (analysis.requiresScheduling) {
    const scheduleSLA = Math.ceil(remainingSLA * 0.25);
    stages.push({
      name: 'Agendamento',
      description: 'Definição de data e horário do atendimento',
      order: currentOrder++,
      slaDays: scheduleSLA,
      requiredDocumentTypes: [],
      requiredFormFieldIds: [],
      allowedActions: ['APPROVE', 'CREATE_PENDING'],
      canSkip: false,
      requiresApproval: true,
      actionLabels: {
        APPROVE: 'Confirmar agendamento',
        CREATE_PENDING: 'Solicitar reagendamento'
      },
      availableTabs: ['resumo', 'dados', 'location', 'comunicacao'],
      primaryTab: 'dados'
    });
    remainingSLA -= scheduleSLA;
  }

  // ======== STAGE 6: APROVAÇÃO (se necessário) ========
  if (analysis.requiresApproval) {
    const approvalSLA = Math.ceil(remainingSLA * 0.25);
    stages.push({
      name: 'Aprovação',
      description: 'Aprovação final pela coordenação',
      order: currentOrder++,
      slaDays: approvalSLA,
      requiredDocumentTypes: requiredDocuments.map(d => d.type),
      requiredFormFieldIds: allFieldIds,
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false,
      requiresApproval: true,
      actionLabels: {
        APPROVE: 'Aprovar solicitação',
        REJECT: 'Reprovar solicitação'
      },
      availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
      primaryTab: 'resumo'
    });
    remainingSLA -= approvalSLA;
  }

  // ======== STAGE FINAL: CONCLUSÃO (SEMPRE) ========
  stages.push({
    name: 'Conclusão',
    description: 'Finalização e encerramento do protocolo',
    order: currentOrder++,
    slaDays: Math.max(1, remainingSLA),
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false,
    requiresApproval: false,
    stageType: 'CONCLUSION',
    actionLabels: { APPROVE: 'Concluir protocolo' },
    availableTabs: ['resumo-final', 'documentos-gerados', 'enviar', 'comunicacao'],
    primaryTab: 'resumo-final'
  });

  // ✅ CORREÇÃO: Recalcular SLA total como SOMA dos slaDays das stages
  const calculatedSLA = stages.reduce((sum, stage) => sum + (stage.slaDays || 0), 0);

  return {
    moduleType,
    name: `Workflow Especializado - ${serviceName}`,
    description: serviceDescription || `Fluxo inteligente para ${serviceName} (${stages.length} etapas, complexidade: ${analysis.estimatedComplexity})`,
    defaultSLA: calculatedSLA, // Usa SLA calculado ao invés do totalSLA original
    stages,
    rules: {
      autoGenerated: true,
      generatedAt: new Date().toISOString(),
      source: 'intelligent_generation',
      department: departmentName,
      version: '2.0',
      alignment: 'INTELLIGENT_SPECIALIZED',
      complexity: analysis.estimatedComplexity,
      analysis: analysis
    }
  };
}

/**
 * ============================================================================
 * SISTEMA UNIFICADO - GERAÇÃO COMPLETA POR SUBTIPO
 * ============================================================================
 *
 * Função ÚNICA e DEFINITIVA para gerar workflows com metadata completa.
 * Baseada nos 4 subtipos de serviço (🔵🟢🔴🟡) e mantém estrutura validada.
 */

/**
 * Helpers para classificação de documentos
 */
function isIdentityDocument(doc: { type: string }): boolean {
  const type = doc.type.toUpperCase();
  return type.includes('RG') ||
         type.includes('CPF') ||
         type.includes('IDENTIDADE') ||
         type.includes('CERTIDAO') ||
         type.includes('CNH');
}

function isAddressDocument(doc: { type: string }): boolean {
  const type = doc.type.toUpperCase();
  return (type.includes('COMPROVANTE') || type.includes('COMPROVA')) &&
         (type.includes('RESIDENCIA') || type.includes('ENDERECO'));
}

/**
 * Parse documentos do serviço
 */
function parseServiceDocuments(requiredDocuments: any): Array<{ type: string; name: string }> {
  if (!requiredDocuments) return [];

  // Se for string JSON, fazer parse
  let docs = requiredDocuments;
  if (typeof docs === 'string') {
    try {
      docs = JSON.parse(docs);
    } catch (e) {
      console.error('Erro ao fazer parse de requiredDocuments:', e);
      return [];
    }
  }

  // Se for array de strings, converter para objetos
  if (Array.isArray(docs)) {
    return docs.map(doc => {
      if (typeof doc === 'string') {
        return { type: doc, name: doc };
      }
      return { type: doc.type || doc.name || '', name: doc.name || doc.type || '' };
    });
  }

  return [];
}

/**
 * Extrai campos do formSchema
 */
function extractFieldsFromSchema(formSchema: any): Array<{ id: string; label: string; required: boolean }> {
  if (!formSchema) return [];

  // Se for string JSON, fazer parse
  let schema = formSchema;
  if (typeof schema === 'string') {
    try {
      schema = JSON.parse(schema);
    } catch (e) {
      console.error('Erro ao fazer parse de formSchema:', e);
      return [];
    }
  }

  if (!schema.properties) return [];

  const requiredFields = schema.required || [];
  const fields: Array<{ id: string; label: string; required: boolean }> = [];

  Object.keys(schema.properties).forEach(fieldId => {
    const field = schema.properties[fieldId];
    fields.push({
      id: fieldId,
      label: field.title || fieldId,
      required: requiredFields.includes(fieldId)
    });
  });

  return fields;
}

/**
 * FUNÇÃO PRINCIPAL: Gera workflow completo baseado em subtipo
 *
 * @param service - Serviço do Prisma com todos os dados
 * @returns Workflow com metadata completa e estrutura validada
 */
export function generateCompleteWorkflowBySubtype(service: ServiceSimplified): CreateWorkflowData {
  const subtype = service.serviceSubtype || 'CONSULTIVO';
  const totalSLA = service.estimatedDays || 10;

  // Extrair e processar documentos
  const docs = parseServiceDocuments(service.requiredDocuments);
  const identityDocs = docs.filter(isIdentityDocument);
  const addressDocs = docs.filter(isAddressDocument);
  const specificDocs = docs.filter(d => !isIdentityDocument(d) && !isAddressDocument(d));

  // Extrair campos do formulário
  const fields = extractFieldsFromSchema(service.formSchema);
  const requiredFieldIds = fields.filter(f => f.required).map(f => f.id);
  const allFieldIds = fields.map(f => f.id);

  const stages: Omit<WorkflowStage, 'id'>[] = [];
  let currentOrder = 1;

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 1: RECEPÇÃO (SEMPRE PRESENTE)
  // ═══════════════════════════════════════════════════════════════════
  stages.push({
    name: 'Recepção',
    order: currentOrder++,
    description: 'Recebimento e registro inicial da solicitação',
    slaDays: 1,
    availableTabs: ['resumo', 'comunicacao'],
    primaryTab: 'resumo',
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false,
    requiresApproval: true,
    stageType: 'RECEPTION',
    actionLabels: { APPROVE: 'Iniciar protocolo' }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ETAPAS INTERMEDIÁRIAS - BASEADAS NO SUBTIPO
  // ═══════════════════════════════════════════════════════════════════

  switch (subtype) {
    case 'CAPTURA_COMPLETA': // 🔵 Workflow COMPLETO (5-7 etapas)
      // Análise Documental
      if (identityDocs.length > 0 || addressDocs.length > 0) {
        stages.push({
          name: 'Análise Documental',
          order: currentOrder++,
          description: 'Verificação de documentos de identificação e comprovantes',
          slaDays: Math.ceil(totalSLA * 0.25),
          availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
          primaryTab: 'documentos',
          requiredDocumentTypes: [...identityDocs.map(d => d.type), ...addressDocs.map(d => d.type)],
          requiredFormFieldIds: [],
          allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING'],
          canSkip: false,
          requiresApproval: true,
          actionLabels: {
            APPROVE: 'Aprovar documentos',
            REJECT: 'Rejeitar por documentação',
            CREATE_PENDING: 'Solicitar correção de documentos'
          }
        });
      }

      // Validação de Dados
      if (fields.length > 0) {
        stages.push({
          name: 'Validação de Dados',
          order: currentOrder++,
          description: 'Verificação e validação dos dados do formulário',
          slaDays: Math.ceil(totalSLA * 0.2),
          availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
          primaryTab: 'dados',
          requiredDocumentTypes: [],
          requiredFormFieldIds: requiredFieldIds,
          allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING', 'REQUEST_INFO'],
          canSkip: false,
          requiresApproval: true,
          actionLabels: {
            APPROVE: 'Aprovar dados informados',
            REJECT: 'Rejeitar por dados incorretos',
            CREATE_PENDING: 'Solicitar correção de dados',
            REQUEST_INFO: 'Solicitar informações adicionais'
          }
        });
      }

      // Análise Técnica (se houver documentos específicos)
      if (specificDocs.length > 0) {
        stages.push({
          name: 'Análise Técnica',
          order: currentOrder++,
          description: 'Avaliação técnica de documentos específicos',
          slaDays: Math.ceil(totalSLA * 0.25),
          availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
          primaryTab: 'documentos',
          requiredDocumentTypes: specificDocs.map(d => d.type),
          requiredFormFieldIds: allFieldIds,
          allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING', 'REQUEST_INFO'],
          canSkip: false,
          requiresApproval: true,
          actionLabels: {
            APPROVE: 'Aprovar análise técnica',
            REJECT: 'Reprovar por questões técnicas',
            CREATE_PENDING: 'Solicitar documentação adicional',
            REQUEST_INFO: 'Solicitar esclarecimentos'
          }
        });
      }

      // Aprovação Final
      stages.push({
        name: 'Aprovação Final',
        order: currentOrder++,
        description: 'Aprovação final pela coordenação',
        slaDays: Math.ceil(totalSLA * 0.2),
        availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: docs.map(d => d.type),
        requiredFormFieldIds: allFieldIds,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        requiresApproval: true,
        actionLabels: {
          APPROVE: 'Aprovar solicitação',
          REJECT: 'Reprovar solicitação'
        }
      });
      break;

    case 'SOLICITACAO_SIMPLES': // 🟢 Workflow MÉDIO (3-4 etapas)
      stages.push({
        name: 'Análise',
        order: currentOrder++,
        description: 'Análise da solicitação e documentos',
        slaDays: Math.ceil(totalSLA * 0.5),
        availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: docs.map(d => d.type),
        requiredFormFieldIds: requiredFieldIds,
        allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING'],
        canSkip: false,
        requiresApproval: true,
        actionLabels: {
          APPROVE: 'Aprovar solicitação',
          REJECT: 'Rejeitar solicitação',
          CREATE_PENDING: 'Solicitar correções'
        }
      });

      stages.push({
        name: 'Aprovação',
        order: currentOrder++,
        description: 'Aprovação final',
        slaDays: Math.ceil(totalSLA * 0.3),
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredFormFieldIds: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        requiresApproval: true,
        actionLabels: {
          APPROVE: 'Aprovar',
          REJECT: 'Reprovar'
        }
      });
      break;

    case 'PAGAMENTO': // 🔴 Workflow PAGAMENTO (4 etapas)
      stages.push({
        name: 'Validação de Débitos',
        order: currentOrder++,
        description: 'Verificação de débitos e valores',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'payment', 'comunicacao'],
        primaryTab: 'payment',
        requiredDocumentTypes: [],
        requiredFormFieldIds: requiredFieldIds,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        requiresApproval: true,
        actionLabels: {
          APPROVE: 'Validar débitos',
          REJECT: 'Rejeitar por inconsistência'
        }
      });

      stages.push({
        name: 'Processamento Pagamento',
        order: currentOrder++,
        description: 'Processamento do pagamento',
        slaDays: Math.ceil(totalSLA * 0.6),
        availableTabs: ['resumo', 'payment', 'comunicacao'],
        primaryTab: 'payment',
        requiredDocumentTypes: [],
        requiredFormFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        requiresApproval: false,
        actionLabels: {
          APPROVE: 'Confirmar pagamento'
        }
      });
      break;

    case 'CONSULTIVO': // 🟡 Workflow MÍNIMO (3 etapas)
    default:
      stages.push({
        name: 'Processamento',
        order: currentOrder++,
        description: 'Processamento da consulta',
        slaDays: Math.ceil(totalSLA * 0.8),
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredFormFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        requiresApproval: false,
        actionLabels: {
          APPROVE: 'Processar consulta'
        }
      });
      break;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA FINAL: CONCLUSÃO (SEMPRE PRESENTE)
  // ═══════════════════════════════════════════════════════════════════
  stages.push({
    name: 'Conclusão',
    order: currentOrder++,
    description: 'Finalização e encerramento do protocolo',
    slaDays: 1,
    availableTabs: ['resumo-final', 'documentos-gerados', 'enviar', 'comunicacao'],
    primaryTab: 'resumo-final',
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false,
    requiresApproval: false,
    stageType: 'CONCLUSION',
    actionLabels: {
      APPROVE: 'Concluir protocolo'
    }
  });

  // Recalcular SLA total baseado nas etapas
  const calculatedSLA = stages.reduce((sum, s) => sum + (s.slaDays || 0), 0);

  return {
    moduleType: service.moduleType || `SERVICE_${service.id}`,
    name: `Workflow - ${service.name}`,
    description: `Workflow ${subtype} para ${service.name}`,
    defaultSLA: calculatedSLA,
    stages,
    rules: {
      autoGenerated: true,
      generatedAt: new Date().toISOString(),
      source: 'unified_complete_generation',
      subtype: subtype,
      version: '3.0',
      alignment: 'UNIFIED_SUBTYPE_BASED'
    }
  };
}













