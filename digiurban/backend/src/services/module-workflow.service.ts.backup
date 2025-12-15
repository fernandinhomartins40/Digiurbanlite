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
    // SECRETARIA DE AGRICULTURA (6 workflows)
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

    // ========================================
    // SECRETARIA DE MEIO AMBIENTE (7 workflows)
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
          name: 'Atendimento',
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
      moduleType: 'LICENCA_AMBIENTAL',
      name: 'Licenciamento Ambiental',
      description: 'Workflow para licenças ambientais',
      defaultSLA: 90,
      stages: [
        {
          name: 'Análise de Viabilidade',
          order: 1,
          slaDays: 15,
          requiredDocuments: ['PROJETO_TECNICO'],
          requiredActions: ['viability_analysis'],
          canSkip: false
        },
        {
          name: 'Solicitação de Estudos',
          order: 2,
          slaDays: 30,
          requiredDocuments: ['ESTUDO_IMPACTO'],
          canSkip: false
        },
        {
          name: 'Análise Técnica',
          order: 3,
          slaDays: 30,
          requiredActions: ['technical_review'],
          canSkip: false
        },
        {
          name: 'Decisão Final',
          order: 4,
          slaDays: 15,
          requiredActions: ['approve_or_reject'],
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
          name: 'Análise de Competência',
          order: 1,
          slaDays: 2,
          requiredActions: ['verify_competence'],
          canSkip: false
        },
        {
          name: 'Vistoria Local',
          order: 2,
          slaDays: 5,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Notificação/Auto de Infração',
          order: 3,
          slaDays: 5,
          requiredActions: ['issue_notification'],
          canSkip: true,
          skipCondition: 'no_infraction_found'
        },
        {
          name: 'Acompanhamento',
          order: 4,
          slaDays: 3,
          requiredActions: ['verify_compliance'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'PROGRAMA_AMBIENTAL',
      name: 'Programa Ambiental',
      description: 'Workflow para programas ambientais',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise de Proposta',
          order: 1,
          slaDays: 10,
          requiredDocuments: ['PROPOSTA_PROGRAMA', 'PLANO_ACAO'],
          requiredActions: ['review_proposal'],
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
          name: 'Aprovação',
          order: 3,
          slaDays: 5,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'AUTORIZACAO_PODA_CORTE',
      name: 'Autorização de Poda/Corte',
      description: 'Workflow para autorização de poda ou corte de árvores',
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
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Decisão',
          order: 3,
          slaDays: 5,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'VISTORIA_AMBIENTAL',
      name: 'Vistoria Ambiental',
      description: 'Workflow para vistorias ambientais',
      defaultSLA: 20,
      stages: [
        {
          name: 'Agendamento',
          order: 1,
          slaDays: 5,
          requiredActions: ['schedule_inspection'],
          canSkip: false
        },
        {
          name: 'Execução da Vistoria',
          order: 2,
          slaDays: 10,
          requiredActions: ['complete_inspection'],
          canSkip: false
        },
        {
          name: 'Emissão de Laudo',
          order: 3,
          slaDays: 5,
          requiredActions: ['issue_report'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'GESTAO_AREAS_PROTEGIDAS',
      name: 'Gestão de Áreas Protegidas',
      description: 'Workflow para gestão de áreas protegidas',
      defaultSLA: 30,
      stages: [
        {
          name: 'Cadastro da Área',
          order: 1,
          slaDays: 10,
          requiredDocuments: ['LEVANTAMENTO_AREA', 'MEMORIAL_DESCRITIVO'],
          requiredActions: ['register_area'],
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
          name: 'Aprovação',
          order: 3,
          slaDays: 5,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
        },

    // ========================================
    // SECRETARIA DE EDUCAÇÃO (11 workflows)
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
          name: 'Atendimento',
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
      moduleType: 'MATRICULA_ALUNO',
      name: 'Matrícula de Aluno',
      description: 'Workflow para matrículas escolares',
      defaultSLA: 7,
      stages: [
        {
          name: 'Análise de Documentos',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA', 'HISTORICO_ESCOLAR'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas',
          order: 2,
          slaDays: 2,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Confirmação de Matrícula',
          order: 3,
          slaDays: 3,
          requiredActions: ['confirm_enrollment'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'TRANSPORTE_ESCOLAR',
      name: 'Transporte Escolar',
      description: 'Workflow para solicitação de transporte escolar',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Elegibilidade',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['COMPROVANTE_MATRICULA', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['verify_eligibility'],
          canSkip: false
        },
        {
          name: 'Planejamento de Rota',
          order: 2,
          slaDays: 5,
          requiredActions: ['plan_route'],
          canSkip: false
        },
        {
          name: 'Ativação do Serviço',
          order: 3,
          slaDays: 2,
          requiredActions: ['activate_service'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR',
      name: 'Registro de Ocorrência Escolar',
      description: 'Workflow para registro de ocorrências disciplinares',
      defaultSLA: 7,
      stages: [
        {
          name: 'Registro da Ocorrência',
          order: 1,
          slaDays: 1,
          requiredActions: ['register_occurrence'],
          canSkip: false
        },
        {
          name: 'Análise Pedagógica',
          order: 2,
          slaDays: 4,
          requiredActions: ['pedagogical_analysis'],
          canSkip: false
        },
        {
          name: 'Resolução',
          order: 3,
          slaDays: 2,
          requiredActions: ['resolve_occurrence'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR',
      name: 'Solicitação de Documento Escolar',
      description: 'Workflow para solicitação de documentos escolares',
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
          name: 'Preparação de Documento',
          order: 2,
          slaDays: 6,
          requiredActions: ['prepare_document'],
          canSkip: false
        },
        {
          name: 'Emissão',
          order: 3,
          slaDays: 2,
          requiredActions: ['issue_document'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'TRANSFERENCIA_ESCOLAR',
      name: 'Transferência Escolar',
      description: 'Workflow para transferência entre escolas',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['HISTORICO_ESCOLAR', 'DECLARACAO_TRANSFERENCIA'],
          requiredActions: ['review_request'],
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
          name: 'Efetivação da Transferência',
          order: 3,
          slaDays: 5,
          requiredActions: ['complete_transfer'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'CONSULTA_FREQUENCIA',
      name: 'Consulta de Frequência',
      description: 'Workflow para consulta de frequência escolar',
      defaultSLA: 3,
      stages: [
        {
          name: 'Solicitação',
          order: 1,
          slaDays: 1,
          requiredActions: ['request_attendance'],
          canSkip: false
        },
        {
          name: 'Emissão',
          order: 2,
          slaDays: 2,
          requiredActions: ['issue_report'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'CONSULTA_NOTAS',
      name: 'Consulta de Notas',
      description: 'Workflow para consulta de notas',
      defaultSLA: 3,
      stages: [
        {
          name: 'Solicitação',
          order: 1,
          slaDays: 1,
          requiredActions: ['request_grades'],
          canSkip: false
        },
        {
          name: 'Emissão',
          order: 2,
          slaDays: 2,
          requiredActions: ['issue_report'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'GESTAO_ESCOLAR',
      name: 'Gestão Escolar',
      description: 'Workflow para gestão de unidades escolares',
      defaultSLA: 20,
      stages: [
        {
          name: 'Cadastro Inicial',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['DOCUMENTACAO_ESCOLA'],
          requiredActions: ['initial_registration'],
          canSkip: false
        },
        {
          name: 'Vistoria',
          order: 2,
          slaDays: 10,
          requiredActions: ['inspection'],
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
      moduleType: 'GESTAO_MERENDA',
      name: 'Gestão de Merenda Escolar',
      description: 'Workflow para planejamento de merenda',
      defaultSLA: 15,
      stages: [
        {
          name: 'Planejamento de Cardápio',
          order: 1,
          slaDays: 7,
          requiredActions: ['plan_menu'],
          canSkip: false
        },
        {
          name: 'Aprovação Nutricional',
          order: 2,
          slaDays: 5,
          requiredActions: ['nutritional_approval'],
          canSkip: false
        },
        {
          name: 'Implementação',
          order: 3,
          slaDays: 3,
          requiredActions: ['implement_menu'],
          canSkip: false
        },
      ]
        },

    // ========================================
    // SECRETARIA DE SAÚDE
    // ========================================
    {
      moduleType: 'AGENDAMENTOS_MEDICOS',
      name: 'Agendamento de Consulta Médica',
      description: 'Workflow para agendamento de consultas médicas',
      defaultSLA: 5,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 1,
          requiredActions: ['triage'],
          canSkip: false
        },
        {
          name: 'Agendamento',
          order: 2,
          slaDays: 3,
          requiredActions: ['schedule_appointment'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 1,
          requiredActions: ['confirm_appointment'],
          canSkip: false
        },
      ]
        },

    // ========================================
    // RESTANTE DOS SERVIÇOS DE SAÚDE (9 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_SAUDE',
      name: 'Atendimento de Saúde',
      description: 'Workflow para atendimentos gerais de saúde',
      defaultSLA: 7,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 1,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento',
          order: 2,
          slaDays: 5,
          requiredActions: ['complete_attendance'],
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
      moduleType: 'CONTROLE_MEDICAMENTOS',
      name: 'Dispensação de Medicamentos',
      description: 'Workflow para controle e dispensação de medicamentos',
      defaultSLA: 3,
      stages: [
        {
          name: 'Validação de Receita',
          order: 1,
          slaDays: 1,
          requiredDocuments: ['RECEITA_MEDICA'],
          requiredActions: ['validate_prescription'],
          canSkip: false
        },
        {
          name: 'Separação de Medicamentos',
          order: 2,
          slaDays: 1,
          requiredActions: ['separate_medication'],
          canSkip: false
        },
        {
          name: 'Dispensação',
          order: 3,
          slaDays: 1,
          requiredActions: ['dispense_medication'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'CAMPANHAS_SAUDE',
      name: 'Campanha de Saúde',
      description: 'Workflow para inscrição em campanhas de saúde',
      defaultSLA: 7,
      stages: [
        {
          name: 'Inscrição',
          order: 1,
          slaDays: 2,
          requiredActions: ['register_participant'],
          canSkip: false
        },
        {
          name: 'Agendamento',
          order: 2,
          slaDays: 3,
          requiredActions: ['schedule_participation'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 2,
          requiredActions: ['confirm_participation'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'PROGRAMAS_SAUDE',
      name: 'Programa de Saúde',
      description: 'Workflow para inscrição em programas de saúde',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Elegibilidade',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['verify_eligibility'],
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
          name: 'Aprovação',
          order: 3,
          slaDays: 3,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'ENCAMINHAMENTOS_TFD',
      name: 'Encaminhamento TFD (Tratamento Fora de Domicílio)',
      description: 'Workflow para encaminhamentos de TFD',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['SOLICITACAO_MEDICA', 'EXAMES'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Autorização Médica',
          order: 2,
          slaDays: 7,
          requiredActions: ['medical_authorization'],
          canSkip: false
        },
        {
          name: 'Agendamento',
          order: 3,
          slaDays: 5,
          requiredActions: ['schedule_transport'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'EXAMES',
      name: 'Solicitação de Exame',
      description: 'Workflow para solicitação de exames médicos',
      defaultSLA: 30,
      stages: [
        {
          name: 'Validação de Solicitação',
          order: 1,
          slaDays: 3,
          requiredDocuments: ['SOLICITACAO_MEDICA'],
          requiredActions: ['validate_request'],
          canSkip: false
        },
        {
          name: 'Agendamento',
          order: 2,
          slaDays: 20,
          requiredActions: ['schedule_exam'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 7,
          requiredActions: ['confirm_exam'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'TRANSPORTE_PACIENTES',
      name: 'Transporte de Pacientes',
      description: 'Workflow para transporte de pacientes',
      defaultSLA: 7,
      stages: [
        {
          name: 'Análise de Solicitação',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['JUSTIFICATIVA_MEDICA'],
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Agendamento de Transporte',
          order: 2,
          slaDays: 3,
          requiredActions: ['schedule_transport'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 2,
          requiredActions: ['confirm_transport'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'VACINACAO',
      name: 'Vacinação',
      description: 'Workflow para registro de vacinação',
      defaultSLA: 3,
      stages: [
        {
          name: 'Verificação de Elegibilidade',
          order: 1,
          slaDays: 1,
          requiredActions: ['verify_eligibility'],
          canSkip: false
        },
        {
          name: 'Aplicação da Vacina',
          order: 2,
          slaDays: 1,
          requiredActions: ['apply_vaccine'],
          canSkip: false
        },
        {
          name: 'Registro',
          order: 3,
          slaDays: 1,
          requiredActions: ['register_vaccination'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'CADASTRO_PACIENTE',
      name: 'Cadastro de Paciente',
      description: 'Workflow para cadastro de novos pacientes',
      defaultSLA: 5,
      stages: [
        {
          name: 'Análise de Documentos',
          order: 1,
          slaDays: 2,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA', 'CARTAO_SUS'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Cadastro no Sistema',
          order: 2,
          slaDays: 2,
          requiredActions: ['register_patient'],
          canSkip: false
        },
        {
          name: 'Ativação',
          order: 3,
          slaDays: 1,
          requiredActions: ['activate_patient'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'GESTAO_ACS',
      name: 'Gestão de Agente Comunitário de Saúde',
      description: 'Workflow para cadastro de ACS',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'CERTIFICADO_CURSO', 'COMPROVANTE_RESIDENCIA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Técnica',
          order: 2,
          slaDays: 7,
          requiredActions: ['technical_evaluation'],
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

    // ========================================
    // SECRETARIA DE ASSISTÊNCIA SOCIAL (9 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
      name: 'Atendimento de Assistência Social',
      description: 'Workflow para atendimentos gerais de assistência social',
      defaultSLA: 10,
      stages: [
        {
          name: 'Acolhimento',
          order: 1,
          slaDays: 2,
          requiredActions: ['initial_reception'],
          canSkip: false
        },
        {
          name: 'Atendimento Social',
          order: 2,
          slaDays: 6,
          requiredActions: ['complete_attendance'],
          canSkip: false
        },
        {
          name: 'Encaminhamento',
          order: 3,
          slaDays: 2,
          requiredActions: ['referral'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'CADASTRO_UNICO',
      name: 'Cadastro Único (Família Vulnerável)',
      description: 'Workflow para cadastro de famílias em situação de vulnerabilidade',
      defaultSLA: 15,
      stages: [
        {
          name: 'Entrevista Social',
          order: 1,
          slaDays: 5,
          requiredActions: ['conduct_interview'],
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
          name: 'Análise Técnica',
          order: 3,
          slaDays: 3,
          requiredActions: ['analyze_case', 'approve_or_reject'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'SOLICITACAO_BENEFICIO',
      name: 'Solicitação de Benefício Social',
      description: 'Workflow para solicitação de benefícios sociais',
      defaultSLA: 20,
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
          name: 'Visita Social',
          order: 2,
          slaDays: 10,
          requiredActions: ['schedule_visit', 'complete_visit'],
          canSkip: false
        },
        {
          name: 'Parecer Técnico',
          order: 3,
          slaDays: 5,
          requiredActions: ['technical_opinion', 'approve_or_reject'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'ENTREGA_EMERGENCIAL',
      name: 'Entrega Emergencial',
      description: 'Workflow para entregas emergenciais',
      defaultSLA: 3,
      stages: [
        {
          name: 'Análise de Urgência',
          order: 1,
          slaDays: 1,
          requiredActions: ['evaluate_urgency'],
          canSkip: false
        },
        {
          name: 'Aprovação',
          order: 2,
          slaDays: 1,
          requiredActions: ['approve_delivery'],
          canSkip: false
        },
        {
          name: 'Entrega',
          order: 3,
          slaDays: 1,
          requiredActions: ['complete_delivery'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'INSCRICAO_GRUPO_OFICINA',
      name: 'Inscrição em Grupo/Oficina Social',
      description: 'Workflow para inscrição em grupos e oficinas',
      defaultSLA: 7,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 2,
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Verificação de Vagas',
          order: 2,
          slaDays: 3,
          requiredActions: ['check_vacancy'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 2,
          requiredActions: ['confirm_enrollment'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'VISITAS_DOMICILIARES',
      name: 'Visita Domiciliar',
      description: 'Workflow para visitas domiciliares',
      defaultSLA: 10,
      stages: [
        {
          name: 'Agendamento',
          order: 1,
          slaDays: 3,
          requiredActions: ['schedule_visit'],
          canSkip: false
        },
        {
          name: 'Realização da Visita',
          order: 2,
          slaDays: 5,
          requiredActions: ['complete_visit'],
          canSkip: false
        },
        {
          name: 'Relatório',
          order: 3,
          slaDays: 2,
          requiredActions: ['submit_report'],
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
          name: 'Avaliação Social',
          order: 2,
          slaDays: 7,
          requiredActions: ['social_evaluation'],
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
      moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL',
      name: 'Agendamento de Atendimento Social',
      description: 'Workflow para agendamento de atendimentos',
      defaultSLA: 5,
      stages: [
        {
          name: 'Solicitação',
          order: 1,
          slaDays: 1,
          requiredActions: ['request_appointment'],
          canSkip: false
        },
        {
          name: 'Agendamento',
          order: 2,
          slaDays: 3,
          requiredActions: ['schedule_appointment'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 1,
          requiredActions: ['confirm_appointment'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'GESTAO_CRAS_CREAS',
      name: 'Gestão de CRAS/CREAS',
      description: 'Workflow para gestão de equipamentos sociais',
      defaultSLA: 20,
      stages: [
        {
          name: 'Cadastro',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['DOCUMENTACAO_EQUIPAMENTO'],
          requiredActions: ['register_equipment'],
          canSkip: false
        },
        {
          name: 'Vistoria',
          order: 2,
          slaDays: 10,
          requiredActions: ['inspection'],
          canSkip: false
        },
        {
          name: 'Ativação',
          order: 3,
          slaDays: 3,
          requiredActions: ['activate_equipment'],
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
          name: 'Atendimento',
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
      moduleType: 'RESERVA_ESPACO_CULTURAL',
      name: 'Reserva de Espaço Cultural',
      description: 'Workflow para reserva de espaços culturais',
      defaultSLA: 7,
      stages: [
        {
          name: 'Análise de Disponibilidade',
          order: 1,
          slaDays: 2,
          requiredActions: ['check_availability'],
          canSkip: false
        },
        {
          name: 'Aprovação',
          order: 2,
          slaDays: 3,
          requiredActions: ['approve_reservation'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 2,
          requiredActions: ['confirm_reservation'],
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
      moduleType: 'CADASTRO_GRUPO_ARTISTICO',
      name: 'Cadastro de Grupo Artístico',
      description: 'Workflow para cadastro de grupos artísticos',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['DOCUMENTACAO_GRUPO', 'PORTFOLIO'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Técnica',
          order: 2,
          slaDays: 7,
          requiredActions: ['technical_evaluation'],
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
      moduleType: 'SUBMISSAO_PROJETO_CULTURAL',
      name: 'Submissão de Projeto Cultural',
      description: 'Workflow para submissão de projetos culturais',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise de Admissibilidade',
          order: 1,
          slaDays: 10,
          requiredDocuments: ['PROJETO', 'ORCAMENTO', 'PORTFOLIO'],
          requiredActions: ['verify_admissibility'],
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
          name: 'Decisão',
          order: 3,
          slaDays: 5,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'CADASTRO_EVENTO_CULTURAL',
      name: 'Cadastro de Evento Cultural',
      description: 'Workflow para cadastro de eventos culturais',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Proposta',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['PROJETO_EVENTO', 'CRONOGRAMA'],
          requiredActions: ['review_proposal'],
          canSkip: false
        },
        {
          name: 'Avaliação de Viabilidade',
          order: 2,
          slaDays: 7,
          requiredActions: ['viability_analysis'],
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
      moduleType: 'REGISTRO_MANIFESTACAO_CULTURAL',
      name: 'Registro de Manifestação Cultural',
      description: 'Workflow para registro de manifestações culturais',
      defaultSLA: 20,
      stages: [
        {
          name: 'Documentação',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['DESCRICAO_MANIFESTACAO', 'DOCUMENTACAO_HISTORICA'],
          requiredActions: ['document_manifestation'],
          canSkip: false
        },
        {
          name: 'Análise Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['technical_analysis'],
          canSkip: false
        },
        {
          name: 'Registro',
          order: 3,
          slaDays: 3,
          requiredActions: ['register_manifestation'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'PROJETO_CULTURAL',
      name: 'Projeto Cultural (Lei de Incentivo)',
      description: 'Workflow para projetos culturais via lei de incentivo',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise de Admissibilidade',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['PROJETO', 'ORCAMENTO', 'PORTFOLIO'],
          requiredActions: ['verify_admissibility'],
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
          name: 'Decisão',
          order: 3,
          slaDays: 8,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
        },

    // ========================================
    // SECRETARIA DE ESPORTES (10 workflows)
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
          name: 'Atendimento',
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
      moduleType: 'CADASTRO_ATLETA',
      name: 'Cadastro de Atleta',
      description: 'Workflow para cadastro de atletas',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'ATESTADO_MEDICO', 'FOTO'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Física',
          order: 2,
          slaDays: 7,
          requiredActions: ['physical_evaluation'],
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
      moduleType: 'INSCRICAO_ESCOLINHA',
      name: 'Inscrição em Escolinha Esportiva',
      description: 'Workflow para inscrição em escolinhas esportivas',
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
      moduleType: 'INSCRICAO_COMPETICAO',
      name: 'Inscrição em Competição',
      description: 'Workflow para inscrição em competições esportivas',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Elegibilidade',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['FICHA_INSCRICAO', 'ATESTADO_MEDICO'],
          requiredActions: ['verify_eligibility'],
          canSkip: false
        },
        {
          name: 'Verificação de Categorias',
          order: 2,
          slaDays: 7,
          requiredActions: ['check_category'],
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
      moduleType: 'CADASTRO_EQUIPE_ESPORTIVA',
      name: 'Cadastro de Equipe Esportiva',
      description: 'Workflow para cadastro de equipes esportivas',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['LISTA_ATLETAS', 'DOCUMENTACAO_EQUIPE'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Validação de Atletas',
          order: 2,
          slaDays: 7,
          requiredActions: ['validate_athletes'],
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
      moduleType: 'INSCRICAO_TORNEIO',
      name: 'Inscrição em Torneio',
      description: 'Workflow para inscrição em torneios',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Inscrição',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['FICHA_INSCRICAO_EQUIPE'],
          requiredActions: ['review_enrollment'],
          canSkip: false
        },
        {
          name: 'Verificação de Requisitos',
          order: 2,
          slaDays: 7,
          requiredActions: ['verify_requirements'],
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
      moduleType: 'CADASTRO_MODALIDADE',
      name: 'Cadastro de Modalidade Esportiva',
      description: 'Workflow para cadastro de novas modalidades',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise de Proposta',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['PROPOSTA_MODALIDADE', 'REGULAMENTO'],
          requiredActions: ['review_proposal'],
          canSkip: false
        },
        {
          name: 'Avaliação de Viabilidade',
          order: 2,
          slaDays: 10,
          requiredActions: ['viability_analysis'],
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
      moduleType: 'RESERVA_ESPACO_ESPORTIVO',
      name: 'Reserva de Espaço Esportivo',
      description: 'Workflow para reserva de espaços esportivos',
      defaultSLA: 5,
      stages: [
        {
          name: 'Análise de Disponibilidade',
          order: 1,
          slaDays: 1,
          requiredActions: ['check_availability'],
          canSkip: false
        },
        {
          name: 'Aprovação',
          order: 2,
          slaDays: 2,
          requiredActions: ['approve_reservation'],
          canSkip: false
        },
        {
          name: 'Confirmação',
          order: 3,
          slaDays: 2,
          requiredActions: ['confirm_reservation'],
          canSkip: false
        },
      ]
        },

    // ========================================
    // SECRETARIA DE HABITAÇÃO (7 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_HABITACAO',
      name: 'Atendimento Habitação',
      description: 'Workflow para atendimentos gerais de habitação',
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
          name: 'Atendimento',
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
      moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL',
      name: 'Inscrição em Programa Habitacional',
      description: 'Workflow para inscrição em programas habitacionais',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA', 'COMPROVANTE_RENDA'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Visita Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['schedule_visit', 'complete_visit'],
          canSkip: false
        },
        {
          name: 'Classificação',
          order: 3,
          slaDays: 5,
          requiredActions: ['classify_applicant'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'REGULARIZACAO_FUNDIARIA',
      name: 'Regularização Fundiária',
      description: 'Workflow para regularização fundiária',
      defaultSLA: 90,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 30,
          requiredDocuments: ['DOCUMENTOS_IMOVEL', 'CERTIDOES'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Levantamento Topográfico',
          order: 2,
          slaDays: 40,
          requiredActions: ['topographic_survey'],
          canSkip: false
        },
        {
          name: 'Regularização',
          order: 3,
          slaDays: 20,
          requiredActions: ['complete_regularization'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'SOLICITACAO_AUXILIO_ALUGUEL',
      name: 'Solicitação de Auxílio Aluguel',
      description: 'Workflow para solicitação de auxílio aluguel',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise de Elegibilidade',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['RG_CPF', 'COMPROVANTE_RENDA', 'CONTRATO_ALUGUEL'],
          requiredActions: ['verify_eligibility'],
          canSkip: false
        },
        {
          name: 'Visita Social',
          order: 2,
          slaDays: 10,
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
      moduleType: 'CADASTRO_UNIDADE_HABITACIONAL',
      name: 'Cadastro de Unidade Habitacional',
      description: 'Workflow para cadastro de unidades habitacionais',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 10,
          requiredDocuments: ['PROJETO', 'APROVACAO_PREFEITURA', 'HABITE_SE'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 15,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Cadastro',
          order: 3,
          slaDays: 5,
          requiredActions: ['register_unit'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'INSCRICAO_FILA_HABITACAO',
      name: 'Inscrição em Fila de Habitação',
      description: 'Workflow para inscrição em fila de habitação',
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
          name: 'Análise Socioeconômica',
          order: 2,
          slaDays: 7,
          requiredActions: ['socioeconomic_analysis'],
          canSkip: false
        },
        {
          name: 'Classificação',
          order: 3,
          slaDays: 3,
          requiredActions: ['classify_applicant'],
          canSkip: false
        },
      ]
        },

    // ========================================
    // SECRETARIA DE OBRAS PÚBLICAS (7 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_OBRAS',
      name: 'Atendimento Obras Públicas',
      description: 'Workflow para atendimentos gerais de obras públicas',
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
          name: 'Atendimento',
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
      moduleType: 'SOLICITACAO_OBRA_PUBLICA',
      name: 'Solicitação de Obra Pública',
      description: 'Workflow para solicitações de obras públicas',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise de Competência',
          order: 1,
          slaDays: 3,
          requiredActions: ['verify_competence'],
          canSkip: false
        },
        {
          name: 'Vistoria Local',
          order: 2,
          slaDays: 7,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Planejamento',
          order: 3,
          slaDays: 15,
          requiredActions: ['create_plan', 'estimate_cost'],
          canSkip: false
        },
        {
          name: 'Aprovação',
          order: 4,
          slaDays: 5,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'SOLICITACAO_REPARO_VIA',
      name: 'Solicitação de Reparo de Via',
      description: 'Workflow para solicitação de reparos em vias públicas',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise da Solicitação',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Execução do Reparo',
          order: 3,
          slaDays: 7,
          requiredActions: ['execute_repair'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'VISTORIA_TECNICA_OBRAS',
      name: 'Vistoria Técnica de Obras',
      description: 'Workflow para vistorias técnicas de obras',
      defaultSLA: 15,
      stages: [
        {
          name: 'Agendamento',
          order: 1,
          slaDays: 5,
          requiredActions: ['schedule_inspection'],
          canSkip: false
        },
        {
          name: 'Execução da Vistoria',
          order: 2,
          slaDays: 7,
          requiredActions: ['complete_inspection'],
          canSkip: false
        },
        {
          name: 'Emissão de Laudo',
          order: 3,
          slaDays: 3,
          requiredActions: ['issue_report'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'CADASTRO_OBRA_PUBLICA',
      name: 'Cadastro de Obra Pública',
      description: 'Workflow para cadastro de obras públicas',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['PROJETO', 'ORCAMENTO', 'LICENCAS'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Análise Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['technical_analysis'],
          canSkip: false
        },
        {
          name: 'Cadastro',
          order: 3,
          slaDays: 3,
          requiredActions: ['register_work'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'INSPECAO_OBRA',
      name: 'Inspeção de Obra',
      description: 'Workflow para inspeções de obras em andamento',
      defaultSLA: 10,
      stages: [
        {
          name: 'Agendamento',
          order: 1,
          slaDays: 2,
          requiredActions: ['schedule_inspection'],
          canSkip: false
        },
        {
          name: 'Inspeção',
          order: 2,
          slaDays: 5,
          requiredActions: ['complete_inspection'],
          canSkip: false
        },
        {
          name: 'Relatório',
          order: 3,
          slaDays: 3,
          requiredActions: ['issue_report'],
          canSkip: false
        },
      ]
        },

    // ========================================
    // SECRETARIA DE PLANEJAMENTO URBANO (9 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_PLANEJAMENTO',
      name: 'Atendimento Planejamento Urbano',
      description: 'Workflow para atendimentos gerais de planejamento urbano',
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
          name: 'Atendimento',
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
      moduleType: 'ALVARA_CONSTRUCAO',
      name: 'Alvará de Construção',
      description: 'Workflow para alvará de construção',
      defaultSLA: 45,
      stages: [
        {
          name: 'Análise de Projeto',
          order: 1,
          slaDays: 15,
          requiredDocuments: ['PROJETO_ARQUITETONICO', 'ART', 'MATRICULA_IMOVEL'],
          requiredActions: ['analyze_project'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 15,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Parecer Técnico',
          order: 3,
          slaDays: 10,
          requiredActions: ['technical_opinion', 'approve_or_reject'],
          canSkip: false
        },
        {
          name: 'Emissão do Alvará',
          order: 4,
          slaDays: 5,
          requiredActions: ['issue_license'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'APROVACAO_PROJETO',
      name: 'Aprovação de Projeto',
      description: 'Workflow para aprovação de projetos urbanísticos',
      defaultSLA: 40,
      stages: [
        {
          name: 'Análise Preliminar',
          order: 1,
          slaDays: 10,
          requiredDocuments: ['PROJETO', 'MEMORIAL_DESCRITIVO'],
          requiredActions: ['preliminary_analysis'],
          canSkip: false
        },
        {
          name: 'Análise Técnica',
          order: 2,
          slaDays: 20,
          requiredActions: ['technical_review'],
          canSkip: false
        },
        {
          name: 'Aprovação',
          order: 3,
          slaDays: 10,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'ALVARA_FUNCIONAMENTO',
      name: 'Alvará de Funcionamento',
      description: 'Workflow para alvará de funcionamento',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 10,
          requiredDocuments: ['CNPJ', 'CONTRATO_SOCIAL', 'COMPROVANTE_ENDERECO'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Vistoria do Local',
          order: 2,
          slaDays: 15,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Emissão',
          order: 3,
          slaDays: 5,
          requiredActions: ['issue_license'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'SOLICITACAO_CERTIDAO',
      name: 'Solicitação de Certidão',
      description: 'Workflow para solicitação de certidões urbanísticas',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise da Solicitação',
          order: 1,
          slaDays: 5,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Elaboração',
          order: 2,
          slaDays: 7,
          requiredActions: ['prepare_certificate'],
          canSkip: false
        },
        {
          name: 'Emissão',
          order: 3,
          slaDays: 3,
          requiredActions: ['issue_certificate'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR',
      name: 'Denúncia de Construção Irregular',
      description: 'Workflow para denúncias de construções irregulares',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise da Denúncia',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_complaint'],
          canSkip: false
        },
        {
          name: 'Vistoria',
          order: 2,
          slaDays: 10,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Notificação/Auto de Infração',
          order: 3,
          slaDays: 7,
          requiredActions: ['issue_notification'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'CADASTRO_LOTEAMENTO',
      name: 'Cadastro de Loteamento',
      description: 'Workflow para cadastro de loteamentos',
      defaultSLA: 60,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 20,
          requiredDocuments: ['PROJETO_LOTEAMENTO', 'MATRICULA', 'CERTIDOES'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Análise Técnica',
          order: 2,
          slaDays: 30,
          requiredActions: ['technical_review'],
          canSkip: false
        },
        {
          name: 'Aprovação',
          order: 3,
          slaDays: 10,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
        },

    // ========================================
    // SECRETARIA DE SERVIÇOS PÚBLICOS (9 workflows)
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
          name: 'Atendimento',
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
      moduleType: 'SOLICITACAO_PODA',
      name: 'Solicitação de Poda de Árvore',
      description: 'Workflow para solicitação de poda de árvore',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise do Pedido',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Vistoria',
          order: 2,
          slaDays: 7,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Execução',
          order: 3,
          slaDays: 5,
          requiredActions: ['execute_service'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'ILUMINACAO_PUBLICA',
      name: 'Solicitação de Iluminação Pública',
      description: 'Workflow para solicitação de iluminação pública',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise da Solicitação',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 7,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Execução',
          order: 3,
          slaDays: 5,
          requiredActions: ['execute_service'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'LIMPEZA_URBANA',
      name: 'Solicitação de Limpeza Urbana',
      description: 'Workflow para solicitação de limpeza urbana',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 2,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Programação',
          order: 2,
          slaDays: 5,
          requiredActions: ['schedule_service'],
          canSkip: false
        },
        {
          name: 'Execução',
          order: 3,
          slaDays: 3,
          requiredActions: ['execute_service'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'COLETA_ESPECIAL',
      name: 'Coleta Especial',
      description: 'Workflow para coleta especial de resíduos',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise da Solicitação',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Agendamento',
          order: 2,
          slaDays: 7,
          requiredActions: ['schedule_collection'],
          canSkip: false
        },
        {
          name: 'Execução',
          order: 3,
          slaDays: 5,
          requiredActions: ['execute_collection'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'SOLICITACAO_CAPINA',
      name: 'Solicitação de Capina',
      description: 'Workflow para solicitação de capina',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise da Solicitação',
          order: 1,
          slaDays: 3,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Vistoria',
          order: 2,
          slaDays: 7,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Execução',
          order: 3,
          slaDays: 5,
          requiredActions: ['execute_service'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'SOLICITACAO_DESOBSTRUCAO',
      name: 'Solicitação de Desobstrução',
      description: 'Workflow para solicitação de desobstrução',
      defaultSLA: 10,
      stages: [
        {
          name: 'Análise de Urgência',
          order: 1,
          slaDays: 2,
          requiredActions: ['evaluate_urgency'],
          canSkip: false
        },
        {
          name: 'Vistoria',
          order: 2,
          slaDays: 5,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Execução',
          order: 3,
          slaDays: 3,
          requiredActions: ['execute_service'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'GESTAO_EQUIPES_SERVICOS',
      name: 'Gestão de Equipes de Serviços',
      description: 'Workflow para gestão de equipes de serviços',
      defaultSLA: 20,
      stages: [
        {
          name: 'Cadastro',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['DOCUMENTACAO_EQUIPE'],
          requiredActions: ['register_team'],
          canSkip: false
        },
        {
          name: 'Validação',
          order: 2,
          slaDays: 10,
          requiredActions: ['validate_team'],
          canSkip: false
        },
        {
          name: 'Ativação',
          order: 3,
          slaDays: 3,
          requiredActions: ['activate_team'],
          canSkip: false
        },
      ]
        },

    // ========================================
    // SECRETARIA DE TURISMO (8 workflows)
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
          name: 'Atendimento',
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
      moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO',
      name: 'Cadastro de Estabelecimento Turístico',
      description: 'Workflow para cadastro de estabelecimentos turísticos',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['CNPJ', 'ALVARA_FUNCIONAMENTO', 'CERTIDOES'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Vistoria do Estabelecimento',
          order: 2,
          slaDays: 7,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
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
      moduleType: 'CADASTRO_GUIA_TURISTICO',
      name: 'Cadastro de Guia Turístico',
      description: 'Workflow para cadastro de guias turísticos',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Documental',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['RG_CPF', 'CERTIFICADO_CURSO', 'CADASTUR'],
          requiredActions: ['validate_documents'],
          canSkip: false
        },
        {
          name: 'Avaliação Técnica',
          order: 2,
          slaDays: 7,
          requiredActions: ['technical_evaluation'],
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
      moduleType: 'INSCRICAO_PROGRAMA_TURISTICO',
      name: 'Inscrição em Programa Turístico',
      description: 'Workflow para inscrição em programas turísticos',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise de Elegibilidade',
          order: 1,
          slaDays: 5,
          requiredDocuments: ['DOCUMENTACAO_SOLICITANTE'],
          requiredActions: ['verify_eligibility'],
          canSkip: false
        },
        {
          name: 'Avaliação',
          order: 2,
          slaDays: 7,
          requiredActions: ['program_evaluation'],
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
      moduleType: 'REGISTRO_ATRATIVO_TURISTICO',
      name: 'Registro de Atrativo Turístico',
      description: 'Workflow para registro de atrativos turísticos',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise de Proposta',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['DESCRICAO_ATRATIVO', 'FOTOS', 'LOCALIZACAO'],
          requiredActions: ['review_proposal'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Registro',
          order: 3,
          slaDays: 3,
          requiredActions: ['register_attraction'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'CADASTRO_ROTEIRO_TURISTICO',
      name: 'Cadastro de Roteiro Turístico',
      description: 'Workflow para cadastro de roteiros turísticos',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise de Proposta',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['DESCRICAO_ROTEIRO', 'MAPA', 'CRONOGRAMA'],
          requiredActions: ['review_proposal'],
          canSkip: false
        },
        {
          name: 'Validação Técnica',
          order: 2,
          slaDays: 10,
          requiredActions: ['technical_validation'],
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
      moduleType: 'CADASTRO_EVENTO_TURISTICO',
      name: 'Cadastro de Evento Turístico',
      description: 'Workflow para cadastro de eventos turísticos',
      defaultSLA: 20,
      stages: [
        {
          name: 'Análise de Proposta',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['PROJETO_EVENTO', 'CRONOGRAMA', 'ORCAMENTO'],
          requiredActions: ['review_proposal'],
          canSkip: false
        },
        {
          name: 'Avaliação de Viabilidade',
          order: 2,
          slaDays: 10,
          requiredActions: ['viability_analysis'],
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

    // ========================================
    // SECRETARIA DE SEGURANÇA PÚBLICA (11 workflows)
    // ========================================
    {
      moduleType: 'ATENDIMENTOS_SEGURANCA',
      name: 'Atendimento Segurança Pública',
      description: 'Workflow para atendimentos gerais de segurança pública',
      defaultSLA: 7,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 1,
          requiredActions: ['initial_triage'],
          canSkip: false
        },
        {
          name: 'Atendimento',
          order: 2,
          slaDays: 4,
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
      moduleType: 'REGISTRO_OCORRENCIA',
      name: 'Registro de Ocorrência de Segurança',
      description: 'Workflow para registro de ocorrências de segurança',
      defaultSLA: 7,
      stages: [
        {
          name: 'Registro da Ocorrência',
          order: 1,
          slaDays: 1,
          requiredActions: ['register_occurrence'],
          canSkip: false
        },
        {
          name: 'Atendimento',
          order: 2,
          slaDays: 3,
          requiredActions: ['respond_occurrence'],
          canSkip: false
        },
        {
          name: 'Encerramento',
          order: 3,
          slaDays: 3,
          requiredActions: ['close_occurrence'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'SOLICITACAO_RONDA',
      name: 'Solicitação de Ronda',
      description: 'Workflow para solicitação de ronda preventiva',
      defaultSLA: 5,
      stages: [
        {
          name: 'Análise da Solicitação',
          order: 1,
          slaDays: 1,
          requiredActions: ['review_request'],
          canSkip: false
        },
        {
          name: 'Programação',
          order: 2,
          slaDays: 2,
          requiredActions: ['schedule_patrol'],
          canSkip: false
        },
        {
          name: 'Execução',
          order: 3,
          slaDays: 2,
          requiredActions: ['execute_patrol'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'SOLICITACAO_CAMERA_SEGURANCA',
      name: 'Solicitação de Câmera de Segurança',
      description: 'Workflow para solicitação de instalação de câmeras',
      defaultSLA: 30,
      stages: [
        {
          name: 'Análise de Viabilidade',
          order: 1,
          slaDays: 10,
          requiredActions: ['viability_analysis'],
          canSkip: false
        },
        {
          name: 'Vistoria Técnica',
          order: 2,
          slaDays: 15,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Aprovação',
          order: 3,
          slaDays: 5,
          requiredActions: ['approve_or_reject'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'DENUNCIA_ANONIMA',
      name: 'Denúncia Anônima',
      description: 'Workflow para denúncias anônimas',
      defaultSLA: 10,
      stages: [
        {
          name: 'Triagem',
          order: 1,
          slaDays: 2,
          requiredActions: ['triage_complaint'],
          canSkip: false
        },
        {
          name: 'Investigação Preliminar',
          order: 2,
          slaDays: 5,
          requiredActions: ['preliminary_investigation'],
          canSkip: false
        },
        {
          name: 'Encaminhamento',
          order: 3,
          slaDays: 3,
          requiredActions: ['forward_complaint'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'CADASTRO_PONTO_CRITICO',
      name: 'Cadastro de Ponto Crítico',
      description: 'Workflow para cadastro de pontos críticos de segurança',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise da Indicação',
          order: 1,
          slaDays: 5,
          requiredActions: ['review_indication'],
          canSkip: false
        },
        {
          name: 'Vistoria Local',
          order: 2,
          slaDays: 7,
          requiredActions: ['schedule_inspection', 'complete_inspection'],
          canSkip: false
        },
        {
          name: 'Cadastro',
          order: 3,
          slaDays: 3,
          requiredActions: ['register_critical_point'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'ALERTA_SEGURANCA',
      name: 'Alerta de Segurança',
      description: 'Workflow para alertas de segurança',
      defaultSLA: 3,
      stages: [
        {
          name: 'Validação',
          order: 1,
          slaDays: 1,
          requiredActions: ['validate_alert'],
          canSkip: false
        },
        {
          name: 'Divulgação',
          order: 2,
          slaDays: 1,
          requiredActions: ['broadcast_alert'],
          canSkip: false
        },
        {
          name: 'Monitoramento',
          order: 3,
          slaDays: 1,
          requiredActions: ['monitor_alert'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'REGISTRO_PATRULHA',
      name: 'Registro de Patrulha',
      description: 'Workflow para registro de patrulhas realizadas',
      defaultSLA: 5,
      stages: [
        {
          name: 'Registro',
          order: 1,
          slaDays: 1,
          requiredActions: ['register_patrol'],
          canSkip: false
        },
        {
          name: 'Validação',
          order: 2,
          slaDays: 2,
          requiredActions: ['validate_patrol'],
          canSkip: false
        },
        {
          name: 'Arquivamento',
          order: 3,
          slaDays: 2,
          requiredActions: ['archive_patrol'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'GESTAO_GUARDA_MUNICIPAL',
      name: 'Gestão da Guarda Municipal',
      description: 'Workflow para gestão de guardas municipais',
      defaultSLA: 20,
      stages: [
        {
          name: 'Cadastro',
          order: 1,
          slaDays: 7,
          requiredDocuments: ['RG_CPF', 'CERTIFICADO_FORMACAO', 'EXAMES_MEDICOS'],
          requiredActions: ['register_guard'],
          canSkip: false
        },
        {
          name: 'Validação',
          order: 2,
          slaDays: 10,
          requiredActions: ['validate_guard'],
          canSkip: false
        },
        {
          name: 'Ativação',
          order: 3,
          slaDays: 3,
          requiredActions: ['activate_guard'],
          canSkip: false
        },
      ]
        },
    {
      moduleType: 'GESTAO_VIGILANCIA',
      name: 'Gestão de Vigilância',
      description: 'Workflow para gestão de sistemas de vigilância',
      defaultSLA: 20,
      stages: [
        {
          name: 'Planejamento',
          order: 1,
          slaDays: 7,
          requiredActions: ['plan_surveillance'],
          canSkip: false
        },
        {
          name: 'Implementação',
          order: 2,
          slaDays: 10,
          requiredActions: ['implement_surveillance'],
          canSkip: false
        },
        {
          name: 'Ativação',
          order: 3,
          slaDays: 3,
          requiredActions: ['activate_surveillance'],
          canSkip: false
        },
      ]
        },

    // ========================================
    // WORKFLOW GENÉRICO (FALLBACK)
    // ========================================
    {
      moduleType: 'GENERICO',
      name: 'Workflow Genérico',
      description: 'Workflow padrão para serviços sem workflow específico',
      defaultSLA: 15,
      stages: [
        {
          name: 'Análise Inicial',
          order: 1,
          slaDays: 5,
          requiredActions: ['initial_review'],
          canSkip: false
        },
        {
          name: 'Processamento',
          order: 2,
          slaDays: 7,
          requiredActions: ['process_request'],
          canSkip: false
        },
        {
          name: 'Finalização',
          order: 3,
          slaDays: 3,
          requiredActions: ['finalize'],
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
