/**
 * WORKFLOWS FALTANTES - CRIADOS MANUALMENTE E SISTEMÁTICOS
 * Total: 72 workflows customizados específicos por tipo de serviço
 * Baseados nos 81 workflows existentes que funcionam corretamente
 */

// ========== DEFESA CIVIL - URGÊNCIAS ==========

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
      requiredFormFields: ['motivo_acionamento', 'localizacao', 'nivel_risco'],
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
      requiredFormFields: ['tipo_alerta', 'area_afetada', 'gravidade'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['nivel_risco', 'parecer_tecnico', 'familias_afetadas'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_urgencia', 'localizacao', 'condicao_paciente'],
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
      requiredFormFields: ['veiculo', 'equipe'],
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
      requiredFormFields: ['situacao_risco', 'localizacao'],
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
      requiredFormFields: ['providencias_tomadas'],
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
      requiredFormFields: ['relato', 'encaminhamento_necessario'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_irregularidade', 'setor_responsavel', 'gravidade'],
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
      requiredFormFields: ['resultado_investigacao'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['nivel_risco', 'tipo_risco', 'parecer_tecnico'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_assedio', 'local_trabalho'],
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
      requiredFormFields: ['relatorio_apuracao'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['situacao_encontrada', 'tipo_irregularidade'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['nivel_risco', 'situacao_construcao', 'parecer_tecnico'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_residuo', 'volume_aproximado'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['nivel_ruido', 'fonte_ruido'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['sistema_afetado', 'tipo_problema'],
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
      requiredFormFields: ['diagnostico', 'solucao_proposta'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'dimensao_aproximada'],
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
      requiredFormFields: ['equipe_acionada'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_irregularidade', 'nivel_gravidade', 'laudo_sanitario'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_veiculo', 'localizacao'],
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
      requiredFormFields: ['situacao_encontrada'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'tipo_veiculo'],
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
      requiredFormFields: ['placa', 'condicoes_veiculo'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['situacao_risco', 'tipo_violencia'],
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
      requiredFormFields: ['providencias_tomadas', 'orgaos_acionados'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['situacao_risco', 'tipo_violencia', 'vitima_protegida'],
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
      requiredFormFields: ['providencias_tomadas', 'orgaos_acionados'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_equipamento', 'quantidade', 'localizacao'],
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
      requiredFormFields: ['data_coleta', 'equipe_responsavel'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'capacidade_solicitada'],
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
      requiredFormFields: ['parecer_tecnico', 'viabilidade'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_praga', 'localizacao', 'area_aproximada'],
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
      requiredFormFields: ['nivel_infestacao', 'tratamento_recomendado'],
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
      requiredFormFields: ['produtos_utilizados'],
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
      requiredFormFields: ['localizacao'],
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
      requiredFormFields: ['data_prevista'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'dia_feira'],
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
      requiredFormFields: ['equipe_responsavel', 'horario'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'area_aproximada'],
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
      requiredFormFields: ['situacao_terreno', 'proprietario_identificado'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'extensao_dano'],
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
      requiredFormFields: ['tipo_intervencao', 'orcamento_estimado'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'extensao'],
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
      requiredFormFields: ['prioridade'],
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
      requiredFormFields: ['data_prevista'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao'],
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
      requiredFormFields: ['data_prevista'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'tipo_animal'],
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
      requiredFormFields: ['equipe_acionada'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'justificativa'],
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
      requiredFormFields: ['parecer_tecnico', 'viabilidade', 'demanda_estimada'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredDocumentTypes: ['Projeto de Calçada', 'Escritura do Imóvel', 'Documento de Identidade'],
      requiredFormFields: [],
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
      requiredFormFields: ['parecer_tecnico', 'conforme_normas'],
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
      requiredFormFields: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Emissão de Alvará',
      order: 5,
      description: 'Emissão do alvará de execução',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredDocumentTypes: ['Projeto de Muro', 'Escritura do Imóvel', 'Documento de Identidade'],
      requiredFormFields: [],
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
      requiredFormFields: ['parecer_tecnico', 'altura_muro', 'conforme_normas'],
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
      requiredFormFields: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Emissão de Alvará',
      order: 5,
      description: 'Emissão do alvará de execução',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredDocumentTypes: ['Projeto de Terraplanagem', 'Laudo Geotécnico', 'Escritura do Imóvel'],
      requiredFormFields: [],
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
      requiredFormFields: ['parecer_tecnico', 'impacto_ambiental', 'conformidade_tecnica'],
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
      requiredFormFields: ['parecer_ambiental'],
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
      requiredFormFields: [],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Emissão de Alvará',
      order: 6,
      description: 'Emissão do alvará de terraplanagem',
      slaDays: 2,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredFormFields: [],
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
      requiredFormFields: ['motivo_vistoria', 'localizacao'],
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
      requiredFormFields: ['data_vistoria', 'engenheiro_responsavel'],
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
      requiredFormFields: ['laudo_tecnico', 'situacao_estrutural', 'risco_identificado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Emissão de Laudo',
      order: 4,
      description: 'Emissão do laudo técnico',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_vistoria', 'localizacao'],
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
      requiredFormFields: ['data_vistoria', 'tecnico_responsavel'],
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
      requiredFormFields: ['parecer_tecnico', 'conformidade'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Emissão de Parecer',
      order: 4,
      description: 'Emissão do parecer técnico',
      slaDays: 3,
      availableTabs: ['resumo', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'tipo_servico'],
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
      requiredFormFields: ['situacao_jardim', 'servicos_necessarios'],
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
      requiredFormFields: ['data_prevista', 'equipe_responsavel'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'tipo_arvore'],
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
      requiredFormFields: ['tipo_poda', 'urgencia', 'parecer_tecnico'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'problemas_identificados'],
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
      requiredFormFields: ['estado_conservacao', 'intervencoes_necessarias', 'orcamento_estimado'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Elaboração de Projeto',
      order: 3,
      description: 'Elaboração do projeto de recuperação',
      slaDays: 10,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredFormFields: ['projeto_elaborado'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_reclamacao', 'localizacao'],
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
      requiredFormFields: ['procedencia', 'providencias_necessarias'],
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
      requiredFormFields: ['parecer_tecnico'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_reclamacao', 'linha_transporte'],
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
      requiredFormFields: ['procedencia', 'providencias_necessarias'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_sinalizacao', 'localizacao', 'justificativa'],
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
      requiredFormFields: ['parecer_tecnico', 'viabilidade', 'tipo_sinalizacao_recomendada'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'justificativa'],
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
      requiredFormFields: ['estudo_fluxo', 'velocidade_media', 'acidentes_registrados', 'parecer_tecnico'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'justificativa'],
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
      requiredFormFields: ['contagem_veiculos', 'contagem_pedestres', 'acidentes_registrados', 'parecer_tecnico'],
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
      requiredFormFields: ['orcamento', 'recurso_disponivel'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'justificativa'],
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
      requiredFormFields: ['demanda_estimada', 'viabilidade_local', 'parecer_tecnico'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['origem', 'destino', 'justificativa'],
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
      requiredFormFields: ['demanda_estimada', 'viabilidade_preliminar'],
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
      requiredFormFields: ['estudo_demanda', 'viabilidade_operacional', 'viabilidade_financeira'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_manifestacao', 'setor_responsavel'],
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
      requiredFormFields: ['classificacao', 'area_responsavel'],
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
      requiredFormFields: ['parecer_area', 'providencias_tomadas'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['informacao_solicitada', 'setor_responsavel'],
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
      requiredFormFields: ['area_responsavel', 'complexidade'],
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
      requiredFormFields: ['informacao_encontrada'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_demanda', 'situacao_familia'],
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
      requiredFormFields: ['diagnostico_social', 'encaminhamentos_necessarios'],
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
      requiredFormFields: ['servicos_encaminhados'],
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
      requiredFormFields: ['tipo_documento', 'justificativa_gratuidade'],
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
      requiredDocumentTypes: ['Comprovante de Residência', 'Documento de Identidade'],
      requiredFormFields: ['situacao_economica_verificada'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_servico', 'data_preferencial'],
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
      requiredFormFields: ['data_agendada', 'horario', 'local'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['endereco', 'informacao_fornecida'],
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
      requiredFormFields: ['ano_letivo', 'escola', 'informacao_fornecida'],
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
      requiredFormFields: ['tipo_necessidade', 'numero_familias', 'localizacao'],
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
      requiredFormFields: ['situacao_verificada', 'itens_necessarios'],
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
      requiredFormFields: ['doacoes_arrecadadas'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['escola', 'horarios_necessarios', 'justificativa'],
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
      requiredFormFields: ['parecer_seguranca', 'viabilidade_operacional'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao', 'justificativa'],
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
      requiredFormFields: ['situacao_atual', 'tipo_intervencao', 'orcamento'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['qualificacao', 'area_interesse', 'disponibilidade'],
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
      requiredFormFields: ['perfil_mapeado', 'vagas_compativeis'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['localizacao_cameras', 'numero_cameras', 'tipo_equipamento'],
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
      requiredDocumentTypes: ['Termo de Adesão', 'Comprovante de Propriedade', 'Documento de Identidade'],
      requiredFormFields: [],
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
      requiredFormFields: ['qualidade_imagem', 'cobertura_area', 'parecer_tecnico'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['bairro', 'rua', 'telefone'],
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
      requiredFormFields: ['dados_validados'],
      requiredDocumentTypes: ['Comprovante de Residência'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_grupo', 'necessidade_especifica'],
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
      requiredFormFields: ['perfil_participante', 'grupo_recomendado'],
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
      requiredFormFields: ['data_inicio', 'horarios'],
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
      requiredFormFields: ['curso_interesse', 'escolaridade', 'disponibilidade'],
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
      requiredDocumentTypes: ['Documento de Identidade', 'CPF', 'Comprovante de Escolaridade'],
      requiredFormFields: [],
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
      requiredFormFields: ['perfil_adequado', 'curso_compativel'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['nome_equipe', 'membros', 'area_interesse'],
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
      requiredDocumentTypes: ['Documento de Identidade dos Membros'],
      requiredFormFields: [],
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
      requiredFormFields: ['inscricao_validada'],
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
      requiredFormFields: ['oficina_interesse', 'faixa_etaria'],
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
      requiredFormFields: ['vagas_disponiveis', 'turma_alocada'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['tipo_atendimento', 'data_preferencial', 'descricao_necessidade'],
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
      requiredFormFields: ['data_agendada', 'horario', 'profissional_responsavel'],
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
      requiredFormFields: [],
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
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredFormFields: ['inscricao_municipal', 'ano_exercicio'],
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
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredFormFields: ['inscricao_municipal', 'periodo_referencia', 'valor_servicos'],
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
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'dados',
      requiredDocumentTypes: [],
      requiredFormFields: ['inscricao_municipal', 'ano_exercicio'],
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
      requiredFormFields: ['tipo_empresa', 'area_atuacao', 'investimento_estimado'],
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
      requiredFormFields: ['viabilidade', 'incentivos_aplicaveis'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Elaboração de Proposta',
      order: 3,
      description: 'Elaboração de proposta de incentivos',
      slaDays: 15,
      availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
      primaryTab: 'documentos',
      requiredFormFields: ['proposta_elaborada'],
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
      requiredFormFields: ['tipo_consultoria', 'area_necessidade', 'descricao_problema'],
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
      requiredFormFields: ['tipo_atendimento', 'consultor_alocado'],
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
      requiredFormFields: ['data_agendada', 'horario'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['area_criativa', 'tipo_orientacao'],
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
      requiredFormFields: ['perfil_mapeado', 'orientacoes_necessarias'],
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
      requiredFormFields: ['data_agendada', 'especialista_responsavel'],
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
      requiredFormFields: [],
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
      requiredFormFields: ['sistema_afetado', 'descricao_sugestao'],
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
      requiredFormFields: ['viabilidade_tecnica', 'complexidade', 'prioridade'],
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
      requiredFormFields: [],
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
      requiredFormFields: [],
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
      requiredFormFields: ['sistema_afetado', 'tipo_problema', 'urgencia'],
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
      requiredFormFields: ['prioridade', 'tecnico_responsavel'],
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
      requiredFormFields: ['solucao_aplicada'],
      requiredDocumentTypes: [],
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    }
  ]
}

/**
 * ============================================================================
 * FIM DOS WORKFLOWS FALTANTES
 * ============================================================================
 *
 * Total de workflows criados: 72
 *
 * RESUMO POR CATEGORIA:
 * - Defesa Civil - Urgências: 3 workflows
 * - Saúde - Urgência: 1 workflow
 * - Políticas para Mulheres - Urgência: 2 workflows
 * - Denúncias: 13 workflows
 * - Limpeza e Manutenção Urbana: 11 workflows
 * - Infraestrutura e Obras: 8 workflows
 * - Trânsito e Mobilidade: 7 workflows
 * - Serviços Administrativos e Atendimento: 10 workflows
 * - Cadastros e Inscrições: 8 workflows
 * - Pagamentos: 3 workflows
 * - Desenvolvimento Econômico e Consultorias: 3 workflows
 * - Sugestões e Suporte Técnico: 2 workflows
 *
 * CARACTERÍSTICAS DOS WORKFLOWS:
 * - Todos seguem o padrão dos 81 workflows existentes
 * - SLAs ajustados por tipo de serviço (urgentes: 1-3 dias, licenças: 20-60 dias)
 * - Stages específicos para cada tipo de serviço
 * - requiredFormFields definidos por stage quando necessário
 * - requiredDocumentTypes definidos quando há análise documental
 * - availableTabs e primaryTab configurados adequadamente
 * - allowedActions apropriadas para cada stage
 *
 * PRÓXIMOS PASSOS:
 * 1. Revisar todos os workflows gerados
 * 2. Ajustar campos específicos (requiredFormFields) conforme necessário
 * 3. Validar SLAs com as coordenações responsáveis
 * 4. Copiar estes workflows para o arquivo service-workflows.seed.ts
 * 5. Adicionar ao objeto specificWorkflows existente
 * 6. Executar seed do banco de dados
 * 7. Testar os fluxos em desenvolvimento
 */
