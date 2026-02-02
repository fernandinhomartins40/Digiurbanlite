/**
 * ============================================================================
 * WORKFLOWS COMPLETOS - 100% DE COBERTURA
 * ============================================================================
 *
 * Este arquivo contém TODOS os 288 workflows para serviços COM_DADOS
 * Gerado automaticamente em generate_all_workflows_complete.py
 *
 * ELIMINADOS: Workflows legados/órfãos que não são usados
 * INCLUÍDOS: Todos os moduleTypes ativos do sistema
 *
 * CARACTERÍSTICAS:
 * - Cada serviço COM_DADOS tem seu workflow específico
 * - Todos incluem stage de "Análise Documental" quando necessário
 * - SLAs ajustados automaticamente por tipo de serviço
 * - Metadados de UI completos
 *
 * INSTRUÇÕES:
 * 1. Revisar os workflows gerados
 * 2. Ajustar SLAs conforme necessário
 * 3. Adicionar campos obrigatórios específicos (requiredFormFields)
 * 4. Substituir o conteúdo de specificWorkflows em service-workflows.seed.ts
 * 5. Executar seed do banco de dados
 */

import { Prisma } from '@prisma/client';

interface SpecificWorkflow {
  moduleType: string;
  name: string;
  description: string;
  defaultSLA: number;
  stages: Prisma.JsonValue;
}

