/**
 * ============================================================================
 * WORKFLOW TEMPLATES
 * ============================================================================
 *
 * Templates de workflows categorizados por tipo de serviço.
 * Cada template contém stages apropriadas para aquele tipo de processo.
 */

/**
 * Template para serviços de CADASTRO
 * Exemplo: Cadastro de Paciente, Cadastro de Produtor, Cadastro de Artista
 */
export const cadastroTemplate = (name: string, description: string, defaultSLA: number) => ({
  name: `Workflow - ${name}`,
  description,
  defaultSLA,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Recebimento e verificação inicial da solicitação',
      slaDays: Math.ceil(defaultSLA * 0.2),
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Análise de Documentos',
      order: 2,
      description: 'Verificação da documentação apresentada',
      slaDays: Math.ceil(defaultSLA * 0.3),
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação do cadastro',
      slaDays: Math.ceil(defaultSLA * 0.3),
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Registro',
      order: 4,
      description: 'Registro no sistema e emissão de comprovante',
      slaDays: Math.ceil(defaultSLA * 0.2),
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
});

/**
 * Template para serviços de AGENDAMENTO
 * Exemplo: Agendamento de Consulta, Reserva de Quadra, Reserva de Espaço
 */
export const agendamentoTemplate = (name: string, description: string, defaultSLA: number) => ({
  name: `Workflow - ${name}`,
  description,
  defaultSLA,
  stages: [
    {
      name: 'Recebimento',
      order: 1,
      description: 'Recebimento da solicitação de agendamento',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Verificação de Disponibilidade',
      order: 2,
      description: 'Verificação de horários/datas disponíveis',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Agendamento',
      order: 3,
      description: 'Confirmação do agendamento',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Notificação',
      order: 4,
      description: 'Notificação ao cidadão',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
});

/**
 * Template para serviços de SOLICITAÇÃO
 * Exemplo: Solicitação de Máquinas, Solicitação de Poda, Solicitação de Capina
 */
export const solicitacaoTemplate = (name: string, description: string, defaultSLA: number) => ({
  name: `Workflow - ${name}`,
  description,
  defaultSLA,
  stages: [
    {
      name: 'Protocolo',
      order: 1,
      description: 'Protocolo da solicitação',
      slaDays: Math.ceil(defaultSLA * 0.15),
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Análise',
      order: 2,
      description: 'Análise da viabilidade',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Avaliação Técnica',
      order: 3,
      description: 'Avaliação técnica da solicitação',
      slaDays: Math.ceil(defaultSLA * 0.3),
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Processamento',
      order: 4,
      description: 'Processamento e preparação',
      slaDays: Math.ceil(defaultSLA * 0.2),
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Conclusão',
      order: 5,
      description: 'Atendimento da solicitação',
      slaDays: Math.ceil(defaultSLA * 0.1),
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
});

/**
 * Template para serviços de INSCRIÇÃO
 * Exemplo: Inscrição em Oficinas, Inscrição em Torneio, Inscrição em Programa
 */
export const inscricaoTemplate = (name: string, description: string, defaultSLA: number) => ({
  name: `Workflow - ${name}`,
  description,
  defaultSLA,
  stages: [
    {
      name: 'Recebimento',
      order: 1,
      description: 'Recebimento da inscrição',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Verificação de Requisitos',
      order: 2,
      description: 'Verificação dos requisitos mínimos',
      slaDays: Math.ceil(defaultSLA * 0.35),
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação da inscrição',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Efetivação',
      order: 4,
      description: 'Efetivação e notificação',
      slaDays: Math.ceil(defaultSLA * 0.15),
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
});

/**
 * Template para serviços de AUTORIZAÇÃO/LICENÇA
 * Exemplo: Alvará de Construção, Licença Ambiental, Autorização de Poda
 */
export const autorizacaoTemplate = (name: string, description: string, defaultSLA: number) => ({
  name: `Workflow - ${name}`,
  description,
  defaultSLA,
  stages: [
    {
      name: 'Protocolo',
      order: 1,
      description: 'Protocolo da documentação',
      slaDays: Math.ceil(defaultSLA * 0.15),
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Análise Técnica',
      order: 2,
      description: 'Análise técnica da solicitação',
      slaDays: Math.ceil(defaultSLA * 0.4),
      allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Vistoria',
      order: 3,
      description: 'Vistoria técnica se necessário',
      slaDays: Math.ceil(defaultSLA * 0.3),
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: true
    },
    {
      name: 'Emissão',
      order: 4,
      description: 'Emissão da autorização/licença',
      slaDays: Math.ceil(defaultSLA * 0.15),
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
});

/**
 * Template para serviços de DENÚNCIA
 * Exemplo: Denúncia Ambiental, Denúncia Construção Irregular
 */
export const denunciaTemplate = (name: string, description: string, defaultSLA: number) => ({
  name: `Workflow - ${name}`,
  description,
  defaultSLA,
  stages: [
    {
      name: 'Recebimento',
      order: 1,
      description: 'Recebimento da denúncia',
      slaDays: Math.ceil(defaultSLA * 0.2),
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Triagem',
      order: 2,
      description: 'Triagem e classificação',
      slaDays: Math.ceil(defaultSLA * 0.2),
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Investigação',
      order: 3,
      description: 'Investigação e vistoria',
      slaDays: Math.ceil(defaultSLA * 0.4),
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Resolução',
      order: 4,
      description: 'Resolução e encaminhamento',
      slaDays: Math.ceil(defaultSLA * 0.2),
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
});

/**
 * Template para serviços de ATENDIMENTO
 * Exemplo: Atendimento CRAS, Atendimento de Saúde, Atendimento Social
 */
export const atendimentoTemplate = (name: string, description: string, defaultSLA: number) => ({
  name: `Workflow - ${name}`,
  description,
  defaultSLA,
  stages: [
    {
      name: 'Recepção',
      order: 1,
      description: 'Recepção e triagem',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Análise',
      order: 2,
      description: 'Análise da demanda',
      slaDays: Math.ceil(defaultSLA * 0.35),
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Processamento',
      order: 3,
      description: 'Processamento do atendimento',
      slaDays: Math.ceil(defaultSLA * 0.3),
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Conclusão',
      order: 4,
      description: 'Conclusão e encaminhamento',
      slaDays: Math.ceil(defaultSLA * 0.1),
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
});

/**
 * Template para serviços de GESTÃO
 * Exemplo: Gestão de Obras, Gestão de Benefícios, Gestão Escolar
 */
export const gestaoTemplate = (name: string, description: string, defaultSLA: number) => ({
  name: `Workflow - ${name}`,
  description,
  defaultSLA,
  stages: [
    {
      name: 'Planejamento',
      order: 1,
      description: 'Planejamento da atividade',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Execução',
      order: 2,
      description: 'Execução das ações',
      slaDays: Math.ceil(defaultSLA * 0.4),
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Monitoramento',
      order: 3,
      description: 'Monitoramento e ajustes',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Avaliação',
      order: 4,
      description: 'Avaliação e conclusão',
      slaDays: Math.ceil(defaultSLA * 0.1),
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
});

/**
 * Template para serviços de RESERVA
 * Exemplo: Reserva de Espaço Cultural, Reserva de Quadra, Aluguel de Quadra
 */
export const reservaTemplate = (name: string, description: string, defaultSLA: number) => ({
  name: `Workflow - ${name}`,
  description,
  defaultSLA,
  stages: [
    {
      name: 'Solicitação',
      order: 1,
      description: 'Recebimento da solicitação de reserva',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Verificação de Disponibilidade',
      order: 2,
      description: 'Verificação de disponibilidade',
      slaDays: Math.ceil(defaultSLA * 0.25),
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Aprovação',
      order: 3,
      description: 'Aprovação da reserva',
      slaDays: Math.ceil(defaultSLA * 0.3),
      allowedActions: ['APPROVE', 'REJECT'],
      canSkip: false
    },
    {
      name: 'Confirmação',
      order: 4,
      description: 'Confirmação e emissão de comprovante',
      slaDays: Math.ceil(defaultSLA * 0.2),
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
});

/**
 * Template para serviços de CONSULTA
 * Exemplo: Consulta de Frequência, Consulta de Notas
 */
export const consultaTemplate = (name: string, description: string, defaultSLA: number) => ({
  name: `Workflow - ${name}`,
  description,
  defaultSLA,
  stages: [
    {
      name: 'Recebimento',
      order: 1,
      description: 'Recebimento da consulta',
      slaDays: Math.ceil(defaultSLA * 0.3),
      allowedActions: ['APPROVE', 'REQUEST_INFO'],
      canSkip: false
    },
    {
      name: 'Processamento',
      order: 2,
      description: 'Processamento da consulta',
      slaDays: Math.ceil(defaultSLA * 0.4),
      allowedActions: ['APPROVE'],
      canSkip: false
    },
    {
      name: 'Resposta',
      order: 3,
      description: 'Envio da resposta',
      slaDays: Math.ceil(defaultSLA * 0.3),
      allowedActions: ['APPROVE'],
      canSkip: false
    }
  ]
});

/**
 * Mapeamento de palavras-chave para templates
 */
const templateKeywords = {
  cadastro: cadastroTemplate,
  agendamento: agendamentoTemplate,
  agendamentos: agendamentoTemplate,
  solicitacao: solicitacaoTemplate,
  inscricao: inscricaoTemplate,
  autorizacao: autorizacaoTemplate,
  licenca: autorizacaoTemplate,
  licenciamento: autorizacaoTemplate,
  alvara: autorizacaoTemplate,
  denuncia: denunciaTemplate,
  atendimento: atendimentoTemplate,
  atendimentos: atendimentoTemplate,
  gestao: gestaoTemplate,
  reserva: reservaTemplate,
  aluguel: reservaTemplate,
  consulta: consultaTemplate
};

/**
 * Determina o template apropriado baseado no moduleType e nome
 */
export function getTemplateForModuleType(
  moduleType: string,
  name: string,
  description: string,
  defaultSLA: number
) {
  // Normalizar para busca
  const searchText = `${moduleType} ${name}`.toLowerCase();

  // Buscar palavra-chave no texto
  for (const [keyword, template] of Object.entries(templateKeywords)) {
    if (searchText.includes(keyword)) {
      return template(name, description, defaultSLA);
    }
  }

  // Se não encontrou nenhum template específico, usar o de solicitação (mais genérico)
  return solicitacaoTemplate(name, description, defaultSLA);
}
