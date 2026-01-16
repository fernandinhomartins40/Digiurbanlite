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
      availableTabs: ['summary-final', 'communication'],
      primaryTab: 'summary-final'
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
    availableTabs: ['summary-final', 'document-generation', 'send', 'communication'],
    primaryTab: 'summary-final'
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