const specificWorkflows: Record<string, SpecificWorkflow> = {

  ACIONAMENTO_SIRENE: {
    moduleType: 'ACIONAMENTO_SIRENE',
    name: 'Workflow - Solicitação de Acionamento de Sirene de Alerta',
    description: 'Fluxo para solicitação de acionamento de sirene de alerta',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ACOLHIMENTO_CASA_ABRIGO: {
    moduleType: 'ACOLHIMENTO_CASA_ABRIGO',
    name: 'Workflow - Solicitação de Acolhimento em Casa Abrigo',
    description: 'Fluxo para solicitação de acolhimento em casa abrigo',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Boletim de Ocorrência', 'Documentos dos Filhos (se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ACOMPANHAMENTO_SOCIAL: {
    moduleType: 'ACOMPANHAMENTO_SOCIAL',
    name: 'Workflow - Solicitação de Acompanhamento Social',
    description: 'Fluxo para solicitação de acompanhamento social',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AEE: {
    moduleType: 'AEE',
    name: 'Workflow - Atendimento Educacional Especializado (AEE)',
    description: 'Fluxo para atendimento educacional especializado (aee)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Laudo Médico', 'Relatório Pedagógico', 'Comprovante de Matrícula'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AGENDAMENTO_CAPS: {
    moduleType: 'AGENDAMENTO_CAPS',
    name: 'Workflow - Agendamento CAPS (Saúde Mental)',
    description: 'Fluxo para agendamento caps (saúde mental)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Encaminhamento Médico (se houver)', 'Cartão SUS', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AGENDAMENTO_CENTRO_REFERENCIA: {
    moduleType: 'AGENDAMENTO_CENTRO_REFERENCIA',
    name: 'Workflow - Agendamento no Centro de Referência da Mulher',
    description: 'Fluxo para agendamento no centro de referência da mulher',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AGENDAMENTO_CONSULTA: {
    moduleType: 'AGENDAMENTO_CONSULTA',
    name: 'Workflow - Agendamento de Consulta Médica',
    description: 'Fluxo para agendamento de consulta médica',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Cartão SUS', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AGENDAMENTO_ESPECIALIZADO: {
    moduleType: 'AGENDAMENTO_ESPECIALIZADO',
    name: 'Workflow - Agendamento de Atendimento Presencial Especializado',
    description: 'Fluxo para agendamento de atendimento presencial especializado',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Documentos relacionados ao assunto do agendamento'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AGENDAMENTO_GERAL: {
    moduleType: 'AGENDAMENTO_GERAL',
    name: 'Workflow - Agendamento de Serviços Gerais',
    description: 'Fluxo para agendamento de serviços gerais',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AGENDAMENTO_ODONTOLOGIA: {
    moduleType: 'AGENDAMENTO_ODONTOLOGIA',
    name: 'Workflow - Agendamento de Consulta Odontológica',
    description: 'Fluxo para agendamento de consulta odontológica',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Cartão SUS', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AGENDAMENTO_SALA_EMPREENDEDOR: {
    moduleType: 'AGENDAMENTO_SALA_EMPREENDEDOR',
    name: 'Workflow - Agendamento Sala do Empreendedor',
    description: 'Fluxo para agendamento sala do empreendedor',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ALERTA_EMERGENCIA: {
    moduleType: 'ALERTA_EMERGENCIA',
    name: 'Workflow - Registro de Alerta de Emergência',
    description: 'Fluxo para registro de alerta de emergência',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ALERTA_SEGURANCA: {
    moduleType: 'ALERTA_SEGURANCA',
    name: 'Workflow - Alerta de Segurança',
    description: 'Fluxo para alerta de segurança',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ALVARA_CONSTRUCAO: {
    moduleType: 'ALVARA_CONSTRUCAO',
    name: 'Workflow - Alvará de Construção',
    description: 'Fluxo para alvará de construção',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Aprovado', 'Matrícula do Imóvel', 'ART'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ALVARA_FUNCIONAMENTO: {
    moduleType: 'ALVARA_FUNCIONAMENTO',
    name: 'Workflow - Alvará de Funcionamento',
    description: 'Fluxo para alvará de funcionamento',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'Laudo Técnico', 'Comprovante de Endereço'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ALVARA_REFORMA: {
    moduleType: 'ALVARA_REFORMA',
    name: 'Workflow - Alvará de Reforma',
    description: 'Fluxo para alvará de reforma',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto de Reforma', 'ART', 'Matrícula do Imóvel'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ANALISE_SOLO: {
    moduleType: 'ANALISE_SOLO',
    name: 'Workflow - Solicitação de Análise de Solo',
    description: 'Fluxo para solicitação de análise de solo',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Cadastro de Produtor Rural (opcional)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ANALISE_VIABILIDADE_EMPREENDIMENTO: {
    moduleType: 'ANALISE_VIABILIDADE_EMPREENDIMENTO',
    name: 'Workflow - Análise de Viabilidade de Empreendimento',
    description: 'Fluxo para análise de viabilidade de empreendimento',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Projeto Preliminar', 'Estudo de Impacto', 'Matrícula do Terreno'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  API_INTEGRACAO: {
    moduleType: 'API_INTEGRACAO',
    name: 'Workflow - Solicitação de Integração via API',
    description: 'Fluxo para solicitação de integração via api',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ da Empresa', 'Contrato Social', 'Termo de Uso e Responsabilidade', 'Documentação Técnica do Sistema'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  APOIO_CULTURAL: {
    moduleType: 'APOIO_CULTURAL',
    name: 'Workflow - Solicitação de Apoio Cultural',
    description: 'Fluxo para solicitação de apoio cultural',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Projeto ou Proposta'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  APOIO_FEIRA_EXPOSICAO: {
    moduleType: 'APOIO_FEIRA_EXPOSICAO',
    name: 'Workflow - Solicitação de Apoio a Feira/Exposição',
    description: 'Fluxo para solicitação de apoio a feira/exposição',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF ou CNPJ', 'Projeto do Evento', 'Cronograma'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  APROVACAO_CALCADA: {
    moduleType: 'APROVACAO_CALCADA',
    name: 'Workflow - Aprovação de Calçada',
    description: 'Fluxo para aprovação de calçada',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  APROVACAO_DEMOLICAO_PARCIAL: {
    moduleType: 'APROVACAO_DEMOLICAO_PARCIAL',
    name: 'Workflow - Aprovação de Demolição Parcial',
    description: 'Fluxo para aprovação de demolição parcial',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto de Demolição', 'ART', 'Matrícula do Imóvel'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  APROVACAO_LOTEAMENTO: {
    moduleType: 'APROVACAO_LOTEAMENTO',
    name: 'Workflow - Aprovação de Loteamento',
    description: 'Fluxo para aprovação de loteamento',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto de Loteamento', 'Memorial Descritivo', 'Matrícula do Terreno', 'ART', 'Licença Ambiental'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  APROVACAO_MURO: {
    moduleType: 'APROVACAO_MURO',
    name: 'Workflow - Aprovação de Muro e Gradil',
    description: 'Fluxo para aprovação de muro e gradil',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  APROVACAO_PROJETO: {
    moduleType: 'APROVACAO_PROJETO',
    name: 'Workflow - Aprovação de Projeto de Construção',
    description: 'Fluxo para aprovação de projeto de construção',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Arquitetônico', 'ART', 'Matrícula do Imóvel', 'Planta de Situação'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  APROVACAO_PROJETO_ARQUITETONICO: {
    moduleType: 'APROVACAO_PROJETO_ARQUITETONICO',
    name: 'Workflow - Aprovação de Projeto Arquitetônico',
    description: 'Fluxo para aprovação de projeto arquitetônico',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Arquitetônico', 'ART', 'Documentação do Imóvel'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  APROVACAO_PROJETO_URBANIZACAO: {
    moduleType: 'APROVACAO_PROJETO_URBANIZACAO',
    name: 'Workflow - Aprovação de Projeto de Urbanização',
    description: 'Fluxo para aprovação de projeto de urbanização',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto de Urbanização', 'Memorial Descritivo', 'ART', 'Estudo Ambiental'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  APROVACAO_TERRAPLENO: {
    moduleType: 'APROVACAO_TERRAPLENO',
    name: 'Workflow - Aprovação de Terraplanagem',
    description: 'Fluxo para aprovação de terraplanagem',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ASSISTENCIA_TECNICA: {
    moduleType: 'ASSISTENCIA_TECNICA',
    name: 'Workflow - Assistência Técnica Rural',
    description: 'Fluxo para assistência técnica rural',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Cadastro de Produtor Rural (opcional)', 'Documento da Propriedade (opcional)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ATENDIMENTOS_AGRICULTURA: {
    moduleType: 'ATENDIMENTOS_AGRICULTURA',
    name: 'Workflow - Solicitação de Atendimento Geral - Agricultura',
    description: 'Fluxo para solicitação de atendimento geral - agricultura',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ATENDIMENTOS_CULTURA: {
    moduleType: 'ATENDIMENTOS_CULTURA',
    name: 'Workflow - Solicitação de Atendimento Geral - Cultura',
    description: 'Fluxo para solicitação de atendimento geral - cultura',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ATENDIMENTO_CRAS: {
    moduleType: 'ATENDIMENTO_CRAS',
    name: 'Workflow - Agendamento de Atendimento Social',
    description: 'Fluxo para agendamento de atendimento social',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ATENDIMENTO_CRAS_GERAL: {
    moduleType: 'ATENDIMENTO_CRAS_GERAL',
    name: 'Workflow - Atendimento CRAS',
    description: 'Fluxo para atendimento cras',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ATENDIMENTO_DOMICILIAR: {
    moduleType: 'ATENDIMENTO_DOMICILIAR',
    name: 'Workflow - Solicitação de Atendimento Domiciliar',
    description: 'Fluxo para solicitação de atendimento domiciliar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Laudo Médico', 'Cartão SUS', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ATRACAO_EMPRESAS: {
    moduleType: 'ATRACAO_EMPRESAS',
    name: 'Workflow - Atração de Empresas e Investimentos',
    description: 'Fluxo para atração de empresas e investimentos',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ATUALIZACAO_CADASTRAL_EMPRESA: {
    moduleType: 'ATUALIZACAO_CADASTRAL_EMPRESA',
    name: 'Workflow - Atualização Cadastral de Empresa',
    description: 'Fluxo para atualização cadastral de empresa',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Contrato Social Atualizado', 'CNPJ', 'RG e CPF do Responsável', 'Comprovante de Endereço Comercial'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ATUALIZACAO_CADASTRAL_IMOVEL: {
    moduleType: 'ATUALIZACAO_CADASTRAL_IMOVEL',
    name: 'Workflow - Atualização Cadastral de Imóvel',
    description: 'Fluxo para atualização cadastral de imóvel',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura ou Contrato de Compra e Venda', 'RG e CPF do Proprietário', 'Comprovante de Endereço', 'Carnê de IPTU'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_CAPTACAO_AGUA: {
    moduleType: 'AUTORIZACAO_CAPTACAO_AGUA',
    name: 'Workflow - Autorização Captação Água',
    description: 'Fluxo para autorização captação água',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Projeto Hidráulico', 'ART'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_CONSTRUCAO: {
    moduleType: 'AUTORIZACAO_CONSTRUCAO',
    name: 'Workflow - Autorização para Construção',
    description: 'Fluxo para autorização para construção',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Arquitetônico', 'ART (Anotação de Responsabilidade Técnica)', 'Matrícula do Imóvel'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_DEMOLICAO: {
    moduleType: 'AUTORIZACAO_DEMOLICAO',
    name: 'Workflow - Autorização para Demolição',
    description: 'Fluxo para autorização para demolição',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Matrícula do Imóvel', 'Projeto de Demolição', 'ART'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_EVENTO_SEGURANCA: {
    moduleType: 'AUTORIZACAO_EVENTO_SEGURANCA',
    name: 'Workflow - Autorização de Segurança para Eventos',
    description: 'Fluxo para autorização de segurança para eventos',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto do Evento', 'Plano de Segurança', 'Seguro (opcional)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_EVENTO_VIA: {
    moduleType: 'AUTORIZACAO_EVENTO_VIA',
    name: 'Workflow - Autorização para Evento em Via Pública',
    description: 'Fluxo para autorização para evento em via pública',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto do Evento', 'Seguro de Responsabilidade Civil', 'Alvará (se aplicável)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_INTERVENCAO_VIA: {
    moduleType: 'AUTORIZACAO_INTERVENCAO_VIA',
    name: 'Workflow - Autorização para Intervenção em Via Pública',
    description: 'Fluxo para autorização para intervenção em via pública',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'CNPJ (se empresa)', 'Projeto de Intervenção', 'ART'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_MANEJO_FAUNA: {
    moduleType: 'AUTORIZACAO_MANEJO_FAUNA',
    name: 'Workflow - Autorização Manejo Fauna',
    description: 'Fluxo para autorização manejo fauna',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Projeto de Manejo', 'ART'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_PODA_ARVORES: {
    moduleType: 'AUTORIZACAO_PODA_ARVORES',
    name: 'Workflow - Autorização para Poda ou Supressão de Árvores',
    description: 'Fluxo para autorização para poda ou supressão de árvores',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Propriedade', 'Fotos do Local'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_SUPRESSAO_VEGETAL: {
    moduleType: 'AUTORIZACAO_SUPRESSAO_VEGETAL',
    name: 'Workflow - Autorização Supressão Vegetal',
    description: 'Fluxo para autorização supressão vegetal',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Levantamento Topográfico', 'Fotos'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_TRANSPORTE_ESCOLAR: {
    moduleType: 'AUTORIZACAO_TRANSPORTE_ESCOLAR',
    name: 'Workflow - Autorização para Transporte Escolar',
    description: 'Fluxo para autorização para transporte escolar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH categoria D ou superior', 'Certidão de Antecedentes Criminais', 'Documento do Veículo', 'Vistoria do Veículo', 'Seguro do Veículo'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUTORIZACAO_TRANSPORTE_TURISTICO: {
    moduleType: 'AUTORIZACAO_TRANSPORTE_TURISTICO',
    name: 'Workflow - Autorização para Transporte Turístico',
    description: 'Fluxo para autorização para transporte turístico',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'CNH Categoria D ou E', 'Documentos dos Veículos', 'Seguro dos Veículos'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUXILIO_ALUGUEL: {
    moduleType: 'AUXILIO_ALUGUEL',
    name: 'Workflow - Auxílio Aluguel',
    description: 'Fluxo para auxílio aluguel',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Contrato de Aluguel', 'CPF', 'RG', 'Comprovante de Renda', 'Declaração de Vulnerabilidade'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUXILIO_CONSTRUCAO: {
    moduleType: 'AUXILIO_CONSTRUCAO',
    name: 'Workflow - Auxílio Construção',
    description: 'Fluxo para auxílio construção',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'Matrícula do Terreno'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  AUXILIO_EMERGENCIAL: {
    moduleType: 'AUXILIO_EMERGENCIAL',
    name: 'Workflow - Auxílio Emergencial (Cesta Básica)',
    description: 'Fluxo para auxílio emergencial (cesta básica)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Endereço', 'Declaração de Vulnerabilidade (se aplicável)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  BAIXA_EMPRESA: {
    moduleType: 'BAIXA_EMPRESA',
    name: 'Workflow - Baixa de Empresa',
    description: 'Fluxo para baixa de empresa',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Último Alvará de Funcionamento', 'Certidões Negativas (Tributos Municipais, Estaduais e Federais)', 'Comprovante de Pagamento de Débitos (se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  BENEFICIO_EVENTUAL: {
    moduleType: 'BENEFICIO_EVENTUAL',
    name: 'Workflow - Benefício Eventual',
    description: 'Fluxo para benefício eventual',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Documentos Comprobatórios (dependendo do tipo)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  BOLSA_ATLETA: {
    moduleType: 'BOLSA_ATLETA',
    name: 'Workflow - Bolsa Atleta',
    description: 'Fluxo para bolsa atleta',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'Histórico Esportivo', 'Cartas de Recomendação'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  BOLSA_FAMILIA_MUNICIPAL: {
    moduleType: 'BOLSA_FAMILIA_MUNICIPAL',
    name: 'Workflow - Inscrição Bolsa Família Municipal',
    description: 'Fluxo para inscrição bolsa família municipal',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CadÚnico', 'CPF', 'RG', 'Comprovante de Residência', 'Comprovante de Renda Familiar'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_AGROINDUSTRIA: {
    moduleType: 'CADASTRO_AGROINDUSTRIA',
    name: 'Workflow - Cadastro de Agroindústria Familiar',
    description: 'Fluxo para cadastro de agroindústria familiar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'CNPJ (se houver)', 'Licença Sanitária', 'Comprovante de Endereço da Agroindústria'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_ARTISTA: {
    moduleType: 'CADASTRO_ARTISTA',
    name: 'Workflow - Cadastro de Artistas Locais',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Portfólio Artístico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_ATLETA: {
    moduleType: 'CADASTRO_ATLETA',
    name: 'Workflow - Cadastro de Atleta Municipal',
    description: 'Fluxo para cadastro de atleta municipal',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico', 'Foto 3x4', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_ATRACAO_TURISTICA: {
    moduleType: 'CADASTRO_ATRACAO_TURISTICA',
    name: 'Workflow - Cadastro de Atração Turística',
    description: 'Fluxo para cadastro de atração turística',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF ou CNPJ', 'Fotos do Local', 'Autorização de Funcionamento'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_BALCAO_EMPREGOS: {
    moduleType: 'CADASTRO_BALCAO_EMPREGOS',
    name: 'Workflow - Cadastro no Balcão de Empregos',
    description: 'Fluxo para cadastro no balcão de empregos',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_CAMERAS_BAIRRO: {
    moduleType: 'CADASTRO_CAMERAS_BAIRRO',
    name: 'Workflow - Cadastro de Câmeras de Segurança de Bairro',
    description: 'Fluxo para cadastro de câmeras de segurança de bairro',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_CONTRIBUINTE: {
    moduleType: 'CADASTRO_CONTRIBUINTE',
    name: 'Workflow - Cadastro de Contribuinte (Pessoa Física)',
    description: 'Fluxo para cadastro de contribuinte (pessoa física)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de Residência', 'Título de Propriedade (se possuir imóvel)', 'Contrato de Locação (se locatário)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_DEFICIT_HABITACIONAL: {
    moduleType: 'CADASTRO_DEFICIT_HABITACIONAL',
    name: 'Workflow - Cadastro em Déficit Habitacional',
    description: 'Fluxo para cadastro em déficit habitacional',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'Comprovante de Endereço'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_ESTABELECIMENTO_TURISTICO: {
    moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    name: 'Workflow - Cadastro de Estabelecimento Turístico',
    description: 'Fluxo para cadastro de estabelecimento turístico',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Alvará de Funcionamento', 'Contrato Social'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_EVENTO_CULTURAL: {
    moduleType: 'CADASTRO_EVENTO_CULTURAL',
    name: 'Workflow - Cadastro de Evento Cultural',
    description: 'Fluxo para cadastro de evento cultural',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto do Evento', 'Autorizações Necessárias'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_FAMILIA_RISCO: {
    moduleType: 'CADASTRO_FAMILIA_RISCO',
    name: 'Workflow - Cadastro de Família em Área de Risco',
    description: 'Fluxo para cadastro de família em área de risco',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Residência', 'RG ou CPF de todos os moradores', 'Documento dos Menores (se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_FORNECEDOR: {
    moduleType: 'CADASTRO_FORNECEDOR',
    name: 'Workflow - Cadastro de Fornecedor Municipal',
    description: 'Fluxo para cadastro de fornecedor municipal',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Contrato Social ou Requerimento de Empresário', 'Comprovante de Endereço da Empresa', 'Certidões Negativas (Federal, Estadual, Municipal, Trabalhista)', 'Alvará de Funcionamento'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_GERADOR_RESIDUOS: {
    moduleType: 'CADASTRO_GERADOR_RESIDUOS',
    name: 'Workflow - Cadastro Gerador Resíduos',
    description: 'Fluxo para cadastro gerador resíduos',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'CNPJ', 'Alvará de Funcionamento'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_GRUPO_ARTISTICO: {
    moduleType: 'CADASTRO_GRUPO_ARTISTICO',
    name: 'Workflow - Cadastro de Grupo Artístico',
    description: 'Fluxo para cadastro de grupo artístico',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documentos dos Integrantes', 'Portfólio do Grupo', 'Estatuto (opcional)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_GUIA_TURISTICO: {
    moduleType: 'CADASTRO_GUIA_TURISTICO',
    name: 'Workflow - Cadastro de Guia Turístico',
    description: 'Fluxo para cadastro de guia turístico',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Certificado de Guia Turístico', 'Foto 3x4'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_LOGIN_UNICO: {
    moduleType: 'CADASTRO_LOGIN_UNICO',
    name: 'Workflow - Cadastro no Login Único Gov.br',
    description: 'Fluxo para cadastro no login único gov.br',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CNH', 'CPF', 'Comprovante de Residência', 'E-mail e Telefone'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_MEI: {
    moduleType: 'CADASTRO_MEI',
    name: 'Workflow - Cadastro MEI (Microempreendedor Individual)',
    description: 'Fluxo para cadastro mei (microempreendedor individual)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Residência', 'Título de Eleitor ou Recibo da Declaração IRPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_PISCICULTURA: {
    moduleType: 'CADASTRO_PISCICULTURA',
    name: 'Workflow - Cadastro de Piscicultura',
    description: 'Fluxo para cadastro de piscicultura',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Propriedade', 'Licença Ambiental (se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_PONTO_CRITICO: {
    moduleType: 'CADASTRO_PONTO_CRITICO',
    name: 'Workflow - Cadastro de Ponto Crítico',
    description: 'Fluxo para cadastro de ponto crítico',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_PONTO_CULTURA: {
    moduleType: 'CADASTRO_PONTO_CULTURA',
    name: 'Workflow - Cadastro Ponto Cultura',
    description: 'Fluxo para cadastro ponto cultura',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'CNPJ (se aplicável)', 'Plano de Ação Cultural', 'Fotos do Espaço'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_PRODUTOR: {
    moduleType: 'CADASTRO_PRODUTOR',
    name: 'Workflow - Cadastro de Produtor Rural',
    description: 'Fluxo para cadastro de produtor rural',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Residência', 'DAP - Declaração de Aptidão ao Pronaf (opcional)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_PROFESSOR: {
    moduleType: 'CADASTRO_PROFESSOR',
    name: 'Workflow - Cadastro de Professores',
    description: 'Fluxo para cadastro de professores',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Diploma', 'Currículo', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_PROPRIEDADE_RURAL: {
    moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
    name: 'Workflow - Cadastro de Propriedade Rural',
    description: 'Fluxo para cadastro de propriedade rural',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura ou Contrato', 'CAR - Cadastro Ambiental Rural (opcional)', 'ITR - Imposto Territorial Rural (opcional)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_STARTUP: {
    moduleType: 'CADASTRO_STARTUP',
    name: 'Workflow - Cadastro de Startup/Empresa de Tecnologia',
    description: 'Fluxo para cadastro de startup/empresa de tecnologia',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ ou Protocolo de Abertura', 'Contrato Social', 'RG e CPF dos Sócios', 'Pitch Deck ou Apresentação da Empresa'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_UNICO: {
    moduleType: 'CADASTRO_UNICO',
    name: 'Workflow - Cadastro Único (CadÚnico)',
    description: 'Fluxo para cadastro único (cadúnico)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Residência', 'Comprovante de Renda'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_VIVEIRO_MUDAS: {
    moduleType: 'CADASTRO_VIVEIRO_MUDAS',
    name: 'Workflow - Cadastro Viveiro Mudas',
    description: 'Fluxo para cadastro viveiro mudas',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Projeto do Viveiro', 'Fotos'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CADASTRO_VOLUNTARIO: {
    moduleType: 'CADASTRO_VOLUNTARIO',
    name: 'Workflow - Cadastro de Voluntário da Defesa Civil',
    description: 'Fluxo para cadastro de voluntário da defesa civil',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência', 'Atestado de Antecedentes Criminais', 'Certificados de Cursos (se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CALENDARIO_COLETA: {
    moduleType: 'CALENDARIO_COLETA',
    name: 'Workflow - Calendário de Coleta Seletiva',
    description: 'Fluxo para calendário de coleta seletiva',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CALENDARIO_ESCOLAR: {
    moduleType: 'CALENDARIO_ESCOLAR',
    name: 'Workflow - Consulta de Calendário Escolar',
    description: 'Fluxo para consulta de calendário escolar',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CAMPANHAS_VACINACAO: {
    moduleType: 'CAMPANHAS_VACINACAO',
    name: 'Workflow - Agendamento de Vacinação',
    description: 'Fluxo para agendamento de vacinação',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Cartão de Vacina (se possuir)', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CAMPEONATO_MUNICIPAL: {
    moduleType: 'CAMPEONATO_MUNICIPAL',
    name: 'Workflow - Campeonato Municipal',
    description: 'Fluxo para campeonato municipal',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Lista de Atletas', 'Documentos dos Atletas'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CANAL_ESCUTA: {
    moduleType: 'CANAL_ESCUTA',
    name: 'Workflow - Canal de Escuta - Acolhimento Imediato',
    description: 'Fluxo para canal de escuta - acolhimento imediato',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CAPINA_ROCAGEM: {
    moduleType: 'CAPINA_ROCAGEM',
    name: 'Workflow - Solicitação de Capina e Roçagem',
    description: 'Fluxo para solicitação de capina e roçagem',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CARTAO_ESTUDANTE: {
    moduleType: 'CARTAO_ESTUDANTE',
    name: 'Workflow - Cartão Estudante (Meia Passagem)',
    description: 'Fluxo para cartão estudante (meia passagem)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'Declaração de Matrícula', 'Foto 3x4 recente', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CARTAO_PCD: {
    moduleType: 'CARTAO_PCD',
    name: 'Workflow - Cartão Transporte para Pessoa com Deficiência',
    description: 'Fluxo para cartão transporte para pessoa com deficiência',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Laudo Médico', 'Foto 3x4 recente', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CARTAO_SUS: {
    moduleType: 'CARTAO_SUS',
    name: 'Workflow - Solicitação de Cartão SUS',
    description: 'Fluxo para solicitação de cartão sus',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CNH', 'CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CARTAO_TRANSPORTE: {
    moduleType: 'CARTAO_TRANSPORTE',
    name: 'Workflow - Solicitação de Cartão Transporte',
    description: 'Fluxo para solicitação de cartão transporte',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'Foto 3x4 recente', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CASA_LAR_IDOSO: {
    moduleType: 'CASA_LAR_IDOSO',
    name: 'Workflow - Inscrição Casa Lar para Idoso',
    description: 'Fluxo para inscrição casa lar para idoso',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Atestado Médico', 'Laudo Social (se houver)', 'Comprovante de Renda (se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CERTIDAO_BEM_TOMBADO: {
    moduleType: 'CERTIDAO_BEM_TOMBADO',
    name: 'Workflow - Certidão Bem Tombado',
    description: 'Fluxo para certidão bem tombado',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Endereço do Bem'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CERTIDAO_USO_SOLO: {
    moduleType: 'CERTIDAO_USO_SOLO',
    name: 'Workflow - Certidão Uso Solo',
    description: 'Fluxo para certidão uso solo',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Matrícula do Imóvel'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CERTIFICADO_DIGITAL: {
    moduleType: 'CERTIFICADO_DIGITAL',
    name: 'Workflow - Solicitação de Certificado Digital',
    description: 'Fluxo para solicitação de certificado digital',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência', 'CNPJ (para empresas)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CESTA_BASICA: {
    moduleType: 'CESTA_BASICA',
    name: 'Workflow - Solicitação de Cesta Básica',
    description: 'Fluxo para solicitação de cesta básica',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CNH_SOCIAL: {
    moduleType: 'CNH_SOCIAL',
    name: 'Workflow - Solicitação de CNH Social',
    description: 'Fluxo para solicitação de cnh social',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência', 'Comprovante de Renda Familiar'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  COLETA_ELETRONICO: {
    moduleType: 'COLETA_ELETRONICO',
    name: 'Workflow - Coleta de Lixo Eletrônico',
    description: 'Fluxo para coleta de lixo eletrônico',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  COMPRA_DIRETA_PRODUTOR: {
    moduleType: 'COMPRA_DIRETA_PRODUTOR',
    name: 'Workflow - Programa Compra Direta do Produtor',
    description: 'Fluxo para programa compra direta do produtor',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'DAP (Declaração de Aptidão ao Pronaf)', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CONCESSAO_USO_ESPECIAL: {
    moduleType: 'CONCESSAO_USO_ESPECIAL',
    name: 'Workflow - Concessão de Uso Especial para Fins de Moradia',
    description: 'Fluxo para concessão de uso especial para fins de moradia',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Declaração de Posse', 'Comprovantes de Residência', 'Declaração de Não Proprietário'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CONSERTO_CALCAMENTO: {
    moduleType: 'CONSERTO_CALCAMENTO',
    name: 'Workflow - Conserto de Calçamento',
    description: 'Fluxo para conserto de calçamento',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CONSULTA_FREQUENCIA_NOTAS: {
    moduleType: 'CONSULTA_FREQUENCIA_NOTAS',
    name: 'Workflow - Consulta de Frequência e Notas',
    description: 'Fluxo para consulta de frequência e notas',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
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
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CONTROLE_MEDICAMENTOS: {
    moduleType: 'CONTROLE_MEDICAMENTOS',
    name: 'Workflow - Solicitação de Medicamentos',
    description: 'Fluxo para solicitação de medicamentos',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Receita Médica', 'Cartão SUS', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  COPIA_PROCESSOS: {
    moduleType: 'COPIA_PROCESSOS',
    name: 'Workflow - Solicitação de Cópia de Processo Administrativo',
    description: 'Fluxo para solicitação de cópia de processo administrativo',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Procuração (se representante legal)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CREDENCIAMENTO_AGENCIA_TURISMO: {
    moduleType: 'CREDENCIAMENTO_AGENCIA_TURISMO',
    name: 'Workflow - Credenciamento de Agência de Turismo',
    description: 'Fluxo para credenciamento de agência de turismo',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'Cadastur', 'Alvará de Funcionamento', 'Seguro de Responsabilidade Civil'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CREDENCIAMENTO_INSTRUTOR: {
    moduleType: 'CREDENCIAMENTO_INSTRUTOR',
    name: 'Workflow - Credenciamento Instrutor',
    description: 'Fluxo para credenciamento instrutor',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'CREF', 'Currículo', 'Certificados'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CREDENCIAMENTO_MOTOTAXI: {
    moduleType: 'CREDENCIAMENTO_MOTOTAXI',
    name: 'Workflow - Credenciamento de Mototáxi',
    description: 'Fluxo para credenciamento de mototáxi',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH Categoria A (mínimo)', 'Certidão de Antecedentes Criminais', 'Comprovante de Residência', 'Curso de Formação de Mototaxista', 'Vistoria da Motocicleta'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CREDENCIAMENTO_PROFESSOR_ARTE: {
    moduleType: 'CREDENCIAMENTO_PROFESSOR_ARTE',
    name: 'Workflow - Credenciamento Professor Arte',
    description: 'Fluxo para credenciamento professor arte',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Currículo', 'Certificados', 'Portfólio'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CREDENCIAMENTO_TAXI: {
    moduleType: 'CREDENCIAMENTO_TAXI',
    name: 'Workflow - Credenciamento de Táxi',
    description: 'Fluxo para credenciamento de táxi',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH Categoria B (mínimo)', 'Certidão de Antecedentes Criminais', 'Comprovante de Residência', 'Curso de Formação de Taxista', 'Vistoria do Veículo'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CREDENCIAMENTO_TRANSPORTE_ESCOLAR: {
    moduleType: 'CREDENCIAMENTO_TRANSPORTE_ESCOLAR',
    name: 'Workflow - Credenciamento de Transporte Escolar',
    description: 'Fluxo para credenciamento de transporte escolar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH Categoria D', 'Certidão de Antecedentes Criminais', 'Curso de Transporte Escolar', 'Vistoria do Veículo', 'CRLV'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CURSOS_QUALIFICACAO: {
    moduleType: 'CURSOS_QUALIFICACAO',
    name: 'Workflow - Inscrição em Cursos de Qualificação Profissional',
    description: 'Fluxo para inscrição em cursos de qualificação profissional',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência', 'Comprovante de Escolaridade'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  CURSO_INCLUSAO_DIGITAL: {
    moduleType: 'CURSO_INCLUSAO_DIGITAL',
    name: 'Workflow - Inscrição em Curso de Inclusão Digital',
    description: 'Fluxo para inscrição em curso de inclusão digital',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DAP_DIGITAL: {
    moduleType: 'DAP_DIGITAL',
    name: 'Workflow - DAP Digital - Declaração de Aptidão ao Pronaf',
    description: 'Fluxo para dap digital - declaração de aptidão ao pronaf',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Residência', 'Comprovante de Atividade Rural'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DECLARACOES: {
    moduleType: 'DECLARACOES',
    name: 'Workflow - Solicitação de Declaração/Atestado',
    description: 'Fluxo para solicitação de declaração/atestado',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de Residência (se aplicável)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DEDETIZACAO: {
    moduleType: 'DEDETIZACAO',
    name: 'Workflow - Dedetização e Controle de Pragas',
    description: 'Fluxo para dedetização e controle de pragas',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DEFESA_AUTUACAO: {
    moduleType: 'DEFESA_AUTUACAO',
    name: 'Workflow - Defesa de Autuação de Trânsito',
    description: 'Fluxo para defesa de autuação de trânsito',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH', 'CRLV', 'Notificação de Autuação', 'Comprovantes (se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_ADMINISTRATIVA: {
    moduleType: 'DENUNCIA_ADMINISTRATIVA',
    name: 'Workflow - Denúncia de Irregularidade Administrativa',
    description: 'Fluxo para denúncia de irregularidade administrativa',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_AMBIENTAL: {
    moduleType: 'DENUNCIA_AMBIENTAL',
    name: 'Workflow - Denúncia Ambiental',
    description: 'Fluxo para denúncia ambiental',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_ANONIMA: {
    moduleType: 'DENUNCIA_ANONIMA',
    name: 'Workflow - Denúncia Anônima (Disque Denúncia)',
    description: 'Fluxo para denúncia anônima (disque denúncia)',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_AREA_RISCO: {
    moduleType: 'DENUNCIA_AREA_RISCO',
    name: 'Workflow - Denúncia de Área de Risco',
    description: 'Fluxo para denúncia de área de risco',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_ASSEDIO: {
    moduleType: 'DENUNCIA_ASSEDIO',
    name: 'Workflow - Denúncia de Assédio no Trabalho',
    description: 'Fluxo para denúncia de assédio no trabalho',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
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
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_CONSTRUCAO: {
    moduleType: 'DENUNCIA_CONSTRUCAO',
    name: 'Workflow - Denúncia de Construção em Encosta',
    description: 'Fluxo para denúncia de construção em encosta',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_CONSTRUCAO_IRREGULAR: {
    moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR',
    name: 'Workflow - Denúncia de Construção Irregular',
    description: 'Fluxo para denúncia de construção irregular',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_DESCARTE_IRREGULAR: {
    moduleType: 'DENUNCIA_DESCARTE_IRREGULAR',
    name: 'Workflow - Denúncia Descarte Irregular',
    description: 'Fluxo para denúncia descarte irregular',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_POLUICAO_SONORA: {
    moduleType: 'DENUNCIA_POLUICAO_SONORA',
    name: 'Workflow - Denúncia Poluição Sonora',
    description: 'Fluxo para denúncia poluição sonora',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_PROBLEMA: {
    moduleType: 'DENUNCIA_PROBLEMA',
    name: 'Workflow - Denúncia de Problema em Sistema/Aplicativo',
    description: 'Fluxo para denúncia de problema em sistema/aplicativo',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_QUEIMADA: {
    moduleType: 'DENUNCIA_QUEIMADA',
    name: 'Workflow - Denúncia Queimada',
    description: 'Fluxo para denúncia queimada',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_SANITARIA: {
    moduleType: 'DENUNCIA_SANITARIA',
    name: 'Workflow - Denúncia Sanitária',
    description: 'Fluxo para denúncia sanitária',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
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
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_VEICULO_ABANDONADO: {
    moduleType: 'DENUNCIA_VEICULO_ABANDONADO',
    name: 'Workflow - Denúncia de Veículo Abandonado',
    description: 'Fluxo para denúncia de veículo abandonado',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_VIOLENCIA: {
    moduleType: 'DENUNCIA_VIOLENCIA',
    name: 'Workflow - Denúncia de Violência contra a Mulher',
    description: 'Fluxo para denúncia de violência contra a mulher',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DENUNCIA_VIOLENCIA_DOMESTICA: {
    moduleType: 'DENUNCIA_VIOLENCIA_DOMESTICA',
    name: 'Workflow - Denúncia de Violência Doméstica',
    description: 'Fluxo para denúncia de violência doméstica',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DESOBSTRUCAO_BUEIRO: {
    moduleType: 'DESOBSTRUCAO_BUEIRO',
    name: 'Workflow - Desobstrução de Bueiro',
    description: 'Fluxo para desobstrução de bueiro',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DISTRIBUICAO_MUDAS: {
    moduleType: 'DISTRIBUICAO_MUDAS',
    name: 'Workflow - Programa de Distribuição de Mudas',
    description: 'Fluxo para programa de distribuição de mudas',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Propriedade ou Posse'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DISTRIBUICAO_SEMENTES: {
    moduleType: 'DISTRIBUICAO_SEMENTES',
    name: 'Workflow - Programa de Distribuição de Sementes',
    description: 'Fluxo para programa de distribuição de sementes',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Cadastro de Produtor Rural'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DOACAO_DESABRIGADOS: {
    moduleType: 'DOACAO_DESABRIGADOS',
    name: 'Workflow - Solicitação de Doação para Desabrigados',
    description: 'Fluxo para solicitação de doação para desabrigados',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  DOCUMENTACAO_CIVIL: {
    moduleType: 'DOCUMENTACAO_CIVIL',
    name: 'Workflow - Documentação Civil Gratuita',
    description: 'Fluxo para documentação civil gratuita',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ECOPONTO: {
    moduleType: 'ECOPONTO',
    name: 'Workflow - Solicitação de Ecoponto',
    description: 'Fluxo para solicitação de ecoponto',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  EMPRESTIMO_MATERIAL_ESPORTIVO: {
    moduleType: 'EMPRESTIMO_MATERIAL_ESPORTIVO',
    name: 'Workflow - Empréstimo Material Esportivo',
    description: 'Fluxo para empréstimo material esportivo',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  FAIXA_CARGA_DESCARGA: {
    moduleType: 'FAIXA_CARGA_DESCARGA',
    name: 'Workflow - Solicitação de Faixa Exclusiva para Carga/Descarga',
    description: 'Fluxo para solicitação de faixa exclusiva para carga/descarga',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Alvará de Funcionamento', 'Planta de Localização'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  FEIRA_PRODUTOR: {
    moduleType: 'FEIRA_PRODUTOR',
    name: 'Workflow - Inscrição na Feira do Produtor',
    description: 'Fluxo para inscrição na feira do produtor',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  GERACAO_RENDA: {
    moduleType: 'GERACAO_RENDA',
    name: 'Workflow - Programa de Geração de Renda',
    description: 'Fluxo para programa de geração de renda',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência', 'Comprovante de Renda (se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  GRUPOS_APOIO: {
    moduleType: 'GRUPOS_APOIO',
    name: 'Workflow - Inscrição em Grupos de Apoio',
    description: 'Fluxo para inscrição em grupos de apoio',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  GRUPO_WHATSAPP_VIZINHANCA: {
    moduleType: 'GRUPO_WHATSAPP_VIZINHANCA',
    name: 'Workflow - Cadastro em Grupo de WhatsApp de Segurança de Vizinhança',
    description: 'Fluxo para cadastro em grupo de whatsapp de segurança de vizinhança',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  GUARDA_PATRIMONIAL: {
    moduleType: 'GUARDA_PATRIMONIAL',
    name: 'Workflow - Solicitação de Guarda Patrimonial',
    description: 'Fluxo para solicitação de guarda patrimonial',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Justificativa', 'Projeto ou Memorial', 'Autorização do Responsável'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ILUMINACAO_PUBLICA: {
    moduleType: 'ILUMINACAO_PUBLICA',
    name: 'Workflow - Iluminação Pública (Poste Queimado)',
    description: 'Fluxo para iluminação pública (poste queimado)',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ILUMINACAO_SEGURANCA: {
    moduleType: 'ILUMINACAO_SEGURANCA',
    name: 'Workflow - Solicitação de Iluminação para Segurança',
    description: 'Fluxo para solicitação de iluminação para segurança',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_CIRCUITO_TURISTICO: {
    moduleType: 'INSCRICAO_CIRCUITO_TURISTICO',
    name: 'Workflow - Inscrição em Circuito Turístico Regional',
    description: 'Fluxo para inscrição em circuito turístico regional',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ ou CPF', 'Alvará de Funcionamento', 'Cadastur (se aplicável)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_COMPETICAO: {
    moduleType: 'INSCRICAO_COMPETICAO',
    name: 'Workflow - Inscrição em Competição',
    description: 'Fluxo para inscrição em competição',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico', 'Foto 3x4'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_CONCURSO: {
    moduleType: 'INSCRICAO_CONCURSO',
    name: 'Workflow - Inscrição em Concurso Público Municipal',
    description: 'Fluxo para inscrição em concurso público municipal',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de Escolaridade', 'Foto 3x4', 'Comprovante de Residência', 'Certificados (se aplicável)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_CORRIDA_RUA: {
    moduleType: 'INSCRICAO_CORRIDA_RUA',
    name: 'Workflow - Inscrição Corrida de Rua',
    description: 'Fluxo para inscrição corrida de rua',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_CRECHE: {
    moduleType: 'INSCRICAO_CRECHE',
    name: 'Workflow - Inscrição em Creche',
    description: 'Fluxo para inscrição em creche',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Certidão de Nascimento da Criança', 'RG do Responsável', 'CPF do Responsável', 'Comprovante de Residência', 'Comprovante de Trabalho dos Pais'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_CURSO_FORMACAO: {
    moduleType: 'INSCRICAO_CURSO_FORMACAO',
    name: 'Workflow - Inscrição Curso Formação Cultural',
    description: 'Fluxo para inscrição curso formação cultural',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Escolaridade'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_CURSO_LIVRE: {
    moduleType: 'INSCRICAO_CURSO_LIVRE',
    name: 'Workflow - Inscrição em Cursos Livres',
    description: 'Fluxo para inscrição em cursos livres',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_EJA: {
    moduleType: 'INSCRICAO_EJA',
    name: 'Workflow - Inscrição em EJA (Educação de Jovens e Adultos)',
    description: 'Fluxo para inscrição em eja (educação de jovens e adultos)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência', 'Histórico Escolar (se possuir)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_ESCOLINHA_BASQUETE: {
    moduleType: 'INSCRICAO_ESCOLINHA_BASQUETE',
    name: 'Workflow - Inscrição Escolinha Basquete',
    description: 'Fluxo para inscrição escolinha basquete',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_ESCOLINHA_CAPOEIRA: {
    moduleType: 'INSCRICAO_ESCOLINHA_CAPOEIRA',
    name: 'Workflow - Inscrição Escolinha Capoeira',
    description: 'Fluxo para inscrição escolinha capoeira',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_ESCOLINHA_FUTEBOL: {
    moduleType: 'INSCRICAO_ESCOLINHA_FUTEBOL',
    name: 'Workflow - Inscrição Escolinha Futebol',
    description: 'Fluxo para inscrição escolinha futebol',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_ESCOLINHA_GINASTICA: {
    moduleType: 'INSCRICAO_ESCOLINHA_GINASTICA',
    name: 'Workflow - Inscrição Escolinha Ginástica',
    description: 'Fluxo para inscrição escolinha ginástica',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_ESCOLINHA_JUDO: {
    moduleType: 'INSCRICAO_ESCOLINHA_JUDO',
    name: 'Workflow - Inscrição Escolinha Judô',
    description: 'Fluxo para inscrição escolinha judô',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_ESCOLINHA_NATACAO: {
    moduleType: 'INSCRICAO_ESCOLINHA_NATACAO',
    name: 'Workflow - Inscrição Escolinha Natação',
    description: 'Fluxo para inscrição escolinha natação',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_ESCOLINHA_VOLEI: {
    moduleType: 'INSCRICAO_ESCOLINHA_VOLEI',
    name: 'Workflow - Inscrição Escolinha Vôlei',
    description: 'Fluxo para inscrição escolinha vôlei',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Atestado Médico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_GRUPO_OFICINA: {
    moduleType: 'INSCRICAO_GRUPO_OFICINA',
    name: 'Workflow - Inscrição em Grupo ou Oficina Social',
    description: 'Fluxo para inscrição em grupo ou oficina social',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Endereço'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_HACKATHON: {
    moduleType: 'INSCRICAO_HACKATHON',
    name: 'Workflow - Inscrição em Hackathon/Desafio de Inovação',
    description: 'Fluxo para inscrição em hackathon/desafio de inovação',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_INCUBADORA: {
    moduleType: 'INSCRICAO_INCUBADORA',
    name: 'Workflow - Inscrição em Incubadora de Empresas',
    description: 'Fluxo para inscrição em incubadora de empresas',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF e RG dos Sócios', 'Currículo dos Sócios', 'Plano de Negócio Completo', 'Pitch Deck (Apresentação)', 'CNPJ (se já constituída)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_MCMV_MUNICIPAL: {
    moduleType: 'INSCRICAO_MCMV_MUNICIPAL',
    name: 'Workflow - Inscrição Minha Casa Minha Vida Municipal',
    description: 'Fluxo para inscrição minha casa minha vida municipal',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico', 'Comprovante de Endereço'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_OFICINA: {
    moduleType: 'INSCRICAO_OFICINA',
    name: 'Workflow - Inscrição em Oficinas Culturais',
    description: 'Fluxo para inscrição em oficinas culturais',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_PROGRAMA_HABITACIONAL: {
    moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL',
    name: 'Workflow - Inscrição em Programa Habitacional',
    description: 'Fluxo para inscrição em programa habitacional',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico', 'Comprovante de Endereço'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_PROGRAMA_RURAL: {
    moduleType: 'INSCRICAO_PROGRAMA_RURAL',
    name: 'Workflow - Inscrição em Programas Rurais',
    description: 'Fluxo para inscrição em programas rurais',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Residência', 'Cadastro de Produtor Rural (opcional)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_PROGRAMA_SOCIAL: {
    moduleType: 'INSCRICAO_PROGRAMA_SOCIAL',
    name: 'Workflow - Inscrição em Programa Social',
    description: 'Fluxo para inscrição em programa social',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CadÚnico', 'Documentos Pessoais'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  INSCRICAO_QUALIFICACAO: {
    moduleType: 'INSCRICAO_QUALIFICACAO',
    name: 'Workflow - Inscrição em Cursos de Qualificação Profissional',
    description: 'Fluxo para inscrição em cursos de qualificação profissional',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ISENCAO_IDOSO: {
    moduleType: 'ISENCAO_IDOSO',
    name: 'Workflow - Isenção de Tarifa para Idosos',
    description: 'Fluxo para isenção de tarifa para idosos',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Foto 3x4 recente', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ISENCAO_IPTU: {
    moduleType: 'ISENCAO_IPTU',
    name: 'Workflow - Solicitação de Isenção de IPTU',
    description: 'Fluxo para solicitação de isenção de iptu',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de Propriedade do Imóvel', 'Comprovante de Renda', 'Certidão de Nascimento ou Casamento', 'Comprovante de Aposentadoria (se aplicável)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ISENCAO_TRANSPORTE: {
    moduleType: 'ISENCAO_TRANSPORTE',
    name: 'Workflow - Isenção de Tarifa de Transporte',
    description: 'Fluxo para isenção de tarifa de transporte',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Residência', 'Laudo Médico (se for por deficiência)', 'Comprovante de Renda'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LAUDO_VISTORIA_SEGURANCA: {
    moduleType: 'LAUDO_VISTORIA_SEGURANCA',
    name: 'Workflow - Laudo de Vistoria de Segurança',
    description: 'Fluxo para laudo de vistoria de segurança',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Alvará de Funcionamento', 'CNPJ'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LICENCA_AMBIENTAL_SIMPLIFICADA: {
    moduleType: 'LICENCA_AMBIENTAL_SIMPLIFICADA',
    name: 'Workflow - Licença Ambiental Simplificada',
    description: 'Fluxo para licença ambiental simplificada',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Projeto Simplificado'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LICENCA_ATIVIDADE_POLUIDORA: {
    moduleType: 'LICENCA_ATIVIDADE_POLUIDORA',
    name: 'Workflow - Licença Atividade Potencialmente Poluidora',
    description: 'Fluxo para licença atividade potencialmente poluidora',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Projeto Técnico', 'ART', 'Plano de Controle'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LICENCA_ATIVIDADE_TURISTICA: {
    moduleType: 'LICENCA_ATIVIDADE_TURISTICA',
    name: 'Workflow - Licença para Atividade Turística',
    description: 'Fluxo para licença para atividade turística',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF ou CNPJ', 'RG', 'Contrato Social (se empresa)', 'Projeto da Atividade'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LICENCA_EVENTOS_RURAIS: {
    moduleType: 'LICENCA_EVENTOS_RURAIS',
    name: 'Workflow - Licença para Eventos Rurais',
    description: 'Fluxo para licença para eventos rurais',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'CNPJ (se pessoa jurídica)', 'Projeto do Evento'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LICENCA_OBRA: {
    moduleType: 'LICENCA_OBRA',
    name: 'Workflow - Licença para Obra',
    description: 'Fluxo para licença para obra',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto Aprovado', 'ART', 'Matrícula do Imóvel', 'IPTU'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LICENCA_PERFURACAO_POCO: {
    moduleType: 'LICENCA_PERFURACAO_POCO',
    name: 'Workflow - Licença para Perfuração de Poço',
    description: 'Fluxo para licença para perfuração de poço',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Propriedade', 'Projeto Técnico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LICENCIAMENTO_AMBIENTAL: {
    moduleType: 'LICENCIAMENTO_AMBIENTAL',
    name: 'Workflow - Licenciamento Ambiental',
    description: 'Fluxo para licenciamento ambiental',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto', 'Estudo de Impacto Ambiental', 'ART'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LIMPEZA_BOCA_LOBO: {
    moduleType: 'LIMPEZA_BOCA_LOBO',
    name: 'Workflow - Limpeza de Boca de Lobo',
    description: 'Fluxo para limpeza de boca de lobo',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LIMPEZA_FEIRA: {
    moduleType: 'LIMPEZA_FEIRA',
    name: 'Workflow - Limpeza de Feira Livre',
    description: 'Fluxo para limpeza de feira livre',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LIMPEZA_TERRENO_ABANDONADO: {
    moduleType: 'LIMPEZA_TERRENO_ABANDONADO',
    name: 'Workflow - Limpeza de Terreno Abandonado',
    description: 'Fluxo para limpeza de terreno abandonado',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LIMPEZA_URBANA: {
    moduleType: 'LIMPEZA_URBANA',
    name: 'Workflow - Limpeza Urbana e Coleta de Lixo',
    description: 'Fluxo para limpeza urbana e coleta de lixo',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  LOCACAO_EQUIPAMENTO_CULTURAL: {
    moduleType: 'LOCACAO_EQUIPAMENTO_CULTURAL',
    name: 'Workflow - Locação Equipamento Cultural',
    description: 'Fluxo para locação equipamento cultural',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Projeto do Evento'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
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
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  MATERIAL_CONSTRUCAO: {
    moduleType: 'MATERIAL_CONSTRUCAO',
    name: 'Workflow - Solicitação de Material de Construção',
    description: 'Fluxo para solicitação de material de construção',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'Comprovante de Propriedade'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  MATERIAL_ESCOLAR: {
    moduleType: 'MATERIAL_ESCOLAR',
    name: 'Workflow - Solicitação de Material Escolar',
    description: 'Fluxo para solicitação de material escolar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Matrícula', 'Declaração de Baixa Renda (se aplicável)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  MATRICULA_ESCOLAR: {
    moduleType: 'MATRICULA_ESCOLAR',
    name: 'Workflow - Matrícula Escolar',
    description: 'Fluxo para matrícula escolar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Certidão de Nascimento', 'RG do Responsável', 'Comprovante de Residência', 'Cartão de Vacina'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  MEDICAMENTOS_ALTO_CUSTO: {
    moduleType: 'MEDICAMENTOS_ALTO_CUSTO',
    name: 'Workflow - Solicitação de Medicamentos de Alto Custo',
    description: 'Fluxo para solicitação de medicamentos de alto custo',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Receita Médica Especial', 'Laudo Médico', 'Exames Complementares', 'Cartão SUS', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  MEDIDA_PROTETIVA: {
    moduleType: 'MEDIDA_PROTETIVA',
    name: 'Workflow - Solicitação de Medida Protetiva de Urgência',
    description: 'Fluxo para solicitação de medida protetiva de urgência',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Boletim de Ocorrência', 'Provas (fotos, mensagens, se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  MELHORIA_HABITACIONAL: {
    moduleType: 'MELHORIA_HABITACIONAL',
    name: 'Workflow - Melhoria Habitacional',
    description: 'Fluxo para melhoria habitacional',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Propriedade ou Posse', 'Fotos da Moradia'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  MERENDA_ESPECIAL: {
    moduleType: 'MERENDA_ESPECIAL',
    name: 'Workflow - Solicitação de Merenda Especial',
    description: 'Fluxo para solicitação de merenda especial',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Atestado Médico', 'Comprovante de Matrícula'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  ORIENTACAO_ECONOMIA_CRIATIVA: {
    moduleType: 'ORIENTACAO_ECONOMIA_CRIATIVA',
    name: 'Workflow - Orientação para Economia Criativa',
    description: 'Fluxo para orientação para economia criativa',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  OUVIDORIA: {
    moduleType: 'OUVIDORIA',
    name: 'Workflow - Manifestação na Ouvidoria',
    description: 'Fluxo para manifestação na ouvidoria',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PAGAMENTO_IPTU: {
    moduleType: 'PAGAMENTO_IPTU',
    name: 'Workflow - Pagamento de IPTU',
    description: 'Fluxo para pagamento de iptu',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PAGAMENTO_ISS: {
    moduleType: 'PAGAMENTO_ISS',
    name: 'Workflow - Pagamento de ISS',
    description: 'Fluxo para pagamento de iss',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PAGAMENTO_ITBI: {
    moduleType: 'PAGAMENTO_ITBI',
    name: 'Workflow - Pagamento de ITBI',
    description: 'Fluxo para pagamento de itbi',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura ou Contrato de Compra e Venda', 'RG e CPF do Comprador', 'Certidão de Matrícula do Imóvel'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PAGAMENTO_TAXA_LIXO: {
    moduleType: 'PAGAMENTO_TAXA_LIXO',
    name: 'Workflow - Pagamento de Taxa de Coleta de Lixo',
    description: 'Fluxo para pagamento de taxa de coleta de lixo',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PARCELAMENTO_DEBITOS: {
    moduleType: 'PARCELAMENTO_DEBITOS',
    name: 'Workflow - Parcelamento de Débitos Tributários',
    description: 'Fluxo para parcelamento de débitos tributários',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Renda', 'RG e CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PARCELAMENTO_SOLO: {
    moduleType: 'PARCELAMENTO_SOLO',
    name: 'Workflow - Autorização de Parcelamento do Solo',
    description: 'Fluxo para autorização de parcelamento do solo',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'CNPJ (se empresa)', 'Matrícula do Imóvel', 'Projeto de Parcelamento'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PARTICIPACAO_FEIRAS: {
    moduleType: 'PARTICIPACAO_FEIRAS',
    name: 'Workflow - Participação em Feiras e Rodadas de Negócios',
    description: 'Fluxo para participação em feiras e rodadas de negócios',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Alvará de Funcionamento', 'Catálogo de Produtos/Serviços (se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PASSE_LIVRE_INTERESTADUAL: {
    moduleType: 'PASSE_LIVRE_INTERESTADUAL',
    name: 'Workflow - Passe Livre Interestadual (PCD)',
    description: 'Fluxo para passe livre interestadual (pcd)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Laudo Médico (modelo específico)', 'Foto 3x4 recente', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
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
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PERICIA_PSICOSSOCIAL: {
    moduleType: 'PERICIA_PSICOSSOCIAL',
    name: 'Workflow - Agendamento para Perícia Psicossocial',
    description: 'Fluxo para agendamento para perícia psicossocial',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Processo Judicial', 'Encaminhamento do Juizado'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PINTURA_MEIO_FIO: {
    moduleType: 'PINTURA_MEIO_FIO',
    name: 'Workflow - Pintura de Meio-Fio',
    description: 'Fluxo para pintura de meio-fio',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PODA_CANTEIRO: {
    moduleType: 'PODA_CANTEIRO',
    name: 'Workflow - Poda de Árvore em Canteiro',
    description: 'Fluxo para poda de árvore em canteiro',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PROGRAMAS_SAUDE: {
    moduleType: 'PROGRAMAS_SAUDE',
    name: 'Workflow - Inscrição em Programas de Saúde',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Laudo Médico (se aplicável)', 'Cartão SUS', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PROGRAMA_AMBIENTAL: {
    moduleType: 'PROGRAMA_AMBIENTAL',
    name: 'Workflow - Cadastro em Programa Ambiental',
    description: 'Fluxo para cadastro em programa ambiental',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PROGRAMA_HORTAS_COMUNITARIAS: {
    moduleType: 'PROGRAMA_HORTAS_COMUNITARIAS',
    name: 'Workflow - Programa de Hortas Comunitárias',
    description: 'Fluxo para programa de hortas comunitárias',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PROGRAMA_PRIMEIRA_INFANCIA: {
    moduleType: 'PROGRAMA_PRIMEIRA_INFANCIA',
    name: 'Workflow - Programa Primeira Infância',
    description: 'Fluxo para programa primeira infância',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Certidão de Nascimento da Criança', 'CPF dos Pais', 'Comprovante de Residência', 'Cartão de Vacina'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PROGRAMA_SAUDE_FAMILIA: {
    moduleType: 'PROGRAMA_SAUDE_FAMILIA',
    name: 'Workflow - Cadastro no Programa Saúde da Família',
    description: 'Fluxo para cadastro no programa saúde da família',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Residência', 'RG ou CPF de todos os moradores', 'Cartão SUS (se possuir)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PROJETO_ARQUITETONICO_SOCIAL: {
    moduleType: 'PROJETO_ARQUITETONICO_SOCIAL',
    name: 'Workflow - Projeto Arquitetônico Social',
    description: 'Fluxo para projeto arquitetônico social',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'Escritura ou Matrícula do Terreno'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PROJETO_CULTURAL: {
    moduleType: 'PROJETO_CULTURAL',
    name: 'Workflow - Submissão de Projetos Culturais',
    description: 'Fluxo para submissão de projetos culturais',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Projeto Detalhado', 'Orçamento', 'Plano de Divulgação (opcional)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  PROTOCOLO_GERAL: {
    moduleType: 'PROTOCOLO_GERAL',
    name: 'Workflow - Protocolo Online de Documentos',
    description: 'Fluxo para protocolo online de documentos',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documento a ser protocolado', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  RECLAMACAO_TRANSITO: {
    moduleType: 'RECLAMACAO_TRANSITO',
    name: 'Workflow - Reclamação sobre Trânsito',
    description: 'Fluxo para reclamação sobre trânsito',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  RECLAMACAO_TRANSPORTE: {
    moduleType: 'RECLAMACAO_TRANSPORTE',
    name: 'Workflow - Reclamação sobre Transporte Escolar',
    description: 'Fluxo para reclamação sobre transporte escolar',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  RECUPERACAO_PRACA: {
    moduleType: 'RECUPERACAO_PRACA',
    name: 'Workflow - Recuperação de Praça',
    description: 'Fluxo para recuperação de praça',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REGISTRO_EVENTO_TURISTICO: {
    moduleType: 'REGISTRO_EVENTO_TURISTICO',
    name: 'Workflow - Registro de Evento Turístico',
    description: 'Fluxo para registro de evento turístico',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Projeto do Evento', 'Autorizações Necessárias'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REGISTRO_MANIFESTACAO_CULTURAL: {
    moduleType: 'REGISTRO_MANIFESTACAO_CULTURAL',
    name: 'Workflow - Registro de Manifestação Cultural',
    description: 'Fluxo para registro de manifestação cultural',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Documentação Histórica', 'Fotos', 'Depoimentos'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REGISTRO_OCORRENCIA: {
    moduleType: 'REGISTRO_OCORRENCIA',
    name: 'Workflow - Registro de Boletim de Ocorrência',
    description: 'Fluxo para registro de boletim de ocorrência',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REGISTRO_OCORRENCIA_ESCOLAR: {
    moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR',
    name: 'Workflow - Registro de Ocorrência Escolar',
    description: 'Fluxo para registro de ocorrência escolar',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REGISTRO_PROBLEMA_FOTO: {
    moduleType: 'REGISTRO_PROBLEMA_FOTO',
    name: 'Workflow - Registro de Problema com Foto',
    description: 'Fluxo para registro de problema com foto',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Foto do Problema'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REGULARIZACAO_FUNDIARIA: {
    moduleType: 'REGULARIZACAO_FUNDIARIA',
    name: 'Workflow - Regularização Fundiária',
    description: 'Fluxo para regularização fundiária',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Escritura (se possuir)', 'IPTU', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REGULARIZACAO_OBRA: {
    moduleType: 'REGULARIZACAO_OBRA',
    name: 'Workflow - Regularização de Obra',
    description: 'Fluxo para regularização de obra',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Projeto As-Built', 'ART', 'Matrícula do Imóvel', 'Fotos da Edificação'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REGULARIZACAO_POSSE: {
    moduleType: 'REGULARIZACAO_POSSE',
    name: 'Workflow - Regularização de Posse',
    description: 'Fluxo para regularização de posse',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Ocupação', 'Declaração de Posse', 'Croqui do Terreno'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REMEMBRAMENTO_LOTE: {
    moduleType: 'REMEMBRAMENTO_LOTE',
    name: 'Workflow - Anuência para Remembramento de Lote',
    description: 'Fluxo para anuência para remembramento de lote',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Matrículas dos Lotes', 'Planta de Situação', 'ART'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REMOCAO_ANIMAL: {
    moduleType: 'REMOCAO_ANIMAL',
    name: 'Workflow - Remoção de Animal Morto',
    description: 'Fluxo para remoção de animal morto',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REMOCAO_PREVENTIVA: {
    moduleType: 'REMOCAO_PREVENTIVA',
    name: 'Workflow - Solicitação de Remoção Preventiva',
    description: 'Fluxo para solicitação de remoção preventiva',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  RENOVACAO_CREDENCIAMENTO: {
    moduleType: 'RENOVACAO_CREDENCIAMENTO',
    name: 'Workflow - Renovação de Credenciamento de Táxi/Mototáxi',
    description: 'Fluxo para renovação de credenciamento de táxi/mototáxi',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNH Atualizada', 'CRLV Atualizado', 'Vistoria em Dia', 'Certidão Negativa de Multas'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  RESERVA_ESPACO_CULTURAL: {
    moduleType: 'RESERVA_ESPACO_CULTURAL',
    name: 'Workflow - Reserva de Espaço Cultural',
    description: 'Fluxo para reserva de espaço cultural',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'Projeto do Evento'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  RESERVA_ESPACO_ESPORTIVO: {
    moduleType: 'RESERVA_ESPACO_ESPORTIVO',
    name: 'Workflow - Reserva de Espaço Esportivo',
    description: 'Fluxo para reserva de espaço esportivo',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REURB: {
    moduleType: 'REURB',
    name: 'Workflow - REURB - Regularização Fundiária Urbana',
    description: 'Fluxo para reurb - regularização fundiária urbana',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Residência', 'Declaração de Posse', 'Levantamento Topográfico (se houver)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  REVISAO_IPTU: {
    moduleType: 'REVISAO_IPTU',
    name: 'Workflow - Solicitação de Revisão de Lançamento de IPTU',
    description: 'Fluxo para solicitação de revisão de lançamento de iptu',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Carnê de IPTU', 'Fotos do Imóvel', 'Laudo de Avaliação (se houver)', 'Escritura do Imóvel'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SEGURO_SAFRA: {
    moduleType: 'SEGURO_SAFRA',
    name: 'Workflow - Seguro Safra',
    description: 'Fluxo para seguro safra',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'DAP', 'Comprovante de Área Plantada'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SIC: {
    moduleType: 'SIC',
    name: 'Workflow - Solicitação ao SIC (Serviço de Informação ao Cidadão)',
    description: 'Fluxo para solicitação ao sic (serviço de informação ao cidadão)',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SINALIZACAO_TRANSITO: {
    moduleType: 'SINALIZACAO_TRANSITO',
    name: 'Workflow - Solicitação de Sinalização de Trânsito',
    description: 'Fluxo para solicitação de sinalização de trânsito',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_ABRIGO: {
    moduleType: 'SOLICITACAO_ABRIGO',
    name: 'Workflow - Solicitação de Abrigo Temporário',
    description: 'Fluxo para solicitação de abrigo temporário',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF de todos os moradores', 'Laudo Técnico (se houver)', 'Comprovante de Residência na Área Afetada'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_AMBULANCIA: {
    moduleType: 'SOLICITACAO_AMBULANCIA',
    name: 'Workflow - Solicitação de Ambulância (Urgência)',
    description: 'Fluxo para solicitação de ambulância (urgência)',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_AUXILIO_ALUGUEL: {
    moduleType: 'SOLICITACAO_AUXILIO_ALUGUEL',
    name: 'Workflow - Solicitação de Auxílio Aluguel',
    description: 'Fluxo para solicitação de auxílio aluguel',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Renda', 'Declaração de Vulnerabilidade'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_BENEFICIO: {
    moduleType: 'SOLICITACAO_BENEFICIO',
    name: 'Workflow - Solicitação de Benefício Social',
    description: 'Fluxo para solicitação de benefício social',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CadÚnico', 'Documentos Pessoais', 'Comprovante de Renda'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_CAMERA_SEGURANCA: {
    moduleType: 'SOLICITACAO_CAMERA_SEGURANCA',
    name: 'Workflow - Solicitação de Câmera de Segurança',
    description: 'Fluxo para solicitação de câmera de segurança',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Justificativa', 'Abaixo-assinado', 'Fotos do Local'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_CONSULTORIA: {
    moduleType: 'SOLICITACAO_CONSULTORIA',
    name: 'Workflow - Solicitação de Consultoria Empresarial',
    description: 'Fluxo para solicitação de consultoria empresarial',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_DOCUMENTO_ESCOLAR: {
    moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    name: 'Workflow - Solicitação de Documento Escolar',
    description: 'Fluxo para solicitação de documento escolar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'Comprovante de Matrícula (se aplicável)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_EXAMES: {
    moduleType: 'SOLICITACAO_EXAMES',
    name: 'Workflow - Solicitação de Exames',
    description: 'Fluxo para solicitação de exames',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Pedido Médico', 'Cartão SUS', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_FISIOTERAPIA: {
    moduleType: 'SOLICITACAO_FISIOTERAPIA',
    name: 'Workflow - Solicitação de Fisioterapia',
    description: 'Fluxo para solicitação de fisioterapia',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Pedido Médico', 'Cartão SUS', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_LOMBADA: {
    moduleType: 'SOLICITACAO_LOMBADA',
    name: 'Workflow - Solicitação de Lombada/Redutor de Velocidade',
    description: 'Fluxo para solicitação de lombada/redutor de velocidade',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_LOTE_DISTRITO: {
    moduleType: 'SOLICITACAO_LOTE_DISTRITO',
    name: 'Workflow - Solicitação de Lote no Distrito Industrial',
    description: 'Fluxo para solicitação de lote no distrito industrial',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'Projeto Industrial', 'Certidões Negativas', 'Plano de Investimento'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_MAQUINAS: {
    moduleType: 'SOLICITACAO_MAQUINAS',
    name: 'Workflow - Solicitação de Máquinas e Equipamentos Agrícolas',
    description: 'Fluxo para solicitação de máquinas e equipamentos agrícolas',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'Comprovante de Propriedade ou Posse'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_MICROCREDITO: {
    moduleType: 'SOLICITACAO_MICROCREDITO',
    name: 'Workflow - Solicitação de Microcrédito',
    description: 'Fluxo para solicitação de microcrédito',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF', 'Comprovante de Residência', 'Comprovante de Renda', 'CNPJ (se MEI/Empresa)', 'Projeto ou Plano de Negócio Simples'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_PATRULHAMENTO: {
    moduleType: 'SOLICITACAO_PATRULHAMENTO',
    name: 'Workflow - Solicitação de Patrulhamento',
    description: 'Fluxo para solicitação de patrulhamento',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_PONTO_ONIBUS: {
    moduleType: 'SOLICITACAO_PONTO_ONIBUS',
    name: 'Workflow - Solicitação de Ponto de Ônibus',
    description: 'Fluxo para solicitação de ponto de ônibus',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_REPARO_VIA: {
    moduleType: 'SOLICITACAO_REPARO_VIA',
    name: 'Workflow - Solicitação de Reparo de Via',
    description: 'Fluxo para solicitação de reparo de via',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOLICITACAO_SEMAFORO: {
    moduleType: 'SOLICITACAO_SEMAFORO',
    name: 'Workflow - Solicitação de Semáforo',
    description: 'Fluxo para solicitação de semáforo',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SOS_MULHER: {
    moduleType: 'SOS_MULHER',
    name: 'Workflow - SOS Mulher - Pedido de Ajuda Urgente',
    description: 'Fluxo para sos mulher - pedido de ajuda urgente',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SUGESTAO_LINHA: {
    moduleType: 'SUGESTAO_LINHA',
    name: 'Workflow - Sugestão de Nova Linha de Ônibus',
    description: 'Fluxo para sugestão de nova linha de ônibus',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SUGESTAO_MELHORIA: {
    moduleType: 'SUGESTAO_MELHORIA',
    name: 'Workflow - Sugestão de Melhoria em Sistemas',
    description: 'Fluxo para sugestão de melhoria em sistemas',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  SUPORTE_TECNICO: {
    moduleType: 'SUPORTE_TECNICO',
    name: 'Workflow - Suporte Técnico em Sistemas Municipais',
    description: 'Fluxo para suporte técnico em sistemas municipais',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  TARIFA_SOCIAL_ENERGIA: {
    moduleType: 'TARIFA_SOCIAL_ENERGIA',
    name: 'Workflow - Solicitação de Tarifa Social de Energia',
    description: 'Fluxo para solicitação de tarifa social de energia',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CadÚnico', 'CPF', 'Conta de Luz', 'Comprovante de Renda'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  TOMBAMENTO_PATRIMONIO: {
    moduleType: 'TOMBAMENTO_PATRIMONIO',
    name: 'Workflow - Tombamento Patrimônio',
    description: 'Fluxo para tombamento patrimônio',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Documentação Histórica', 'Fotos', 'Laudo Técnico'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  TRANSFERENCIA_ESCOLAR: {
    moduleType: 'TRANSFERENCIA_ESCOLAR',
    name: 'Workflow - Transferência Escolar',
    description: 'Fluxo para transferência escolar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Histórico Escolar', 'Comprovante de Residência', 'Declaração de Transferência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  TRANSFERENCIA_PONTO_TAXI: {
    moduleType: 'TRANSFERENCIA_PONTO_TAXI',
    name: 'Workflow - Transferência de Ponto de Táxi',
    description: 'Fluxo para transferência de ponto de táxi',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Credencial de Taxista', 'Certidão Negativa de Multas', 'Justificativa'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  TRANSPORTE_ESCOLAR: {
    moduleType: 'TRANSPORTE_ESCOLAR',
    name: 'Workflow - Transporte Escolar',
    description: 'Fluxo para transporte escolar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Matrícula', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  TRANSPORTE_ESCOLAR_GRATUITO: {
    moduleType: 'TRANSPORTE_ESCOLAR_GRATUITO',
    name: 'Workflow - Solicitação de Transporte Escolar Gratuito',
    description: 'Fluxo para solicitação de transporte escolar gratuito',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou Certidão de Nascimento', 'CPF', 'Declaração de Matrícula', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  TRANSPORTE_PACIENTES: {
    moduleType: 'TRANSPORTE_PACIENTES',
    name: 'Workflow - Transporte de Pacientes (TFD)',
    description: 'Fluxo para transporte de pacientes (tfd)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Atestado Médico', 'Comprovante de Endereço', 'Cartão SUS', 'RG ou CPF'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  TREINAMENTO_DEFESA_CIVIL: {
    moduleType: 'TREINAMENTO_DEFESA_CIVIL',
    name: 'Workflow - Inscrição em Treinamento de Defesa Civil',
    description: 'Fluxo para inscrição em treinamento de defesa civil',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG ou CPF', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  UNIFORME_ESCOLAR: {
    moduleType: 'UNIFORME_ESCOLAR',
    name: 'Workflow - Solicitação de Uniforme Escolar',
    description: 'Fluxo para solicitação de uniforme escolar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Matrícula', 'Declaração de Baixa Renda (se aplicável)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  USO_ESPACO_PUBLICO: {
    moduleType: 'USO_ESPACO_PUBLICO',
    name: 'Workflow - Solicitação de Uso de Espaço Público',
    description: 'Fluxo para solicitação de uso de espaço público',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG e CPF do Responsável', 'Projeto do Evento (se aplicável)', 'Comprovante de Endereço'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  USO_GINASIO: {
    moduleType: 'USO_GINASIO',
    name: 'Workflow - Uso Ginásio',
    description: 'Fluxo para uso ginásio',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Projeto do Evento'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  USUCAPIAO_URBANO: {
    moduleType: 'USUCAPIAO_URBANO',
    name: 'Workflow - Usucapião Urbano',
    description: 'Fluxo para usucapião urbano',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Declaração de Posse Mansa e Pacífica', 'Comprovantes de Residência', 'Declaração de Testemunhas'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  VAGA_ESPECIAL: {
    moduleType: 'VAGA_ESPECIAL',
    name: 'Workflow - Solicitação de Vaga Especial (Idoso/PcD)',
    description: 'Fluxo para solicitação de vaga especial (idoso/pcd)',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Laudo Médico (PcD) ou Documento de Identidade (Idoso +60)', 'CRLV', 'Comprovante de Residência'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  VAGA_ESPECIAL_PCD: {
    moduleType: 'VAGA_ESPECIAL_PCD',
    name: 'Workflow - Solicitação de Vaga Especial para PCD',
    description: 'Fluxo para solicitação de vaga especial para pcd',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['RG', 'CPF', 'CNH (se condutor)', 'Laudo Médico', 'Documento do Veículo'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  VARRICAO_RUA: {
    moduleType: 'VARRICAO_RUA',
    name: 'Workflow - Varrição de Rua',
    description: 'Fluxo para varrição de rua',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  VIABILIDADE_URBANISTICA: {
    moduleType: 'VIABILIDADE_URBANISTICA',
    name: 'Workflow - Consulta de Viabilidade Urbanística',
    description: 'Fluxo para consulta de viabilidade urbanística',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Matrícula do Imóvel', 'Memorial Descritivo'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  VISITA_DOMICILIAR: {
    moduleType: 'VISITA_DOMICILIAR',
    name: 'Workflow - Visita Domiciliar',
    description: 'Fluxo para visita domiciliar',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Endereço'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Propriedade'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  VISTORIA_AREA_RISCO: {
    moduleType: 'VISTORIA_AREA_RISCO',
    name: 'Workflow - Solicitação de Vistoria em Área de Risco',
    description: 'Fluxo para solicitação de vistoria em área de risco',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['Comprovante de Residência', 'RG ou CPF', 'Fotos do Local (se possível)'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  VISTORIA_ESTRUTURAL: {
    moduleType: 'VISTORIA_ESTRUTURAL',
    name: 'Workflow - Vistoria Estrutural',
    description: 'Fluxo para vistoria estrutural',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  VISTORIA_HABITACIONAL: {
    moduleType: 'VISTORIA_HABITACIONAL',
    name: 'Workflow - Vistoria Habitacional',
    description: 'Fluxo para vistoria habitacional',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CPF', 'RG', 'Comprovante de Endereço'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  VISTORIA_TECNICA: {
    moduleType: 'VISTORIA_TECNICA',
    name: 'Workflow - Vistoria Técnica de Edificação',
    description: 'Fluxo para vistoria técnica de edificação',
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
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 3,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
  VISTORIA_VEICULO: {
    moduleType: 'VISTORIA_VEICULO',
    name: 'Workflow - Vistoria de Veículo de Transporte',
    description: 'Fluxo para vistoria de veículo de transporte',
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
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: ['CRLV', 'Comprovante de Pagamento de Taxas'],
        requiredFormFields: [],
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
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }
    ]
  },
};

export { specificWorkflows };
