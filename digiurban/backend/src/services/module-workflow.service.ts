/**
 * Serviço para gerenciamento de Workflows de Módulos
 */

import { prisma } from '../lib/prisma';

/**
 * Interface para etapa de workflow
 */
export interface WorkflowStage {
  name: string;
  order: number;
  slaDays?: number;
  requiredDocuments?: string[];
  requiredActions?: string[];
  canSkip?: boolean;
  skipCondition?: string;
}

/**
 * Interface para criação de workflow
 */
export interface CreateWorkflowData {
  moduleType: string;
  name: string;
  description?: string;
  stages: WorkflowStage[];
  defaultSLA?: number;
  rules?: any;
}

/**
 * Interface para atualização de workflow
 */
export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  stages?: WorkflowStage[];
  defaultSLA?: number;
  rules?: any;
}

/**
 * Cria um novo workflow de módulo
 */
export async function createWorkflow(data: CreateWorkflowData) {
  // Valida que as etapas estão ordenadas corretamente
  const sortedStages = [...data.stages].sort((a, b) => a.order - b.order);

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
    const sortedStages = [...data.stages].sort((a, b) => a.order - b.order);
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
 */
export async function applyWorkflowToProtocol(
  protocolId: string,
  moduleType: string
) {
  const workflow = await getWorkflowByModuleType(moduleType);

  if (!workflow) {
    throw new Error(`Workflow não encontrado para módulo: ${moduleType}`);
  }

  const stages = workflow.stages as any as WorkflowStage[];

  // Cria todas as etapas do workflow
  const createdStages = await Promise.all(
    stages.map((stage) =>
      prisma.protocolStage.create({
        data: {
          protocolId,
          stageName: stage.name,
          stageOrder: stage.order,
          dueDate: stage.slaDays
            ? new Date(Date.now() + stage.slaDays * 24 * 60 * 60 * 1000)
            : undefined,
          metadata: {
            requiredDocuments: stage.requiredDocuments || [],
            requiredActions: stage.requiredActions || [],
            canSkip: stage.canSkip || false,
            skipCondition: stage.skipCondition
        }
        }
        })
    )
  );

  return createdStages;
}

/**
 * Valida se todas as condições de uma etapa foram atendidas
 */
export async function validateStageConditions(
  protocolId: string,
  stageOrder: number
): Promise<{ valid: boolean; missingItems: string[] }> {
  const stage = await prisma.protocolStage.findFirst({
    where: {
      protocolId,
      stageOrder
        }
        });

  if (!stage) {
    return { valid: false, missingItems: ['Etapa não encontrada'] };
  }

  const metadata = stage.metadata as any;
  const missingItems: string[] = [];

  // Verifica documentos obrigatórios
  if (metadata?.requiredDocuments && metadata.requiredDocuments.length > 0) {
    const documents = await prisma.protocolDocument.findMany({
      where: {
        protocolId,
        documentType: { in: metadata.requiredDocuments },
        status: 'APPROVED'
        }
        });

    const approvedDocs = documents.map((d) => d.documentType);
    const missingDocs = metadata.requiredDocuments.filter(
      (doc: string) => !approvedDocs.includes(doc)
    );

    if (missingDocs.length > 0) {
      missingItems.push(`Documentos faltantes: ${missingDocs.join(', ')}`);
    }
  }

  // Verifica ações obrigatórias
  if (metadata?.requiredActions && metadata.requiredActions.length > 0) {
    // TODO: Implementar verificação de ações quando houver sistema de ações
    // Por enquanto, assume que ações devem ser verificadas manualmente
  }

  return {
    valid: missingItems.length === 0,
    missingItems
        };
}

/**
 * Obtém estatísticas de workflows
 */
export async function getWorkflowStats() {
  const workflows = await getAllWorkflows();

  return {
    total: workflows.length,
    workflows: workflows.map((w) => ({
      moduleType: w.moduleType,
      name: w.name,
      stagesCount: Array.isArray(w.stages) ? w.stages.length : 0,
      defaultSLA: w.defaultSLA
        }))
        };
}

/**
 * Cria workflows padrão para TODOS os módulos do sistema
 */
export async function createDefaultWorkflows() {
  const defaultWorkflows: CreateWorkflowData[] = [

    // ========================================
    // SECRETARIA DE AGRICULTURA (9 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_AGRICULTURA',
      name: 'Atendimento Agricultura',
      description: 'Workflow para atendimentos gerais de agricultura',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 2,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento Técnico',
          order: 2,
          slaDays: 6,
          requiredActions: ['complete_attendance'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 2,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'CADASTRO_PRODUTOR',
      name: 'Cadastro de Produtor Rural',
      description: 'Workflow padrão para cadastro de produtor rural',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA', 'COMPROVANTE_PROPRIEDADE'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Vistoria de Propriedade',
          order: 2,
          slaDays: 7,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: true,
          skipCondition: 'property_already_registered'
        },
        {
          name: 'Análise Técnica',
          order: 3,
          slaDays: 5,
          requiredActions: ['technical_review', 'approve_or_reject'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'ASSISTENCIA_TECNICA',
      name: 'Assistência Técnica Rural',
      description: 'Workflow para solicitações de assistência técnica',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem Inicial',
          order: 1,
          slaDays: 2,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Agendamento de Visita',
          order: 2,
          slaDays: 5,
          requiredActions: ['schedule_visit'],
          canSkip: false
        },
        {
          name: 'Atendimento Técnico',
          order: 3,
          slaDays: 3,
          requiredActions: ['complete_visit', 'upload_report'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_CURSO_RURAL',
      name: 'Inscrição em Curso Rural',
      description: 'Workflow para inscrição em cursos de capacitação rural',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_ATIVIDADE_RURAL'],
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas',
          order: 2,
          slaDays: 4,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 3,
          requiredActions: ['confirm_enrollment'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_PROGRAMA_RURAL',
      name: 'Inscrição em Programa Rural',
      description: 'Workflow para inscrição em programas rurais',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Elegibilidade',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_PROPRIEDADE', 'DAP'],
          requiredActions: ['verify_eligibility'],
          canSkip: false
        },
        {
          name: 'Visita Técnica',
          order: 2,
          slaDays: 7,
          requiredActions: ['schedule_visit', 'complete_visit'],
          canSkip: false
        },
        {
          name: 'Aprovação',
          order: 3,
          slaDays: 3,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
      name: 'Cadastro de Propriedade Rural',
      description: 'Workflow para cadastro de propriedades rurais',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['MATRICULA_IMOVEL', 'CAR', 'ITR'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Vistoria da Propriedade',
          order: 2,
          slaDays: 10,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Cadastramento',
          order: 3,
          slaDays: 5,
          requiredActions: ['register_property'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_MAQUINAS_AGRICOLAS',
      name: 'Solicitação de Máquinas Agrícolas',
      description: 'Workflow para solicitação de uso de máquinas agrícolas',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Verificação de Disponibilidade',
          order: 2,
          slaDays: 7,
          requiredActions: ['check_availability'],
          canSkip: false
        },
        {
          name: 'Agendamento de Uso',
          order: 3,
          slaDays: 5,
          requiredActions: ['schedule_use'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_INSUMOS',
      name: 'Solicitação de Insumos Agrícolas',
      description: 'Workflow para solicitação de insumos agrícolas',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 2,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Verificação de Estoque',
          order: 2,
          slaDays: 5,
          requiredActions: ['check_inventory'],
          canSkip: false
        },
        {
          name: 'Liberação de Insumos',
          order: 3,
          slaDays: 3,
          requiredActions: ['release_supplies'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'DECLARACAO_APTIDAO_PRONAF',
      name: 'Declaração de Aptidão ao PRONAF (DAP)',
      description: 'Workflow para emissão de DAP',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA', 'COMPROVANTE_ATIVIDADE_RURAL'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['schedule_visit', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Emissão de DAP',
          order: 3,
          slaDays: 5,
          requiredActions: ['issue_dap'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE ASSISTÊNCIA SOCIAL (10 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
      name: 'Atendimento Assistência Social',
      description: 'Workflow para atendimentos gerais de assistência social',
      defaultSLA: 5,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 1,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento Social',
          order: 2,
          slaDays: 3,
          requiredActions: ['social_service'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 1,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'CADASTRO_UNICO',
      name: 'Cadastro Único (CadÚnico)',
      description: 'Workflow para inscrição no Cadastro Único',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Entrevista Social',
          order: 2,
          slaDays: 5,
          requiredActions: ['conduct_interview'],
          canSkip: false
        },
        {
          name: 'Cadastramento',
          order: 3,
          slaDays: 3,
          requiredActions: ['register'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_PROGRAMA_SOCIAL',
      name: 'Inscrição em Programa Social',
      description: 'Workflow para inscrição em programas sociais',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Elegibilidade',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA', 'COMPROVANTE_RENDA'],
          requiredActions: ['verify_eligibility'],
          canSkip: false
        },
        {
          name: 'Visita Domiciliar',
          order: 2,
          slaDays: 7,
          requiredActions: ['schedule_visit', 'complete_visit'],
          canSkip: false
        },
        {
          name: 'Aprovação',
          order: 3,
          slaDays: 3,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_CESTA_BASICA',
      name: 'Solicitação de Cesta Básica',
      description: 'Workflow para solicitação de cesta básica',
      defaultSLA: 5,
      stages: [
        {
          name: 'Análise de Necessidade',
          order: 1,
          slaDays: 1,
          requiredActions: ['assess_need'],
          canSkip: false
        },
        {
          name: 'Verificação de Estoque',
          order: 2,
          slaDays: 2,
          requiredActions: ['check_stock'],
          canSkip: false
        },
        {
          name: 'Liberação de Cesta',
          order: 3,
          slaDays: 2,
          requiredActions: ['release_basket'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_AUXILIO_EMERGENCIAL',
      name: 'Solicitação de Auxílio Emergencial',
      description: 'Workflow para auxílio emergencial',
      defaultSLA: 7,
      stages: [
        {
          name: 'Análise de Situação de Emergência',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_SITUACAO_EMERGENCIA'],
          requiredActions: ['assess_emergency'],
          canSkip: false
        },
        {
          name: 'Avaliação Social',
          order: 2,
          slaDays: 3,
          requiredActions: ['social_assessment'],
          canSkip: false
        },
        {
          name: 'Liberação de Auxílio',
          order: 3,
          slaDays: 2,
          requiredActions: ['release_aid'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_CURSO_PROFISSIONALIZANTE',
      name: 'Inscrição em Curso Profissionalizante',
      description: 'Workflow para inscrição em cursos profissionalizantes',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_ESCOLARIDADE'],
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas',
          order: 2,
          slaDays: 7,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 3,
          requiredActions: ['confirm_enrollment'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_PASSE_LIVRE',
      name: 'Solicitação de Passe Livre (PCD)',
      description: 'Workflow para solicitação de passe livre para pessoas com deficiência',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'LAUDO_MEDICO', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Social',
          order: 2,
          slaDays: 10,
          requiredActions: ['social_assessment'],
          canSkip: false
        },
        {
          name: 'Emissão de Passe',
          order: 3,
          slaDays: 5,
          requiredActions: ['issue_pass'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_ACOMPANHAMENTO_FAMILIAR',
      name: 'Solicitação de Acompanhamento Familiar (PAIF)',
      description: 'Workflow para PAIF',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem Inicial',
          order: 1,
          slaDays: 2,
          requiredActions: ['initial_screening'],
          canSkip: false
        },
        {
          name: 'Visita Domiciliar',
          order: 2,
          slaDays: 5,
          requiredActions: ['home_visit'],
          canSkip: false
        },
        {
          name: 'Planejamento de Acompanhamento',
          order: 3,
          slaDays: 3,
          requiredActions: ['create_plan'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_ABRIGAMENTO_TEMPORARIO',
      name: 'Solicitação de Abrigamento Temporário',
      description: 'Workflow emergencial para abrigamento',
      defaultSLA: 1,
      stages: [
        {
          name: 'Avaliação de Emergência',
          order: 1,
          slaDays: 0.5,
          requiredActions: ['emergency_assessment'],
          canSkip: false
        },
        {
          name: 'Encaminhamento para Abrigo',
          order: 2,
          slaDays: 0.5,
          requiredActions: ['shelter_referral'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_BPC',
      name: 'Inscrição em Benefício de Prestação Continuada (BPC)',
      description: 'Workflow para inscrição no BPC',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 10,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA', 'LAUDO_MEDICO', 'COMPROVANTE_RENDA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Social',
          order: 2,
          slaDays: 15,
          requiredActions: ['social_assessment'],
          canSkip: false
        },
        {
          name: 'Envio ao INSS',
          order: 3,
          slaDays: 5,
          requiredActions: ['send_to_inss'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE CULTURA (8 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_CULTURA',
      name: 'Atendimento Cultura',
      description: 'Workflow para atendimentos gerais de cultura',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 2,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento Cultural',
          order: 2,
          slaDays: 6,
          requiredActions: ['cultural_service'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 2,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_EVENTO_CULTURAL',
      name: 'Inscrição em Evento Cultural',
      description: 'Workflow para inscrição em eventos culturais',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas',
          order: 2,
          slaDays: 4,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 3,
          requiredActions: ['confirm_enrollment'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'RESERVA_ESPACO_CULTURAL',
      name: 'Reserva de Espaço Cultural',
      description: 'Workflow para reserva de espaços culturais',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'PROJETO_EVENTO'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Verificação de Disponibilidade',
          order: 2,
          slaDays: 7,
          requiredActions: ['check_availability'],
          canSkip: false
        },
        {
          name: 'Aprovação de Reserva',
          order: 3,
          slaDays: 5,
          requiredActions: ['approve_reservation'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_OFICINA_CULTURAL',
      name: 'Inscrição em Oficina Cultural',
      description: 'Workflow para inscrição em oficinas culturais',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF'],
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas',
          order: 2,
          slaDays: 4,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 3,
          requiredActions: ['confirm_enrollment'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_APOIO_CULTURAL',
      name: 'Solicitação de Apoio Cultural',
      description: 'Workflow para solicitação de apoio a projetos culturais',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise de Projeto',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['RG_CPF', 'PROJETO_CULTURAL', 'ORCAMENTO'],
          requiredActions: ['review_project'],
          canSkip: false
        },
        {
          name: 'Avaliação Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['technical_evaluation'],
          canSkip: false
        },
        {
          name: 'Decisão Final',
          order: 3,
          slaDays: 3,
          requiredActions: ['final_decision'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'CADASTRO_ARTISTA_LOCAL',
      name: 'Cadastro de Artista Local',
      description: 'Workflow para cadastro de artistas locais',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'PORTFOLIO', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Cultural',
          order: 2,
          slaDays: 7,
          requiredActions: ['cultural_assessment'],
          canSkip: false
        },
        {
          name: 'Cadastramento',
          order: 3,
          slaDays: 3,
          requiredActions: ['register'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_BIBLIOTECA',
      name: 'Solicitação de Serviços de Biblioteca',
      description: 'Workflow para serviços de biblioteca',
      defaultSLA: 5,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 1,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Processamento',
          order: 2,
          slaDays: 3,
          requiredActions: ['process_request'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 1,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_LEI_INCENTIVO',
      name: 'Inscrição em Lei de Incentivo à Cultura',
      description: 'Workflow para inscrição em lei de incentivo',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 10,
          requiredDocuments: ['RG_CPF', 'PROJETO_CULTURAL', 'ORCAMENTO', 'PLANILHA_FINANCEIRA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Técnica',
          order: 2,
          slaDays: 15,
          requiredActions: ['technical_evaluation'],
          canSkip: false
        },
        {
          name: 'Decisão da Comissão',
          order: 3,
          slaDays: 5,
          requiredActions: ['commission_decision'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE EDUCAÇÃO (12 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_EDUCACAO',
      name: 'Atendimento Educação',
      description: 'Workflow para atendimentos gerais de educação',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 2,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento Pedagógico',
          order: 2,
          slaDays: 6,
          requiredActions: ['pedagogical_service'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 2,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'MATRICULA_ESCOLAR',
      name: 'Matrícula Escolar',
      description: 'Workflow para matrícula escolar',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['RG_CPF', 'CERTIDAO_NASCIMENTO', 'COMPROVANTE_RESIDENCIA', 'HISTORICO_ESCOLAR'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas',
          order: 2,
          slaDays: 5,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Efetivação de Matrícula',
          order: 3,
          slaDays: 3,
          requiredActions: ['finalize_enrollment'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_TRANSPORTE_ESCOLAR',
      name: 'Solicitação de Transporte Escolar',
      description: 'Workflow para transporte escolar',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_MATRICULA', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Verificação de Rotas',
          order: 2,
          slaDays: 7,
          requiredActions: ['check_routes'],
          canSkip: false
        },
        {
          name: 'Aprovação de Transporte',
          order: 3,
          slaDays: 5,
          requiredActions: ['approve_transport'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_MERENDA_ESPECIAL',
      name: 'Inscrição em Merenda Especial',
      description: 'Workflow para merenda especial',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'LAUDO_MEDICO', 'COMPROVANTE_MATRICULA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Nutricional',
          order: 2,
          slaDays: 5,
          requiredActions: ['nutritional_assessment'],
          canSkip: false
        },
        {
          name: 'Aprovação',
          order: 3,
          slaDays: 2,
          requiredActions: ['approve'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_TRANSFERENCIA',
      name: 'Solicitação de Transferência Escolar',
      description: 'Workflow para transferência escolar',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_MATRICULA'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas na Escola Destino',
          order: 2,
          slaDays: 7,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Efetivação de Transferência',
          order: 3,
          slaDays: 5,
          requiredActions: ['finalize_transfer'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_PROGRAMA_JOVEM_APRENDIZ',
      name: 'Inscrição no Programa Jovem Aprendiz',
      description: 'Workflow para programa jovem aprendiz',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_ESCOLARIDADE', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Pedagógica',
          order: 2,
          slaDays: 10,
          requiredActions: ['pedagogical_assessment'],
          canSkip: false
        },
        {
          name: 'Aprovação e Encaminhamento',
          order: 3,
          slaDays: 5,
          requiredActions: ['approve_and_refer'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_UNIFORME',
      name: 'Solicitação de Uniforme Escolar',
      description: 'Workflow para uniforme escolar',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['COMPROVANTE_MATRICULA'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Verificação de Estoque',
          order: 2,
          slaDays: 5,
          requiredActions: ['check_stock'],
          canSkip: false
        },
        {
          name: 'Liberação de Uniforme',
          order: 3,
          slaDays: 3,
          requiredActions: ['release_uniform'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_MATERIAL_ESCOLAR',
      name: 'Solicitação de Material Escolar',
      description: 'Workflow para material escolar',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['COMPROVANTE_MATRICULA'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Verificação de Estoque',
          order: 2,
          slaDays: 5,
          requiredActions: ['check_stock'],
          canSkip: false
        },
        {
          name: 'Liberação de Material',
          order: 3,
          slaDays: 3,
          requiredActions: ['release_supplies'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_PROJETO_EDUCACIONAL',
      name: 'Inscrição em Projeto Educacional',
      description: 'Workflow para projetos educacionais',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_MATRICULA'],
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas',
          order: 2,
          slaDays: 7,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 3,
          requiredActions: ['confirm_enrollment'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_ATENDIMENTO_ESPECIALIZADO',
      name: 'Solicitação de Atendimento Educacional Especializado (AEE)',
      description: 'Workflow para AEE',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'LAUDO_MEDICO', 'COMPROVANTE_MATRICULA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Pedagógica',
          order: 2,
          slaDays: 7,
          requiredActions: ['pedagogical_assessment'],
          canSkip: false
        },
        {
          name: 'Elaboração de Plano de Atendimento',
          order: 3,
          slaDays: 5,
          requiredActions: ['create_plan'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_SEGUNDA_CHAMADA',
      name: 'Solicitação de Prova em Segunda Chamada',
      description: 'Workflow para segunda chamada',
      defaultSLA: 5,
      stages: [
        {
          name: 'Análise de Justificativa',
          order: 1,
          slaDays: 1,
          requiredDocuments: ['JUSTIFICATIVA'],
          requiredActions: ['review_justification'],
          canSkip: false
        },
        {
          name: 'Aprovação Pedagógica',
          order: 2,
          slaDays: 2,
          requiredActions: ['pedagogical_approval'],
          canSkip: false
        },
        {
          name: 'Agendamento de Prova',
          order: 3,
          slaDays: 2,
          requiredActions: ['schedule_exam'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_DECLARACAO_ESCOLAR',
      name: 'Solicitação de Declaração Escolar',
      description: 'Workflow para declaração escolar',
      defaultSLA: 3,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 1,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Emissão de Declaração',
          order: 2,
          slaDays: 1,
          requiredActions: ['issue_declaration'],
          canSkip: false
        },
        {
          name: 'Entrega',
          order: 3,
          slaDays: 1,
          requiredActions: ['deliver'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE ESPORTES (4 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_ESPORTES',
      name: 'Atendimento Esportes',
      description: 'Workflow para atendimentos gerais de esportes',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 2,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento Esportivo',
          order: 2,
          slaDays: 6,
          requiredActions: ['sports_service'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 2,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_ATIVIDADE_ESPORTIVA',
      name: 'Inscrição em Atividade Esportiva',
      description: 'Workflow para inscrição em atividades esportivas',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'ATESTADO_MEDICO'],
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas',
          order: 2,
          slaDays: 4,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 3,
          requiredActions: ['confirm_enrollment'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'RESERVA_EQUIPAMENTO_ESPORTIVO',
      name: 'Reserva de Equipamento Esportivo',
      description: 'Workflow para reserva de equipamentos esportivos',
      defaultSLA: 7,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['RG_CPF'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Verificação de Disponibilidade',
          order: 2,
          slaDays: 3,
          requiredActions: ['check_availability'],
          canSkip: false
        },
        {
          name: 'Aprovação de Reserva',
          order: 3,
          slaDays: 2,
          requiredActions: ['approve_reservation'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_CAMPEONATO',
      name: 'Inscrição em Campeonato',
      description: 'Workflow para inscrição em campeonatos',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'ATESTADO_MEDICO', 'FICHA_ATLETA'],
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Verificação de Regulamento',
          order: 2,
          slaDays: 7,
          requiredActions: ['verify_compliance'],
          canSkip: false
        },
        {
          name: 'Confirmação e Sorteio',
          order: 3,
          slaDays: 3,
          requiredActions: ['confirm_and_draw'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE HABITAÇÃO (5 workflows)
    // ========================================
    {
      moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL',
      name: 'Inscrição em Programa Habitacional',
      description: 'Workflow para programas habitacionais',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 10,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA', 'COMPROVANTE_RENDA', 'CERTIDAO_ESTADO_CIVIL'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Social',
          order: 2,
          slaDays: 15,
          requiredActions: ['social_assessment'],
          canSkip: false
        },
        {
          name: 'Classificação',
          order: 3,
          slaDays: 5,
          requiredActions: ['classify'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_REFORMA',
      name: 'Solicitação de Auxílio para Reforma',
      description: 'Workflow para auxílio reforma',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_PROPRIEDADE', 'ORCAMENTO_REFORMA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 15,
          requiredActions: ['technical_inspection'],
          canSkip: false
        },
        {
          name: 'Decisão Final',
          order: 3,
          slaDays: 8,
          requiredActions: ['final_decision'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_REGULARIZACAO_FUNDIARIA',
      name: 'Solicitação de Regularização Fundiária',
      description: 'Workflow para regularização fundiária',
      defaultSLA: 60,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 15,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA', 'DOCUMENTOS_IMOVEL'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Levantamento Topográfico',
          order: 2,
          slaDays: 30,
          requiredActions: ['topographic_survey'],
          canSkip: false
        },
        {
          name: 'Processo de Regularização',
          order: 3,
          slaDays: 15,
          requiredActions: ['regularization_process'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_ATENDIMENTO_HABITACIONAL',
      name: 'Solicitação de Atendimento Habitacional',
      description: 'Workflow para atendimento habitacional',
      defaultSLA: 15,
      stages: [
        {
          name: 'Triagem Social',
          order: 1,
          slaDays: 3,
          requiredActions: ['social_screening'],
          canSkip: false
        },
        {
          name: 'Avaliação de Necessidade',
          order: 2,
          slaDays: 7,
          requiredActions: ['need_assessment'],
          canSkip: false
        },
        {
          name: 'Encaminhamento',
          order: 3,
          slaDays: 5,
          requiredActions: ['referral'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_MATERIAIS_CONSTRUCAO',
      name: 'Solicitação de Materiais de Construção',
      description: 'Workflow para materiais de construção',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA', 'ORCAMENTO'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Avaliação Social',
          order: 2,
          slaDays: 10,
          requiredActions: ['social_assessment'],
          canSkip: false
        },
        {
          name: 'Liberação de Materiais',
          order: 3,
          slaDays: 5,
          requiredActions: ['release_materials'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE MEIO AMBIENTE (5 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_MEIO_AMBIENTE',
      name: 'Atendimento Meio Ambiente',
      description: 'Workflow para atendimentos gerais de meio ambiente',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 2,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento Ambiental',
          order: 2,
          slaDays: 6,
          requiredActions: ['environmental_service'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 2,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_LICENCIAMENTO_AMBIENTAL',
      name: 'Solicitação de Licenciamento Ambiental',
      description: 'Workflow para licenciamento ambiental',
      defaultSLA: 60,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 15,
          requiredDocuments: ['RG_CPF', 'PROJETO_ATIVIDADE', 'ESTUDOS_AMBIENTAIS'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 30,
          requiredActions: ['technical_inspection'],
          canSkip: false
        },
        {
          name: 'Emissão de Licença',
          order: 3,
          slaDays: 15,
          requiredActions: ['issue_license'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'DENUNCIA_AMBIENTAL',
      name: 'Denúncia Ambiental',
      description: 'Workflow para denúncias ambientais',
      defaultSLA: 15,
      stages: [
        {
          name: 'Registro de Denúncia',
          order: 1,
          slaDays: 2,
          requiredActions: ['register_complaint'],
          canSkip: false
        },
        {
          name: 'Vistoria de Fiscalização',
          order: 2,
          slaDays: 10,
          requiredActions: ['inspection'],
          canSkip: false
        },
        {
          name: 'Providências',
          order: 3,
          slaDays: 3,
          requiredActions: ['take_action'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_AUTORIZACAO_PODA',
      name: 'Solicitação de Autorização para Poda/Corte de Árvore',
      description: 'Workflow para autorização de poda',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_PROPRIEDADE', 'FOTOS'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['technical_inspection'],
          canSkip: false
        },
        {
          name: 'Emissão de Autorização',
          order: 3,
          slaDays: 2,
          requiredActions: ['issue_authorization'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_COLETA_ESPECIAL',
      name: 'Solicitação de Coleta Especial de Resíduos',
      description: 'Workflow para coleta especial',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 2,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Agendamento de Coleta',
          order: 2,
          slaDays: 5,
          requiredActions: ['schedule_collection'],
          canSkip: false
        },
        {
          name: 'Realização de Coleta',
          order: 3,
          slaDays: 3,
          requiredActions: ['perform_collection'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE OBRAS PÚBLICAS (3 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_OBRAS_PUBLICAS',
      name: 'Atendimento Obras Públicas',
      description: 'Workflow para atendimentos gerais de obras públicas',
      defaultSLA: 15,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 3,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento Técnico',
          order: 2,
          slaDays: 10,
          requiredActions: ['technical_service'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 2,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_REPARO_VIA_PUBLICA',
      name: 'Solicitação de Reparo em Via Pública',
      description: 'Workflow para reparo em vias públicas',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 5,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 15,
          requiredActions: ['technical_inspection'],
          canSkip: false
        },
        {
          name: 'Execução de Reparo',
          order: 3,
          slaDays: 10,
          requiredActions: ['execute_repair'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_OBRA_COMUNITARIA',
      name: 'Solicitação de Obra Comunitária',
      description: 'Workflow para obras comunitárias',
      defaultSLA: 60,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 15,
          requiredDocuments: ['DESCRICAO_OBRA', 'JUSTIFICATIVA_COMUNIDADE'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Estudo de Viabilidade',
          order: 2,
          slaDays: 30,
          requiredActions: ['feasibility_study'],
          canSkip: false
        },
        {
          name: 'Aprovação e Planejamento',
          order: 3,
          slaDays: 15,
          requiredActions: ['approve_and_plan'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE PLANEJAMENTO URBANO (5 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_PLANEJAMENTO_URBANO',
      name: 'Atendimento Planejamento Urbano',
      description: 'Workflow para atendimentos gerais de planejamento urbano',
      defaultSLA: 15,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 3,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento Urbanístico',
          order: 2,
          slaDays: 10,
          requiredActions: ['urban_service'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 2,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_ALVARA_CONSTRUCAO',
      name: 'Solicitação de Alvará de Construção',
      description: 'Workflow para alvará de construção',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 10,
          requiredDocuments: ['RG_CPF', 'MATRICULA_IMOVEL', 'PROJETO_ARQUITETONICO', 'ART'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Análise Técnica',
          order: 2,
          slaDays: 15,
          requiredActions: ['technical_analysis'],
          canSkip: false
        },
        {
          name: 'Emissão de Alvará',
          order: 3,
          slaDays: 5,
          requiredActions: ['issue_permit'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_CERTIDAO_USO_SOLO',
      name: 'Solicitação de Certidão de Uso do Solo',
      description: 'Workflow para certidão de uso do solo',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'MATRICULA_IMOVEL'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Análise Urbanística',
          order: 2,
          slaDays: 7,
          requiredActions: ['urban_analysis'],
          canSkip: false
        },
        {
          name: 'Emissão de Certidão',
          order: 3,
          slaDays: 3,
          requiredActions: ['issue_certificate'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_ALVARA_DEMOLICAO',
      name: 'Solicitação de Alvará de Demolição',
      description: 'Workflow para alvará de demolição',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'MATRICULA_IMOVEL', 'PROJETO_DEMOLICAO', 'ART'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['technical_inspection'],
          canSkip: false
        },
        {
          name: 'Emissão de Alvará',
          order: 3,
          slaDays: 5,
          requiredActions: ['issue_permit'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_REMEMBRAMENTO',
      name: 'Solicitação de Desmembramento/Remembramento de Lote',
      description: 'Workflow para desmembramento/remembramento',
      defaultSLA: 45,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 15,
          requiredDocuments: ['RG_CPF', 'MATRICULA_IMOVEL', 'PROJETO_TOPOGRAFICO', 'ART'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Análise Urbanística',
          order: 2,
          slaDays: 20,
          requiredActions: ['urban_analysis'],
          canSkip: false
        },
        {
          name: 'Aprovação e Registro',
          order: 3,
          slaDays: 10,
          requiredActions: ['approve_and_register'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE SAÚDE (10 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_SAUDE',
      name: 'Atendimento Saúde',
      description: 'Workflow para atendimentos gerais de saúde',
      defaultSLA: 5,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 1,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento Médico',
          order: 2,
          slaDays: 3,
          requiredActions: ['medical_service'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 1,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'AGENDAMENTO_CONSULTA',
      name: 'Agendamento de Consulta Médica',
      description: 'Workflow para agendamento de consultas',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['CARTAO_SUS', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Verificação de Agenda',
          order: 2,
          slaDays: 7,
          requiredActions: ['check_schedule'],
          canSkip: false
        },
        {
          name: 'Confirmação de Agendamento',
          order: 3,
          slaDays: 5,
          requiredActions: ['confirm_appointment'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'AGENDAMENTO_EXAME',
      name: 'Agendamento de Exame',
      description: 'Workflow para agendamento de exames',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Requisição',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['CARTAO_SUS', 'REQUISICAO_MEDICA'],
          requiredActions: ['review_requisition'],
          canSkip: false
        },
        {
          name: 'Verificação de Disponibilidade',
          order: 2,
          slaDays: 7,
          requiredActions: ['check_availability'],
          canSkip: false
        },
        {
          name: 'Confirmação de Agendamento',
          order: 3,
          slaDays: 5,
          requiredActions: ['confirm_appointment'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_MEDICAMENTO_ESPECIAL',
      name: 'Solicitação de Medicamento Especial',
      description: 'Workflow para medicamentos especiais',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['CARTAO_SUS', 'RECEITA_MEDICA', 'LAUDOS'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Médica',
          order: 2,
          slaDays: 10,
          requiredActions: ['medical_evaluation'],
          canSkip: false
        },
        {
          name: 'Liberação de Medicamento',
          order: 3,
          slaDays: 5,
          requiredActions: ['release_medication'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'CADASTRO_PROGRAMA_SAUDE',
      name: 'Cadastro em Programa de Saúde',
      description: 'Workflow para cadastro em programas de saúde',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['CARTAO_SUS', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação de Elegibilidade',
          order: 2,
          slaDays: 5,
          requiredActions: ['verify_eligibility'],
          canSkip: false
        },
        {
          name: 'Cadastramento',
          order: 3,
          slaDays: 2,
          requiredActions: ['register'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_TRANSPORTE_SAUDE',
      name: 'Solicitação de Transporte para Tratamento de Saúde',
      description: 'Workflow para transporte de saúde',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['CARTAO_SUS', 'COMPROVANTE_TRATAMENTO'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Avaliação Social',
          order: 2,
          slaDays: 7,
          requiredActions: ['social_assessment'],
          canSkip: false
        },
        {
          name: 'Aprovação de Transporte',
          order: 3,
          slaDays: 5,
          requiredActions: ['approve_transport'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'AGENDAMENTO_VACINA',
      name: 'Agendamento de Vacinação',
      description: 'Workflow para agendamento de vacinas',
      defaultSLA: 7,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['CARTAO_SUS', 'CARTEIRA_VACINACAO'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Verificação de Disponibilidade',
          order: 2,
          slaDays: 3,
          requiredActions: ['check_availability'],
          canSkip: false
        },
        {
          name: 'Confirmação de Agendamento',
          order: 3,
          slaDays: 2,
          requiredActions: ['confirm_appointment'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_ATENDIMENTO_DOMICILIAR',
      name: 'Solicitação de Atendimento Domiciliar',
      description: 'Workflow para atendimento domiciliar',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['CARTAO_SUS', 'LAUDO_MEDICO'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Avaliação Médica',
          order: 2,
          slaDays: 5,
          requiredActions: ['medical_evaluation'],
          canSkip: false
        },
        {
          name: 'Agendamento de Visita',
          order: 3,
          slaDays: 3,
          requiredActions: ['schedule_visit'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_CIRURGIA_ELETIVA',
      name: 'Inscrição em Fila de Cirurgia Eletiva',
      description: 'Workflow para fila de cirurgia',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['CARTAO_SUS', 'REQUISICAO_CIRURGIA', 'EXAMES_PREOPERATORIOS'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Médica',
          order: 2,
          slaDays: 7,
          requiredActions: ['medical_evaluation'],
          canSkip: false
        },
        {
          name: 'Inclusão em Fila',
          order: 3,
          slaDays: 3,
          requiredActions: ['add_to_queue'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_SEGUNDA_VIA_CARTAO_SUS',
      name: 'Solicitação de 2ª Via do Cartão SUS',
      description: 'Workflow para segunda via do cartão SUS',
      defaultSLA: 5,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 1,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Emissão de Cartão',
          order: 2,
          slaDays: 3,
          requiredActions: ['issue_card'],
          canSkip: false
        },
        {
          name: 'Entrega',
          order: 3,
          slaDays: 1,
          requiredActions: ['deliver'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE SEGURANÇA PÚBLICA (8 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_SEGURANCA_PUBLICA',
      name: 'Atendimento Segurança Pública',
      description: 'Workflow para atendimentos gerais de segurança pública',
      defaultSLA: 5,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 1,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento de Segurança',
          order: 2,
          slaDays: 3,
          requiredActions: ['security_service'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 1,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'REGISTRO_OCORRENCIA',
      name: 'Registro de Ocorrência',
      description: 'Workflow emergencial para registro de ocorrência',
      defaultSLA: 1,
      stages: [
        {
          name: 'Registro Inicial',
          order: 1,
          slaDays: 0.5,
          requiredActions: ['initial_registration'],
          canSkip: false
        },
        {
          name: 'Investigação Preliminar',
          order: 2,
          slaDays: 0.5,
          requiredActions: ['preliminary_investigation'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_RONDA',
      name: 'Solicitação de Ronda Preventiva',
      description: 'Workflow para ronda preventiva',
      defaultSLA: 7,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 2,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Planejamento de Ronda',
          order: 2,
          slaDays: 3,
          requiredActions: ['plan_patrol'],
          canSkip: false
        },
        {
          name: 'Execução de Ronda',
          order: 3,
          slaDays: 2,
          requiredActions: ['execute_patrol'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_MONITORAMENTO',
      name: 'Solicitação de Monitoramento por Câmeras',
      description: 'Workflow para monitoramento por câmeras',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'JUSTIFICATIVA'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Análise Técnica',
          order: 2,
          slaDays: 5,
          requiredActions: ['technical_analysis'],
          canSkip: false
        },
        {
          name: 'Decisão Final',
          order: 3,
          slaDays: 2,
          requiredActions: ['final_decision'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_ILUMINACAO_PUBLICA',
      name: 'Solicitação de Melhoria em Iluminação Pública',
      description: 'Workflow para iluminação pública',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 7,
          requiredActions: ['technical_inspection'],
          canSkip: false
        },
        {
          name: 'Execução de Melhoria',
          order: 3,
          slaDays: 5,
          requiredActions: ['execute_improvement'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'CADASTRO_PROGRAMA_VIZINHANCA',
      name: 'Cadastro em Programa de Vizinhança Solidária',
      description: 'Workflow para vizinhança solidária',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Capacitação',
          order: 2,
          slaDays: 5,
          requiredActions: ['training'],
          canSkip: false
        },
        {
          name: 'Ativação no Programa',
          order: 3,
          slaDays: 2,
          requiredActions: ['activate'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_BOLETIM_OCORRENCIA',
      name: 'Solicitação de Cópia de Boletim de Ocorrência',
      description: 'Workflow para cópia de BO',
      defaultSLA: 3,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 1,
          requiredDocuments: ['RG_CPF'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Localização de BO',
          order: 2,
          slaDays: 1,
          requiredActions: ['locate_report'],
          canSkip: false
        },
        {
          name: 'Emissão de Cópia',
          order: 3,
          slaDays: 1,
          requiredActions: ['issue_copy'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'DENUNCIA_ANONIMA',
      name: 'Denúncia Anônima',
      description: 'Workflow para denúncias anônimas',
      defaultSLA: 5,
      stages: [
        {
          name: 'Registro de Denúncia',
          order: 1,
          slaDays: 1,
          requiredActions: ['register_complaint'],
          canSkip: false
        },
        {
          name: 'Verificação e Investigação',
          order: 2,
          slaDays: 3,
          requiredActions: ['investigate'],
          canSkip: false
        },
        {
          name: 'Providências',
          order: 3,
          slaDays: 1,
          requiredActions: ['take_action'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE SERVIÇOS PÚBLICOS (4 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_SERVICOS_PUBLICOS',
      name: 'Atendimento Serviços Públicos',
      description: 'Workflow para atendimentos gerais de serviços públicos',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 2,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento ao Cidadão',
          order: 2,
          slaDays: 6,
          requiredActions: ['citizen_service'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 2,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_SERVICO_MANUTENCAO',
      name: 'Solicitação de Serviço de Manutenção Urbana',
      description: 'Workflow para manutenção urbana',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 7,
          requiredActions: ['technical_inspection'],
          canSkip: false
        },
        {
          name: 'Execução de Manutenção',
          order: 3,
          slaDays: 5,
          requiredActions: ['execute_maintenance'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_PODA_ARVORE',
      name: 'Solicitação de Poda de Árvore em Via Pública',
      description: 'Workflow para poda de árvores',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 7,
          requiredActions: ['technical_inspection'],
          canSkip: false
        },
        {
          name: 'Execução de Poda',
          order: 3,
          slaDays: 5,
          requiredActions: ['execute_pruning'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'SOLICITACAO_LIMPEZA_TERRENO',
      name: 'Solicitação de Limpeza de Terreno Público',
      description: 'Workflow para limpeza de terrenos',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 5,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Vistoria e Notificação do Proprietário',
          order: 2,
          slaDays: 10,
          requiredActions: ['inspection_and_notice'],
          canSkip: false
        },
        {
          name: 'Execução de Limpeza',
          order: 3,
          slaDays: 5,
          requiredActions: ['execute_cleaning'],
          canSkip: false
        },
      ]
    },

    // ========================================
    // SECRETARIA DE TURISMO (3 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_TURISMO',
      name: 'Atendimento Turismo',
      description: 'Workflow para atendimentos gerais de turismo',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 2,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Orientação Turística',
          order: 2,
          slaDays: 6,
          requiredActions: ['tourism_guidance'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 2,
          requiredActions: ['finalize'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'CADASTRO_EMPREENDIMENTO_TURISTICO',
      name: 'Cadastro de Empreendimento Turístico',
      description: 'Workflow para cadastro de empreendimentos turísticos',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['RG_CPF', 'CNPJ', 'ALVARA_FUNCIONAMENTO', 'CADASTUR'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['technical_inspection'],
          canSkip: false
        },
        {
          name: 'Cadastramento',
          order: 3,
          slaDays: 3,
          requiredActions: ['register'],
          canSkip: false
        },
      ]
    },
    {
      moduleType: 'INSCRICAO_EVENTO_TURISTICO',
      name: 'Inscrição em Evento Turístico',
      description: 'Workflow para inscrição em eventos turísticos',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas',
          order: 2,
          slaDays: 4,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 3,
          requiredActions: ['confirm_enrollment'],
          canSkip: false
        },
      ]
    },

  ];
  const created = [];
  for (const workflowData of defaultWorkflows) {
    try {
      const existing = await getWorkflowByModuleType(workflowData.moduleType);
      if (!existing) {
        const workflow = await createWorkflow(workflowData);
        created.push(workflow);
      }
    } catch (error) {
      console.error(`Erro ao criar workflow ${workflowData.moduleType}:`, error);
    }
  }

  return created;
}
