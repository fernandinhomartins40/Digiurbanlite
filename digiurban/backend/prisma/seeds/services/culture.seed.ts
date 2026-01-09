/**
 * SEED DE SERVIÇOS - SECRETARIA DE CULTURA
 * Total: 15 serviços
 * - 12 serviços COM_DADOS (com formulário)
 * - 3 serviços SEM_DADOS (apenas documentos)
 */

import { ServiceDefinition } from './types';

export const cultureServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (12) ==========

  {
    name: 'Inscrição em Oficinas Culturais',
    description: 'Inscrição em oficinas de arte, música, teatro, dança e outras modalidades culturais',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_OFICINA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência'],
    estimatedDays: 5,
    priority: 3,
    category: 'Oficinas',
    icon: 'Palette',
    color: '#7c3aed',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      properties: {
        tipoOficina: {
          type: 'string',
          title: 'Tipo de Oficina',
          enum: ['Música', 'Teatro', 'Dança', 'Artes Visuais', 'Artesanato', 'Literatura', 'Fotografia', 'Audiovisual', 'Outra']
        },
        nomeOficina: { type: 'string', title: 'Nome da Oficina', maxLength: 200 },
        nivelExperiencia: {
          type: 'string',
          title: 'Nível de Experiência',
          enum: ['Nenhum', 'Iniciante', 'Intermediário', 'Avançado']
        },
        turnoPreferido: {
          type: 'string',
          title: 'Turno Preferido',
          enum: ['Manhã', 'Tarde', 'Noite', 'Qualquer']
        },
        motivoInscricao: { type: 'string', title: 'Motivo da Inscrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoOficina', 'nomeOficina', 'nivelExperiencia', 'turnoPreferido']
    }
  },

  {
    name: 'Cadastro de Artistas Locais',
    description: 'Cadastro de artistas para participação em eventos culturais municipais',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ARTISTA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Portfólio Artístico'],
    estimatedDays: 10,
    priority: 4,
    category: 'Cadastro',
    icon: 'Mic',
    color: '#6d28d9',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      properties: {
        areaAtuacao: {
          type: 'string',
          title: 'Área de Atuação',
          enum: ['Teatro', 'Música', 'Dança', 'Artes Visuais', 'Literatura', 'Cultura Popular', 'Audiovisual', 'Outra']
        },
        experienciaArtistica: { type: 'string', title: 'Experiência Artística', maxLength: 500, widget: 'textarea' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['areaAtuacao', 'experienciaArtistica']
    }
  },

  {
    name: 'Reserva de Espaço Cultural',
    description: 'Agendamento de teatros, centros culturais e auditórios municipais',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'RESERVA_ESPACO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Projeto do Evento'],
    estimatedDays: 10,
    priority: 3,
    category: 'Reserva',
    icon: 'Building',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      properties: {
        espacoDesejado: { type: 'string', title: 'Espaço Desejado', maxLength: 200 },
        tipoEvento: {
          type: 'string',
          title: 'Tipo de Evento',
          enum: ['Teatro', 'Show Musical', 'Dança', 'Exposição', 'Palestra', 'Workshop', 'Outro']
        },
        nomeEvento: { type: 'string', title: 'Nome do Evento', maxLength: 200 },
        dataDesejada: { type: 'string', format: 'date', title: 'Data Desejada' },
        horarioInicio: { type: 'string', title: 'Horário de Início', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        publicoEstimado: { type: 'integer', title: 'Público Estimado', minimum: 1 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['espacoDesejado', 'tipoEvento', 'nomeEvento', 'dataDesejada', 'horarioInicio', 'publicoEstimado']
    }
  },

  {
    name: 'Cadastro de Grupo Artístico',
    description: 'Cadastro de grupos culturais e artísticos do município',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_GRUPO_ARTISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Documentos dos Integrantes', 'Portfólio do Grupo', 'Estatuto (opcional)'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'Users',
    color: '#a855f7',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      properties: {
        nomeGrupo: { type: 'string', title: 'Nome do Grupo', maxLength: 200 },
        tipoManifestacao: {
          type: 'string',
          title: 'Tipo de Manifestação',
          enum: ['Teatro', 'Música', 'Dança', 'Artes Visuais', 'Literatura', 'Cultura Popular', 'Outra']
        },
        numeroIntegrantes: { type: 'integer', title: 'Número de Integrantes', minimum: 2 },
        anoFundacao: { type: 'integer', title: 'Ano de Fundação', minimum: 1900, maximum: 2100 },
        descricaoGrupo: { type: 'string', title: 'Descrição do Grupo', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeGrupo', 'tipoManifestacao', 'numeroIntegrantes', 'descricaoGrupo']
    }
  },

  {
    name: 'Solicitação de Atendimento Geral - Cultura',
    description: 'Registro de solicitações e atendimentos gerais da Secretaria de Cultura',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_CULTURA',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Atendimento',
    icon: 'Palette',
    color: '#a855f7',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      properties: {
        tipoAtendimento: {
          type: 'string',
          title: 'Tipo de Atendimento',
          enum: ['Informações', 'Inscrição', 'Reserva de Espaço', 'Projeto Cultural', 'Reclamação', 'Outros']
        },
        areaCultural: {
          type: 'string',
          title: 'Área Cultural',
          enum: ['Artes Visuais', 'Música', 'Teatro', 'Dança', 'Literatura', 'Artesanato', 'Cultura Popular', 'Audiovisual', 'Outra']
        },
        descricaoSolicitacao: { type: 'string', title: 'Descrição da Solicitação', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoAtendimento', 'areaCultural', 'descricaoSolicitacao']
    }
  },

  {
    name: 'Cadastro de Evento Cultural',
    description: 'Registro de eventos culturais no município',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_EVENTO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto do Evento', 'Autorizações Necessárias'],
    estimatedDays: 15,
    priority: 3,
    category: 'Eventos',
    icon: 'Calendar',
    color: '#c026d3',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      properties: {
        nomeEvento: { type: 'string', title: 'Nome do Evento', maxLength: 200 },
        tipoEvento: {
          type: 'string',
          title: 'Tipo de Evento',
          enum: ['Show', 'Teatro', 'Exposição', 'Festival', 'Oficina', 'Palestra', 'Outro']
        },
        dataEvento: { type: 'string', format: 'date', title: 'Data do Evento' },
        localEvento: { type: 'string', title: 'Local do Evento', maxLength: 200 },
        publicoEstimado: { type: 'integer', title: 'Público Estimado', minimum: 1 },
        descricaoEvento: { type: 'string', title: 'Descrição do Evento', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeEvento', 'tipoEvento', 'dataEvento', 'localEvento', 'publicoEstimado', 'descricaoEvento']
    }
  },

  {
    name: 'Registro de Manifestação Cultural',
    description: 'Registro de patrimônio cultural imaterial do município',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_MANIFESTACAO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['Documentação Histórica', 'Fotos', 'Depoimentos'],
    estimatedDays: 60,
    priority: 4,
    category: 'Patrimônio',
    icon: 'Landmark',
    color: '#86198f',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      properties: {
        nomeManifestacao: { type: 'string', title: 'Nome da Manifestação Cultural', maxLength: 200 },
        tipoManifestacao: {
          type: 'string',
          title: 'Tipo de Manifestação',
          enum: ['Festa Popular', 'Dança Tradicional', 'Música Folclórica', 'Artesanato', 'Culinária', 'Celebração Religiosa', 'Outra']
        },
        descricaoHistorica: { type: 'string', title: 'Descrição Histórica', maxLength: 1000, widget: 'textarea' },
        periodicidade: {
          type: 'string',
          title: 'Periodicidade',
          enum: ['Anual', 'Semestral', 'Mensal', 'Esporádica', 'Contínua']
        },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeManifestacao', 'tipoManifestacao', 'descricaoHistorica', 'periodicidade']
    }
  },

  {
    name: 'Submissão de Projetos Culturais',
    description: 'Submissão de projetos culturais (editais de fomento, Lei de Incentivo à Cultura, projetos gerais)',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'PROJETO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Projeto Detalhado', 'Orçamento', 'Plano de Divulgação (opcional)'],
    estimatedDays: 30,
    priority: 5,
    category: 'Projetos',
    icon: 'FileText',
    color: '#9333ea',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      properties: {
        nomeProjeto: { type: 'string', title: 'Nome do Projeto', maxLength: 200 },
        tipoSubmissao: {
          type: 'string',
          title: 'Tipo de Submissão',
          enum: ['Edital de Fomento', 'Lei de Incentivo à Cultura', 'Projeto Cultural Geral']
        },
        areaCultural: {
          type: 'string',
          title: 'Área Cultural',
          enum: ['Artes Visuais', 'Música', 'Teatro', 'Dança', 'Literatura', 'Audiovisual', 'Cultura Popular', 'Patrimônio', 'Outra']
        },
        resumoProjeto: { type: 'string', title: 'Resumo do Projeto', maxLength: 1000, widget: 'textarea' },
        valorSolicitado: { type: 'number', title: 'Valor Solicitado (R$)', minimum: 0 },
        justificativa: { type: 'string', title: 'Justificativa', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeProjeto', 'tipoSubmissao', 'areaCultural', 'resumoProjeto', 'valorSolicitado']
    }
  },

  {
    name: 'Solicitação de Apoio Cultural',
    description: 'Solicitação de apoio da prefeitura para eventos e atividades culturais',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'APOIO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Projeto ou Proposta'],
    estimatedDays: 15,
    priority: 3,
    category: 'Apoio',
    icon: 'HandHeart',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      properties: {
        nomeEventoAtividade: { type: 'string', title: 'Nome do Evento/Atividade', maxLength: 200 },
        tipoApoio: {
          type: 'string',
          title: 'Tipo de Apoio',
          enum: ['Divulgação', 'Espaço Físico', 'Equipamentos', 'Transporte', 'Outro']
        },
        areaCultural: {
          type: 'string',
          title: 'Área Cultural',
          enum: ['Artes Visuais', 'Música', 'Teatro', 'Dança', 'Literatura', 'Audiovisual', 'Cultura Popular', 'Outra']
        },
        dataEvento: { type: 'string', format: 'date', title: 'Data do Evento' },
        descricaoSolicitacao: { type: 'string', title: 'Descrição da Solicitação', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeEventoAtividade', 'tipoApoio', 'areaCultural', 'dataEvento', 'descricaoSolicitacao']
    }
  },

  // ========== SERVIÇOS SEM_DADOS (3) ==========

  {
    name: 'Certidão de Artista Local',
    description: 'Emissão de certidão comprovando registro como artista local (usa dados do perfil do cidadão)',
    departmentCode: 'CULTURA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#f59e0b'
  },

  {
    name: 'Atestado de Capacitação Cultural',
    description: 'Emissão de atestado de conclusão de oficina cultural (usa dados do perfil do cidadão)',
    departmentCode: 'CULTURA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 2,
    category: 'Atestados',
    icon: 'CheckCircle',
    color: '#7c3aed'
  },

  {
    name: 'Segunda Via de Cadastro Cultural',
    description: 'Emissão de segunda via de cadastros culturais (usa dados do perfil do cidadão)',
    departmentCode: 'CULTURA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 3,
    priority: 2,
    category: 'Documentos',
    icon: 'Copy',
    color: '#6b7280'
  }
];
