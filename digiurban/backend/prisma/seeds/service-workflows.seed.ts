/**
 * ============================================================================
 * SERVICE WORKFLOWS SEED - Workflows por ServiÃ§o COM METADADOS DE UI
 * ============================================================================
 *
 * ATUALIZADO: Agora cada stage define:
 * - availableTabs: Quais abas mostrar na UI
 * - primaryTab: Qual aba destacar
 * - requiredDocumentTypes: Documentos obrigatÃ³rios
 * - requiredInputFieldIds: Campos de formulÃ¡rio obrigatÃ³rios
 * - allowedActions: AÃ§Ãµes permitidas
 *
 * Isso permite que o WORKFLOW defina completamente a estrutura da UI
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ============================================================================
 * WORKFLOWS ESPECÃFICOS PARA SERVIÃ‡OS COM_DADOS
 * ============================================================================
 */

interface SpecificWorkflow {
  moduleType: string;
  name: string;
  description: string;
  defaultSLA: number;
  stages: Prisma.JsonValue;
}

// Workflows especÃ­ficos por moduleType
export const specificWorkflows: Record<string, SpecificWorkflow> = {
  // ========== SAÃšDE ==========
  ENCAMINHAMENTOS_TFD: {
    moduleType: 'ENCAMINHAMENTOS_TFD',
    name: 'Workflow - Tratamento Fora do DomicÃ­lio',
    description: 'Fluxo para encaminhamentos TFD',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos obrigatÃ³rios (laudos, atestados, exames)',
        slaDays: 2,

        // âœ… METADADOS DE UI
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        // Requisitos
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],

        // AÃ§Ãµes
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'RegulaÃ§Ã£o MÃ©dica',
        order: 4,
        description: 'AvaliaÃ§Ã£o tÃ©cnica pela regulaÃ§Ã£o mÃ©dica',
        slaDays: 3,

        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['parecer_medico', 'cid_principal', 'procedimento_solicitado'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o GestÃ£o',
        order: 5,
        description: 'AprovaÃ§Ã£o final pela gestÃ£o',
        slaDays: 1,

        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento Transporte',
        order: 6,
        description: 'Agendamento do transporte para o paciente',
        slaDays: 1,

        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['data_agendamento', 'hora_agendamento', 'veiculo'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  TRANSPORTE_PACIENTES: {
    moduleType: 'TRANSPORTE_PACIENTES',
    name: 'Workflow - Transporte de Pacientes',
    description: 'Fluxo para solicitaÃ§Ã£o de transporte de pacientes',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o da solicitaÃ§Ã£o e documentos',
        slaDays: 2,

        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        requiredDocumentTypes: ['Atestado MÃ©dico', 'Comprovante de EndereÃ§o', 'CartÃ£o SUS'],
        requiredInputFieldIds: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o TÃ©cnica',
        order: 4,
        description: 'AvaliaÃ§Ã£o do tipo de transporte necessÃ¡rio',
        slaDays: 3,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['tipo_transporte', 'justificativa'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 5,
        description: 'Agendamento do transporte',
        slaDays: 3,

        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['data_transporte', 'hora_transporte', 'destino'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 6,
        description: 'ConfirmaÃ§Ã£o do agendamento com o paciente',
        slaDays: 2,

        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== AGRICULTURA ==========
  CADASTRO_PRODUTOR: {
    moduleType: 'CADASTRO_PRODUTOR',
    name: 'Workflow - Cadastro de Produtor Rural',
    description: 'Fluxo para cadastro de produtores rurais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de CPF, comprovante de residÃªncia e documentos da propriedade',
        slaDays: 3,

        // âœ… UI DEFINITION
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o dos dados cadastrais do produtor',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['tipo_producao', 'area_propriedade', 'produtos_principais'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o Final',
        order: 4,
        description: 'AprovaÃ§Ã£o final do cadastro',
        slaDays: 2,

        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de CertidÃ£o',
        order: 5,
        description: 'EmissÃ£o da certidÃ£o de produtor rural',
        slaDays: 3,

        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== PLANEJAMENTO URBANO ==========
  LICENCA_OBRA: {
    moduleType: 'LICENCA_OBRA',
    name: 'Workflow - LicenÃ§a para Obras',
    description: 'Fluxo para licenciamento de obras particulares',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recebimento',
        order: 1,
        description: 'Protocolo recebido e validaÃ§Ã£o inicial',
        slaDays: 2,

        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        requiredDocumentTypes: ['Projeto Aprovado', 'ART', 'MatrÃ­cula do ImÃ³vel'],
        requiredInputFieldIds: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 2,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 3,
        description: 'AnÃ¡lise da documentaÃ§Ã£o apresentada',
        slaDays: 5,

        availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        requiredDocumentTypes: [],
        requiredInputFieldIds: ['area_construir', 'tipo_obra', 'uso'],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria tÃ©cnica no local',
        slaDays: 10,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['data_vistoria', 'parecer_vistoria', 'responsavel_vistoria'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o final e cÃ¡lculo de taxas',
        slaDays: 5,

        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['valor_taxa', 'validade_licenca'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o',
        order: 6,
        description: 'EmissÃ£o da licenÃ§a de obra',
        slaDays: 3,

        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  ALVARA_FUNCIONAMENTO: {
    moduleType: 'ALVARA_FUNCIONAMENTO',
    name: 'Workflow - AlvarÃ¡ de Funcionamento',
    description: 'Fluxo para emissÃ£o de alvarÃ¡ de funcionamento',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recebimento',
        order: 1,
        description: 'Protocolo recebido e validaÃ§Ã£o inicial',
        slaDays: 2,

        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'Comprovante de EndereÃ§o do Estabelecimento', 'Planta Baixa'],
        requiredInputFieldIds: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 2,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 3,
        description: 'AnÃ¡lise da documentaÃ§Ã£o do estabelecimento',
        slaDays: 5,

        availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_atividade', 'area_estabelecimento', 'numero_funcionarios'],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria do estabelecimento',
        slaDays: 8,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['data_vistoria', 'parecer_vigilancia', 'parecer_bombeiros'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o',
        order: 5,
        description: 'EmissÃ£o do alvarÃ¡ de funcionamento',
        slaDays: 5,

        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== SAÃšDE (continuaÃ§Ã£o) ==========
  AGENDAMENTO_CONSULTA: {
    moduleType: 'AGENDAMENTO_CONSULTA',
    name: 'Workflow - Agendamento de Consulta MÃ©dica',
    description: 'Fluxo para agendamento de consultas mÃ©dicas',
    defaultSLA: 3,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Triagem e ValidaÃ§Ã£o',
        order: 2,
        description: 'ValidaÃ§Ã£o de dados e disponibilidade',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['especialidade', 'data_preferencial', 'turno'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'ConfirmaÃ§Ã£o de data e horÃ¡rio',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_consulta', 'horario', 'profissional'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'NotificaÃ§Ã£o ao paciente',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  SOLICITACAO_EXAMES: {
    moduleType: 'SOLICITACAO_EXAMES',
    name: 'Workflow - SolicitaÃ§Ã£o de Exames',
    description: 'Fluxo para solicitaÃ§Ã£o de exames laboratoriais',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Pedido MÃ©dico',
        order: 2,
        description: 'ValidaÃ§Ã£o de requisiÃ§Ã£o mÃ©dica',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Pedido MÃ©dico', 'CartÃ£o SUS'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento de Coleta',
        order: 4,
        description: 'DefiniÃ§Ã£o de data para coleta',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_coleta', 'local_coleta'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o ao paciente',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  CARTAO_SUS: {
    moduleType: 'CARTAO_SUS',
    name: 'Workflow - SolicitaÃ§Ã£o de CartÃ£o SUS',
    description: 'Fluxo para emissÃ£o de CartÃ£o SUS',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos pessoais',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de ResidÃªncia', 'RG ou CNH'],
        requiredInputFieldIds: ['nome_completo', 'data_nascimento', 'nome_mae'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro no Sistema',
        order: 4,
        description: 'Registro no sistema nacional',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o do CartÃ£o',
        order: 5,
        description: 'ImpressÃ£o e disponibilizaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      }
    ]
  },

  // ========== EDUCAÃ‡ÃƒO ==========
  MATRICULA_ESCOLAR: {
    moduleType: 'MATRICULA_ESCOLAR',
    name: 'Workflow - MatrÃ­cula Escolar',
    description: 'Fluxo para matrÃ­cula de alunos',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Documentos',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos escolares',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CertidÃ£o de Nascimento', 'Comprovante de ResidÃªncia', 'CartÃ£o de Vacina'],
        requiredInputFieldIds: ['nome_aluno', 'data_nascimento', 'serie_pretendida'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'Consulta de disponibilidade',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['escola_escolhida', 'turno'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'EfetivaÃ§Ã£o da MatrÃ­cula',
        order: 4,
        description: 'ConfirmaÃ§Ã£o e registro no sistema',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  TRANSFERENCIA_ESCOLAR: {
    moduleType: 'TRANSFERENCIA_ESCOLAR',
    name: 'Workflow - TransferÃªncia Escolar',
    description: 'Fluxo para transferÃªncia entre escolas',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos e motivo',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['HistÃ³rico Escolar', 'DeclaraÃ§Ã£o de TransferÃªncia'],
        requiredInputFieldIds: ['escola_origem', 'escola_destino', 'motivo'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'Consulta na escola destino',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Processamento',
        order: 4,
        description: 'TransferÃªncia de documentaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 5,
        description: 'MatrÃ­cula efetivada na nova escola',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  TRANSPORTE_ESCOLAR: {
    moduleType: 'TRANSPORTE_ESCOLAR',
    name: 'Workflow - Transporte Escolar',
    description: 'Fluxo para solicitaÃ§Ã£o de transporte escolar',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 2,
        description: 'VerificaÃ§Ã£o de critÃ©rios (distÃ¢ncia, idade)',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['Comprovante de ResidÃªncia', 'Comprovante de MatrÃ­cula'],
        requiredInputFieldIds: ['endereco_completo', 'escola', 'distancia_km'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Rota',
        order: 4,
        description: 'Planejamento logÃ­stico',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AutorizaÃ§Ã£o final',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro e OrientaÃ§Ã£o',
        order: 6,
        description: 'InformaÃ§Ãµes sobre ponto e horÃ¡rio',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== AGRICULTURA (complementaÃ§Ã£o) ==========
  ASSISTENCIA_TECNICA: {
    moduleType: 'ASSISTENCIA_TECNICA',
    name: 'Workflow - AssistÃªncia TÃ©cnica Rural',
    description: 'Fluxo para solicitaÃ§Ã£o de assistÃªncia tÃ©cnica',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o da demanda e documentaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documento da Propriedade (opcional)'],
        requiredInputFieldIds: ['tipo_assistencia', 'area_propriedade'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento de Visita',
        order: 4,
        description: 'Agendamento de visita tÃ©cnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'tecnico_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 5,
        description: 'RealizaÃ§Ã£o da vistoria in loco',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Laudo',
        order: 6,
        description: 'ElaboraÃ§Ã£o do laudo tÃ©cnico',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      }
    ]
  },

  CADASTRO_PROPRIEDADE_RURAL: {
    moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
    name: 'Workflow - Cadastro de Propriedade Rural',
    description: 'Fluxo para cadastro de propriedades rurais',
    defaultSLA: 12,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos da propriedade',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura ou Contrato', 'CAR - Cadastro Ambiental Rural (opcional)', 'ITR - Imposto Territorial Rural (opcional)'],
        requiredInputFieldIds: ['area_total', 'localizacao'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria da Propriedade',
        order: 3,
        description: 'Vistoria tÃ©cnica no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['coordenadas_gps', 'uso_solo', 'benfeitorias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o Cadastral',
        order: 4,
        description: 'ValidaÃ§Ã£o dos dados cadastrais',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 5,
        description: 'EmissÃ£o do certificado de cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      }
    ]
  },

  INSCRICAO_PROGRAMA_RURAL: {
    moduleType: 'INSCRICAO_PROGRAMA_RURAL',
    name: 'Workflow - InscriÃ§Ã£o em Programa Rural',
    description: 'Fluxo para inscriÃ§Ã£o em programas de desenvolvimento rural',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 2,
        description: 'VerificaÃ§Ã£o de critÃ©rios de elegibilidade',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['programa_escolhido', 'area_producao'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise tÃ©cnica da solicitaÃ§Ã£o',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro no Programa',
        order: 5,
        description: 'EfetivaÃ§Ã£o do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  FEIRA_PRODUTOR: {
    moduleType: 'FEIRA_PRODUTOR',
    name: 'Workflow - InscriÃ§Ã£o em Feira do Produtor',
    description: 'Fluxo para inscriÃ§Ã£o em feiras de produtores',
    defaultSLA: 8,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de InscriÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos do produtor',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: ['produtos_comercializar', 'tipo_banca'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o SanitÃ¡ria',
        order: 3,
        description: 'VerificaÃ§Ã£o de conformidade sanitÃ¡ria',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_sanitario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AlocaÃ§Ã£o de EspaÃ§o',
        order: 4,
        description: 'DefiniÃ§Ã£o de local na feira',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_banca', 'localizacao_feira'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 5,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  LICENCA_EVENTOS_RURAIS: {
    moduleType: 'LICENCA_EVENTOS_RURAIS',
    name: 'Workflow - LicenÃ§a para Eventos Rurais',
    description: 'Fluxo para licenciamento de eventos em Ã¡rea rural',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos do evento',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto do Evento', 'CPF'],
        requiredInputFieldIds: ['tipo_evento', 'data_evento', 'publico_estimado'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do Local',
        order: 4,
        description: 'Vistoria tÃ©cnica no local do evento',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_vistoria', 'infraestrutura'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SeguranÃ§a',
        order: 5,
        description: 'AvaliaÃ§Ã£o de seguranÃ§a e sanitÃ¡ria',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['plano_seguranca', 'plano_sanitario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de LicenÃ§a',
        order: 6,
        description: 'EmissÃ£o da licenÃ§a do evento',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      }
    ]
  },

  ANALISE_SOLO: {
    moduleType: 'ANALISE_SOLO',
    name: 'Workflow - AnÃ¡lise de Solo',
    description: 'Fluxo para solicitaÃ§Ã£o de anÃ¡lise de solo',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Registro de SolicitaÃ§Ã£o',
        order: 2,
        description: 'Registro e validaÃ§Ã£o da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: ['tipo_analise', 'area_amostra'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento de Coleta',
        order: 4,
        description: 'Agendamento da coleta de amostras',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_coleta', 'tecnico_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Laboratorial',
        order: 5,
        description: 'AnÃ¡lise das amostras em laboratÃ³rio',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resultados_analise'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Laudo',
        order: 6,
        description: 'EmissÃ£o do laudo tÃ©cnico',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      }
    ]
  },

  ATENDIMENTOS_AGRICULTURA: {
    moduleType: 'ATENDIMENTOS_AGRICULTURA',
    name: 'Workflow - Atendimentos de Agricultura',
    description: 'Fluxo para atendimentos gerais da agricultura',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'RecepÃ§Ã£o e triagem do atendimento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_atendimento', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 2,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise tÃ©cnica da demanda',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Atendimento',
        order: 4,
        description: 'ExecuÃ§Ã£o do atendimento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['providencias_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'FinalizaÃ§Ã£o',
        order: 5,
        description: 'FinalizaÃ§Ã£o e feedback',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  SOLICITACAO_MAQUINAS: {
    moduleType: 'SOLICITACAO_MAQUINAS',
    name: 'Workflow - SolicitaÃ§Ã£o de MÃ¡quinas AgrÃ­colas',
    description: 'Fluxo para solicitaÃ§Ã£o de mÃ¡quinas e equipamentos',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o de elegibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_maquina', 'area_trabalho', 'finalidade'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria PrÃ©via',
        order: 4,
        description: 'Vistoria da Ã¡rea a ser trabalhada',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_vistoria', 'viabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 5,
        description: 'Agendamento da mÃ¡quina',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_agendamento', 'maquina_alocada', 'operador'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 6,
        description: 'ConfirmaÃ§Ã£o do agendamento',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL ==========
  ATENDIMENTO_CRAS: {
    moduleType: 'ATENDIMENTO_CRAS',
    name: 'Workflow - Atendimento CRAS',
    description: 'Fluxo para atendimentos no CRAS',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Acolhimento',
        order: 2,
        description: 'Acolhimento inicial e escuta',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_demanda', 'situacao_familiar'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o Social',
        order: 4,
        description: 'AvaliaÃ§Ã£o pela assistente social',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'encaminhamentos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Encaminhamento',
        order: 5,
        description: 'Encaminhamento para serviÃ§os apropriados',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['servicos_encaminhados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Acompanhamento',
        order: 6,
        description: 'Acompanhamento do caso',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  AUXILIO_EMERGENCIAL: {
    moduleType: 'AUXILIO_EMERGENCIAL',
    name: 'Workflow - AuxÃ­lio Emergencial',
    description: 'Fluxo para solicitaÃ§Ã£o de auxÃ­lio emergencial',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Documentos',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos e elegibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de EndereÃ§o'],
        requiredInputFieldIds: ['composicao_familiar', 'renda_per_capita'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o SocioeconÃ´mica',
        order: 4,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o socioeconÃ´mica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'situacao_emergencial'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do auxÃ­lio',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['valor_auxilio', 'periodo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'LiberaÃ§Ã£o',
        order: 6,
        description: 'LiberaÃ§Ã£o do benefÃ­cio',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  CADASTRO_UNICO: {
    moduleType: 'CADASTRO_UNICO',
    name: 'Workflow - Cadastro Ãšnico',
    description: 'Fluxo para cadastro no CadÃšnico',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Coleta de Documentos',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos da famÃ­lia',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CadÃšnico', 'Documentos Pessoais', 'Comprovante de Renda'],
        requiredInputFieldIds: ['composicao_familiar'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Preenchimento do Cadastro',
        order: 3,
        description: 'Preenchimento completo do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_familia', 'renda_familiar', 'condicoes_moradia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o',
        order: 4,
        description: 'ValidaÃ§Ã£o dos dados cadastrados',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'FinalizaÃ§Ã£o',
        order: 5,
        description: 'Envio para base nacional',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  INSCRICAO_GRUPO_OFICINA: {
    moduleType: 'INSCRICAO_GRUPO_OFICINA',
    name: 'Workflow - InscriÃ§Ã£o em Grupo/Oficina Social',
    description: 'Fluxo para inscriÃ§Ã£o em grupos e oficinas',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de InscriÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos e elegibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de EndereÃ§o'],
        requiredInputFieldIds: ['grupo_interesse', 'faixa_etaria'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o de Perfil',
        order: 3,
        description: 'AvaliaÃ§Ã£o do perfil do candidato',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 4,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['turma_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 5,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  INSCRICAO_PROGRAMA_SOCIAL: {
    moduleType: 'INSCRICAO_PROGRAMA_SOCIAL',
    name: 'Workflow - InscriÃ§Ã£o em Programa Social',
    description: 'Fluxo para inscriÃ§Ã£o em programas sociais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos obrigatÃ³rios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CadÃšnico', 'Documentos Pessoais'],
        requiredInputFieldIds: ['programa_solicitado'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o SocioeconÃ´mica',
        order: 4,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o familiar',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'perfil_familiar'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 5,
        description: 'VerificaÃ§Ã£o de critÃ©rios do programa',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro no Programa',
        order: 6,
        description: 'EfetivaÃ§Ã£o do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  SOLICITACAO_BENEFICIO: {
    moduleType: 'SOLICITACAO_BENEFICIO',
    name: 'Workflow - SolicitaÃ§Ã£o de BenefÃ­cio',
    description: 'Fluxo para solicitaÃ§Ã£o de benefÃ­cios sociais',
    defaultSLA: 12,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Documentos',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_beneficio'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Estudo Social',
        order: 4,
        description: 'Estudo socioeconÃ´mico',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_social', 'conclusao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o GestÃ£o',
        order: 5,
        description: 'AprovaÃ§Ã£o pela gestÃ£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['parecer_gestor'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConcessÃ£o',
        order: 6,
        description: 'ConcessÃ£o do benefÃ­cio',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  VISITA_DOMICILIAR: {
    moduleType: 'VISITA_DOMICILIAR',
    name: 'Workflow - Visita Domiciliar',
    description: 'Fluxo para agendamento e realizaÃ§Ã£o de visitas domiciliares',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'AnÃ¡lise da demanda de visita',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['motivo_visita', 'endereco_completo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 4,
        description: 'Agendamento da visita',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'tecnico_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'RealizaÃ§Ã£o da Visita',
        order: 5,
        description: 'ExecuÃ§Ã£o da visita domiciliar',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_visita', 'condicoes_moradia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o de RelatÃ³rio',
        order: 6,
        description: 'ElaboraÃ§Ã£o do relatÃ³rio tÃ©cnico',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      }
    ]
  },

  // ========== CULTURA ==========
  CADASTRO_ARTISTA: {
    moduleType: 'CADASTRO_ARTISTA',
    name: 'Workflow - Cadastro de Artista',
    description: 'Fluxo para cadastro de artistas locais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos pessoais',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG'],
        requiredInputFieldIds: ['nome_artistico', 'categoria_artistica'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de PortfÃ³lio',
        order: 4,
        description: 'AvaliaÃ§Ã£o do portfÃ³lio artÃ­stico',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_atuacao', 'experiencia'],
        requiredDocumentTypes: ['RG', 'CPF', 'Projeto do Evento'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o',
        order: 5,
        description: 'ValidaÃ§Ã£o pela comissÃ£o de cultura',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Carteira',
        order: 6,
        description: 'EmissÃ£o da carteira de artista',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      }
    ]
  },

  CADASTRO_EVENTO_CULTURAL: {
    moduleType: 'CADASTRO_EVENTO_CULTURAL',
    name: 'Workflow - Cadastro de Evento Cultural',
    description: 'Fluxo para cadastro de eventos culturais',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Proposta',
        order: 2,
        description: 'VerificaÃ§Ã£o da proposta do evento',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_evento', 'data_evento', 'tipo_evento', 'publico_estimado'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise tÃ©cnica da viabilidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'infraestrutura_necessaria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria de Local',
        order: 5,
        description: 'Vistoria do local do evento',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final do evento',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'PublicaÃ§Ã£o',
        order: 7,
        description: 'PublicaÃ§Ã£o no calendÃ¡rio cultural',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  CADASTRO_GRUPO_ARTISTICO: {
    moduleType: 'CADASTRO_GRUPO_ARTISTICO',
    name: 'Workflow - Cadastro de Grupo ArtÃ­stico',
    description: 'Fluxo para cadastro de grupos artÃ­sticos',
    defaultSLA: 12,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos do grupo',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documentos dos Integrantes', 'PortfÃ³lio do Grupo', 'Estatuto (opcional)'],
        requiredInputFieldIds: ['nome_grupo', 'categoria', 'numero_integrantes'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de PortfÃ³lio',
        order: 4,
        description: 'AvaliaÃ§Ã£o do trabalho do grupo',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_atuacao', 'historico_grupo'],
        requiredDocumentTypes: ['PortfÃ³lio do Grupo'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o',
        order: 5,
        description: 'ValidaÃ§Ã£o pela secretaria de cultura',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'CertificaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o de certificado de cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  INSCRICAO_OFICINA: {
    moduleType: 'INSCRICAO_OFICINA',
    name: 'Workflow - InscriÃ§Ã£o em Oficina Cultural',
    description: 'Fluxo para inscriÃ§Ã£o em oficinas culturais',
    defaultSLA: 8,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de InscriÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: ['oficina_escolhida', 'faixa_etaria'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['turma_disponivel', 'horario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'MatrÃ­cula',
        order: 5,
        description: 'EfetivaÃ§Ã£o da matrÃ­cula',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  REGISTRO_MANIFESTACAO_CULTURAL: {
    moduleType: 'REGISTRO_MANIFESTACAO_CULTURAL',
    name: 'Workflow - Registro de ManifestaÃ§Ã£o Cultural',
    description: 'Fluxo para registro de manifestaÃ§Ãµes culturais',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Proposta',
        order: 2,
        description: 'VerificaÃ§Ã£o da proposta de registro',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['DocumentaÃ§Ã£o HistÃ³rica', 'Fotos', 'Depoimentos'],
        requiredInputFieldIds: ['nome_manifestacao', 'tipo', 'historico'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Pesquisa e DocumentaÃ§Ã£o',
        order: 4,
        description: 'Levantamento histÃ³rico e documental',
        slaDays: 8,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['pesquisa_historica', 'documentacao_fotografica'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise da ComissÃ£o',
        order: 5,
        description: 'AvaliaÃ§Ã£o pela comissÃ£o de patrimÃ´nio',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_comissao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Registro Oficial',
        order: 6,
        description: 'Registro oficial da manifestaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  RESERVA_ESPACO_CULTURAL: {
    moduleType: 'RESERVA_ESPACO_CULTURAL',
    name: 'Workflow - Reserva de EspaÃ§o Cultural',
    description: 'Fluxo para reserva de espaÃ§os culturais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o da solicitaÃ§Ã£o de reserva',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['espaco_solicitado', 'data_evento', 'tipo_atividade'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Disponibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de agenda do espaÃ§o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['disponibilidade_confirmada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria PrÃ©via',
        order: 4,
        description: 'Vistoria e orientaÃ§Ãµes sobre o espaÃ§o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['termo_responsabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 5,
        description: 'ConfirmaÃ§Ã£o da reserva',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'LiberaÃ§Ã£o do EspaÃ§o',
        order: 6,
        description: 'LiberaÃ§Ã£o das chaves/acesso',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  APOIO_CULTURAL: {
    moduleType: 'APOIO_CULTURAL',
    name: 'Workflow - Apoio Cultural',
    description: 'Fluxo para solicitaÃ§Ã£o de apoio cultural',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Projeto',
        order: 2,
        description: 'VerificaÃ§Ã£o do projeto cultural',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: ['tipo_apoio', 'valor_solicitado'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AvaliaÃ§Ã£o tÃ©cnica do projeto',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'relevancia_cultural'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise OrÃ§amentÃ¡ria',
        order: 5,
        description: 'AnÃ¡lise da viabilidade orÃ§amentÃ¡ria',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_orcamentario', 'valor_aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'FormalizaÃ§Ã£o',
        order: 6,
        description: 'FormalizaÃ§Ã£o do apoio',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  ATENDIMENTOS_CULTURA: {
    moduleType: 'ATENDIMENTOS_CULTURA',
    name: 'Workflow - Atendimentos de Cultura',
    description: 'Fluxo para atendimentos gerais da cultura',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'RecepÃ§Ã£o e triagem do atendimento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_atendimento', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 2,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise',
        order: 3,
        description: 'AnÃ¡lise da demanda',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Atendimento',
        order: 4,
        description: 'ExecuÃ§Ã£o do atendimento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['providencias_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'FinalizaÃ§Ã£o',
        order: 5,
        description: 'FinalizaÃ§Ã£o e feedback',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  PROJETO_CULTURAL: {
    moduleType: 'PROJETO_CULTURAL',
    name: 'Workflow - Projeto Cultural',
    description: 'Fluxo para aprovaÃ§Ã£o de projetos culturais',
    defaultSLA: 25,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Proposta',
        order: 2,
        description: 'VerificaÃ§Ã£o da proposta de projeto',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['OrÃ§amento', 'CPF'],
        requiredInputFieldIds: ['titulo_projeto', 'objetivo', 'publico_alvo'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AvaliaÃ§Ã£o tÃ©cnica do projeto',
        slaDays: 8,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'viabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Financeira',
        order: 5,
        description: 'AnÃ¡lise da viabilidade financeira',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_financeiro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o Final',
        order: 6,
        description: 'AprovaÃ§Ã£o pela secretaria',
        slaDays: 5,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'FormalizaÃ§Ã£o',
        order: 7,
        description: 'FormalizaÃ§Ã£o e publicaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== EDUCAÃ‡ÃƒO ==========
  CADASTRO_PROFESSOR: {
    moduleType: 'CADASTRO_PROFESSOR',
    name: 'Workflow - Cadastro de Professor',
    description: 'Fluxo para cadastro de professores na rede municipal',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos do professor',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG do ResponsÃ¡vel', 'CPF do ResponsÃ¡vel', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: ['nome_completo', 'disciplina', 'nivel_ensino'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Curricular',
        order: 4,
        description: 'AnÃ¡lise do currÃ­culo e formaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_pedagogico', 'formacao_adequada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o RH',
        order: 5,
        description: 'AprovaÃ§Ã£o pelo departamento de recursos humanos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['situacao_cadastral'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro Sistema',
        order: 6,
        description: 'Cadastro no sistema educacional',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  CONSULTA_FREQUENCIA_NOTAS: {
    moduleType: 'CONSULTA_FREQUENCIA_NOTAS',
    name: 'Workflow - Consulta FrequÃªncia e Notas',
    description: 'Fluxo para solicitaÃ§Ã£o de consulta de frequÃªncia e notas',
    defaultSLA: 3,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o Solicitante',
        order: 2,
        description: 'VerificaÃ§Ã£o de vÃ­nculo do solicitante com o aluno',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_aluno', 'matricula', 'vinculo'],
        requiredDocumentTypes: ['Diploma', 'CurrÃ­culo', 'Comprovante de ResidÃªncia'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'GeraÃ§Ã£o de RelatÃ³rio',
        order: 3,
        description: 'GeraÃ§Ã£o do relatÃ³rio de frequÃªncia e notas',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['periodo_consulta'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'Entrega',
        order: 4,
        description: 'DisponibilizaÃ§Ã£o do relatÃ³rio',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  INSCRICAO_CURSO_LIVRE: {
    moduleType: 'INSCRICAO_CURSO_LIVRE',
    name: 'Workflow - InscriÃ§Ã£o em Curso Livre',
    description: 'Fluxo para inscriÃ§Ã£o em cursos livres oferecidos pela prefeitura',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Requisitos',
        order: 2,
        description: 'VerificaÃ§Ã£o de requisitos para o curso',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_curso', 'turma', 'turno'],
        requiredDocumentTypes: ['RG', 'CPF'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade de vagas',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'MatrÃ­cula',
        order: 4,
        description: 'EfetivaÃ§Ã£o da matrÃ­cula',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['numero_matricula'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o ao aluno sobre a matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  REGISTRO_OCORRENCIA_ESCOLAR: {
    moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR',
    name: 'Workflow - Registro de OcorrÃªncia Escolar',
    description: 'Fluxo para registro e tratamento de ocorrÃªncias escolares',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o da OcorrÃªncia',
        order: 1,
        description: 'Registro inicial da ocorrÃªncia',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_ocorrencia', 'descricao', 'envolvidos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 2,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise PedagÃ³gica',
        order: 3,
        description: 'AnÃ¡lise pela equipe pedagÃ³gica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_pedagogico', 'providencias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ProvidÃªncias',
        order: 4,
        description: 'ExecuÃ§Ã£o das providÃªncias necessÃ¡rias',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['acoes_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Acompanhamento',
        order: 5,
        description: 'Acompanhamento e fechamento',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  SOLICITACAO_DOCUMENTO_ESCOLAR: {
    moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    name: 'Workflow - SolicitaÃ§Ã£o de Documento Escolar',
    description: 'Fluxo para solicitaÃ§Ã£o de documentos escolares (histÃ³rico, declaraÃ§Ãµes, etc)',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o',
        order: 2,
        description: 'ValidaÃ§Ã£o da solicitaÃ§Ã£o e documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_documento', 'nome_aluno', 'matricula'],
        requiredDocumentTypes: ['RG'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Busca de Dados',
        order: 3,
        description: 'Busca de informaÃ§Ãµes nos arquivos escolares',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_localizados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o',
        order: 4,
        description: 'EmissÃ£o do documento solicitado',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'Entrega',
        order: 5,
        description: 'DisponibilizaÃ§Ã£o para retirada',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== ESPORTES ==========
  CADASTRO_ATLETA: {
    moduleType: 'CADASTRO_ATLETA',
    name: 'Workflow - Cadastro de Atleta',
    description: 'Fluxo para cadastro de atletas em programas municipais',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos do atleta',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Atestado MÃ©dico'],
        requiredInputFieldIds: ['nome_completo', 'modalidade', 'categoria'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o FÃ­sica',
        order: 4,
        description: 'AvaliaÃ§Ã£o de aptidÃ£o fÃ­sica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_medico', 'apto'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o TÃ©cnica',
        order: 5,
        description: 'AprovaÃ§Ã£o pelo tÃ©cnico responsÃ¡vel',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro Sistema',
        order: 6,
        description: 'Cadastro no sistema de esportes',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  INSCRICAO_COMPETICAO: {
    moduleType: 'INSCRICAO_COMPETICAO',
    name: 'Workflow - InscriÃ§Ã£o em CompetiÃ§Ã£o',
    description: 'Fluxo para inscriÃ§Ã£o em competiÃ§Ãµes esportivas municipais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de InscriÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o de requisitos para participaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_competicao', 'modalidade', 'categoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'HomologaÃ§Ã£o',
        order: 4,
        description: 'HomologaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['numero_inscricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o sobre a inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  INSCRICAO_ESCOLINHA: {
    moduleType: 'INSCRICAO_ESCOLINHA',
    name: 'Workflow - InscriÃ§Ã£o em Escolinha Esportiva',
    description: 'Fluxo para inscriÃ§Ã£o em escolinhas esportivas municipais',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Requisitos',
        order: 2,
        description: 'VerificaÃ§Ã£o de requisitos e faixa etÃ¡ria',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['modalidade', 'turma', 'turno'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade de vagas',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'MatrÃ­cula',
        order: 4,
        description: 'EfetivaÃ§Ã£o da matrÃ­cula',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['numero_matricula'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o ao responsÃ¡vel',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  RESERVA_ESPACO_ESPORTIVO: {
    moduleType: 'RESERVA_ESPACO_ESPORTIVO',
    name: 'Workflow - Reserva de EspaÃ§o Esportivo',
    description: 'Fluxo para reserva de quadras, ginÃ¡sios e espaÃ§os esportivos',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Disponibilidade',
        order: 2,
        description: 'VerificaÃ§Ã£o de disponibilidade do espaÃ§o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['espaco_solicitado', 'data', 'horario', 'finalidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Uso',
        order: 4,
        description: 'AnÃ¡lise da finalidade de uso',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_uso'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AutorizaÃ§Ã£o',
        order: 5,
        description: 'AutorizaÃ§Ã£o da reserva',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 6,
        description: 'ConfirmaÃ§Ã£o e entrega de autorizaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== HABITAÃ‡ÃƒO ==========
  AUTORIZACAO_CONSTRUCAO: {
    moduleType: 'AUTORIZACAO_CONSTRUCAO',
    name: 'Workflow - AutorizaÃ§Ã£o para ConstruÃ§Ã£o',
    description: 'Fluxo para autorizaÃ§Ã£o de construÃ§Ãµes',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o tÃ©cnica',
        slaDays: 7,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto ArquitetÃ´nico', 'MatrÃ­cula do ImÃ³vel', 'ART (AnotaÃ§Ã£o de Responsabilidade TÃ©cnica)'],
        requiredInputFieldIds: ['area_construir', 'endereco', 'tipo_construcao'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise tÃ©cnica do projeto',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'conformidade_plano_diretor'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 5,
        description: 'Vistoria no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 5,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AlvarÃ¡',
        order: 7,
        description: 'EmissÃ£o do alvarÃ¡ de construÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  INSCRICAO_PROGRAMA_HABITACIONAL: {
    moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL',
    name: 'Workflow - InscriÃ§Ã£o em Programa Habitacional',
    description: 'Fluxo para inscriÃ§Ã£o em programas de habitaÃ§Ã£o popular',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Renda', 'Comprovante de EndereÃ§o'],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 4,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o socioeconÃ´mica',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'pontuacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Domiciliar',
        order: 5,
        description: 'Vistoria na residÃªncia atual',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Cadastro',
        order: 6,
        description: 'Cadastro no programa habitacional',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 7,
        description: 'NotificaÃ§Ã£o sobre o cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  REGULARIZACAO_FUNDIARIA: {
    moduleType: 'REGULARIZACAO_FUNDIARIA',
    name: 'Workflow - RegularizaÃ§Ã£o FundiÃ¡ria',
    description: 'Fluxo para regularizaÃ§Ã£o de terrenos e construÃ§Ãµes',
    defaultSLA: 60,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura (se possuir)', 'IPTU', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: ['tempo_ocupacao', 'area_terreno'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_tecnico', 'area_medida'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise JurÃ­dica',
        order: 5,
        description: 'AnÃ¡lise jurÃ­dica da situaÃ§Ã£o',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_juridico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final da regularizaÃ§Ã£o',
        slaDays: 10,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Documentos',
        order: 7,
        description: 'EmissÃ£o da documentaÃ§Ã£o de regularizaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  SOLICITACAO_AUXILIO_ALUGUEL: {
    moduleType: 'SOLICITACAO_AUXILIO_ALUGUEL',
    name: 'Workflow - SolicitaÃ§Ã£o de AuxÃ­lio Aluguel',
    description: 'Fluxo para solicitaÃ§Ã£o de auxÃ­lio aluguel',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Renda'],
        requiredInputFieldIds: ['valor_aluguel', 'renda_familiar'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 4,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'situacao_emergencial'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 5,
        description: 'Vistoria no imÃ³vel',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o do auxÃ­lio',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['valor_aprovado', 'prazo_beneficio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro BenefÃ­cio',
        order: 7,
        description: 'Cadastro no sistema de benefÃ­cios',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  VISTORIA_HABITACIONAL: {
    moduleType: 'VISTORIA_HABITACIONAL',
    name: 'Workflow - Vistoria Habitacional',
    description: 'Fluxo para vistoria de condiÃ§Ãµes habitacionais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 2,
        description: 'Agendamento da vistoria',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['endereco', 'motivo_vistoria', 'data_preferencial'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'RealizaÃ§Ã£o da Vistoria',
        order: 4,
        description: 'ExecuÃ§Ã£o da vistoria tÃ©cnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_tecnico', 'fotos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 5,
        description: 'AnÃ¡lise dos resultados da vistoria',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Laudo',
        order: 6,
        description: 'EmissÃ£o do laudo de vistoria',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== MEIO AMBIENTE ==========
  AUTORIZACAO_PODA_ARVORES: {
    moduleType: 'AUTORIZACAO_PODA_ARVORES',
    name: 'Workflow - AutorizaÃ§Ã£o para Poda de Ãrvores',
    description: 'Fluxo para autorizaÃ§Ã£o de poda ou supressÃ£o de Ã¡rvores',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise do Pedido',
        order: 2,
        description: 'AnÃ¡lise inicial da solicitaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['endereco', 'tipo_solicitacao', 'motivo'],
        requiredDocumentTypes: ['Comprovante de Propriedade'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 4,
        description: 'Vistoria no local por engenheiro ambiental',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_tecnico', 'especie', 'estado_arvore'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Ambiental',
        order: 4,
        description: 'AnÃ¡lise de impacto ambiental',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_ambiental', 'medidas_compensatorias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AutorizaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o de autorizaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 7,
        description: 'NotificaÃ§Ã£o ao solicitante',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  PROGRAMA_AMBIENTAL: {
    moduleType: 'PROGRAMA_AMBIENTAL',
    name: 'Workflow - Programa Ambiental',
    description: 'Fluxo para inscriÃ§Ã£o em programas ambientais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'InscriÃ§Ã£o',
        order: 2,
        description: 'AnÃ¡lise da inscriÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_programa', 'tipo_participacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Requisitos',
        order: 4,
        description: 'VerificaÃ§Ã£o de requisitos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro',
        order: 5,
        description: 'Cadastro no programa',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 6,
        description: 'NotificaÃ§Ã£o sobre o cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  DENUNCIA_AMBIENTAL: {
    moduleType: 'DENUNCIA_AMBIENTAL',
    name: 'Workflow - DenÃºncia Ambiental',
    description: 'Fluxo para processamento de denÃºncias ambientais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'RecepÃ§Ã£o e classificaÃ§Ã£o da denÃºncia',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_denuncia', 'descricao', 'localizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 2,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria no local denunciado',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria', 'irregularidade_confirmada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise tÃ©cnica da situaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'providencias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ProvidÃªncias',
        order: 5,
        description: 'ExecuÃ§Ã£o de providÃªncias',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['acoes_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Fechamento',
        order: 6,
        description: 'Fechamento da denÃºncia',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  LICENCIAMENTO_AMBIENTAL: {
    moduleType: 'LICENCIAMENTO_AMBIENTAL',
    name: 'Workflow - Licenciamento Ambiental',
    description: 'Fluxo para licenciamento ambiental de atividades',
    defaultSLA: 45,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto', 'ART'],
        requiredInputFieldIds: ['tipo_atividade', 'porte_empreendimento'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Ambiental',
        order: 5,
        description: 'AnÃ¡lise de impacto ambiental',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_ambiental', 'condicionantes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 5,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de LicenÃ§a',
        order: 7,
        description: 'EmissÃ£o da licenÃ§a ambiental',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  VISTORIA_AMBIENTAL: {
    moduleType: 'VISTORIA_AMBIENTAL',
    name: 'Workflow - Vistoria Ambiental',
    description: 'Fluxo para vistoria ambiental',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 2,
        description: 'Agendamento da vistoria',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['endereco', 'motivo_vistoria', 'data_preferencial'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'RealizaÃ§Ã£o',
        order: 4,
        description: 'RealizaÃ§Ã£o da vistoria',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria', 'fotos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 5,
        description: 'AnÃ¡lise dos resultados',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Laudo',
        order: 6,
        description: 'EmissÃ£o do laudo',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== OBRAS PÃšBLICAS ==========
  AUTORIZACAO_DEMOLICAO: {
    moduleType: 'AUTORIZACAO_DEMOLICAO',
    name: 'Workflow - AutorizaÃ§Ã£o para DemoliÃ§Ã£o',
    description: 'Fluxo para autorizaÃ§Ã£o de demoliÃ§Ã£o de edificaÃ§Ãµes',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['endereco', 'area_demolir'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_tecnico', 'riscos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SeguranÃ§a',
        order: 5,
        description: 'AnÃ¡lise de seguranÃ§a e impactos',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_seguranca', 'medidas_protecao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AlvarÃ¡',
        order: 7,
        description: 'EmissÃ£o do alvarÃ¡ de demoliÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  AUTORIZACAO_INTERVENCAO_VIA: {
    moduleType: 'AUTORIZACAO_INTERVENCAO_VIA',
    name: 'Workflow - AutorizaÃ§Ã£o para IntervenÃ§Ã£o em Via PÃºblica',
    description: 'Fluxo para autorizaÃ§Ã£o de intervenÃ§Ãµes em vias pÃºblicas',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise do Pedido',
        order: 2,
        description: 'AnÃ¡lise inicial da solicitaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['endereco', 'tipo_intervencao', 'periodo'],
        requiredDocumentTypes: ['Projeto de IntervenÃ§Ã£o', 'ART'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise tÃ©cnica do projeto',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'impacto_transito'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SeguranÃ§a',
        order: 5,
        description: 'AnÃ¡lise de seguranÃ§a viÃ¡ria',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_seguranca'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 7,
        description: 'EmissÃ£o da autorizaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  SOLICITACAO_REPARO_VIA: {
    moduleType: 'SOLICITACAO_REPARO_VIA',
    name: 'Workflow - SolicitaÃ§Ã£o de Reparo em Via PÃºblica',
    description: 'Fluxo para solicitaÃ§Ã£o de reparos em vias pÃºblicas',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'RecepÃ§Ã£o da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['endereco', 'tipo_reparo', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 2,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria', 'urgencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'OrÃ§amento',
        order: 4,
        description: 'ElaboraÃ§Ã£o de orÃ§amento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['orcamento', 'prazo_execucao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o para execuÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ProgramaÃ§Ã£o',
        order: 6,
        description: 'ProgramaÃ§Ã£o da execuÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== PLANEJAMENTO URBANO ==========
  PARCELAMENTO_SOLO: {
    moduleType: 'PARCELAMENTO_SOLO',
    name: 'Workflow - Parcelamento de Solo',
    description: 'Fluxo para aprovaÃ§Ã£o de parcelamento de solo urbano',
    defaultSLA: 60,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o',
        slaDays: 15,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto de Parcelamento', 'MatrÃ­cula do ImÃ³vel', 'ART do ResponsÃ¡vel TÃ©cnico'],
        requiredInputFieldIds: ['area_total', 'numero_lotes'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise UrbanÃ­stica',
        order: 4,
        description: 'AnÃ¡lise de conformidade urbanÃ­stica',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_urbanistico', 'conformidade_plano_diretor'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Ambiental',
        order: 5,
        description: 'AnÃ¡lise de impacto ambiental',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_ambiental'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Infraestrutura',
        order: 6,
        description: 'AnÃ¡lise de infraestrutura necessÃ¡ria',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_infraestrutura'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o Final',
        order: 7,
        description: 'AprovaÃ§Ã£o final do parcelamento',
        slaDays: 5,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Registro',
        order: 8,
        description: 'Registro e formalizaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  APROVACAO_PROJETO_ARQUITETONICO: {
    moduleType: 'APROVACAO_PROJETO_ARQUITETONICO',
    name: 'Workflow - AprovaÃ§Ã£o de Projeto ArquitetÃ´nico',
    description: 'Fluxo para anÃ¡lise e aprovaÃ§Ã£o de projetos arquitetÃ´nicos',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o tÃ©cnica',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto ArquitetÃ´nico', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'VerificaÃ§Ã£o de conformidade com normas',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria no Local',
        order: 5,
        description: 'InspeÃ§Ã£o tÃ©cnica in loco',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Parecer',
        order: 6,
        description: 'AvaliaÃ§Ã£o do laudo tÃ©cnico',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o Final',
        order: 7,
        description: 'EmissÃ£o de alvarÃ¡',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },

  VIABILIDADE_URBANISTICA: {
    moduleType: 'VIABILIDADE_URBANISTICA',
    name: 'Workflow - Consulta de Viabilidade UrbanÃ­stica',
    description: 'Fluxo para anÃ¡lise de viabilidade de empreendimentos',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Documentos',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o do imÃ³vel',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['MatrÃ­cula do ImÃ³vel'],
        requiredInputFieldIds: ['endereco', 'area_terreno', 'tipo_empreendimento'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise UrbanÃ­stica',
        order: 4,
        description: 'VerificaÃ§Ã£o de zoneamento e restriÃ§Ãµes',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Parecer',
        order: 5,
        description: 'ElaboraÃ§Ã£o de relatÃ³rio tÃ©cnico',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o Final',
        order: 6,
        description: 'EmissÃ£o de certidÃ£o',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  ALVARA_CONSTRUCAO: {
    moduleType: 'ALVARA_CONSTRUCAO',
    name: 'Workflow - AlvarÃ¡ de ConstruÃ§Ã£o',
    description: 'Fluxo para emissÃ£o de alvarÃ¡ de construÃ§Ã£o',
    defaultSLA: 45,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o completa',
        slaDays: 7,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Aprovado', 'ART', 'MatrÃ­cula do ImÃ³vel'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'VerificaÃ§Ã£o de conformidade tÃ©cnica',
        slaDays: 15,
        availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria PrÃ©via',
        order: 5,
        description: 'InspeÃ§Ã£o do terreno',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Taxas',
        order: 6,
        description: 'CÃ¡lculo e verificaÃ§Ã£o de taxas',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o do AlvarÃ¡',
        order: 7,
        description: 'LiberaÃ§Ã£o do alvarÃ¡ de construÃ§Ã£o',
        slaDays: 8,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  DENUNCIA_CONSTRUCAO_IRREGULAR: {
    moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR',
    name: 'Workflow - DenÃºncia de ConstruÃ§Ã£o Irregular',
    description: 'Fluxo para processamento de denÃºncias de construÃ§Ãµes irregulares',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'RecepÃ§Ã£o e anÃ¡lise da denÃºncia',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['endereco', 'descricao', 'tipo_irregularidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 2,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria no local denunciado',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria', 'irregularidade_confirmada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise tÃ©cnica da irregularidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'gravidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o ao responsÃ¡vel',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: ['prazo_regularizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Acompanhamento',
        order: 6,
        description: 'Acompanhamento da regularizaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['situacao_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Fechamento',
        order: 7,
        description: 'Fechamento do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== SAÃšDE ==========
  CAMPANHAS_VACINACAO: {
    moduleType: 'CAMPANHAS_VACINACAO',
    name: 'Workflow - Campanhas de VacinaÃ§Ã£o',
    description: 'Fluxo para registro de participaÃ§Ã£o em campanhas de vacinaÃ§Ã£o',
    defaultSLA: 1,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Cadastro',
        order: 2,
        description: 'Cadastro do cidadÃ£o na campanha',
        slaDays: 0,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_campanha', 'vacina', 'dose'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AplicaÃ§Ã£o',
        order: 4,
        description: 'AplicaÃ§Ã£o da vacina',
        slaDays: 0,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['lote_vacina', 'profissional'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Registro',
        order: 5,
        description: 'Registro no sistema',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  CONTROLE_MEDICAMENTOS: {
    moduleType: 'CONTROLE_MEDICAMENTOS',
    name: 'Workflow - Controle de Medicamentos',
    description: 'Fluxo para controle e dispensaÃ§Ã£o de medicamentos',
    defaultSLA: 3,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Receita',
        order: 2,
        description: 'VerificaÃ§Ã£o da receita mÃ©dica',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['medicamento', 'dosagem', 'quantidade'],
        requiredDocumentTypes: ['Receita MÃ©dica', 'RG ou CPF', 'CartÃ£o SUS'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Estoque',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['disponibilidade', 'local_retirada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'DispensaÃ§Ã£o',
        order: 4,
        description: 'Entrega do medicamento',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_retirada', 'farmaceutico_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  PROGRAMAS_SAUDE: {
    moduleType: 'PROGRAMAS_SAUDE',
    name: 'Workflow - Programas de SaÃºde',
    description: 'Fluxo para inscriÃ§Ã£o em programas de saÃºde',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Documentos',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['programa', 'unidade_saude'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o MÃ©dica',
        order: 4,
        description: 'AvaliaÃ§Ã£o da equipe de saÃºde',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_medico', 'criterios_atendidos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro no Programa',
        order: 5,
        description: 'EfetivaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== SEGURANÃ‡A PÃšBLICA ==========
  ALERTA_SEGURANCA: {
    moduleType: 'ALERTA_SEGURANCA',
    name: 'Workflow - Alerta de SeguranÃ§a',
    description: 'Fluxo para envio de alertas de seguranÃ§a',
    defaultSLA: 1,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Registro do Alerta',
        order: 2,
        description: 'Registro do alerta no sistema',
        slaDays: 0,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_alerta', 'nivel_urgencia', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise e VerificaÃ§Ã£o',
        order: 3,
        description: 'AnÃ¡lise da central de monitoramento',
        slaDays: 0,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['verificacao', 'acao_imediata'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Resposta',
        order: 4,
        description: 'Acionamento de equipe',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['equipe_acionada', 'resultado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  AUTORIZACAO_EVENTO_SEGURANCA: {
    moduleType: 'AUTORIZACAO_EVENTO_SEGURANCA',
    name: 'Workflow - AutorizaÃ§Ã£o de Evento com SeguranÃ§a',
    description: 'Fluxo para autorizaÃ§Ã£o de eventos que requerem esquema de seguranÃ§a',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'AnÃ¡lise do pedido de autorizaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['tipo_evento', 'data_evento', 'publico_esperado', 'local'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Planejamento de SeguranÃ§a',
        order: 4,
        description: 'DefiniÃ§Ã£o do esquema de seguranÃ§a',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['efetivo_necessario', 'pontos_criticos', 'plano_contingencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria PrÃ©via',
        order: 5,
        description: 'Vistoria do local do evento',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_vistoria', 'adequacoes_necessarias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 6,
        description: 'LiberaÃ§Ã£o do evento',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  CADASTRO_PONTO_CRITICO: {
    moduleType: 'CADASTRO_PONTO_CRITICO',
    name: 'Workflow - Cadastro de Ponto CrÃ­tico',
    description: 'Fluxo para cadastro de pontos crÃ­ticos de seguranÃ§a',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Registro do Ponto',
        order: 2,
        description: 'Registro inicial do ponto crÃ­tico',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_ocorrencia', 'descricao', 'frequencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AvaliaÃ§Ã£o da equipe de seguranÃ§a',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nivel_criticidade', 'medidas_sugeridas', 'prioridade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Cadastro no Sistema',
        order: 5,
        description: 'InclusÃ£o no mapa de pontos crÃ­ticos',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  DENUNCIA_ANONIMA: {
    moduleType: 'DENUNCIA_ANONIMA',
    name: 'Workflow - DenÃºncia AnÃ´nima',
    description: 'Fluxo para tratamento de denÃºncias anÃ´nimas',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Triagem',
        order: 2,
        description: 'ClassificaÃ§Ã£o da denÃºncia',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_denuncia', 'gravidade', 'encaminhamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'InvestigaÃ§Ã£o Preliminar',
        order: 4,
        description: 'VerificaÃ§Ã£o inicial das informaÃ§Ãµes',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['verificacao_fatos', 'procedencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Encaminhamento',
        order: 5,
        description: 'Envio ao Ã³rgÃ£o competente',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['orgao_destino'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  LAUDO_VISTORIA_SEGURANCA: {
    moduleType: 'LAUDO_VISTORIA_SEGURANCA',
    name: 'Workflow - Laudo de Vistoria de SeguranÃ§a',
    description: 'Fluxo para emissÃ£o de laudo de vistoria de seguranÃ§a',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'AnÃ¡lise do pedido de vistoria',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['tipo_vistoria', 'finalidade'],
        requiredDocumentTypes: ['AlvarÃ¡ de Funcionamento', 'CNPJ'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 4,
        description: 'Agendamento da vistoria',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'tecnico_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'RealizaÃ§Ã£o da Vistoria',
        order: 5,
        description: 'ExecuÃ§Ã£o da vistoria in loco',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['itens_verificados', 'conformidades', 'nao_conformidades'],
        requiredDocumentTypes: ['AlvarÃ¡ de Funcionamento', 'CNPJ'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Laudo',
        order: 6,
        description: 'ElaboraÃ§Ã£o e emissÃ£o do laudo',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  REGISTRO_OCORRENCIA: {
    moduleType: 'REGISTRO_OCORRENCIA',
    name: 'Workflow - Registro de OcorrÃªncia',
    description: 'Fluxo para registro de ocorrÃªncias de seguranÃ§a',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Registro Inicial',
        order: 2,
        description: 'Registro da ocorrÃªncia',
        slaDays: 0,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_ocorrencia', 'descricao', 'data_hora'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ClassificaÃ§Ã£o',
        order: 4,
        description: 'ClassificaÃ§Ã£o da ocorrÃªncia',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gravidade', 'categoria', 'prioridade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Atendimento',
        order: 5,
        description: 'Atendimento da ocorrÃªncia',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['equipe_responsavel', 'providencias_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'FinalizaÃ§Ã£o',
        order: 6,
        description: 'ConclusÃ£o do atendimento',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['resultado_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  SOLICITACAO_CAMERA_SEGURANCA: {
    moduleType: 'SOLICITACAO_CAMERA_SEGURANCA',
    name: 'Workflow - SolicitaÃ§Ã£o de CÃ¢mera de SeguranÃ§a',
    description: 'Fluxo para solicitaÃ§Ã£o de instalaÃ§Ã£o de cÃ¢meras de seguranÃ§a',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'AnÃ¡lise da demanda',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['justificativa', 'local_proposto', 'area_cobertura'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Estudo de Viabilidade',
        order: 4,
        description: 'AnÃ¡lise tÃ©cnica e financeira',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['viabilidade_tecnica', 'custos', 'prioridade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o OrÃ§amentÃ¡ria',
        order: 5,
        description: 'AprovaÃ§Ã£o de recursos',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['orcamento_aprovado', 'previsao_instalacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'InstalaÃ§Ã£o',
        order: 6,
        description: 'InstalaÃ§Ã£o da cÃ¢mera',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_instalacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  SOLICITACAO_PATRULHAMENTO: {
    moduleType: 'SOLICITACAO_PATRULHAMENTO',
    name: 'Workflow - SolicitaÃ§Ã£o de Patrulhamento',
    description: 'Fluxo para solicitaÃ§Ã£o de patrulhamento em Ã¡rea especÃ­fica',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SolicitaÃ§Ã£o',
        order: 2,
        description: 'AnÃ¡lise da demanda',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_solicitada', 'motivo', 'periodo_desejado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o Operacional',
        order: 4,
        description: 'AvaliaÃ§Ã£o da equipe operacional',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['viabilidade', 'frequencia_patrulha', 'efetivo_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ImplementaÃ§Ã£o',
        order: 5,
        description: 'InÃ­cio do patrulhamento',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_inicio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== SERVIÃ‡OS PÃšBLICOS ==========
  DESOBSTRUCAO_BUEIRO: {
    moduleType: 'DESOBSTRUCAO_BUEIRO',
    name: 'Workflow - DesobstruÃ§Ã£o de Bueiro',
    description: 'Fluxo para solicitaÃ§Ã£o de desobstruÃ§Ã£o de bueiros',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Registro',
        order: 2,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['descricao_problema', 'nivel_obstrucao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria tÃ©cnica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_vistoria', 'equipamentos_necessarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ExecuÃ§Ã£o',
        order: 5,
        description: 'DesobstruÃ§Ã£o do bueiro',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_execucao', 'equipe_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o',
        order: 6,
        description: 'ConfirmaÃ§Ã£o do serviÃ§o',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  ILUMINACAO_PUBLICA: {
    moduleType: 'ILUMINACAO_PUBLICA',
    name: 'Workflow - IluminaÃ§Ã£o PÃºblica',
    description: 'Fluxo para solicitaÃ§Ã£o de reparo ou instalaÃ§Ã£o de iluminaÃ§Ã£o pÃºblica',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Registro',
        order: 2,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_solicitacao', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 4,
        description: 'AvaliaÃ§Ã£o tÃ©cnica do local',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['diagnostico', 'materiais_necessarios'],
        requiredDocumentTypes: ['Foto do Problema'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ExecuÃ§Ã£o',
        order: 5,
        description: 'RealizaÃ§Ã£o do serviÃ§o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_execucao', 'equipe'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o',
        order: 6,
        description: 'VerificaÃ§Ã£o do funcionamento',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  LIMPEZA_URBANA: {
    moduleType: 'LIMPEZA_URBANA',
    name: 'Workflow - Limpeza Urbana',
    description: 'Fluxo para solicitaÃ§Ã£o de serviÃ§os de limpeza urbana',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Registro',
        order: 2,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_limpeza', 'descricao_area'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Planejamento',
        order: 4,
        description: 'Planejamento da operaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_abrangencia', 'recursos_necessarios', 'data_prevista'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ExecuÃ§Ã£o',
        order: 5,
        description: 'RealizaÃ§Ã£o da limpeza',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_execucao', 'equipe_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o',
        order: 6,
        description: 'VerificaÃ§Ã£o do serviÃ§o',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  REGISTRO_PROBLEMA_FOTO: {
    moduleType: 'REGISTRO_PROBLEMA_FOTO',
    name: 'Workflow - Registro de Problema com Foto',
    description: 'Fluxo para registro de problemas urbanos com evidÃªncia fotogrÃ¡fica',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise do Registro',
        order: 2,
        description: 'AnÃ¡lise da solicitaÃ§Ã£o e fotos',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['tipo_problema', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ClassificaÃ§Ã£o e Encaminhamento',
        order: 4,
        description: 'ClassificaÃ§Ã£o e envio ao setor competente',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['categoria', 'setor_responsavel', 'prioridade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ResoluÃ§Ã£o',
        order: 5,
        description: 'ResoluÃ§Ã£o do problema',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_resolucao', 'providencias_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o',
        order: 6,
        description: 'ConfirmaÃ§Ã£o da resoluÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  CAPINA_ROCAGEM: {
    moduleType: 'CAPINA_ROCAGEM',
    name: 'Workflow - Capina e RoÃ§agem',
    description: 'Fluxo para solicitaÃ§Ã£o de capina e roÃ§agem',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Registro',
        order: 2,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_servico', 'descricao_area'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria do local',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_total', 'tipo_vegetacao', 'equipamentos_necessarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Planejamento',
        order: 5,
        description: 'Planejamento da operaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_prevista', 'equipe', 'recursos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ExecuÃ§Ã£o',
        order: 6,
        description: 'RealizaÃ§Ã£o do serviÃ§o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_execucao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o',
        order: 7,
        description: 'VerificaÃ§Ã£o do serviÃ§o',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== TURISMO ==========
  CADASTRO_ESTABELECIMENTO_TURISTICO: {
    moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    name: 'Workflow - Cadastro de Estabelecimento TurÃ­stico',
    description: 'Fluxo para cadastro de estabelecimentos turÃ­sticos',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Documentos',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['nome_estabelecimento', 'categoria', 'tipo_servico'],
        requiredDocumentTypes: ['CNPJ', 'AlvarÃ¡ de Funcionamento', 'Contrato Social'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria do estabelecimento',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_vistoria', 'adequacoes_necessarias', 'classificacao'],
        requiredDocumentTypes: ['CNPJ', 'AlvarÃ¡ de Funcionamento', 'Contrato Social'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AdequaÃ§Ãµes',
        order: 5,
        description: 'RealizaÃ§Ã£o de adequaÃ§Ãµes necessÃ¡rias',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['adequacoes_realizadas'],
        requiredDocumentTypes: ['CNPJ', 'AlvarÃ¡ de Funcionamento', 'Contrato Social'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: true
      },
      {
        name: 'Cadastro',
        order: 6,
        description: 'EfetivaÃ§Ã£o do cadastro',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  CADASTRO_GUIA_TURISTICO: {
    moduleType: 'CADASTRO_GUIA_TURISTICO',
    name: 'Workflow - Cadastro de Guia TurÃ­stico',
    description: 'Fluxo para cadastro e credenciamento de guias turÃ­sticos',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Documentos',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['nome_completo', 'idiomas', 'especializacao'],
        requiredDocumentTypes: ['CPF'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o TÃ©cnica',
        order: 4,
        description: 'AvaliaÃ§Ã£o de qualificaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['experiencia', 'areas_atuacao', 'avaliacacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Teste PrÃ¡tico',
        order: 5,
        description: 'RealizaÃ§Ã£o de teste prÃ¡tico',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_teste', 'resultado', 'parecer'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Credenciamento',
        order: 6,
        description: 'EmissÃ£o de credencial',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  REGISTRO_EVENTO_TURISTICO: {
    moduleType: 'REGISTRO_EVENTO_TURISTICO',
    name: 'Workflow - Registro de Evento TurÃ­stico',
    description: 'Fluxo para registro e divulgaÃ§Ã£o de eventos turÃ­sticos',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e registro inicial da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Proposta',
        order: 2,
        description: 'AnÃ¡lise da proposta de evento',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_evento', 'tipo', 'data_realizacao', 'publico_esperado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o e validaÃ§Ã£o dos dados do formulÃ¡rio',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o TurÃ­stica',
        order: 4,
        description: 'AvaliaÃ§Ã£o do potencial turÃ­stico',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relevancia_turistica', 'impacto_esperado', 'apoio_secretaria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro e DivulgaÃ§Ã£o',
        order: 5,
        description: 'Registro no calendÃ¡rio turÃ­stico',
        slaDays: 4,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },


ACIONAMENTO_SIRENE: {
  moduleType: 'ACIONAMENTO_SIRENE',
  name: 'Workflow - Acionamento de Sirene de Alerta',
  description: 'Fluxo urgente para acionamento de sirene de emergÃªncia',
  defaultSLA: 1,
  stages: [
    {
      name: 'RecepÃ§Ã£o Urgente',
      order: 1,
      description: 'Recebimento imediato da solicitaÃ§Ã£o de emergÃªncia',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['motivo_acionamento', 'localizacao', 'nivel_risco'],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AutorizaÃ§Ã£o',
      order: 2,
      description: 'AutorizaÃ§Ã£o pela coordenaÃ§Ã£o de defesa civil',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    }
  ]
},

ALERTA_EMERGENCIA: {
  moduleType: 'ALERTA_EMERGENCIA',
  name: 'Workflow - Registro de Alerta de EmergÃªncia',
  description: 'Fluxo para registro e acionamento de alertas',
  defaultSLA: 1,
  stages: [
    {
      name: 'Registro',
      order: 1,
      description: 'Registro imediato do alerta',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_alerta', 'area_afetada', 'gravidade'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acionamento',
      order: 2,
      description: 'Acionamento das equipes e sistemas',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

REMOCAO_PREVENTIVA: {
  moduleType: 'REMOCAO_PREVENTIVA',
  name: 'Workflow - RemoÃ§Ã£o Preventiva',
  description: 'Fluxo para remoÃ§Ã£o preventiva de famÃ­lias em Ã¡rea de risco',
  defaultSLA: 2,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Recebimento da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria TÃ©cnica',
      order: 2,
      description: 'AvaliaÃ§Ã£o tÃ©cnica da Ã¡rea de risco',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['nivel_risco', 'parecer_tecnico', 'familias_afetadas'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AutorizaÃ§Ã£o',
      order: 3,
      description: 'AutorizaÃ§Ã£o da remoÃ§Ã£o preventiva',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== SAÃšDE - URGÃŠNCIA ==========

SOLICITACAO_AMBULANCIA: {
  moduleType: 'SOLICITACAO_AMBULANCIA',
  name: 'Workflow - SolicitaÃ§Ã£o de AmbulÃ¢ncia',
  description: 'Fluxo urgente para solicitaÃ§Ã£o de ambulÃ¢ncia',
  defaultSLA: 1,
  stages: [
    {
      name: 'Triagem',
      order: 1,
      description: 'Triagem da urgÃªncia',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_urgencia', 'localizacao', 'condicao_paciente'],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Despacho',
      order: 2,
      description: 'Despacho da ambulÃ¢ncia',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['veiculo', 'equipe'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== POLÃTICAS PARA MULHERES - URGÃŠNCIA ==========

SOS_MULHER: {
  moduleType: 'SOS_MULHER',
  name: 'Workflow - SOS Mulher',
  description: 'Fluxo urgente para pedido de ajuda',
  defaultSLA: 1,
  stages: [
    {
      name: 'Acolhimento Imediato',
      order: 1,
      description: 'Acolhimento e avaliaÃ§Ã£o imediata da situaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['situacao_risco', 'localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acionamento',
      order: 2,
      description: 'Acionamento da rede de proteÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: ['providencias_tomadas'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

CANAL_ESCUTA: {
  moduleType: 'CANAL_ESCUTA',
  name: 'Workflow - Canal de Escuta',
  description: 'Fluxo para acolhimento imediato',
  defaultSLA: 1,
  stages: [
    {
      name: 'Acolhimento',
      order: 1,
      description: 'Escuta qualificada e acolhimento',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['relato', 'encaminhamento_necessario'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Encaminhamento',
      order: 2,
      description: 'Encaminhamento para serviÃ§os especializados',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== DENÃšNCIAS - FLUXO PADRÃƒO ==========

DENUNCIA_ADMINISTRATIVA: {
  moduleType: 'DENUNCIA_ADMINISTRATIVA',
  name: 'Workflow - DenÃºncia de Irregularidade Administrativa',
  description: 'Fluxo para apuraÃ§Ã£o de denÃºncia administrativa',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise Preliminar',
      order: 2,
      description: 'AnÃ¡lise de admissibilidade e classificaÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['tipo_irregularidade', 'setor_responsavel', 'gravidade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'InvestigaÃ§Ã£o',
      order: 3,
      description: 'ApuraÃ§Ã£o e coleta de provas',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['resultado_investigacao'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'DecisÃ£o',
      order: 4,
      description: 'DecisÃ£o sobre as providÃªncias',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_AREA_RISCO: {
  moduleType: 'DENUNCIA_AREA_RISCO',
  name: 'Workflow - DenÃºncia de Ãrea de Risco',
  description: 'Fluxo para denÃºncia de Ã¡rea de risco',
  defaultSLA: 3,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria TÃ©cnica',
      order: 2,
      description: 'AvaliaÃ§Ã£o tÃ©cnica no local',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['nivel_risco', 'tipo_risco', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'NotificaÃ§Ã£o',
      order: 3,
      description: 'NotificaÃ§Ã£o dos responsÃ¡veis',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acompanhamento',
      order: 4,
      description: 'Monitoramento das providÃªncias',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_ASSEDIO: {
  moduleType: 'DENUNCIA_ASSEDIO',
  name: 'Workflow - DenÃºncia de AssÃ©dio no Trabalho',
  description: 'Fluxo para denÃºncia de assÃ©dio no ambiente de trabalho',
  defaultSLA: 3,
  stages: [
    {
      name: 'Acolhimento',
      order: 1,
      description: 'RecepÃ§Ã£o sigilosa da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_assedio', 'local_trabalho'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ApuraÃ§Ã£o',
      order: 2,
      description: 'InvestigaÃ§Ã£o sigilosa dos fatos',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['relatorio_apuracao'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'DecisÃ£o',
      order: 3,
      description: 'DecisÃ£o sobre medidas a serem tomadas',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_COMERCIO_IRREGULAR: {
  moduleType: 'DENUNCIA_COMERCIO_IRREGULAR',
  name: 'Workflow - DenÃºncia de ComÃ©rcio Irregular',
  description: 'Fluxo para denÃºncia de comÃ©rcio irregular',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria',
      order: 2,
      description: 'Vistoria no local denunciado',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['situacao_encontrada', 'tipo_irregularidade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Auto de InfraÃ§Ã£o',
      order: 3,
      description: 'Lavratura de auto de infraÃ§Ã£o se procedente',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: true
    },
    {
      name: 'Acompanhamento',
      order: 4,
      description: 'Monitoramento da regularizaÃ§Ã£o',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_CONSTRUCAO: {
  moduleType: 'DENUNCIA_CONSTRUCAO',
  name: 'Workflow - DenÃºncia de ConstruÃ§Ã£o em Encosta',
  description: 'Fluxo para denÃºncia de construÃ§Ã£o irregular em encosta',
  defaultSLA: 3,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria TÃ©cnica Urgente',
      order: 2,
      description: 'AvaliaÃ§Ã£o tÃ©cnica da construÃ§Ã£o e do risco',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['nivel_risco', 'situacao_construcao', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Embargo',
      order: 3,
      description: 'Embargo da obra se necessÃ¡rio',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: true
    },
    {
      name: 'Acompanhamento',
      order: 4,
      description: 'Monitoramento da situaÃ§Ã£o',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_DESCARTE_IRREGULAR: {
  moduleType: 'DENUNCIA_DESCARTE_IRREGULAR',
  name: 'Workflow - DenÃºncia de Descarte Irregular',
  description: 'Fluxo para denÃºncia de descarte irregular de lixo',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria',
      order: 2,
      description: 'Vistoria no local',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['tipo_residuo', 'volume_aproximado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'NotificaÃ§Ã£o',
      order: 3,
      description: 'NotificaÃ§Ã£o do responsÃ¡vel para remoÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'RemoÃ§Ã£o',
      order: 4,
      description: 'VerificaÃ§Ã£o da remoÃ§Ã£o ou remoÃ§Ã£o pela prefeitura',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_POLUICAO_SONORA: {
  moduleType: 'DENUNCIA_POLUICAO_SONORA',
  name: 'Workflow - DenÃºncia de PoluiÃ§Ã£o Sonora',
  description: 'Fluxo para denÃºncia de poluiÃ§Ã£o sonora',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria',
      order: 2,
      description: 'Vistoria com mediÃ§Ã£o sonora',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['nivel_ruido', 'fonte_ruido'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'NotificaÃ§Ã£o',
      order: 3,
      description: 'NotificaÃ§Ã£o para adequaÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acompanhamento',
      order: 4,
      description: 'VerificaÃ§Ã£o da adequaÃ§Ã£o',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_PROBLEMA: {
  moduleType: 'DENUNCIA_PROBLEMA',
  name: 'Workflow - DenÃºncia de Problema em Sistema',
  description: 'Fluxo para denÃºncia de problema tÃ©cnico em sistema',
  defaultSLA: 3,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro do problema',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['sistema_afetado', 'tipo_problema'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise TÃ©cnica',
      order: 2,
      description: 'AnÃ¡lise e diagnÃ³stico do problema',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['diagnostico', 'solucao_proposta'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'CorreÃ§Ã£o',
      order: 3,
      description: 'ImplementaÃ§Ã£o da correÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_QUEIMADA: {
  moduleType: 'DENUNCIA_QUEIMADA',
  name: 'Workflow - DenÃºncia de Queimada',
  description: 'Fluxo para denÃºncia de queimada irregular',
  defaultSLA: 2,
  stages: [
    {
      name: 'RecepÃ§Ã£o Urgente',
      order: 1,
      description: 'Registro da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'dimensao_aproximada'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acionamento',
      order: 2,
      description: 'Acionamento de brigada ou bombeiros',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: ['equipe_acionada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ApuraÃ§Ã£o',
      order: 3,
      description: 'ApuraÃ§Ã£o de responsabilidade',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: true
    }
  ]
},

DENUNCIA_SANITARIA: {
  moduleType: 'DENUNCIA_SANITARIA',
  name: 'Workflow - DenÃºncia SanitÃ¡ria',
  description: 'Fluxo para denÃºncia de irregularidade sanitÃ¡ria',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'InspeÃ§Ã£o SanitÃ¡ria',
      order: 2,
      description: 'InspeÃ§Ã£o tÃ©cnica pela vigilÃ¢ncia sanitÃ¡ria',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['tipo_irregularidade', 'nivel_gravidade', 'laudo_sanitario'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Auto de InfraÃ§Ã£o',
      order: 3,
      description: 'Lavratura de auto se procedente',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: true
    },
    {
      name: 'Acompanhamento',
      order: 4,
      description: 'Monitoramento da adequaÃ§Ã£o',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_TRANSPORTE_CLANDESTINO: {
  moduleType: 'DENUNCIA_TRANSPORTE_CLANDESTINO',
  name: 'Workflow - DenÃºncia de Transporte Clandestino',
  description: 'Fluxo para denÃºncia de transporte clandestino',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_veiculo', 'localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'FiscalizaÃ§Ã£o',
      order: 2,
      description: 'FiscalizaÃ§Ã£o no local',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['situacao_encontrada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Auto de InfraÃ§Ã£o',
      order: 3,
      description: 'Lavratura de auto e apreensÃ£o se necessÃ¡rio',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: true
    }
  ]
},

DENUNCIA_VEICULO_ABANDONADO: {
  moduleType: 'DENUNCIA_VEICULO_ABANDONADO',
  name: 'Workflow - DenÃºncia de VeÃ­culo Abandonado',
  description: 'Fluxo para denÃºncia de veÃ­culo abandonado',
  defaultSLA: 7,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da denÃºncia',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'tipo_veiculo'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria',
      order: 2,
      description: 'Vistoria e identificaÃ§Ã£o do veÃ­culo',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['placa', 'condicoes_veiculo'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'NotificaÃ§Ã£o',
      order: 3,
      description: 'NotificaÃ§Ã£o do proprietÃ¡rio',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'RemoÃ§Ã£o',
      order: 4,
      description: 'RemoÃ§Ã£o do veÃ­culo',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_VIOLENCIA: {
  moduleType: 'DENUNCIA_VIOLENCIA',
  name: 'Workflow - DenÃºncia de ViolÃªncia contra a Mulher',
  description: 'Fluxo urgente para denÃºncia de violÃªncia',
  defaultSLA: 2,
  stages: [
    {
      name: 'Acolhimento Urgente',
      order: 1,
      description: 'RecepÃ§Ã£o sigilosa e acolhimento',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['situacao_risco', 'tipo_violencia'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acionamento Rede ProteÃ§Ã£o',
      order: 2,
      description: 'Acionamento imediato da rede de proteÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: ['providencias_tomadas', 'orgaos_acionados'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acompanhamento',
      order: 3,
      description: 'Acompanhamento da vÃ­tima',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DENUNCIA_VIOLENCIA_DOMESTICA: {
  moduleType: 'DENUNCIA_VIOLENCIA_DOMESTICA',
  name: 'Workflow - DenÃºncia de ViolÃªncia DomÃ©stica',
  description: 'Fluxo urgente para denÃºncia de violÃªncia domÃ©stica',
  defaultSLA: 2,
  stages: [
    {
      name: 'Acolhimento Urgente',
      order: 1,
      description: 'RecepÃ§Ã£o sigilosa e acolhimento',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['situacao_risco', 'tipo_violencia', 'vitima_protegida'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acionamento Emergencial',
      order: 2,
      description: 'Acionamento de polÃ­cia e rede de proteÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: ['providencias_tomadas', 'orgaos_acionados'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acompanhamento Psicossocial',
      order: 3,
      description: 'Acompanhamento da vÃ­tima e famÃ­lia',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== SERVIÃ‡OS DE LIMPEZA E MANUTENÃ‡ÃƒO URBANA ==========

COLETA_ELETRONICO: {
  moduleType: 'COLETA_ELETRONICO',
  name: 'Workflow - Coleta de Lixo EletrÃ´nico',
  description: 'Fluxo para solicitaÃ§Ã£o de coleta de lixo eletrÃ´nico',
  defaultSLA: 7,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_equipamento', 'quantidade', 'localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Agendamento',
      order: 2,
      description: 'Agendamento da coleta',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_coleta', 'equipe_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 3,
      description: 'RealizaÃ§Ã£o da coleta',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

CONTENTOR_LIXO: {
  moduleType: 'CONTENTOR_LIXO',
  name: 'Workflow - SolicitaÃ§Ã£o de Contentor de Lixo',
  description: 'Fluxo para solicitaÃ§Ã£o de contentor de lixo',
  defaultSLA: 10,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'capacidade_solicitada'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise TÃ©cnica',
      order: 2,
      description: 'AvaliaÃ§Ã£o da viabilidade e local',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'viabilidade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 3,
      description: 'AprovaÃ§Ã£o pela coordenaÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'InstalaÃ§Ã£o',
      order: 4,
      description: 'InstalaÃ§Ã£o do contentor',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DEDETIZACAO: {
  moduleType: 'DEDETIZACAO',
  name: 'Workflow - DedetizaÃ§Ã£o e Controle de Pragas',
  description: 'Fluxo para solicitaÃ§Ã£o de dedetizaÃ§Ã£o',
  defaultSLA: 7,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_praga', 'localizacao', 'area_aproximada'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria',
      order: 2,
      description: 'Vistoria para avaliar a situaÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['nivel_infestacao', 'tratamento_recomendado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 3,
      description: 'RealizaÃ§Ã£o do serviÃ§o',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: ['produtos_utilizados'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

LIMPEZA_BOCA_LOBO: {
  moduleType: 'LIMPEZA_BOCA_LOBO',
  name: 'Workflow - Limpeza de Boca de Lobo',
  description: 'Fluxo para solicitaÃ§Ã£o de limpeza de boca de lobo',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ProgramaÃ§Ã£o',
      order: 2,
      description: 'ProgramaÃ§Ã£o do serviÃ§o na rota',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_prevista'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 3,
      description: 'RealizaÃ§Ã£o da limpeza',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

LIMPEZA_FEIRA: {
  moduleType: 'LIMPEZA_FEIRA',
  name: 'Workflow - Limpeza de Feira Livre',
  description: 'Fluxo para solicitaÃ§Ã£o de limpeza de feira livre',
  defaultSLA: 3,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'dia_feira'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ProgramaÃ§Ã£o',
      order: 2,
      description: 'ProgramaÃ§Ã£o da equipe',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['equipe_responsavel', 'horario'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 3,
      description: 'RealizaÃ§Ã£o da limpeza',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

LIMPEZA_TERRENO_ABANDONADO: {
  moduleType: 'LIMPEZA_TERRENO_ABANDONADO',
  name: 'Workflow - Limpeza de Terreno Abandonado',
  description: 'Fluxo para limpeza de terreno abandonado',
  defaultSLA: 15,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'area_aproximada'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria',
      order: 2,
      description: 'Vistoria e identificaÃ§Ã£o do proprietÃ¡rio',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['situacao_terreno', 'proprietario_identificado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'NotificaÃ§Ã£o',
      order: 3,
      description: 'NotificaÃ§Ã£o do proprietÃ¡rio',
      slaDays: 5,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 4,
      description: 'Limpeza pela prefeitura ou verificaÃ§Ã£o',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

CONSERTO_CALCAMENTO: {
  moduleType: 'CONSERTO_CALCAMENTO',
  name: 'Workflow - Conserto de CalÃ§amento',
  description: 'Fluxo para solicitaÃ§Ã£o de conserto de calÃ§amento',
  defaultSLA: 15,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'extensao_dano'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria TÃ©cnica',
      order: 2,
      description: 'AvaliaÃ§Ã£o tÃ©cnica do dano',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['tipo_intervencao', 'orcamento_estimado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 3,
      description: 'AprovaÃ§Ã£o do serviÃ§o',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 4,
      description: 'RealizaÃ§Ã£o do conserto',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

PINTURA_MEIO_FIO: {
  moduleType: 'PINTURA_MEIO_FIO',
  name: 'Workflow - Pintura de Meio-Fio',
  description: 'Fluxo para solicitaÃ§Ã£o de pintura de meio-fio',
  defaultSLA: 10,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'extensao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise',
      order: 2,
      description: 'AnÃ¡lise da necessidade',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['prioridade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ProgramaÃ§Ã£o',
      order: 3,
      description: 'ProgramaÃ§Ã£o na rota de serviÃ§os',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_prevista'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 4,
      description: 'RealizaÃ§Ã£o da pintura',
      slaDays: 7,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

VARRICAO_RUA: {
  moduleType: 'VARRICAO_RUA',
  name: 'Workflow - VarriÃ§Ã£o de Rua',
  description: 'Fluxo para solicitaÃ§Ã£o de varriÃ§Ã£o de rua',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ProgramaÃ§Ã£o',
      order: 2,
      description: 'InclusÃ£o na rota de varriÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_prevista'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 3,
      description: 'RealizaÃ§Ã£o da varriÃ§Ã£o',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

REMOCAO_ANIMAL: {
  moduleType: 'REMOCAO_ANIMAL',
  name: 'Workflow - RemoÃ§Ã£o de Animal Morto',
  description: 'Fluxo para remoÃ§Ã£o de animal morto em via pÃºblica',
  defaultSLA: 2,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'tipo_animal'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acionamento',
      order: 2,
      description: 'Acionamento da equipe de remoÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['equipe_acionada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 3,
      description: 'RemoÃ§Ã£o e descarte adequado',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

ECOPONTO: {
  moduleType: 'ECOPONTO',
  name: 'Workflow - SolicitaÃ§Ã£o de Ecoponto',
  description: 'Fluxo para solicitaÃ§Ã£o de instalaÃ§Ã£o de ecoponto',
  defaultSLA: 30,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Estudo de Viabilidade',
      order: 2,
      description: 'AnÃ¡lise tÃ©cnica da viabilidade',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'viabilidade', 'demanda_estimada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 3,
      description: 'AprovaÃ§Ã£o pela coordenaÃ§Ã£o',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ImplantaÃ§Ã£o',
      order: 4,
      description: 'ImplantaÃ§Ã£o do ecoponto',
      slaDays: 30,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== INFRAESTRUTURA E OBRAS ==========

APROVACAO_CALCADA: {
  moduleType: 'APROVACAO_CALCADA',
  name: 'Workflow - AprovaÃ§Ã£o de CalÃ§ada',
  description: 'Fluxo para aprovaÃ§Ã£o de projeto de calÃ§ada',
  defaultSLA: 20,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Recebimento da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise Documental',
      order: 2,
      description: 'VerificaÃ§Ã£o dos documentos obrigatÃ³rios',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise TÃ©cnica',
      order: 3,
      description: 'AvaliaÃ§Ã£o do projeto pela engenharia',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'conforme_normas'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o Final',
      order: 4,
      description: 'AprovaÃ§Ã£o final do projeto',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'EmissÃ£o de AlvarÃ¡',
      order: 5,
      description: 'EmissÃ£o do alvarÃ¡ de execuÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

APROVACAO_MURO: {
  moduleType: 'APROVACAO_MURO',
  name: 'Workflow - AprovaÃ§Ã£o de Muro e Gradil',
  description: 'Fluxo para aprovaÃ§Ã£o de construÃ§Ã£o de muro',
  defaultSLA: 20,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Recebimento da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise Documental',
      order: 2,
      description: 'VerificaÃ§Ã£o dos documentos obrigatÃ³rios',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise TÃ©cnica',
      order: 3,
      description: 'AvaliaÃ§Ã£o do projeto pela engenharia',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'altura_muro', 'conforme_normas'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o Final',
      order: 4,
      description: 'AprovaÃ§Ã£o final do projeto',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'EmissÃ£o de AlvarÃ¡',
      order: 5,
      description: 'EmissÃ£o do alvarÃ¡ de execuÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

APROVACAO_TERRAPLENO: {
  moduleType: 'APROVACAO_TERRAPLENO',
  name: 'Workflow - AprovaÃ§Ã£o de Terraplanagem',
  description: 'Fluxo para aprovaÃ§Ã£o de projeto de terraplanagem',
  defaultSLA: 25,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Recebimento da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise Documental',
      order: 2,
      description: 'VerificaÃ§Ã£o dos documentos obrigatÃ³rios',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise TÃ©cnica',
      order: 3,
      description: 'AvaliaÃ§Ã£o tÃ©cnica do projeto',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'impacto_ambiental', 'conformidade_tecnica'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o Ambiental',
      order: 4,
      description: 'AnÃ¡lise de impacto ambiental',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_ambiental'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o Final',
      order: 5,
      description: 'AprovaÃ§Ã£o final do projeto',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'EmissÃ£o de AlvarÃ¡',
      order: 6,
      description: 'EmissÃ£o do alvarÃ¡ de terraplanagem',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

VISTORIA_ESTRUTURAL: {
  moduleType: 'VISTORIA_ESTRUTURAL',
  name: 'Workflow - Vistoria Estrutural',
  description: 'Fluxo para vistoria estrutural de edificaÃ§Ã£o',
  defaultSLA: 10,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['motivo_vistoria', 'localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Agendamento',
      order: 2,
      description: 'Agendamento da vistoria',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_vistoria', 'engenheiro_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria TÃ©cnica',
      order: 3,
      description: 'RealizaÃ§Ã£o da vistoria no local',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['laudo_tecnico', 'situacao_estrutural', 'risco_identificado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'EmissÃ£o de Laudo',
      order: 4,
      description: 'EmissÃ£o do laudo tÃ©cnico',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

VISTORIA_TECNICA: {
  moduleType: 'VISTORIA_TECNICA',
  name: 'Workflow - Vistoria TÃ©cnica de EdificaÃ§Ã£o',
  description: 'Fluxo para vistoria tÃ©cnica geral',
  defaultSLA: 10,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_vistoria', 'localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Agendamento',
      order: 2,
      description: 'Agendamento da vistoria',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_vistoria', 'tecnico_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria',
      order: 3,
      description: 'RealizaÃ§Ã£o da vistoria',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'conformidade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'EmissÃ£o de Parecer',
      order: 4,
      description: 'EmissÃ£o do parecer tÃ©cnico',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

MANUTENCAO_JARDIM: {
  moduleType: 'MANUTENCAO_JARDIM',
  name: 'Workflow - ManutenÃ§Ã£o de Jardim PÃºblico',
  description: 'Fluxo para manutenÃ§Ã£o de jardim pÃºblico',
  defaultSLA: 10,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'tipo_servico'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria',
      order: 2,
      description: 'Vistoria do jardim',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['situacao_jardim', 'servicos_necessarios'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ProgramaÃ§Ã£o',
      order: 3,
      description: 'ProgramaÃ§Ã£o do serviÃ§o',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_prevista', 'equipe_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 4,
      description: 'RealizaÃ§Ã£o da manutenÃ§Ã£o',
      slaDays: 7,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

PODA_CANTEIRO: {
  moduleType: 'PODA_CANTEIRO',
  name: 'Workflow - Poda de Ãrvore em Canteiro',
  description: 'Fluxo para poda de Ã¡rvore em canteiro central',
  defaultSLA: 10,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'tipo_arvore'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria TÃ©cnica',
      order: 2,
      description: 'AvaliaÃ§Ã£o tÃ©cnica por engenheiro florestal',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['tipo_poda', 'urgencia', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AutorizaÃ§Ã£o',
      order: 3,
      description: 'AutorizaÃ§Ã£o ambiental',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 4,
      description: 'RealizaÃ§Ã£o da poda',
      slaDays: 7,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

RECUPERACAO_PRACA: {
  moduleType: 'RECUPERACAO_PRACA',
  name: 'Workflow - RecuperaÃ§Ã£o de PraÃ§a',
  description: 'Fluxo para recuperaÃ§Ã£o de praÃ§a pÃºblica',
  defaultSLA: 30,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'problemas_identificados'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria TÃ©cnica',
      order: 2,
      description: 'AvaliaÃ§Ã£o tÃ©cnica da praÃ§a',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['estado_conservacao', 'intervencoes_necessarias', 'orcamento_estimado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ElaboraÃ§Ã£o de Projeto',
      order: 3,
      description: 'ElaboraÃ§Ã£o do projeto de recuperaÃ§Ã£o',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredInputFieldIds: ['projeto_elaborado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 4,
      description: 'AprovaÃ§Ã£o do projeto e orÃ§amento',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 5,
      description: 'RealizaÃ§Ã£o da recuperaÃ§Ã£o',
      slaDays: 30,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== TRÃ‚NSITO E MOBILIDADE ==========

RECLAMACAO_TRANSITO: {
  moduleType: 'RECLAMACAO_TRANSITO',
  name: 'Workflow - ReclamaÃ§Ã£o sobre TrÃ¢nsito',
  description: 'Fluxo para reclamaÃ§Ã£o relacionada ao trÃ¢nsito',
  defaultSLA: 10,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da reclamaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_reclamacao', 'localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise',
      order: 2,
      description: 'AnÃ¡lise da reclamaÃ§Ã£o',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['procedencia', 'providencias_necessarias'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Vistoria',
      order: 3,
      description: 'Vistoria no local se necessÃ¡rio',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: true
    },
    {
      name: 'ProvidÃªncias',
      order: 4,
      description: 'ImplementaÃ§Ã£o das providÃªncias',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

RECLAMACAO_TRANSPORTE: {
  moduleType: 'RECLAMACAO_TRANSPORTE',
  name: 'Workflow - ReclamaÃ§Ã£o sobre Transporte',
  description: 'Fluxo para reclamaÃ§Ã£o sobre transporte pÃºblico',
  defaultSLA: 7,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da reclamaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_reclamacao', 'linha_transporte'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise',
      order: 2,
      description: 'AnÃ¡lise da reclamaÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['procedencia', 'providencias_necessarias'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'NotificaÃ§Ã£o ConcessionÃ¡ria',
      order: 3,
      description: 'NotificaÃ§Ã£o da empresa de transporte',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: true
    },
    {
      name: 'Acompanhamento',
      order: 4,
      description: 'Acompanhamento das providÃªncias',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

SINALIZACAO_TRANSITO: {
  moduleType: 'SINALIZACAO_TRANSITO',
  name: 'Workflow - SolicitaÃ§Ã£o de SinalizaÃ§Ã£o de TrÃ¢nsito',
  description: 'Fluxo para solicitaÃ§Ã£o de sinalizaÃ§Ã£o',
  defaultSLA: 20,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_sinalizacao', 'localizacao', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Estudo TÃ©cnico',
      order: 2,
      description: 'Estudo de viabilidade tÃ©cnica',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'viabilidade', 'tipo_sinalizacao_recomendada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 3,
      description: 'AprovaÃ§Ã£o pela coordenaÃ§Ã£o de trÃ¢nsito',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ImplantaÃ§Ã£o',
      order: 4,
      description: 'ImplantaÃ§Ã£o da sinalizaÃ§Ã£o',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

SOLICITACAO_LOMBADA: {
  moduleType: 'SOLICITACAO_LOMBADA',
  name: 'Workflow - SolicitaÃ§Ã£o de Lombada',
  description: 'Fluxo para solicitaÃ§Ã£o de lombada/redutor de velocidade',
  defaultSLA: 30,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Estudo de Viabilidade',
      order: 2,
      description: 'Estudo tÃ©cnico de viabilidade e necessidade',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['estudo_fluxo', 'velocidade_media', 'acidentes_registrados', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 3,
      description: 'AprovaÃ§Ã£o pela coordenaÃ§Ã£o de trÃ¢nsito',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ImplantaÃ§Ã£o',
      order: 4,
      description: 'ImplantaÃ§Ã£o da lombada',
      slaDays: 20,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

SOLICITACAO_SEMAFORO: {
  moduleType: 'SOLICITACAO_SEMAFORO',
  name: 'Workflow - SolicitaÃ§Ã£o de SemÃ¡foro',
  description: 'Fluxo para solicitaÃ§Ã£o de instalaÃ§Ã£o de semÃ¡foro',
  defaultSLA: 60,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Estudo de Viabilidade',
      order: 2,
      description: 'Estudo tÃ©cnico completo',
      slaDays: 30,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['contagem_veiculos', 'contagem_pedestres', 'acidentes_registrados', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise OrÃ§amentÃ¡ria',
      order: 3,
      description: 'AnÃ¡lise de custos e disponibilidade orÃ§amentÃ¡ria',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['orcamento', 'recurso_disponivel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 4,
      description: 'AprovaÃ§Ã£o final',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ImplantaÃ§Ã£o',
      order: 5,
      description: 'InstalaÃ§Ã£o do semÃ¡foro',
      slaDays: 30,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

SOLICITACAO_PONTO_ONIBUS: {
  moduleType: 'SOLICITACAO_PONTO_ONIBUS',
  name: 'Workflow - SolicitaÃ§Ã£o de Ponto de Ã”nibus',
  description: 'Fluxo para solicitaÃ§Ã£o de ponto de Ã´nibus',
  defaultSLA: 30,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Estudo de Viabilidade',
      order: 2,
      description: 'Estudo tÃ©cnico de viabilidade',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['demanda_estimada', 'viabilidade_local', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 3,
      description: 'AprovaÃ§Ã£o pela coordenaÃ§Ã£o de transporte',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ImplantaÃ§Ã£o',
      order: 4,
      description: 'InstalaÃ§Ã£o do ponto de Ã´nibus',
      slaDays: 30,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

SUGESTAO_LINHA: {
  moduleType: 'SUGESTAO_LINHA',
  name: 'Workflow - SugestÃ£o de Nova Linha de Ã”nibus',
  description: 'Fluxo para sugestÃ£o de nova linha de transporte',
  defaultSLA: 60,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da sugestÃ£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['origem', 'destino', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise Preliminar',
      order: 2,
      description: 'AnÃ¡lise inicial da demanda',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['demanda_estimada', 'viabilidade_preliminar'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Estudo de Viabilidade',
      order: 3,
      description: 'Estudo tÃ©cnico completo',
      slaDays: 30,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['estudo_demanda', 'viabilidade_operacional', 'viabilidade_financeira'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 4,
      description: 'AprovaÃ§Ã£o pela gestÃ£o',
      slaDays: 10,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ImplantaÃ§Ã£o',
      order: 5,
      description: 'ImplantaÃ§Ã£o da nova linha',
      slaDays: 30,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== SERVIÃ‡OS ADMINISTRATIVOS E ATENDIMENTO ==========

OUVIDORIA: {
  moduleType: 'OUVIDORIA',
  name: 'Workflow - ManifestaÃ§Ã£o na Ouvidoria',
  description: 'Fluxo para manifestaÃ§Ãµes na ouvidoria',
  defaultSLA: 10,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da manifestaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_manifestacao', 'setor_responsavel'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ClassificaÃ§Ã£o',
      order: 2,
      description: 'ClassificaÃ§Ã£o e encaminhamento',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['classificacao', 'area_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise',
      order: 3,
      description: 'AnÃ¡lise pela Ã¡rea responsÃ¡vel',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_area', 'providencias_tomadas'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Resposta',
      order: 4,
      description: 'ElaboraÃ§Ã£o e envio de resposta',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

SIC: {
  moduleType: 'SIC',
  name: 'Workflow - SolicitaÃ§Ã£o ao SIC',
  description: 'Fluxo para pedidos de informaÃ§Ã£o ao cidadÃ£o',
  defaultSLA: 20,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['informacao_solicitada', 'setor_responsavel'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ClassificaÃ§Ã£o',
      order: 2,
      description: 'ClassificaÃ§Ã£o e encaminhamento',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['area_responsavel', 'complexidade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Busca de InformaÃ§Ã£o',
      order: 3,
      description: 'Levantamento da informaÃ§Ã£o solicitada',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['informacao_encontrada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Resposta',
      order: 4,
      description: 'ElaboraÃ§Ã£o e envio de resposta',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

ATENDIMENTO_CRAS_GERAL: {
  moduleType: 'ATENDIMENTO_CRAS_GERAL',
  name: 'Workflow - Atendimento CRAS',
  description: 'Fluxo para atendimento geral no CRAS',
  defaultSLA: 5,
  stages: [
    {
      name: 'Acolhimento',
      order: 1,
      description: 'Acolhimento inicial do cidadÃ£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_demanda', 'situacao_familia'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AvaliaÃ§Ã£o Social',
      order: 2,
      description: 'AvaliaÃ§Ã£o pela assistÃªncia social',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['diagnostico_social', 'encaminhamentos_necessarios'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Encaminhamento',
      order: 3,
      description: 'Encaminhamento para serviÃ§os e programas',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: ['servicos_encaminhados'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DOCUMENTACAO_CIVIL: {
  moduleType: 'DOCUMENTACAO_CIVIL',
  name: 'Workflow - DocumentaÃ§Ã£o Civil Gratuita',
  description: 'Fluxo para solicitaÃ§Ã£o de documentaÃ§Ã£o civil',
  defaultSLA: 15,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_documento', 'justificativa_gratuidade'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise Documental',
      order: 2,
      description: 'VerificaÃ§Ã£o de documentos e requisitos',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: ['RG'],
      requiredInputFieldIds: ['situacao_economica_verificada'],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 3,
      description: 'AprovaÃ§Ã£o da gratuidade',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Encaminhamento CartÃ³rio',
      order: 4,
      description: 'Encaminhamento ao cartÃ³rio',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acompanhamento',
      order: 5,
      description: 'Acompanhamento da emissÃ£o',
      slaDays: 10,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

AGENDAMENTO_GERAL: {
  moduleType: 'AGENDAMENTO_GERAL',
  name: 'Workflow - Agendamento de ServiÃ§os Gerais',
  description: 'Fluxo para agendamento de serviÃ§os gerais',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o de agendamento',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_servico', 'data_preferencial'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Agendamento',
      order: 2,
      description: 'ConfirmaÃ§Ã£o do agendamento',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_agendada', 'horario', 'local'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ConfirmaÃ§Ã£o',
      order: 3,
      description: 'ConfirmaÃ§Ã£o com o cidadÃ£o',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

CALENDARIO_COLETA: {
  moduleType: 'CALENDARIO_COLETA',
  name: 'Workflow - CalendÃ¡rio de Coleta Seletiva',
  description: 'Fluxo para consulta de calendÃ¡rio de coleta',
  defaultSLA: 1,
  stages: [
    {
      name: 'Consulta',
      order: 1,
      description: 'Fornecimento de informaÃ§Ãµes sobre coleta',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['endereco', 'informacao_fornecida'],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

CALENDARIO_ESCOLAR: {
  moduleType: 'CALENDARIO_ESCOLAR',
  name: 'Workflow - Consulta de CalendÃ¡rio Escolar',
  description: 'Fluxo para consulta de calendÃ¡rio escolar',
  defaultSLA: 1,
  stages: [
    {
      name: 'Consulta',
      order: 1,
      description: 'Fornecimento do calendÃ¡rio escolar',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['ano_letivo', 'escola', 'informacao_fornecida'],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

DOACAO_DESABRIGADOS: {
  moduleType: 'DOACAO_DESABRIGADOS',
  name: 'Workflow - DoaÃ§Ã£o para Desabrigados',
  description: 'Fluxo para solicitaÃ§Ã£o de doaÃ§Ã£o para desabrigados',
  defaultSLA: 3,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_necessidade', 'numero_familias', 'localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AvaliaÃ§Ã£o',
      order: 1,
      description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o emergencial',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['situacao_verificada', 'itens_necessarios'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'MobilizaÃ§Ã£o',
      order: 3,
      description: 'MobilizaÃ§Ã£o de doaÃ§Ãµes',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: ['doacoes_arrecadadas'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Entrega',
      order: 4,
      description: 'DistribuiÃ§Ã£o das doaÃ§Ãµes',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

PATRULHA_ESCOLAR: {
  moduleType: 'PATRULHA_ESCOLAR',
  name: 'Workflow - SolicitaÃ§Ã£o de Patrulha Escolar',
  description: 'Fluxo para solicitaÃ§Ã£o de patrulha escolar',
  defaultSLA: 10,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['escola', 'horarios_necessarios', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise',
      order: 2,
      description: 'AnÃ¡lise da necessidade e viabilidade',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_seguranca', 'viabilidade_operacional'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 3,
      description: 'AprovaÃ§Ã£o pela coordenaÃ§Ã£o de seguranÃ§a',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ImplementaÃ§Ã£o',
      order: 4,
      description: 'OrganizaÃ§Ã£o da escala de patrulhamento',
      slaDays: 7,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

ILUMINACAO_SEGURANCA: {
  moduleType: 'ILUMINACAO_SEGURANCA',
  name: 'Workflow - IluminaÃ§Ã£o para SeguranÃ§a',
  description: 'Fluxo para solicitaÃ§Ã£o de iluminaÃ§Ã£o pÃºblica',
  defaultSLA: 15,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria TÃ©cnica',
      order: 2,
      description: 'AvaliaÃ§Ã£o tÃ©cnica no local',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['situacao_atual', 'tipo_intervencao', 'orcamento'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 3,
      description: 'AprovaÃ§Ã£o pela coordenaÃ§Ã£o',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ExecuÃ§Ã£o',
      order: 4,
      description: 'InstalaÃ§Ã£o da iluminaÃ§Ã£o',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== CADASTROS E INSCRIÃ‡Ã•ES ==========

CADASTRO_BALCAO_EMPREGOS: {
  moduleType: 'CADASTRO_BALCAO_EMPREGOS',
  name: 'Workflow - Cadastro no BalcÃ£o de Empregos',
  description: 'Fluxo para cadastro de candidato a emprego',
  defaultSLA: 3,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro do cadastro',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['qualificacao', 'area_interesse', 'disponibilidade'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise de Perfil',
      order: 2,
      description: 'AnÃ¡lise do perfil profissional',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['perfil_mapeado', 'vagas_compativeis'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AtivaÃ§Ã£o',
      order: 3,
      description: 'AtivaÃ§Ã£o do cadastro no sistema',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

CADASTRO_CAMERAS_BAIRRO: {
  moduleType: 'CADASTRO_CAMERAS_BAIRRO',
  name: 'Workflow - Cadastro de CÃ¢meras de SeguranÃ§a',
  description: 'Fluxo para cadastro de cÃ¢meras particulares',
  defaultSLA: 7,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro do cadastro',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao_cameras', 'numero_cameras', 'tipo_equipamento'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise Documental',
      order: 2,
      description: 'VerificaÃ§Ã£o de documentos',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: ['Justificativa', 'Projeto ou Memorial', 'AutorizaÃ§Ã£o do ResponsÃ¡vel'],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Vistoria TÃ©cnica',
      order: 3,
      description: 'Vistoria das cÃ¢meras cadastradas',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['qualidade_imagem', 'cobertura_area', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 4,
      description: 'AprovaÃ§Ã£o e inclusÃ£o no sistema',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

GRUPO_WHATSAPP_VIZINHANCA: {
  moduleType: 'GRUPO_WHATSAPP_VIZINHANCA',
  name: 'Workflow - Cadastro em Grupo de WhatsApp de SeguranÃ§a',
  description: 'Fluxo para cadastro em grupo de vizinhanÃ§a',
  defaultSLA: 3,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['bairro', 'rua', 'telefone'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ValidaÃ§Ã£o',
      order: 2,
      description: 'ValidaÃ§Ã£o dos dados e comprovaÃ§Ã£o de residÃªncia',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['dados_validados'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'InclusÃ£o',
      order: 3,
      description: 'InclusÃ£o no grupo correspondente',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

GRUPOS_APOIO: {
  moduleType: 'GRUPOS_APOIO',
  name: 'Workflow - InscriÃ§Ã£o em Grupos de Apoio',
  description: 'Fluxo para inscriÃ§Ã£o em grupos de apoio',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da inscriÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_grupo', 'necessidade_especifica'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AvaliaÃ§Ã£o',
      order: 2,
      description: 'AvaliaÃ§Ã£o por profissional especializado',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['perfil_participante', 'grupo_recomendado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'InclusÃ£o',
      order: 3,
      description: 'InclusÃ£o no grupo',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: ['data_inicio', 'horarios'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

INSCRICAO_QUALIFICACAO: {
  moduleType: 'INSCRICAO_QUALIFICACAO',
  name: 'Workflow - InscriÃ§Ã£o em Cursos de QualificaÃ§Ã£o',
  description: 'Fluxo para inscriÃ§Ã£o em cursos de qualificaÃ§Ã£o profissional',
  defaultSLA: 7,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da inscriÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['curso_interesse', 'escolaridade', 'disponibilidade'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise Documental',
      order: 2,
      description: 'VerificaÃ§Ã£o de documentos e requisitos',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise de Perfil',
      order: 3,
      description: 'VerificaÃ§Ã£o de adequaÃ§Ã£o ao curso',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['perfil_adequado', 'curso_compativel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'MatrÃ­cula',
      order: 4,
      description: 'EfetivaÃ§Ã£o da matrÃ­cula',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

INSCRICAO_HACKATHON: {
  moduleType: 'INSCRICAO_HACKATHON',
  name: 'Workflow - InscriÃ§Ã£o em Hackathon',
  description: 'Fluxo para inscriÃ§Ã£o em hackathon/desafio de inovaÃ§Ã£o',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da inscriÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['nome_equipe', 'membros', 'area_interesse'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise Documental',
      order: 2,
      description: 'VerificaÃ§Ã£o de documentos',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ValidaÃ§Ã£o',
      order: 3,
      description: 'ValidaÃ§Ã£o da inscriÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['inscricao_validada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    }
  ]
},

OFICINAS_WORKSHOPS: {
  moduleType: 'OFICINAS_WORKSHOPS',
  name: 'Workflow - InscriÃ§Ã£o em Oficinas e Workshops',
  description: 'Fluxo para inscriÃ§Ã£o em oficinas e workshops',
  defaultSLA: 5,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da inscriÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['oficina_interesse', 'faixa_etaria'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'VerificaÃ§Ã£o de Vagas',
      order: 2,
      description: 'VerificaÃ§Ã£o de disponibilidade de vagas',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['vagas_disponiveis', 'turma_alocada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ConfirmaÃ§Ã£o',
      order: 3,
      description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

AGENDAMENTO_SALA_EMPREENDEDOR: {
  moduleType: 'AGENDAMENTO_SALA_EMPREENDEDOR',
  name: 'Workflow - Agendamento Sala do Empreendedor',
  description: 'Fluxo para agendamento na sala do empreendedor',
  defaultSLA: 3,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro do agendamento',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_atendimento', 'data_preferencial', 'descricao_necessidade'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Agendamento',
      order: 2,
      description: 'ConfirmaÃ§Ã£o de data e horÃ¡rio',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_agendada', 'horario', 'profissional_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'ConfirmaÃ§Ã£o',
      order: 3,
      description: 'ConfirmaÃ§Ã£o com o empreendedor',
      slaDays: 1,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== PAGAMENTOS ==========

PAGAMENTO_IPTU: {
  moduleType: 'PAGAMENTO_IPTU',
  name: 'Workflow - Pagamento de IPTU',
  description: 'Fluxo para pagamento de IPTU',
  defaultSLA: 1,
  stages: [
    {
      name: 'GeraÃ§Ã£o de Guia',
      order: 1,
      description: 'GeraÃ§Ã£o da guia de pagamento',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['inscricao_municipal', 'ano_exercicio'],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

PAGAMENTO_ISS: {
  moduleType: 'PAGAMENTO_ISS',
  name: 'Workflow - Pagamento de ISS',
  description: 'Fluxo para pagamento de ISS',
  defaultSLA: 1,
  stages: [
    {
      name: 'GeraÃ§Ã£o de Guia',
      order: 1,
      description: 'GeraÃ§Ã£o da guia de pagamento',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['inscricao_municipal', 'periodo_referencia', 'valor_servicos'],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

PAGAMENTO_TAXA_LIXO: {
  moduleType: 'PAGAMENTO_TAXA_LIXO',
  name: 'Workflow - Pagamento de Taxa de Coleta de Lixo',
  description: 'Fluxo para pagamento de taxa de lixo',
  defaultSLA: 1,
  stages: [
    {
      name: 'GeraÃ§Ã£o de Guia',
      order: 1,
      description: 'GeraÃ§Ã£o da guia de pagamento',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['inscricao_municipal', 'ano_exercicio'],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== DESENVOLVIMENTO ECONÃ”MICO E CONSULTORIAS ==========

ATRACAO_EMPRESAS: {
  moduleType: 'ATRACAO_EMPRESAS',
  name: 'Workflow - AtraÃ§Ã£o de Empresas e Investimentos',
  description: 'Fluxo para atraÃ§Ã£o de empresas',
  defaultSLA: 30,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro do interesse',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_empresa', 'area_atuacao', 'investimento_estimado'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise Preliminar',
      order: 2,
      description: 'AnÃ¡lise do perfil da empresa',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['viabilidade', 'incentivos_aplicaveis'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'ElaboraÃ§Ã£o de Proposta',
      order: 3,
      description: 'ElaboraÃ§Ã£o de proposta de incentivos',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredInputFieldIds: ['proposta_elaborada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'NegociaÃ§Ã£o',
      order: 4,
      description: 'NegociaÃ§Ã£o com a empresa',
      slaDays: 20,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    }
  ]
},

SOLICITACAO_CONSULTORIA: {
  moduleType: 'SOLICITACAO_CONSULTORIA',
  name: 'Workflow - SolicitaÃ§Ã£o de Consultoria Empresarial',
  description: 'Fluxo para solicitaÃ§Ã£o de consultoria',
  defaultSLA: 10,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_consultoria', 'area_necessidade', 'descricao_problema'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise',
      order: 2,
      description: 'AnÃ¡lise da demanda',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['tipo_atendimento', 'consultor_alocado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Agendamento',
      order: 3,
      description: 'Agendamento da consultoria',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_agendada', 'horario'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Atendimento',
      order: 4,
      description: 'RealizaÃ§Ã£o da consultoria',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

ORIENTACAO_ECONOMIA_CRIATIVA: {
  moduleType: 'ORIENTACAO_ECONOMIA_CRIATIVA',
  name: 'Workflow - OrientaÃ§Ã£o para Economia Criativa',
  description: 'Fluxo para orientaÃ§Ã£o em economia criativa',
  defaultSLA: 7,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da solicitaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['area_criativa', 'tipo_orientacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise de Perfil',
      order: 2,
      description: 'AnÃ¡lise do perfil do empreendedor criativo',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['perfil_mapeado', 'orientacoes_necessarias'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Agendamento',
      order: 3,
      description: 'Agendamento do atendimento',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_agendada', 'especialista_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'OrientaÃ§Ã£o',
      order: 4,
      description: 'RealizaÃ§Ã£o da orientaÃ§Ã£o',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
},

// ========== SUGESTÃ•ES E SUPORTE TÃ‰CNICO ==========

SUGESTAO_MELHORIA: {
  moduleType: 'SUGESTAO_MELHORIA',
  name: 'Workflow - SugestÃ£o de Melhoria em Sistemas',
  description: 'Fluxo para sugestÃ£o de melhoria',
  defaultSLA: 15,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro da sugestÃ£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['sistema_afetado', 'descricao_sugestao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'AnÃ¡lise TÃ©cnica',
      order: 2,
      description: 'AnÃ¡lise de viabilidade tÃ©cnica',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['viabilidade_tecnica', 'complexidade', 'prioridade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'AprovaÃ§Ã£o',
      order: 3,
      description: 'AprovaÃ§Ã£o para implementaÃ§Ã£o',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Planejamento',
      order: 4,
      description: 'Planejamento da implementaÃ§Ã£o',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: true
    }
  ]
},

SUPORTE_TECNICO: {
  moduleType: 'SUPORTE_TECNICO',
  name: 'Workflow - Suporte TÃ©cnico em Sistemas',
  description: 'Fluxo para suporte tÃ©cnico',
  defaultSLA: 3,
  stages: [
    {
      name: 'RecepÃ§Ã£o',
      order: 1,
      description: 'Registro do chamado',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['sistema_afetado', 'tipo_problema', 'urgencia'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Triagem',
      order: 2,
      description: 'ClassificaÃ§Ã£o e priorizaÃ§Ã£o',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['prioridade', 'tecnico_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Atendimento',
      order: 3,
      description: 'Atendimento e resoluÃ§Ã£o',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['solucao_aplicada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    }
  ]
},

  // ========== EDUCAÃ‡ÃƒO ==========
  RECLAMACAO_TRANSPORTE_ESCOLAR: {
    moduleType: 'RECLAMACAO_TRANSPORTE_ESCOLAR',
    name: 'Workflow - ReclamaÃ§Ã£o sobre Transporte Escolar',
    description: 'Fluxo para registro e resoluÃ§Ã£o de reclamaÃ§Ãµes sobre transporte escolar',
    defaultSLA: 3,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da reclamaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nomeAluno', 'unidadeEscolar', 'tipoProblema', 'descricaoProblema'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise',
        order: 2,
        description: 'AnÃ¡lise da reclamaÃ§Ã£o e verificaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ProvidÃªncias',
        order: 3,
        description: 'Tomada de providÃªncias',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['providencias_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== MOBILIDADE URBANA ==========
  RECLAMACAO_TRANSPORTE_PUBLICO: {
    moduleType: 'RECLAMACAO_TRANSPORTE_PUBLICO',
    name: 'Workflow - ReclamaÃ§Ã£o sobre Transporte PÃºblico',
    description: 'Fluxo para registro e resoluÃ§Ã£o de reclamaÃ§Ãµes sobre transporte pÃºblico',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da reclamaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipoReclamacao', 'linha', 'descricao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise',
        order: 2,
        description: 'AnÃ¡lise da reclamaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Encaminhamento',
        order: 3,
        description: 'Encaminhamento para empresa responsÃ¡vel',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['empresa_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Retorno',
        order: 4,
        description: 'Retorno e providÃªncias tomadas',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['providencias_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== PLANEJAMENTO URBANO ==========
  // ========== EDUCAÃ‡ÃƒO (continuaÃ§Ã£o) ==========
  INSCRICAO_EJA: {
    moduleType: 'INSCRICAO_EJA',
    name: 'Workflow - InscriÃ§Ã£o em EJA',
    description: 'Fluxo para inscriÃ§Ã£o em EducaÃ§Ã£o de Jovens e Adultos',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['idadeAluno', 'ultimaSerieCompleta', 'escolaPreferencial'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise PedagÃ³gica',
        order: 3,
        description: 'AvaliaÃ§Ã£o pedagÃ³gica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nivel_sugerido', 'escola_destino'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'MatrÃ­cula',
        order: 4,
        description: 'EfetivaÃ§Ã£o da matrÃ­cula',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['numero_matricula'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'MatrÃ­cula concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CALENDARIO_ESCOLAR: {
    moduleType: 'CALENDARIO_ESCOLAR',
    name: 'Workflow - Consulta de CalendÃ¡rio Escolar',
    description: 'Fluxo simplificado para consulta de calendÃ¡rio escolar',
    defaultSLA: 1,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['anoLetivo', 'tipoConsulta'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Resposta',
        order: 2,
        description: 'Envio de calendÃ¡rio',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  ALVARA_FUNCIONAMENTO_PLANEJAMENTO: {
    moduleType: 'ALVARA_FUNCIONAMENTO_PLANEJAMENTO',
    name: 'Workflow - AlvarÃ¡ de Funcionamento (Planejamento Urbano)',
    description: 'Fluxo para emissÃ£o de alvarÃ¡ de funcionamento sob aspecto urbanÃ­stico',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e protocolo',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos obrigatÃ³rios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'Laudo TÃ©cnico', 'Comprovante de EndereÃ§o'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise UrbanÃ­stica',
        order: 3,
        description: 'AnÃ¡lise de conformidade com legislaÃ§Ã£o urbanÃ­stica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_urbanistico', 'zoneamento_verificado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resultado_vistoria', 'data_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o Final',
        order: 5,
        description: 'AprovaÃ§Ã£o e emissÃ£o do alvarÃ¡',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Protocolo concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL ==========
  ATENDIMENTO_CRAS: {
    moduleType: 'ATENDIMENTO_CRAS',
    name: 'Workflow - Atendimento no CRAS',
    description: 'Fluxo para atendimento no Centro de ReferÃªncia de AssistÃªncia Social',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do atendimento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_atendimento', 'demanda_principal'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Social',
        order: 2,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'situacao_familiar'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Encaminhamento',
        order: 3,
        description: 'Encaminhamento para serviÃ§os',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['servicos_encaminhados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Acompanhamento',
        order: 4,
        description: 'Acompanhamento do caso',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  AUXILIO_EMERGENCIAL: {
    moduleType: 'AUXILIO_EMERGENCIAL',
    name: 'Workflow - AuxÃ­lio Emergencial',
    description: 'Fluxo para concessÃ£o de auxÃ­lio emergencial',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_emergencia', 'descricao_situacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de EndereÃ§o'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Social',
        order: 3,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'valor_sugerido'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do benefÃ­cio',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['valor_aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CADASTRO_UNICO: {
    moduleType: 'CADASTRO_UNICO',
    name: 'Workflow - Cadastro Ãšnico',
    description: 'Fluxo para cadastramento no CadÃšnico',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documentos Pessoais'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Entrevista',
        order: 3,
        description: 'Entrevista socioeconÃ´mica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Processamento',
        order: 4,
        description: 'InclusÃ£o no sistema',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nis_gerado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_PROGRAMA_SOCIAL: {
    moduleType: 'INSCRICAO_PROGRAMA_SOCIAL',
    name: 'Workflow - InscriÃ§Ã£o em Programa Social',
    description: 'Fluxo para inscriÃ§Ã£o em programas sociais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['programa_escolhido'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CadÃšnico', 'Documentos Pessoais'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de requisitos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos', 'parecer'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'InclusÃ£o',
        order: 4,
        description: 'InclusÃ£o no programa',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'InscriÃ§Ã£o concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  SOLICITACAO_BENEFICIO: {
    moduleType: 'SOLICITACAO_BENEFICIO',
    name: 'Workflow - SolicitaÃ§Ã£o de BenefÃ­cio',
    description: 'Fluxo para solicitaÃ§Ã£o de benefÃ­cios assistenciais',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_beneficio'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar',
        order: 3,
        description: 'Visita tÃ©cnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'relatorio_visita'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Parecer Social',
        order: 4,
        description: 'ElaboraÃ§Ã£o de parecer',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'recomendacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do benefÃ­cio',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'BenefÃ­cio concedido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  VISITA_DOMICILIAR: {
    moduleType: 'VISITA_DOMICILIAR',
    name: 'Workflow - Visita Domiciliar',
    description: 'Fluxo para agendamento e realizaÃ§Ã£o de visita domiciliar',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['motivo_visita'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 2,
        description: 'Agendamento da visita',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'hora_visita', 'tecnico_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'RealizaÃ§Ã£o',
        order: 3,
        description: 'RealizaÃ§Ã£o da visita',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_visita', 'conclusoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'FinalizaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_GRUPO_OFICINA: {
    moduleType: 'INSCRICAO_GRUPO_OFICINA',
    name: 'Workflow - InscriÃ§Ã£o em Grupo ou Oficina',
    description: 'Fluxo para inscriÃ§Ã£o em grupos e oficinas sociais',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_oficina', 'turno_preferencial'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 2,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 3,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'InscriÃ§Ã£o efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== CULTURA ==========
  CADASTRO_ARTISTA: {
    moduleType: 'CADASTRO_ARTISTA',
    name: 'Workflow - Cadastro de Artista',
    description: 'Fluxo para cadastramento de artistas locais',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_artistico', 'area_atuacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 3,
        description: 'AprovaÃ§Ã£o do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CADASTRO_EVENTO_CULTURAL: {
    moduleType: 'CADASTRO_EVENTO_CULTURAL',
    name: 'Workflow - Cadastro de Evento Cultural',
    description: 'Fluxo para cadastramento e aprovaÃ§Ã£o de eventos culturais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do evento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_evento', 'data_evento', 'local_evento'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Projeto',
        order: 2,
        description: 'AnÃ¡lise do projeto cultural',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 3,
        description: 'AprovaÃ§Ã£o do evento',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Evento aprovado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_OFICINA: {
    moduleType: 'INSCRICAO_OFICINA',
    name: 'Workflow - InscriÃ§Ã£o em Oficina Cultural',
    description: 'Fluxo para inscriÃ§Ã£o em oficinas culturais',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['oficina_escolhida', 'turma_preferencial'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 2,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 3,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'InscriÃ§Ã£o efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  RESERVA_ESPACO_CULTURAL: {
    moduleType: 'RESERVA_ESPACO_CULTURAL',
    name: 'Workflow - Reserva de EspaÃ§o Cultural',
    description: 'Fluxo para reserva de espaÃ§os culturais',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['espaco_solicitado', 'data_reserva', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Disponibilidade',
        order: 2,
        description: 'VerificaÃ§Ã£o de agenda',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['disponibilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Projeto',
        order: 3,
        description: 'AnÃ¡lise da proposta',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da reserva',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'Reserva confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  PROJETO_CULTURAL: {
    moduleType: 'PROJETO_CULTURAL',
    name: 'Workflow - Projeto Cultural',
    description: 'Fluxo para aprovaÃ§Ã£o de projetos culturais e captaÃ§Ã£o de recursos',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do projeto',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['titulo_projeto', 'area_cultural'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Detalhado', 'OrÃ§amento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AvaliaÃ§Ã£o tÃ©cnica do projeto',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'pontuacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Parecer Cultural',
        order: 4,
        description: 'Parecer da secretaria de cultura',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_cultural', 'recomendacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Projeto aprovado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  APOIO_CULTURAL: {
    moduleType: 'APOIO_CULTURAL',
    name: 'Workflow - Apoio Cultural',
    description: 'Fluxo para solicitaÃ§Ã£o de apoio a eventos culturais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_apoio', 'nome_evento'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Viabilidade',
        order: 2,
        description: 'AnÃ¡lise de viabilidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_viabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 3,
        description: 'AprovaÃ§Ã£o do apoio',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['tipo_apoio_aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Apoio concedido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CADASTRO_GRUPO_ARTISTICO: {
    moduleType: 'CADASTRO_GRUPO_ARTISTICO',
    name: 'Workflow - Cadastro de Grupo ArtÃ­stico',
    description: 'Fluxo para cadastramento de grupos artÃ­sticos',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_grupo', 'tipo_arte', 'numero_integrantes'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['PortfÃ³lio do Grupo'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 3,
        description: 'AprovaÃ§Ã£o do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  REGISTRO_MANIFESTACAO_CULTURAL: {
    moduleType: 'REGISTRO_MANIFESTACAO_CULTURAL',
    name: 'Workflow - Registro de ManifestaÃ§Ã£o Cultural',
    description: 'Fluxo para registro de manifestaÃ§Ãµes culturais tradicionais',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da manifestaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_manifestacao', 'tipo_manifestacao', 'historico'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Pesquisa',
        order: 2,
        description: 'Pesquisa histÃ³rica e cultural',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_pesquisa'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o',
        order: 3,
        description: 'ValidaÃ§Ã£o tÃ©cnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Registro',
        order: 4,
        description: 'Registro oficial',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'ManifestaÃ§Ã£o registrada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  ATENDIMENTOS_CULTURA: {
    moduleType: 'ATENDIMENTOS_CULTURA',
    name: 'Workflow - Atendimento Cultura',
    description: 'Fluxo para atendimentos gerais da secretaria de cultura',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do atendimento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_atendimento', 'assunto'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Atendimento',
        order: 2,
        description: 'PrestaÃ§Ã£o do atendimento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resposta'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 3,
        description: 'Atendimento concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ESPORTES ==========
  CADASTRO_ATLETA: {
    moduleType: 'CADASTRO_ATLETA',
    name: 'Workflow - Cadastro de Atleta',
    description: 'Fluxo para cadastramento de atletas',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['modalidade', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Atestado MÃ©dico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 3,
        description: 'AprovaÃ§Ã£o do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_COMPETICAO: {
    moduleType: 'INSCRICAO_COMPETICAO',
    name: 'Workflow - InscriÃ§Ã£o em CompetiÃ§Ã£o',
    description: 'Fluxo para inscriÃ§Ã£o em competiÃ§Ãµes esportivas',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['competicao', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o de elegibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['elegivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 3,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'InscriÃ§Ã£o efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_ESCOLINHA: {
    moduleType: 'INSCRICAO_ESCOLINHA',
    name: 'Workflow - InscriÃ§Ã£o em Escolinha Esportiva',
    description: 'Fluxo para inscriÃ§Ã£o em escolinhas esportivas',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['modalidade', 'turno'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'MatrÃ­cula efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  RESERVA_ESPACO_ESPORTIVO: {
    moduleType: 'RESERVA_ESPACO_ESPORTIVO',
    name: 'Workflow - Reserva de EspaÃ§o Esportivo',
    description: 'Fluxo para reserva de espaÃ§os esportivos',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['espaco_solicitado', 'data_reserva', 'horario'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Disponibilidade',
        order: 2,
        description: 'VerificaÃ§Ã£o de agenda',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['disponibilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 3,
        description: 'ConfirmaÃ§Ã£o da reserva',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Reserva confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== HABITAÃ‡ÃƒO ==========
  REGULARIZACAO_FUNDIARIA: {
    moduleType: 'REGULARIZACAO_FUNDIARIA',
    name: 'Workflow - RegularizaÃ§Ã£o FundiÃ¡ria',
    description: 'Fluxo para regularizaÃ§Ã£o de imÃ³vel',
    defaultSLA: 60,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e protocolo da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentaÃ§Ã£o obrigatÃ³ria',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura (se possuir)', 'IPTU', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria no imÃ³vel para levantamento',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'area_medida', 'confrontantes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise JurÃ­dica',
        order: 4,
        description: 'AnÃ¡lise jurÃ­dica da situaÃ§Ã£o do imÃ³vel',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_juridico', 'viabilidade_regularizacao', 'tipo_regularizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o de DocumentaÃ§Ã£o',
        order: 5,
        description: 'ElaboraÃ§Ã£o de plantas e memorial descritivo',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['planta_elaborada', 'memorial_descritivo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o Final',
        order: 6,
        description: 'AprovaÃ§Ã£o e encaminhamento para registro',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['aprovado_por', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Documentos',
        order: 7,
        description: 'EmissÃ£o de documentos de regularizaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'Processo concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_PROGRAMA_HABITACIONAL: {
    moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL',
    name: 'Workflow - InscriÃ§Ã£o em Programa Habitacional',
    description: 'Fluxo para inscriÃ§Ã£o em programas habitacionais (MCMV, Casa Verde e Amarela)',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['programaInteresse', 'rendaFamiliarTotal', 'numeroMoradores', 'situacaoAtual'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos obrigatÃ³rios',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'CadÃšnico', 'Comprovante de EndereÃ§o'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o socioeconÃ´mica da famÃ­lia',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'pontuacao_social', 'grupo_prioritario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar',
        order: 4,
        description: 'Visita tÃ©cnica ao domicÃ­lio',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'condicoes_moradia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 5,
        description: 'VerificaÃ§Ã£o de critÃ©rios de elegibilidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'justificativa_elegibilidade', 'faixa_renda'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o e ClassificaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o e classificaÃ§Ã£o na lista de espera',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['posicao_lista', 'pontuacao_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 7,
        description: 'EmissÃ£o de comprovante de inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'InscriÃ§Ã£o concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  SOLICITACAO_AUXILIO_ALUGUEL: {
    moduleType: 'SOLICITACAO_AUXILIO_ALUGUEL',
    name: 'Workflow - SolicitaÃ§Ã£o de AuxÃ­lio Aluguel',
    description: 'Fluxo para concessÃ£o de auxÃ­lio moradia temporÃ¡rio',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['motivoSolicitacao', 'descricaoSituacao', 'valorAluguel'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'DeclaraÃ§Ã£o de Vulnerabilidade'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita TÃ©cnica',
        order: 3,
        description: 'Visita tÃ©cnica para avaliaÃ§Ã£o da situaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'situacao_confirmada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Social',
        order: 4,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'renda_per_capita', 'grau_vulnerabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o TÃ©cnica',
        order: 5,
        description: 'AprovaÃ§Ã£o tÃ©cnica do benefÃ­cio',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['valor_aprovado', 'prazo_beneficio', 'condicoes_beneficio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o GestÃ£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final pela gestÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Portaria',
        order: 7,
        description: 'EmissÃ£o de portaria de concessÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'BenefÃ­cio concedido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  AUTORIZACAO_CONSTRUCAO: {
    moduleType: 'AUTORIZACAO_CONSTRUCAO',
    name: 'Workflow - AutorizaÃ§Ã£o para ConstruÃ§Ã£o',
    description: 'Fluxo para autorizaÃ§Ã£o de construÃ§Ã£o em lote regularizado',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e protocolo',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['numeroLote', 'areaConstruir', 'tipoConstrucao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos obrigatÃ³rios',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto ArquitetÃ´nico', 'ART (AnotaÃ§Ã£o de Responsabilidade TÃ©cnica)', 'MatrÃ­cula do ImÃ³vel'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica de Projeto',
        order: 3,
        description: 'AnÃ¡lise tÃ©cnica do projeto arquitetÃ´nico',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'conformidade_codigo_obras', 'conformidade_zoneamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise UrbanÃ­stica',
        order: 4,
        description: 'VerificaÃ§Ã£o de conformidade urbanÃ­stica',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['taxa_ocupacao', 'coeficiente_aproveitamento', 'recuos_verificados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria de Lote',
        order: 5,
        description: 'Vistoria do lote',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'resultado_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o do alvarÃ¡ de construÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AutorizaÃ§Ã£o concedida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  VISTORIA_HABITACIONAL: {
    moduleType: 'VISTORIA_HABITACIONAL',
    name: 'Workflow - Vistoria Habitacional',
    description: 'Fluxo para solicitaÃ§Ã£o de vistoria tÃ©cnica habitacional',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['motivoVistoria', 'descricaoSolicitacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de EndereÃ§o'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'Agendamento da vistoria',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_agendada', 'hora_agendada', 'tecnico_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'RealizaÃ§Ã£o da Vistoria',
        order: 4,
        description: 'Vistoria in loco',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_realizada', 'condicoes_estruturais', 'condicoes_instalacoes', 'habitabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o de Laudo',
        order: 5,
        description: 'ElaboraÃ§Ã£o do laudo tÃ©cnico',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['laudo_tecnico', 'conclusao', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Laudo',
        order: 6,
        description: 'EmissÃ£o do laudo tÃ©cnico',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Laudo emitido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_MCMV_MUNICIPAL: {
    moduleType: 'INSCRICAO_MCMV_MUNICIPAL',
    name: 'Workflow - InscriÃ§Ã£o MCMV Municipal',
    description: 'Fluxo para inscriÃ§Ã£o no programa municipal Minha Casa Minha Vida',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['rendaFamiliarTotal', 'numeroMoradores', 'faixaRenda', 'inscritoCadUnico'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos obrigatÃ³rios',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'CadÃšnico', 'Comprovante de EndereÃ§o', 'CertidÃ£o de Casamento (se aplicÃ¡vel)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Cadastros',
        order: 3,
        description: 'VerificaÃ§Ã£o em bases de dados',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['possui_imovel_cadastro', 'situacao_cadunico', 'pendencias_encontradas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 4,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'pontuacao', 'grupo_prioritario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar',
        order: 5,
        description: 'Visita tÃ©cnica',
        slaDays: 8,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'condicoes_moradia_atual'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ClassificaÃ§Ã£o Final',
        order: 6,
        description: 'ClassificaÃ§Ã£o e pontuaÃ§Ã£o final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['pontuacao_final', 'posicao_lista', 'faixa_enquadramento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 7,
        description: 'EmissÃ£o de comprovante de inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'InscriÃ§Ã£o concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  REGULARIZACAO_POSSE: {
    moduleType: 'REGULARIZACAO_POSSE',
    name: 'Workflow - RegularizaÃ§Ã£o de Posse',
    description: 'Fluxo para regularizaÃ§Ã£o de posse de terreno ou imÃ³vel',
    defaultSLA: 90,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento da solicitaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['enderecoImovel', 'areaTerreno', 'tempoPosse'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de OcupaÃ§Ã£o', 'DeclaraÃ§Ã£o de Posse', 'Croqui do Terreno'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria no terreno',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'area_medida', 'confrontantes', 'situacao_posse'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise JurÃ­dica',
        order: 4,
        description: 'AnÃ¡lise jurÃ­dica da posse',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_juridico', 'natureza_posse', 'viabilidade_regularizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Pesquisa de Titularidade',
        order: 5,
        description: 'Pesquisa em cartÃ³rio e cadastros',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resultado_pesquisa_cartorio', 'proprietario_registrado', 'onus_reais'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o de Planta e Memorial',
        order: 6,
        description: 'ElaboraÃ§Ã£o de documentos tÃ©cnicos',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['planta_elaborada', 'memorial_descritivo', 'art_profissional'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o Final',
        order: 7,
        description: 'AprovaÃ§Ã£o e encaminhamento',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['aprovado_por', 'data_aprovacao', 'tipo_regularizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Documentos',
        order: 8,
        description: 'EmissÃ£o de certidÃ£o ou tÃ­tulo',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 9,
        description: 'Processo concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  USUCAPIAO_URBANO: {
    moduleType: 'USUCAPIAO_URBANO',
    name: 'Workflow - UsucapiÃ£o Urbano',
    description: 'Fluxo para solicitaÃ§Ã£o de usucapiÃ£o de imÃ³vel urbano',
    defaultSLA: 180,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento da solicitaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['enderecoImovel', 'areaTotal', 'tempoPosse', 'tipoUsucapiao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental Inicial',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos obrigatÃ³rios',
        slaDays: 15,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'DeclaraÃ§Ã£o de Posse Mansa e PacÃ­fica', 'Comprovantes de ResidÃªncia', 'DeclaraÃ§Ã£o de Testemunhas'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria e levantamento topogrÃ¡fico',
        slaDays: 30,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_tecnico', 'area_medida', 'limites_confrontantes', 'benfeitorias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise JurÃ­dica Preliminar',
        order: 4,
        description: 'AnÃ¡lise jurÃ­dica inicial',
        slaDays: 30,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_juridico_preliminar', 'tipo_posse', 'requisitos_atendidos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Pesquisa Registral',
        order: 5,
        description: 'Pesquisa em cartÃ³rios e registros',
        slaDays: 30,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resultado_pesquisa_imoveis', 'matriculas_encontradas', 'proprietarios_registrados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Oitiva de Testemunhas',
        order: 6,
        description: 'Oitiva de testemunhas',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_oitiva', 'testemunhas_ouvidas', 'relatorio_oitiva'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Parecer TÃ©cnico Final',
        order: 7,
        description: 'ElaboraÃ§Ã£o de parecer tÃ©cnico final',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'planta_situacao', 'memorial_descritivo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise JurÃ­dica Final',
        order: 8,
        description: 'AnÃ¡lise jurÃ­dica conclusiva',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_juridico_final', 'conclusao_usucapiao', 'recomendacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o GestÃ£o',
        order: 9,
        description: 'AprovaÃ§Ã£o pela gestÃ£o',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Encaminhamento Judicial',
        order: 10,
        description: 'PreparaÃ§Ã£o e encaminhamento ao JudiciÃ¡rio',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['processo_judicial', 'data_encaminhamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 11,
        description: 'Processo encaminhado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== AGRICULTURA ==========
  SOLICITACAO_MAQUINAS: {
    moduleType: 'SOLICITACAO_MAQUINAS',
    name: 'Workflow - SolicitaÃ§Ã£o de MÃ¡quinas AgrÃ­colas',
    description: 'Fluxo para solicitaÃ§Ã£o de uso de mÃ¡quinas e equipamentos agrÃ­colas',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipoMaquina', 'dataDesejada', 'areaTrabalho'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Disponibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de mÃ¡quinas disponÃ­veis',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['maquina_disponivel', 'data_disponibilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 4,
        description: 'Agendamento do serviÃ§o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_agendada', 'operador_responsavel', 'horario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ExecuÃ§Ã£o',
        order: 5,
        description: 'ExecuÃ§Ã£o do serviÃ§o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_execucao', 'horas_trabalhadas', 'area_efetiva'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'ServiÃ§o concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  FEIRA_PRODUTOR: {
    moduleType: 'FEIRA_PRODUTOR',
    name: 'Workflow - InscriÃ§Ã£o na Feira do Produtor',
    description: 'Fluxo para inscriÃ§Ã£o em feira municipal de produtores',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_produtos', 'quantidade_estimada'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AvaliaÃ§Ã£o dos produtos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['produtos_aprovados', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AlocaÃ§Ã£o de EspaÃ§o',
        order: 4,
        description: 'DefiniÃ§Ã£o de espaÃ§o na feira',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_barraca', 'localizacao', 'tamanho_espaco'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Credencial',
        order: 5,
        description: 'EmissÃ£o de credencial',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'InscriÃ§Ã£o concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== MEIO AMBIENTE ==========
  LICENCIAMENTO_AMBIENTAL: {
    moduleType: 'LICENCIAMENTO_AMBIENTAL',
    name: 'Workflow - Licenciamento Ambiental',
    description: 'Fluxo para solicitaÃ§Ã£o de licenÃ§a ambiental',
    defaultSLA: 60,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e protocolo',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipoAtividade', 'areaImpacto', 'medidasMitigacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos obrigatÃ³rios',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto', 'Estudo de Impacto Ambiental', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica Preliminar',
        order: 3,
        description: 'AnÃ¡lise tÃ©cnica inicial do projeto',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_preliminar', 'classificacao_impacto', 'necessita_eia_rima'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'relatorio_vistoria', 'impactos_identificados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Parecer TÃ©cnico',
        order: 5,
        description: 'ElaboraÃ§Ã£o de parecer tÃ©cnico',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico_final', 'viabilidade_ambiental', 'condicoes_licenca'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o GestÃ£o',
        order: 6,
        description: 'AprovaÃ§Ã£o pela gestÃ£o ambiental',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'tipo_licenca', 'validade_licenca'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de LicenÃ§a',
        order: 7,
        description: 'EmissÃ£o da licenÃ§a ambiental',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'LicenÃ§a emitida',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  AUTORIZACAO_PODA_ARVORES: {
    moduleType: 'AUTORIZACAO_PODA_ARVORES',
    name: 'Workflow - AutorizaÃ§Ã£o para Poda ou SupressÃ£o de Ãrvores',
    description: 'Fluxo para autorizaÃ§Ã£o de poda ou corte de Ã¡rvores',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipoSolicitacao', 'localArvore', 'quantidadeArvores'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Propriedade', 'Fotos do Local'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'especie_identificada', 'estado_arvore', 'risco_iminente'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Parecer TÃ©cnico',
        order: 4,
        description: 'ElaboraÃ§Ã£o de parecer',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'tipo_intervencao_recomendada', 'compensacao_ambiental'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_autorizacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o do documento de autorizaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AutorizaÃ§Ã£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== SAÃšDE (complementares) ==========
  AGENDAMENTO_CONSULTA: {
    moduleType: 'AGENDAMENTO_CONSULTA',
    name: 'Workflow - Agendamento de Consulta',
    description: 'Fluxo para agendamento de consultas mÃ©dicas',
    defaultSLA: 3,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['especialidade', 'preferencia_data'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 2,
        description: 'Agendamento da consulta',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_consulta', 'hora_consulta', 'unidade_saude', 'medico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 3,
        description: 'ConfirmaÃ§Ã£o do agendamento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Consulta agendada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  SOLICITACAO_EXAMES: {
    moduleType: 'SOLICITACAO_EXAMES',
    name: 'Workflow - SolicitaÃ§Ã£o de Exames',
    description: 'Fluxo para solicitaÃ§Ã£o de exames mÃ©dicos',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_exame'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Pedido MÃ©dico',
        order: 2,
        description: 'VerificaÃ§Ã£o do pedido mÃ©dico',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Pedido MÃ©dico', 'CartÃ£o SUS'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'Agendamento do exame',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_exame', 'hora_exame', 'local_exame'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o do agendamento',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'Exame agendado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CARTAO_SUS: {
    moduleType: 'CARTAO_SUS',
    name: 'Workflow - EmissÃ£o de CartÃ£o SUS',
    description: 'Fluxo para solicitaÃ§Ã£o de cartÃ£o SUS',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CNH', 'CPF', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro no Sistema',
        order: 3,
        description: 'Cadastro no sistema nacional',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cns', 'data_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o do CartÃ£o',
        order: 4,
        description: 'EmissÃ£o fÃ­sica do cartÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'CartÃ£o emitido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== EDUCAÃ‡ÃƒO (complementares) ==========
  MATRICULA_ESCOLAR: {
    moduleType: 'MATRICULA_ESCOLAR',
    name: 'Workflow - MatrÃ­cula Escolar',
    description: 'Fluxo para matrÃ­cula em escola municipal',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o de matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'serie_pretendida', 'escola_preferencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CertidÃ£o de Nascimento', 'RG do ResponsÃ¡vel', 'Comprovante de ResidÃªncia', 'CartÃ£o de Vacina'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['escola_disponivel', 'turma_disponivel', 'turno'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EfetivaÃ§Ã£o da MatrÃ­cula',
        order: 4,
        description: 'EfetivaÃ§Ã£o no sistema',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_matricula', 'data_inicio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 5,
        description: 'EmissÃ£o de comprovante de matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'MatrÃ­cula efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  TRANSFERENCIA_ESCOLAR: {
    moduleType: 'TRANSFERENCIA_ESCOLAR',
    name: 'Workflow - TransferÃªncia Escolar',
    description: 'Fluxo para transferÃªncia entre escolas municipais',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['escola_origem', 'escola_destino', 'motivo_transferencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 2,
        description: 'VerificaÃ§Ã£o na escola destino',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma_destino'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise PedagÃ³gica',
        order: 3,
        description: 'AnÃ¡lise pela coordenaÃ§Ã£o pedagÃ³gica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_pedagogico', 'serie_adequada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EfetivaÃ§Ã£o',
        order: 4,
        description: 'EfetivaÃ§Ã£o da transferÃªncia',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['data_transferencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'TransferÃªncia efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  TRANSPORTE_ESCOLAR: {
    moduleType: 'TRANSPORTE_ESCOLAR',
    name: 'Workflow - Transporte Escolar',
    description: 'Fluxo para solicitaÃ§Ã£o de transporte escolar',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'escola', 'endereco_embarque'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de MatrÃ­cula', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de distÃ¢ncia e critÃ©rios',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['distancia_calculada', 'atende_criterios', 'rota_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AlocaÃ§Ã£o de Rota',
        order: 4,
        description: 'DefiniÃ§Ã£o de rota e veÃ­culo',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['rota_alocada', 'veiculo', 'ponto_embarque', 'horarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Passe',
        order: 5,
        description: 'EmissÃ£o de cartÃ£o de transporte',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Transporte concedido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== PLANEJAMENTO URBANO ==========
  PARCELAMENTO_SOLO: {
    moduleType: 'PARCELAMENTO_SOLO',
    name: 'Workflow - AutorizaÃ§Ã£o de Parcelamento do Solo',
    description: 'Fluxo para autorizaÃ§Ã£o de loteamento, desmembramento ou remembramento',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Recebimento e protocolo',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipoParcelamento', 'matriculaImovel', 'areaTotal', 'numeroLotes'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos obrigatÃ³rios',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'CNPJ (se empresa)', 'MatrÃ­cula do ImÃ³vel', 'Projeto de Parcelamento', 'ART do ResponsÃ¡vel TÃ©cnico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise UrbanÃ­stica',
        order: 3,
        description: 'AnÃ¡lise de conformidade urbanÃ­stica',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['conformidade_plano_diretor', 'conformidade_zoneamento', 'conformidade_lei_parcelamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Infraestrutura',
        order: 4,
        description: 'AnÃ¡lise de infraestrutura necessÃ¡ria',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['infraestrutura_agua', 'infraestrutura_esgoto', 'infraestrutura_drenagem', 'infraestrutura_energia', 'pavimentacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Parecer TÃ©cnico',
        order: 5,
        description: 'ElaboraÃ§Ã£o de parecer tÃ©cnico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'viabilidade', 'condicoes_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 7,
        description: 'EmissÃ£o do alvarÃ¡ de parcelamento',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'AutorizaÃ§Ã£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== AGRICULTURA (continuaÃ§Ã£o) ==========
  CADASTRO_PROPRIEDADE_RURAL: {
    moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
    name: 'Workflow - Cadastro de Propriedade Rural',
    description: 'Fluxo para cadastramento de propriedade rural',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['area_propriedade', 'tipo_exploracao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura ou Contrato', 'CAR - Cadastro Ambiental Rural (opcional)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria na propriedade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'area_verificada', 'atividades_desenvolvidas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Cadastramento',
        order: 4,
        description: 'InclusÃ£o no cadastro municipal',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cadastro', 'data_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 5,
        description: 'EmissÃ£o de certificado de cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_PROGRAMA_RURAL: {
    moduleType: 'INSCRICAO_PROGRAMA_RURAL',
    name: 'Workflow - InscriÃ§Ã£o em Programa Rural',
    description: 'Fluxo para inscriÃ§Ã£o em programas de desenvolvimento rural',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['programa_escolhido'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita TÃ©cnica',
        order: 4,
        description: 'Visita Ã  propriedade',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'InscriÃ§Ã£o efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  LICENCA_EVENTOS_RURAIS: {
    moduleType: 'LICENCA_EVENTOS_RURAIS',
    name: 'Workflow - LicenÃ§a para Eventos Rurais',
    description: 'Fluxo para autorizaÃ§Ã£o de eventos em Ã¡reas rurais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_evento', 'data_evento', 'local_evento', 'publico_esperado'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Projeto do Evento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do Local',
        order: 3,
        description: 'Vistoria tÃ©cnica no local',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_local', 'adequacao_evento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Parecer TÃ©cnico',
        order: 4,
        description: 'ElaboraÃ§Ã£o de parecer',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de LicenÃ§a',
        order: 5,
        description: 'EmissÃ£o da autorizaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'LicenÃ§a emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  ANALISE_SOLO: {
    moduleType: 'ANALISE_SOLO',
    name: 'Workflow - AnÃ¡lise de Solo',
    description: 'Fluxo para solicitaÃ§Ã£o de anÃ¡lise de solo',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['area_analise', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Agendamento de Coleta',
        order: 2,
        description: 'Agendamento da coleta de amostras',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_coleta', 'responsavel_coleta'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Coleta de Amostras',
        order: 3,
        description: 'Coleta das amostras de solo',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_coleta_realizada', 'numero_amostras', 'profundidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Laboratorial',
        order: 4,
        description: 'AnÃ¡lise em laboratÃ³rio',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_analise', 'laboratorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o de Laudo',
        order: 5,
        description: 'ElaboraÃ§Ã£o do laudo tÃ©cnico',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['resultado_analise', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Laudo',
        order: 6,
        description: 'EmissÃ£o do laudo',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Laudo entregue',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  ATENDIMENTOS_AGRICULTURA: {
    moduleType: 'ATENDIMENTOS_AGRICULTURA',
    name: 'Workflow - Atendimento Agricultura',
    description: 'Fluxo para atendimentos gerais da agricultura',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do atendimento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_atendimento', 'assunto'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 2,
        description: 'AnÃ¡lise da demanda',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'orientacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Atendimento',
        order: 3,
        description: 'PrestaÃ§Ã£o do atendimento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resposta'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Atendimento concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  ASSISTENCIA_TECNICA: {
    moduleType: 'ASSISTENCIA_TECNICA',
    name: 'Workflow - AssistÃªncia TÃ©cnica Rural',
    description: 'Fluxo para assistÃªncia tÃ©cnica a produtores rurais',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_assistencia', 'area_necessidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Triagem',
        order: 2,
        description: 'ClassificaÃ§Ã£o da demanda',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_demanda', 'tecnico_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Agendamento de Visita',
        order: 3,
        description: 'Agendamento da visita tÃ©cnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'hora_visita'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Visita TÃ©cnica',
        order: 4,
        description: 'RealizaÃ§Ã£o da visita',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_realizada', 'relatorio_visita', 'diagnostico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o de Plano',
        order: 5,
        description: 'ElaboraÃ§Ã£o de plano de aÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['plano_acao', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'AssistÃªncia prestada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ESPORTES (continuaÃ§Ã£o) ==========
  INSCRICAO_ESCOLINHA_FUTEBOL: {
    moduleType: 'INSCRICAO_ESCOLINHA_FUTEBOL',
    name: 'Workflow - InscriÃ§Ã£o em Escolinha de Futebol',
    description: 'Fluxo para inscriÃ§Ã£o em escolinha de futebol',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'MatrÃ­cula efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_ESCOLINHA_VOLEI: {
    moduleType: 'INSCRICAO_ESCOLINHA_VOLEI',
    name: 'Workflow - InscriÃ§Ã£o em Escolinha de VÃ´lei',
    description: 'Fluxo para inscriÃ§Ã£o em escolinha de vÃ´lei',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado MÃ©dico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'MatrÃ­cula efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_ESCOLINHA_BASQUETE: {
    moduleType: 'INSCRICAO_ESCOLINHA_BASQUETE',
    name: 'Workflow - InscriÃ§Ã£o em Escolinha de Basquete',
    description: 'Fluxo para inscriÃ§Ã£o em escolinha de basquete',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado MÃ©dico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'MatrÃ­cula efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_ESCOLINHA_NATACAO: {
    moduleType: 'INSCRICAO_ESCOLINHA_NATACAO',
    name: 'Workflow - InscriÃ§Ã£o em Escolinha de NataÃ§Ã£o',
    description: 'Fluxo para inscriÃ§Ã£o em escolinha de nataÃ§Ã£o',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'nivel_natacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado MÃ©dico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma', 'horario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'MatrÃ­cula efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_ESCOLINHA_JUDO: {
    moduleType: 'INSCRICAO_ESCOLINHA_JUDO',
    name: 'Workflow - InscriÃ§Ã£o em Escolinha de JudÃ´',
    description: 'Fluxo para inscriÃ§Ã£o em escolinha de judÃ´',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'faixa_atual'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado MÃ©dico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'MatrÃ­cula efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_ESCOLINHA_GINASTICA: {
    moduleType: 'INSCRICAO_ESCOLINHA_GINASTICA',
    name: 'Workflow - InscriÃ§Ã£o em Escolinha de GinÃ¡stica',
    description: 'Fluxo para inscriÃ§Ã£o em escolinha de ginÃ¡stica',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado MÃ©dico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'MatrÃ­cula efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_ESCOLINHA_CAPOEIRA: {
    moduleType: 'INSCRICAO_ESCOLINHA_CAPOEIRA',
    name: 'Workflow - InscriÃ§Ã£o em Escolinha de Capoeira',
    description: 'Fluxo para inscriÃ§Ã£o em escolinha de capoeira',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'graduacao_atual'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado MÃ©dico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da matrÃ­cula',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'MatrÃ­cula efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  BOLSA_ATLETA: {
    moduleType: 'BOLSA_ATLETA',
    name: 'Workflow - Bolsa Atleta',
    description: 'Fluxo para concessÃ£o de bolsa atleta',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['modalidade', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'HistÃ³rico Esportivo'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AvaliaÃ§Ã£o do histÃ³rico esportivo',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'pontuacao', 'nivel_atleta'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 4,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'renda_familiar'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da bolsa',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['valor_bolsa', 'periodo_vigencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Portaria',
        order: 6,
        description: 'EmissÃ£o de portaria de concessÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Bolsa concedida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== EDUCAÃ‡ÃƒO (continuaÃ§Ã£o) ==========
  INSCRICAO_CRECHE: {
    moduleType: 'INSCRICAO_CRECHE',
    name: 'Workflow - InscriÃ§Ã£o em Creche',
    description: 'Fluxo para inscriÃ§Ã£o em creche municipal',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_crianca', 'data_nascimento', 'creche_preferencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica da famÃ­lia',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'pontuacao', 'grupo_prioritario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ClassificaÃ§Ã£o',
        order: 4,
        description: 'ClassificaÃ§Ã£o na lista de espera',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['posicao_lista', 'pontuacao_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 5,
        description: 'EmissÃ£o de comprovante de inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'InscriÃ§Ã£o concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CADASTRO_PROFESSOR: {
    moduleType: 'CADASTRO_PROFESSOR',
    name: 'Workflow - Cadastro de Professor',
    description: 'Fluxo para cadastramento de professor municipal',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['area_atuacao', 'formacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG do ResponsÃ¡vel', 'CPF do ResponsÃ¡vel', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Curricular',
        order: 3,
        description: 'AnÃ¡lise do currÃ­culo',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_curricular', 'experiencia_anos', 'titulacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastramento',
        order: 4,
        description: 'InclusÃ£o no banco de professores',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cadastro', 'data_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 5,
        description: 'EmissÃ£o de certificado de cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  SOLICITACAO_DOCUMENTO_ESCOLAR: {
    moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    name: 'Workflow - SolicitaÃ§Ã£o de Documento Escolar',
    description: 'Fluxo para solicitaÃ§Ã£o de documentos escolares',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_documento', 'nome_aluno', 'escola'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Dados',
        order: 2,
        description: 'VerificaÃ§Ã£o no sistema escolar',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['aluno_encontrado', 'historico_verificado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o do Documento',
        order: 3,
        description: 'ElaboraÃ§Ã£o do documento solicitado',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['documento_elaborado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o',
        order: 4,
        description: 'EmissÃ£o do documento',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'Documento emitido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  REGISTRO_OCORRENCIA_ESCOLAR: {
    moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR',
    name: 'Workflow - Registro de OcorrÃªncia Escolar',
    description: 'Fluxo para registro de ocorrÃªncias escolares',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da ocorrÃªncia',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_ocorrencia', 'escola', 'descricao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Preliminar',
        order: 2,
        description: 'AnÃ¡lise inicial da ocorrÃªncia',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gravidade', 'necessita_intervencao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'InvestigaÃ§Ã£o',
        order: 3,
        description: 'InvestigaÃ§Ã£o da ocorrÃªncia',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_investigacao', 'envolvidos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ProvidÃªncias',
        order: 4,
        description: 'Tomada de providÃªncias',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['providencias_tomadas', 'responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CONSULTA_FREQUENCIA_NOTAS: {
    moduleType: 'CONSULTA_FREQUENCIA_NOTAS',
    name: 'Workflow - Consulta de FrequÃªncia e Notas',
    description: 'Fluxo para consulta de frequÃªncia e notas',
    defaultSLA: 2,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da consulta',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'escola'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Consulta no Sistema',
        order: 2,
        description: 'Busca de informaÃ§Ãµes',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_encontrados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_CURSO_LIVRE: {
    moduleType: 'INSCRICAO_CURSO_LIVRE',
    name: 'Workflow - InscriÃ§Ã£o em Curso Livre',
    description: 'Fluxo para inscriÃ§Ã£o em cursos livres',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['curso_escolhido', 'turma_preferencial'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 2,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 3,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'InscriÃ§Ã£o efetivada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== SAÃšDE (continuaÃ§Ã£o) ==========
  AGENDAMENTO_ESPECIALIZADO: {
    moduleType: 'AGENDAMENTO_ESPECIALIZADO',
    name: 'Workflow - Agendamento de Consulta Especializada',
    description: 'Fluxo para agendamento de consultas com especialistas',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['especialidade', 'urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Encaminhamento',
        order: 2,
        description: 'VerificaÃ§Ã£o do encaminhamento mÃ©dico',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Documentos relacionados ao assunto do agendamento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'RegulaÃ§Ã£o',
        order: 3,
        description: 'RegulaÃ§Ã£o mÃ©dica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_regulacao', 'prioridade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 4,
        description: 'Agendamento da consulta',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_consulta', 'hora_consulta', 'local', 'medico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 5,
        description: 'ConfirmaÃ§Ã£o do agendamento',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Consulta agendada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  AGENDAMENTO_ODONTOLOGIA: {
    moduleType: 'AGENDAMENTO_ODONTOLOGIA',
    name: 'Workflow - Agendamento OdontolÃ³gico',
    description: 'Fluxo para agendamento de consultas odontolÃ³gicas',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_atendimento', 'urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Triagem',
        order: 2,
        description: 'ClassificaÃ§Ã£o de urgÃªncia',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['prioridade', 'tipo_procedimento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'Agendamento da consulta',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_consulta', 'hora_consulta', 'unidade_saude', 'dentista'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o do agendamento',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'Consulta agendada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  MEDICAMENTOS_ALTO_CUSTO: {
    moduleType: 'MEDICAMENTOS_ALTO_CUSTO',
    name: 'Workflow - Medicamentos de Alto Custo',
    description: 'Fluxo para solicitaÃ§Ã£o de medicamentos de alto custo',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['medicamento_solicitado'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Receita MÃ©dica Especial', 'Laudo MÃ©dico', 'Exames Complementares', 'CartÃ£o SUS', 'RG ou CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AvaliaÃ§Ã£o tÃ©cnica farmacÃªutica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_farmaceutico', 'indicacao_aprovada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise MÃ©dica',
        order: 4,
        description: 'AnÃ¡lise por mÃ©dico auditor',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_medico', 'protocolo_clinico_atendido'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['quantidade_aprovada', 'periodo_tratamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AutorizaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o de autorizaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Medicamento autorizado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== MEIO AMBIENTE (continuaÃ§Ã£o) ==========
  AUTORIZACAO_SUPRESSAO_VEGETAL: {
    moduleType: 'AUTORIZACAO_SUPRESSAO_VEGETAL',
    name: 'Workflow - AutorizaÃ§Ã£o para SupressÃ£o Vegetal',
    description: 'Fluxo para autorizaÃ§Ã£o de supressÃ£o vegetal',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        requiredStageOutputs: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'RECEPTION',
        actionLabels: { APPROVE: 'Iniciar/Aceitar protocolo' }
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria no local',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'area_verificada', 'especies_encontradas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Parecer TÃ©cnico',
        order: 4,
        description: 'ElaboraÃ§Ã£o de parecer tÃ©cnico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'viabilidade', 'compensacao_ambiental_necessaria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_autorizada', 'condicoes', 'medidas_compensatorias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o do documento de autorizaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AutorizaÃ§Ã£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  LICENCA_AMBIENTAL_SIMPLIFICADA: {
    moduleType: 'LICENCA_AMBIENTAL_SIMPLIFICADA',
    name: 'Workflow - LicenÃ§a Ambiental Simplificada',
    description: 'Fluxo para licenciamento ambiental simplificado',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['atividade', 'porte_empreendimento'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Projeto Simplificado'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise tÃ©cnica do projeto',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'impacto_ambiental', 'medidas_mitigadoras'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'relatorio_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da licenÃ§a',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_licenca', 'validade', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de LicenÃ§a',
        order: 6,
        description: 'EmissÃ£o da licenÃ§a',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'LicenÃ§a emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  AUTORIZACAO_CAPTACAO_AGUA: {
    moduleType: 'AUTORIZACAO_CAPTACAO_AGUA',
    name: 'Workflow - AutorizaÃ§Ã£o para CaptaÃ§Ã£o de Ãgua',
    description: 'Fluxo para autorizaÃ§Ã£o de captaÃ§Ã£o de Ã¡gua',
    defaultSLA: 25,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['fonte_captacao', 'vazao_solicitada', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Projeto HidrÃ¡ulico', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise HidrolÃ³gica',
        order: 3,
        description: 'AnÃ¡lise tÃ©cnica hidrolÃ³gica',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_hidrologico', 'disponibilidade_hidrica', 'vazao_autorizada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'relatorio_vistoria', 'fonte_verificada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da outorga',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vazao_outorgada', 'periodo_validade', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Outorga',
        order: 6,
        description: 'EmissÃ£o da outorga',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Outorga emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL (workflows faltantes) ==========
  ACOLHIMENTO_CASA_ABRIGO: {
    moduleType: 'ACOLHIMENTO_CASA_ABRIGO',
    name: 'Workflow - Acolhimento em Casa de Abrigo',
    description: 'Fluxo para acolhimento institucional em casa de abrigo',
    defaultSLA: 1,
    stages: [
      {
        name: 'RecepÃ§Ã£o Emergencial',
        order: 1,
        description: 'Acolhimento imediato',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['motivo_acolhimento', 'situacao_risco', 'grau_urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o Social',
        order: 2,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o social',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_social', 'composicao_familiar', 'historico_violencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o PsicolÃ³gica',
        order: 3,
        description: 'AvaliaÃ§Ã£o psicolÃ³gica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_psicologico', 'estado_emocional', 'necessidades_atendimento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Plano Individual de Atendimento',
        order: 4,
        description: 'ElaboraÃ§Ã£o do PIA',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['objetivos_acolhimento', 'acoes_planejadas', 'prazo_estimado', 'responsavel_caso'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Acompanhamento',
        order: 5,
        description: 'Acompanhamento durante acolhimento',
        slaDays: 30,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_acompanhamento', 'evolucao_caso'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Acolhimento efetivado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  ACOMPANHAMENTO_SOCIAL: {
    moduleType: 'ACOMPANHAMENTO_SOCIAL',
    name: 'Workflow - Acompanhamento Social',
    description: 'Fluxo para acompanhamento social de famÃ­lias',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do acompanhamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['familia', 'motivo_acompanhamento', 'vulnerabilidades'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'DiagnÃ³stico Social',
        order: 2,
        description: 'ElaboraÃ§Ã£o do diagnÃ³stico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['situacao_habitacional', 'situacao_economica', 'situacao_saude', 'situacao_educacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Plano de Acompanhamento',
        order: 3,
        description: 'ElaboraÃ§Ã£o do plano',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['objetivos', 'acoes_planejadas', 'periodicidade_visitas', 'responsavel_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ExecuÃ§Ã£o',
        order: 4,
        description: 'ExecuÃ§Ã£o do acompanhamento',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['visitas_realizadas', 'evolucao_familia', 'encaminhamentos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o',
        order: 5,
        description: 'AvaliaÃ§Ã£o dos resultados',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['objetivos_alcancados', 'necessidade_continuidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Acompanhamento concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== EDUCAÃ‡ÃƒO (workflows faltantes) ==========
  AEE: {
    moduleType: 'AEE',
    name: 'Workflow - Atendimento Educacional Especializado',
    description: 'Fluxo para AEE (Atendimento Educacional Especializado)',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['aluno', 'escola', 'tipo_necessidade', 'serie'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o PedagÃ³gica',
        order: 2,
        description: 'AvaliaÃ§Ã£o pedagÃ³gica do aluno',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_pedagogico', 'necessidades_identificadas', 'potencialidades'],
        requiredDocumentTypes: ['Laudo MÃ©dico'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Plano de Atendimento',
        order: 3,
        description: 'ElaboraÃ§Ã£o do plano de AEE',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['objetivos_aee', 'recursos_necessarios', 'periodicidade_atendimento', 'profissional_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do plano',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'InÃ­cio do Atendimento',
        order: 5,
        description: 'InÃ­cio dos atendimentos',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'AEE autorizado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== SAÃšDE (workflows faltantes) ==========
  AGENDAMENTO_CAPS: {
    moduleType: 'AGENDAMENTO_CAPS',
    name: 'Workflow - Agendamento em CAPS',
    description: 'Fluxo para agendamento em Centro de AtenÃ§Ã£o Psicossocial',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['paciente', 'tipo_caps', 'motivo_atendimento'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Triagem',
        order: 2,
        description: 'Triagem e avaliaÃ§Ã£o inicial',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gravidade_caso', 'urgencia', 'encaminhamento_necessario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'DefiniÃ§Ã£o de data e horÃ¡rio',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_atendimento', 'horario', 'profissional_responsavel', 'modalidade_atendimento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o com o paciente',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'Agendamento confirmado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  AGENDAMENTO_CENTRO_REFERENCIA: {
    moduleType: 'AGENDAMENTO_CENTRO_REFERENCIA',
    name: 'Workflow - Agendamento em Centro de ReferÃªncia',
    description: 'Fluxo para agendamento em centros de referÃªncia especializados',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['paciente', 'especialidade', 'centro_referencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Encaminhamento',
        order: 2,
        description: 'ValidaÃ§Ã£o do encaminhamento mÃ©dico',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'RegulaÃ§Ã£o',
        order: 3,
        description: 'RegulaÃ§Ã£o e priorizaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['prioridade', 'classificacao_risco', 'observacoes_regulacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 4,
        description: 'DefiniÃ§Ã£o de data e horÃ¡rio',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_consulta', 'horario', 'profissional', 'unidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o ao paciente',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Agendamento efetivado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== PLANEJAMENTO URBANO (workflows faltantes) ==========
  ALVARA_REFORMA: {
    moduleType: 'ALVARA_REFORMA',
    name: 'Workflow - AlvarÃ¡ para Reforma',
    description: 'Fluxo para autorizaÃ§Ã£o de reforma em edificaÃ§Ã£o',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['endereco_imovel', 'tipo_reforma', 'area_reforma'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['MatrÃ­cula do ImÃ³vel', 'Projeto de Reforma', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise do projeto',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['conformidade_codigo_obras', 'conformidade_zoneamento', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'relatorio_vistoria', 'situacao_encontrada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'observacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AlvarÃ¡',
        order: 6,
        description: 'EmissÃ£o do alvarÃ¡',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AlvarÃ¡ emitido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  APROVACAO_PROJETO: {
    moduleType: 'APROVACAO_PROJETO',
    name: 'Workflow - AprovaÃ§Ã£o de Projeto',
    description: 'Fluxo para aprovaÃ§Ã£o de projetos arquitetÃ´nicos',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do projeto',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['endereco', 'tipo_edificacao', 'area_construcao', 'numero_pavimentos'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['MatrÃ­cula do ImÃ³vel', 'Projeto ArquitetÃ´nico', 'ART', 'Planta de SituaÃ§Ã£o'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise UrbanÃ­stica',
        order: 3,
        description: 'AnÃ¡lise de conformidade urbanÃ­stica',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['conformidade_plano_diretor', 'conformidade_zoneamento', 'taxa_ocupacao', 'coeficiente_aproveitamento', 'recuos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise ArquitetÃ´nica',
        order: 4,
        description: 'AnÃ¡lise do projeto arquitetÃ´nico',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['conformidade_codigo_obras', 'conformidade_acessibilidade', 'conformidade_incendio', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Parecer Final',
        order: 5,
        description: 'ConsolidaÃ§Ã£o de pareceres',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_consolidado', 'gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AprovaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o do documento de aprovaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Projeto aprovado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  APROVACAO_LOTEAMENTO: {
    moduleType: 'APROVACAO_LOTEAMENTO',
    name: 'Workflow - AprovaÃ§Ã£o de Loteamento',
    description: 'Fluxo para aprovaÃ§Ã£o de projeto de loteamento',
    defaultSLA: 45,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do projeto',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['localizacao', 'area_total', 'numero_lotes', 'area_lotes', 'infraestrutura_prevista'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 7,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto de Loteamento', 'Memorial Descritivo', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise UrbanÃ­stica',
        order: 3,
        description: 'AnÃ¡lise de conformidade urbanÃ­stica',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['conformidade_plano_diretor', 'conformidade_lei_parcelamento', 'areas_publicas', 'sistema_viario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Ambiental',
        order: 4,
        description: 'AnÃ¡lise de impacto ambiental',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_ambiental', 'areas_preservacao', 'drenagem', 'impactos_identificados'],
        requiredDocumentTypes: ['LicenÃ§a Ambiental'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Infraestrutura',
        order: 5,
        description: 'AnÃ¡lise de infraestrutura',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['agua_esgoto', 'energia_eletrica', 'pavimentacao', 'drenagem_pluvial', 'arborizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o TÃ©cnica',
        order: 6,
        description: 'AprovaÃ§Ã£o tÃ©cnica consolidada',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AprovaÃ§Ã£o',
        order: 7,
        description: 'EmissÃ£o do documento de aprovaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'Loteamento aprovado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CERTIDAO_USO_SOLO: {
    moduleType: 'CERTIDAO_USO_SOLO',
    name: 'Workflow - CertidÃ£o de Uso do Solo',
    description: 'Fluxo para emissÃ£o de certidÃ£o de uso e ocupaÃ§Ã£o do solo',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['endereco_imovel', 'matricula', 'finalidade_certidao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'MatrÃ­cula do ImÃ³vel'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise UrbanÃ­stica',
        order: 3,
        description: 'Consulta de legislaÃ§Ã£o urbanÃ­stica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['zona', 'uso_permitido', 'indices_urbanisticos', 'restricoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o da CertidÃ£o',
        order: 4,
        description: 'ElaboraÃ§Ã£o do documento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['responsavel_tecnico', 'data_elaboracao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de CertidÃ£o',
        order: 5,
        description: 'EmissÃ£o da certidÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'CertidÃ£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== DESENVOLVIMENTO ECONÃ”MICO (workflows faltantes) ==========
  ANALISE_VIABILIDADE_EMPREENDIMENTO: {
    moduleType: 'ANALISE_VIABILIDADE_EMPREENDIMENTO',
    name: 'Workflow - AnÃ¡lise de Viabilidade de Empreendimento',
    description: 'Fluxo para anÃ¡lise de viabilidade de novos empreendimentos',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_empreendimento', 'localizacao', 'area_necessaria', 'investimento_previsto'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise EconÃ´mica',
        order: 3,
        description: 'AnÃ¡lise de viabilidade econÃ´mica',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['viabilidade_financeira', 'retorno_investimento', 'geracoes_emprego'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise UrbanÃ­stica',
        order: 4,
        description: 'AnÃ¡lise de adequaÃ§Ã£o urbanÃ­stica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['compatibilidade_zoneamento', 'infraestrutura_disponivel', 'impacto_urbano'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Parecer TÃ©cnico',
        order: 5,
        description: 'ConsolidaÃ§Ã£o de pareceres',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'recomendacoes', 'responsavel_parecer'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Parecer',
        order: 6,
        description: 'EmissÃ£o do documento',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AnÃ¡lise concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== TECNOLOGIA (workflows faltantes) ==========
  API_INTEGRACAO: {
    moduleType: 'API_INTEGRACAO',
    name: 'Workflow - SolicitaÃ§Ã£o de IntegraÃ§Ã£o API',
    description: 'Fluxo para solicitaÃ§Ã£o de integraÃ§Ã£o com APIs municipais',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['sistema_origem', 'finalidade_integracao', 'apis_necessarias'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Requisitos',
        order: 2,
        description: 'AnÃ¡lise dos requisitos tÃ©cnicos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['requisitos_tecnicos', 'volume_requisicoes', 'dados_necessarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SeguranÃ§a',
        order: 3,
        description: 'AnÃ¡lise de seguranÃ§a da informaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_seguranca', 'riscos_identificados', 'medidas_protecao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da integraÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfiguraÃ§Ã£o',
        order: 5,
        description: 'ConfiguraÃ§Ã£o tÃ©cnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['credenciais_geradas', 'ambiente', 'documentacao_fornecida'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Credenciais',
        order: 6,
        description: 'Envio de credenciais e documentaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'IntegraÃ§Ã£o liberada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== AGRICULTURA (workflows faltantes) ==========
  APOIO_FEIRA_EXPOSICAO: {
    moduleType: 'APOIO_FEIRA_EXPOSICAO',
    name: 'Workflow - Apoio para Feira ou ExposiÃ§Ã£o',
    description: 'Fluxo para solicitaÃ§Ã£o de apoio a feiras e exposiÃ§Ãµes agropecuÃ¡rias',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_evento', 'data_evento', 'local_evento', 'publico_esperado', 'apoio_solicitado'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF ou CNPJ', 'Projeto do Evento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Viabilidade',
        order: 3,
        description: 'AnÃ¡lise de viabilidade do apoio',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['recursos_disponiveis', 'impacto_agricultura', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do apoio',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_apoio_aprovado', 'recursos_liberados', 'gestor_aprovador'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'FormalizaÃ§Ã£o',
        order: 5,
        description: 'FormalizaÃ§Ã£o do apoio',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['termo_compromisso', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Termo',
        order: 6,
        description: 'EmissÃ£o do termo de apoio',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Apoio formalizado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== PLANEJAMENTO URBANO (workflows faltantes - continuaÃ§Ã£o) ==========
  APROVACAO_DEMOLICAO_PARCIAL: {
    moduleType: 'APROVACAO_DEMOLICAO_PARCIAL',
    name: 'Workflow - AprovaÃ§Ã£o de DemoliÃ§Ã£o Parcial',
    description: 'Fluxo para autorizaÃ§Ã£o de demoliÃ§Ã£o parcial de edificaÃ§Ã£o',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['endereco_imovel', 'area_demolicao', 'motivo_demolicao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['MatrÃ­cula do ImÃ³vel', 'Projeto de DemoliÃ§Ã£o', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Estrutural',
        order: 3,
        description: 'AnÃ¡lise tÃ©cnica estrutural',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_estrutural', 'seguranca_demolicao', 'medidas_protecao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'relatorio_vistoria', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o do documento',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AutorizaÃ§Ã£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  APROVACAO_PROJETO_URBANIZACAO: {
    moduleType: 'APROVACAO_PROJETO_URBANIZACAO',
    name: 'Workflow - AprovaÃ§Ã£o de Projeto de UrbanizaÃ§Ã£o',
    description: 'Fluxo para aprovaÃ§Ã£o de projetos de urbanizaÃ§Ã£o de Ã¡reas',
    defaultSLA: 40,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do projeto',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['localizacao', 'area_total', 'tipo_urbanizacao', 'populacao_beneficiada'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto de UrbanizaÃ§Ã£o', 'Memorial Descritivo', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise UrbanÃ­stica',
        order: 3,
        description: 'AnÃ¡lise de conformidade urbanÃ­stica',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['conformidade_plano_diretor', 'adequacao_infraestrutura', 'sistema_viario', 'areas_publicas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Ambiental',
        order: 4,
        description: 'AnÃ¡lise de impacto ambiental',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_ambiental', 'drenagem', 'saneamento', 'areas_verdes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Social',
        order: 5,
        description: 'AnÃ¡lise de impacto social',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['impacto_social', 'participacao_comunidade', 'equipamentos_comunitarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Parecer TÃ©cnico Consolidado',
        order: 6,
        description: 'ConsolidaÃ§Ã£o de pareceres',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'viabilidade', 'condicoes', 'gestor_aprovador'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AprovaÃ§Ã£o',
        order: 7,
        description: 'EmissÃ£o do documento de aprovaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'Projeto aprovado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== SAÃšDE (workflows faltantes - continuaÃ§Ã£o) ==========
  ATENDIMENTO_DOMICILIAR: {
    moduleType: 'ATENDIMENTO_DOMICILIAR',
    name: 'Workflow - Atendimento Domiciliar',
    description: 'Fluxo para solicitaÃ§Ã£o de atendimento domiciliar de saÃºde',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['paciente', 'endereco', 'motivo_solicitacao', 'grau_urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Triagem',
        order: 2,
        description: 'Triagem e avaliaÃ§Ã£o da necessidade',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['criterios_elegibilidade', 'prioridade', 'tipo_atendimento_necessario'],
        requiredDocumentTypes: ['CartÃ£o SUS'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'Agendamento da visita',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'horario', 'profissional_designado', 'equipe'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 4,
        description: 'NotificaÃ§Ã£o ao paciente',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'Atendimento agendado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== DESENVOLVIMENTO ECONÃ”MICO (workflows faltantes - continuaÃ§Ã£o) ==========
  ATUALIZACAO_CADASTRAL_EMPRESA: {
    moduleType: 'ATUALIZACAO_CADASTRAL_EMPRESA',
    name: 'Workflow - AtualizaÃ§Ã£o Cadastral de Empresa',
    description: 'Fluxo para atualizaÃ§Ã£o de dados cadastrais de empresa',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['cnpj', 'dados_atualizar', 'motivo_atualizacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Contrato Social Atualizado', 'Comprovante de EndereÃ§o Comercial'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o dos dados informados',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_verificados', 'inconsistencias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AtualizaÃ§Ã£o',
        order: 4,
        description: 'AtualizaÃ§Ã£o no sistema',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['responsavel_atualizacao', 'data_atualizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 5,
        description: 'EmissÃ£o de comprovante',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'AtualizaÃ§Ã£o concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== FINANÃ‡AS (workflows faltantes) ==========
  ATUALIZACAO_CADASTRAL_IMOVEL: {
    moduleType: 'ATUALIZACAO_CADASTRAL_IMOVEL',
    name: 'Workflow - AtualizaÃ§Ã£o Cadastral de ImÃ³vel',
    description: 'Fluxo para atualizaÃ§Ã£o de dados cadastrais de imÃ³vel',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['inscricao_imobiliaria', 'dados_atualizar', 'motivo_atualizacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura ou Contrato de Compra e Venda', 'RG e CPF do ProprietÃ¡rio', 'Comprovante de EndereÃ§o', 'CarnÃª de IPTU'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o Cadastral',
        order: 3,
        description: 'VerificaÃ§Ã£o dos dados cadastrais',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_atuais', 'dados_novos', 'inconsistencias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria (se necessÃ¡rio)',
        order: 4,
        description: 'Vistoria no imÃ³vel',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['necessita_vistoria', 'data_vistoria', 'responsavel_vistoria', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: true
      },
      {
        name: 'AtualizaÃ§Ã£o',
        order: 5,
        description: 'AtualizaÃ§Ã£o no cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['responsavel_atualizacao', 'data_atualizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 6,
        description: 'EmissÃ£o de comprovante',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AtualizaÃ§Ã£o concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== MOBILIDADE URBANA (workflows faltantes) ==========
  AUTORIZACAO_EVENTO_VIA: {
    moduleType: 'AUTORIZACAO_EVENTO_VIA',
    name: 'Workflow - AutorizaÃ§Ã£o para Evento em Via PÃºblica',
    description: 'Fluxo para autorizaÃ§Ã£o de eventos em vias pÃºblicas',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_evento', 'data_evento', 'local_evento', 'horario_inicio', 'horario_fim', 'publico_esperado'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto do Evento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de TrÃ¢nsito',
        order: 3,
        description: 'AnÃ¡lise de impacto no trÃ¢nsito',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['impacto_transito', 'desvios_necessarios', 'sinalizacao_necessaria', 'parecer_transito'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de SeguranÃ§a',
        order: 4,
        description: 'AnÃ¡lise de seguranÃ§a',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['efetivo_necessario', 'medidas_seguranca', 'parecer_seguranca'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do Local',
        order: 5,
        description: 'Vistoria tÃ©cnica no local',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'relatorio_vistoria', 'adequacao_local'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 7,
        description: 'EmissÃ£o do alvarÃ¡',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'AutorizaÃ§Ã£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== MEIO AMBIENTE (workflows faltantes) ==========
  AUTORIZACAO_MANEJO_FAUNA: {
    moduleType: 'AUTORIZACAO_MANEJO_FAUNA',
    name: 'Workflow - AutorizaÃ§Ã£o para Manejo de Fauna',
    description: 'Fluxo para autorizaÃ§Ã£o de manejo e captura de fauna silvestre',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['especie', 'localizacao', 'motivo_manejo', 'procedimento_pretendido'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise tÃ©cnica do pedido',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['especie_ameacada', 'metodo_adequado', 'impacto_ambiental', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_local', 'relatorio_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o da licenÃ§a',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AutorizaÃ§Ã£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== EDUCAÃ‡ÃƒO / TRANSPORTE ESCOLAR (workflows faltantes) ==========
  AUTORIZACAO_TRANSPORTE_ESCOLAR: {
    moduleType: 'AUTORIZACAO_TRANSPORTE_ESCOLAR',
    name: 'Workflow - AutorizaÃ§Ã£o de Transporte Escolar',
    description: 'Fluxo para autorizaÃ§Ã£o de veÃ­culo para transporte escolar',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['proprietario_veiculo', 'placa', 'capacidade', 'rotas_pretendidas'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Seguro do VeÃ­culo'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do VeÃ­culo',
        order: 3,
        description: 'Vistoria tÃ©cnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_veiculo', 'equipamentos_seguranca', 'aprovado_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Rotas',
        order: 4,
        description: 'AnÃ¡lise e definiÃ§Ã£o de rotas',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['rotas_aprovadas', 'horarios', 'pontos_parada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o do documento',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AutorizaÃ§Ã£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== TURISMO (workflows faltantes) ==========
  AUTORIZACAO_TRANSPORTE_TURISTICO: {
    moduleType: 'AUTORIZACAO_TRANSPORTE_TURISTICO',
    name: 'Workflow - AutorizaÃ§Ã£o de Transporte TurÃ­stico',
    description: 'Fluxo para autorizaÃ§Ã£o de transporte turÃ­stico',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_veiculo', 'placa', 'capacidade', 'roteiros_turisticos'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Seguro dos VeÃ­culos'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do VeÃ­culo',
        order: 3,
        description: 'Vistoria tÃ©cnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_veiculo', 'equipamentos', 'aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 5,
        description: 'EmissÃ£o da autorizaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'AutorizaÃ§Ã£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== HABITAÃ‡ÃƒO (workflows faltantes) ==========
  AUXILIO_ALUGUEL: {
    moduleType: 'AUXILIO_ALUGUEL',
    name: 'Workflow - AuxÃ­lio Aluguel',
    description: 'Fluxo para concessÃ£o de auxÃ­lio aluguel',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'situacao_moradia_atual', 'motivo_solicitacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'prioridade', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar',
        order: 4,
        description: 'Visita tÃ©cnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'situacao_constatada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 5,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'valor_auxilio', 'periodo_concessao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AuxÃ­lio concedido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  AUXILIO_CONSTRUCAO: {
    moduleType: 'AUXILIO_CONSTRUCAO',
    name: 'Workflow - AuxÃ­lio ConstruÃ§Ã£o',
    description: 'Fluxo para concessÃ£o de auxÃ­lio para construÃ§Ã£o',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'possui_terreno', 'tipo_auxilio'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'prioridade', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita ao Terreno',
        order: 4,
        description: 'Vistoria do terreno',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'viabilidade_construcao', 'relatorio_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 5,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_auxilio_aprovado', 'valor_estimado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Termo',
        order: 7,
        description: 'EmissÃ£o do termo de concessÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'AuxÃ­lio concedido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== DESENVOLVIMENTO ECONÃ”MICO (workflows faltantes - continuaÃ§Ã£o) ==========
  BAIXA_EMPRESA: {
    moduleType: 'BAIXA_EMPRESA',
    name: 'Workflow - Baixa de Empresa',
    description: 'Fluxo para encerramento/baixa de empresa',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['cnpj', 'motivo_baixa', 'data_encerramento_atividades'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CertidÃµes Negativas (Tributos Municipais, Estaduais e Federais)', 'CNPJ'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de DÃ©bitos',
        order: 3,
        description: 'VerificaÃ§Ã£o de pendÃªncias fiscais',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['possui_debitos', 'valor_debitos', 'situacao_regularizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria (se necessÃ¡rio)',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['necessita_vistoria', 'data_vistoria', 'responsavel_vistoria', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: true
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da baixa',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Processamento',
        order: 6,
        description: 'Baixa no sistema',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['responsavel_processamento', 'data_baixa_sistema'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 7,
        description: 'EmissÃ£o do comprovante',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'Baixa concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL (workflows faltantes - continuaÃ§Ã£o) ==========
  BENEFICIO_EVENTUAL: {
    moduleType: 'BENEFICIO_EVENTUAL',
    name: 'Workflow - BenefÃ­cio Eventual',
    description: 'Fluxo para concessÃ£o de benefÃ­cios eventuais',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_beneficio', 'motivo_solicitacao', 'grau_urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o Social',
        order: 3,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['situacao_socioeconomica', 'vulnerabilidade', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 4,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_beneficio_aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o e concessÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'BenefÃ­cio concedido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  BOLSA_FAMILIA_MUNICIPAL: {
    moduleType: 'BOLSA_FAMILIA_MUNICIPAL',
    name: 'Workflow - Bolsa FamÃ­lia Municipal',
    description: 'Fluxo para inscriÃ§Ã£o em programa de transferÃªncia de renda municipal',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'situacao_moradia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda Familiar', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'pontuacao', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar',
        order: 4,
        description: 'Visita tÃ©cnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'situacao_constatada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 5,
        description: 'VerificaÃ§Ã£o final de critÃ©rios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'prioridade', 'valor_beneficio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o e inclusÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'FamÃ­lia incluÃ­da no programa',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== AGRICULTURA (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_AGROINDUSTRIA: {
    moduleType: 'CADASTRO_AGROINDUSTRIA',
    name: 'Workflow - Cadastro de AgroindÃºstria',
    description: 'Fluxo para cadastramento de agroindÃºstria',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_agroindustria', 'tipo_producao', 'localizacao', 'capacidade_producao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Propriedade'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria nas instalaÃ§Ãµes',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'equipamentos', 'condicoes_higiene', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise tÃ©cnica da produÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['processo_produtivo', 'controle_qualidade', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 6,
        description: 'EmissÃ£o do certificado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== TURISMO (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_ATRACAO_TURISTICA: {
    moduleType: 'CADASTRO_ATRACAO_TURISTICA',
    name: 'Workflow - Cadastro de AtraÃ§Ã£o TurÃ­stica',
    description: 'Fluxo para cadastramento de atraÃ§Ã£o turÃ­stica',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_atracao', 'tipo_atracao', 'localizacao', 'descricao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF ou CNPJ', 'Fotos do Local'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'acessibilidade', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 5,
        description: 'EmissÃ£o do certificado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== FINANÃ‡AS (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_CONTRIBUINTE: {
    moduleType: 'CADASTRO_CONTRIBUINTE',
    name: 'Workflow - Cadastro de Contribuinte',
    description: 'Fluxo para cadastramento de contribuinte',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_contribuinte', 'cpf_cnpj', 'nome_razao_social'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o dos dados cadastrais',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_verificados', 'inconsistencias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Cadastramento',
        order: 4,
        description: 'InclusÃ£o no cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inscricao_municipal', 'responsavel_cadastro', 'data_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 5,
        description: 'EmissÃ£o do comprovante',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== HABITAÃ‡ÃƒO (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_DEFICIT_HABITACIONAL: {
    moduleType: 'CADASTRO_DEFICIT_HABITACIONAL',
    name: 'Workflow - Cadastro em DÃ©ficit Habitacional',
    description: 'Fluxo para cadastramento em lista de dÃ©ficit habitacional',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'situacao_moradia_atual'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'pontuacao', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar',
        order: 4,
        description: 'Visita tÃ©cnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'situacao_constatada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Cadastramento',
        order: 5,
        description: 'InclusÃ£o na lista',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_FAMILIA_RISCO: {
    moduleType: 'CADASTRO_FAMILIA_RISCO',
    name: 'Workflow - Cadastro de FamÃ­lia em Risco',
    description: 'Fluxo para cadastramento de famÃ­lia em situaÃ§Ã£o de risco',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'tipo_risco', 'grau_urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o Inicial',
        order: 2,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o de risco',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['riscos_identificados', 'vulnerabilidades', 'prioridade', 'necessidade_protecao_imediata'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar Emergencial',
        order: 3,
        description: 'Visita imediata',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'situacao_constatada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Plano de Acompanhamento',
        order: 4,
        description: 'ElaboraÃ§Ã£o do plano',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['acoes_imediatas', 'servicos_encaminhados', 'responsavel_caso', 'periodicidade_acompanhamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Cadastramento',
        order: 5,
        description: 'InclusÃ£o no sistema de acompanhamento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'FamÃ­lia em acompanhamento',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CADASTRO_FORNECEDOR: {
    moduleType: 'CADASTRO_FORNECEDOR',
    name: 'Workflow - Cadastro de Fornecedor',
    description: 'Fluxo para cadastramento de fornecedor',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['razao_social', 'cnpj', 'ramo_atividade', 'produtos_servicos'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'CertidÃµes Negativas'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o dos dados cadastrais',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_verificados', 'situacao_fiscal', 'capacidade_tecnica'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de HabilitaÃ§Ã£o',
        order: 4,
        description: 'AnÃ¡lise de habilitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['habilitado', 'categorias_fornecimento', 'restricoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastramento',
        order: 5,
        description: 'InclusÃ£o no sistema',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cadastro', 'responsavel_cadastro', 'data_cadastro', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 6,
        description: 'EmissÃ£o do certificado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== MEIO AMBIENTE (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_GERADOR_RESIDUOS: {
    moduleType: 'CADASTRO_GERADOR_RESIDUOS',
    name: 'Workflow - Cadastro de Gerador de ResÃ­duos',
    description: 'Fluxo para cadastramento de gerador de resÃ­duos',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['razao_social', 'tipo_residuo', 'volume_mensal', 'destinacao_atual'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Projeto de Manejo', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria nas instalaÃ§Ãµes',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'armazenamento_residuos', 'segregacao', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise do PGRS',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['pgrs_adequado', 'destinacao_adequada', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 6,
        description: 'EmissÃ£o do certificado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== TECNOLOGIA (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_LOGIN_UNICO: {
    moduleType: 'CADASTRO_LOGIN_UNICO',
    name: 'Workflow - Cadastro em Login Ãšnico',
    description: 'Fluxo para cadastramento em sistema de login Ãºnico',
    defaultSLA: 3,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['cpf', 'email', 'telefone'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de Dados',
        order: 2,
        description: 'ValidaÃ§Ã£o dos dados informados',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['cpf_valido', 'email_validado', 'telefone_validado'],
        requiredDocumentTypes: ['CPF', 'RG'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'CriaÃ§Ã£o de Conta',
        order: 3,
        description: 'CriaÃ§Ã£o da conta no sistema',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CADASTRO_MEI: {
    moduleType: 'CADASTRO_MEI',
    name: 'Workflow - Cadastro de MEI',
    description: 'Fluxo para cadastramento de Microempreendedor Individual',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'atividade_principal', 'endereco_atuacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Viabilidade',
        order: 3,
        description: 'AnÃ¡lise de viabilidade de localizaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['zoneamento_permite', 'atividade_permitida', 'parecer_viabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria (se necessÃ¡rio)',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['necessita_vistoria', 'data_vistoria', 'responsavel_vistoria', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: true
      },
      {
        name: 'Cadastramento',
        order: 5,
        description: 'InclusÃ£o no cadastro municipal',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inscricao_municipal', 'responsavel_cadastro', 'data_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 6,
        description: 'EmissÃ£o do comprovante',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== AGRICULTURA (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_PISCICULTURA: {
    moduleType: 'CADASTRO_PISCICULTURA',
    name: 'Workflow - Cadastro de Piscicultura',
    description: 'Fluxo para cadastramento de empreendimento de piscicultura',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_empreendimento', 'localizacao', 'area_lamina_agua', 'especies_cultivadas'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria nas instalaÃ§Ãµes',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'manejo', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise tÃ©cnica do empreendimento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['viabilidade_tecnica', 'impacto_ambiental', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 6,
        description: 'EmissÃ£o do certificado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== CULTURA (workflows faltantes) ==========
  CADASTRO_PONTO_CULTURA: {
    moduleType: 'CADASTRO_PONTO_CULTURA',
    name: 'Workflow - Cadastro de Ponto de Cultura',
    description: 'Fluxo para cadastramento de ponto de cultura',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_ponto', 'tipo_manifestacao', 'localizacao', 'publico_atendido'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'PortfÃ³lio'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise do plano de aÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relevancia_cultural', 'impacto_comunidade', 'viabilidade', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria (se necessÃ¡rio)',
        order: 4,
        description: 'Vistoria no espaÃ§o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['necessita_vistoria', 'data_vistoria', 'responsavel_vistoria', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: true
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 6,
        description: 'EmissÃ£o do certificado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== DESENVOLVIMENTO ECONÃ”MICO (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_STARTUP: {
    moduleType: 'CADASTRO_STARTUP',
    name: 'Workflow - Cadastro de Startup',
    description: 'Fluxo para cadastramento de startup no ecossistema de inovaÃ§Ã£o municipal',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_startup', 'cnpj', 'area_atuacao', 'estagio_desenvolvimento', 'modelo_negocio'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ da Empresa', 'Contrato Social'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de InovaÃ§Ã£o',
        order: 3,
        description: 'AnÃ¡lise do carÃ¡ter inovador',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['carater_inovador', 'potencial_escalabilidade', 'mercado_alvo', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'beneficios_oferecidos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 5,
        description: 'EmissÃ£o do certificado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== MEIO AMBIENTE (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_VIVEIRO_MUDAS: {
    moduleType: 'CADASTRO_VIVEIRO_MUDAS',
    name: 'Workflow - Cadastro de Viveiro de Mudas',
    description: 'Fluxo para cadastramento de viveiro de mudas',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_viveiro', 'localizacao', 'area_total', 'capacidade_producao', 'especies_produzidas'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria nas instalaÃ§Ãµes',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'sistema_irrigacao', 'procedencia_sementes', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise tÃ©cnica da produÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['especies_nativas', 'qualidade_mudas', 'manejo_adequado', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 6,
        description: 'EmissÃ£o do certificado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL (workflows faltantes - continuaÃ§Ã£o) ==========
  CADASTRO_VOLUNTARIO: {
    moduleType: 'CADASTRO_VOLUNTARIO',
    name: 'Workflow - Cadastro de VoluntÃ¡rio',
    description: 'Fluxo para cadastramento de voluntÃ¡rio',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'area_interesse', 'disponibilidade', 'experiencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Entrevista',
        order: 3,
        description: 'Entrevista com o candidato',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_entrevista', 'responsavel_entrevista', 'perfil_adequado', 'observacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'CapacitaÃ§Ã£o',
        order: 4,
        description: 'CapacitaÃ§Ã£o inicial',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_capacitacao', 'temas_abordados', 'aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Cadastramento',
        order: 5,
        description: 'InclusÃ£o no banco de voluntÃ¡rios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Cadastro concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ESPORTES (workflows faltantes) ==========
  CAMPEONATO_MUNICIPAL: {
    moduleType: 'CAMPEONATO_MUNICIPAL',
    name: 'Workflow - InscriÃ§Ã£o em Campeonato Municipal',
    description: 'Fluxo para inscriÃ§Ã£o em campeonatos municipais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['modalidade', 'categoria', 'nome_equipe', 'responsavel'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documentos dos Atletas'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Elegibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['idade_categoria', 'documentos_regulares', 'atende_requisitos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'HomologaÃ§Ã£o',
        order: 4,
        description: 'HomologaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inscricao_homologada', 'numero_inscricao', 'chave_campeonato'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de ConfirmaÃ§Ã£o',
        order: 5,
        description: 'EmissÃ£o do comprovante',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== EDUCAÃ‡ÃƒO / TRANSPORTE (workflows faltantes) ==========
  CARTAO_ESTUDANTE: {
    moduleType: 'CARTAO_ESTUDANTE',
    name: 'Workflow - CartÃ£o de Estudante',
    description: 'Fluxo para solicitaÃ§Ã£o de cartÃ£o de estudante',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['aluno', 'escola', 'serie', 'turno'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'DeclaraÃ§Ã£o de MatrÃ­cula', 'Foto 3x4 recente'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o de MatrÃ­cula',
        order: 3,
        description: 'ValidaÃ§Ã£o junto Ã  escola',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['matricula_ativa', 'frequencia_regular'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ProduÃ§Ã£o do CartÃ£o',
        order: 4,
        description: 'ConfecÃ§Ã£o do cartÃ£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cartao', 'data_producao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega',
        order: 5,
        description: 'Entrega do cartÃ£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'CartÃ£o entregue',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CARTAO_PCD: {
    moduleType: 'CARTAO_PCD',
    name: 'Workflow - CartÃ£o PCD',
    description: 'Fluxo para solicitaÃ§Ã£o de cartÃ£o de pessoa com deficiÃªncia',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'tipo_deficiencia', 'grau_deficiencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Laudo MÃ©dico', 'Comprovante de ResidÃªncia', 'Foto 3x4 recente'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o MÃ©dica',
        order: 3,
        description: 'AvaliaÃ§Ã£o do laudo mÃ©dico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_valido', 'cid', 'tipo_deficiencia_confirmado', 'parecer_medico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'beneficios_concedidos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ProduÃ§Ã£o do CartÃ£o',
        order: 5,
        description: 'ConfecÃ§Ã£o do cartÃ£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cartao', 'data_producao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega',
        order: 6,
        description: 'Entrega do cartÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'CartÃ£o entregue',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CARTAO_TRANSPORTE: {
    moduleType: 'CARTAO_TRANSPORTE',
    name: 'Workflow - CartÃ£o de Transporte',
    description: 'Fluxo para solicitaÃ§Ã£o de cartÃ£o de transporte pÃºblico',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_cartao', 'nome', 'cpf'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'Comprovante de ResidÃªncia', 'Foto 3x4 recente'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_beneficio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ProduÃ§Ã£o do CartÃ£o',
        order: 4,
        description: 'ConfecÃ§Ã£o do cartÃ£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cartao', 'data_producao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega',
        order: 5,
        description: 'Entrega do cartÃ£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'CartÃ£o entregue',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL (workflows faltantes - continuaÃ§Ã£o) ==========
  CASA_LAR_IDOSO: {
    moduleType: 'CASA_LAR_IDOSO',
    name: 'Workflow - Casa Lar para Idoso',
    description: 'Fluxo para solicitaÃ§Ã£o de vaga em casa lar para idoso',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_idoso', 'idade', 'situacao_saude', 'situacao_familiar', 'grau_dependencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o Social',
        order: 3,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o social',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vinculos_familiares', 'situacao_vulnerabilidade', 'necessidade_institucional', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o de SaÃºde',
        order: 4,
        description: 'AvaliaÃ§Ã£o mÃ©dica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['condicoes_saude', 'medicamentos_uso', 'necessidades_cuidados', 'parecer_medico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 5,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'prioridade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'InclusÃ£o em Lista de Espera',
        order: 6,
        description: 'InclusÃ£o na lista',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'SolicitaÃ§Ã£o registrada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== PATRIMÃ”NIO HISTÃ“RICO (workflows faltantes) ==========
  CERTIDAO_BEM_TOMBADO: {
    moduleType: 'CERTIDAO_BEM_TOMBADO',
    name: 'Workflow - CertidÃ£o de Bem Tombado',
    description: 'Fluxo para emissÃ£o de certidÃ£o de bem tombado',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['identificacao_bem', 'localizacao', 'finalidade_certidao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Consulta ao Registro',
        order: 3,
        description: 'VerificaÃ§Ã£o no registro de bens tombados',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['bem_tombado', 'numero_processo_tombamento', 'data_tombamento', 'restricoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o da CertidÃ£o',
        order: 4,
        description: 'ElaboraÃ§Ã£o do documento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['responsavel_tecnico', 'data_elaboracao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de CertidÃ£o',
        order: 5,
        description: 'EmissÃ£o da certidÃ£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'CertidÃ£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== TECNOLOGIA (workflows faltantes - continuaÃ§Ã£o) ==========
  CERTIFICADO_DIGITAL: {
    moduleType: 'CERTIFICADO_DIGITAL',
    name: 'Workflow - SolicitaÃ§Ã£o de Certificado Digital',
    description: 'Fluxo para solicitaÃ§Ã£o de certificado digital',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_certificado', 'cpf_cnpj', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ValidaÃ§Ã£o Presencial',
        order: 3,
        description: 'ValidaÃ§Ã£o presencial de identidade',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_validacao', 'responsavel_validacao', 'identidade_confirmada', 'biometria_coletada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o do Certificado',
        order: 4,
        description: 'EmissÃ£o do certificado digital',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['numero_serie', 'data_validade', 'tipo_midia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega',
        order: 5,
        description: 'Entrega do certificado',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Certificado entregue',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL (workflows faltantes - continuaÃ§Ã£o) ==========
  CESTA_BASICA: {
    moduleType: 'CESTA_BASICA',
    name: 'Workflow - Cesta BÃ¡sica',
    description: 'Fluxo para solicitaÃ§Ã£o de cesta bÃ¡sica',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'motivo_solicitacao', 'grau_urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o Social',
        order: 3,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['situacao_vulnerabilidade', 'necessidade_imediata', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o e disponibilizaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['quantidade_cestas', 'local_retirada', 'data_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o ao beneficiÃ¡rio',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Cesta disponibilizada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== TRÃ‚NSITO (workflows faltantes) ==========
  CNH_SOCIAL: {
    moduleType: 'CNH_SOCIAL',
    name: 'Workflow - CNH Social',
    description: 'Fluxo para inscriÃ§Ã£o em programa de CNH social',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'renda_familiar', 'categoria_pretendida'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de ResidÃªncia', 'Comprovante de Renda Familiar'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'atende_criterios', 'pontuacao', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Entrevista',
        order: 4,
        description: 'Entrevista com candidato',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_entrevista', 'responsavel_entrevista', 'motivacao', 'perfil_adequado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o e inclusÃ£o no programa',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'auto_escola_conveniada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 6,
        description: 'NotificaÃ§Ã£o ao beneficiÃ¡rio',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== AGRICULTURA (workflows faltantes - continuaÃ§Ã£o) ==========
  COMPRA_DIRETA_PRODUTOR: {
    moduleType: 'COMPRA_DIRETA_PRODUTOR',
    name: 'Workflow - Compra Direta do Produtor',
    description: 'Fluxo para participaÃ§Ã£o em programa de compra direta',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['produtor', 'produtos_ofertados', 'quantidade_disponivel', 'periodicidade_entrega'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria na Propriedade',
        order: 3,
        description: 'Vistoria tÃ©cnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'producao_verificada', 'qualidade_produtos', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Viabilidade',
        order: 4,
        description: 'AnÃ¡lise de capacidade de fornecimento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['capacidade_fornecimento', 'regularidade', 'produtos_aprovados', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o e habilitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'limite_fornecimento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'FormalizaÃ§Ã£o',
        order: 6,
        description: 'FormalizaÃ§Ã£o do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Produtor habilitado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== PLANEJAMENTO URBANO (workflows faltantes - continuaÃ§Ã£o) ==========
  CONCESSAO_USO_ESPECIAL: {
    moduleType: 'CONCESSAO_USO_ESPECIAL',
    name: 'Workflow - ConcessÃ£o de Uso Especial',
    description: 'Fluxo para concessÃ£o de uso especial de bem pÃºblico',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['identificacao_bem', 'localizacao', 'area_solicitada', 'finalidade_uso', 'tempo_ocupacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o Dominial',
        order: 3,
        description: 'VerificaÃ§Ã£o da titularidade do bem',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['bem_publico', 'titularidade', 'restricoes_uso'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'situacao_encontrada', 'tempo_ocupacao_constatado', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise JurÃ­dica',
        order: 5,
        description: 'AnÃ¡lise jurÃ­dica do pedido',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos_legais', 'finalidade_social', 'parecer_juridico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Parecer TÃ©cnico',
        order: 6,
        description: 'Parecer tÃ©cnico consolidado',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['viabilidade', 'area_concedida', 'prazo_concessao', 'condicoes', 'parecer_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 7,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o do Termo',
        order: 8,
        description: 'EmissÃ£o do termo de concessÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 9,
        description: 'ConcessÃ£o formalizada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== PROTOCOLO GERAL (workflows faltantes) ==========
  COPIA_PROCESSOS: {
    moduleType: 'COPIA_PROCESSOS',
    name: 'Workflow - CÃ³pia de Processos',
    description: 'Fluxo para solicitaÃ§Ã£o de cÃ³pia de processos',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['numero_processo', 'tipo_copia', 'quantidade_paginas'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'LocalizaÃ§Ã£o do Processo',
        order: 2,
        description: 'LocalizaÃ§Ã£o do processo',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['processo_localizado', 'localizacao_atual', 'responsavel_localizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Acesso',
        order: 3,
        description: 'VerificaÃ§Ã£o de permissÃ£o de acesso',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['possui_acesso', 'vinculo_processo', 'observacoes'],
        requiredDocumentTypes: ['RG e CPF'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ReproduÃ§Ã£o',
        order: 4,
        description: 'ReproduÃ§Ã£o das cÃ³pias',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['paginas_copiadas', 'valor_cobrar', 'responsavel_reproducao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega',
        order: 5,
        description: 'DisponibilizaÃ§Ã£o das cÃ³pias',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'CÃ³pias entregues',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== TURISMO (workflows faltantes - continuaÃ§Ã£o) ==========
  CREDENCIAMENTO_AGENCIA_TURISMO: {
    moduleType: 'CREDENCIAMENTO_AGENCIA_TURISMO',
    name: 'Workflow - Credenciamento de AgÃªncia de Turismo',
    description: 'Fluxo para credenciamento de agÃªncia de turismo',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do credenciamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['razao_social', 'cnpj', 'cadastur', 'servicos_oferecidos'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'Cadastur', 'AlvarÃ¡ de Funcionamento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria nas instalaÃ§Ãµes',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'equipe_qualificada', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do credenciamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 5,
        description: 'EmissÃ£o do certificado',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Credenciamento concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CREDENCIAMENTO_INSTRUTOR: {
    moduleType: 'CREDENCIAMENTO_INSTRUTOR',
    name: 'Workflow - Credenciamento de Instrutor',
    description: 'Fluxo para credenciamento de instrutor',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do credenciamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'area_atuacao', 'experiencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'CurrÃ­culo', 'Certificados'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de QualificaÃ§Ã£o',
        order: 3,
        description: 'AnÃ¡lise da qualificaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['formacao_adequada', 'experiencia_comprovada', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Entrevista/AvaliaÃ§Ã£o',
        order: 4,
        description: 'Entrevista tÃ©cnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_entrevista', 'responsavel_entrevista', 'avaliacao', 'aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do credenciamento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'areas_aprovadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Credencial',
        order: 6,
        description: 'EmissÃ£o da credencial',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Credenciamento concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== MOBILIDADE URBANA / TRÃ‚NSITO (workflows faltantes - continuaÃ§Ã£o) ==========
  CREDENCIAMENTO_MOTOTAXI: {
    moduleType: 'CREDENCIAMENTO_MOTOTAXI',
    name: 'Workflow - Credenciamento de MototÃ¡xi',
    description: 'Fluxo para credenciamento de mototaxista',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do credenciamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'placa_moto', 'experiencia_conducao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH Categoria A (mÃ­nimo)', 'CertidÃ£o de Antecedentes Criminais'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Curso de CapacitaÃ§Ã£o',
        order: 3,
        description: 'ParticipaÃ§Ã£o em curso obrigatÃ³rio',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_curso', 'carga_horaria', 'aprovado_curso'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do VeÃ­culo',
        order: 4,
        description: 'Vistoria tÃ©cnica da motocicleta',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_veiculo', 'equipamentos_seguranca', 'aprovado_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do credenciamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_credencial', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Credencial',
        order: 6,
        description: 'EmissÃ£o da credencial',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Credenciamento concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CREDENCIAMENTO_PROFESSOR_ARTE: {
    moduleType: 'CREDENCIAMENTO_PROFESSOR_ARTE',
    name: 'Workflow - Credenciamento de Professor de Arte',
    description: 'Fluxo para credenciamento de professor de arte',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do credenciamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'area_artistica', 'modalidade', 'experiencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de QualificaÃ§Ã£o',
        order: 3,
        description: 'AnÃ¡lise da qualificaÃ§Ã£o artÃ­stica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['formacao_adequada', 'experiencia_comprovada', 'qualidade_trabalho', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o PrÃ¡tica',
        order: 4,
        description: 'AvaliaÃ§Ã£o prÃ¡tica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_avaliacao', 'responsavel_avaliacao', 'desempenho', 'aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do credenciamento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'modalidades_aprovadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Credencial',
        order: 6,
        description: 'EmissÃ£o da credencial',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Credenciamento concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CREDENCIAMENTO_TAXI: {
    moduleType: 'CREDENCIAMENTO_TAXI',
    name: 'Workflow - Credenciamento de Taxista',
    description: 'Fluxo para credenciamento de taxista',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do credenciamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'placa_veiculo', 'experiencia_conducao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH Categoria B (mÃ­nimo)', 'CertidÃ£o de Antecedentes Criminais'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Curso de CapacitaÃ§Ã£o',
        order: 3,
        description: 'ParticipaÃ§Ã£o em curso obrigatÃ³rio',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_curso', 'carga_horaria', 'aprovado_curso'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do VeÃ­culo',
        order: 4,
        description: 'Vistoria tÃ©cnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_veiculo', 'equipamentos_obrigatorios', 'aprovado_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do credenciamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_credencial', 'ponto_atribuido', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Credencial',
        order: 6,
        description: 'EmissÃ£o da credencial e placa',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Credenciamento concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CREDENCIAMENTO_TRANSPORTE_ESCOLAR: {
    moduleType: 'CREDENCIAMENTO_TRANSPORTE_ESCOLAR',
    name: 'Workflow - Credenciamento de Transporte Escolar',
    description: 'Fluxo para credenciamento de prestador de transporte escolar',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do credenciamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_motorista', 'cpf', 'placa_veiculo', 'capacidade', 'rotas_interesse'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH Categoria D', 'CRLV', 'Seguro ObrigatÃ³rio', 'CertidÃ£o de Antecedentes Criminais', 'Curso de Transporte Escolar'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do VeÃ­culo',
        order: 3,
        description: 'Vistoria tÃ©cnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_veiculo', 'equipamentos_seguranca', 'identificacao_veicular', 'aprovado_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'DefiniÃ§Ã£o de Rotas',
        order: 4,
        description: 'AnÃ¡lise e definiÃ§Ã£o de rotas',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['rotas_atribuidas', 'escolas_atendidas', 'horarios', 'numero_alunos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do credenciamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_credencial', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Credencial',
        order: 6,
        description: 'EmissÃ£o da credencial',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Credenciamento concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CURSOS_QUALIFICACAO: {
    moduleType: 'CURSOS_QUALIFICACAO',
    name: 'Workflow - InscriÃ§Ã£o em Cursos de QualificaÃ§Ã£o',
    description: 'Fluxo para inscriÃ§Ã£o em cursos de qualificaÃ§Ã£o profissional',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'curso_interesse', 'escolaridade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Escolaridade', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de PrÃ©-requisitos',
        order: 3,
        description: 'VerificaÃ§Ã£o de requisitos do curso',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos', 'disponibilidade_horarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Vagas',
        order: 4,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma_atribuida', 'data_inicio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o de MatrÃ­cula',
        order: 5,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  CURSO_INCLUSAO_DIGITAL: {
    moduleType: 'CURSO_INCLUSAO_DIGITAL',
    name: 'Workflow - InscriÃ§Ã£o em Curso de InclusÃ£o Digital',
    description: 'Fluxo para inscriÃ§Ã£o em cursos de inclusÃ£o digital',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'idade', 'nivel_conhecimento'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'prioridade', 'disponibilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AlocaÃ§Ã£o de Turma',
        order: 4,
        description: 'DefiniÃ§Ã£o de turma',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['turma_atribuida', 'local', 'horario', 'data_inicio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 5,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== AGRICULTURA (workflows faltantes - continuaÃ§Ã£o) ==========
  DAP_DIGITAL: {
    moduleType: 'DAP_DIGITAL',
    name: 'Workflow - DAP Digital',
    description: 'Fluxo para emissÃ£o de DeclaraÃ§Ã£o de AptidÃ£o ao Pronaf Digital',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['produtor', 'cpf', 'propriedade', 'tipo_producao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Entrevista/Levantamento',
        order: 3,
        description: 'Levantamento de dados produtivos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_total', 'atividades_desenvolvidas', 'renda_bruta_anual', 'mao_obra'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Enquadramento',
        order: 4,
        description: 'VerificaÃ§Ã£o de enquadramento ao Pronaf',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['enquadrado_pronaf', 'grupo_pronaf', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o da DAP',
        order: 5,
        description: 'EmissÃ£o da declaraÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'DAP emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== PROTOCOLO/DIVERSOS (workflows faltantes) ==========
  DECLARACOES: {
    moduleType: 'DECLARACOES',
    name: 'Workflow - EmissÃ£o de DeclaraÃ§Ãµes',
    description: 'Fluxo para emissÃ£o de declaraÃ§Ãµes diversas',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_declaracao', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Dados',
        order: 3,
        description: 'VerificaÃ§Ã£o das informaÃ§Ãµes',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['informacoes_verificadas', 'dados_corretos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o da DeclaraÃ§Ã£o',
        order: 4,
        description: 'EmissÃ£o do documento',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'DeclaraÃ§Ã£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  DEFESA_AUTUACAO: {
    moduleType: 'DEFESA_AUTUACAO',
    name: 'Workflow - Defesa de AutuaÃ§Ã£o',
    description: 'Fluxo para apresentaÃ§Ã£o de defesa contra autuaÃ§Ã£o',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da defesa',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['numero_auto', 'tipo_infracao', 'data_autuacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Preliminar',
        order: 2,
        description: 'VerificaÃ§Ã£o de prazo e documentaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH', 'CRLV', 'NotificaÃ§Ã£o de AutuaÃ§Ã£o', 'Comprovantes (se houver)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise dos argumentos apresentados',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['argumentos_procedentes', 'verificacao_infracao', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'DecisÃ£o Administrativa',
        order: 4,
        description: 'DecisÃ£o sobre a defesa',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['decisao', 'fundamentacao', 'gestor_decisor', 'data_decisao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o da decisÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Processo concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  DISTRIBUICAO_MUDAS: {
    moduleType: 'DISTRIBUICAO_MUDAS',
    name: 'Workflow - DistribuiÃ§Ã£o de Mudas',
    description: 'Fluxo para solicitaÃ§Ã£o de mudas',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['solicitante', 'especies_solicitadas', 'quantidade', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Disponibilidade',
        order: 2,
        description: 'VerificaÃ§Ã£o de estoque',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['especies_disponiveis', 'quantidade_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise da adequaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['finalidade_adequada', 'local_plantio', 'parecer_tecnico'],
        requiredDocumentTypes: ['Comprovante de Propriedade ou Posse'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da distribuiÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['especies_aprovadas', 'quantidade_aprovada', 'data_retirada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o ao solicitante',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Mudas disponibilizadas',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  DISTRIBUICAO_SEMENTES: {
    moduleType: 'DISTRIBUICAO_SEMENTES',
    name: 'Workflow - DistribuiÃ§Ã£o de Sementes',
    description: 'Fluxo para solicitaÃ§Ã£o de sementes',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['produtor', 'sementes_solicitadas', 'quantidade', 'area_plantio'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Disponibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de estoque',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['sementes_disponiveis', 'quantidade_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise da adequaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['adequacao_regiao', 'epoca_plantio', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da distribuiÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['sementes_aprovadas', 'quantidade_aprovada', 'data_retirada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 6,
        description: 'NotificaÃ§Ã£o ao produtor',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Sementes disponibilizadas',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ESPORTES (workflows faltantes - continuaÃ§Ã£o) ==========
  EMPRESTIMO_MATERIAL_ESPORTIVO: {
    moduleType: 'EMPRESTIMO_MATERIAL_ESPORTIVO',
    name: 'Workflow - EmprÃ©stimo de Material Esportivo',
    description: 'Fluxo para solicitaÃ§Ã£o de emprÃ©stimo de material esportivo',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['solicitante', 'materiais_solicitados', 'quantidade', 'finalidade', 'data_evento', 'data_devolucao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Disponibilidade',
        order: 2,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['materiais_disponiveis', 'conflito_agenda'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise do Pedido',
        order: 3,
        description: 'AnÃ¡lise da finalidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['finalidade_adequada', 'responsavel_evento', 'parecer_tecnico'],
        requiredDocumentTypes: ['CPF'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do emprÃ©stimo',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes_emprestimo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'FormalizaÃ§Ã£o',
        order: 5,
        description: 'Assinatura de termo',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'EmprÃ©stimo autorizado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== MOBILIDADE/TRÃ‚NSITO (workflows faltantes - continuaÃ§Ã£o) ==========
  FAIXA_CARGA_DESCARGA: {
    moduleType: 'FAIXA_CARGA_DESCARGA',
    name: 'Workflow - Faixa de Carga e Descarga',
    description: 'Fluxo para solicitaÃ§Ã£o de faixa de carga e descarga',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['estabelecimento', 'endereco', 'atividade', 'horario_funcionamento', 'metragem_solicitada'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['AlvarÃ¡ de Funcionamento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'viabilidade_tecnica', 'metragem_aprovada', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de TrÃ¢nsito',
        order: 4,
        description: 'AnÃ¡lise de impacto no trÃ¢nsito',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['impacto_transito', 'restricoes_horario', 'parecer_transito'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 6,
        description: 'EmissÃ£o do documento',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'AutorizaÃ§Ã£o emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL (workflows faltantes - continuaÃ§Ã£o) ==========
  GERACAO_RENDA: {
    moduleType: 'GERACAO_RENDA',
    name: 'Workflow - Programa de GeraÃ§Ã£o de Renda',
    description: 'Fluxo para inscriÃ§Ã£o em programa de geraÃ§Ã£o de renda',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'renda_familiar', 'atividade_interesse', 'experiencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda (se houver)', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'potencial_empreendedor', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Entrevista',
        order: 4,
        description: 'Entrevista com candidato',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_entrevista', 'responsavel_entrevista', 'perfil_adequado', 'atividade_recomendada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o e inclusÃ£o no programa',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'modalidade_programa'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 6,
        description: 'NotificaÃ§Ã£o ao beneficiÃ¡rio',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== PATRIMÃ”NIO (workflows faltantes) ==========
  GUARDA_PATRIMONIAL: {
    moduleType: 'GUARDA_PATRIMONIAL',
    name: 'Workflow - Guarda Patrimonial',
    description: 'Fluxo para solicitaÃ§Ã£o de guarda de bem patrimonial',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_bem', 'descricao', 'finalidade_guarda', 'prazo_estimado'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise do Bem',
        order: 2,
        description: 'AvaliaÃ§Ã£o do bem',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['condicoes_bem', 'valor_estimado', 'necessidades_conservacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Viabilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de espaÃ§o disponÃ­vel',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['espaco_disponivel', 'local_guarda', 'condicoes_armazenamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da guarda',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'prazo_guarda', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'FormalizaÃ§Ã£o',
        order: 5,
        description: 'FormalizaÃ§Ã£o do termo',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Guarda autorizada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== TURISMO (workflows faltantes - continuaÃ§Ã£o) ==========
  INSCRICAO_CIRCUITO_TURISTICO: {
    moduleType: 'INSCRICAO_CIRCUITO_TURISTICO',
    name: 'Workflow - InscriÃ§Ã£o em Circuito TurÃ­stico',
    description: 'Fluxo para inscriÃ§Ã£o de empreendimento em circuito turÃ­stico',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['empreendimento', 'tipo_atracao', 'circuito_interesse', 'infraestrutura_disponivel'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ ou CPF', 'Cadastur (se aplicÃ¡vel)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria no empreendimento',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'acessibilidade', 'qualidade_servico', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 4,
        description: 'AnÃ¡lise de adequaÃ§Ã£o ao circuito',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['adequacao_circuito', 'potencial_turistico', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'circuito_atribuido'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 6,
        description: 'EmissÃ£o do certificado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_CONCURSO: {
    moduleType: 'INSCRICAO_CONCURSO',
    name: 'Workflow - InscriÃ§Ã£o em Concurso PÃºblico',
    description: 'Fluxo para inscriÃ§Ã£o em concurso pÃºblico',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'cargo_pretendido', 'escolaridade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de Escolaridade'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Requisitos',
        order: 3,
        description: 'VerificaÃ§Ã£o de requisitos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos', 'observacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'HomologaÃ§Ã£o',
        order: 4,
        description: 'HomologaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inscricao_homologada', 'numero_inscricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 5,
        description: 'EmissÃ£o do comprovante',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_CORRIDA_RUA: {
    moduleType: 'INSCRICAO_CORRIDA_RUA',
    name: 'Workflow - InscriÃ§Ã£o em Corrida de Rua',
    description: 'Fluxo para inscriÃ§Ã£o em corridas de rua',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'categoria', 'percurso', 'tamanho_camiseta'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado MÃ©dico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Vagas',
        order: 3,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'numero_peito'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inscricao_confirmada', 'local_retirada_kit'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Comprovante',
        order: 5,
        description: 'EmissÃ£o do comprovante',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_CURSO_FORMACAO: {
    moduleType: 'INSCRICAO_CURSO_FORMACAO',
    name: 'Workflow - InscriÃ§Ã£o em Curso de FormaÃ§Ã£o',
    description: 'Fluxo para inscriÃ§Ã£o em cursos de formaÃ§Ã£o',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'curso_interesse', 'escolaridade', 'experiencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Escolaridade'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de PrÃ©-requisitos',
        order: 3,
        description: 'VerificaÃ§Ã£o de requisitos',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos', 'disponibilidade_horarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Vagas',
        order: 4,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma_atribuida', 'data_inicio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o de MatrÃ­cula',
        order: 5,
        description: 'ConfirmaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  INSCRICAO_INCUBADORA: {
    moduleType: 'INSCRICAO_INCUBADORA',
    name: 'Workflow - InscriÃ§Ã£o em Incubadora de Empresas',
    description: 'Fluxo para inscriÃ§Ã£o em incubadora de empresas',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['empresa', 'cnpj', 'area_atuacao', 'estagio_desenvolvimento', 'modelo_negocio'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ (se jÃ¡ constituÃ­da)', 'Pitch Deck (ApresentaÃ§Ã£o)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise do potencial do negÃ³cio',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inovacao', 'viabilidade', 'potencial_crescimento', 'equipe_adequada', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ApresentaÃ§Ã£o/Pitch',
        order: 4,
        description: 'ApresentaÃ§Ã£o do negÃ³cio',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_apresentacao', 'responsavel_avaliacao', 'avaliacao_pitch', 'pontuacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'modalidade_incubacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'FormalizaÃ§Ã£o',
        order: 6,
        description: 'FormalizaÃ§Ã£o do ingresso',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Empresa incubada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== FINANÃ‡AS (workflows faltantes - continuaÃ§Ã£o) ==========
  ISENCAO_IDOSO: {
    moduleType: 'ISENCAO_IDOSO',
    name: 'Workflow - IsenÃ§Ã£o para Idoso',
    description: 'Fluxo para solicitaÃ§Ã£o de isenÃ§Ã£o de taxas para idoso',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'idade', 'tipo_isencao_solicitada'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['idade_minima', 'renda_compativel', 'atende_criterios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da isenÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'tipo_isencao_concedida', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 5,
        description: 'EmissÃ£o do certificado',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'IsenÃ§Ã£o concedida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  ISENCAO_IPTU: {
    moduleType: 'ISENCAO_IPTU',
    name: 'Workflow - IsenÃ§Ã£o de IPTU',
    description: 'Fluxo para solicitaÃ§Ã£o de isenÃ§Ã£o de IPTU',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['inscricao_imobiliaria', 'endereco_imovel', 'motivo_isencao', 'valor_venal'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de Renda'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria (se necessÃ¡rio)',
        order: 3,
        description: 'Vistoria no imÃ³vel',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['necessita_vistoria', 'data_vistoria', 'responsavel_vistoria', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: true
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 4,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_isencao', 'percentual_isencao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da isenÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'LanÃ§amento no Sistema',
        order: 6,
        description: 'LanÃ§amento da isenÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['responsavel_lancamento', 'data_lancamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Certificado',
        order: 7,
        description: 'EmissÃ£o do certificado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'IsenÃ§Ã£o concedida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  ISENCAO_TRANSPORTE: {
    moduleType: 'ISENCAO_TRANSPORTE',
    name: 'Workflow - IsenÃ§Ã£o de Transporte',
    description: 'Fluxo para solicitaÃ§Ã£o de isenÃ§Ã£o/gratuidade no transporte pÃºblico',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'motivo_isencao', 'idade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_beneficio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da isenÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ProduÃ§Ã£o do CartÃ£o',
        order: 5,
        description: 'ConfecÃ§Ã£o do cartÃ£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cartao', 'data_producao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega',
        order: 6,
        description: 'Entrega do cartÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'IsenÃ§Ã£o concedida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== MEIO AMBIENTE (workflows faltantes - continuaÃ§Ã£o) ==========
  LICENCA_ATIVIDADE_POLUIDORA: {
    moduleType: 'LICENCA_ATIVIDADE_POLUIDORA',
    name: 'Workflow - LicenÃ§a para Atividade Poluidora',
    description: 'Fluxo para licenciamento de atividades potencialmente poluidoras',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['empresa', 'atividade', 'localizacao', 'porte_empreendimento', 'potencial_poluidor'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Projeto TÃ©cnico', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise do potencial poluidor',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_poluicao', 'medidas_controle', 'impacto_ambiental', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_local', 'sistemas_controle', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Parecer Consolidado',
        order: 5,
        description: 'ConsolidaÃ§Ã£o de pareceres',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'viabilidade_ambiental', 'condicoes_licenca'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de LicenÃ§a',
        order: 7,
        description: 'EmissÃ£o da licenÃ§a',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'LicenÃ§a emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  LICENCA_ATIVIDADE_TURISTICA: {
    moduleType: 'LICENCA_ATIVIDADE_TURISTICA',
    name: 'Workflow - LicenÃ§a para Atividade TurÃ­stica',
    description: 'Fluxo para licenciamento de atividades turÃ­sticas',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['empreendimento', 'tipo_atividade', 'localizacao', 'capacidade_atendimento'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF ou CNPJ'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise da atividade',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['adequacao_atividade', 'seguranca', 'impacto_turismo', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'seguranca_verificada', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da licenÃ§a',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de LicenÃ§a',
        order: 6,
        description: 'EmissÃ£o da licenÃ§a',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'LicenÃ§a emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  LICENCA_PERFURACAO_POCO: {
    moduleType: 'LICENCA_PERFURACAO_POCO',
    name: 'Workflow - LicenÃ§a para PerfuraÃ§Ã£o de PoÃ§o',
    description: 'Fluxo para licenciamento de perfuraÃ§Ã£o de poÃ§os artesianos',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['localizacao', 'profundidade_estimada', 'vazao_pretendida', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise HidrogeolÃ³gica',
        order: 3,
        description: 'AnÃ¡lise hidrogeolÃ³gica',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['aquifero', 'viabilidade_perfuracao', 'vazao_estimada', 'parecer_hidrogeologo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do Local',
        order: 4,
        description: 'Vistoria tÃ©cnica',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'local_adequado', 'distancias_seguranca', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Ambiental',
        order: 5,
        description: 'AnÃ¡lise de impacto ambiental',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['impacto_ambiental', 'medidas_mitigadoras', 'parecer_ambiental'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o da licenÃ§a',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de LicenÃ§a',
        order: 7,
        description: 'EmissÃ£o da licenÃ§a',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'LicenÃ§a emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== CULTURA (workflows faltantes - continuaÃ§Ã£o) ==========
  LOCACAO_EQUIPAMENTO_CULTURAL: {
    moduleType: 'LOCACAO_EQUIPAMENTO_CULTURAL',
    name: 'Workflow - LocaÃ§Ã£o de Equipamento Cultural',
    description: 'Fluxo para locaÃ§Ã£o de equipamentos culturais',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['solicitante', 'equipamento_solicitado', 'finalidade', 'data_evento', 'data_devolucao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Disponibilidade',
        order: 2,
        description: 'VerificaÃ§Ã£o de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['equipamento_disponivel', 'conflito_agenda'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise do Pedido',
        order: 3,
        description: 'AnÃ¡lise da finalidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['finalidade_adequada', 'responsavel_evento', 'parecer_tecnico'],
        requiredDocumentTypes: ['Projeto do Evento', 'CPF'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da locaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'valor_locacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'FormalizaÃ§Ã£o',
        order: 5,
        description: 'Assinatura de termo',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'LocaÃ§Ã£o autorizada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== HABITAÃ‡ÃƒO (workflows faltantes - continuaÃ§Ã£o) ==========
  MATERIAL_CONSTRUCAO: {
    moduleType: 'MATERIAL_CONSTRUCAO',
    name: 'Workflow - Material de ConstruÃ§Ã£o',
    description: 'Fluxo para solicitaÃ§Ã£o de material de construÃ§Ã£o',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'materiais_solicitados', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'prioridade', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita TÃ©cnica',
        order: 4,
        description: 'Vistoria no local',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'viabilidade_obra', 'materiais_necessarios', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 5,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'materiais_aprovados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o e disponibilizaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'data_entrega'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 7,
        description: 'NotificaÃ§Ã£o ao beneficiÃ¡rio',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'Material disponibilizado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== EDUCAÃ‡ÃƒO (workflows faltantes - continuaÃ§Ã£o) ==========
  MATERIAL_ESCOLAR: {
    moduleType: 'MATERIAL_ESCOLAR',
    name: 'Workflow - Material Escolar',
    description: 'Fluxo para solicitaÃ§Ã£o de material escolar',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['aluno', 'escola', 'serie', 'renda_familiar'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de MatrÃ­cula'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'renda_compativel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o e disponibilizaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['kit_aprovado', 'local_retirada', 'data_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o ao responsÃ¡vel',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Material disponibilizado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== POLÃTICAS PARA MULHERES (workflows faltantes) ==========
  MEDIDA_PROTETIVA: {
    moduleType: 'MEDIDA_PROTETIVA',
    name: 'Workflow - Medida Protetiva',
    description: 'Fluxo para solicitaÃ§Ã£o de medida protetiva',
    defaultSLA: 1,
    stages: [
      {
        name: 'RecepÃ§Ã£o Emergencial',
        order: 1,
        description: 'Atendimento imediato',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['vitima', 'situacao_risco', 'grau_urgencia', 'agressor'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AvaliaÃ§Ã£o de Risco',
        order: 2,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o de risco',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nivel_risco', 'violencias_sofridas', 'necessidade_abrigo', 'parecer_equipe'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'OrientaÃ§Ã£o JurÃ­dica',
        order: 3,
        description: 'OrientaÃ§Ã£o sobre medidas protetivas',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['medidas_orientadas', 'procedimentos_judiciais', 'documentos_necessarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Encaminhamento',
        order: 4,
        description: 'Encaminhamentos necessÃ¡rios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['delegacia_mulher', 'defensoria', 'rede_apoio', 'abrigo_temporario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Acompanhamento',
        order: 5,
        description: 'InÃ­cio do acompanhamento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Atendimento registrado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  MELHORIA_HABITACIONAL: {
    moduleType: 'MELHORIA_HABITACIONAL',
    name: 'Workflow - Melhoria Habitacional',
    description: 'Fluxo para solicitaÃ§Ã£o de melhoria habitacional',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'situacao_moradia', 'melhorias_necessarias'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'prioridade', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita TÃ©cnica',
        order: 4,
        description: 'Vistoria no imÃ³vel',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'condicoes_moradia', 'melhorias_identificadas', 'orcamento_estimado', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 5,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'melhorias_aprovadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'valor_aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 7,
        description: 'NotificaÃ§Ã£o ao beneficiÃ¡rio',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'Melhoria aprovada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  MERENDA_ESPECIAL: {
    moduleType: 'MERENDA_ESPECIAL',
    name: 'Workflow - Merenda Especial',
    description: 'Fluxo para solicitaÃ§Ã£o de merenda especial',
    defaultSLA: 7,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['aluno', 'escola', 'tipo_restricao', 'dieta_necessaria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de MatrÃ­cula'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Nutricional',
        order: 3,
        description: 'AnÃ¡lise do nutricionista',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['cardapio_adequado', 'substituicoes_necessarias', 'parecer_nutricionista'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da merenda especial',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dieta_aprovada', 'data_inicio', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ComunicaÃ§Ã£o Ã  Escola',
        order: 5,
        description: 'ComunicaÃ§Ã£o Ã  unidade escolar',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Merenda especial autorizada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== FINANÃ‡AS (workflows faltantes - continuaÃ§Ã£o) ==========
  PAGAMENTO_ITBI: {
    moduleType: 'PAGAMENTO_ITBI',
    name: 'Workflow - Pagamento de ITBI',
    description: 'Fluxo para pagamento de Imposto de TransmissÃ£o de Bens ImÃ³veis',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_transacao', 'inscricao_imobiliaria', 'valor_transacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'CÃ¡lculo do Imposto',
        order: 3,
        description: 'CÃ¡lculo do ITBI',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['base_calculo', 'aliquota', 'valor_itbi', 'deducoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Guia',
        order: 4,
        description: 'EmissÃ£o da guia de pagamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['numero_guia', 'data_vencimento', 'valor_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'DisponibilizaÃ§Ã£o',
        order: 5,
        description: 'DisponibilizaÃ§Ã£o da guia',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Guia emitida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  PARCELAMENTO_DEBITOS: {
    moduleType: 'PARCELAMENTO_DEBITOS',
    name: 'Workflow - Parcelamento de DÃ©bitos',
    description: 'Fluxo para parcelamento de dÃ©bitos municipais',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['contribuinte', 'tipo_debito', 'valor_total', 'numero_parcelas_solicitadas'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de CrÃ©dito',
        order: 3,
        description: 'AnÃ¡lise da capacidade de pagamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['capacidade_pagamento', 'numero_parcelas_aprovadas', 'valor_parcela', 'juros_multa'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do parcelamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'FormalizaÃ§Ã£o',
        order: 5,
        description: 'FormalizaÃ§Ã£o do parcelamento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_parcelamento', 'data_vencimento_primeira_parcela'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de CarnÃª',
        order: 6,
        description: 'EmissÃ£o das guias',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Parcelamento efetivado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== AGRICULTURA (workflows faltantes - continuaÃ§Ã£o) ==========
  PARTICIPACAO_FEIRAS: {
    moduleType: 'PARTICIPACAO_FEIRAS',
    name: 'Workflow - ParticipaÃ§Ã£o em Feiras',
    description: 'Fluxo para inscriÃ§Ã£o em feiras agropecuÃ¡rias',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['produtor', 'feira_interesse', 'produtos_comercializar', 'espaco_necessario'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'AlvarÃ¡ de Funcionamento', 'CatÃ¡logo de Produtos/ServiÃ§os (se houver)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de AdequaÃ§Ã£o',
        order: 3,
        description: 'AnÃ¡lise dos produtos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['produtos_adequados', 'qualidade_produtos', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Sorteio/AlocaÃ§Ã£o',
        order: 4,
        description: 'AlocaÃ§Ã£o de espaÃ§o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['espaco_atribuido', 'numero_barraca', 'localizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 5,
        description: 'ConfirmaÃ§Ã£o da participaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== MOBILIDADE/TRANSPORTE (workflows faltantes - continuaÃ§Ã£o) ==========
  PASSE_LIVRE_INTERESTADUAL: {
    moduleType: 'PASSE_LIVRE_INTERESTADUAL',
    name: 'Workflow - Passe Livre Interestadual',
    description: 'Fluxo para solicitaÃ§Ã£o de passe livre interestadual',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'tipo_deficiencia', 'renda_familiar'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Laudo MÃ©dico (modelo especÃ­fico)', 'Comprovante de ResidÃªncia', 'Foto 3x4 recente'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise MÃ©dica',
        order: 3,
        description: 'AvaliaÃ§Ã£o do laudo mÃ©dico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_valido', 'deficiencia_comprovada', 'grau_deficiencia', 'parecer_medico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 4,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'atende_criterios_renda'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do passe',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o',
        order: 6,
        description: 'Envio para emissÃ£o',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'DocumentaÃ§Ã£o enviada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL (workflows faltantes - continuaÃ§Ã£o) ==========
  PERICIA_PSICOSSOCIAL: {
    moduleType: 'PERICIA_PSICOSSOCIAL',
    name: 'Workflow - PerÃ­cia Psicossocial',
    description: 'Fluxo para solicitaÃ§Ã£o de perÃ­cia psicossocial',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['solicitante', 'motivo_pericia', 'grau_urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Preliminar',
        order: 2,
        description: 'AnÃ¡lise da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['necessidade_pericia', 'tipo_avaliacao'],
        requiredDocumentTypes: ['RG', 'CPF', 'Processo Judicial', 'Encaminhamento do Juizado'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'Agendamento da perÃ­cia',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_pericia', 'horario', 'local', 'profissionais_designados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'RealizaÃ§Ã£o',
        order: 4,
        description: 'RealizaÃ§Ã£o da perÃ­cia',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_realizada', 'profissionais_presentes', 'avaliacao_realizada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o de Laudo',
        order: 5,
        description: 'ElaboraÃ§Ã£o do laudo',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['laudo_psicologico', 'parecer_social', 'conclusoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Laudo',
        order: 6,
        description: 'EmissÃ£o do laudo',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Laudo emitido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== AGRICULTURA (workflows faltantes - continuaÃ§Ã£o) ==========
  PROGRAMA_HORTAS_COMUNITARIAS: {
    moduleType: 'PROGRAMA_HORTAS_COMUNITARIAS',
    name: 'Workflow - Programa de Hortas ComunitÃ¡rias',
    description: 'Fluxo para inscriÃ§Ã£o em programa de hortas comunitÃ¡rias',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'renda_familiar', 'experiencia_agricultura'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'prioridade', 'horta_proxima'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Entrevista',
        order: 4,
        description: 'Entrevista com candidato',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_entrevista', 'responsavel_entrevista', 'perfil_adequado', 'disponibilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AlocaÃ§Ã£o de Lote',
        order: 5,
        description: 'DefiniÃ§Ã£o de lote',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['horta_atribuida', 'numero_lote', 'area_lote'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'CapacitaÃ§Ã£o',
        order: 6,
        description: 'CapacitaÃ§Ã£o inicial',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_capacitacao', 'temas_abordados', 'presenca_confirmada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'FormalizaÃ§Ã£o',
        order: 7,
        description: 'Assinatura de termo',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== ASSISTÃŠNCIA SOCIAL (workflows faltantes - continuaÃ§Ã£o) ==========
  PROGRAMA_PRIMEIRA_INFANCIA: {
    moduleType: 'PROGRAMA_PRIMEIRA_INFANCIA',
    name: 'Workflow - Programa Primeira InfÃ¢ncia',
    description: 'Fluxo para inscriÃ§Ã£o em programa de primeira infÃ¢ncia',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['crianca', 'idade_crianca', 'responsavel', 'composicao_familiar', 'renda_familiar'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'prioridade', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar',
        order: 4,
        description: 'Visita tÃ©cnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'situacao_familia', 'necessidades_identificadas', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 5,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'acoes_recomendadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'InclusÃ£o no Programa',
        order: 6,
        description: 'InclusÃ£o e orientaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atividades_oferecidas', 'cronograma', 'responsavel_acompanhamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 7,
        description: 'NotificaÃ§Ã£o Ã  famÃ­lia',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'FamÃ­lia incluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== SAÃšDE (workflows faltantes - continuaÃ§Ã£o) ==========
  PROGRAMA_SAUDE_FAMILIA: {
    moduleType: 'PROGRAMA_SAUDE_FAMILIA',
    name: 'Workflow - Programa SaÃºde da FamÃ­lia',
    description: 'Fluxo para inscriÃ§Ã£o em programa de saÃºde da famÃ­lia',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da famÃ­lia',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'endereco', 'area_cobertura'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CartÃ£o SUS', 'RG ou CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar',
        order: 3,
        description: 'Visita da equipe',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'equipe', 'situacao_saude_familia', 'necessidades_identificadas', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Cadastramento',
        order: 4,
        description: 'InclusÃ£o no programa',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['equipe_responsavel', 'unidade_saude', 'agente_comunitario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'NotificaÃ§Ã£o',
        order: 5,
        description: 'NotificaÃ§Ã£o Ã  famÃ­lia',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'FamÃ­lia cadastrada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  // ========== HABITAÃ‡ÃƒO (workflows faltantes - continuaÃ§Ã£o) ==========
  PROJETO_ARQUITETONICO_SOCIAL: {
    moduleType: 'PROJETO_ARQUITETONICO_SOCIAL',
    name: 'Workflow - Projeto ArquitetÃ´nico Social',
    description: 'Fluxo para solicitaÃ§Ã£o de projeto arquitetÃ´nico social',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'possui_terreno', 'area_construcao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 3,
        description: 'AvaliaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'prioridade', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita ao Terreno',
        order: 4,
        description: 'Vistoria tÃ©cnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'caracteristicas_terreno', 'viabilidade_construcao', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Elegibilidade',
        order: 5,
        description: 'VerificaÃ§Ã£o de critÃ©rios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_projeto_adequado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ElaboraÃ§Ã£o do Projeto',
        order: 6,
        description: 'ElaboraÃ§Ã£o arquitetÃ´nica',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['arquiteto_responsavel', 'data_elaboracao', 'projeto_pronto'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega do Projeto',
        order: 7,
        description: 'Entrega ao beneficiÃ¡rio',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'Projeto entregue',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  PROTOCOLO_GERAL: {
    moduleType: 'PROTOCOLO_GERAL',
    name: 'Workflow - Protocolo Geral',
    description: 'Fluxo para protocolo geral de documentos',
    defaultSLA: 5,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro do protocolo',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_documento', 'destinatario', 'assunto'],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise',
        order: 2,
        description: 'AnÃ¡lise e encaminhamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 3,
        description: 'Protocolo registrado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  REGULARIZACAO_OBRA: {
    moduleType: 'REGULARIZACAO_OBRA',
    name: 'Workflow - RegularizaÃ§Ã£o de Obra',
    description: 'Fluxo para regularizaÃ§Ã£o de obras executadas',
    defaultSLA: 60,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['Projeto As-Built', 'ART', 'MatrÃ­cula do ImÃ³vel', 'Fotos da EdificaÃ§Ã£o'],
        requiredInputFieldIds: ['inscricao_imobiliaria', 'tipo_obra', 'area_construida'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise Documental',
        order: 2,
        description: 'VerificaÃ§Ã£o de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria tÃ©cnica da obra',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_tecnico', 'parecer_vistoria'],
        requiredDocumentTypes: ['Projeto As-Built', 'ART', 'MatrÃ­cula do ImÃ³vel', 'Fotos da EdificaÃ§Ã£o'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise JurÃ­dica',
        order: 4,
        description: 'AnÃ¡lise jurÃ­dica da regularizaÃ§Ã£o',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o Final',
        order: 5,
        description: 'AprovaÃ§Ã£o final da regularizaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de CertidÃ£o',
        order: 6,
        description: 'EmissÃ£o da certidÃ£o de regularizaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Obra regularizada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  REMEMBRAMENTO_LOTE: {
    moduleType: 'REMEMBRAMENTO_LOTE',
    name: 'Workflow - Remembramento de Lote',
    description: 'Fluxo para remembramento de lotes',
    defaultSLA: 60,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['inscricoes_lotes', 'area_total', 'justificativa'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 2,
        description: 'AnÃ¡lise tÃ©cnica do remembramento',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise JurÃ­dica',
        order: 3,
        description: 'AnÃ¡lise jurÃ­dica',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do remembramento',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de CertidÃ£o',
        order: 5,
        description: 'EmissÃ£o da certidÃ£o de remembramento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Remembramento concluÃ­do',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  RENOVACAO_CREDENCIAMENTO: {
    moduleType: 'RENOVACAO_CREDENCIAMENTO',
    name: 'Workflow - RenovaÃ§Ã£o de Credenciamento',
    description: 'Fluxo para renovaÃ§Ã£o de credenciamentos',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da renovaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['CNH Atualizada', 'CRLV Atualizado', 'Vistoria em Dia', 'CertidÃ£o Negativa de Multas'],
        requiredInputFieldIds: ['tipo_credenciamento', 'numero_credenciamento_atual'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'VerificaÃ§Ã£o',
        order: 2,
        description: 'VerificaÃ§Ã£o de regularidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise',
        order: 3,
        description: 'AnÃ¡lise da renovaÃ§Ã£o',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da renovaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Credencial',
        order: 5,
        description: 'EmissÃ£o da nova credencial',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Credenciamento renovado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  REURB: {
    moduleType: 'REURB',
    name: 'Workflow - RegularizaÃ§Ã£o FundiÃ¡ria (REURB)',
    description: 'Fluxo para RegularizaÃ§Ã£o FundiÃ¡ria Urbana',
    defaultSLA: 180,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: ['tipo_reurb', 'area_ocupacao', 'numero_familias'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise Preliminar',
        order: 2,
        description: 'AnÃ¡lise preliminar da Ã¡rea',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Levantamento TopogrÃ¡fico',
        order: 3,
        description: 'Levantamento topogrÃ¡fico da Ã¡rea',
        slaDays: 30,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['levantamento_topografico'],
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de ResidÃªncia', 'DeclaraÃ§Ã£o de Posse', 'Levantamento TopogrÃ¡fico (se houver)'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise JurÃ­dica',
        order: 4,
        description: 'AnÃ¡lise jurÃ­dica da regularizaÃ§Ã£o',
        slaDays: 30,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Projeto de RegularizaÃ§Ã£o',
        order: 5,
        description: 'ElaboraÃ§Ã£o do projeto de regularizaÃ§Ã£o',
        slaDays: 45,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['projeto_regularizacao'],
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de ResidÃªncia', 'DeclaraÃ§Ã£o de Posse', 'Levantamento TopogrÃ¡fico (se houver)'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o da regularizaÃ§Ã£o',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Registro Cartorial',
        order: 7,
        description: 'Encaminhamento para registro',
        slaDays: 30,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'REURB concluÃ­da',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  REVISAO_IPTU: {
    moduleType: 'REVISAO_IPTU',
    name: 'Workflow - RevisÃ£o de IPTU',
    description: 'Fluxo para revisÃ£o de lanÃ§amento de IPTU',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['CarnÃª de IPTU', 'Fotos do ImÃ³vel', 'Laudo de AvaliaÃ§Ã£o (se houver)', 'Escritura do ImÃ³vel'],
        requiredInputFieldIds: ['inscricao_imobiliaria', 'motivo_revisao', 'ano_exercicio'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise Cadastral',
        order: 2,
        description: 'AnÃ¡lise dos dados cadastrais',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria do imÃ³vel (se necessÃ¡rio)',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: true
      },
      {
        name: 'AnÃ¡lise Fiscal',
        order: 4,
        description: 'AnÃ¡lise fiscal da revisÃ£o',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'DecisÃ£o',
        order: 5,
        description: 'DecisÃ£o sobre a revisÃ£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['decisao', 'novo_valor_iptu'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'RevisÃ£o concluÃ­da',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  SEGURO_SAFRA: {
    moduleType: 'SEGURO_SAFRA',
    name: 'Workflow - Seguro Safra',
    description: 'Fluxo para solicitaÃ§Ã£o de Seguro Safra',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['CPF', 'DAP'],
        requiredInputFieldIds: ['area_plantada', 'cultura', 'ano_agricola'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'VerificaÃ§Ã£o DAP',
        order: 2,
        description: 'VerificaÃ§Ã£o da DAP',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 3,
        description: 'Vistoria da Ã¡rea cultivada',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria'],
        requiredDocumentTypes: ['CPF', 'DAP', 'Comprovante de Ãrea Plantada'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise',
        order: 4,
        description: 'AnÃ¡lise da solicitaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do seguro',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Encaminhamento',
        order: 6,
        description: 'Encaminhamento para pagamento',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Seguro safra aprovado',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  SOLICITACAO_ABRIGO: {
    moduleType: 'SOLICITACAO_ABRIGO',
    name: 'Workflow - SolicitaÃ§Ã£o de Abrigo',
    description: 'Fluxo para solicitaÃ§Ã£o de abrigo temporÃ¡rio',
    defaultSLA: 3,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['motivo_solicitacao', 'numero_pessoas', 'situacao_vulnerabilidade'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AvaliaÃ§Ã£o Social',
        order: 2,
        description: 'AvaliaÃ§Ã£o da situaÃ§Ã£o social',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'DefiniÃ§Ã£o de Vaga',
        order: 3,
        description: 'DefiniÃ§Ã£o da vaga no abrigo',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['abrigo_destinado', 'data_entrada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Abrigo concedido',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  SOLICITACAO_FISIOTERAPIA: {
    moduleType: 'SOLICITACAO_FISIOTERAPIA',
    name: 'Workflow - SolicitaÃ§Ã£o de Fisioterapia',
    description: 'Fluxo para solicitaÃ§Ã£o de fisioterapia',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG ou CPF'],
        requiredInputFieldIds: ['tipo_tratamento', 'frequencia_semanal'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise MÃ©dica',
        order: 2,
        description: 'AnÃ¡lise do pedido mÃ©dico',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'Agendamento das sessÃµes',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_inicio', 'horario', 'unidade_saude'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 4,
        description: 'Fisioterapia agendada',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  SOLICITACAO_LOTE_DISTRITO: {
    moduleType: 'SOLICITACAO_LOTE_DISTRITO',
    name: 'Workflow - SolicitaÃ§Ã£o de Lote em Distrito',
    description: 'Fluxo para solicitaÃ§Ã£o de lote em distrito',
    defaultSLA: 60,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['distrito_interesse', 'tamanho_lote', 'finalidade'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 2,
        description: 'AnÃ¡lise socioeconÃ´mica do solicitante',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_socioeconomico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o de Disponibilidade',
        order: 3,
        description: 'VerificaÃ§Ã£o de lotes disponÃ­veis',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise JurÃ­dica',
        order: 4,
        description: 'AnÃ¡lise jurÃ­dica da concessÃ£o',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da concessÃ£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['lote_designado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Termo',
        order: 6,
        description: 'EmissÃ£o do termo de concessÃ£o',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Lote concedido',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  SOLICITACAO_MICROCREDITO: {
    moduleType: 'SOLICITACAO_MICROCREDITO',
    name: 'Workflow - SolicitaÃ§Ã£o de MicrocrÃ©dito',
    description: 'Fluxo para solicitaÃ§Ã£o de microcrÃ©dito',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['valor_solicitado', 'finalidade', 'prazo_pagamento'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise Cadastral',
        order: 2,
        description: 'AnÃ¡lise cadastral do solicitante',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de CrÃ©dito',
        order: 3,
        description: 'AnÃ¡lise de crÃ©dito',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['score_credito', 'parecer_analista'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 4,
        description: 'AnÃ¡lise socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o do microcrÃ©dito',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['valor_aprovado', 'taxa_juros', 'prazo_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ContrataÃ§Ã£o',
        order: 6,
        description: 'Assinatura do contrato',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'MicrocrÃ©dito aprovado',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  TARIFA_SOCIAL_ENERGIA: {
    moduleType: 'TARIFA_SOCIAL_ENERGIA',
    name: 'Workflow - Tarifa Social de Energia',
    description: 'Fluxo para solicitaÃ§Ã£o de tarifa social de energia',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: ['numero_instalacao', 'renda_familiar'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise SocioeconÃ´mica',
        order: 2,
        description: 'AnÃ¡lise da situaÃ§Ã£o socioeconÃ´mica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'VerificaÃ§Ã£o CadÃšnico',
        order: 3,
        description: 'VerificaÃ§Ã£o no Cadastro Ãšnico',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da tarifa social',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Encaminhamento',
        order: 5,
        description: 'Encaminhamento Ã  concessionÃ¡ria',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Tarifa social aprovada',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  TOMBAMENTO_PATRIMONIO: {
    moduleType: 'TOMBAMENTO_PATRIMONIO',
    name: 'Workflow - Tombamento de PatrimÃ´nio',
    description: 'Fluxo para tombamento de patrimÃ´nio histÃ³rico',
    defaultSLA: 90,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG', 'CPF', 'Fotos'],
        requiredInputFieldIds: ['tipo_bem', 'endereco', 'justificativa'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise Preliminar',
        order: 2,
        description: 'AnÃ¡lise preliminar do bem',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Pesquisa HistÃ³rica',
        order: 3,
        description: 'Pesquisa histÃ³rica do bem',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['pesquisa_historica'],
        requiredDocumentTypes: ['CPF', 'RG', 'DocumentaÃ§Ã£o HistÃ³rica', 'Fotos', 'Laudo TÃ©cnico'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 4,
        description: 'Vistoria tÃ©cnica do bem',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_tecnico'],
        requiredDocumentTypes: ['Laudo TÃ©cnico'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Parecer Conselho',
        order: 5,
        description: 'Parecer do conselho de patrimÃ´nio',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_conselho'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 6,
        description: 'AprovaÃ§Ã£o do tombamento',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'PublicaÃ§Ã£o',
        order: 7,
        description: 'PublicaÃ§Ã£o do tombamento',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 8,
        description: 'Tombamento concluÃ­do',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  TRANSFERENCIA_PONTO_TAXI: {
    moduleType: 'TRANSFERENCIA_PONTO_TAXI',
    name: 'Workflow - TransferÃªncia de Ponto de TÃ¡xi',
    description: 'Fluxo para transferÃªncia de ponto de tÃ¡xi',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['Credencial de Taxista', 'CertidÃ£o Negativa de Multas', 'Justificativa'],
        requiredInputFieldIds: ['ponto_atual', 'ponto_destino', 'justificativa'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'VerificaÃ§Ã£o de Regularidade',
        order: 2,
        description: 'VerificaÃ§Ã£o da regularidade do taxista',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Disponibilidade',
        order: 3,
        description: 'AnÃ¡lise da disponibilidade do ponto',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da transferÃªncia',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 5,
        description: 'EmissÃ£o da autorizaÃ§Ã£o de transferÃªncia',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'TransferÃªncia concluÃ­da',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  TRANSPORTE_ESCOLAR_GRATUITO: {
    moduleType: 'TRANSPORTE_ESCOLAR_GRATUITO',
    name: 'Workflow - Transporte Escolar Gratuito',
    description: 'Fluxo para solicitaÃ§Ã£o de transporte escolar gratuito',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG ou CertidÃ£o de Nascimento', 'CPF', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: ['nome_aluno', 'escola', 'serie', 'turno', 'endereco'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'VerificaÃ§Ã£o Escolar',
        order: 2,
        description: 'VerificaÃ§Ã£o da matrÃ­cula escolar',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Rota',
        order: 3,
        description: 'AnÃ¡lise da rota e disponibilidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['rota_designada', 'horario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do transporte',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'Transporte aprovado',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  TREINAMENTO_DEFESA_CIVIL: {
    moduleType: 'TREINAMENTO_DEFESA_CIVIL',
    name: 'Workflow - Treinamento em Defesa Civil',
    description: 'Fluxo para inscriÃ§Ã£o em treinamento de defesa civil',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da inscriÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG ou CPF'],
        requiredInputFieldIds: ['tipo_treinamento', 'disponibilidade'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise de Vagas',
        order: 2,
        description: 'VerificaÃ§Ã£o de vagas disponÃ­veis',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'Agendamento do treinamento',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_treinamento', 'local', 'horario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'ConfirmaÃ§Ã£o',
        order: 4,
        description: 'ConfirmaÃ§Ã£o de participaÃ§Ã£o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'InscriÃ§Ã£o confirmada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  UNIFORME_ESCOLAR: {
    moduleType: 'UNIFORME_ESCOLAR',
    name: 'Workflow - Uniforme Escolar',
    description: 'Fluxo para solicitaÃ§Ã£o de uniforme escolar',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['Comprovante de MatrÃ­cula', 'DeclaraÃ§Ã£o de Baixa Renda (se aplicÃ¡vel)'],
        requiredInputFieldIds: ['nome_aluno', 'escola', 'serie', 'tamanho'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'VerificaÃ§Ã£o Escolar',
        order: 2,
        description: 'VerificaÃ§Ã£o da matrÃ­cula',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'SeparaÃ§Ã£o',
        order: 3,
        description: 'SeparaÃ§Ã£o do uniforme',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Entrega',
        order: 4,
        description: 'Entrega do uniforme',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_entrega'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'Uniforme entregue',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  USO_ESPACO_PUBLICO: {
    moduleType: 'USO_ESPACO_PUBLICO',
    name: 'Workflow - Uso de EspaÃ§o PÃºblico',
    description: 'Fluxo para autorizaÃ§Ã£o de uso de espaÃ§o pÃºblico',
    defaultSLA: 20,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_evento', 'local', 'data_evento', 'horario', 'publico_esperado'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise de Disponibilidade',
        order: 2,
        description: 'VerificaÃ§Ã£o da disponibilidade do espaÃ§o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise TÃ©cnica',
        order: 3,
        description: 'AnÃ¡lise tÃ©cnica do evento',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o do uso do espaÃ§o',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 5,
        description: 'EmissÃ£o da autorizaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'AutorizaÃ§Ã£o concedida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  USO_GINASIO: {
    moduleType: 'USO_GINASIO',
    name: 'Workflow - Uso de GinÃ¡sio',
    description: 'Fluxo para autorizaÃ§Ã£o de uso de ginÃ¡sio esportivo',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG', 'CPF'],
        requiredInputFieldIds: ['data_solicitada', 'horario', 'finalidade', 'numero_pessoas'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise de Disponibilidade',
        order: 2,
        description: 'VerificaÃ§Ã£o da disponibilidade do ginÃ¡sio',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 3,
        description: 'AprovaÃ§Ã£o do uso',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de AutorizaÃ§Ã£o',
        order: 4,
        description: 'EmissÃ£o da autorizaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'AutorizaÃ§Ã£o concedida',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  VAGA_ESPECIAL: {
    moduleType: 'VAGA_ESPECIAL',
    name: 'Workflow - Vaga Especial',
    description: 'Fluxo para solicitaÃ§Ã£o de vaga especial de estacionamento',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['endereco_vaga', 'justificativa', 'placa_veiculo'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise de Viabilidade',
        order: 2,
        description: 'AnÃ¡lise da viabilidade tÃ©cnica',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria do local',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 4,
        description: 'AprovaÃ§Ã£o da vaga',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ImplantaÃ§Ã£o',
        order: 5,
        description: 'ImplantaÃ§Ã£o da sinalizaÃ§Ã£o',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_implantacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Vaga implantada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  VAGA_ESPECIAL_PCD: {
    moduleType: 'VAGA_ESPECIAL_PCD',
    name: 'Workflow - Vaga Especial PCD',
    description: 'Fluxo para solicitaÃ§Ã£o de vaga especial para pessoa com deficiÃªncia',
    defaultSLA: 30,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG', 'CPF', 'CNH (se condutor)', 'Comprovante de ResidÃªncia'],
        requiredInputFieldIds: ['endereco_vaga', 'tipo_deficiencia', 'placa_veiculo'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise de Laudo',
        order: 2,
        description: 'AnÃ¡lise do laudo mÃ©dico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AnÃ¡lise de Viabilidade',
        order: 3,
        description: 'AnÃ¡lise da viabilidade tÃ©cnica',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 4,
        description: 'Vistoria do local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria'],
        requiredDocumentTypes: ['RG', 'CPF', 'CNH (se condutor)', 'Laudo MÃ©dico', 'Documento do VeÃ­culo', 'Comprovante de ResidÃªncia'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'AprovaÃ§Ã£o',
        order: 5,
        description: 'AprovaÃ§Ã£o da vaga PCD',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'ImplantaÃ§Ã£o',
        order: 6,
        description: 'ImplantaÃ§Ã£o da sinalizaÃ§Ã£o PCD',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_implantacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 7,
        description: 'Vaga PCD implantada',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  VISTORIA_AREA_RISCO: {
    moduleType: 'VISTORIA_AREA_RISCO',
    name: 'Workflow - Vistoria de Ãrea de Risco',
    description: 'Fluxo para vistoria de Ã¡rea de risco',
    defaultSLA: 10,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG ou CPF'],
        requiredInputFieldIds: ['endereco', 'tipo_risco', 'descricao_situacao'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'AnÃ¡lise Preliminar',
        order: 2,
        description: 'AnÃ¡lise preliminar da urgÃªncia',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nivel_urgencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Agendamento de Vistoria',
        order: 3,
        description: 'Agendamento da vistoria tÃ©cnica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'equipe_designada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Vistoria TÃ©cnica',
        order: 4,
        description: 'RealizaÃ§Ã£o da vistoria',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria', 'medidas_recomendadas'],
        requiredDocumentTypes: ['Fotos do Local (se possÃ­vel)'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Parecer TÃ©cnico',
        order: 5,
        description: 'ElaboraÃ§Ã£o do parecer tÃ©cnico',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'acoes_necessarias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'ConclusÃ£o',
        order: 6,
        description: 'Vistoria concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  },

  VISTORIA_VEICULO: {
    moduleType: 'VISTORIA_VEICULO',
    name: 'Workflow - Vistoria de VeÃ­culo',
    description: 'Fluxo para vistoria veicular',
    defaultSLA: 15,
    stages: [
      {
        name: 'RecepÃ§Ã£o',
        order: 1,
        description: 'Registro da solicitaÃ§Ã£o',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['CRLV'],
        requiredInputFieldIds: ['placa_veiculo', 'tipo_vistoria', 'finalidade'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'Agendamento',
        order: 2,
        description: 'Agendamento da vistoria',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'horario', 'local'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'RealizaÃ§Ã£o da vistoria',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resultado_vistoria', 'observacoes'],
        requiredDocumentTypes: ['CRLV', 'Comprovante de Pagamento de Taxas'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'EmissÃ£o de Laudo',
        order: 4,
        description: 'EmissÃ£o do laudo de vistoria',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos-gerados', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
      },
      {
        name: 'ConclusÃ£o',
        order: 5,
        description: 'Vistoria concluÃ­da',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'CONCLUSION'
      }
    ]
  }

};

/**
 * ============================================================================
 * GERADOR INTELIGENTE DE METADADOS DE UI
 * ============================================================================
 */
function generateContextualUIMetadata(service: any, stageName: string, stageOrder: number) {
  const serviceName = service.name?.toLowerCase() || '';
  const tabs: string[] = ['resumo'];
  let primaryTab = 'resumo';

  // Primeira etapa: sempre mostrar documentos
  if (stageOrder === 1) {
    tabs.push('documentos');
    primaryTab = 'documentos';
  }

  // ServiÃ§os que precisam de documentos
  if (serviceName.includes('certidÃ£o') || serviceName.includes('declaraÃ§Ã£o') ||
      serviceName.includes('atestado') || serviceName.includes('cadastro') ||
      serviceName.includes('inscriÃ§Ã£o') || serviceName.includes('licenÃ§a') ||
      serviceName.includes('alvarÃ¡') || serviceName.includes('segunda via') ||
      serviceName.includes('registro') || serviceName.includes('matrÃ­cula') ||
      serviceName.includes('vistoria') || serviceName.includes('laudo')) {
    if (!tabs.includes('documentos')) tabs.push('documentos');
  }

  // ServiÃ§os que precisam de dados/formulÃ¡rios
  if (serviceName.includes('cadastro') || serviceName.includes('inscriÃ§Ã£o') ||
      serviceName.includes('matrÃ­cula') || serviceName.includes('agendamento') ||
      serviceName.includes('solicitaÃ§Ã£o') || serviceName.includes('reserva')) {
    if (!tabs.includes('dados')) tabs.push('dados');
    if (stageOrder === 2 && !serviceName.includes('vistoria')) {
      primaryTab = 'dados';
    }
  }

  // ServiÃ§os de vistoria/inspeÃ§Ã£o
  if (serviceName.includes('vistoria') || serviceName.includes('inspeÃ§Ã£o') ||
      serviceName.includes('laudo') || serviceName.includes('aprovaÃ§Ã£o de projeto') ||
      stageName.toLowerCase().includes('vistoria') || stageName.toLowerCase().includes('inspeÃ§Ã£o')) {
    if (!tabs.includes('dados')) tabs.push('dados');
    if (stageOrder >= 2 && stageOrder <= 3) {
      primaryTab = 'dados';
    }
  }

  // Sempre incluir pendÃªncias e comunicaÃ§Ã£o
  tabs.push('pendencias');
  tabs.push('comunicacao');

  return { availableTabs: tabs, primaryTab: primaryTab };
}

/**
 * ============================================================================
 * GERADOR DE WORKFLOW GENÃ‰RICO CONTEXTUAL
 * ============================================================================
 */
function generateGenericWorkflow(service: any): any[] {
  const serviceName = service.name?.toLowerCase() || '';
  const stages: any[] = [];

  stages.push({
    name: 'RecepÃ§Ã£o e AnÃ¡lise Documental',
    order: 1,
    description: 'Recebimento e verificaÃ§Ã£o de documentos',
    slaDays: 2,
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false,
    ...generateContextualUIMetadata(service, 'RecepÃ§Ã£o e AnÃ¡lise Documental', 1)
  });

  stages.push({
    name: 'AnÃ¡lise TÃ©cnica',
    order: 2,
    description: 'AnÃ¡lise tÃ©cnica da solicitaÃ§Ã£o',
    slaDays: 3,
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false,
    ...generateContextualUIMetadata(service, 'AnÃ¡lise TÃ©cnica', 2)
  });

  if (serviceName.includes('vistoria') || serviceName.includes('inspeÃ§Ã£o') ||
      serviceName.includes('aprovaÃ§Ã£o de projeto') || serviceName.includes('licenÃ§a') ||
      serviceName.includes('alvarÃ¡') || serviceName.includes('laudo')) {
    stages.push({
      name: 'Vistoria/InspeÃ§Ã£o',
      order: 3,
      description: 'Vistoria tÃ©cnica in loco',
      slaDays: 5,
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false,
      ...generateContextualUIMetadata(service, 'Vistoria/InspeÃ§Ã£o', 3)
    });
  }

  stages.push({
    name: 'Processamento',
    order: stages.length + 1,
    description: 'Processamento e preparaÃ§Ã£o',
    slaDays: 5,
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false,
    ...generateContextualUIMetadata(service, 'Processamento', stages.length + 1)
  });

  stages.push({
    name: 'AprovaÃ§Ã£o Final',
    order: stages.length + 1,
    description: 'AprovaÃ§Ã£o final do gestor',
    slaDays: 2,
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REJECT'],
    canSkip: false,
    ...generateContextualUIMetadata(service, 'AprovaÃ§Ã£o Final', stages.length + 1)
  });

  stages.push({
    name: 'ConclusÃ£o',
    order: stages.length + 1,
    description: 'EmissÃ£o de documento ou finalizaÃ§Ã£o',
    slaDays: 1,
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false,
    availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
    primaryTab: 'documentos-gerados',
    stageType: 'DOCUMENT_GENERATION'
  });

  return stages;
}

/**
 * ============================================================================
 * WORKFLOW GENÃ‰RICO PARA SERVIÃ‡OS SEM_DADOS
 * ============================================================================
 */
const genericWorkflowStages: Prisma.JsonValue = [
  {
    name: 'Recebimento',
    order: 1,
    description: 'Protocolo recebido e aguardando anÃ¡lise inicial',
    slaDays: 2,

    availableTabs: ['resumo', 'comunicacao'],
    primaryTab: 'resumo',

    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false
  },
  {
    name: 'AnÃ¡lise',
    order: 2,
    description: 'AnÃ¡lise da solicitaÃ§Ã£o',
    slaDays: 3,

    availableTabs: ['resumo', 'pendencias', 'comunicacao'],
    primaryTab: 'resumo',

    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false
  },
  {
    name: 'Processamento',
    order: 3,
    description: 'Processamento da solicitaÃ§Ã£o',
    slaDays: 5,

    availableTabs: ['resumo', 'pendencias', 'comunicacao'],
    primaryTab: 'resumo',

    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false
  },
  {
    name: 'AprovaÃ§Ã£o',
    order: 4,
    description: 'AprovaÃ§Ã£o final',
    slaDays: 2,

    availableTabs: ['resumo', 'comunicacao'],
    primaryTab: 'resumo',

    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REJECT'],
    canSkip: false
  },
  {
    name: 'ConclusÃ£o',
    order: 5,
    description: 'EmissÃ£o de documento ou conclusÃ£o do atendimento',
    slaDays: 1,

    availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
    primaryTab: 'documentos-gerados',

    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false,
    stageType: 'DOCUMENT_GENERATION'
  }
];

/**
 * ============================================================================
 * FUNÃ‡ÃƒO PRINCIPAL DE SEED
 * ============================================================================
 */
function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

const LEGACY_WORKFLOW_TAB_MAP: Record<string, string> = {
  generated: 'documentos-gerados',
  'document-generation': 'documentos-gerados',
  send: 'enviar',
  documents: 'documentos',
  communication: 'comunicacao',
  involved: 'envolvidos',
  location: 'dados',
  photos: 'documentos'
};

function normalizeWorkflowTab(tab: unknown): string | null {
  if (typeof tab !== 'string') return null;
  const trimmed = tab.trim();
  if (!trimmed) return null;
  return LEGACY_WORKFLOW_TAB_MAP[trimmed] || trimmed;
}

function normalizeWorkflowTabs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const tabs: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const normalizedTab = normalizeWorkflowTab(item);
    if (!normalizedTab || seen.has(normalizedTab)) continue;
    seen.add(normalizedTab);
    tabs.push(normalizedTab);
  }

  return tabs;
}

function parseJsonObject(value: unknown): Record<string, any> | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof value === 'object' ? (value as Record<string, any>) : null;
}

function normalizeLookupToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-zA-Z0-9])/g, (_, char) => String(char).toUpperCase());
}

function buildServiceFieldCatalog(service: any): Set<string> {
  const fieldIds = new Set<string>();
  const formSchema = parseJsonObject(service?.formSchema);
  const properties =
    formSchema &&
    typeof formSchema.properties === 'object' &&
    formSchema.properties !== null
      ? (formSchema.properties as Record<string, unknown>)
      : {};

  for (const fieldId of Object.keys(properties)) {
    if (fieldId.trim()) {
      fieldIds.add(fieldId.trim());
    }
  }

  const formFieldsConfig = Array.isArray(service?.formFieldsConfig) ? service.formFieldsConfig : [];
  for (const field of formFieldsConfig) {
    if (!field || typeof field !== 'object') continue;
    const fieldRecord = field as Record<string, any>;
    const rawId = fieldRecord.id ?? fieldRecord.key ?? fieldRecord.name;
    const fieldId = typeof rawId === 'string' ? rawId.trim() : '';
    if (fieldId) {
      fieldIds.add(fieldId);
    }
  }

  return fieldIds;
}

function resolveFieldId(rawFieldId: string, fieldCatalog: Set<string>): string | null {
  const trimmed = rawFieldId.trim();
  if (!trimmed) return null;
  if (fieldCatalog.has(trimmed)) return trimmed;

  const snakeCandidate = snakeToCamel(trimmed);
  if (fieldCatalog.has(snakeCandidate)) return snakeCandidate;

  const normalizedTarget = normalizeLookupToken(trimmed);
  if (!normalizedTarget) return null;

  let match: string | null = null;
  for (const fieldId of fieldCatalog) {
    if (normalizeLookupToken(fieldId) === normalizedTarget) {
      if (match && match !== fieldId) return null;
      match = fieldId;
    }
  }

  return match;
}

function isReceptionStage(stage: Record<string, any> | null | undefined): boolean {
  if (!stage || typeof stage !== 'object') return false;

  const stageType = typeof stage.stageType === 'string' ? stage.stageType.trim() : '';
  if (stageType === 'RECEPTION') return true;

  const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : '';
  return stageName.includes('recep') || stageName.includes('receb');
}

function stageHasValidationRequirements(stage: Record<string, any> | null | undefined): boolean {
  if (!stage || typeof stage !== 'object') return false;

  const requiredDocumentTypes = normalizeStringArray(stage.requiredDocumentTypes ?? []);
  const requiredInputFieldIds = normalizeStringArray(stage.requiredInputFieldIds ?? []);
  const requiredStageOutputs = normalizeStringArray(stage.requiredStageOutputs ?? []);
  const allowedActions = normalizeStringArray(stage.allowedActions ?? []);

  return (
    requiredDocumentTypes.length > 0 ||
    requiredInputFieldIds.length > 0 ||
    requiredStageOutputs.length > 0 ||
    allowedActions.some(action => action === 'REJECT' || action === 'REQUEST_INFO' || action === 'CREATE_PENDING')
  );
}

function shouldTreatAsDocumentGenerationStage(stage: Record<string, any> | null | undefined): boolean {
  if (!stage || typeof stage !== 'object') return false;

  const stageType = typeof stage.stageType === 'string' ? stage.stageType.trim() : '';
  const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : '';
  const primaryTab = normalizeWorkflowTab(stage.primaryTab);
  const availableTabs = normalizeWorkflowTabs(stage.availableTabs ?? []);
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
  ].some(keyword => stageName.includes(keyword));
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
  ].some(keyword => stageName.includes(keyword));

  if (hasGeneratedTab) return true;
  if (stageHasValidationRequirements(stage) || hasAnalysisName) return false;
  if (stageType === 'DOCUMENT_GENERATION') return true;

  return hasGenerationName;
}

function sanitizeStageRequirementsForService(service: any, stages: any[]) {
  const fieldCatalog = buildServiceFieldCatalog(service);
  let unresolvedInputCount = 0;
  let movedOutputCount = 0;

  const sanitizedStages = stages.map((stage) => {
    const stageRecord = stage && typeof stage === 'object' ? (stage as Record<string, any>) : {};
    if (isReceptionStage(stageRecord)) {
      const {
        requiredInputFieldIds,
        requiredStageOutputs,
        requiredDocumentTypes,
        ...stageWithoutRequirements
      } = stageRecord;

      return {
        ...stageWithoutRequirements,
        stageType: stageRecord.stageType || 'RECEPTION',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        requiredStageOutputs: []
      };
    }

    const rawRequiredInputs = normalizeStringArray(stageRecord.requiredInputFieldIds ?? []);
    const existingRequiredOutputs = normalizeStringArray(stageRecord.requiredStageOutputs ?? []);

    const resolvedRequiredInputs: string[] = [];
    const unresolvedRequiredInputs: string[] = [];
    const resolvedSeen = new Set<string>();

    for (const fieldId of rawRequiredInputs) {
      const resolved = resolveFieldId(fieldId, fieldCatalog);
      if (!resolved) {
        unresolvedRequiredInputs.push(fieldId);
        continue;
      }
      if (resolvedSeen.has(resolved)) continue;
      resolvedSeen.add(resolved);
      resolvedRequiredInputs.push(resolved);
    }

    unresolvedInputCount += unresolvedRequiredInputs.length;

    const normalizedRequiredOutputs = Array.from(
      new Set([...existingRequiredOutputs, ...unresolvedRequiredInputs])
    );
    movedOutputCount += Math.max(normalizedRequiredOutputs.length - existingRequiredOutputs.length, 0);

    const {
      requiredInputFieldIds,
      requiredStageOutputs,
      ...stageWithoutRequirements
    } = stageRecord;

    return {
      ...stageWithoutRequirements,
      requiredDocumentTypes: normalizeStringArray(stageRecord.requiredDocumentTypes ?? []),
      requiredInputFieldIds: resolvedRequiredInputs,
      requiredStageOutputs: normalizedRequiredOutputs
    };
  });

  return {
    sanitizedStages,
    unresolvedInputCount,
    movedOutputCount
  };
}

function normalizeWorkflowStages(stages: any[]): any[] {
  const normalized = (stages || []).map(stage => ({ ...stage }));
  const isReception = (name: string) => String(name || '').toLowerCase().includes('recep') || String(name || '').toLowerCase().includes('receb');
  const isConclusion = (name: string) => String(name || '').toLowerCase().includes('conclus') || String(name || '').toLowerCase().includes('conclu');
  const mergeTabs = (tabs: string[] | undefined, extras: string[]) => {
    const current = normalizeWorkflowTabs(tabs ?? []);
    const combined = [...current];
    for (const tab of extras) {
      if (!combined.includes(tab)) {
        combined.push(tab);
      }
    }
    return combined;
  };

  const receptionStage = {
    name: 'Recepcao',
    description: 'Recebimento e inicio do protocolo',
    order: 1,
    slaDays: 1,
    availableTabs: ['resumo', 'documentos', 'comunicacao'],
    primaryTab: 'resumo',
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    requiredStageOutputs: [],
    allowedActions: ['APPROVE'],
    canSkip: false,
    stageType: 'RECEPTION',
    actionLabels: { APPROVE: 'Iniciar/Aceitar protocolo' }
  };

  const conclusionStage = {
    name: 'Conclusao',
    description: 'Finalizacao do protocolo',
    order: 1,
    slaDays: 1,
    availableTabs: ['resumo', 'comunicacao'],
    primaryTab: 'resumo',
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    requiredStageOutputs: [],
    allowedActions: ['APPROVE'],
    canSkip: false,
    stageType: 'CONCLUSION',
    actionLabels: { APPROVE: 'Concluir protocolo' }
  };

  const receptionIndex = normalized.findIndex(stage => isReception(stage?.name));
  if (receptionIndex === -1) {
    normalized.unshift(receptionStage);
  } else {
    const existing = normalized[receptionIndex];
    normalized[receptionIndex] = {
      ...existing,
      stageType: existing.stageType || 'RECEPTION',
      actionLabels: existing.actionLabels || { APPROVE: 'Iniciar/Aceitar protocolo' },
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      requiredStageOutputs: [],
      allowedActions: existing.allowedActions && existing.allowedActions.length > 0
        ? existing.allowedActions
        : ['APPROVE']
    };
  }

  const conclusionIndex = normalized.findIndex(stage => isConclusion(stage?.name));
  if (conclusionIndex === -1) {
    normalized.push(conclusionStage);
  } else if (conclusionIndex !== normalized.length - 1) {
    const [existing] = normalized.splice(conclusionIndex, 1);
    normalized.push(existing);
  }

  const lastIndex = normalized.length - 1;
  if (lastIndex >= 0) {
    const existing = normalized[lastIndex];
    normalized[lastIndex] = {
      ...existing,
      stageType: existing.stageType || 'CONCLUSION',
      actionLabels: existing.actionLabels || { APPROVE: 'Concluir protocolo' },
      allowedActions: existing.allowedActions && existing.allowedActions.length > 0
        ? existing.allowedActions
        : ['APPROVE']
    };
  }

  return normalized.map((stage, index) => {
    const generationTabs = ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'];
    const stageRecord = stage && typeof stage === 'object' ? (stage as Record<string, any>) : {};
    const isGeneration = shouldTreatAsDocumentGenerationStage(stageRecord);
    const requiredInputFieldIds = normalizeStringArray(stageRecord.requiredInputFieldIds ?? []);
    const requiredStageOutputs = normalizeStringArray(stageRecord.requiredStageOutputs ?? []);
    const {
      requiredInputFieldIds: _rawRequiredInputFieldIds,
      requiredStageOutputs: _rawRequiredStageOutputs,
      ...stageWithoutRequirements
    } = stageRecord;

    return {
      ...stageWithoutRequirements,
      order: index + 1,
      requiredDocumentTypes: normalizeStringArray(stageRecord.requiredDocumentTypes ?? []),
      requiredInputFieldIds,
      requiredStageOutputs,
      availableTabs: isGeneration
        ? mergeTabs(stageRecord.availableTabs, generationTabs)
        : normalizeWorkflowTabs(stageRecord.availableTabs),
      primaryTab: isGeneration
        ? normalizeWorkflowTab(stageRecord.primaryTab) || 'documentos-gerados'
        : normalizeWorkflowTab(stageRecord.primaryTab) || undefined,
      stageType: isGeneration ? 'DOCUMENT_GENERATION' : stageRecord.stageType || undefined
    };
  });
}

function parseServiceRequiredDocuments(service: any): string[] {
  const rawDocuments =
    typeof service?.requiredDocuments === 'string'
      ? parseJsonObject(service.requiredDocuments)
      : service?.requiredDocuments;

  const documentsArray = Array.isArray(rawDocuments)
    ? rawDocuments
    : Array.isArray(service?.requiredDocuments)
      ? service.requiredDocuments
      : [];

  const parsedDocuments = documentsArray
    .map((document) => {
      if (typeof document === 'string') return document;
      if (document && typeof document === 'object') {
        const record = document as Record<string, any>;
        return typeof record.type === 'string'
          ? record.type
          : typeof record.name === 'string'
            ? record.name
            : null;
      }
      return null;
    })
    .filter((document): document is string => typeof document === 'string');

  return normalizeStringArray(parsedDocuments);
}

function extractServiceRequiredFieldIds(service: any): string[] {
  const requiredFieldIds = new Set<string>();
  const formSchema = parseJsonObject(service?.formSchema);

  const schemaRequired = Array.isArray(formSchema?.required)
    ? formSchema.required.filter((fieldId: unknown): fieldId is string => typeof fieldId === 'string')
    : [];

  for (const fieldId of schemaRequired) {
    const resolvedFieldId = resolveFieldId(fieldId, buildServiceFieldCatalog(service));
    if (resolvedFieldId) {
      requiredFieldIds.add(resolvedFieldId);
    }
  }

  const formFieldsConfig = Array.isArray(service?.formFieldsConfig) ? service.formFieldsConfig : [];
  for (const field of formFieldsConfig) {
    if (!field || typeof field !== 'object') continue;
    const fieldRecord = field as Record<string, any>;
    if (!fieldRecord.required) continue;
    const rawFieldId = fieldRecord.id ?? fieldRecord.key ?? fieldRecord.name;
    if (typeof rawFieldId !== 'string') continue;
    const resolvedFieldId = resolveFieldId(rawFieldId, buildServiceFieldCatalog(service));
    if (resolvedFieldId) {
      requiredFieldIds.add(resolvedFieldId);
    }
  }

  return Array.from(requiredFieldIds);
}

function isConclusionStage(stage: Record<string, any> | null | undefined): boolean {
  if (!stage || typeof stage !== 'object') return false;

  const stageType = typeof stage.stageType === 'string' ? stage.stageType.trim() : '';
  if (stageType === 'CONCLUSION') return true;

  const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : '';
  return stageName.includes('conclus') || stageName.includes('conclu');
}

function isDocumentGenerationStage(stage: Record<string, any> | null | undefined): boolean {
  return shouldTreatAsDocumentGenerationStage(stage);
}

function isActionableWorkflowStage(stage: Record<string, any> | null | undefined): boolean {
  return Boolean(stage) && !isReceptionStage(stage) && !isConclusionStage(stage) && !isDocumentGenerationStage(stage);
}

function looksLikeDocumentAnalysisStage(stage: Record<string, any>): boolean {
  const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : '';
  const availableTabs = normalizeWorkflowTabs(stage.availableTabs ?? []);
  const primaryTab = normalizeWorkflowTab(stage.primaryTab) || '';
  return (
    normalizeStringArray(stage.requiredDocumentTypes ?? []).length > 0 ||
    stageName.includes('document') ||
    primaryTab === 'documentos' ||
    availableTabs.includes('documentos')
  );
}

function looksLikeDataAnalysisStage(stage: Record<string, any>): boolean {
  const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : '';
  const availableTabs = normalizeWorkflowTabs(stage.availableTabs ?? []);
  const primaryTab = normalizeWorkflowTab(stage.primaryTab) || '';
  return (
    normalizeStringArray(stage.requiredInputFieldIds ?? []).length > 0 ||
    stageName.includes('dados') ||
    stageName.includes('valida') ||
    (stageName.includes('anal') && !stageName.includes('document')) ||
    primaryTab === 'dados' ||
    availableTabs.includes('dados')
  );
}

function createDocumentAnalysisStage(order: number) {
  return {
    name: 'Análise Documental',
    order,
    description: 'Verificação dos documentos exigidos pelo serviço',
    slaDays: 3,
    availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
    primaryTab: 'documentos',
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    requiredStageOutputs: [],
    allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING', 'REQUEST_INFO'],
    canSkip: false
  };
}

function createDataValidationStage(order: number) {
  return {
    name: 'Validação de Dados',
    order,
    description: 'Verificação e validação dos dados obrigatórios do serviço',
    slaDays: 3,
    availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
    primaryTab: 'dados',
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    requiredStageOutputs: [],
    allowedActions: ['APPROVE', 'REJECT', 'CREATE_PENDING', 'REQUEST_INFO'],
    canSkip: false
  };
}

function mergeUniqueStrings(current: unknown, additions: string[]): string[] {
  return Array.from(new Set([...normalizeStringArray(current), ...normalizeStringArray(additions)]));
}

function ensureWorkflowCoverageForService(service: any, stages: any[]) {
  const normalizedStages = stages.map((stage) => ({ ...(stage as Record<string, any>) }));
  const requiredDocuments = parseServiceRequiredDocuments(service);
  const requiredFieldIds = extractServiceRequiredFieldIds(service);
  const actionableStageIndexes = normalizedStages
    .map((stage, index) => ({ stage, index }))
    .filter(({ stage }) => isActionableWorkflowStage(stage));

  const findReceptionIndex = () => normalizedStages.findIndex(stage => isReceptionStage(stage));
  const findDocumentStageIndex = () =>
    actionableStageIndexes.find(({ stage }) => looksLikeDocumentAnalysisStage(stage))?.index ?? -1;
  const findDataStageIndex = () =>
    actionableStageIndexes.find(({ stage }) => looksLikeDataAnalysisStage(stage))?.index ?? -1;

  let documentStageIndex = findDocumentStageIndex();
  let dataStageIndex = findDataStageIndex();

  if (requiredDocuments.length > 0 && documentStageIndex === -1) {
    const receptionIndex = findReceptionIndex();
    const insertIndex = receptionIndex >= 0 ? receptionIndex + 1 : 0;
    normalizedStages.splice(insertIndex, 0, createDocumentAnalysisStage(insertIndex + 1));
    documentStageIndex = insertIndex;
    if (dataStageIndex >= insertIndex) {
      dataStageIndex += 1;
    }
  }

  if (requiredFieldIds.length > 0 && dataStageIndex === -1) {
    const insertAfter = documentStageIndex >= 0 ? documentStageIndex : findReceptionIndex();
    const insertIndex = insertAfter >= 0 ? insertAfter + 1 : 0;
    normalizedStages.splice(insertIndex, 0, createDataValidationStage(insertIndex + 1));
    dataStageIndex = insertIndex;
  }

  if (documentStageIndex >= 0 && requiredDocuments.length > 0) {
    normalizedStages[documentStageIndex] = {
      ...normalizedStages[documentStageIndex],
      requiredDocumentTypes: mergeUniqueStrings(
        normalizedStages[documentStageIndex].requiredDocumentTypes,
        requiredDocuments
      )
    };
  }

  if (dataStageIndex >= 0 && requiredFieldIds.length > 0) {
    normalizedStages[dataStageIndex] = {
      ...normalizedStages[dataStageIndex],
      requiredInputFieldIds: mergeUniqueStrings(
        normalizedStages[dataStageIndex].requiredInputFieldIds,
        requiredFieldIds
      )
    };
  }

  return normalizedStages.map((stage, index) => ({
    ...stage,
    order: index + 1
  }));
}

export function buildSeedWorkflowStagesForService(service: any) {
  const workflowTemplate =
    service.moduleType && specificWorkflows[service.moduleType]
      ? specificWorkflows[service.moduleType].stages
      : generateGenericWorkflow(service);

  const normalizedStages = normalizeWorkflowStages(workflowTemplate as any[]);
  const coveredStages = ensureWorkflowCoverageForService(service, normalizedStages);
  const { sanitizedStages, unresolvedInputCount, movedOutputCount } =
    sanitizeStageRequirementsForService(service, coveredStages as any[]);

  return {
    stages: sanitizedStages,
    unresolvedInputCount,
    movedOutputCount,
    source: service.moduleType && specificWorkflows[service.moduleType] ? 'specific' : 'generated'
  };
}
export async function seedServiceWorkflows() {
  console.log('\nðŸ“¦ Iniciando seed de ServiceWorkflows (COM METADADOS DE UI)...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // 1. Buscar todos os serviÃ§os ativos
  const services = await prisma.serviceSimplified.findMany({
    where: {
      isActive: true
    },
    include: {
      department: true
    }
  });

  console.log(`\n   â†’ Encontrados ${services.length} serviÃ§os ativos`);

  // 2. Processar cada serviÃ§o
  for (const service of services) {
    try {
      // Verificar se jÃ¡ tem workflow
      const existing = await prisma.serviceWorkflow.findUnique({
        where: { serviceId: service.id }
      });

      let workflowName: string;
      let workflowDescription: string;
      let defaultSLA: number;

      if (service.moduleType && specificWorkflows[service.moduleType]) {
        // Usar workflow especÃ­fico
        const specific = specificWorkflows[service.moduleType];
        workflowName = specific.name;
        workflowDescription = specific.description;
        defaultSLA = specific.defaultSLA;
      } else {
        // Usar workflow genÃ©rico
        workflowName = `Workflow - ${service.name}`;
        workflowDescription = `Fluxo padrÃ£o para ${service.name}`;
        defaultSLA = service.estimatedDays || 10;
      }

      const { stages: workflowStages, unresolvedInputCount, movedOutputCount, source } =
        buildSeedWorkflowStagesForService(service);

      if (unresolvedInputCount > 0) {
        console.warn(
          `   Ã¢Å¡Â Ã¯Â¸Â ${service.name}: ${unresolvedInputCount} campo(s) de entrada nÃƒÂ£o mapeado(s) movido(s) para requiredStageOutputs (${movedOutputCount} novo(s)).`
        );
      }

      if (source === 'generated') {
        defaultSLA = workflowStages.reduce(
          (total, stage) => total + (typeof stage?.slaDays === 'number' ? stage.slaDays : 0),
          0
        ) || defaultSLA;
      }

      if (existing) {
        // Atualizar workflow existente
        await prisma.serviceWorkflow.update({
          where: { serviceId: service.id },
          data: {
            name: workflowName,
            description: workflowDescription,
            stages: workflowStages,
            defaultSLA: defaultSLA
          }
        });
        updated++;
        console.log(`   âœ“ Atualizado: ${service.name} (${service.department?.name})`);
      } else {
        // Criar novo workflow
        await prisma.serviceWorkflow.create({
          data: {
            serviceId: service.id,
            name: workflowName,
            description: workflowDescription,
            stages: workflowStages,
            defaultSLA: defaultSLA,
            isActive: true
          }
        });
        created++;
        console.log(`   âœ“ Criado: ${service.name} (${service.department?.name})`);
      }
    } catch (error: any) {
      console.error(`   âœ— Erro ao processar ${service.name}:`, error.message);
      skipped++;
    }
  }

  console.log(`\nâœ… Seed de ServiceWorkflows concluÃ­do:`);
  console.log(`   - Criados: ${created}`);
  console.log(`   - Atualizados: ${updated}`);
  console.log(`   - Ignorados: ${skipped}`);
  console.log(`   - Total: ${created + updated + skipped}\n`);
}

/**
 * ============================================================================
 * EXECUÃ‡ÃƒO STANDALONE
 * ============================================================================
 */
if (require.main === module) {
  seedServiceWorkflows()
    .then(() => {
      console.log('âœ… Seed executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('âŒ Erro ao executar seed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
