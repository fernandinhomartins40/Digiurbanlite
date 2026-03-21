/**
 * ============================================================================
 * SERVICE WORKFLOWS SEED - Workflows por Serviço COM METADADOS DE UI
 * ============================================================================
 *
 * ATUALIZADO: Agora cada stage define:
 * - availableTabs: Quais abas mostrar na UI
 * - primaryTab: Qual aba destacar
 * - requiredDocumentTypes: Documentos obrigatórios
 * - requiredInputFieldIds: Campos de formulário obrigatórios
 * - allowedActions: Ações permitidas
 *
 * Isso permite que o WORKFLOW defina completamente a estrutura da UI
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ============================================================================
 * WORKFLOWS ESPECÍFICOS PARA SERVIÇOS COM_DADOS
 * ============================================================================
 */

interface SpecificWorkflow {
  moduleType: string;
  name: string;
  description: string;
  defaultSLA: number;
  stages: Prisma.JsonValue;
}

// Workflows específicos por moduleType
export const specificWorkflows: Record<string, SpecificWorkflow> = {
  // ========== SAÚDE ==========
  ENCAMINHAMENTOS_TFD: {
    moduleType: 'ENCAMINHAMENTOS_TFD',
    name: 'Workflow - Tratamento Fora do Domicílio',
    description: 'Fluxo para encaminhamentos TFD',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos obrigatórios (laudos, atestados, exames)',
        slaDays: 2,

        // ✅ METADADOS DE UI
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        // Requisitos
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],

        // Ações
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Regulação Médica',
        order: 4,
        description: 'Avaliação técnica pela regulação médica',
        slaDays: 3,

        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['parecer_medico', 'cid_principal', 'procedimento_solicitado'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Gestão',
        order: 5,
        description: 'Aprovação final pela gestão',
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
    description: 'Fluxo para solicitação de transporte de pacientes',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Verificação da solicitação e documentos',
        slaDays: 2,

        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        requiredDocumentTypes: ['Atestado Médico', 'Comprovante de Endereço', 'Cartão SUS'],
        requiredInputFieldIds: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Técnica',
        order: 4,
        description: 'Avaliação do tipo de transporte necessário',
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
        name: 'Confirmação',
        order: 6,
        description: 'Confirmação do agendamento com o paciente',
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
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de CPF, comprovante de residência e documentos da propriedade',
        slaDays: 3,

        // ✅ UI DEFINITION
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação dos dados cadastrais do produtor',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['tipo_producao', 'area_propriedade', 'produtos_principais'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do cadastro',
        slaDays: 2,

        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certidão',
        order: 5,
        description: 'Emissão da certidão de produtor rural',
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
    name: 'Workflow - Licença para Obras',
    description: 'Fluxo para licenciamento de obras particulares',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recebimento',
        order: 1,
        description: 'Protocolo recebido e validação inicial',
        slaDays: 2,

        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        requiredDocumentTypes: ['Projeto Aprovado', 'ART', 'Matrícula do Imóvel'],
        requiredInputFieldIds: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 2,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 3,
        description: 'Análise da documentação apresentada',
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
        description: 'Vistoria técnica no local',
        slaDays: 10,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['data_vistoria', 'parecer_vistoria', 'responsavel_vistoria'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação final e cálculo de taxas',
        slaDays: 5,

        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: ['valor_taxa', 'validade_licenca'],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão',
        order: 6,
        description: 'Emissão da licença de obra',
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
    name: 'Workflow - Alvará de Funcionamento',
    description: 'Fluxo para emissão de alvará de funcionamento',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recebimento',
        order: 1,
        description: 'Protocolo recebido e validação inicial',
        slaDays: 2,

        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',

        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'Comprovante de Endereço do Estabelecimento', 'Planta Baixa'],
        requiredInputFieldIds: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 2,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 3,
        description: 'Análise da documentação do estabelecimento',
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
        name: 'Emissão',
        order: 5,
        description: 'Emissão do alvará de funcionamento',
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

  // ========== SAÚDE (continuação) ==========
  AGENDAMENTO_CONSULTA: {
    moduleType: 'AGENDAMENTO_CONSULTA',
    name: 'Workflow - Agendamento de Consulta Médica',
    description: 'Fluxo para agendamento de consultas médicas',
    defaultSLA: 3,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Triagem e Validação',
        order: 2,
        description: 'Validação de dados e disponibilidade',
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
        description: 'Confirmação de data e horário',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_consulta', 'horario', 'profissional'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Notificação ao paciente',
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
    name: 'Workflow - Solicitação de Exames',
    description: 'Fluxo para solicitação de exames laboratoriais',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Pedido Médico',
        order: 2,
        description: 'Validação de requisição médica',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Pedido Médico', 'Cartão SUS'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        description: 'Definição de data para coleta',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_coleta', 'local_coleta'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 5,
        description: 'Notificação ao paciente',
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
    name: 'Workflow - Solicitação de Cartão SUS',
    description: 'Fluxo para emissão de Cartão SUS',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos pessoais',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Residência', 'RG ou CNH'],
        requiredInputFieldIds: ['nome_completo', 'data_nascimento', 'nome_mae'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        name: 'Emissão do Cartão',
        order: 5,
        description: 'Impressão e disponibilização',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        allowedActions: ['APPROVE'],
        canSkip: false,
        stageType: 'DOCUMENT_GENERATION'
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
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Documentos',
        order: 2,
        description: 'Verificação de documentos escolares',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Certidão de Nascimento', 'Comprovante de Residência', 'Cartão de Vacina'],
        requiredInputFieldIds: ['nome_aluno', 'data_nascimento', 'serie_pretendida'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
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
        name: 'Efetivação da Matrícula',
        order: 4,
        description: 'Confirmação e registro no sistema',
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
    name: 'Workflow - Transferência Escolar',
    description: 'Fluxo para transferência entre escolas',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Verificação de documentos e motivo',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Histórico Escolar', 'Declaração de Transferência'],
        requiredInputFieldIds: ['escola_origem', 'escola_destino', 'motivo'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
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
        description: 'Transferência de documentação',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 5,
        description: 'Matrícula efetivada na nova escola',
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
    description: 'Fluxo para solicitação de transporte escolar',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 2,
        description: 'Verificação de critérios (distância, idade)',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['Comprovante de Residência', 'Comprovante de Matrícula'],
        requiredInputFieldIds: ['endereco_completo', 'escola', 'distancia_km'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Rota',
        order: 4,
        description: 'Planejamento logístico',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Autorização final',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro e Orientação',
        order: 6,
        description: 'Informações sobre ponto e horário',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== AGRICULTURA (complementação) ==========
  ASSISTENCIA_TECNICA: {
    moduleType: 'ASSISTENCIA_TECNICA',
    name: 'Workflow - Assistência Técnica Rural',
    description: 'Fluxo para solicitação de assistência técnica',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Verificação da demanda e documentação',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documento da Propriedade (opcional)'],
        requiredInputFieldIds: ['tipo_assistencia', 'area_propriedade'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        description: 'Agendamento de visita técnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'tecnico_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 5,
        description: 'Realização da vistoria in loco',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Emissão de Laudo',
        order: 6,
        description: 'Elaboração do laudo técnico',
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
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos da propriedade',
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
        description: 'Vistoria técnica no local',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['coordenadas_gps', 'uso_solo', 'benfeitorias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Validação Cadastral',
        order: 4,
        description: 'Validação dos dados cadastrais',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 5,
        description: 'Emissão do certificado de cadastro',
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
    name: 'Workflow - Inscrição em Programa Rural',
    description: 'Fluxo para inscrição em programas de desenvolvimento rural',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 2,
        description: 'Verificação de critérios de elegibilidade',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['programa_escolhido', 'area_producao'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação Técnica',
        order: 3,
        description: 'Análise técnica da solicitação',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da inscrição',
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
        description: 'Efetivação do cadastro',
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
    name: 'Workflow - Inscrição em Feira do Produtor',
    description: 'Fluxo para inscrição em feiras de produtores',
    defaultSLA: 8,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Inscrição',
        order: 2,
        description: 'Verificação de documentos do produtor',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Residência'],
        requiredInputFieldIds: ['produtos_comercializar', 'tipo_banca'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação Sanitária',
        order: 3,
        description: 'Verificação de conformidade sanitária',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_sanitario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Alocação de Espaço',
        order: 4,
        description: 'Definição de local na feira',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_banca', 'localizacao_feira'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 5,
        description: 'Confirmação da inscrição',
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
    name: 'Workflow - Licença para Eventos Rurais',
    description: 'Fluxo para licenciamento de eventos em área rural',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Verificação de documentos do evento',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto do Evento', 'CPF'],
        requiredInputFieldIds: ['tipo_evento', 'data_evento', 'publico_estimado'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        description: 'Vistoria técnica no local do evento',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_vistoria', 'infraestrutura'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Segurança',
        order: 5,
        description: 'Avaliação de segurança e sanitária',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['plano_seguranca', 'plano_sanitario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Licença',
        order: 6,
        description: 'Emissão da licença do evento',
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
    name: 'Workflow - Análise de Solo',
    description: 'Fluxo para solicitação de análise de solo',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Registro de Solicitação',
        order: 2,
        description: 'Registro e validação da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: ['tipo_analise', 'area_amostra'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        name: 'Análise Laboratorial',
        order: 5,
        description: 'Análise das amostras em laboratório',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resultados_analise'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Laudo',
        order: 6,
        description: 'Emissão do laudo técnico',
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
        name: 'Recepção',
        order: 1,
        description: 'Recepção e triagem do atendimento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_atendimento', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 2,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise técnica da demanda',
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
        description: 'Execução do atendimento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['providencias_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Finalização',
        order: 5,
        description: 'Finalização e feedback',
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
    name: 'Workflow - Solicitação de Máquinas Agrícolas',
    description: 'Fluxo para solicitação de máquinas e equipamentos',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Verificação de elegibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_maquina', 'area_trabalho', 'finalidade'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Prévia',
        order: 4,
        description: 'Vistoria da área a ser trabalhada',
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
        description: 'Agendamento da máquina',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_agendamento', 'maquina_alocada', 'operador'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 6,
        description: 'Confirmação do agendamento',
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

  // ========== ASSISTÊNCIA SOCIAL ==========
  ATENDIMENTO_CRAS: {
    moduleType: 'ATENDIMENTO_CRAS',
    name: 'Workflow - Atendimento CRAS',
    description: 'Fluxo para atendimentos no CRAS',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Social',
        order: 4,
        description: 'Avaliação pela assistente social',
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
        description: 'Encaminhamento para serviços apropriados',
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
    name: 'Workflow - Auxílio Emergencial',
    description: 'Fluxo para solicitação de auxílio emergencial',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Documentos',
        order: 2,
        description: 'Verificação de documentos e elegibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Endereço'],
        requiredInputFieldIds: ['composicao_familiar', 'renda_per_capita'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Socioeconômica',
        order: 4,
        description: 'Avaliação da situação socioeconômica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'situacao_emergencial'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do auxílio',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['valor_auxilio', 'periodo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Liberação',
        order: 6,
        description: 'Liberação do benefício',
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
    name: 'Workflow - Cadastro Único',
    description: 'Fluxo para cadastro no CadÚnico',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        description: 'Verificação de documentos da família',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CadÚnico', 'Documentos Pessoais', 'Comprovante de Renda'],
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
        name: 'Validação',
        order: 4,
        description: 'Validação dos dados cadastrados',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Finalização',
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
    name: 'Workflow - Inscrição em Grupo/Oficina Social',
    description: 'Fluxo para inscrição em grupos e oficinas',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Inscrição',
        order: 2,
        description: 'Verificação de documentos e elegibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Endereço'],
        requiredInputFieldIds: ['grupo_interesse', 'faixa_etaria'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação de Perfil',
        order: 3,
        description: 'Avaliação do perfil do candidato',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 4,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['turma_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 5,
        description: 'Confirmação da inscrição',
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
    name: 'Workflow - Inscrição em Programa Social',
    description: 'Fluxo para inscrição em programas sociais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CadÚnico', 'Documentos Pessoais'],
        requiredInputFieldIds: ['programa_solicitado'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Socioeconômica',
        order: 4,
        description: 'Avaliação da situação familiar',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'perfil_familiar'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 5,
        description: 'Verificação de critérios do programa',
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
        description: 'Efetivação do cadastro',
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
    name: 'Workflow - Solicitação de Benefício',
    description: 'Fluxo para solicitação de benefícios sociais',
    defaultSLA: 12,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Documentos',
        order: 2,
        description: 'Verificação de documentação',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_beneficio'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        description: 'Estudo socioeconômico',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_social', 'conclusao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Gestão',
        order: 5,
        description: 'Aprovação pela gestão',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['parecer_gestor'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Concessão',
        order: 6,
        description: 'Concessão do benefício',
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
    description: 'Fluxo para agendamento e realização de visitas domiciliares',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Análise da demanda de visita',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['motivo_visita', 'endereco_completo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        name: 'Realização da Visita',
        order: 5,
        description: 'Execução da visita domiciliar',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_visita', 'condicoes_moradia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Elaboração de Relatório',
        order: 6,
        description: 'Elaboração do relatório técnico',
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
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos pessoais',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG'],
        requiredInputFieldIds: ['nome_artistico', 'categoria_artistica'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Portfólio',
        order: 4,
        description: 'Avaliação do portfólio artístico',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_atuacao', 'experiencia'],
        requiredDocumentTypes: ['RG', 'CPF', 'Projeto do Evento'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação',
        order: 5,
        description: 'Validação pela comissão de cultura',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Carteira',
        order: 6,
        description: 'Emissão da carteira de artista',
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
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Proposta',
        order: 2,
        description: 'Verificação da proposta do evento',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_evento', 'data_evento', 'tipo_evento', 'publico_estimado'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise técnica da viabilidade',
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
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final do evento',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Publicação',
        order: 7,
        description: 'Publicação no calendário cultural',
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
    name: 'Workflow - Cadastro de Grupo Artístico',
    description: 'Fluxo para cadastro de grupos artísticos',
    defaultSLA: 12,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos do grupo',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documentos dos Integrantes', 'Portfólio do Grupo', 'Estatuto (opcional)'],
        requiredInputFieldIds: ['nome_grupo', 'categoria', 'numero_integrantes'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Portfólio',
        order: 4,
        description: 'Avaliação do trabalho do grupo',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_atuacao', 'historico_grupo'],
        requiredDocumentTypes: ['Portfólio do Grupo'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação',
        order: 5,
        description: 'Validação pela secretaria de cultura',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Certificação',
        order: 6,
        description: 'Emissão de certificado de cadastro',
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
    name: 'Workflow - Inscrição em Oficina Cultural',
    description: 'Fluxo para inscrição em oficinas culturais',
    defaultSLA: 8,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Inscrição',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Residência'],
        requiredInputFieldIds: ['oficina_escolhida', 'faixa_etaria'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['turma_disponivel', 'horario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Matrícula',
        order: 5,
        description: 'Efetivação da matrícula',
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
    name: 'Workflow - Registro de Manifestação Cultural',
    description: 'Fluxo para registro de manifestações culturais',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Proposta',
        order: 2,
        description: 'Verificação da proposta de registro',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documentação Histórica', 'Fotos', 'Depoimentos'],
        requiredInputFieldIds: ['nome_manifestacao', 'tipo', 'historico'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Pesquisa e Documentação',
        order: 4,
        description: 'Levantamento histórico e documental',
        slaDays: 8,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['pesquisa_historica', 'documentacao_fotografica'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Análise da Comissão',
        order: 5,
        description: 'Avaliação pela comissão de patrimônio',
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
        description: 'Registro oficial da manifestação',
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
    name: 'Workflow - Reserva de Espaço Cultural',
    description: 'Fluxo para reserva de espaços culturais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Verificação da solicitação de reserva',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['espaco_solicitado', 'data_evento', 'tipo_atividade'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Disponibilidade',
        order: 3,
        description: 'Verificação de agenda do espaço',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['disponibilidade_confirmada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria Prévia',
        order: 4,
        description: 'Vistoria e orientações sobre o espaço',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['termo_responsabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 5,
        description: 'Confirmação da reserva',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'comunicacao',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Liberação do Espaço',
        order: 6,
        description: 'Liberação das chaves/acesso',
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
    description: 'Fluxo para solicitação de apoio cultural',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Projeto',
        order: 2,
        description: 'Verificação do projeto cultural',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: ['tipo_apoio', 'valor_solicitado'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Avaliação técnica do projeto',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'relevancia_cultural'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Orçamentária',
        order: 5,
        description: 'Análise da viabilidade orçamentária',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_orcamentario', 'valor_aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Formalização',
        order: 6,
        description: 'Formalização do apoio',
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
        name: 'Recepção',
        order: 1,
        description: 'Recepção e triagem do atendimento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_atendimento', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 2,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise',
        order: 3,
        description: 'Análise da demanda',
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
        description: 'Execução do atendimento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['providencias_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Finalização',
        order: 5,
        description: 'Finalização e feedback',
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
    description: 'Fluxo para aprovação de projetos culturais',
    defaultSLA: 25,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Proposta',
        order: 2,
        description: 'Verificação da proposta de projeto',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Orçamento', 'CPF'],
        requiredInputFieldIds: ['titulo_projeto', 'objetivo', 'publico_alvo'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Avaliação técnica do projeto',
        slaDays: 8,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'viabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Financeira',
        order: 5,
        description: 'Análise da viabilidade financeira',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_financeiro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 6,
        description: 'Aprovação pela secretaria',
        slaDays: 5,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Formalização',
        order: 7,
        description: 'Formalização e publicação',
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

  // ========== EDUCAÇÃO ==========
  CADASTRO_PROFESSOR: {
    moduleType: 'CADASTRO_PROFESSOR',
    name: 'Workflow - Cadastro de Professor',
    description: 'Fluxo para cadastro de professores na rede municipal',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação Documental',
        order: 2,
        description: 'Verificação de documentos do professor',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG do Responsável', 'CPF do Responsável', 'Comprovante de Residência'],
        requiredInputFieldIds: ['nome_completo', 'disciplina', 'nivel_ensino'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Curricular',
        order: 4,
        description: 'Análise do currículo e formação',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_pedagogico', 'formacao_adequada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação RH',
        order: 5,
        description: 'Aprovação pelo departamento de recursos humanos',
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
    name: 'Workflow - Consulta Frequência e Notas',
    description: 'Fluxo para solicitação de consulta de frequência e notas',
    defaultSLA: 3,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação Solicitante',
        order: 2,
        description: 'Verificação de vínculo do solicitante com o aluno',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_aluno', 'matricula', 'vinculo'],
        requiredDocumentTypes: ['Diploma', 'Currículo', 'Comprovante de Residência'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Geração de Relatório',
        order: 3,
        description: 'Geração do relatório de frequência e notas',
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
        description: 'Disponibilização do relatório',
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
    name: 'Workflow - Inscrição em Curso Livre',
    description: 'Fluxo para inscrição em cursos livres oferecidos pela prefeitura',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Requisitos',
        order: 2,
        description: 'Verificação de requisitos para o curso',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_curso', 'turma', 'turno'],
        requiredDocumentTypes: ['RG', 'CPF'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade de vagas',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Matrícula',
        order: 4,
        description: 'Efetivação da matrícula',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['numero_matricula'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 5,
        description: 'Notificação ao aluno sobre a matrícula',
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
    name: 'Workflow - Registro de Ocorrência Escolar',
    description: 'Fluxo para registro e tratamento de ocorrências escolares',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção da Ocorrência',
        order: 1,
        description: 'Registro inicial da ocorrência',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_ocorrencia', 'descricao', 'envolvidos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 2,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Pedagógica',
        order: 3,
        description: 'Análise pela equipe pedagógica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_pedagogico', 'providencias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Providências',
        order: 4,
        description: 'Execução das providências necessárias',
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
    name: 'Workflow - Solicitação de Documento Escolar',
    description: 'Fluxo para solicitação de documentos escolares (histórico, declarações, etc)',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação',
        order: 2,
        description: 'Validação da solicitação e documentos',
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
        description: 'Busca de informações nos arquivos escolares',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_localizados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Emissão',
        order: 4,
        description: 'Emissão do documento solicitado',
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
        description: 'Disponibilização para retirada',
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
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação Documental',
        order: 2,
        description: 'Verificação de documentos do atleta',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Atestado Médico'],
        requiredInputFieldIds: ['nome_completo', 'modalidade', 'categoria'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Física',
        order: 4,
        description: 'Avaliação de aptidão física',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_medico', 'apto'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Técnica',
        order: 5,
        description: 'Aprovação pelo técnico responsável',
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
    name: 'Workflow - Inscrição em Competição',
    description: 'Fluxo para inscrição em competições esportivas municipais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação de Inscrição',
        order: 2,
        description: 'Verificação de requisitos para participação',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_competicao', 'modalidade', 'categoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Homologação',
        order: 4,
        description: 'Homologação da inscrição',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['numero_inscricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 5,
        description: 'Notificação sobre a inscrição',
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
    name: 'Workflow - Inscrição em Escolinha Esportiva',
    description: 'Fluxo para inscrição em escolinhas esportivas municipais',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Requisitos',
        order: 2,
        description: 'Verificação de requisitos e faixa etária',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['modalidade', 'turma', 'turno'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade de vagas',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Matrícula',
        order: 4,
        description: 'Efetivação da matrícula',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['numero_matricula'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 5,
        description: 'Notificação ao responsável',
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
    name: 'Workflow - Reserva de Espaço Esportivo',
    description: 'Fluxo para reserva de quadras, ginásios e espaços esportivos',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Disponibilidade',
        order: 2,
        description: 'Verificação de disponibilidade do espaço',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['espaco_solicitado', 'data', 'horario', 'finalidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Uso',
        order: 4,
        description: 'Análise da finalidade de uso',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_uso'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Autorização',
        order: 5,
        description: 'Autorização da reserva',
        slaDays: 1,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 6,
        description: 'Confirmação e entrega de autorização',
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

  // ========== HABITAÇÃO ==========
  AUTORIZACAO_CONSTRUCAO: {
    moduleType: 'AUTORIZACAO_CONSTRUCAO',
    name: 'Workflow - Autorização para Construção',
    description: 'Fluxo para autorização de construções',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentação técnica',
        slaDays: 7,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Arquitetônico', 'Matrícula do Imóvel', 'ART (Anotação de Responsabilidade Técnica)'],
        requiredInputFieldIds: ['area_construir', 'endereco', 'tipo_construcao'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise técnica do projeto',
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
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final',
        slaDays: 5,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Alvará',
        order: 7,
        description: 'Emissão do alvará de construção',
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
    name: 'Workflow - Inscrição em Programa Habitacional',
    description: 'Fluxo para inscrição em programas de habitação popular',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Renda', 'Comprovante de Endereço'],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 4,
        description: 'Avaliação da situação socioeconômica',
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
        description: 'Vistoria na residência atual',
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
        name: 'Notificação',
        order: 7,
        description: 'Notificação sobre o cadastro',
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
    name: 'Workflow - Regularização Fundiária',
    description: 'Fluxo para regularização de terrenos e construções',
    defaultSLA: 60,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentação',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura (se possuir)', 'IPTU', 'Comprovante de Residência'],
        requiredInputFieldIds: ['tempo_ocupacao', 'area_terreno'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Análise Jurídica',
        order: 5,
        description: 'Análise jurídica da situação',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_juridico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final da regularização',
        slaDays: 10,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Documentos',
        order: 7,
        description: 'Emissão da documentação de regularização',
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
    name: 'Workflow - Solicitação de Auxílio Aluguel',
    description: 'Fluxo para solicitação de auxílio aluguel',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Renda'],
        requiredInputFieldIds: ['valor_aluguel', 'renda_familiar'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 4,
        description: 'Avaliação da situação socioeconômica',
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
        description: 'Vistoria no imóvel',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação do auxílio',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['valor_aprovado', 'prazo_beneficio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro Benefício',
        order: 7,
        description: 'Cadastro no sistema de benefícios',
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
    description: 'Fluxo para vistoria de condições habitacionais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Realização da Vistoria',
        order: 4,
        description: 'Execução da vistoria técnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_tecnico', 'fotos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 5,
        description: 'Análise dos resultados da vistoria',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Laudo',
        order: 6,
        description: 'Emissão do laudo de vistoria',
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
    name: 'Workflow - Autorização para Poda de Árvores',
    description: 'Fluxo para autorização de poda ou supressão de árvores',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise do Pedido',
        order: 2,
        description: 'Análise inicial da solicitação',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['endereco', 'tipo_solicitacao', 'motivo'],
        requiredDocumentTypes: ['Comprovante de Propriedade'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Análise Ambiental',
        order: 4,
        description: 'Análise de impacto ambiental',
        slaDays: 4,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_ambiental', 'medidas_compensatorias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Autorização',
        order: 6,
        description: 'Emissão de autorização',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 7,
        description: 'Notificação ao solicitante',
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
    description: 'Fluxo para inscrição em programas ambientais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Inscrição',
        order: 2,
        description: 'Análise da inscrição',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_programa', 'tipo_participacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Requisitos',
        order: 4,
        description: 'Verificação de requisitos',
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
        name: 'Notificação',
        order: 6,
        description: 'Notificação sobre o cadastro',
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
    name: 'Workflow - Denúncia Ambiental',
    description: 'Fluxo para processamento de denúncias ambientais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recepção e classificação da denúncia',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_denuncia', 'descricao', 'localizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 2,
        description: 'Verificação e validação dos dados do formulário',
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
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise técnica da situação',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'providencias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Providências',
        order: 5,
        description: 'Execução de providências',
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
        description: 'Fechamento da denúncia',
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
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentação',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto', 'ART'],
        requiredInputFieldIds: ['tipo_atividade', 'porte_empreendimento'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Análise Ambiental',
        order: 5,
        description: 'Análise de impacto ambiental',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_ambiental', 'condicionantes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final',
        slaDays: 5,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Licença',
        order: 7,
        description: 'Emissão da licença ambiental',
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
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Realização',
        order: 4,
        description: 'Realização da vistoria',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria', 'fotos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 5,
        description: 'Análise dos resultados',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Laudo',
        order: 6,
        description: 'Emissão do laudo',
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

  // ========== OBRAS PÚBLICAS ==========
  AUTORIZACAO_DEMOLICAO: {
    moduleType: 'AUTORIZACAO_DEMOLICAO',
    name: 'Workflow - Autorização para Demolição',
    description: 'Fluxo para autorização de demolição de edificações',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentação',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['endereco', 'area_demolir'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Análise de Segurança',
        order: 5,
        description: 'Análise de segurança e impactos',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_seguranca', 'medidas_protecao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Alvará',
        order: 7,
        description: 'Emissão do alvará de demolição',
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
    name: 'Workflow - Autorização para Intervenção em Via Pública',
    description: 'Fluxo para autorização de intervenções em vias públicas',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise do Pedido',
        order: 2,
        description: 'Análise inicial da solicitação',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['endereco', 'tipo_intervencao', 'periodo'],
        requiredDocumentTypes: ['Projeto de Intervenção', 'ART'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise técnica do projeto',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'impacto_transito'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Segurança',
        order: 5,
        description: 'Análise de segurança viária',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_seguranca'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final',
        slaDays: 2,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 7,
        description: 'Emissão da autorização',
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
    name: 'Workflow - Solicitação de Reparo em Via Pública',
    description: 'Fluxo para solicitação de reparos em vias públicas',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recepção da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['endereco', 'tipo_reparo', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 2,
        description: 'Verificação e validação dos dados do formulário',
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
        name: 'Orçamento',
        order: 4,
        description: 'Elaboração de orçamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['orcamento', 'prazo_execucao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação para execução',
        slaDays: 3,
        availableTabs: ['resumo', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Programação',
        order: 6,
        description: 'Programação da execução',
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
    description: 'Fluxo para aprovação de parcelamento de solo urbano',
    defaultSLA: 60,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentação',
        slaDays: 15,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto de Parcelamento', 'Matrícula do Imóvel', 'ART do Responsável Técnico'],
        requiredInputFieldIds: ['area_total', 'numero_lotes'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Urbanística',
        order: 4,
        description: 'Análise de conformidade urbanística',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_urbanistico', 'conformidade_plano_diretor'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Ambiental',
        order: 5,
        description: 'Análise de impacto ambiental',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_ambiental'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Infraestrutura',
        order: 6,
        description: 'Análise de infraestrutura necessária',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_infraestrutura'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 7,
        description: 'Aprovação final do parcelamento',
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
        description: 'Registro e formalização',
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
    name: 'Workflow - Aprovação de Projeto Arquitetônico',
    description: 'Fluxo para análise e aprovação de projetos arquitetônicos',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentação técnica',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Arquitetônico', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Verificação de conformidade com normas',
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
        description: 'Inspeção técnica in loco',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Parecer',
        order: 6,
        description: 'Avaliação do laudo técnico',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 7,
        description: 'Emissão de alvará',
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
    name: 'Workflow - Consulta de Viabilidade Urbanística',
    description: 'Fluxo para análise de viabilidade de empreendimentos',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Documentos',
        order: 2,
        description: 'Verificação de documentação do imóvel',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Matrícula do Imóvel'],
        requiredInputFieldIds: ['endereco', 'area_terreno', 'tipo_empreendimento'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Urbanística',
        order: 4,
        description: 'Verificação de zoneamento e restrições',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Parecer',
        order: 5,
        description: 'Elaboração de relatório técnico',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 6,
        description: 'Emissão de certidão',
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
    name: 'Workflow - Alvará de Construção',
    description: 'Fluxo para emissão de alvará de construção',
    defaultSLA: 45,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentação completa',
        slaDays: 7,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Aprovado', 'ART', 'Matrícula do Imóvel'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Verificação de conformidade técnica',
        slaDays: 15,
        availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Prévia',
        order: 5,
        description: 'Inspeção do terreno',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Taxas',
        order: 6,
        description: 'Cálculo e verificação de taxas',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão do Alvará',
        order: 7,
        description: 'Liberação do alvará de construção',
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
    name: 'Workflow - Denúncia de Construção Irregular',
    description: 'Fluxo para processamento de denúncias de construções irregulares',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recepção e análise da denúncia',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['endereco', 'descricao', 'tipo_irregularidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 2,
        description: 'Verificação e validação dos dados do formulário',
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
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise técnica da irregularidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'gravidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 5,
        description: 'Notificação ao responsável',
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
        description: 'Acompanhamento da regularização',
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

  // ========== SAÚDE ==========
  CAMPANHAS_VACINACAO: {
    moduleType: 'CAMPANHAS_VACINACAO',
    name: 'Workflow - Campanhas de Vacinação',
    description: 'Fluxo para registro de participação em campanhas de vacinação',
    defaultSLA: 1,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        description: 'Cadastro do cidadão na campanha',
        slaDays: 0,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_campanha', 'vacina', 'dose'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aplicação',
        order: 4,
        description: 'Aplicação da vacina',
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
    description: 'Fluxo para controle e dispensação de medicamentos',
    defaultSLA: 3,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Receita',
        order: 2,
        description: 'Verificação da receita médica',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['medicamento', 'dosagem', 'quantidade'],
        requiredDocumentTypes: ['Receita Médica', 'RG ou CPF', 'Cartão SUS'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Estoque',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['disponibilidade', 'local_retirada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Dispensação',
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
    name: 'Workflow - Programas de Saúde',
    description: 'Fluxo para inscrição em programas de saúde',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Documentos',
        order: 2,
        description: 'Verificação de documentação',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['programa', 'unidade_saude'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Médica',
        order: 4,
        description: 'Avaliação da equipe de saúde',
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
        description: 'Efetivação da inscrição',
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

  // ========== SEGURANÇA PÚBLICA ==========
  ALERTA_SEGURANCA: {
    moduleType: 'ALERTA_SEGURANCA',
    name: 'Workflow - Alerta de Segurança',
    description: 'Fluxo para envio de alertas de segurança',
    defaultSLA: 1,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        name: 'Análise e Verificação',
        order: 3,
        description: 'Análise da central de monitoramento',
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
    name: 'Workflow - Autorização de Evento com Segurança',
    description: 'Fluxo para autorização de eventos que requerem esquema de segurança',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Análise do pedido de autorização',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['tipo_evento', 'data_evento', 'publico_esperado', 'local'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Planejamento de Segurança',
        order: 4,
        description: 'Definição do esquema de segurança',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['efetivo_necessario', 'pontos_criticos', 'plano_contingencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria Prévia',
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
        name: 'Emissão de Autorização',
        order: 6,
        description: 'Liberação do evento',
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
    name: 'Workflow - Cadastro de Ponto Crítico',
    description: 'Fluxo para cadastro de pontos críticos de segurança',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        description: 'Registro inicial do ponto crítico',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_ocorrencia', 'descricao', 'frequencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Avaliação da equipe de segurança',
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
        description: 'Inclusão no mapa de pontos críticos',
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
    name: 'Workflow - Denúncia Anônima',
    description: 'Fluxo para tratamento de denúncias anônimas',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        description: 'Classificação da denúncia',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_denuncia', 'gravidade', 'encaminhamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Investigação Preliminar',
        order: 4,
        description: 'Verificação inicial das informações',
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
        description: 'Envio ao órgão competente',
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
    name: 'Workflow - Laudo de Vistoria de Segurança',
    description: 'Fluxo para emissão de laudo de vistoria de segurança',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Análise do pedido de vistoria',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['tipo_vistoria', 'finalidade'],
        requiredDocumentTypes: ['Alvará de Funcionamento', 'CNPJ'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        name: 'Realização da Vistoria',
        order: 5,
        description: 'Execução da vistoria in loco',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['itens_verificados', 'conformidades', 'nao_conformidades'],
        requiredDocumentTypes: ['Alvará de Funcionamento', 'CNPJ'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Emissão de Laudo',
        order: 6,
        description: 'Elaboração e emissão do laudo',
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
    name: 'Workflow - Registro de Ocorrência',
    description: 'Fluxo para registro de ocorrências de segurança',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        description: 'Registro da ocorrência',
        slaDays: 0,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_ocorrencia', 'descricao', 'data_hora'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Classificação',
        order: 4,
        description: 'Classificação da ocorrência',
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
        description: 'Atendimento da ocorrência',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['equipe_responsavel', 'providencias_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Finalização',
        order: 6,
        description: 'Conclusão do atendimento',
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
    name: 'Workflow - Solicitação de Câmera de Segurança',
    description: 'Fluxo para solicitação de instalação de câmeras de segurança',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Análise da demanda',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['justificativa', 'local_proposto', 'area_cobertura'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        description: 'Análise técnica e financeira',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['viabilidade_tecnica', 'custos', 'prioridade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Orçamentária',
        order: 5,
        description: 'Aprovação de recursos',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['orcamento_aprovado', 'previsao_instalacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Instalação',
        order: 6,
        description: 'Instalação da câmera',
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
    name: 'Workflow - Solicitação de Patrulhamento',
    description: 'Fluxo para solicitação de patrulhamento em área específica',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Solicitação',
        order: 2,
        description: 'Análise da demanda',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_solicitada', 'motivo', 'periodo_desejado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Operacional',
        order: 4,
        description: 'Avaliação da equipe operacional',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['viabilidade', 'frequencia_patrulha', 'efetivo_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Implementação',
        order: 5,
        description: 'Início do patrulhamento',
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

  // ========== SERVIÇOS PÚBLICOS ==========
  DESOBSTRUCAO_BUEIRO: {
    moduleType: 'DESOBSTRUCAO_BUEIRO',
    name: 'Workflow - Desobstrução de Bueiro',
    description: 'Fluxo para solicitação de desobstrução de bueiros',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['descricao_problema', 'nivel_obstrucao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        description: 'Vistoria técnica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_vistoria', 'equipamentos_necessarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Execução',
        order: 5,
        description: 'Desobstrução do bueiro',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_execucao', 'equipe_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação',
        order: 6,
        description: 'Confirmação do serviço',
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
    name: 'Workflow - Iluminação Pública',
    description: 'Fluxo para solicitação de reparo ou instalação de iluminação pública',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_solicitacao', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 4,
        description: 'Avaliação técnica do local',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['diagnostico', 'materiais_necessarios'],
        requiredDocumentTypes: ['Foto do Problema'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Execução',
        order: 5,
        description: 'Realização do serviço',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_execucao', 'equipe'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação',
        order: 6,
        description: 'Verificação do funcionamento',
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
    description: 'Fluxo para solicitação de serviços de limpeza urbana',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_limpeza', 'descricao_area'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        description: 'Planejamento da operação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_abrangencia', 'recursos_necessarios', 'data_prevista'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Execução',
        order: 5,
        description: 'Realização da limpeza',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_execucao', 'equipe_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação',
        order: 6,
        description: 'Verificação do serviço',
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
    description: 'Fluxo para registro de problemas urbanos com evidência fotográfica',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise do Registro',
        order: 2,
        description: 'Análise da solicitação e fotos',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['tipo_problema', 'descricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Classificação e Encaminhamento',
        order: 4,
        description: 'Classificação e envio ao setor competente',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['categoria', 'setor_responsavel', 'prioridade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Resolução',
        order: 5,
        description: 'Resolução do problema',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_resolucao', 'providencias_tomadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação',
        order: 6,
        description: 'Confirmação da resolução',
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
    name: 'Workflow - Capina e Roçagem',
    description: 'Fluxo para solicitação de capina e roçagem',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
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
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_servico', 'descricao_area'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        description: 'Planejamento da operação',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_prevista', 'equipe', 'recursos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Execução',
        order: 6,
        description: 'Realização do serviço',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'resumo',
        requiredInputFieldIds: ['data_execucao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação',
        order: 7,
        description: 'Verificação do serviço',
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
    name: 'Workflow - Cadastro de Estabelecimento Turístico',
    description: 'Fluxo para cadastro de estabelecimentos turísticos',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Documentos',
        order: 2,
        description: 'Verificação de documentação',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['nome_estabelecimento', 'categoria', 'tipo_servico'],
        requiredDocumentTypes: ['CNPJ', 'Alvará de Funcionamento', 'Contrato Social'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
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
        requiredDocumentTypes: ['CNPJ', 'Alvará de Funcionamento', 'Contrato Social'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Adequações',
        order: 5,
        description: 'Realização de adequações necessárias',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['adequacoes_realizadas'],
        requiredDocumentTypes: ['CNPJ', 'Alvará de Funcionamento', 'Contrato Social'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: true
      },
      {
        name: 'Cadastro',
        order: 6,
        description: 'Efetivação do cadastro',
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
    name: 'Workflow - Cadastro de Guia Turístico',
    description: 'Fluxo para cadastro e credenciamento de guias turísticos',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Documentos',
        order: 2,
        description: 'Verificação de documentação',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['nome_completo', 'idiomas', 'especializacao'],
        requiredDocumentTypes: ['CPF'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Técnica',
        order: 4,
        description: 'Avaliação de qualificação',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['experiencia', 'areas_atuacao', 'avaliacacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Teste Prático',
        order: 5,
        description: 'Realização de teste prático',
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
        description: 'Emissão de credencial',
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
    name: 'Workflow - Registro de Evento Turístico',
    description: 'Fluxo para registro e divulgação de eventos turísticos',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Proposta',
        order: 2,
        description: 'Análise da proposta de evento',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nome_evento', 'tipo', 'data_realizacao', 'publico_esperado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 3,
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,

        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',

        requiredInputFieldIds: [],
        requiredDocumentTypes: [],

        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Turística',
        order: 4,
        description: 'Avaliação do potencial turístico',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relevancia_turistica', 'impacto_esperado', 'apoio_secretaria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cadastro e Divulgação',
        order: 5,
        description: 'Registro no calendário turístico',
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
  description: 'Fluxo urgente para acionamento de sirene de emergência',
  defaultSLA: 1,
  stages: [
    {
      name: 'Recepção Urgente',
      order: 1,
      description: 'Recebimento imediato da solicitação de emergência',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['motivo_acionamento', 'localizacao', 'nivel_risco'],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Autorização',
      order: 2,
      description: 'Autorização pela coordenação de defesa civil',
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
  name: 'Workflow - Registro de Alerta de Emergência',
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
  name: 'Workflow - Remoção Preventiva',
  description: 'Fluxo para remoção preventiva de famílias em área de risco',
  defaultSLA: 2,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Recebimento da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria Técnica',
      order: 2,
      description: 'Avaliação técnica da área de risco',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['nivel_risco', 'parecer_tecnico', 'familias_afetadas'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Autorização',
      order: 3,
      description: 'Autorização da remoção preventiva',
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

// ========== SAÚDE - URGÊNCIA ==========

SOLICITACAO_AMBULANCIA: {
  moduleType: 'SOLICITACAO_AMBULANCIA',
  name: 'Workflow - Solicitação de Ambulância',
  description: 'Fluxo urgente para solicitação de ambulância',
  defaultSLA: 1,
  stages: [
    {
      name: 'Triagem',
      order: 1,
      description: 'Triagem da urgência',
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
      description: 'Despacho da ambulância',
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

// ========== POLÍTICAS PARA MULHERES - URGÊNCIA ==========

SOS_MULHER: {
  moduleType: 'SOS_MULHER',
  name: 'Workflow - SOS Mulher',
  description: 'Fluxo urgente para pedido de ajuda',
  defaultSLA: 1,
  stages: [
    {
      name: 'Acolhimento Imediato',
      order: 1,
      description: 'Acolhimento e avaliação imediata da situação',
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
      description: 'Acionamento da rede de proteção',
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
      description: 'Encaminhamento para serviços especializados',
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

// ========== DENÚNCIAS - FLUXO PADRÃO ==========

DENUNCIA_ADMINISTRATIVA: {
  moduleType: 'DENUNCIA_ADMINISTRATIVA',
  name: 'Workflow - Denúncia de Irregularidade Administrativa',
  description: 'Fluxo para apuração de denúncia administrativa',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da denúncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise Preliminar',
      order: 2,
      description: 'Análise de admissibilidade e classificação',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['tipo_irregularidade', 'setor_responsavel', 'gravidade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Investigação',
      order: 3,
      description: 'Apuração e coleta de provas',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['resultado_investigacao'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Decisão',
      order: 4,
      description: 'Decisão sobre as providências',
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
  name: 'Workflow - Denúncia de Área de Risco',
  description: 'Fluxo para denúncia de área de risco',
  defaultSLA: 3,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da denúncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria Técnica',
      order: 2,
      description: 'Avaliação técnica no local',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['nivel_risco', 'tipo_risco', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Notificação',
      order: 3,
      description: 'Notificação dos responsáveis',
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
      description: 'Monitoramento das providências',
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
  name: 'Workflow - Denúncia de Assédio no Trabalho',
  description: 'Fluxo para denúncia de assédio no ambiente de trabalho',
  defaultSLA: 3,
  stages: [
    {
      name: 'Acolhimento',
      order: 1,
      description: 'Recepção sigilosa da denúncia',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_assedio', 'local_trabalho'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Apuração',
      order: 2,
      description: 'Investigação sigilosa dos fatos',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['relatorio_apuracao'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Decisão',
      order: 3,
      description: 'Decisão sobre medidas a serem tomadas',
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
  name: 'Workflow - Denúncia de Comércio Irregular',
  description: 'Fluxo para denúncia de comércio irregular',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da denúncia',
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
      name: 'Auto de Infração',
      order: 3,
      description: 'Lavratura de auto de infração se procedente',
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
      description: 'Monitoramento da regularização',
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
  name: 'Workflow - Denúncia de Construção em Encosta',
  description: 'Fluxo para denúncia de construção irregular em encosta',
  defaultSLA: 3,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da denúncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria Técnica Urgente',
      order: 2,
      description: 'Avaliação técnica da construção e do risco',
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
      description: 'Embargo da obra se necessário',
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
      description: 'Monitoramento da situação',
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
  name: 'Workflow - Denúncia de Descarte Irregular',
  description: 'Fluxo para denúncia de descarte irregular de lixo',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da denúncia',
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
      name: 'Notificação',
      order: 3,
      description: 'Notificação do responsável para remoção',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Remoção',
      order: 4,
      description: 'Verificação da remoção ou remoção pela prefeitura',
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
  name: 'Workflow - Denúncia de Poluição Sonora',
  description: 'Fluxo para denúncia de poluição sonora',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da denúncia',
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
      description: 'Vistoria com medição sonora',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['nivel_ruido', 'fonte_ruido'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Notificação',
      order: 3,
      description: 'Notificação para adequação',
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
      description: 'Verificação da adequação',
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
  name: 'Workflow - Denúncia de Problema em Sistema',
  description: 'Fluxo para denúncia de problema técnico em sistema',
  defaultSLA: 3,
  stages: [
    {
      name: 'Recepção',
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
      name: 'Análise Técnica',
      order: 2,
      description: 'Análise e diagnóstico do problema',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['diagnostico', 'solucao_proposta'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Correção',
      order: 3,
      description: 'Implementação da correção',
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
  name: 'Workflow - Denúncia de Queimada',
  description: 'Fluxo para denúncia de queimada irregular',
  defaultSLA: 2,
  stages: [
    {
      name: 'Recepção Urgente',
      order: 1,
      description: 'Registro da denúncia',
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
      name: 'Apuração',
      order: 3,
      description: 'Apuração de responsabilidade',
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
  name: 'Workflow - Denúncia Sanitária',
  description: 'Fluxo para denúncia de irregularidade sanitária',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da denúncia',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Inspeção Sanitária',
      order: 2,
      description: 'Inspeção técnica pela vigilância sanitária',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['tipo_irregularidade', 'nivel_gravidade', 'laudo_sanitario'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Auto de Infração',
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
      description: 'Monitoramento da adequação',
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
  name: 'Workflow - Denúncia de Transporte Clandestino',
  description: 'Fluxo para denúncia de transporte clandestino',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da denúncia',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_veiculo', 'localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Fiscalização',
      order: 2,
      description: 'Fiscalização no local',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['situacao_encontrada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Auto de Infração',
      order: 3,
      description: 'Lavratura de auto e apreensão se necessário',
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
  name: 'Workflow - Denúncia de Veículo Abandonado',
  description: 'Fluxo para denúncia de veículo abandonado',
  defaultSLA: 7,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da denúncia',
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
      description: 'Vistoria e identificação do veículo',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['placa', 'condicoes_veiculo'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Notificação',
      order: 3,
      description: 'Notificação do proprietário',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Remoção',
      order: 4,
      description: 'Remoção do veículo',
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
  name: 'Workflow - Denúncia de Violência contra a Mulher',
  description: 'Fluxo urgente para denúncia de violência',
  defaultSLA: 2,
  stages: [
    {
      name: 'Acolhimento Urgente',
      order: 1,
      description: 'Recepção sigilosa e acolhimento',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['situacao_risco', 'tipo_violencia'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Acionamento Rede Proteção',
      order: 2,
      description: 'Acionamento imediato da rede de proteção',
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
      description: 'Acompanhamento da vítima',
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
  name: 'Workflow - Denúncia de Violência Doméstica',
  description: 'Fluxo urgente para denúncia de violência doméstica',
  defaultSLA: 2,
  stages: [
    {
      name: 'Acolhimento Urgente',
      order: 1,
      description: 'Recepção sigilosa e acolhimento',
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
      description: 'Acionamento de polícia e rede de proteção',
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
      description: 'Acompanhamento da vítima e família',
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

// ========== SERVIÇOS DE LIMPEZA E MANUTENÇÃO URBANA ==========

COLETA_ELETRONICO: {
  moduleType: 'COLETA_ELETRONICO',
  name: 'Workflow - Coleta de Lixo Eletrônico',
  description: 'Fluxo para solicitação de coleta de lixo eletrônico',
  defaultSLA: 7,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      name: 'Execução',
      order: 3,
      description: 'Realização da coleta',
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
  name: 'Workflow - Solicitação de Contentor de Lixo',
  description: 'Fluxo para solicitação de contentor de lixo',
  defaultSLA: 10,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'capacidade_solicitada'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise Técnica',
      order: 2,
      description: 'Avaliação da viabilidade e local',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'viabilidade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação pela coordenação',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Instalação',
      order: 4,
      description: 'Instalação do contentor',
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
  name: 'Workflow - Dedetização e Controle de Pragas',
  description: 'Fluxo para solicitação de dedetização',
  defaultSLA: 7,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      description: 'Vistoria para avaliar a situação',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['nivel_infestacao', 'tratamento_recomendado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 3,
      description: 'Realização do serviço',
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
  description: 'Fluxo para solicitação de limpeza de boca de lobo',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Programação',
      order: 2,
      description: 'Programação do serviço na rota',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_prevista'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 3,
      description: 'Realização da limpeza',
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
  description: 'Fluxo para solicitação de limpeza de feira livre',
  defaultSLA: 3,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'dia_feira'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Programação',
      order: 2,
      description: 'Programação da equipe',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['equipe_responsavel', 'horario'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 3,
      description: 'Realização da limpeza',
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
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      description: 'Vistoria e identificação do proprietário',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['situacao_terreno', 'proprietario_identificado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Notificação',
      order: 3,
      description: 'Notificação do proprietário',
      slaDays: 5,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'comunicacao',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 4,
      description: 'Limpeza pela prefeitura ou verificação',
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
  name: 'Workflow - Conserto de Calçamento',
  description: 'Fluxo para solicitação de conserto de calçamento',
  defaultSLA: 15,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'extensao_dano'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria Técnica',
      order: 2,
      description: 'Avaliação técnica do dano',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['tipo_intervencao', 'orcamento_estimado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação do serviço',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 4,
      description: 'Realização do conserto',
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
  description: 'Fluxo para solicitação de pintura de meio-fio',
  defaultSLA: 10,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'extensao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise',
      order: 2,
      description: 'Análise da necessidade',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['prioridade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Programação',
      order: 3,
      description: 'Programação na rota de serviços',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_prevista'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 4,
      description: 'Realização da pintura',
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
  name: 'Workflow - Varrição de Rua',
  description: 'Fluxo para solicitação de varrição de rua',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Programação',
      order: 2,
      description: 'Inclusão na rota de varrição',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_prevista'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 3,
      description: 'Realização da varrição',
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
  name: 'Workflow - Remoção de Animal Morto',
  description: 'Fluxo para remoção de animal morto em via pública',
  defaultSLA: 2,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      description: 'Acionamento da equipe de remoção',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['equipe_acionada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 3,
      description: 'Remoção e descarte adequado',
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
  name: 'Workflow - Solicitação de Ecoponto',
  description: 'Fluxo para solicitação de instalação de ecoponto',
  defaultSLA: 30,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      description: 'Análise técnica da viabilidade',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'viabilidade', 'demanda_estimada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação pela coordenação',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Implantação',
      order: 4,
      description: 'Implantação do ecoponto',
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
  name: 'Workflow - Aprovação de Calçada',
  description: 'Fluxo para aprovação de projeto de calçada',
  defaultSLA: 20,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Recebimento da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise Documental',
      order: 2,
      description: 'Verificação dos documentos obrigatórios',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Análise Técnica',
      order: 3,
      description: 'Avaliação do projeto pela engenharia',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'conforme_normas'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação Final',
      order: 4,
      description: 'Aprovação final do projeto',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Emissão de Alvará',
      order: 5,
      description: 'Emissão do alvará de execução',
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
  name: 'Workflow - Aprovação de Muro e Gradil',
  description: 'Fluxo para aprovação de construção de muro',
  defaultSLA: 20,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Recebimento da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise Documental',
      order: 2,
      description: 'Verificação dos documentos obrigatórios',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Análise Técnica',
      order: 3,
      description: 'Avaliação do projeto pela engenharia',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'altura_muro', 'conforme_normas'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação Final',
      order: 4,
      description: 'Aprovação final do projeto',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Emissão de Alvará',
      order: 5,
      description: 'Emissão do alvará de execução',
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
  name: 'Workflow - Aprovação de Terraplanagem',
  description: 'Fluxo para aprovação de projeto de terraplanagem',
  defaultSLA: 25,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Recebimento da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'resumo',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise Documental',
      order: 2,
      description: 'Verificação dos documentos obrigatórios',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Análise Técnica',
      order: 3,
      description: 'Avaliação técnica do projeto',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'impacto_ambiental', 'conformidade_tecnica'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação Ambiental',
      order: 4,
      description: 'Análise de impacto ambiental',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_ambiental'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação Final',
      order: 5,
      description: 'Aprovação final do projeto',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Emissão de Alvará',
      order: 6,
      description: 'Emissão do alvará de terraplanagem',
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
  description: 'Fluxo para vistoria estrutural de edificação',
  defaultSLA: 10,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      name: 'Vistoria Técnica',
      order: 3,
      description: 'Realização da vistoria no local',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['laudo_tecnico', 'situacao_estrutural', 'risco_identificado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Emissão de Laudo',
      order: 4,
      description: 'Emissão do laudo técnico',
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
  name: 'Workflow - Vistoria Técnica de Edificação',
  description: 'Fluxo para vistoria técnica geral',
  defaultSLA: 10,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      description: 'Realização da vistoria',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'conformidade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Emissão de Parecer',
      order: 4,
      description: 'Emissão do parecer técnico',
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
  name: 'Workflow - Manutenção de Jardim Público',
  description: 'Fluxo para manutenção de jardim público',
  defaultSLA: 10,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      name: 'Programação',
      order: 3,
      description: 'Programação do serviço',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_prevista', 'equipe_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 4,
      description: 'Realização da manutenção',
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
  name: 'Workflow - Poda de Árvore em Canteiro',
  description: 'Fluxo para poda de árvore em canteiro central',
  defaultSLA: 10,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'tipo_arvore'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria Técnica',
      order: 2,
      description: 'Avaliação técnica por engenheiro florestal',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['tipo_poda', 'urgencia', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Autorização',
      order: 3,
      description: 'Autorização ambiental',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 4,
      description: 'Realização da poda',
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
  name: 'Workflow - Recuperação de Praça',
  description: 'Fluxo para recuperação de praça pública',
  defaultSLA: 30,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'problemas_identificados'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria Técnica',
      order: 2,
      description: 'Avaliação técnica da praça',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['estado_conservacao', 'intervencoes_necessarias', 'orcamento_estimado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Elaboração de Projeto',
      order: 3,
      description: 'Elaboração do projeto de recuperação',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredInputFieldIds: ['projeto_elaborado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 4,
      description: 'Aprovação do projeto e orçamento',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 5,
      description: 'Realização da recuperação',
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

// ========== TRÂNSITO E MOBILIDADE ==========

RECLAMACAO_TRANSITO: {
  moduleType: 'RECLAMACAO_TRANSITO',
  name: 'Workflow - Reclamação sobre Trânsito',
  description: 'Fluxo para reclamação relacionada ao trânsito',
  defaultSLA: 10,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da reclamação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_reclamacao', 'localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise',
      order: 2,
      description: 'Análise da reclamação',
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
      description: 'Vistoria no local se necessário',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: true
    },
    {
      name: 'Providências',
      order: 4,
      description: 'Implementação das providências',
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
  name: 'Workflow - Reclamação sobre Transporte',
  description: 'Fluxo para reclamação sobre transporte público',
  defaultSLA: 7,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da reclamação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_reclamacao', 'linha_transporte'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise',
      order: 2,
      description: 'Análise da reclamação',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['procedencia', 'providencias_necessarias'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Notificação Concessionária',
      order: 3,
      description: 'Notificação da empresa de transporte',
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
      description: 'Acompanhamento das providências',
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
  name: 'Workflow - Solicitação de Sinalização de Trânsito',
  description: 'Fluxo para solicitação de sinalização',
  defaultSLA: 20,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_sinalizacao', 'localizacao', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Estudo Técnico',
      order: 2,
      description: 'Estudo de viabilidade técnica',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_tecnico', 'viabilidade', 'tipo_sinalizacao_recomendada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação pela coordenação de trânsito',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Implantação',
      order: 4,
      description: 'Implantação da sinalização',
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
  name: 'Workflow - Solicitação de Lombada',
  description: 'Fluxo para solicitação de lombada/redutor de velocidade',
  defaultSLA: 30,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      description: 'Estudo técnico de viabilidade e necessidade',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['estudo_fluxo', 'velocidade_media', 'acidentes_registrados', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação pela coordenação de trânsito',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Implantação',
      order: 4,
      description: 'Implantação da lombada',
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
  name: 'Workflow - Solicitação de Semáforo',
  description: 'Fluxo para solicitação de instalação de semáforo',
  defaultSLA: 60,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      description: 'Estudo técnico completo',
      slaDays: 30,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['contagem_veiculos', 'contagem_pedestres', 'acidentes_registrados', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Análise Orçamentária',
      order: 3,
      description: 'Análise de custos e disponibilidade orçamentária',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['orcamento', 'recurso_disponivel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 4,
      description: 'Aprovação final',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Implantação',
      order: 5,
      description: 'Instalação do semáforo',
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
  name: 'Workflow - Solicitação de Ponto de Ônibus',
  description: 'Fluxo para solicitação de ponto de ônibus',
  defaultSLA: 30,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
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
      description: 'Estudo técnico de viabilidade',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['demanda_estimada', 'viabilidade_local', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação pela coordenação de transporte',
      slaDays: 5,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Implantação',
      order: 4,
      description: 'Instalação do ponto de ônibus',
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
  name: 'Workflow - Sugestão de Nova Linha de Ônibus',
  description: 'Fluxo para sugestão de nova linha de transporte',
  defaultSLA: 60,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da sugestão',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['origem', 'destino', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise Preliminar',
      order: 2,
      description: 'Análise inicial da demanda',
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
      description: 'Estudo técnico completo',
      slaDays: 30,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['estudo_demanda', 'viabilidade_operacional', 'viabilidade_financeira'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 4,
      description: 'Aprovação pela gestão',
      slaDays: 10,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Implantação',
      order: 5,
      description: 'Implantação da nova linha',
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

// ========== SERVIÇOS ADMINISTRATIVOS E ATENDIMENTO ==========

OUVIDORIA: {
  moduleType: 'OUVIDORIA',
  name: 'Workflow - Manifestação na Ouvidoria',
  description: 'Fluxo para manifestações na ouvidoria',
  defaultSLA: 10,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da manifestação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_manifestacao', 'setor_responsavel'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Classificação',
      order: 2,
      description: 'Classificação e encaminhamento',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['classificacao', 'area_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise',
      order: 3,
      description: 'Análise pela área responsável',
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
      description: 'Elaboração e envio de resposta',
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
  name: 'Workflow - Solicitação ao SIC',
  description: 'Fluxo para pedidos de informação ao cidadão',
  defaultSLA: 20,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['informacao_solicitada', 'setor_responsavel'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Classificação',
      order: 2,
      description: 'Classificação e encaminhamento',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['area_responsavel', 'complexidade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Busca de Informação',
      order: 3,
      description: 'Levantamento da informação solicitada',
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
      description: 'Elaboração e envio de resposta',
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
      description: 'Acolhimento inicial do cidadão',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_demanda', 'situacao_familia'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Avaliação Social',
      order: 2,
      description: 'Avaliação pela assistência social',
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
      description: 'Encaminhamento para serviços e programas',
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
  name: 'Workflow - Documentação Civil Gratuita',
  description: 'Fluxo para solicitação de documentação civil',
  defaultSLA: 15,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_documento', 'justificativa_gratuidade'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise Documental',
      order: 2,
      description: 'Verificação de documentos e requisitos',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: ['RG'],
      requiredInputFieldIds: ['situacao_economica_verificada'],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação da gratuidade',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Encaminhamento Cartório',
      order: 4,
      description: 'Encaminhamento ao cartório',
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
      description: 'Acompanhamento da emissão',
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
  name: 'Workflow - Agendamento de Serviços Gerais',
  description: 'Fluxo para agendamento de serviços gerais',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação de agendamento',
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
      description: 'Confirmação do agendamento',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_agendada', 'horario', 'local'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Confirmação',
      order: 3,
      description: 'Confirmação com o cidadão',
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
  name: 'Workflow - Calendário de Coleta Seletiva',
  description: 'Fluxo para consulta de calendário de coleta',
  defaultSLA: 1,
  stages: [
    {
      name: 'Consulta',
      order: 1,
      description: 'Fornecimento de informações sobre coleta',
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
  name: 'Workflow - Consulta de Calendário Escolar',
  description: 'Fluxo para consulta de calendário escolar',
  defaultSLA: 1,
  stages: [
    {
      name: 'Consulta',
      order: 1,
      description: 'Fornecimento do calendário escolar',
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
  name: 'Workflow - Doação para Desabrigados',
  description: 'Fluxo para solicitação de doação para desabrigados',
  defaultSLA: 3,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_necessidade', 'numero_familias', 'localizacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Avaliação',
      order: 1,
      description: 'Avaliação da situação emergencial',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['situacao_verificada', 'itens_necessarios'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Mobilização',
      order: 3,
      description: 'Mobilização de doações',
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
      description: 'Distribuição das doações',
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
  name: 'Workflow - Solicitação de Patrulha Escolar',
  description: 'Fluxo para solicitação de patrulha escolar',
  defaultSLA: 10,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['escola', 'horarios_necessarios', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise',
      order: 2,
      description: 'Análise da necessidade e viabilidade',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['parecer_seguranca', 'viabilidade_operacional'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação pela coordenação de segurança',
      slaDays: 2,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Implementação',
      order: 4,
      description: 'Organização da escala de patrulhamento',
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
  name: 'Workflow - Iluminação para Segurança',
  description: 'Fluxo para solicitação de iluminação pública',
  defaultSLA: 15,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['localizacao', 'justificativa'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Vistoria Técnica',
      order: 2,
      description: 'Avaliação técnica no local',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['situacao_atual', 'tipo_intervencao', 'orcamento'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação pela coordenação',
      slaDays: 3,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      requiredInputFieldIds: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 4,
      description: 'Instalação da iluminação',
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

// ========== CADASTROS E INSCRIÇÕES ==========

CADASTRO_BALCAO_EMPREGOS: {
  moduleType: 'CADASTRO_BALCAO_EMPREGOS',
  name: 'Workflow - Cadastro no Balcão de Empregos',
  description: 'Fluxo para cadastro de candidato a emprego',
  defaultSLA: 3,
  stages: [
    {
      name: 'Recepção',
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
      name: 'Análise de Perfil',
      order: 2,
      description: 'Análise do perfil profissional',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['perfil_mapeado', 'vagas_compativeis'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Ativação',
      order: 3,
      description: 'Ativação do cadastro no sistema',
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
  name: 'Workflow - Cadastro de Câmeras de Segurança',
  description: 'Fluxo para cadastro de câmeras particulares',
  defaultSLA: 7,
  stages: [
    {
      name: 'Recepção',
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
      name: 'Análise Documental',
      order: 2,
      description: 'Verificação de documentos',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: ['Justificativa', 'Projeto ou Memorial', 'Autorização do Responsável'],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Vistoria Técnica',
      order: 3,
      description: 'Vistoria das câmeras cadastradas',
      slaDays: 3,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['qualidade_imagem', 'cobertura_area', 'parecer_tecnico'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 4,
      description: 'Aprovação e inclusão no sistema',
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
  name: 'Workflow - Cadastro em Grupo de WhatsApp de Segurança',
  description: 'Fluxo para cadastro em grupo de vizinhança',
  defaultSLA: 3,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['bairro', 'rua', 'telefone'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Validação',
      order: 2,
      description: 'Validação dos dados e comprovação de residência',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['dados_validados'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Inclusão',
      order: 3,
      description: 'Inclusão no grupo correspondente',
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
  name: 'Workflow - Inscrição em Grupos de Apoio',
  description: 'Fluxo para inscrição em grupos de apoio',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da inscrição',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_grupo', 'necessidade_especifica'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Avaliação',
      order: 2,
      description: 'Avaliação por profissional especializado',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['perfil_participante', 'grupo_recomendado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Inclusão',
      order: 3,
      description: 'Inclusão no grupo',
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
  name: 'Workflow - Inscrição em Cursos de Qualificação',
  description: 'Fluxo para inscrição em cursos de qualificação profissional',
  defaultSLA: 7,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da inscrição',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['curso_interesse', 'escolaridade', 'disponibilidade'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise Documental',
      order: 2,
      description: 'Verificação de documentos e requisitos',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Análise de Perfil',
      order: 3,
      description: 'Verificação de adequação ao curso',
      slaDays: 2,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['perfil_adequado', 'curso_compativel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Matrícula',
      order: 4,
      description: 'Efetivação da matrícula',
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
  name: 'Workflow - Inscrição em Hackathon',
  description: 'Fluxo para inscrição em hackathon/desafio de inovação',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da inscrição',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['nome_equipe', 'membros', 'area_interesse'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise Documental',
      order: 2,
      description: 'Verificação de documentos',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
      primaryTab: 'documentos',
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Validação',
      order: 3,
      description: 'Validação da inscrição',
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
  name: 'Workflow - Inscrição em Oficinas e Workshops',
  description: 'Fluxo para inscrição em oficinas e workshops',
  defaultSLA: 5,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da inscrição',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['oficina_interesse', 'faixa_etaria'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Verificação de Vagas',
      order: 2,
      description: 'Verificação de disponibilidade de vagas',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['vagas_disponiveis', 'turma_alocada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Confirmação',
      order: 3,
      description: 'Confirmação da inscrição',
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
      name: 'Recepção',
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
      description: 'Confirmação de data e horário',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['data_agendada', 'horario', 'profissional_responsavel'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Confirmação',
      order: 3,
      description: 'Confirmação com o empreendedor',
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
      name: 'Geração de Guia',
      order: 1,
      description: 'Geração da guia de pagamento',
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
      name: 'Geração de Guia',
      order: 1,
      description: 'Geração da guia de pagamento',
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
      name: 'Geração de Guia',
      order: 1,
      description: 'Geração da guia de pagamento',
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

// ========== DESENVOLVIMENTO ECONÔMICO E CONSULTORIAS ==========

ATRACAO_EMPRESAS: {
  moduleType: 'ATRACAO_EMPRESAS',
  name: 'Workflow - Atração de Empresas e Investimentos',
  description: 'Fluxo para atração de empresas',
  defaultSLA: 30,
  stages: [
    {
      name: 'Recepção',
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
      name: 'Análise Preliminar',
      order: 2,
      description: 'Análise do perfil da empresa',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['viabilidade', 'incentivos_aplicaveis'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Elaboração de Proposta',
      order: 3,
      description: 'Elaboração de proposta de incentivos',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
      primaryTab: 'documentos-gerados',
      requiredInputFieldIds: ['proposta_elaborada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Negociação',
      order: 4,
      description: 'Negociação com a empresa',
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
  name: 'Workflow - Solicitação de Consultoria Empresarial',
  description: 'Fluxo para solicitação de consultoria',
  defaultSLA: 10,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['tipo_consultoria', 'area_necessidade', 'descricao_problema'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise',
      order: 2,
      description: 'Análise da demanda',
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
      description: 'Realização da consultoria',
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
  name: 'Workflow - Orientação para Economia Criativa',
  description: 'Fluxo para orientação em economia criativa',
  defaultSLA: 7,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da solicitação',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['area_criativa', 'tipo_orientacao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise de Perfil',
      order: 2,
      description: 'Análise do perfil do empreendedor criativo',
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
      name: 'Orientação',
      order: 4,
      description: 'Realização da orientação',
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

// ========== SUGESTÕES E SUPORTE TÉCNICO ==========

SUGESTAO_MELHORIA: {
  moduleType: 'SUGESTAO_MELHORIA',
  name: 'Workflow - Sugestão de Melhoria em Sistemas',
  description: 'Fluxo para sugestão de melhoria',
  defaultSLA: 15,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Registro da sugestão',
      slaDays: 1,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredInputFieldIds: ['sistema_afetado', 'descricao_sugestao'],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Análise Técnica',
      order: 2,
      description: 'Análise de viabilidade técnica',
      slaDays: 5,
      availableTabs: ['resumo', 'dados', 'comunicacao'],
      primaryTab: 'dados',
      requiredInputFieldIds: ['viabilidade_tecnica', 'complexidade', 'prioridade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação para implementação',
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
      description: 'Planejamento da implementação',
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
  name: 'Workflow - Suporte Técnico em Sistemas',
  description: 'Fluxo para suporte técnico',
  defaultSLA: 3,
  stages: [
    {
      name: 'Recepção',
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
      description: 'Classificação e priorização',
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
      description: 'Atendimento e resolução',
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

  // ========== EDUCAÇÃO ==========
  RECLAMACAO_TRANSPORTE_ESCOLAR: {
    moduleType: 'RECLAMACAO_TRANSPORTE_ESCOLAR',
    name: 'Workflow - Reclamação sobre Transporte Escolar',
    description: 'Fluxo para registro e resolução de reclamações sobre transporte escolar',
    defaultSLA: 3,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da reclamação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nomeAluno', 'unidadeEscolar', 'tipoProblema', 'descricaoProblema'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise',
        order: 2,
        description: 'Análise da reclamação e verificação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Providências',
        order: 3,
        description: 'Tomada de providências',
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
    name: 'Workflow - Reclamação sobre Transporte Público',
    description: 'Fluxo para registro e resolução de reclamações sobre transporte público',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da reclamação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipoReclamacao', 'linha', 'descricao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise',
        order: 2,
        description: 'Análise da reclamação',
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
        description: 'Encaminhamento para empresa responsável',
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
        description: 'Retorno e providências tomadas',
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
  // ========== EDUCAÇÃO (continuação) ==========
  INSCRICAO_EJA: {
    moduleType: 'INSCRICAO_EJA',
    name: 'Workflow - Inscrição em EJA',
    description: 'Fluxo para inscrição em Educação de Jovens e Adultos',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['idadeAluno', 'ultimaSerieCompleta', 'escolaPreferencial'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Pedagógica',
        order: 3,
        description: 'Avaliação pedagógica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nivel_sugerido', 'escola_destino'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Matrícula',
        order: 4,
        description: 'Efetivação da matrícula',
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
        name: 'Conclusão',
        order: 5,
        description: 'Matrícula concluída',
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
    name: 'Workflow - Consulta de Calendário Escolar',
    description: 'Fluxo simplificado para consulta de calendário escolar',
    defaultSLA: 1,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        description: 'Envio de calendário',
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
    name: 'Workflow - Alvará de Funcionamento (Planejamento Urbano)',
    description: 'Fluxo para emissão de alvará de funcionamento sob aspecto urbanístico',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'Laudo Técnico', 'Comprovante de Endereço'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Urbanística',
        order: 3,
        description: 'Análise de conformidade com legislação urbanística',
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
        name: 'Aprovação Final',
        order: 5,
        description: 'Aprovação e emissão do alvará',
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
        name: 'Conclusão',
        order: 6,
        description: 'Protocolo concluído',
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

  // ========== ASSISTÊNCIA SOCIAL ==========
  ATENDIMENTO_CRAS: {
    moduleType: 'ATENDIMENTO_CRAS',
    name: 'Workflow - Atendimento no CRAS',
    description: 'Fluxo para atendimento no Centro de Referência de Assistência Social',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Social',
        order: 2,
        description: 'Avaliação socioeconômica',
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
        description: 'Encaminhamento para serviços',
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
    name: 'Workflow - Auxílio Emergencial',
    description: 'Fluxo para concessão de auxílio emergencial',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_emergencia', 'descricao_situacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Endereço'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Social',
        order: 3,
        description: 'Avaliação da situação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'valor_sugerido'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do benefício',
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
    name: 'Workflow - Cadastro Único',
    description: 'Fluxo para cadastramento no CadÚnico',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
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
        description: 'Entrevista socioeconômica',
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
        description: 'Inclusão no sistema',
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
    name: 'Workflow - Inscrição em Programa Social',
    description: 'Fluxo para inscrição em programas sociais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['programa_escolhido'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CadÚnico', 'Documentos Pessoais'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 3,
        description: 'Verificação de requisitos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos', 'parecer'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Inclusão',
        order: 4,
        description: 'Inclusão no programa',
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
        name: 'Conclusão',
        order: 5,
        description: 'Inscrição concluída',
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
    name: 'Workflow - Solicitação de Benefício',
    description: 'Fluxo para solicitação de benefícios assistenciais',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_beneficio'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
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
        description: 'Visita técnica',
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
        description: 'Elaboração de parecer',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'recomendacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do benefício',
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
        name: 'Conclusão',
        order: 6,
        description: 'Benefício concedido',
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
    description: 'Fluxo para agendamento e realização de visita domiciliar',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Realização',
        order: 3,
        description: 'Realização da visita',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_visita', 'conclusoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
        order: 4,
        description: 'Finalização',
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
    name: 'Workflow - Inscrição em Grupo ou Oficina',
    description: 'Fluxo para inscrição em grupos e oficinas sociais',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_oficina', 'turno_preferencial'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 2,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 3,
        description: 'Confirmação da inscrição',
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
        name: 'Conclusão',
        order: 4,
        description: 'Inscrição efetivada',
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
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 3,
        description: 'Aprovação do cadastro',
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
        name: 'Conclusão',
        order: 4,
        description: 'Cadastro concluído',
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
    description: 'Fluxo para cadastramento e aprovação de eventos culturais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise de Projeto',
        order: 2,
        description: 'Análise do projeto cultural',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 3,
        description: 'Aprovação do evento',
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
        name: 'Conclusão',
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
    name: 'Workflow - Inscrição em Oficina Cultural',
    description: 'Fluxo para inscrição em oficinas culturais',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['oficina_escolhida', 'turma_preferencial'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 2,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 3,
        description: 'Confirmação da inscrição',
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
        name: 'Conclusão',
        order: 4,
        description: 'Inscrição efetivada',
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
    name: 'Workflow - Reserva de Espaço Cultural',
    description: 'Fluxo para reserva de espaços culturais',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['espaco_solicitado', 'data_reserva', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação de Disponibilidade',
        order: 2,
        description: 'Verificação de agenda',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['disponibilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Projeto',
        order: 3,
        description: 'Análise da proposta',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da reserva',
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
        name: 'Conclusão',
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
    description: 'Fluxo para aprovação de projetos culturais e captação de recursos',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Detalhado', 'Orçamento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Avaliação técnica do projeto',
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
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação final',
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
        name: 'Conclusão',
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
    description: 'Fluxo para solicitação de apoio a eventos culturais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_apoio', 'nome_evento'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Viabilidade',
        order: 2,
        description: 'Análise de viabilidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_viabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 3,
        description: 'Aprovação do apoio',
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
        name: 'Conclusão',
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
    name: 'Workflow - Cadastro de Grupo Artístico',
    description: 'Fluxo para cadastramento de grupos artísticos',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Portfólio do Grupo'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 3,
        description: 'Aprovação do cadastro',
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
        name: 'Conclusão',
        order: 4,
        description: 'Cadastro concluído',
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
    name: 'Workflow - Registro de Manifestação Cultural',
    description: 'Fluxo para registro de manifestações culturais tradicionais',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da manifestação',
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
        description: 'Pesquisa histórica e cultural',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_pesquisa'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação',
        order: 3,
        description: 'Validação técnica',
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
        name: 'Conclusão',
        order: 5,
        description: 'Manifestação registrada',
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
        name: 'Recepção',
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
        description: 'Prestação do atendimento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resposta'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
        order: 3,
        description: 'Atendimento concluído',
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
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Atestado Médico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 3,
        description: 'Aprovação do cadastro',
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
        name: 'Conclusão',
        order: 4,
        description: 'Cadastro concluído',
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
    name: 'Workflow - Inscrição em Competição',
    description: 'Fluxo para inscrição em competições esportivas',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['competicao', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação',
        order: 2,
        description: 'Verificação de elegibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['elegivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 3,
        description: 'Confirmação da inscrição',
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
        name: 'Conclusão',
        order: 4,
        description: 'Inscrição efetivada',
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
    name: 'Workflow - Inscrição em Escolinha Esportiva',
    description: 'Fluxo para inscrição em escolinhas esportivas',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['modalidade', 'turno'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da matrícula',
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
        name: 'Conclusão',
        order: 5,
        description: 'Matrícula efetivada',
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
    name: 'Workflow - Reserva de Espaço Esportivo',
    description: 'Fluxo para reserva de espaços esportivos',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['espaco_solicitado', 'data_reserva', 'horario'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação de Disponibilidade',
        order: 2,
        description: 'Verificação de agenda',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['disponibilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 3,
        description: 'Confirmação da reserva',
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
        name: 'Conclusão',
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

  // ========== HABITAÇÃO ==========
  REGULARIZACAO_FUNDIARIA: {
    moduleType: 'REGULARIZACAO_FUNDIARIA',
    name: 'Workflow - Regularização Fundiária',
    description: 'Fluxo para regularização de imóvel',
    defaultSLA: 60,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e protocolo da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentação obrigatória',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura (se possuir)', 'IPTU', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 3,
        description: 'Vistoria no imóvel para levantamento',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'area_medida', 'confrontantes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Análise Jurídica',
        order: 4,
        description: 'Análise jurídica da situação do imóvel',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_juridico', 'viabilidade_regularizacao', 'tipo_regularizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Elaboração de Documentação',
        order: 5,
        description: 'Elaboração de plantas e memorial descritivo',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['planta_elaborada', 'memorial_descritivo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 6,
        description: 'Aprovação e encaminhamento para registro',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['aprovado_por', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Documentos',
        order: 7,
        description: 'Emissão de documentos de regularização',
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
        name: 'Conclusão',
        order: 8,
        description: 'Processo concluído',
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
    name: 'Workflow - Inscrição em Programa Habitacional',
    description: 'Fluxo para inscrição em programas habitacionais (MCMV, Casa Verde e Amarela)',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['programaInteresse', 'rendaFamiliarTotal', 'numeroMoradores', 'situacaoAtual'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos obrigatórios',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico', 'Comprovante de Endereço'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação da situação socioeconômica da família',
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
        description: 'Visita técnica ao domicílio',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'condicoes_moradia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 5,
        description: 'Verificação de critérios de elegibilidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'justificativa_elegibilidade', 'faixa_renda'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação e Classificação',
        order: 6,
        description: 'Aprovação e classificação na lista de espera',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['posicao_lista', 'pontuacao_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Comprovante',
        order: 7,
        description: 'Emissão de comprovante de inscrição',
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
        name: 'Conclusão',
        order: 8,
        description: 'Inscrição concluída',
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
    name: 'Workflow - Solicitação de Auxílio Aluguel',
    description: 'Fluxo para concessão de auxílio moradia temporário',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['motivoSolicitacao', 'descricaoSituacao', 'valorAluguel'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'Declaração de Vulnerabilidade'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Técnica',
        order: 3,
        description: 'Visita técnica para avaliação da situação',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'situacao_confirmada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Social',
        order: 4,
        description: 'Avaliação socioeconômica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'renda_per_capita', 'grau_vulnerabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Técnica',
        order: 5,
        description: 'Aprovação técnica do benefício',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['valor_aprovado', 'prazo_beneficio', 'condicoes_beneficio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Gestão',
        order: 6,
        description: 'Aprovação final pela gestão',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Portaria',
        order: 7,
        description: 'Emissão de portaria de concessão',
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
        name: 'Conclusão',
        order: 8,
        description: 'Benefício concedido',
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
    name: 'Workflow - Autorização para Construção',
    description: 'Fluxo para autorização de construção em lote regularizado',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos obrigatórios',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Arquitetônico', 'ART (Anotação de Responsabilidade Técnica)', 'Matrícula do Imóvel'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica de Projeto',
        order: 3,
        description: 'Análise técnica do projeto arquitetônico',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'conformidade_codigo_obras', 'conformidade_zoneamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Urbanística',
        order: 4,
        description: 'Verificação de conformidade urbanística',
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
        name: 'Emissão de Autorização',
        order: 6,
        description: 'Emissão do alvará de construção',
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
        name: 'Conclusão',
        order: 7,
        description: 'Autorização concedida',
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
    description: 'Fluxo para solicitação de vistoria técnica habitacional',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['motivoVistoria', 'descricaoSolicitacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Endereço'],
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
        name: 'Realização da Vistoria',
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
        name: 'Elaboração de Laudo',
        order: 5,
        description: 'Elaboração do laudo técnico',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['laudo_tecnico', 'conclusao', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Laudo',
        order: 6,
        description: 'Emissão do laudo técnico',
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
        name: 'Conclusão',
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
    name: 'Workflow - Inscrição MCMV Municipal',
    description: 'Fluxo para inscrição no programa municipal Minha Casa Minha Vida',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['rendaFamiliarTotal', 'numeroMoradores', 'faixaRenda', 'inscritoCadUnico'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos obrigatórios',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico', 'Comprovante de Endereço', 'Certidão de Casamento (se aplicável)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Cadastros',
        order: 3,
        description: 'Verificação em bases de dados',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['possui_imovel_cadastro', 'situacao_cadunico', 'pendencias_encontradas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 4,
        description: 'Avaliação socioeconômica',
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
        description: 'Visita técnica',
        slaDays: 8,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'condicoes_moradia_atual'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Classificação Final',
        order: 6,
        description: 'Classificação e pontuação final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['pontuacao_final', 'posicao_lista', 'faixa_enquadramento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Comprovante',
        order: 7,
        description: 'Emissão de comprovante de inscrição',
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
        name: 'Conclusão',
        order: 8,
        description: 'Inscrição concluída',
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
    name: 'Workflow - Regularização de Posse',
    description: 'Fluxo para regularização de posse de terreno ou imóvel',
    defaultSLA: 90,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento da solicitação',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['enderecoImovel', 'areaTerreno', 'tempoPosse'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Ocupação', 'Declaração de Posse', 'Croqui do Terreno'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Análise Jurídica',
        order: 4,
        description: 'Análise jurídica da posse',
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
        description: 'Pesquisa em cartório e cadastros',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resultado_pesquisa_cartorio', 'proprietario_registrado', 'onus_reais'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Elaboração de Planta e Memorial',
        order: 6,
        description: 'Elaboração de documentos técnicos',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['planta_elaborada', 'memorial_descritivo', 'art_profissional'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 7,
        description: 'Aprovação e encaminhamento',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['aprovado_por', 'data_aprovacao', 'tipo_regularizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Documentos',
        order: 8,
        description: 'Emissão de certidão ou título',
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
        name: 'Conclusão',
        order: 9,
        description: 'Processo concluído',
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
    name: 'Workflow - Usucapião Urbano',
    description: 'Fluxo para solicitação de usucapião de imóvel urbano',
    defaultSLA: 180,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recebimento da solicitação',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['enderecoImovel', 'areaTotal', 'tempoPosse', 'tipoUsucapiao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental Inicial',
        order: 2,
        description: 'Verificação de documentos obrigatórios',
        slaDays: 15,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Declaração de Posse Mansa e Pacífica', 'Comprovantes de Residência', 'Declaração de Testemunhas'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 3,
        description: 'Vistoria e levantamento topográfico',
        slaDays: 30,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_tecnico', 'area_medida', 'limites_confrontantes', 'benfeitorias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Jurídica Preliminar',
        order: 4,
        description: 'Análise jurídica inicial',
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
        description: 'Pesquisa em cartórios e registros',
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
        name: 'Parecer Técnico Final',
        order: 7,
        description: 'Elaboração de parecer técnico final',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'planta_situacao', 'memorial_descritivo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Jurídica Final',
        order: 8,
        description: 'Análise jurídica conclusiva',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_juridico_final', 'conclusao_usucapiao', 'recomendacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Gestão',
        order: 9,
        description: 'Aprovação pela gestão',
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
        description: 'Preparação e encaminhamento ao Judiciário',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['processo_judicial', 'data_encaminhamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
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
    name: 'Workflow - Solicitação de Máquinas Agrícolas',
    description: 'Fluxo para solicitação de uso de máquinas e equipamentos agrícolas',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipoMaquina', 'dataDesejada', 'areaTrabalho'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Disponibilidade',
        order: 3,
        description: 'Verificação de máquinas disponíveis',
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
        description: 'Agendamento do serviço',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_agendada', 'operador_responsavel', 'horario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Execução',
        order: 5,
        description: 'Execução do serviço',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_execucao', 'horas_trabalhadas', 'area_efetiva'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
        order: 6,
        description: 'Serviço concluído',
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
    name: 'Workflow - Inscrição na Feira do Produtor',
    description: 'Fluxo para inscrição em feira municipal de produtores',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_produtos', 'quantidade_estimada'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Avaliação dos produtos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['produtos_aprovados', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Alocação de Espaço',
        order: 4,
        description: 'Definição de espaço na feira',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_barraca', 'localizacao', 'tamanho_espaco'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Credencial',
        order: 5,
        description: 'Emissão de credencial',
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
        name: 'Conclusão',
        order: 6,
        description: 'Inscrição concluída',
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
    description: 'Fluxo para solicitação de licença ambiental',
    defaultSLA: 60,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos obrigatórios',
        slaDays: 10,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto', 'Estudo de Impacto Ambiental', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica Preliminar',
        order: 3,
        description: 'Análise técnica inicial do projeto',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_preliminar', 'classificacao_impacto', 'necessita_eia_rima'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Parecer Técnico',
        order: 5,
        description: 'Elaboração de parecer técnico',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico_final', 'viabilidade_ambiental', 'condicoes_licenca'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Gestão',
        order: 6,
        description: 'Aprovação pela gestão ambiental',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'tipo_licenca', 'validade_licenca'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Licença',
        order: 7,
        description: 'Emissão da licença ambiental',
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
        name: 'Conclusão',
        order: 8,
        description: 'Licença emitida',
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
    name: 'Workflow - Autorização para Poda ou Supressão de Árvores',
    description: 'Fluxo para autorização de poda ou corte de árvores',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipoSolicitacao', 'localArvore', 'quantidadeArvores'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Propriedade', 'Fotos do Local'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Parecer Técnico',
        order: 4,
        description: 'Elaboração de parecer',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'tipo_intervencao_recomendada', 'compensacao_ambiental'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_autorizacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 6,
        description: 'Emissão do documento de autorização',
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
        name: 'Conclusão',
        order: 7,
        description: 'Autorização emitida',
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

  // ========== SAÚDE (complementares) ==========
  AGENDAMENTO_CONSULTA: {
    moduleType: 'AGENDAMENTO_CONSULTA',
    name: 'Workflow - Agendamento de Consulta',
    description: 'Fluxo para agendamento de consultas médicas',
    defaultSLA: 3,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Confirmação',
        order: 3,
        description: 'Confirmação do agendamento',
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
        name: 'Conclusão',
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
    name: 'Workflow - Solicitação de Exames',
    description: 'Fluxo para solicitação de exames médicos',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_exame'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Pedido Médico',
        order: 2,
        description: 'Verificação do pedido médico',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Pedido Médico', 'Cartão SUS'],
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
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação do agendamento',
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
        name: 'Conclusão',
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
    name: 'Workflow - Emissão de Cartão SUS',
    description: 'Fluxo para solicitação de cartão SUS',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CNH', 'CPF', 'Comprovante de Residência'],
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
        name: 'Emissão do Cartão',
        order: 4,
        description: 'Emissão física do cartão',
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
        name: 'Conclusão',
        order: 5,
        description: 'Cartão emitido',
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

  // ========== EDUCAÇÃO (complementares) ==========
  MATRICULA_ESCOLAR: {
    moduleType: 'MATRICULA_ESCOLAR',
    name: 'Workflow - Matrícula Escolar',
    description: 'Fluxo para matrícula em escola municipal',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação de matrícula',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'serie_pretendida', 'escola_preferencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Certidão de Nascimento', 'RG do Responsável', 'Comprovante de Residência', 'Cartão de Vacina'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['escola_disponivel', 'turma_disponivel', 'turno'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Efetivação da Matrícula',
        order: 4,
        description: 'Efetivação no sistema',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_matricula', 'data_inicio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Comprovante',
        order: 5,
        description: 'Emissão de comprovante de matrícula',
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
        name: 'Conclusão',
        order: 6,
        description: 'Matrícula efetivada',
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
    name: 'Workflow - Transferência Escolar',
    description: 'Fluxo para transferência entre escolas municipais',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['escola_origem', 'escola_destino', 'motivo_transferencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 2,
        description: 'Verificação na escola destino',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma_destino'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Pedagógica',
        order: 3,
        description: 'Análise pela coordenação pedagógica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_pedagogico', 'serie_adequada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Efetivação',
        order: 4,
        description: 'Efetivação da transferência',
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
        name: 'Conclusão',
        order: 5,
        description: 'Transferência efetivada',
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
    description: 'Fluxo para solicitação de transporte escolar',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'escola', 'endereco_embarque'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Matrícula', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 3,
        description: 'Verificação de distância e critérios',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['distancia_calculada', 'atende_criterios', 'rota_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Alocação de Rota',
        order: 4,
        description: 'Definição de rota e veículo',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['rota_alocada', 'veiculo', 'ponto_embarque', 'horarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Passe',
        order: 5,
        description: 'Emissão de cartão de transporte',
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
        name: 'Conclusão',
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
    name: 'Workflow - Autorização de Parcelamento do Solo',
    description: 'Fluxo para autorização de loteamento, desmembramento ou remembramento',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos obrigatórios',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'CNPJ (se empresa)', 'Matrícula do Imóvel', 'Projeto de Parcelamento', 'ART do Responsável Técnico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Urbanística',
        order: 3,
        description: 'Análise de conformidade urbanística',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['conformidade_plano_diretor', 'conformidade_zoneamento', 'conformidade_lei_parcelamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Infraestrutura',
        order: 4,
        description: 'Análise de infraestrutura necessária',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['infraestrutura_agua', 'infraestrutura_esgoto', 'infraestrutura_drenagem', 'infraestrutura_energia', 'pavimentacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Parecer Técnico',
        order: 5,
        description: 'Elaboração de parecer técnico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'viabilidade', 'condicoes_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 7,
        description: 'Emissão do alvará de parcelamento',
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
        name: 'Conclusão',
        order: 8,
        description: 'Autorização emitida',
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

  // ========== AGRICULTURA (continuação) ==========
  CADASTRO_PROPRIEDADE_RURAL: {
    moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
    name: 'Workflow - Cadastro de Propriedade Rural',
    description: 'Fluxo para cadastramento de propriedade rural',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura ou Contrato', 'CAR - Cadastro Ambiental Rural (opcional)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        description: 'Inclusão no cadastro municipal',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cadastro', 'data_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 5,
        description: 'Emissão de certificado de cadastro',
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
        name: 'Conclusão',
        order: 6,
        description: 'Cadastro concluído',
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
    name: 'Workflow - Inscrição em Programa Rural',
    description: 'Fluxo para inscrição em programas de desenvolvimento rural',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['programa_escolhido'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 3,
        description: 'Verificação de critérios',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Técnica',
        order: 4,
        description: 'Visita à propriedade',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da inscrição',
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
        name: 'Conclusão',
        order: 6,
        description: 'Inscrição efetivada',
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
    name: 'Workflow - Licença para Eventos Rurais',
    description: 'Fluxo para autorização de eventos em áreas rurais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_evento', 'data_evento', 'local_evento', 'publico_esperado'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
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
        description: 'Vistoria técnica no local',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_local', 'adequacao_evento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Parecer Técnico',
        order: 4,
        description: 'Elaboração de parecer',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Licença',
        order: 5,
        description: 'Emissão da autorização',
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
        name: 'Conclusão',
        order: 6,
        description: 'Licença emitida',
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
    name: 'Workflow - Análise de Solo',
    description: 'Fluxo para solicitação de análise de solo',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise Laboratorial',
        order: 4,
        description: 'Análise em laboratório',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_analise', 'laboratorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Elaboração de Laudo',
        order: 5,
        description: 'Elaboração do laudo técnico',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['resultado_analise', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Laudo',
        order: 6,
        description: 'Emissão do laudo',
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
        name: 'Conclusão',
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
        name: 'Recepção',
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
        name: 'Análise Técnica',
        order: 2,
        description: 'Análise da demanda',
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
        description: 'Prestação do atendimento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resposta'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
        order: 4,
        description: 'Atendimento concluído',
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
    name: 'Workflow - Assistência Técnica Rural',
    description: 'Fluxo para assistência técnica a produtores rurais',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        description: 'Classificação da demanda',
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
        description: 'Agendamento da visita técnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'hora_visita'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Visita Técnica',
        order: 4,
        description: 'Realização da visita',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_realizada', 'relatorio_visita', 'diagnostico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Elaboração de Plano',
        order: 5,
        description: 'Elaboração de plano de ação',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['plano_acao', 'recomendacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
        order: 6,
        description: 'Assistência prestada',
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

  // ========== ESPORTES (continuação) ==========
  INSCRICAO_ESCOLINHA_FUTEBOL: {
    moduleType: 'INSCRICAO_ESCOLINHA_FUTEBOL',
    name: 'Workflow - Inscrição em Escolinha de Futebol',
    description: 'Fluxo para inscrição em escolinha de futebol',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da matrícula',
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
        name: 'Conclusão',
        order: 5,
        description: 'Matrícula efetivada',
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
    name: 'Workflow - Inscrição em Escolinha de Vôlei',
    description: 'Fluxo para inscrição em escolinha de vôlei',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado Médico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da matrícula',
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
        name: 'Conclusão',
        order: 5,
        description: 'Matrícula efetivada',
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
    name: 'Workflow - Inscrição em Escolinha de Basquete',
    description: 'Fluxo para inscrição em escolinha de basquete',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado Médico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da matrícula',
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
        name: 'Conclusão',
        order: 5,
        description: 'Matrícula efetivada',
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
    name: 'Workflow - Inscrição em Escolinha de Natação',
    description: 'Fluxo para inscrição em escolinha de natação',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'nivel_natacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado Médico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma', 'horario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da matrícula',
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
        name: 'Conclusão',
        order: 5,
        description: 'Matrícula efetivada',
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
    name: 'Workflow - Inscrição em Escolinha de Judô',
    description: 'Fluxo para inscrição em escolinha de judô',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'faixa_atual'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado Médico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da matrícula',
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
        name: 'Conclusão',
        order: 5,
        description: 'Matrícula efetivada',
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
    name: 'Workflow - Inscrição em Escolinha de Ginástica',
    description: 'Fluxo para inscrição em escolinha de ginástica',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado Médico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da matrícula',
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
        name: 'Conclusão',
        order: 5,
        description: 'Matrícula efetivada',
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
    name: 'Workflow - Inscrição em Escolinha de Capoeira',
    description: 'Fluxo para inscrição em escolinha de capoeira',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_aluno', 'idade', 'graduacao_atual'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Atestado Médico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da matrícula',
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
        name: 'Conclusão',
        order: 5,
        description: 'Matrícula efetivada',
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
    description: 'Fluxo para concessão de bolsa atleta',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['modalidade', 'categoria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Histórico Esportivo'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Avaliação do histórico esportivo',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'pontuacao', 'nivel_atleta'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 4,
        description: 'Avaliação socioeconômica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'renda_familiar'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da bolsa',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['valor_bolsa', 'periodo_vigencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Portaria',
        order: 6,
        description: 'Emissão de portaria de concessão',
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
        name: 'Conclusão',
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

  // ========== EDUCAÇÃO (continuação) ==========
  INSCRICAO_CRECHE: {
    moduleType: 'INSCRICAO_CRECHE',
    name: 'Workflow - Inscrição em Creche',
    description: 'Fluxo para inscrição em creche municipal',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_crianca', 'data_nascimento', 'creche_preferencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica da família',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social', 'pontuacao', 'grupo_prioritario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Classificação',
        order: 4,
        description: 'Classificação na lista de espera',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['posicao_lista', 'pontuacao_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Comprovante',
        order: 5,
        description: 'Emissão de comprovante de inscrição',
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
        name: 'Conclusão',
        order: 6,
        description: 'Inscrição concluída',
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
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG do Responsável', 'CPF do Responsável', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Curricular',
        order: 3,
        description: 'Análise do currículo',
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
        description: 'Inclusão no banco de professores',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cadastro', 'data_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 5,
        description: 'Emissão de certificado de cadastro',
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
        name: 'Conclusão',
        order: 6,
        description: 'Cadastro concluído',
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
    name: 'Workflow - Solicitação de Documento Escolar',
    description: 'Fluxo para solicitação de documentos escolares',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_documento', 'nome_aluno', 'escola'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação de Dados',
        order: 2,
        description: 'Verificação no sistema escolar',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['aluno_encontrado', 'historico_verificado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Elaboração do Documento',
        order: 3,
        description: 'Elaboração do documento solicitado',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['documento_elaborado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão',
        order: 4,
        description: 'Emissão do documento',
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
        name: 'Conclusão',
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
    name: 'Workflow - Registro de Ocorrência Escolar',
    description: 'Fluxo para registro de ocorrências escolares',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da ocorrência',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_ocorrencia', 'escola', 'descricao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Preliminar',
        order: 2,
        description: 'Análise inicial da ocorrência',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gravidade', 'necessita_intervencao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Investigação',
        order: 3,
        description: 'Investigação da ocorrência',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_investigacao', 'envolvidos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Providências',
        order: 4,
        description: 'Tomada de providências',
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
    name: 'Workflow - Consulta de Frequência e Notas',
    description: 'Fluxo para consulta de frequência e notas',
    defaultSLA: 2,
    stages: [
      {
        name: 'Recepção',
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
        description: 'Busca de informações',
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
    name: 'Workflow - Inscrição em Curso Livre',
    description: 'Fluxo para inscrição em cursos livres',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['curso_escolhido', 'turma_preferencial'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 2,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 3,
        description: 'Confirmação da inscrição',
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
        name: 'Conclusão',
        order: 4,
        description: 'Inscrição efetivada',
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

  // ========== SAÚDE (continuação) ==========
  AGENDAMENTO_ESPECIALIZADO: {
    moduleType: 'AGENDAMENTO_ESPECIALIZADO',
    name: 'Workflow - Agendamento de Consulta Especializada',
    description: 'Fluxo para agendamento de consultas com especialistas',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['especialidade', 'urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Encaminhamento',
        order: 2,
        description: 'Verificação do encaminhamento médico',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Documentos relacionados ao assunto do agendamento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Regulação',
        order: 3,
        description: 'Regulação médica',
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
        name: 'Confirmação',
        order: 5,
        description: 'Confirmação do agendamento',
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
        name: 'Conclusão',
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
    name: 'Workflow - Agendamento Odontológico',
    description: 'Fluxo para agendamento de consultas odontológicas',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        description: 'Classificação de urgência',
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
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação do agendamento',
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
        name: 'Conclusão',
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
    description: 'Fluxo para solicitação de medicamentos de alto custo',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['medicamento_solicitado'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Receita Médica Especial', 'Laudo Médico', 'Exames Complementares', 'Cartão SUS', 'RG ou CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Avaliação técnica farmacêutica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_farmaceutico', 'indicacao_aprovada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Médica',
        order: 4,
        description: 'Análise por médico auditor',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_medico', 'protocolo_clinico_atendido'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['quantidade_aprovada', 'periodo_tratamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Autorização',
        order: 6,
        description: 'Emissão de autorização',
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
        name: 'Conclusão',
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

  // ========== MEIO AMBIENTE (continuação) ==========
  AUTORIZACAO_SUPRESSAO_VEGETAL: {
    moduleType: 'AUTORIZACAO_SUPRESSAO_VEGETAL',
    name: 'Workflow - Autorização para Supressão Vegetal',
    description: 'Fluxo para autorização de supressão vegetal',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Parecer Técnico',
        order: 4,
        description: 'Elaboração de parecer técnico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'viabilidade', 'compensacao_ambiental_necessaria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['area_autorizada', 'condicoes', 'medidas_compensatorias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 6,
        description: 'Emissão do documento de autorização',
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
        name: 'Conclusão',
        order: 7,
        description: 'Autorização emitida',
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
    name: 'Workflow - Licença Ambiental Simplificada',
    description: 'Fluxo para licenciamento ambiental simplificado',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['atividade', 'porte_empreendimento'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Projeto Simplificado'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise técnica do projeto',
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
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da licença',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_licenca', 'validade', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Licença',
        order: 6,
        description: 'Emissão da licença',
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
        name: 'Conclusão',
        order: 7,
        description: 'Licença emitida',
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
    name: 'Workflow - Autorização para Captação de Água',
    description: 'Fluxo para autorização de captação de água',
    defaultSLA: 25,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['fonte_captacao', 'vazao_solicitada', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Projeto Hidráulico', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Hidrológica',
        order: 3,
        description: 'Análise técnica hidrológica',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_hidrologico', 'disponibilidade_hidrica', 'vazao_autorizada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da outorga',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vazao_outorgada', 'periodo_validade', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Outorga',
        order: 6,
        description: 'Emissão da outorga',
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
        name: 'Conclusão',
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

  // ========== ASSISTÊNCIA SOCIAL (workflows faltantes) ==========
  ACOLHIMENTO_CASA_ABRIGO: {
    moduleType: 'ACOLHIMENTO_CASA_ABRIGO',
    name: 'Workflow - Acolhimento em Casa de Abrigo',
    description: 'Fluxo para acolhimento institucional em casa de abrigo',
    defaultSLA: 1,
    stages: [
      {
        name: 'Recepção Emergencial',
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
        name: 'Avaliação Social',
        order: 2,
        description: 'Avaliação da situação social',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_social', 'composicao_familiar', 'historico_violencia'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Avaliação Psicológica',
        order: 3,
        description: 'Avaliação psicológica',
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
        description: 'Elaboração do PIA',
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
        name: 'Conclusão',
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
    description: 'Fluxo para acompanhamento social de famílias',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Diagnóstico Social',
        order: 2,
        description: 'Elaboração do diagnóstico',
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
        description: 'Elaboração do plano',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['objetivos', 'acoes_planejadas', 'periodicidade_visitas', 'responsavel_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Execução',
        order: 4,
        description: 'Execução do acompanhamento',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['visitas_realizadas', 'evolucao_familia', 'encaminhamentos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Avaliação',
        order: 5,
        description: 'Avaliação dos resultados',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['objetivos_alcancados', 'necessidade_continuidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
        order: 6,
        description: 'Acompanhamento concluído',
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

  // ========== EDUCAÇÃO (workflows faltantes) ==========
  AEE: {
    moduleType: 'AEE',
    name: 'Workflow - Atendimento Educacional Especializado',
    description: 'Fluxo para AEE (Atendimento Educacional Especializado)',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['aluno', 'escola', 'tipo_necessidade', 'serie'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Avaliação Pedagógica',
        order: 2,
        description: 'Avaliação pedagógica do aluno',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relatorio_pedagogico', 'necessidades_identificadas', 'potencialidades'],
        requiredDocumentTypes: ['Laudo Médico'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Plano de Atendimento',
        order: 3,
        description: 'Elaboração do plano de AEE',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['objetivos_aee', 'recursos_necessarios', 'periodicidade_atendimento', 'profissional_responsavel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do plano',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Início do Atendimento',
        order: 5,
        description: 'Início dos atendimentos',
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
        name: 'Conclusão',
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

  // ========== SAÚDE (workflows faltantes) ==========
  AGENDAMENTO_CAPS: {
    moduleType: 'AGENDAMENTO_CAPS',
    name: 'Workflow - Agendamento em CAPS',
    description: 'Fluxo para agendamento em Centro de Atenção Psicossocial',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        description: 'Triagem e avaliação inicial',
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
        description: 'Definição de data e horário',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_atendimento', 'horario', 'profissional_responsavel', 'modalidade_atendimento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação com o paciente',
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
        name: 'Conclusão',
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
    name: 'Workflow - Agendamento em Centro de Referência',
    description: 'Fluxo para agendamento em centros de referência especializados',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['paciente', 'especialidade', 'centro_referencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Verificação de Encaminhamento',
        order: 2,
        description: 'Validação do encaminhamento médico',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Regulação',
        order: 3,
        description: 'Regulação e priorização',
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
        description: 'Definição de data e horário',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_consulta', 'horario', 'profissional', 'unidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 5,
        description: 'Notificação ao paciente',
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
        name: 'Conclusão',
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
    name: 'Workflow - Alvará para Reforma',
    description: 'Fluxo para autorização de reforma em edificação',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['endereco_imovel', 'tipo_reforma', 'area_reforma'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Matrícula do Imóvel', 'Projeto de Reforma', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise do projeto',
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
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'observacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Alvará',
        order: 6,
        description: 'Emissão do alvará',
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
        name: 'Conclusão',
        order: 7,
        description: 'Alvará emitido',
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
    name: 'Workflow - Aprovação de Projeto',
    description: 'Fluxo para aprovação de projetos arquitetônicos',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Matrícula do Imóvel', 'Projeto Arquitetônico', 'ART', 'Planta de Situação'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Urbanística',
        order: 3,
        description: 'Análise de conformidade urbanística',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['conformidade_plano_diretor', 'conformidade_zoneamento', 'taxa_ocupacao', 'coeficiente_aproveitamento', 'recuos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Arquitetônica',
        order: 4,
        description: 'Análise do projeto arquitetônico',
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
        description: 'Consolidação de pareceres',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_consolidado', 'gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Aprovação',
        order: 6,
        description: 'Emissão do documento de aprovação',
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
        name: 'Conclusão',
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
    name: 'Workflow - Aprovação de Loteamento',
    description: 'Fluxo para aprovação de projeto de loteamento',
    defaultSLA: 45,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 7,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto de Loteamento', 'Memorial Descritivo', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Urbanística',
        order: 3,
        description: 'Análise de conformidade urbanística',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['conformidade_plano_diretor', 'conformidade_lei_parcelamento', 'areas_publicas', 'sistema_viario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Ambiental',
        order: 4,
        description: 'Análise de impacto ambiental',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_ambiental', 'areas_preservacao', 'drenagem', 'impactos_identificados'],
        requiredDocumentTypes: ['Licença Ambiental'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Infraestrutura',
        order: 5,
        description: 'Análise de infraestrutura',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['agua_esgoto', 'energia_eletrica', 'pavimentacao', 'drenagem_pluvial', 'arborizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Aprovação Técnica',
        order: 6,
        description: 'Aprovação técnica consolidada',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Aprovação',
        order: 7,
        description: 'Emissão do documento de aprovação',
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
        name: 'Conclusão',
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
    name: 'Workflow - Certidão de Uso do Solo',
    description: 'Fluxo para emissão de certidão de uso e ocupação do solo',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['endereco_imovel', 'matricula', 'finalidade_certidao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Matrícula do Imóvel'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Urbanística',
        order: 3,
        description: 'Consulta de legislação urbanística',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['zona', 'uso_permitido', 'indices_urbanisticos', 'restricoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Elaboração da Certidão',
        order: 4,
        description: 'Elaboração do documento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['responsavel_tecnico', 'data_elaboracao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Certidão',
        order: 5,
        description: 'Emissão da certidão',
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
        name: 'Conclusão',
        order: 6,
        description: 'Certidão emitida',
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

  // ========== DESENVOLVIMENTO ECONÔMICO (workflows faltantes) ==========
  ANALISE_VIABILIDADE_EMPREENDIMENTO: {
    moduleType: 'ANALISE_VIABILIDADE_EMPREENDIMENTO',
    name: 'Workflow - Análise de Viabilidade de Empreendimento',
    description: 'Fluxo para análise de viabilidade de novos empreendimentos',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_empreendimento', 'localizacao', 'area_necessaria', 'investimento_previsto'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Econômica',
        order: 3,
        description: 'Análise de viabilidade econômica',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['viabilidade_financeira', 'retorno_investimento', 'geracoes_emprego'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Análise Urbanística',
        order: 4,
        description: 'Análise de adequação urbanística',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['compatibilidade_zoneamento', 'infraestrutura_disponivel', 'impacto_urbano'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Parecer Técnico',
        order: 5,
        description: 'Consolidação de pareceres',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'recomendacoes', 'responsavel_parecer'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Parecer',
        order: 6,
        description: 'Emissão do documento',
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
        name: 'Conclusão',
        order: 7,
        description: 'Análise concluída',
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
    name: 'Workflow - Solicitação de Integração API',
    description: 'Fluxo para solicitação de integração com APIs municipais',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['sistema_origem', 'finalidade_integracao', 'apis_necessarias'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Requisitos',
        order: 2,
        description: 'Análise dos requisitos técnicos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['requisitos_tecnicos', 'volume_requisicoes', 'dados_necessarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Segurança',
        order: 3,
        description: 'Análise de segurança da informação',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_seguranca', 'riscos_identificados', 'medidas_protecao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da integração',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Configuração',
        order: 5,
        description: 'Configuração técnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['credenciais_geradas', 'ambiente', 'documentacao_fornecida'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Credenciais',
        order: 6,
        description: 'Envio de credenciais e documentação',
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
        name: 'Conclusão',
        order: 7,
        description: 'Integração liberada',
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
    name: 'Workflow - Apoio para Feira ou Exposição',
    description: 'Fluxo para solicitação de apoio a feiras e exposições agropecuárias',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_evento', 'data_evento', 'local_evento', 'publico_esperado', 'apoio_solicitado'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF ou CNPJ', 'Projeto do Evento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Viabilidade',
        order: 3,
        description: 'Análise de viabilidade do apoio',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['recursos_disponiveis', 'impacto_agricultura', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do apoio',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['tipo_apoio_aprovado', 'recursos_liberados', 'gestor_aprovador'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Formalização',
        order: 5,
        description: 'Formalização do apoio',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'documentos',
        requiredInputFieldIds: ['termo_compromisso', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Termo',
        order: 6,
        description: 'Emissão do termo de apoio',
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
        name: 'Conclusão',
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

  // ========== PLANEJAMENTO URBANO (workflows faltantes - continuação) ==========
  APROVACAO_DEMOLICAO_PARCIAL: {
    moduleType: 'APROVACAO_DEMOLICAO_PARCIAL',
    name: 'Workflow - Aprovação de Demolição Parcial',
    description: 'Fluxo para autorização de demolição parcial de edificação',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['endereco_imovel', 'area_demolicao', 'motivo_demolicao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Matrícula do Imóvel', 'Projeto de Demolição', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Estrutural',
        order: 3,
        description: 'Análise técnica estrutural',
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
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 6,
        description: 'Emissão do documento',
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
        name: 'Conclusão',
        order: 7,
        description: 'Autorização emitida',
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
    name: 'Workflow - Aprovação de Projeto de Urbanização',
    description: 'Fluxo para aprovação de projetos de urbanização de áreas',
    defaultSLA: 40,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto de Urbanização', 'Memorial Descritivo', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Urbanística',
        order: 3,
        description: 'Análise de conformidade urbanística',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['conformidade_plano_diretor', 'adequacao_infraestrutura', 'sistema_viario', 'areas_publicas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Ambiental',
        order: 4,
        description: 'Análise de impacto ambiental',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_ambiental', 'drenagem', 'saneamento', 'areas_verdes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Social',
        order: 5,
        description: 'Análise de impacto social',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['impacto_social', 'participacao_comunidade', 'equipamentos_comunitarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Parecer Técnico Consolidado',
        order: 6,
        description: 'Consolidação de pareceres',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'viabilidade', 'condicoes', 'gestor_aprovador'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Aprovação',
        order: 7,
        description: 'Emissão do documento de aprovação',
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
        name: 'Conclusão',
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

  // ========== SAÚDE (workflows faltantes - continuação) ==========
  ATENDIMENTO_DOMICILIAR: {
    moduleType: 'ATENDIMENTO_DOMICILIAR',
    name: 'Workflow - Atendimento Domiciliar',
    description: 'Fluxo para solicitação de atendimento domiciliar de saúde',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        description: 'Triagem e avaliação da necessidade',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['criterios_elegibilidade', 'prioridade', 'tipo_atendimento_necessario'],
        requiredDocumentTypes: ['Cartão SUS'],
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
        name: 'Notificação',
        order: 4,
        description: 'Notificação ao paciente',
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
        name: 'Conclusão',
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

  // ========== DESENVOLVIMENTO ECONÔMICO (workflows faltantes - continuação) ==========
  ATUALIZACAO_CADASTRAL_EMPRESA: {
    moduleType: 'ATUALIZACAO_CADASTRAL_EMPRESA',
    name: 'Workflow - Atualização Cadastral de Empresa',
    description: 'Fluxo para atualização de dados cadastrais de empresa',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['cnpj', 'dados_atualizar', 'motivo_atualizacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Contrato Social Atualizado', 'Comprovante de Endereço Comercial'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Dados',
        order: 3,
        description: 'Verificação dos dados informados',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_verificados', 'inconsistencias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Atualização',
        order: 4,
        description: 'Atualização no sistema',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['responsavel_atualizacao', 'data_atualizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Comprovante',
        order: 5,
        description: 'Emissão de comprovante',
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
        name: 'Conclusão',
        order: 6,
        description: 'Atualização concluída',
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

  // ========== FINANÇAS (workflows faltantes) ==========
  ATUALIZACAO_CADASTRAL_IMOVEL: {
    moduleType: 'ATUALIZACAO_CADASTRAL_IMOVEL',
    name: 'Workflow - Atualização Cadastral de Imóvel',
    description: 'Fluxo para atualização de dados cadastrais de imóvel',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['inscricao_imobiliaria', 'dados_atualizar', 'motivo_atualizacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura ou Contrato de Compra e Venda', 'RG e CPF do Proprietário', 'Comprovante de Endereço', 'Carnê de IPTU'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação Cadastral',
        order: 3,
        description: 'Verificação dos dados cadastrais',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_atuais', 'dados_novos', 'inconsistencias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria (se necessário)',
        order: 4,
        description: 'Vistoria no imóvel',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['necessita_vistoria', 'data_vistoria', 'responsavel_vistoria', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: true
      },
      {
        name: 'Atualização',
        order: 5,
        description: 'Atualização no cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['responsavel_atualizacao', 'data_atualizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Comprovante',
        order: 6,
        description: 'Emissão de comprovante',
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
        name: 'Conclusão',
        order: 7,
        description: 'Atualização concluída',
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
    name: 'Workflow - Autorização para Evento em Via Pública',
    description: 'Fluxo para autorização de eventos em vias públicas',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_evento', 'data_evento', 'local_evento', 'horario_inicio', 'horario_fim', 'publico_esperado'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto do Evento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Trânsito',
        order: 3,
        description: 'Análise de impacto no trânsito',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['impacto_transito', 'desvios_necessarios', 'sinalizacao_necessaria', 'parecer_transito'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Segurança',
        order: 4,
        description: 'Análise de segurança',
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
        description: 'Vistoria técnica no local',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'relatorio_vistoria', 'adequacao_local'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 7,
        description: 'Emissão do alvará',
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
        name: 'Conclusão',
        order: 8,
        description: 'Autorização emitida',
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
    name: 'Workflow - Autorização para Manejo de Fauna',
    description: 'Fluxo para autorização de manejo e captura de fauna silvestre',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['especie', 'localizacao', 'motivo_manejo', 'procedimento_pretendido'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise técnica do pedido',
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
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 6,
        description: 'Emissão da licença',
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
        name: 'Conclusão',
        order: 7,
        description: 'Autorização emitida',
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

  // ========== EDUCAÇÃO / TRANSPORTE ESCOLAR (workflows faltantes) ==========
  AUTORIZACAO_TRANSPORTE_ESCOLAR: {
    moduleType: 'AUTORIZACAO_TRANSPORTE_ESCOLAR',
    name: 'Workflow - Autorização de Transporte Escolar',
    description: 'Fluxo para autorização de veículo para transporte escolar',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['proprietario_veiculo', 'placa', 'capacidade', 'rotas_pretendidas'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Seguro do Veículo'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do Veículo',
        order: 3,
        description: 'Vistoria técnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_veiculo', 'equipamentos_seguranca', 'aprovado_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Rotas',
        order: 4,
        description: 'Análise e definição de rotas',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['rotas_aprovadas', 'horarios', 'pontos_parada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação final',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 6,
        description: 'Emissão do documento',
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
        name: 'Conclusão',
        order: 7,
        description: 'Autorização emitida',
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
    name: 'Workflow - Autorização de Transporte Turístico',
    description: 'Fluxo para autorização de transporte turístico',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_veiculo', 'placa', 'capacidade', 'roteiros_turisticos'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Seguro dos Veículos'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do Veículo',
        order: 3,
        description: 'Vistoria técnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_veiculo', 'equipamentos', 'aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação final',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 5,
        description: 'Emissão da autorização',
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
        name: 'Conclusão',
        order: 6,
        description: 'Autorização emitida',
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

  // ========== HABITAÇÃO (workflows faltantes) ==========
  AUXILIO_ALUGUEL: {
    moduleType: 'AUXILIO_ALUGUEL',
    name: 'Workflow - Auxílio Aluguel',
    description: 'Fluxo para concessão de auxílio aluguel',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'situacao_moradia_atual', 'motivo_solicitacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica',
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
        description: 'Visita técnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'situacao_constatada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 5,
        description: 'Verificação de critérios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'valor_auxilio', 'periodo_concessao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final',
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
        name: 'Conclusão',
        order: 7,
        description: 'Auxílio concedido',
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
    name: 'Workflow - Auxílio Construção',
    description: 'Fluxo para concessão de auxílio para construção',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'possui_terreno', 'tipo_auxilio'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica',
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
        name: 'Análise de Elegibilidade',
        order: 5,
        description: 'Verificação de critérios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_auxilio_aprovado', 'valor_estimado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Termo',
        order: 7,
        description: 'Emissão do termo de concessão',
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
        name: 'Conclusão',
        order: 8,
        description: 'Auxílio concedido',
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

  // ========== DESENVOLVIMENTO ECONÔMICO (workflows faltantes - continuação) ==========
  BAIXA_EMPRESA: {
    moduleType: 'BAIXA_EMPRESA',
    name: 'Workflow - Baixa de Empresa',
    description: 'Fluxo para encerramento/baixa de empresa',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['cnpj', 'motivo_baixa', 'data_encerramento_atividades'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Certidões Negativas (Tributos Municipais, Estaduais e Federais)', 'CNPJ'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Débitos',
        order: 3,
        description: 'Verificação de pendências fiscais',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['possui_debitos', 'valor_debitos', 'situacao_regularizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria (se necessário)',
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
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da baixa',
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
        name: 'Emissão de Comprovante',
        order: 7,
        description: 'Emissão do comprovante',
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
        name: 'Conclusão',
        order: 8,
        description: 'Baixa concluída',
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

  // ========== ASSISTÊNCIA SOCIAL (workflows faltantes - continuação) ==========
  BENEFICIO_EVENTUAL: {
    moduleType: 'BENEFICIO_EVENTUAL',
    name: 'Workflow - Benefício Eventual',
    description: 'Fluxo para concessão de benefícios eventuais',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_beneficio', 'motivo_solicitacao', 'grau_urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Social',
        order: 3,
        description: 'Avaliação da situação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['situacao_socioeconomica', 'vulnerabilidade', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 4,
        description: 'Verificação de critérios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_beneficio_aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação e concessão',
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
        name: 'Conclusão',
        order: 6,
        description: 'Benefício concedido',
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
    name: 'Workflow - Bolsa Família Municipal',
    description: 'Fluxo para inscrição em programa de transferência de renda municipal',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'situacao_moradia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda Familiar', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica',
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
        description: 'Visita técnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'relatorio_visita', 'situacao_constatada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 5,
        description: 'Verificação final de critérios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'prioridade', 'valor_beneficio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação e inclusão',
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
        name: 'Conclusão',
        order: 7,
        description: 'Família incluída no programa',
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

  // ========== AGRICULTURA (workflows faltantes - continuação) ==========
  CADASTRO_AGROINDUSTRIA: {
    moduleType: 'CADASTRO_AGROINDUSTRIA',
    name: 'Workflow - Cadastro de Agroindústria',
    description: 'Fluxo para cadastramento de agroindústria',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Propriedade'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 3,
        description: 'Vistoria nas instalações',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'equipamentos', 'condicoes_higiene', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise técnica da produção',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['processo_produtivo', 'controle_qualidade', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do cadastro',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 6,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 7,
        description: 'Cadastro concluído',
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

  // ========== TURISMO (workflows faltantes - continuação) ==========
  CADASTRO_ATRACAO_TURISTICA: {
    moduleType: 'CADASTRO_ATRACAO_TURISTICA',
    name: 'Workflow - Cadastro de Atração Turística',
    description: 'Fluxo para cadastramento de atração turística',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF ou CNPJ', 'Fotos do Local'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 5,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 6,
        description: 'Cadastro concluído',
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

  // ========== FINANÇAS (workflows faltantes - continuação) ==========
  CADASTRO_CONTRIBUINTE: {
    moduleType: 'CADASTRO_CONTRIBUINTE',
    name: 'Workflow - Cadastro de Contribuinte',
    description: 'Fluxo para cadastramento de contribuinte',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Dados',
        order: 3,
        description: 'Verificação dos dados cadastrais',
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
        description: 'Inclusão no cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inscricao_municipal', 'responsavel_cadastro', 'data_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Comprovante',
        order: 5,
        description: 'Emissão do comprovante',
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
        name: 'Conclusão',
        order: 6,
        description: 'Cadastro concluído',
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

  // ========== HABITAÇÃO (workflows faltantes - continuação) ==========
  CADASTRO_DEFICIT_HABITACIONAL: {
    moduleType: 'CADASTRO_DEFICIT_HABITACIONAL',
    name: 'Workflow - Cadastro em Déficit Habitacional',
    description: 'Fluxo para cadastramento em lista de déficit habitacional',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica',
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
        description: 'Visita técnica',
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
        description: 'Inclusão na lista',
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
        name: 'Conclusão',
        order: 6,
        description: 'Cadastro concluído',
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

  // ========== ASSISTÊNCIA SOCIAL (workflows faltantes - continuação) ==========
  CADASTRO_FAMILIA_RISCO: {
    moduleType: 'CADASTRO_FAMILIA_RISCO',
    name: 'Workflow - Cadastro de Família em Risco',
    description: 'Fluxo para cadastramento de família em situação de risco',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Avaliação Inicial',
        order: 2,
        description: 'Avaliação da situação de risco',
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
        description: 'Elaboração do plano',
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
        description: 'Inclusão no sistema de acompanhamento',
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
        name: 'Conclusão',
        order: 6,
        description: 'Família em acompanhamento',
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
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'Certidões Negativas'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Dados',
        order: 3,
        description: 'Verificação dos dados cadastrais',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dados_verificados', 'situacao_fiscal', 'capacidade_tecnica'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Análise de Habilitação',
        order: 4,
        description: 'Análise de habilitação',
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
        description: 'Inclusão no sistema',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_cadastro', 'responsavel_cadastro', 'data_cadastro', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 6,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 7,
        description: 'Cadastro concluído',
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

  // ========== MEIO AMBIENTE (workflows faltantes - continuação) ==========
  CADASTRO_GERADOR_RESIDUOS: {
    moduleType: 'CADASTRO_GERADOR_RESIDUOS',
    name: 'Workflow - Cadastro de Gerador de Resíduos',
    description: 'Fluxo para cadastramento de gerador de resíduos',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Projeto de Manejo', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 3,
        description: 'Vistoria nas instalações',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'armazenamento_residuos', 'segregacao', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise do PGRS',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['pgrs_adequado', 'destinacao_adequada', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 6,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 7,
        description: 'Cadastro concluído',
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

  // ========== TECNOLOGIA (workflows faltantes - continuação) ==========
  CADASTRO_LOGIN_UNICO: {
    moduleType: 'CADASTRO_LOGIN_UNICO',
    name: 'Workflow - Cadastro em Login Único',
    description: 'Fluxo para cadastramento em sistema de login único',
    defaultSLA: 3,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['cpf', 'email', 'telefone'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Validação de Dados',
        order: 2,
        description: 'Validação dos dados informados',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['cpf_valido', 'email_validado', 'telefone_validado'],
        requiredDocumentTypes: ['CPF', 'RG'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Criação de Conta',
        order: 3,
        description: 'Criação da conta no sistema',
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
        name: 'Conclusão',
        order: 4,
        description: 'Cadastro concluído',
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
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Viabilidade',
        order: 3,
        description: 'Análise de viabilidade de localização',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['zoneamento_permite', 'atividade_permitida', 'parecer_viabilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria (se necessário)',
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
        description: 'Inclusão no cadastro municipal',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inscricao_municipal', 'responsavel_cadastro', 'data_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Comprovante',
        order: 6,
        description: 'Emissão do comprovante',
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
        name: 'Conclusão',
        order: 7,
        description: 'Cadastro concluído',
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

  // ========== AGRICULTURA (workflows faltantes - continuação) ==========
  CADASTRO_PISCICULTURA: {
    moduleType: 'CADASTRO_PISCICULTURA',
    name: 'Workflow - Cadastro de Piscicultura',
    description: 'Fluxo para cadastramento de empreendimento de piscicultura',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 3,
        description: 'Vistoria nas instalações',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'manejo', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise técnica do empreendimento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['viabilidade_tecnica', 'impacto_ambiental', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 6,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 7,
        description: 'Cadastro concluído',
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
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Portfólio'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise do plano de ação',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['relevancia_cultural', 'impacto_comunidade', 'viabilidade', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria (se necessário)',
        order: 4,
        description: 'Vistoria no espaço',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['necessita_vistoria', 'data_vistoria', 'responsavel_vistoria', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: true
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 6,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 7,
        description: 'Cadastro concluído',
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

  // ========== DESENVOLVIMENTO ECONÔMICO (workflows faltantes - continuação) ==========
  CADASTRO_STARTUP: {
    moduleType: 'CADASTRO_STARTUP',
    name: 'Workflow - Cadastro de Startup',
    description: 'Fluxo para cadastramento de startup no ecossistema de inovação municipal',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ da Empresa', 'Contrato Social'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Inovação',
        order: 3,
        description: 'Análise do caráter inovador',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['carater_inovador', 'potencial_escalabilidade', 'mercado_alvo', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'beneficios_oferecidos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 5,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 6,
        description: 'Cadastro concluído',
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

  // ========== MEIO AMBIENTE (workflows faltantes - continuação) ==========
  CADASTRO_VIVEIRO_MUDAS: {
    moduleType: 'CADASTRO_VIVEIRO_MUDAS',
    name: 'Workflow - Cadastro de Viveiro de Mudas',
    description: 'Fluxo para cadastramento de viveiro de mudas',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 3,
        description: 'Vistoria nas instalações',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'sistema_irrigacao', 'procedencia_sementes', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise técnica da produção',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['especies_nativas', 'qualidade_mudas', 'manejo_adequado', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do cadastro',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_cadastro'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 6,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 7,
        description: 'Cadastro concluído',
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

  // ========== ASSISTÊNCIA SOCIAL (workflows faltantes - continuação) ==========
  CADASTRO_VOLUNTARIO: {
    moduleType: 'CADASTRO_VOLUNTARIO',
    name: 'Workflow - Cadastro de Voluntário',
    description: 'Fluxo para cadastramento de voluntário',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
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
        name: 'Capacitação',
        order: 4,
        description: 'Capacitação inicial',
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
        description: 'Inclusão no banco de voluntários',
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
        name: 'Conclusão',
        order: 6,
        description: 'Cadastro concluído',
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
    name: 'Workflow - Inscrição em Campeonato Municipal',
    description: 'Fluxo para inscrição em campeonatos municipais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['modalidade', 'categoria', 'nome_equipe', 'responsavel'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documentos dos Atletas'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Elegibilidade',
        order: 3,
        description: 'Verificação de critérios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['idade_categoria', 'documentos_regulares', 'atende_requisitos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Homologação',
        order: 4,
        description: 'Homologação da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inscricao_homologada', 'numero_inscricao', 'chave_campeonato'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Confirmação',
        order: 5,
        description: 'Emissão do comprovante',
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
        name: 'Conclusão',
        order: 6,
        description: 'Inscrição confirmada',
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

  // ========== EDUCAÇÃO / TRANSPORTE (workflows faltantes) ==========
  CARTAO_ESTUDANTE: {
    moduleType: 'CARTAO_ESTUDANTE',
    name: 'Workflow - Cartão de Estudante',
    description: 'Fluxo para solicitação de cartão de estudante',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['aluno', 'escola', 'serie', 'turno'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'Declaração de Matrícula', 'Foto 3x4 recente'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação de Matrícula',
        order: 3,
        description: 'Validação junto à escola',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['matricula_ativa', 'frequencia_regular'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Produção do Cartão',
        order: 4,
        description: 'Confecção do cartão',
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
        description: 'Entrega do cartão',
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
        name: 'Conclusão',
        order: 6,
        description: 'Cartão entregue',
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
    name: 'Workflow - Cartão PCD',
    description: 'Fluxo para solicitação de cartão de pessoa com deficiência',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'tipo_deficiencia', 'grau_deficiencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Laudo Médico', 'Comprovante de Residência', 'Foto 3x4 recente'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Médica',
        order: 3,
        description: 'Avaliação do laudo médico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_valido', 'cid', 'tipo_deficiencia_confirmado', 'parecer_medico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'beneficios_concedidos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Produção do Cartão',
        order: 5,
        description: 'Confecção do cartão',
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
        description: 'Entrega do cartão',
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
        name: 'Conclusão',
        order: 7,
        description: 'Cartão entregue',
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
    name: 'Workflow - Cartão de Transporte',
    description: 'Fluxo para solicitação de cartão de transporte público',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_cartao', 'nome', 'cpf'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'Comprovante de Residência', 'Foto 3x4 recente'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 3,
        description: 'Verificação de critérios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_beneficio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Produção do Cartão',
        order: 4,
        description: 'Confecção do cartão',
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
        description: 'Entrega do cartão',
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
        name: 'Conclusão',
        order: 6,
        description: 'Cartão entregue',
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

  // ========== ASSISTÊNCIA SOCIAL (workflows faltantes - continuação) ==========
  CASA_LAR_IDOSO: {
    moduleType: 'CASA_LAR_IDOSO',
    name: 'Workflow - Casa Lar para Idoso',
    description: 'Fluxo para solicitação de vaga em casa lar para idoso',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome_idoso', 'idade', 'situacao_saude', 'situacao_familiar', 'grau_dependencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Social',
        order: 3,
        description: 'Avaliação da situação social',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vinculos_familiares', 'situacao_vulnerabilidade', 'necessidade_institucional', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação de Saúde',
        order: 4,
        description: 'Avaliação médica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['condicoes_saude', 'medicamentos_uso', 'necessidades_cuidados', 'parecer_medico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 5,
        description: 'Verificação de critérios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'prioridade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Inclusão em Lista de Espera',
        order: 6,
        description: 'Inclusão na lista',
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
        name: 'Conclusão',
        order: 7,
        description: 'Solicitação registrada',
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

  // ========== PATRIMÔNIO HISTÓRICO (workflows faltantes) ==========
  CERTIDAO_BEM_TOMBADO: {
    moduleType: 'CERTIDAO_BEM_TOMBADO',
    name: 'Workflow - Certidão de Bem Tombado',
    description: 'Fluxo para emissão de certidão de bem tombado',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['identificacao_bem', 'localizacao', 'finalidade_certidao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
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
        description: 'Verificação no registro de bens tombados',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['bem_tombado', 'numero_processo_tombamento', 'data_tombamento', 'restricoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Elaboração da Certidão',
        order: 4,
        description: 'Elaboração do documento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['responsavel_tecnico', 'data_elaboracao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Certidão',
        order: 5,
        description: 'Emissão da certidão',
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
        name: 'Conclusão',
        order: 6,
        description: 'Certidão emitida',
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

  // ========== TECNOLOGIA (workflows faltantes - continuação) ==========
  CERTIFICADO_DIGITAL: {
    moduleType: 'CERTIFICADO_DIGITAL',
    name: 'Workflow - Solicitação de Certificado Digital',
    description: 'Fluxo para solicitação de certificado digital',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_certificado', 'cpf_cnpj', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Validação Presencial',
        order: 3,
        description: 'Validação presencial de identidade',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_validacao', 'responsavel_validacao', 'identidade_confirmada', 'biometria_coletada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão do Certificado',
        order: 4,
        description: 'Emissão do certificado digital',
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
        name: 'Conclusão',
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

  // ========== ASSISTÊNCIA SOCIAL (workflows faltantes - continuação) ==========
  CESTA_BASICA: {
    moduleType: 'CESTA_BASICA',
    name: 'Workflow - Cesta Básica',
    description: 'Fluxo para solicitação de cesta básica',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'motivo_solicitacao', 'grau_urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Social',
        order: 3,
        description: 'Avaliação da situação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['situacao_vulnerabilidade', 'necessidade_imediata', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação e disponibilização',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['quantidade_cestas', 'local_retirada', 'data_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 5,
        description: 'Notificação ao beneficiário',
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
        name: 'Conclusão',
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

  // ========== TRÂNSITO (workflows faltantes) ==========
  CNH_SOCIAL: {
    moduleType: 'CNH_SOCIAL',
    name: 'Workflow - CNH Social',
    description: 'Fluxo para inscrição em programa de CNH social',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'renda_familiar', 'categoria_pretendida'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência', 'Comprovante de Renda Familiar'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica',
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
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação e inclusão no programa',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'auto_escola_conveniada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 6,
        description: 'Notificação ao beneficiário',
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
        name: 'Conclusão',
        order: 7,
        description: 'Inscrição confirmada',
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

  // ========== AGRICULTURA (workflows faltantes - continuação) ==========
  COMPRA_DIRETA_PRODUTOR: {
    moduleType: 'COMPRA_DIRETA_PRODUTOR',
    name: 'Workflow - Compra Direta do Produtor',
    description: 'Fluxo para participação em programa de compra direta',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['produtor', 'produtos_ofertados', 'quantidade_disponivel', 'periodicidade_entrega'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
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
        description: 'Vistoria técnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'producao_verificada', 'qualidade_produtos', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Viabilidade',
        order: 4,
        description: 'Análise de capacidade de fornecimento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['capacidade_fornecimento', 'regularidade', 'produtos_aprovados', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação e habilitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'limite_fornecimento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Formalização',
        order: 6,
        description: 'Formalização do cadastro',
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
        name: 'Conclusão',
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

  // ========== PLANEJAMENTO URBANO (workflows faltantes - continuação) ==========
  CONCESSAO_USO_ESPECIAL: {
    moduleType: 'CONCESSAO_USO_ESPECIAL',
    name: 'Workflow - Concessão de Uso Especial',
    description: 'Fluxo para concessão de uso especial de bem público',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['identificacao_bem', 'localizacao', 'area_solicitada', 'finalidade_uso', 'tempo_ocupacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação Dominial',
        order: 3,
        description: 'Verificação da titularidade do bem',
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
        name: 'Análise Jurídica',
        order: 5,
        description: 'Análise jurídica do pedido',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos_legais', 'finalidade_social', 'parecer_juridico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Parecer Técnico',
        order: 6,
        description: 'Parecer técnico consolidado',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['viabilidade', 'area_concedida', 'prazo_concessao', 'condicoes', 'parecer_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 7,
        description: 'Aprovação final',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão do Termo',
        order: 8,
        description: 'Emissão do termo de concessão',
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
        name: 'Conclusão',
        order: 9,
        description: 'Concessão formalizada',
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
    name: 'Workflow - Cópia de Processos',
    description: 'Fluxo para solicitação de cópia de processos',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['numero_processo', 'tipo_copia', 'quantidade_paginas'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Localização do Processo',
        order: 2,
        description: 'Localização do processo',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['processo_localizado', 'localizacao_atual', 'responsavel_localizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Acesso',
        order: 3,
        description: 'Verificação de permissão de acesso',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['possui_acesso', 'vinculo_processo', 'observacoes'],
        requiredDocumentTypes: ['RG e CPF'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Reprodução',
        order: 4,
        description: 'Reprodução das cópias',
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
        description: 'Disponibilização das cópias',
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
        name: 'Conclusão',
        order: 6,
        description: 'Cópias entregues',
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

  // ========== TURISMO (workflows faltantes - continuação) ==========
  CREDENCIAMENTO_AGENCIA_TURISMO: {
    moduleType: 'CREDENCIAMENTO_AGENCIA_TURISMO',
    name: 'Workflow - Credenciamento de Agência de Turismo',
    description: 'Fluxo para credenciamento de agência de turismo',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'Cadastur', 'Alvará de Funcionamento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria nas instalações',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'infraestrutura', 'equipe_qualificada', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do credenciamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 5,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 6,
        description: 'Credenciamento concluído',
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
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Currículo', 'Certificados'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Qualificação',
        order: 3,
        description: 'Análise da qualificação',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['formacao_adequada', 'experiencia_comprovada', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Entrevista/Avaliação',
        order: 4,
        description: 'Entrevista técnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_entrevista', 'responsavel_entrevista', 'avaliacao', 'aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do credenciamento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'areas_aprovadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Credencial',
        order: 6,
        description: 'Emissão da credencial',
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
        name: 'Conclusão',
        order: 7,
        description: 'Credenciamento concluído',
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

  // ========== MOBILIDADE URBANA / TRÂNSITO (workflows faltantes - continuação) ==========
  CREDENCIAMENTO_MOTOTAXI: {
    moduleType: 'CREDENCIAMENTO_MOTOTAXI',
    name: 'Workflow - Credenciamento de Mototáxi',
    description: 'Fluxo para credenciamento de mototaxista',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH Categoria A (mínimo)', 'Certidão de Antecedentes Criminais'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Curso de Capacitação',
        order: 3,
        description: 'Participação em curso obrigatório',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_curso', 'carga_horaria', 'aprovado_curso'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do Veículo',
        order: 4,
        description: 'Vistoria técnica da motocicleta',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_veiculo', 'equipamentos_seguranca', 'aprovado_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do credenciamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_credencial', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Credencial',
        order: 6,
        description: 'Emissão da credencial',
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
        name: 'Conclusão',
        order: 7,
        description: 'Credenciamento concluído',
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
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Qualificação',
        order: 3,
        description: 'Análise da qualificação artística',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['formacao_adequada', 'experiencia_comprovada', 'qualidade_trabalho', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Prática',
        order: 4,
        description: 'Avaliação prática',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_avaliacao', 'responsavel_avaliacao', 'desempenho', 'aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do credenciamento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'modalidades_aprovadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Credencial',
        order: 6,
        description: 'Emissão da credencial',
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
        name: 'Conclusão',
        order: 7,
        description: 'Credenciamento concluído',
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
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH Categoria B (mínimo)', 'Certidão de Antecedentes Criminais'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Curso de Capacitação',
        order: 3,
        description: 'Participação em curso obrigatório',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_curso', 'carga_horaria', 'aprovado_curso'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do Veículo',
        order: 4,
        description: 'Vistoria técnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_veiculo', 'equipamentos_obrigatorios', 'aprovado_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do credenciamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_credencial', 'ponto_atribuido', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Credencial',
        order: 6,
        description: 'Emissão da credencial e placa',
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
        name: 'Conclusão',
        order: 7,
        description: 'Credenciamento concluído',
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
        name: 'Recepção',
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
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH Categoria D', 'CRLV', 'Seguro Obrigatório', 'Certidão de Antecedentes Criminais', 'Curso de Transporte Escolar'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria do Veículo',
        order: 3,
        description: 'Vistoria técnica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'condicoes_veiculo', 'equipamentos_seguranca', 'identificacao_veicular', 'aprovado_vistoria'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Definição de Rotas',
        order: 4,
        description: 'Análise e definição de rotas',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['rotas_atribuidas', 'escolas_atendidas', 'horarios', 'numero_alunos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do credenciamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'numero_credencial', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Credencial',
        order: 6,
        description: 'Emissão da credencial',
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
        name: 'Conclusão',
        order: 7,
        description: 'Credenciamento concluído',
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
    name: 'Workflow - Inscrição em Cursos de Qualificação',
    description: 'Fluxo para inscrição em cursos de qualificação profissional',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'curso_interesse', 'escolaridade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Escolaridade', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Pré-requisitos',
        order: 3,
        description: 'Verificação de requisitos do curso',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos', 'disponibilidade_horarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Vagas',
        order: 4,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma_atribuida', 'data_inicio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação de Matrícula',
        order: 5,
        description: 'Confirmação da inscrição',
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
        name: 'Conclusão',
        order: 6,
        description: 'Inscrição confirmada',
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
    name: 'Workflow - Inscrição em Curso de Inclusão Digital',
    description: 'Fluxo para inscrição em cursos de inclusão digital',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'idade', 'nivel_conhecimento'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 3,
        description: 'Verificação de critérios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'prioridade', 'disponibilidade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Alocação de Turma',
        order: 4,
        description: 'Definição de turma',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['turma_atribuida', 'local', 'horario', 'data_inicio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 5,
        description: 'Confirmação da inscrição',
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
        name: 'Conclusão',
        order: 6,
        description: 'Inscrição confirmada',
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

  // ========== AGRICULTURA (workflows faltantes - continuação) ==========
  DAP_DIGITAL: {
    moduleType: 'DAP_DIGITAL',
    name: 'Workflow - DAP Digital',
    description: 'Fluxo para emissão de Declaração de Aptidão ao Pronaf Digital',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['produtor', 'cpf', 'propriedade', 'tipo_producao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
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
        name: 'Análise de Enquadramento',
        order: 4,
        description: 'Verificação de enquadramento ao Pronaf',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['enquadrado_pronaf', 'grupo_pronaf', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão da DAP',
        order: 5,
        description: 'Emissão da declaração',
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
        name: 'Conclusão',
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
    name: 'Workflow - Emissão de Declarações',
    description: 'Fluxo para emissão de declarações diversas',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_declaracao', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Dados',
        order: 3,
        description: 'Verificação das informações',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['informacoes_verificadas', 'dados_corretos'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Emissão da Declaração',
        order: 4,
        description: 'Emissão do documento',
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
        name: 'Conclusão',
        order: 5,
        description: 'Declaração emitida',
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
    name: 'Workflow - Defesa de Autuação',
    description: 'Fluxo para apresentação de defesa contra autuação',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
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
        name: 'Análise Preliminar',
        order: 2,
        description: 'Verificação de prazo e documentação',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH', 'CRLV', 'Notificação de Autuação', 'Comprovantes (se houver)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise dos argumentos apresentados',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['argumentos_procedentes', 'verificacao_infracao', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Decisão Administrativa',
        order: 4,
        description: 'Decisão sobre a defesa',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['decisao', 'fundamentacao', 'gestor_decisor', 'data_decisao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 5,
        description: 'Notificação da decisão',
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
        name: 'Conclusão',
        order: 6,
        description: 'Processo concluído',
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
    name: 'Workflow - Distribuição de Mudas',
    description: 'Fluxo para solicitação de mudas',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['solicitante', 'especies_solicitadas', 'quantidade', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Disponibilidade',
        order: 2,
        description: 'Verificação de estoque',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['especies_disponiveis', 'quantidade_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise da adequação',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['finalidade_adequada', 'local_plantio', 'parecer_tecnico'],
        requiredDocumentTypes: ['Comprovante de Propriedade ou Posse'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da distribuição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['especies_aprovadas', 'quantidade_aprovada', 'data_retirada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 5,
        description: 'Notificação ao solicitante',
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
        name: 'Conclusão',
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
    name: 'Workflow - Distribuição de Sementes',
    description: 'Fluxo para solicitação de sementes',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['produtor', 'sementes_solicitadas', 'quantidade', 'area_plantio'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Disponibilidade',
        order: 3,
        description: 'Verificação de estoque',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['sementes_disponiveis', 'quantidade_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise da adequação',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['adequacao_regiao', 'epoca_plantio', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da distribuição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['sementes_aprovadas', 'quantidade_aprovada', 'data_retirada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 6,
        description: 'Notificação ao produtor',
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
        name: 'Conclusão',
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

  // ========== ESPORTES (workflows faltantes - continuação) ==========
  EMPRESTIMO_MATERIAL_ESPORTIVO: {
    moduleType: 'EMPRESTIMO_MATERIAL_ESPORTIVO',
    name: 'Workflow - Empréstimo de Material Esportivo',
    description: 'Fluxo para solicitação de empréstimo de material esportivo',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['solicitante', 'materiais_solicitados', 'quantidade', 'finalidade', 'data_evento', 'data_devolucao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Disponibilidade',
        order: 2,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['materiais_disponiveis', 'conflito_agenda'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise do Pedido',
        order: 3,
        description: 'Análise da finalidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['finalidade_adequada', 'responsavel_evento', 'parecer_tecnico'],
        requiredDocumentTypes: ['CPF'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do empréstimo',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes_emprestimo'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Formalização',
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
        name: 'Conclusão',
        order: 6,
        description: 'Empréstimo autorizado',
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

  // ========== MOBILIDADE/TRÂNSITO (workflows faltantes - continuação) ==========
  FAIXA_CARGA_DESCARGA: {
    moduleType: 'FAIXA_CARGA_DESCARGA',
    name: 'Workflow - Faixa de Carga e Descarga',
    description: 'Fluxo para solicitação de faixa de carga e descarga',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['estabelecimento', 'endereco', 'atividade', 'horario_funcionamento', 'metragem_solicitada'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Alvará de Funcionamento'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Análise de Trânsito',
        order: 4,
        description: 'Análise de impacto no trânsito',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['impacto_transito', 'restricoes_horario', 'parecer_transito'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 6,
        description: 'Emissão do documento',
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
        name: 'Conclusão',
        order: 7,
        description: 'Autorização emitida',
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

  // ========== ASSISTÊNCIA SOCIAL (workflows faltantes - continuação) ==========
  GERACAO_RENDA: {
    moduleType: 'GERACAO_RENDA',
    name: 'Workflow - Programa de Geração de Renda',
    description: 'Fluxo para inscrição em programa de geração de renda',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'renda_familiar', 'atividade_interesse', 'experiencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda (se houver)', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica',
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
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação e inclusão no programa',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'modalidade_programa'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 6,
        description: 'Notificação ao beneficiário',
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
        name: 'Conclusão',
        order: 7,
        description: 'Inscrição confirmada',
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

  // ========== PATRIMÔNIO (workflows faltantes) ==========
  GUARDA_PATRIMONIAL: {
    moduleType: 'GUARDA_PATRIMONIAL',
    name: 'Workflow - Guarda Patrimonial',
    description: 'Fluxo para solicitação de guarda de bem patrimonial',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_bem', 'descricao', 'finalidade_guarda', 'prazo_estimado'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise do Bem',
        order: 2,
        description: 'Avaliação do bem',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['condicoes_bem', 'valor_estimado', 'necessidades_conservacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Viabilidade',
        order: 3,
        description: 'Verificação de espaço disponível',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['espaco_disponivel', 'local_guarda', 'condicoes_armazenamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da guarda',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'prazo_guarda', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Formalização',
        order: 5,
        description: 'Formalização do termo',
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
        name: 'Conclusão',
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

  // ========== TURISMO (workflows faltantes - continuação) ==========
  INSCRICAO_CIRCUITO_TURISTICO: {
    moduleType: 'INSCRICAO_CIRCUITO_TURISTICO',
    name: 'Workflow - Inscrição em Circuito Turístico',
    description: 'Fluxo para inscrição de empreendimento em circuito turístico',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['empreendimento', 'tipo_atracao', 'circuito_interesse', 'infraestrutura_disponivel'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ ou CPF', 'Cadastur (se aplicável)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
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
        name: 'Análise Técnica',
        order: 4,
        description: 'Análise de adequação ao circuito',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['adequacao_circuito', 'potencial_turistico', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'circuito_atribuido'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 6,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 7,
        description: 'Inscrição confirmada',
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
    name: 'Workflow - Inscrição em Concurso Público',
    description: 'Fluxo para inscrição em concurso público',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'cargo_pretendido', 'escolaridade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de Escolaridade'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Requisitos',
        order: 3,
        description: 'Verificação de requisitos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos', 'observacoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Homologação',
        order: 4,
        description: 'Homologação da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inscricao_homologada', 'numero_inscricao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Comprovante',
        order: 5,
        description: 'Emissão do comprovante',
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
        name: 'Conclusão',
        order: 6,
        description: 'Inscrição confirmada',
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
    name: 'Workflow - Inscrição em Corrida de Rua',
    description: 'Fluxo para inscrição em corridas de rua',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'categoria', 'percurso', 'tamanho_camiseta'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 3,
        description: 'Verificação de disponibilidade',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'numero_peito'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação da inscrição',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inscricao_confirmada', 'local_retirada_kit'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Comprovante',
        order: 5,
        description: 'Emissão do comprovante',
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
        name: 'Conclusão',
        order: 6,
        description: 'Inscrição confirmada',
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
    name: 'Workflow - Inscrição em Curso de Formação',
    description: 'Fluxo para inscrição em cursos de formação',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'curso_interesse', 'escolaridade', 'experiencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Escolaridade'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Pré-requisitos',
        order: 3,
        description: 'Verificação de requisitos',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_requisitos', 'disponibilidade_horarios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Vagas',
        order: 4,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['vagas_disponiveis', 'turma_atribuida', 'data_inicio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Confirmação de Matrícula',
        order: 5,
        description: 'Confirmação da inscrição',
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
        name: 'Conclusão',
        order: 6,
        description: 'Inscrição confirmada',
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
    name: 'Workflow - Inscrição em Incubadora de Empresas',
    description: 'Fluxo para inscrição em incubadora de empresas',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['empresa', 'cnpj', 'area_atuacao', 'estagio_desenvolvimento', 'modelo_negocio'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ (se já constituída)', 'Pitch Deck (Apresentação)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise do potencial do negócio',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['inovacao', 'viabilidade', 'potencial_crescimento', 'equipe_adequada', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Apresentação/Pitch',
        order: 4,
        description: 'Apresentação do negócio',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_apresentacao', 'responsavel_avaliacao', 'avaliacao_pitch', 'pontuacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'modalidade_incubacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Formalização',
        order: 6,
        description: 'Formalização do ingresso',
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
        name: 'Conclusão',
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

  // ========== FINANÇAS (workflows faltantes - continuação) ==========
  ISENCAO_IDOSO: {
    moduleType: 'ISENCAO_IDOSO',
    name: 'Workflow - Isenção para Idoso',
    description: 'Fluxo para solicitação de isenção de taxas para idoso',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'idade', 'tipo_isencao_solicitada'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 3,
        description: 'Verificação de critérios',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['idade_minima', 'renda_compativel', 'atende_criterios'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da isenção',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'tipo_isencao_concedida', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 5,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 6,
        description: 'Isenção concedida',
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
    name: 'Workflow - Isenção de IPTU',
    description: 'Fluxo para solicitação de isenção de IPTU',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['inscricao_imobiliaria', 'endereco_imovel', 'motivo_isencao', 'valor_venal'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de Renda'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria (se necessário)',
        order: 3,
        description: 'Vistoria no imóvel',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['necessita_vistoria', 'data_vistoria', 'responsavel_vistoria', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: true
      },
      {
        name: 'Análise de Elegibilidade',
        order: 4,
        description: 'Verificação de critérios',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_isencao', 'percentual_isencao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da isenção',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Lançamento no Sistema',
        order: 6,
        description: 'Lançamento da isenção',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['responsavel_lancamento', 'data_lancamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Certificado',
        order: 7,
        description: 'Emissão do certificado',
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
        name: 'Conclusão',
        order: 8,
        description: 'Isenção concedida',
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
    name: 'Workflow - Isenção de Transporte',
    description: 'Fluxo para solicitação de isenção/gratuidade no transporte público',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'motivo_isencao', 'idade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 3,
        description: 'Verificação de critérios',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_beneficio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da isenção',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Produção do Cartão',
        order: 5,
        description: 'Confecção do cartão',
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
        description: 'Entrega do cartão',
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
        name: 'Conclusão',
        order: 7,
        description: 'Isenção concedida',
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

  // ========== MEIO AMBIENTE (workflows faltantes - continuação) ==========
  LICENCA_ATIVIDADE_POLUIDORA: {
    moduleType: 'LICENCA_ATIVIDADE_POLUIDORA',
    name: 'Workflow - Licença para Atividade Poluidora',
    description: 'Fluxo para licenciamento de atividades potencialmente poluidoras',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['empresa', 'atividade', 'localizacao', 'porte_empreendimento', 'potencial_poluidor'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 5,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Projeto Técnico', 'ART'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise do potencial poluidor',
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
        description: 'Consolidação de pareceres',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_final', 'viabilidade_ambiental', 'condicoes_licenca'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Licença',
        order: 7,
        description: 'Emissão da licença',
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
        name: 'Conclusão',
        order: 8,
        description: 'Licença emitida',
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
    name: 'Workflow - Licença para Atividade Turística',
    description: 'Fluxo para licenciamento de atividades turísticas',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['empreendimento', 'tipo_atividade', 'localizacao', 'capacidade_atendimento'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF ou CNPJ'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise da atividade',
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
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da licença',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'validade', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Licença',
        order: 6,
        description: 'Emissão da licença',
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
        name: 'Conclusão',
        order: 7,
        description: 'Licença emitida',
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
    name: 'Workflow - Licença para Perfuração de Poço',
    description: 'Fluxo para licenciamento de perfuração de poços artesianos',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['localizacao', 'profundidade_estimada', 'vazao_pretendida', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Hidrogeológica',
        order: 3,
        description: 'Análise hidrogeológica',
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
        description: 'Vistoria técnica',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'responsavel_vistoria', 'local_adequado', 'distancias_seguranca', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Ambiental',
        order: 5,
        description: 'Análise de impacto ambiental',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['impacto_ambiental', 'medidas_mitigadoras', 'parecer_ambiental'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação da licença',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Licença',
        order: 7,
        description: 'Emissão da licença',
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
        name: 'Conclusão',
        order: 8,
        description: 'Licença emitida',
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

  // ========== CULTURA (workflows faltantes - continuação) ==========
  LOCACAO_EQUIPAMENTO_CULTURAL: {
    moduleType: 'LOCACAO_EQUIPAMENTO_CULTURAL',
    name: 'Workflow - Locação de Equipamento Cultural',
    description: 'Fluxo para locação de equipamentos culturais',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['solicitante', 'equipamento_solicitado', 'finalidade', 'data_evento', 'data_devolucao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Disponibilidade',
        order: 2,
        description: 'Verificação de disponibilidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['equipamento_disponivel', 'conflito_agenda'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise do Pedido',
        order: 3,
        description: 'Análise da finalidade',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['finalidade_adequada', 'responsavel_evento', 'parecer_tecnico'],
        requiredDocumentTypes: ['Projeto do Evento', 'CPF'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da locação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'valor_locacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Formalização',
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
        name: 'Conclusão',
        order: 6,
        description: 'Locação autorizada',
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

  // ========== HABITAÇÃO (workflows faltantes - continuação) ==========
  MATERIAL_CONSTRUCAO: {
    moduleType: 'MATERIAL_CONSTRUCAO',
    name: 'Workflow - Material de Construção',
    description: 'Fluxo para solicitação de material de construção',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'materiais_solicitados', 'finalidade'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'prioridade', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Técnica',
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
        name: 'Análise de Elegibilidade',
        order: 5,
        description: 'Verificação de critérios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'materiais_aprovados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação e disponibilização',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'data_entrega'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 7,
        description: 'Notificação ao beneficiário',
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
        name: 'Conclusão',
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

  // ========== EDUCAÇÃO (workflows faltantes - continuação) ==========
  MATERIAL_ESCOLAR: {
    moduleType: 'MATERIAL_ESCOLAR',
    name: 'Workflow - Material Escolar',
    description: 'Fluxo para solicitação de material escolar',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['aluno', 'escola', 'serie', 'renda_familiar'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Matrícula'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 3,
        description: 'Verificação de critérios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'renda_compativel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação e disponibilização',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['kit_aprovado', 'local_retirada', 'data_disponivel'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 5,
        description: 'Notificação ao responsável',
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
        name: 'Conclusão',
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

  // ========== POLÍTICAS PARA MULHERES (workflows faltantes) ==========
  MEDIDA_PROTETIVA: {
    moduleType: 'MEDIDA_PROTETIVA',
    name: 'Workflow - Medida Protetiva',
    description: 'Fluxo para solicitação de medida protetiva',
    defaultSLA: 1,
    stages: [
      {
        name: 'Recepção Emergencial',
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
        name: 'Avaliação de Risco',
        order: 2,
        description: 'Avaliação da situação de risco',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['nivel_risco', 'violencias_sofridas', 'necessidade_abrigo', 'parecer_equipe'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Orientação Jurídica',
        order: 3,
        description: 'Orientação sobre medidas protetivas',
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
        description: 'Encaminhamentos necessários',
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
        description: 'Início do acompanhamento',
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
        name: 'Conclusão',
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
    description: 'Fluxo para solicitação de melhoria habitacional',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'situacao_moradia', 'melhorias_necessarias'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'vulnerabilidades', 'prioridade', 'parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Técnica',
        order: 4,
        description: 'Vistoria no imóvel',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'condicoes_moradia', 'melhorias_identificadas', 'orcamento_estimado', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 5,
        description: 'Verificação de critérios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'melhorias_aprovadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação final',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'valor_aprovado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 7,
        description: 'Notificação ao beneficiário',
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
        name: 'Conclusão',
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
    description: 'Fluxo para solicitação de merenda especial',
    defaultSLA: 7,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['aluno', 'escola', 'tipo_restricao', 'dieta_necessaria'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Matrícula'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Nutricional',
        order: 3,
        description: 'Análise do nutricionista',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['cardapio_adequado', 'substituicoes_necessarias', 'parecer_nutricionista'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da merenda especial',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['dieta_aprovada', 'data_inicio', 'validade'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Comunicação à Escola',
        order: 5,
        description: 'Comunicação à unidade escolar',
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
        name: 'Conclusão',
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

  // ========== FINANÇAS (workflows faltantes - continuação) ==========
  PAGAMENTO_ITBI: {
    moduleType: 'PAGAMENTO_ITBI',
    name: 'Workflow - Pagamento de ITBI',
    description: 'Fluxo para pagamento de Imposto de Transmissão de Bens Imóveis',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['tipo_transacao', 'inscricao_imobiliaria', 'valor_transacao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Cálculo do Imposto',
        order: 3,
        description: 'Cálculo do ITBI',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['base_calculo', 'aliquota', 'valor_itbi', 'deducoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Guia',
        order: 4,
        description: 'Emissão da guia de pagamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['numero_guia', 'data_vencimento', 'valor_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Disponibilização',
        order: 5,
        description: 'Disponibilização da guia',
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
        name: 'Conclusão',
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
    name: 'Workflow - Parcelamento de Débitos',
    description: 'Fluxo para parcelamento de débitos municipais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['contribuinte', 'tipo_debito', 'valor_total', 'numero_parcelas_solicitadas'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Crédito',
        order: 3,
        description: 'Análise da capacidade de pagamento',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['capacidade_pagamento', 'numero_parcelas_aprovadas', 'valor_parcela', 'juros_multa'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do parcelamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao', 'condicoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Formalização',
        order: 5,
        description: 'Formalização do parcelamento',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['numero_parcelamento', 'data_vencimento_primeira_parcela'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Carnê',
        order: 6,
        description: 'Emissão das guias',
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
        name: 'Conclusão',
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

  // ========== AGRICULTURA (workflows faltantes - continuação) ==========
  PARTICIPACAO_FEIRAS: {
    moduleType: 'PARTICIPACAO_FEIRAS',
    name: 'Workflow - Participação em Feiras',
    description: 'Fluxo para inscrição em feiras agropecuárias',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['produtor', 'feira_interesse', 'produtos_comercializar', 'espaco_necessario'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Alvará de Funcionamento', 'Catálogo de Produtos/Serviços (se houver)'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Adequação',
        order: 3,
        description: 'Análise dos produtos',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['produtos_adequados', 'qualidade_produtos', 'parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Sorteio/Alocação',
        order: 4,
        description: 'Alocação de espaço',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['espaco_atribuido', 'numero_barraca', 'localizacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 5,
        description: 'Confirmação da participação',
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
        name: 'Conclusão',
        order: 6,
        description: 'Inscrição confirmada',
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

  // ========== MOBILIDADE/TRANSPORTE (workflows faltantes - continuação) ==========
  PASSE_LIVRE_INTERESTADUAL: {
    moduleType: 'PASSE_LIVRE_INTERESTADUAL',
    name: 'Workflow - Passe Livre Interestadual',
    description: 'Fluxo para solicitação de passe livre interestadual',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'tipo_deficiencia', 'renda_familiar'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Laudo Médico (modelo específico)', 'Comprovante de Residência', 'Foto 3x4 recente'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Médica',
        order: 3,
        description: 'Avaliação do laudo médico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_valido', 'deficiencia_comprovada', 'grau_deficiencia', 'parecer_medico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 4,
        description: 'Avaliação socioeconômica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['renda_per_capita', 'atende_criterios_renda'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do passe',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['gestor_aprovador', 'data_aprovacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão',
        order: 6,
        description: 'Envio para emissão',
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
        name: 'Conclusão',
        order: 7,
        description: 'Documentação enviada',
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

  // ========== ASSISTÊNCIA SOCIAL (workflows faltantes - continuação) ==========
  PERICIA_PSICOSSOCIAL: {
    moduleType: 'PERICIA_PSICOSSOCIAL',
    name: 'Workflow - Perícia Psicossocial',
    description: 'Fluxo para solicitação de perícia psicossocial',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['solicitante', 'motivo_pericia', 'grau_urgencia'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Preliminar',
        order: 2,
        description: 'Análise da solicitação',
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
        description: 'Agendamento da perícia',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_pericia', 'horario', 'local', 'profissionais_designados'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Realização',
        order: 4,
        description: 'Realização da perícia',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_realizada', 'profissionais_presentes', 'avaliacao_realizada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Elaboração de Laudo',
        order: 5,
        description: 'Elaboração do laudo',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'documentos-gerados', 'enviar', 'comunicacao'],
        primaryTab: 'documentos-gerados',
        requiredInputFieldIds: ['laudo_psicologico', 'parecer_social', 'conclusoes'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Emissão de Laudo',
        order: 6,
        description: 'Emissão do laudo',
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
        name: 'Conclusão',
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

  // ========== AGRICULTURA (workflows faltantes - continuação) ==========
  PROGRAMA_HORTAS_COMUNITARIAS: {
    moduleType: 'PROGRAMA_HORTAS_COMUNITARIAS',
    name: 'Workflow - Programa de Hortas Comunitárias',
    description: 'Fluxo para inscrição em programa de hortas comunitárias',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['nome', 'cpf', 'renda_familiar', 'experiencia_agricultura'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Residência'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 3,
        description: 'Verificação de critérios',
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
        name: 'Alocação de Lote',
        order: 5,
        description: 'Definição de lote',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['horta_atribuida', 'numero_lote', 'area_lote'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Capacitação',
        order: 6,
        description: 'Capacitação inicial',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_capacitacao', 'temas_abordados', 'presenca_confirmada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Formalização',
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
        name: 'Conclusão',
        order: 8,
        description: 'Inscrição confirmada',
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

  // ========== ASSISTÊNCIA SOCIAL (workflows faltantes - continuação) ==========
  PROGRAMA_PRIMEIRA_INFANCIA: {
    moduleType: 'PROGRAMA_PRIMEIRA_INFANCIA',
    name: 'Workflow - Programa Primeira Infância',
    description: 'Fluxo para inscrição em programa de primeira infância',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['crianca', 'idade_crianca', 'responsavel', 'composicao_familiar', 'renda_familiar'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica',
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
        description: 'Visita técnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'situacao_familia', 'necessidades_identificadas', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 5,
        description: 'Verificação de critérios',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'acoes_recomendadas'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Inclusão no Programa',
        order: 6,
        description: 'Inclusão e orientação',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atividades_oferecidas', 'cronograma', 'responsavel_acompanhamento'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 7,
        description: 'Notificação à família',
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
        name: 'Conclusão',
        order: 8,
        description: 'Família incluída',
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

  // ========== SAÚDE (workflows faltantes - continuação) ==========
  PROGRAMA_SAUDE_FAMILIA: {
    moduleType: 'PROGRAMA_SAUDE_FAMILIA',
    name: 'Workflow - Programa Saúde da Família',
    description: 'Fluxo para inscrição em programa de saúde da família',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da família',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'endereco', 'area_cobertura'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 2,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Cartão SUS', 'RG ou CPF'],
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
        description: 'Inclusão no programa',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['equipe_responsavel', 'unidade_saude', 'agente_comunitario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Notificação',
        order: 5,
        description: 'Notificação à família',
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
        name: 'Conclusão',
        order: 6,
        description: 'Família cadastrada',
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

  // ========== HABITAÇÃO (workflows faltantes - continuação) ==========
  PROJETO_ARQUITETONICO_SOCIAL: {
    moduleType: 'PROJETO_ARQUITETONICO_SOCIAL',
    name: 'Workflow - Projeto Arquitetônico Social',
    description: 'Fluxo para solicitação de projeto arquitetônico social',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: [],
        requiredInputFieldIds: ['composicao_familiar', 'renda_familiar', 'possui_terreno', 'area_construcao'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda'],
        requiredInputFieldIds: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 3,
        description: 'Avaliação socioeconômica',
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
        description: 'Vistoria técnica',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_visita', 'responsavel_visita', 'caracteristicas_terreno', 'viabilidade_construcao', 'relatorio'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Elegibilidade',
        order: 5,
        description: 'Verificação de critérios',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['atende_criterios', 'tipo_projeto_adequado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Elaboração do Projeto',
        order: 6,
        description: 'Elaboração arquitetônica',
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
        description: 'Entrega ao beneficiário',
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
        name: 'Conclusão',
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
        name: 'Recepção',
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
        name: 'Análise',
        order: 2,
        description: 'Análise e encaminhamento',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Conclusão',
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
    name: 'Workflow - Regularização de Obra',
    description: 'Fluxo para regularização de obras executadas',
    defaultSLA: 60,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['Projeto As-Built', 'ART', 'Matrícula do Imóvel', 'Fotos da Edificação'],
        requiredInputFieldIds: ['inscricao_imobiliaria', 'tipo_obra', 'area_construida'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação de documentos',
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
        description: 'Vistoria técnica da obra',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_tecnico', 'parecer_vistoria'],
        requiredDocumentTypes: ['Projeto As-Built', 'ART', 'Matrícula do Imóvel', 'Fotos da Edificação'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Jurídica',
        order: 4,
        description: 'Análise jurídica da regularização',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 5,
        description: 'Aprovação final da regularização',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certidão',
        order: 6,
        description: 'Emissão da certidão de regularização',
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
        name: 'Conclusão',
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
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise Técnica',
        order: 2,
        description: 'Análise técnica do remembramento',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Jurídica',
        order: 3,
        description: 'Análise jurídica',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do remembramento',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Certidão',
        order: 5,
        description: 'Emissão da certidão de remembramento',
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
        name: 'Conclusão',
        order: 6,
        description: 'Remembramento concluído',
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
    name: 'Workflow - Renovação de Credenciamento',
    description: 'Fluxo para renovação de credenciamentos',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da renovação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['CNH Atualizada', 'CRLV Atualizado', 'Vistoria em Dia', 'Certidão Negativa de Multas'],
        requiredInputFieldIds: ['tipo_credenciamento', 'numero_credenciamento_atual'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'Verificação',
        order: 2,
        description: 'Verificação de regularidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise',
        order: 3,
        description: 'Análise da renovação',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da renovação',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Credencial',
        order: 5,
        description: 'Emissão da nova credencial',
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
        name: 'Conclusão',
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
    name: 'Workflow - Regularização Fundiária (REURB)',
    description: 'Fluxo para Regularização Fundiária Urbana',
    defaultSLA: 180,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência'],
        requiredInputFieldIds: ['tipo_reurb', 'area_ocupacao', 'numero_familias'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'Análise Preliminar',
        order: 2,
        description: 'Análise preliminar da área',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Levantamento Topográfico',
        order: 3,
        description: 'Levantamento topográfico da área',
        slaDays: 30,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['levantamento_topografico'],
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Residência', 'Declaração de Posse', 'Levantamento Topográfico (se houver)'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Análise Jurídica',
        order: 4,
        description: 'Análise jurídica da regularização',
        slaDays: 30,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Projeto de Regularização',
        order: 5,
        description: 'Elaboração do projeto de regularização',
        slaDays: 45,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['projeto_regularizacao'],
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Residência', 'Declaração de Posse', 'Levantamento Topográfico (se houver)'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação da regularização',
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
        name: 'Conclusão',
        order: 8,
        description: 'REURB concluída',
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
    name: 'Workflow - Revisão de IPTU',
    description: 'Fluxo para revisão de lançamento de IPTU',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['Carnê de IPTU', 'Fotos do Imóvel', 'Laudo de Avaliação (se houver)', 'Escritura do Imóvel'],
        requiredInputFieldIds: ['inscricao_imobiliaria', 'motivo_revisao', 'ano_exercicio'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'Análise Cadastral',
        order: 2,
        description: 'Análise dos dados cadastrais',
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
        description: 'Vistoria do imóvel (se necessário)',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: true
      },
      {
        name: 'Análise Fiscal',
        order: 4,
        description: 'Análise fiscal da revisão',
        slaDays: 7,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Decisão',
        order: 5,
        description: 'Decisão sobre a revisão',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['decisao', 'novo_valor_iptu'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Conclusão',
        order: 6,
        description: 'Revisão concluída',
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
    description: 'Fluxo para solicitação de Seguro Safra',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Verificação DAP',
        order: 2,
        description: 'Verificação da DAP',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 3,
        description: 'Vistoria da área cultivada',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria'],
        requiredDocumentTypes: ['CPF', 'DAP', 'Comprovante de Área Plantada'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise',
        order: 4,
        description: 'Análise da solicitação',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do seguro',
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
        name: 'Conclusão',
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
    name: 'Workflow - Solicitação de Abrigo',
    description: 'Fluxo para solicitação de abrigo temporário',
    defaultSLA: 3,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Avaliação Social',
        order: 2,
        description: 'Avaliação da situação social',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Definição de Vaga',
        order: 3,
        description: 'Definição da vaga no abrigo',
        slaDays: 1,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['abrigo_destinado', 'data_entrada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Conclusão',
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
    name: 'Workflow - Solicitação de Fisioterapia',
    description: 'Fluxo para solicitação de fisioterapia',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise Médica',
        order: 2,
        description: 'Análise do pedido médico',
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
        description: 'Agendamento das sessões',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_inicio', 'horario', 'unidade_saude'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Conclusão',
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
    name: 'Workflow - Solicitação de Lote em Distrito',
    description: 'Fluxo para solicitação de lote em distrito',
    defaultSLA: 60,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise Socioeconômica',
        order: 2,
        description: 'Análise socioeconômica do solicitante',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_socioeconomico'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Disponibilidade',
        order: 3,
        description: 'Verificação de lotes disponíveis',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Jurídica',
        order: 4,
        description: 'Análise jurídica da concessão',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da concessão',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['lote_designado'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Termo',
        order: 6,
        description: 'Emissão do termo de concessão',
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
        name: 'Conclusão',
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
    name: 'Workflow - Solicitação de Microcrédito',
    description: 'Fluxo para solicitação de microcrédito',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise Cadastral',
        order: 2,
        description: 'Análise cadastral do solicitante',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Crédito',
        order: 3,
        description: 'Análise de crédito',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['score_credito', 'parecer_analista'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 4,
        description: 'Análise socioeconômica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação do microcrédito',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['valor_aprovado', 'taxa_juros', 'prazo_final'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Contratação',
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
        name: 'Conclusão',
        order: 7,
        description: 'Microcrédito aprovado',
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
    description: 'Fluxo para solicitação de tarifa social de energia',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise Socioeconômica',
        order: 2,
        description: 'Análise da situação socioeconômica',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_social'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação CadÚnico',
        order: 3,
        description: 'Verificação no Cadastro Único',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da tarifa social',
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
        description: 'Encaminhamento à concessionária',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
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
    name: 'Workflow - Tombamento de Patrimônio',
    description: 'Fluxo para tombamento de patrimônio histórico',
    defaultSLA: 90,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise Preliminar',
        order: 2,
        description: 'Análise preliminar do bem',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Pesquisa Histórica',
        order: 3,
        description: 'Pesquisa histórica do bem',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['pesquisa_historica'],
        requiredDocumentTypes: ['CPF', 'RG', 'Documentação Histórica', 'Fotos', 'Laudo Técnico'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 4,
        description: 'Vistoria técnica do bem',
        slaDays: 15,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_tecnico'],
        requiredDocumentTypes: ['Laudo Técnico'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Parecer Conselho',
        order: 5,
        description: 'Parecer do conselho de patrimônio',
        slaDays: 20,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_conselho'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 6,
        description: 'Aprovação do tombamento',
        slaDays: 10,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Publicação',
        order: 7,
        description: 'Publicação do tombamento',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
        order: 8,
        description: 'Tombamento concluído',
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
    name: 'Workflow - Transferência de Ponto de Táxi',
    description: 'Fluxo para transferência de ponto de táxi',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['Credencial de Taxista', 'Certidão Negativa de Multas', 'Justificativa'],
        requiredInputFieldIds: ['ponto_atual', 'ponto_destino', 'justificativa'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'Verificação de Regularidade',
        order: 2,
        description: 'Verificação da regularidade do taxista',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Disponibilidade',
        order: 3,
        description: 'Análise da disponibilidade do ponto',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da transferência',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 5,
        description: 'Emissão da autorização de transferência',
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
        name: 'Conclusão',
        order: 6,
        description: 'Transferência concluída',
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
    description: 'Fluxo para solicitação de transporte escolar gratuito',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG ou Certidão de Nascimento', 'CPF', 'Comprovante de Residência'],
        requiredInputFieldIds: ['nome_aluno', 'escola', 'serie', 'turno', 'endereco'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'Verificação Escolar',
        order: 2,
        description: 'Verificação da matrícula escolar',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Rota',
        order: 3,
        description: 'Análise da rota e disponibilidade',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['rota_designada', 'horario'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do transporte',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Conclusão',
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
    description: 'Fluxo para inscrição em treinamento de defesa civil',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da inscrição',
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
        name: 'Análise de Vagas',
        order: 2,
        description: 'Verificação de vagas disponíveis',
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
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação de participação',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Conclusão',
        order: 5,
        description: 'Inscrição confirmada',
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
    description: 'Fluxo para solicitação de uniforme escolar',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['Comprovante de Matrícula', 'Declaração de Baixa Renda (se aplicável)'],
        requiredInputFieldIds: ['nome_aluno', 'escola', 'serie', 'tamanho'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'Verificação Escolar',
        order: 2,
        description: 'Verificação da matrícula',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Separação',
        order: 3,
        description: 'Separação do uniforme',
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
        name: 'Conclusão',
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
    name: 'Workflow - Uso de Espaço Público',
    description: 'Fluxo para autorização de uso de espaço público',
    defaultSLA: 20,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise de Disponibilidade',
        order: 2,
        description: 'Verificação da disponibilidade do espaço',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 3,
        description: 'Análise técnica do evento',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação do uso do espaço',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 5,
        description: 'Emissão da autorização',
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
        name: 'Conclusão',
        order: 6,
        description: 'Autorização concedida',
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
    name: 'Workflow - Uso de Ginásio',
    description: 'Fluxo para autorização de uso de ginásio esportivo',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise de Disponibilidade',
        order: 2,
        description: 'Verificação da disponibilidade do ginásio',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 3,
        description: 'Aprovação do uso',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Autorização',
        order: 4,
        description: 'Emissão da autorização',
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
        name: 'Conclusão',
        order: 5,
        description: 'Autorização concedida',
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
    description: 'Fluxo para solicitação de vaga especial de estacionamento',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise de Viabilidade',
        order: 2,
        description: 'Análise da viabilidade técnica',
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
        name: 'Aprovação',
        order: 4,
        description: 'Aprovação da vaga',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Implantação',
        order: 5,
        description: 'Implantação da sinalização',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_implantacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
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
    description: 'Fluxo para solicitação de vaga especial para pessoa com deficiência',
    defaultSLA: 30,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredDocumentTypes: ['RG', 'CPF', 'CNH (se condutor)', 'Comprovante de Residência'],
        requiredInputFieldIds: ['endereco_vaga', 'tipo_deficiencia', 'placa_veiculo'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false,
        stageType: 'RECEPTION'
      },
      {
        name: 'Análise de Laudo',
        order: 2,
        description: 'Análise do laudo médico',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise de Viabilidade',
        order: 3,
        description: 'Análise da viabilidade técnica',
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
        requiredDocumentTypes: ['RG', 'CPF', 'CNH (se condutor)', 'Laudo Médico', 'Documento do Veículo', 'Comprovante de Residência'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação',
        order: 5,
        description: 'Aprovação da vaga PCD',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Implantação',
        order: 6,
        description: 'Implantação da sinalização PCD',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_implantacao'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
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
    name: 'Workflow - Vistoria de Área de Risco',
    description: 'Fluxo para vistoria de área de risco',
    defaultSLA: 10,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        name: 'Análise Preliminar',
        order: 2,
        description: 'Análise preliminar da urgência',
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
        description: 'Agendamento da vistoria técnica',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['data_vistoria', 'equipe_designada'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Vistoria Técnica',
        order: 4,
        description: 'Realização da vistoria',
        slaDays: 3,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['laudo_vistoria', 'medidas_recomendadas'],
        requiredDocumentTypes: ['Fotos do Local (se possível)'],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Parecer Técnico',
        order: 5,
        description: 'Elaboração do parecer técnico',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['parecer_tecnico', 'acoes_necessarias'],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Conclusão',
        order: 6,
        description: 'Vistoria concluída',
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
    name: 'Workflow - Vistoria de Veículo',
    description: 'Fluxo para vistoria veicular',
    defaultSLA: 15,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Registro da solicitação',
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
        description: 'Realização da vistoria',
        slaDays: 5,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredInputFieldIds: ['resultado_vistoria', 'observacoes'],
        requiredDocumentTypes: ['CRLV', 'Comprovante de Pagamento de Taxas'],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Laudo',
        order: 4,
        description: 'Emissão do laudo de vistoria',
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
        name: 'Conclusão',
        order: 5,
        description: 'Vistoria concluída',
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

  // Serviços que precisam de documentos
  if (serviceName.includes('certidão') || serviceName.includes('declaração') ||
      serviceName.includes('atestado') || serviceName.includes('cadastro') ||
      serviceName.includes('inscrição') || serviceName.includes('licença') ||
      serviceName.includes('alvará') || serviceName.includes('segunda via') ||
      serviceName.includes('registro') || serviceName.includes('matrícula') ||
      serviceName.includes('vistoria') || serviceName.includes('laudo')) {
    if (!tabs.includes('documentos')) tabs.push('documentos');
  }

  // Serviços que precisam de dados/formulários
  if (serviceName.includes('cadastro') || serviceName.includes('inscrição') ||
      serviceName.includes('matrícula') || serviceName.includes('agendamento') ||
      serviceName.includes('solicitação') || serviceName.includes('reserva')) {
    if (!tabs.includes('dados')) tabs.push('dados');
    if (stageOrder === 2 && !serviceName.includes('vistoria')) {
      primaryTab = 'dados';
    }
  }

  // Serviços de vistoria/inspeção
  if (serviceName.includes('vistoria') || serviceName.includes('inspeção') ||
      serviceName.includes('laudo') || serviceName.includes('aprovação de projeto') ||
      stageName.toLowerCase().includes('vistoria') || stageName.toLowerCase().includes('inspeção')) {
    if (!tabs.includes('dados')) tabs.push('dados');
    if (stageOrder >= 2 && stageOrder <= 3) {
      primaryTab = 'dados';
    }
  }

  // Sempre incluir pendências e comunicação
  tabs.push('pendencias');
  tabs.push('comunicacao');

  return { availableTabs: tabs, primaryTab: primaryTab };
}

/**
 * ============================================================================
 * GERADOR DE WORKFLOW GENÉRICO CONTEXTUAL
 * ============================================================================
 */
function generateGenericWorkflow(service: any): any[] {
  const serviceName = service.name?.toLowerCase() || '';
  const stages: any[] = [];

  stages.push({
    name: 'Recepção e Análise Documental',
    order: 1,
    description: 'Recebimento e verificação de documentos',
    slaDays: 2,
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false,
    ...generateContextualUIMetadata(service, 'Recepção e Análise Documental', 1)
  });

  stages.push({
    name: 'Análise Técnica',
    order: 2,
    description: 'Análise técnica da solicitação',
    slaDays: 3,
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false,
    ...generateContextualUIMetadata(service, 'Análise Técnica', 2)
  });

  if (serviceName.includes('vistoria') || serviceName.includes('inspeção') ||
      serviceName.includes('aprovação de projeto') || serviceName.includes('licença') ||
      serviceName.includes('alvará') || serviceName.includes('laudo')) {
    stages.push({
      name: 'Vistoria/Inspeção',
      order: 3,
      description: 'Vistoria técnica in loco',
      slaDays: 5,
      requiredDocumentTypes: [],
      requiredInputFieldIds: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false,
      ...generateContextualUIMetadata(service, 'Vistoria/Inspeção', 3)
    });
  }

  stages.push({
    name: 'Processamento',
    order: stages.length + 1,
    description: 'Processamento e preparação',
    slaDays: 5,
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false,
    ...generateContextualUIMetadata(service, 'Processamento', stages.length + 1)
  });

  stages.push({
    name: 'Aprovação Final',
    order: stages.length + 1,
    description: 'Aprovação final do gestor',
    slaDays: 2,
    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REJECT'],
    canSkip: false,
    ...generateContextualUIMetadata(service, 'Aprovação Final', stages.length + 1)
  });

  stages.push({
    name: 'Conclusão',
    order: stages.length + 1,
    description: 'Emissão de documento ou finalização',
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
 * WORKFLOW GENÉRICO PARA SERVIÇOS SEM_DADOS
 * ============================================================================
 */
const genericWorkflowStages: Prisma.JsonValue = [
  {
    name: 'Recebimento',
    order: 1,
    description: 'Protocolo recebido e aguardando análise inicial',
    slaDays: 2,

    availableTabs: ['resumo', 'comunicacao'],
    primaryTab: 'resumo',

    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false
  },
  {
    name: 'Análise',
    order: 2,
    description: 'Análise da solicitação',
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
    description: 'Processamento da solicitação',
    slaDays: 5,

    availableTabs: ['resumo', 'pendencias', 'comunicacao'],
    primaryTab: 'resumo',

    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false
  },
  {
    name: 'Aprovação',
    order: 4,
    description: 'Aprovação final',
    slaDays: 2,

    availableTabs: ['resumo', 'comunicacao'],
    primaryTab: 'resumo',

    requiredDocumentTypes: [],
    requiredInputFieldIds: [],
    allowedActions: ['APPROVE', 'REJECT'],
    canSkip: false
  },
  {
    name: 'Conclusão',
    order: 5,
    description: 'Emissão de documento ou conclusão do atendimento',
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
 * FUNÇÃO PRINCIPAL DE SEED
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
  console.log('\n📦 Iniciando seed de ServiceWorkflows (COM METADADOS DE UI)...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // 1. Buscar todos os serviços ativos
  const services = await prisma.serviceSimplified.findMany({
    where: {
      isActive: true
    },
    include: {
      department: true
    }
  });

  console.log(`\n   → Encontrados ${services.length} serviços ativos`);

  // 2. Processar cada serviço
  for (const service of services) {
    try {
      // Verificar se já tem workflow
      const existing = await prisma.serviceWorkflow.findUnique({
        where: { serviceId: service.id }
      });

      let workflowName: string;
      let workflowDescription: string;
      let defaultSLA: number;

      if (service.moduleType && specificWorkflows[service.moduleType]) {
        // Usar workflow específico
        const specific = specificWorkflows[service.moduleType];
        workflowName = specific.name;
        workflowDescription = specific.description;
        defaultSLA = specific.defaultSLA;
      } else {
        // Usar workflow genérico
        workflowName = `Workflow - ${service.name}`;
        workflowDescription = `Fluxo padrão para ${service.name}`;
        defaultSLA = service.estimatedDays || 10;
      }

      const { stages: workflowStages, unresolvedInputCount, movedOutputCount, source } =
        buildSeedWorkflowStagesForService(service);

      if (unresolvedInputCount > 0) {
        console.warn(
          `   Aviso: ${service.name}: ${unresolvedInputCount} campo(s) de entrada não mapeado(s) movido(s) para requiredStageOutputs (${movedOutputCount} novo(s)).`
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
        console.log(`   ✓ Atualizado: ${service.name} (${service.department?.name})`);
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
        console.log(`   ✓ Criado: ${service.name} (${service.department?.name})`);
      }
    } catch (error: any) {
      console.error(`   ✗ Erro ao processar ${service.name}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ Seed de ServiceWorkflows concluído:`);
  console.log(`   - Criados: ${created}`);
  console.log(`   - Atualizados: ${updated}`);
  console.log(`   - Ignorados: ${skipped}`);
  console.log(`   - Total: ${created + updated + skipped}\n`);
}

/**
 * ============================================================================
 * EXECUÇÃO STANDALONE
 * ============================================================================
 */
if (require.main === module) {
  seedServiceWorkflows()
    .then(() => {
      console.log('✅ Seed executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
