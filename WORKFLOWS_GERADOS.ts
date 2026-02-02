/**
 * WORKFLOWS CUSTOMIZADOS GERADOS AUTOMATICAMENTE
 *
 * Este arquivo contém os 137 workflows faltantes
 * para completar a cobertura de 100% dos serviços COM_DADOS
 *
 * INSTRUCOES:
 * 1. Revisar os workflows gerados
 * 2. Ajustar SLAs conforme necessário
 * 3. Adicionar campos obrigatórios específicos (requiredFormFields)
 * 4. Copiar para o arquivo service-workflows.seed.ts
 * 5. Adicionar ao objeto specificWorkflows
 */

const workflowsGerados = {

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
  ATENDIMENTO_DOMICILIAR: {
    moduleType: 'ATENDIMENTO_DOMICILIAR',
    name: 'Workflow - Solicitação de Atendimento Domiciliar',
    description: 'Fluxo para solicitação de atendimento domiciliar',
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
  INSCRICAO_EJA: {
    moduleType: 'INSCRICAO_EJA',
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
  PROGRAMA_PRIMEIRA_INFANCIA: {
    moduleType: 'PROGRAMA_PRIMEIRA_INFANCIA',
    name: 'Workflow - Atendimento CRAS',
    description: 'Fluxo para atendimento cras',
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
  BENEFICIO_EVENTUAL: {
    moduleType: 'BENEFICIO_EVENTUAL',
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
  AUTORIZACAO_SUPRESSAO_VEGETAL: {
    moduleType: 'AUTORIZACAO_SUPRESSAO_VEGETAL',
    name: 'Workflow - Autorização Supressão Vegetal',
    description: 'Fluxo para autorização supressão vegetal',
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
  AUTORIZACAO_MANEJO_FAUNA: {
    moduleType: 'AUTORIZACAO_MANEJO_FAUNA',
    name: 'Workflow - Autorização Manejo Fauna',
    description: 'Fluxo para autorização manejo fauna',
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
  AUTORIZACAO_CAPTACAO_AGUA: {
    moduleType: 'AUTORIZACAO_CAPTACAO_AGUA',
    name: 'Workflow - Autorização Captação Água',
    description: 'Fluxo para autorização captação água',
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
  GUARDA_PATRIMONIAL: {
    moduleType: 'GUARDA_PATRIMONIAL',
    name: 'Workflow - SOS Mulher - Pedido de Ajuda Urgente',
    description: 'Fluxo para sos mulher - pedido de ajuda urgente',
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
  AUTORIZACAO_TRANSPORTE_TURISTICO: {
    moduleType: 'AUTORIZACAO_TRANSPORTE_TURISTICO',
    name: 'Workflow - Autorização para Transporte Turístico',
    description: 'Fluxo para autorização para transporte turístico',
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
  PAGAMENTO_ITBI: {
    moduleType: 'PAGAMENTO_ITBI',
    name: 'Workflow - Pagamento de ISS',
    description: 'Fluxo para pagamento de iss',
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
  PARCELAMENTO_DEBITOS: {
    moduleType: 'PARCELAMENTO_DEBITOS',
    name: 'Workflow - Pagamento de Taxa de Coleta de Lixo',
    description: 'Fluxo para pagamento de taxa de coleta de lixo',
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
  COPIA_PROCESSOS: {
    moduleType: 'COPIA_PROCESSOS',
    name: 'Workflow - Solicitação de Cópia de Processo Administrativo',
    description: 'Fluxo para solicitação de cópia de processo administrativo',
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
  USO_ESPACO_PUBLICO: {
    moduleType: 'USO_ESPACO_PUBLICO',
    name: 'Workflow - Agendamento de Serviços Gerais',
    description: 'Fluxo para agendamento de serviços gerais',
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
  CURSOS_QUALIFICACAO: {
    moduleType: 'CURSOS_QUALIFICACAO',
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
  AUTORIZACAO_EVENTO_VIA: {
    moduleType: 'AUTORIZACAO_EVENTO_VIA',
    name: 'Workflow - Autorização para Evento em Via Pública',
    description: 'Fluxo para autorização para evento em via pública',
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
  VAGA_ESPECIAL: {
    moduleType: 'VAGA_ESPECIAL',
    name: 'Workflow - Denúncia de Veículo Abandonado',
    description: 'Fluxo para denúncia de veículo abandonado',
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
  SOLICITACAO_MICROCREDITO: {
    moduleType: 'SOLICITACAO_MICROCREDITO',
    name: 'Workflow - Agendamento Sala do Empreendedor',
    description: 'Fluxo para agendamento sala do empreendedor',
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
  COMPRA_DIRETA_PRODUTOR: {
    moduleType: 'COMPRA_DIRETA_PRODUTOR',
    name: 'Workflow - Denúncia de Comércio Irregular',
    description: 'Fluxo para denúncia de comércio irregular',
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
  AUTORIZACAO_TRANSPORTE_ESCOLAR: {
    moduleType: 'AUTORIZACAO_TRANSPORTE_ESCOLAR',
    name: 'Workflow - Autorização para Transporte Escolar',
    description: 'Fluxo para autorização para transporte escolar',
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
};

// Adicione estes workflows ao objeto specificWorkflows em service-workflows.seed.ts
// Exemplo:
// const specificWorkflows: Record<string, SpecificWorkflow> = {
//   ...workflowsExistentes,
//   ...workflowsGerados
// };

export { workflowsGerados };
