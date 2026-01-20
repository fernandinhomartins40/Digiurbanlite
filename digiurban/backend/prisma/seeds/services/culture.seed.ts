/**
 * SEED DE SERVIÇOS - SECRETARIA DE CULTURA
 * Total: 20 serviços
 * - 15 serviços COM_DADOS (com formulário)
 * - 5 serviços SEM_DADOS (apenas documentos)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const cultureServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (15) ==========

  {
    name: 'Inscrição em Oficinas Culturais',
    description: 'Inscrição em oficinas de arte, música, teatro, dança e outras modalidades culturais',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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

  {
    name: 'Cadastro Ponto Cultura',
    description: 'Cadastro e reconhecimento de ponto de cultura comunitário',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_PONTO_CULTURA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'CNPJ (se aplicável)', 'Plano de Ação Cultural', 'Fotos do Espaço'],
    estimatedDays: 45,
    priority: 4,
    category: 'Cadastro',
    icon: 'Home',
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
        nomePonto: {
          type: 'string',
          title: 'Nome do Ponto de Cultura',
          maxLength: 200
        },
        tipoOrganizacao: {
          type: 'string',
          title: 'Tipo de Organização',
          enum: ['Associação', 'Coletivo', 'ONG', 'Cooperativa', 'Pessoa Física', 'Outro']
        },
        areaAtuacao: {
          type: 'string',
          title: 'Área de Atuação Cultural',
          maxLength: 300
        },
        publicoAtendido: {
          type: 'integer',
          title: 'Público Atendido (estimativa mensal)',
          minimum: 1
        },
        descricaoAtividades: {
          type: 'string',
          title: 'Descrição das Atividades Culturais',
          minLength: 50,
          maxLength: 2000,
          widget: 'textarea'
        }
      },
      required: ['nomePonto', 'tipoOrganizacao', 'areaAtuacao', 'publicoAtendido', 'descricaoAtividades']
    }
  },

  {
    name: 'Credenciamento Professor Arte',
    description: 'Credenciamento de professores de arte para oficinas municipais',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CREDENCIAMENTO_PROFESSOR_ARTE',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Currículo', 'Certificados', 'Portfólio'],
    estimatedDays: 20,
    priority: 4,
    category: 'Credenciamento',
    icon: 'GraduationCap',
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
        areaEnsino: {
          type: 'string',
          title: 'Área de Ensino',
          enum: ['Música', 'Teatro', 'Dança', 'Artes Visuais', 'Artesanato', 'Literatura', 'Fotografia', 'Audiovisual', 'Outra']
        },
        formacaoAcademica: {
          type: 'string',
          title: 'Formação Acadêmica',
          maxLength: 300
        },
        experienciaDocente: {
          type: 'integer',
          title: 'Experiência como Docente (anos)',
          minimum: 0
        },
        descricaoExperiencia: {
          type: 'string',
          title: 'Descrição da Experiência Profissional',
          maxLength: 1000,
          widget: 'textarea'
        }
      },
      required: ['areaEnsino', 'formacaoAcademica', 'experienciaDocente', 'descricaoExperiencia']
    }
  },

  {
    name: 'Locação Equipamento Cultural',
    description: 'Solicitação de locação de equipamentos culturais municipais',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'LOCACAO_EQUIPAMENTO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Projeto do Evento'],
    estimatedDays: 7,
    priority: 3,
    category: 'Locação',
    icon: 'Music',
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
        tipoEquipamento: {
          type: 'string',
          title: 'Tipo de Equipamento',
          enum: ['Som', 'Iluminação', 'Projetor', 'Tela', 'Palco', 'Instrumentos Musicais', 'Outro']
        },
        dataUso: {
          type: 'string',
          format: 'date',
          title: 'Data de Uso'
        },
        periodoUso: {
          type: 'string',
          title: 'Período de Uso',
          enum: ['Meio Período', 'Dia Inteiro', 'Fim de Semana', 'Outro']
        },
        finalidade: {
          type: 'string',
          title: 'Finalidade do Uso',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['tipoEquipamento', 'dataUso', 'periodoUso', 'finalidade']
    }
  },

  {
    name: 'Tombamento Patrimônio',
    description: 'Solicitação de tombamento de patrimônio histórico e cultural',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'TOMBAMENTO_PATRIMONIO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Documentação Histórica', 'Fotos', 'Laudo Técnico'],
    estimatedDays: 90,
    priority: 5,
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
        tipoBem: {
          type: 'string',
          title: 'Tipo de Bem',
          enum: ['Edificação', 'Conjunto Arquitetônico', 'Monumento', 'Sítio Arqueológico', 'Bem Móvel', 'Outro']
        },
        localizacao: {
          type: 'string',
          title: 'Localização do Bem',
          maxLength: 300
        },
        epocaAproximada: {
          type: 'string',
          title: 'Época Aproximada',
          maxLength: 100
        },
        relevanciaHistorica: {
          type: 'string',
          title: 'Relevância Histórica e Cultural',
          minLength: 100,
          maxLength: 2000,
          widget: 'textarea'
        },
        estadoConservacao: {
          type: 'string',
          title: 'Estado de Conservação',
          enum: ['Excelente', 'Bom', 'Regular', 'Ruim', 'Crítico']
        }
      },
      required: ['tipoBem', 'localizacao', 'relevanciaHistorica', 'estadoConservacao']
    }
  },

  {
    name: 'Inscrição Curso Formação Cultural',
    description: 'Inscrição em cursos de formação e capacitação cultural',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_CURSO_FORMACAO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Escolaridade'],
    estimatedDays: 10,
    priority: 3,
    category: 'Cursos',
    icon: 'BookOpen',
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
        nomeCurso: {
          type: 'string',
          title: 'Nome do Curso',
          maxLength: 200
        },
        areaCurso: {
          type: 'string',
          title: 'Área do Curso',
          enum: ['Gestão Cultural', 'Produção Cultural', 'Artes Cênicas', 'Música', 'Dança', 'Audiovisual', 'Patrimônio Cultural', 'Outra']
        },
        turno: {
          type: 'string',
          title: 'Turno Preferido',
          enum: ['Manhã', 'Tarde', 'Noite', 'Qualquer']
        },
        motivoInscricao: {
          type: 'string',
          title: 'Motivo da Inscrição',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['nomeCurso', 'areaCurso', 'turno']
    }
  },

  {
    name: 'Certidão Bem Tombado',
    description: 'Emissão de certidão de bem tombado',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CERTIDAO_BEM_TOMBADO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Endereço do Bem'],
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#f59e0b',
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
        enderecoBem: {
          type: 'string',
          title: 'Endereço do Bem Tombado',
          maxLength: 300
        },
        finalidade: {
          type: 'string',
          title: 'Finalidade da Certidão',
          enum: ['Compra e Venda', 'Reforma', 'Financiamento', 'Consulta', 'Outro']
        },
        observacoes: {
          type: 'string',
          title: 'Observações',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['enderecoBem', 'finalidade']
    }
  },

  // ========== SERVIÇOS SEM_DADOS (5) ==========

  {
    name: 'Certidão de Artista Local',
    description: 'Emissão de certidão comprovando registro como artista local (usa dados do perfil do cidadão)',
    departmentCode: 'CULTURA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 3,
    priority: 2,
    category: 'Documentos',
    icon: 'Copy',
    color: '#6b7280'
  },

  {
    name: 'Agenda Cultural Municipal',
    description: 'Consulta à agenda de eventos culturais do município (usa dados do perfil do cidadão)',
    departmentCode: 'CULTURA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#94a3b8'
  },

  {
    name: 'Catálogo de Patrimônio Cultural',
    description: 'Consulta ao catálogo de patrimônio histórico e cultural municipal (usa dados do perfil do cidadão)',
    departmentCode: 'CULTURA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Consultas',
    icon: 'BookOpen',
    color: '#6b7280'
  }
];
