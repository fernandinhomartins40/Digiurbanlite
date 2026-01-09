/**
 * ============================================================================
 * SERVICE WORKFLOW SEED SERVICE
 * ============================================================================
 *
 * Lógica de seed de workflows extraída para o código do backend
 * para funcionar em produção (build compilado)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import * as serviceWorkflowService from './service-workflow.service';
import { getTemplateForModuleType } from './workflow-templates';

/**
 * Lista de todos os moduleTypes do sistema antigo
 * Extraído de module-workflows.seed.ts
 */
const allModuleTypes = [
  // SAÚDE
  { moduleType: 'ATENDIMENTOS_SAUDE', name: 'Atendimentos de Saúde', defaultSLA: 5 },
  { moduleType: 'AGENDAMENTOS_MEDICOS', name: 'Agendamentos Médicos', defaultSLA: 3 },
  { moduleType: 'CONTROLE_MEDICAMENTOS', name: 'Controle de Medicamentos', defaultSLA: 2 },
  { moduleType: 'CAMPANHAS_SAUDE', name: 'Campanhas de Saúde', defaultSLA: 10 },
  { moduleType: 'PROGRAMAS_SAUDE', name: 'Programas de Saúde', defaultSLA: 15 },
  { moduleType: 'ENCAMINHAMENTOS_TFD', name: 'Tratamento Fora do Domicílio', defaultSLA: 7 },
  { moduleType: 'EXAMES', name: 'Exames', defaultSLA: 5 },
  { moduleType: 'TRANSPORTE_PACIENTES', name: 'Transporte de Pacientes', defaultSLA: 2 },
  { moduleType: 'CADASTRO_PACIENTE', name: 'Cadastro de Pacientes', defaultSLA: 1 },
  { moduleType: 'VACINACAO', name: 'Vacinação', defaultSLA: 1 },
  { moduleType: 'GESTAO_ACS', name: 'Gestão de ACS', defaultSLA: 7 },
  { moduleType: 'AGENDAMENTO_CONSULTA', name: 'Agendamento de Consulta Médica', defaultSLA: 3 },
  { moduleType: 'CARTAO_SUS', name: 'Cartão SUS', defaultSLA: 5 },
  { moduleType: 'CAMPANHAS_VACINACAO', name: 'Campanhas de Vacinação', defaultSLA: 1 },
  { moduleType: 'SOLICITACAO_EXAMES', name: 'Solicitação de Exames', defaultSLA: 5 },

  // EDUCAÇÃO
  { moduleType: 'MATRICULA_ESCOLAR', name: 'Matrícula Escolar', defaultSLA: 5 },
  { moduleType: 'TRANSFERENCIA_ESCOLAR', name: 'Transferência Escolar', defaultSLA: 7 },
  { moduleType: 'GESTAO_MERENDA', name: 'Gestão de Merenda', defaultSLA: 5 },
  { moduleType: 'MATRICULA_ALUNO', name: 'Matrícula de Aluno', defaultSLA: 5 },
  { moduleType: 'TRANSPORTE_ESCOLAR', name: 'Transporte Escolar', defaultSLA: 3 },
  { moduleType: 'INSCRICAO_CURSO_LIVRE', name: 'Cursos Livres', defaultSLA: 5 },
  { moduleType: 'CADASTRO_PROFESSOR', name: 'Cadastro de Professores', defaultSLA: 10 },
  { moduleType: 'ATENDIMENTOS_EDUCACAO', name: 'Atendimentos Educação', defaultSLA: 5 },
  { moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR', name: 'Ocorrências Escolares', defaultSLA: 2 },
  { moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR', name: 'Documentos Escolares', defaultSLA: 7 },
  { moduleType: 'CONSULTA_FREQUENCIA', name: 'Consulta Frequência', defaultSLA: 1 },
  { moduleType: 'CONSULTA_NOTAS', name: 'Consulta de Notas', defaultSLA: 1 },
  { moduleType: 'GESTAO_ESCOLAR', name: 'Gestão Escolar', defaultSLA: 10 },
  { moduleType: 'CONSULTA_FREQUENCIA_NOTAS', name: 'Consulta de Frequência e Notas', defaultSLA: 1 },

  // ASSISTÊNCIA SOCIAL
  { moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL', name: 'Atendimentos Sociais', defaultSLA: 3 },
  { moduleType: 'SOLICITACAO_BENEFICIO', name: 'Solicitação de Benefícios', defaultSLA: 10 },
  { moduleType: 'CADASTRO_UNICO', name: 'Cadastro Único', defaultSLA: 5 },
  { moduleType: 'BOLSA_FAMILIA', name: 'Bolsa Família', defaultSLA: 10 },
  { moduleType: 'ATENDIMENTO_CRAS', name: 'Atendimento CRAS', defaultSLA: 3 },
  { moduleType: 'CESTA_BASICA', name: 'Cesta Básica', defaultSLA: 3 },
  { moduleType: 'GESTAO_BENEFICIOS', name: 'Gestão de Benefícios', defaultSLA: 10 },
  { moduleType: 'ENTREGA_EMERGENCIAL', name: 'Entrega Emergencial', defaultSLA: 1 },
  { moduleType: 'INSCRICAO_GRUPO_OFICINA', name: 'Grupos e Oficinas', defaultSLA: 5 },
  { moduleType: 'VISITAS_DOMICILIARES', name: 'Visitas Domiciliares', defaultSLA: 5 },
  { moduleType: 'INSCRICAO_PROGRAMA_SOCIAL', name: 'Programas Sociais', defaultSLA: 7 },
  { moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL', name: 'Agendamento Social', defaultSLA: 3 },
  { moduleType: 'GESTAO_CRAS_CREAS', name: 'Gestão CRAS/CREAS', defaultSLA: 10 },
  { moduleType: 'AUXILIO_EMERGENCIAL', name: 'Auxílio Emergencial', defaultSLA: 2 },
  { moduleType: 'VISITA_DOMICILIAR', name: 'Visita Domiciliar', defaultSLA: 5 },

  // AGRICULTURA
  { moduleType: 'CADASTRO_PRODUTOR', name: 'Cadastro de Produtores', defaultSLA: 5 },
  { moduleType: 'SOLICITACAO_MAQUINAS', name: 'Solicitação de Máquinas', defaultSLA: 7 },
  { moduleType: 'FEIRA_PRODUTOR', name: 'Feira do Produtor', defaultSLA: 5 },
  { moduleType: 'PROGRAMA_SEMENTES', name: 'Programa de Sementes', defaultSLA: 10 },
  { moduleType: 'ATENDIMENTOS_AGRICULTURA', name: 'Atendimentos Agricultura', defaultSLA: 5 },
  { moduleType: 'ASSISTENCIA_TECNICA', name: 'Assistência Técnica', defaultSLA: 7 },
  { moduleType: 'INSCRICAO_CURSO_RURAL', name: 'Cursos Rurais', defaultSLA: 10 },
  { moduleType: 'INSCRICAO_PROGRAMA_RURAL', name: 'Programas Rurais', defaultSLA: 10 },
  { moduleType: 'CADASTRO_PROPRIEDADE_RURAL', name: 'Propriedades Rurais', defaultSLA: 7 },
  { moduleType: 'ANALISE_SOLO', name: 'Análise de Solo', defaultSLA: 10 },
  { moduleType: 'LICENCA_EVENTOS_RURAIS', name: 'Licença para Eventos Rurais', defaultSLA: 10 },

  // CULTURA
  { moduleType: 'INSCRICAO_OFICINA', name: 'Oficinas Culturais', defaultSLA: 5 },
  { moduleType: 'CADASTRO_ARTISTA', name: 'Cadastro de Artistas', defaultSLA: 5 },
  { moduleType: 'INSCRICAO_EDITAL', name: 'Editais Culturais', defaultSLA: 15 },
  { moduleType: 'ATENDIMENTOS_CULTURA', name: 'Atendimentos Cultura', defaultSLA: 5 },
  { moduleType: 'INSCRICAO_ESCOLINHA', name: 'Escolinhas de Arte', defaultSLA: 5 },
  { moduleType: 'RESERVA_ESPACO_CULTURAL', name: 'Reserva de Espaços', defaultSLA: 7 },
  { moduleType: 'INSCRICAO_OFICINA_CULTURAL', name: 'Oficinas Culturais', defaultSLA: 5 },
  { moduleType: 'CADASTRO_GRUPO_ARTISTICO', name: 'Grupos Artísticos', defaultSLA: 7 },
  { moduleType: 'PROJETO_CULTURAL', name: 'Projetos Culturais', defaultSLA: 15 },
  { moduleType: 'SUBMISSAO_PROJETO_CULTURAL', name: 'Submissão de Projetos', defaultSLA: 15 },
  { moduleType: 'CADASTRO_EVENTO_CULTURAL', name: 'Eventos Culturais', defaultSLA: 10 },
  { moduleType: 'REGISTRO_MANIFESTACAO_CULTURAL', name: 'Manifestações Culturais', defaultSLA: 10 },
  { moduleType: 'APOIO_CULTURAL', name: 'Apoio Cultural', defaultSLA: 15 },

  // ESPORTES
  { moduleType: 'INSCRICAO_MODALIDADE', name: 'Inscrição em Modalidades', defaultSLA: 5 },
  { moduleType: 'ALUGUEL_QUADRA', name: 'Aluguel de Quadras', defaultSLA: 3 },
  { moduleType: 'INSCRICAO_TORNEIO', name: 'Torneios e Competições', defaultSLA: 7 },
  { moduleType: 'ATENDIMENTOS_ESPORTES', name: 'Atendimentos Esportes', defaultSLA: 5 },
  { moduleType: 'CADASTRO_ATLETA', name: 'Cadastro de Atletas', defaultSLA: 5 },
  { moduleType: 'RESERVA_ESPACO_ESPORTIVO', name: 'Reserva de Espaços', defaultSLA: 3 },
  { moduleType: 'INSCRICAO_COMPETICAO', name: 'Competições', defaultSLA: 7 },
  { moduleType: 'CADASTRO_EQUIPE_ESPORTIVA', name: 'Equipes Esportivas', defaultSLA: 5 },
  { moduleType: 'CADASTRO_MODALIDADE', name: 'Cadastro de Modalidades', defaultSLA: 10 },

  // HABITAÇÃO
  { moduleType: 'REGULARIZACAO_FUNDIARIA', name: 'Regularização Fundiária', defaultSLA: 30 },
  { moduleType: 'MINHA_CASA', name: 'Minha Casa Minha Vida', defaultSLA: 30 },
  { moduleType: 'AUTORIZACAO_CONSTRUCAO', name: 'Autorização de Construção', defaultSLA: 15 },
  { moduleType: 'ATENDIMENTOS_HABITACAO', name: 'Atendimentos Habitação', defaultSLA: 7 },
  { moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL', name: 'Programas Habitacionais', defaultSLA: 15 },
  { moduleType: 'SOLICITACAO_AUXILIO_ALUGUEL', name: 'Auxílio Aluguel', defaultSLA: 10 },
  { moduleType: 'CADASTRO_UNIDADE_HABITACIONAL', name: 'Unidades Habitacionais', defaultSLA: 7 },
  { moduleType: 'INSCRICAO_FILA_HABITACAO', name: 'Fila de Habitação', defaultSLA: 10 },
  { moduleType: 'VISTORIA_HABITACIONAL', name: 'Vistoria Habitacional', defaultSLA: 10 },

  // MEIO AMBIENTE
  { moduleType: 'LICENCIAMENTO_AMBIENTAL', name: 'Licenciamento Ambiental', defaultSLA: 30 },
  { moduleType: 'COLETA_SELETIVA', name: 'Coleta Seletiva', defaultSLA: 5 },
  { moduleType: 'GESTAO_RESIDUOS', name: 'Gestão de Resíduos', defaultSLA: 7 },
  { moduleType: 'AUTORIZACAO_PODA', name: 'Autorização de Poda', defaultSLA: 7 },
  { moduleType: 'ATENDIMENTOS_MEIO_AMBIENTE', name: 'Atendimentos Meio Ambiente', defaultSLA: 5 },
  { moduleType: 'LICENCA_AMBIENTAL', name: 'Licença Ambiental', defaultSLA: 30 },
  { moduleType: 'DENUNCIA_AMBIENTAL', name: 'Denúncias Ambientais', defaultSLA: 3 },
  { moduleType: 'PROGRAMA_AMBIENTAL', name: 'Programas Ambientais', defaultSLA: 15 },
  { moduleType: 'AUTORIZACAO_PODA_CORTE', name: 'Poda e Corte', defaultSLA: 7 },
  { moduleType: 'VISTORIA_AMBIENTAL', name: 'Vistorias Ambientais', defaultSLA: 10 },
  { moduleType: 'GESTAO_AREAS_PROTEGIDAS', name: 'Áreas Protegidas', defaultSLA: 15 },
  { moduleType: 'AUTORIZACAO_PODA_ARVORES', name: 'Autorização para Poda de Árvores', defaultSLA: 7 },

  // OBRAS PÚBLICAS
  { moduleType: 'APROVACAO_PROJETO', name: 'Aprovação de Projetos', defaultSLA: 20 },
  { moduleType: 'AUTORIZACAO_DEMOLICAO', name: 'Autorização de Demolição', defaultSLA: 15 },
  { moduleType: 'GESTAO_OBRAS', name: 'Gestão de Obras', defaultSLA: 30 },
  { moduleType: 'ATENDIMENTOS_OBRAS', name: 'Atendimentos Obras', defaultSLA: 5 },
  { moduleType: 'SOLICITACAO_REPARO_VIA', name: 'Reparo de Vias', defaultSLA: 10 },
  { moduleType: 'VISTORIA_TECNICA_OBRAS', name: 'Vistorias Técnicas', defaultSLA: 10 },
  { moduleType: 'CADASTRO_OBRA_PUBLICA', name: 'Obras Públicas', defaultSLA: 7 },
  { moduleType: 'INSPECAO_OBRA', name: 'Inspeção de Obras', defaultSLA: 7 },

  // PLANEJAMENTO URBANO
  { moduleType: 'PARCELAMENTO_SOLO', name: 'Parcelamento de Solo', defaultSLA: 30 },
  { moduleType: 'VIABILIDADE_URBANISTICA', name: 'Viabilidade Urbanística', defaultSLA: 15 },
  { moduleType: 'ATENDIMENTOS_PLANEJAMENTO', name: 'Atendimentos Planejamento', defaultSLA: 7 },
  { moduleType: 'ALVARA_CONSTRUCAO', name: 'Alvará de Construção', defaultSLA: 20 },
  { moduleType: 'ALVARA_FUNCIONAMENTO', name: 'Alvará de Funcionamento', defaultSLA: 15 },
  { moduleType: 'SOLICITACAO_CERTIDAO', name: 'Certidões', defaultSLA: 7 },
  { moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR', name: 'Denúncias Construções', defaultSLA: 5 },
  { moduleType: 'CADASTRO_LOTEAMENTO', name: 'Cadastro de Loteamentos', defaultSLA: 20 },
  { moduleType: 'APROVACAO_PROJETO_ARQUITETONICO', name: 'Aprovação de Projeto Arquitetônico', defaultSLA: 20 },
  { moduleType: 'AUTORIZACAO_INTERVENCAO_VIA', name: 'Autorização para Intervenção em Via Pública', defaultSLA: 15 },

  // SEGURANÇA PÚBLICA
  { moduleType: 'REGISTRO_OCORRENCIA', name: 'Registro de Ocorrências', defaultSLA: 1 },
  { moduleType: 'PATROLHAMENTO', name: 'Patrolhamento', defaultSLA: 1 },
  { moduleType: 'AUTORIZACAO_EVENTO_SEG', name: 'Autorização de Eventos', defaultSLA: 10 },
  { moduleType: 'ATENDIMENTOS_SEGURANCA', name: 'Atendimentos Segurança', defaultSLA: 1 },
  { moduleType: 'SOLICITACAO_RONDA', name: 'Solicitação de Ronda', defaultSLA: 1 },
  { moduleType: 'SOLICITACAO_CAMERA_SEGURANCA', name: 'Câmeras de Segurança', defaultSLA: 15 },
  { moduleType: 'DENUNCIA_ANONIMA', name: 'Denúncias Anônimas', defaultSLA: 1 },
  { moduleType: 'CADASTRO_PONTO_CRITICO', name: 'Pontos Críticos', defaultSLA: 5 },
  { moduleType: 'ALERTA_SEGURANCA', name: 'Alertas de Segurança', defaultSLA: 1 },
  { moduleType: 'REGISTRO_PATRULHA', name: 'Registro de Patrulhas', defaultSLA: 1 },
  { moduleType: 'GESTAO_GUARDA_MUNICIPAL', name: 'Gestão Guarda Municipal', defaultSLA: 7 },
  { moduleType: 'GESTAO_VIGILANCIA', name: 'Gestão de Vigilância', defaultSLA: 7 },
  { moduleType: 'AUTORIZACAO_EVENTO_SEGURANCA', name: 'Autorização de Segurança para Eventos', defaultSLA: 10 },
  { moduleType: 'SOLICITACAO_PATRULHAMENTO', name: 'Solicitação de Patrulhamento', defaultSLA: 1 },
  { moduleType: 'LAUDO_VISTORIA_SEGURANCA', name: 'Laudo de Vistoria de Segurança', defaultSLA: 10 },

  // SERVIÇOS PÚBLICOS
  { moduleType: 'DESOBSTRUCAO_BUEIRO', name: 'Desobstrução de Bueiros', defaultSLA: 3 },
  { moduleType: 'SOLICITACAO_PODA', name: 'Solicitação de Poda', defaultSLA: 7 },
  { moduleType: 'GESTAO_EQUIPES_SERVICOS', name: 'Gestão de Equipes', defaultSLA: 7 },
  { moduleType: 'ATENDIMENTOS_SERVICOS_PUBLICOS', name: 'Atendimentos Serviços', defaultSLA: 5 },
  { moduleType: 'ILUMINACAO_PUBLICA', name: 'Iluminação Pública', defaultSLA: 5 },
  { moduleType: 'LIMPEZA_URBANA', name: 'Limpeza Urbana', defaultSLA: 3 },
  { moduleType: 'COLETA_ESPECIAL', name: 'Coleta Especial', defaultSLA: 5 },
  { moduleType: 'SOLICITACAO_CAPINA', name: 'Solicitação de Capina', defaultSLA: 7 },
  { moduleType: 'SOLICITACAO_DESOBSTRUCAO', name: 'Solicitação Desobstrução', defaultSLA: 3 },
  { moduleType: 'CAPINA_ROCAGEM', name: 'Capina e Roçagem', defaultSLA: 7 },
  { moduleType: 'REGISTRO_PROBLEMA_FOTO', name: 'Registro de Problema com Foto', defaultSLA: 5 },

  // TURISMO
  { moduleType: 'ATENDIMENTOS_TURISMO', name: 'Atendimentos Turismo', defaultSLA: 5 },
  { moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO', name: 'Estabelecimentos Turísticos', defaultSLA: 10 },
  { moduleType: 'CADASTRO_GUIA_TURISTICO', name: 'Guias Turísticos', defaultSLA: 10 },
  { moduleType: 'INSCRICAO_PROGRAMA_TURISTICO', name: 'Programas Turísticos', defaultSLA: 7 },
  { moduleType: 'REGISTRO_ATRATIVO_TURISTICO', name: 'Atrativos Turísticos', defaultSLA: 10 },
  { moduleType: 'CADASTRO_ROTEIRO_TURISTICO', name: 'Roteiros Turísticos', defaultSLA: 10 },
  { moduleType: 'CADASTRO_EVENTO_TURISTICO', name: 'Eventos Turísticos', defaultSLA: 10 },
  { moduleType: 'REGISTRO_EVENTO_TURISTICO', name: 'Registro de Eventos Turísticos', defaultSLA: 10 },
];

/**
 * Gerar workflows específicos dinamicamente usando templates
 */
const specificWorkflows: Record<string, {
  moduleType: string;
  name: string;
  description: string;
  defaultSLA: number;
  stages: any[];
}> = {};

// Gerar todos os workflows usando os templates
for (const module of allModuleTypes) {
  const template = getTemplateForModuleType(module.moduleType, module.name, `Workflow para ${module.name}`, module.defaultSLA);
  specificWorkflows[module.moduleType] = {
    moduleType: module.moduleType,
    name: `Workflow - ${module.name}`,
    description: `Workflow para ${module.name}`,
    defaultSLA: module.defaultSLA,
    stages: template.stages
  };
}

// Sobrescrever com workflows customizados específicos (os 9 que já tínhamos)
const customWorkflows: Record<string, {
  moduleType: string;
  name: string;
  description: string;
  defaultSLA: number;
  stages: any[];
}> = {
  // ========== SAÚDE ==========
  ENCAMINHAMENTOS_TFD: {
    moduleType: 'ENCAMINHAMENTOS_TFD',
    name: 'Workflow - Tratamento Fora do Domicílio',
    description: 'Fluxo para encaminhamentos TFD',
    defaultSLA: 7,
    stages: [
      {
        name: 'Análise Documental',
        order: 1,
        description: 'Verificação de documentos obrigatórios (laudos, atestados, exames)',
        slaDays: 2,
        requiredDocumentTypes: ['Atestado Médico', 'Exames', 'Guia de Encaminhamento'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Regulação Médica',
        order: 2,
        description: 'Avaliação técnica pela regulação médica',
        slaDays: 3,
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Gestão',
        order: 3,
        description: 'Aprovação final pela gestão',
        slaDays: 1,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento Transporte',
        order: 4,
        description: 'Agendamento do transporte para o paciente',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  TRANSPORTE_PACIENTES: {
    moduleType: 'TRANSPORTE_PACIENTES',
    name: 'Workflow - Transporte de Pacientes',
    description: 'Fluxo para solicitação de transporte de pacientes',
    defaultSLA: 10,
    stages: [
      {
        name: 'Análise de Solicitação',
        order: 1,
        description: 'Verificação da solicitação e documentos',
        slaDays: 2,
        requiredDocumentTypes: ['Atestado Médico', 'Comprovante de Endereço', 'Cartão SUS'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Técnica',
        order: 2,
        description: 'Avaliação do tipo de transporte necessário',
        slaDays: 3,
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'Agendamento do transporte',
        slaDays: 3,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação com o paciente',
        slaDays: 2,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  AGENDAMENTOS_MEDICOS: {
    moduleType: 'AGENDAMENTOS_MEDICOS',
    name: 'Workflow - Agendamentos Médicos',
    description: 'Fluxo para agendamento de consultas',
    defaultSLA: 3,
    stages: [
      {
        name: 'Recebimento',
        order: 1,
        description: 'Recebimento da solicitação de agendamento',
        slaDays: 1,
        requiredDocumentTypes: ['Cartão SUS', 'Encaminhamento Médico'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 2,
        description: 'Agendamento da consulta conforme disponibilidade',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 3,
        description: 'Confirmação com o paciente',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== EDUCAÇÃO ==========
  MATRICULA_ESCOLAR: {
    moduleType: 'MATRICULA_ESCOLAR',
    name: 'Workflow - Matrícula Escolar',
    description: 'Fluxo para matrícula de alunos',
    defaultSLA: 5,
    stages: [
      {
        name: 'Análise de Documentos',
        order: 1,
        description: 'Verificação de documentos obrigatórios',
        slaDays: 2,
        requiredDocumentTypes: ['Certidão de Nascimento', 'Comprovante de Residência', 'Cartão de Vacina'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 2,
        description: 'Verificação de disponibilidade de vagas',
        slaDays: 1,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Efetivação Matrícula',
        order: 3,
        description: 'Efetivação da matrícula no sistema',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega de Documentos',
        order: 4,
        description: 'Entrega de comprovante e orientações',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  TRANSFERENCIA_ESCOLAR: {
    moduleType: 'TRANSFERENCIA_ESCOLAR',
    name: 'Workflow - Transferência Escolar',
    description: 'Fluxo para transferência entre escolas',
    defaultSLA: 7,
    stages: [
      {
        name: 'Análise de Solicitação',
        order: 1,
        description: 'Análise da solicitação de transferência',
        slaDays: 2,
        requiredDocumentTypes: ['Declaração de Transferência', 'Histórico Escolar'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 2,
        description: 'Verificação de vagas na escola destino',
        slaDays: 2,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Processamento',
        order: 3,
        description: 'Processamento da transferência',
        slaDays: 2,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Finalização',
        order: 4,
        description: 'Emissão de documentos finais',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== ASSISTÊNCIA SOCIAL ==========
  SOLICITACAO_BENEFICIO: {
    moduleType: 'SOLICITACAO_BENEFICIO',
    name: 'Workflow - Solicitação de Benefícios',
    description: 'Fluxo para solicitação de benefícios sociais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Triagem',
        order: 1,
        description: 'Triagem inicial e verificação de elegibilidade',
        slaDays: 2,
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Renda', 'Comprovante de Residência'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 2,
        description: 'Análise detalhada da situação socioeconômica',
        slaDays: 3,
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar',
        order: 3,
        description: 'Visita domiciliar se necessário',
        slaDays: 3,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: true
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do benefício',
        slaDays: 1,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Concessão',
        order: 5,
        description: 'Concessão do benefício',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  CADASTRO_UNICO: {
    moduleType: 'CADASTRO_UNICO',
    name: 'Workflow - Cadastro Único',
    description: 'Fluxo para cadastro no CadÚnico',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recepção e verificação de documentos',
        slaDays: 1,
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência', 'Certidão de Nascimento'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Entrevista',
        order: 2,
        description: 'Entrevista e preenchimento do formulário',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Inclusão no Sistema',
        order: 3,
        description: 'Inclusão dos dados no sistema CadÚnico',
        slaDays: 2,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega de Comprovante',
        order: 4,
        description: 'Entrega do comprovante de cadastro',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== PLANEJAMENTO URBANO ==========
  ALVARA_CONSTRUCAO: {
    moduleType: 'ALVARA_CONSTRUCAO',
    name: 'Workflow - Alvará de Construção',
    description: 'Fluxo para emissão de alvará de construção',
    defaultSLA: 20,
    stages: [
      {
        name: 'Protocolo',
        order: 1,
        description: 'Protocolo da documentação',
        slaDays: 2,
        requiredDocumentTypes: ['Projeto Arquitetônico', 'Matrícula do Imóvel', 'ART', 'Comprovante de Propriedade'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 2,
        description: 'Análise técnica do projeto',
        slaDays: 10,
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria do terreno',
        slaDays: 5,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Alvará',
        order: 4,
        description: 'Emissão do alvará de construção',
        slaDays: 3,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  ALVARA_FUNCIONAMENTO: {
    moduleType: 'ALVARA_FUNCIONAMENTO',
    name: 'Workflow - Alvará de Funcionamento',
    description: 'Fluxo para emissão de alvará de funcionamento',
    defaultSLA: 15,
    stages: [
      {
        name: 'Protocolo',
        order: 1,
        description: 'Protocolo da solicitação',
        slaDays: 2,
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'IPTU', 'Projeto de Prevenção contra Incêndio'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Análise da documentação apresentada',
        slaDays: 5,
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria do estabelecimento',
        slaDays: 5,
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão',
        order: 4,
        description: 'Emissão do alvará de funcionamento',
        slaDays: 3,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  }
};

// Mesclar workflows customizados nos específicos (sobrescrever os 9 workflows manuais)
Object.assign(specificWorkflows, customWorkflows);

/**
 * Workflow genérico para serviços SEM_DADOS
 */
const genericWorkflowStages = [
  {
    name: 'Recebimento',
    order: 1,
    description: 'Protocolo recebido e aguardando análise inicial',
    slaDays: 2,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false
  },
  {
    name: 'Análise',
    order: 2,
    description: 'Análise da solicitação',
    slaDays: 3,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false
  },
  {
    name: 'Processamento',
    order: 3,
    description: 'Processamento da solicitação',
    slaDays: 5,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false
  },
  {
    name: 'Aprovação',
    order: 4,
    description: 'Aprovação final',
    slaDays: 2,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE', 'REJECT'],
    canSkip: false
  },
  {
    name: 'Conclusão',
    order: 5,
    description: 'Emissão de documento ou conclusão do atendimento',
    slaDays: 1,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false
  }
];

/**
 * Criar workflows para todos os serviços sem workflow
 */
export async function seedAllServiceWorkflows() {
  console.log('🌱 Criando workflows para serviços sem workflow...');

  let created = 0;
  let skipped = 0;

  // Buscar todos os serviços ativos
  const services = await prisma.serviceSimplified.findMany({
    where: {
      isActive: true
    },
    include: {
      department: true
    }
  });

  console.log(`   → Encontrados ${services.length} serviços ativos`);

  // Processar cada serviço
  for (const service of services) {
    try {
      // Verificar se já tem workflow
      const existingWorkflow = await prisma.serviceWorkflow.findUnique({
        where: { serviceId: service.id }
      });

      if (existingWorkflow) {
        console.log(`   ⏭️  ${service.name} - já possui workflow`);
        skipped++;
        continue;
      }

      // Determinar qual workflow usar
      let workflowData: {
        serviceId: string;
        name: string;
        description: string;
        stages: any[];
        defaultSLA: number;
      };

      if (service.moduleType && specificWorkflows[service.moduleType]) {
        // Serviço COM_DADOS com workflow específico
        const specificWorkflow = specificWorkflows[service.moduleType];
        workflowData = {
          serviceId: service.id,
          name: specificWorkflow.name,
          description: specificWorkflow.description,
          stages: specificWorkflow.stages,
          defaultSLA: specificWorkflow.defaultSLA
        };
        console.log(`   ✅ ${service.name} - workflow ESPECÍFICO (${service.moduleType})`);
      } else if (service.serviceType === 'SEM_DADOS' || !service.moduleType) {
        // Serviço SEM_DADOS - usa workflow genérico
        workflowData = {
          serviceId: service.id,
          name: `Workflow - ${service.name}`,
          description: `Workflow genérico para ${service.name}`,
          stages: genericWorkflowStages,
          defaultSLA: service.estimatedDays || 13
        };
        console.log(`   ✅ ${service.name} - workflow GENÉRICO (SEM_DADOS)`);
      } else {
        // Serviço COM_DADOS sem workflow específico ainda - usa genérico
        workflowData = {
          serviceId: service.id,
          name: `Workflow - ${service.name}`,
          description: `Workflow genérico para ${service.name} (aguardando workflow específico)`,
          stages: genericWorkflowStages,
          defaultSLA: service.estimatedDays || 13
        };
        console.log(`   ⚠️  ${service.name} - workflow GENÉRICO TEMPORÁRIO (COM_DADOS sem workflow específico)`);
      }

      // Criar o workflow usando o service
      await serviceWorkflowService.createServiceWorkflow(workflowData);

      created++;
    } catch (error) {
      console.error(`   ❌ Erro ao processar ${service.name}:`, error);
    }
  }

  console.log(`\n✅ ServiceWorkflows: ${created} criados, ${skipped} já existiam`);
  return { created, skipped };
}
