/**
 * SEED DE SERVIÇOS - SECRETARIA DE ADMINISTRAÇÃO
 * Total: 20 serviços (8 SOLICITACAO_SIMPLES + 2 CAPTURA_COMPLETA + 10 CONSULTIVO)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const administrationServices: ServiceDefinition[] = [
  // ========== COM_DADOS - SOLICITACAO_SIMPLES (8) ==========

  {
    name: 'Protocolo Online de Documentos',
    description: 'Protocole documentos e petições online para órgãos municipais',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'PROTOCOLO_GERAL',
    requiresDocuments: true,
    requiredDocuments: ['Documento a ser protocolado', 'RG ou CPF'],
    estimatedDays: 1,
    priority: 5,
    category: 'Protocolos',
    icon: 'FileInput',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        destinoProtocolo: { type: 'string', title: 'Órgão/Secretaria de Destino', enum: ['Gabinete do Prefeito', 'Secretaria de Administração', 'Secretaria de Finanças', 'Secretaria de Saúde', 'Secretaria de Educação', 'Secretaria de Obras', 'Procuradoria Jurídica', 'Ouvidoria', 'Outro'] },
        tipoDocumento: { type: 'string', title: 'Tipo de Documento', enum: ['Requerimento', 'Petição', 'Recurso Administrativo', 'Solicitação de Informação', 'Denúncia', 'Reclamação', 'Outro'] },
        assunto: { type: 'string', title: 'Assunto', maxLength: 200 },
        descricao: { type: 'string', title: 'Descrição Detalhada', maxLength: 1000, widget: 'textarea' },
        urgente: { type: 'boolean', title: 'Protocolo Urgente' }
      },
      required: ['destinoProtocolo', 'tipoDocumento', 'assunto', 'descricao']
    }
  },

  {
    name: 'Solicitação ao SIC (Serviço de Informação ao Cidadão)',
    description: 'Solicite informações e documentos públicos com base na Lei de Acesso à Informação',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SIC',
    requiresDocuments: false,
    estimatedDays: 20,
    priority: 4,
    category: 'Transparência',
    icon: 'Info',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        tipoInformacao: { type: 'string', title: 'Tipo de Informação', enum: ['Dados Orçamentários', 'Contratos e Licitações', 'Processos Administrativos', 'Folha de Pagamento', 'Convênios', 'Dados Estatísticos', 'Legislação Municipal', 'Outro'] },
        informacaoSolicitada: { type: 'string', title: 'Informação Solicitada', maxLength: 1000, widget: 'textarea' },
        formaRecebimento: { type: 'string', title: 'Forma de Recebimento', enum: ['E-mail', 'Presencial', 'Correio'] },
        justificativa: { type: 'string', title: 'Justificativa (opcional)', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoInformacao', 'informacaoSolicitada', 'formaRecebimento']
    }
  },

  {
    name: 'Manifestação na Ouvidoria',
    description: 'Registre elogios, sugestões, reclamações ou denúncias sobre serviços municipais',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'OUVIDORIA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 4,
    category: 'Participação',
    icon: 'MessageSquare',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        tipoManifestacao: { type: 'string', title: 'Tipo de Manifestação', enum: ['Elogio', 'Sugestão', 'Reclamação', 'Solicitação', 'Denúncia'] },
        orgaoRelacionado: { type: 'string', title: 'Órgão/Secretaria Relacionado', enum: ['Gabinete do Prefeito', 'Secretaria de Administração', 'Secretaria de Finanças', 'Secretaria de Saúde', 'Secretaria de Educação', 'Secretaria de Obras', 'Secretaria de Meio Ambiente', 'Secretaria de Assistência Social', 'Outro'] },
        assunto: { type: 'string', title: 'Assunto', maxLength: 200 },
        descricao: { type: 'string', title: 'Descrição Detalhada', maxLength: 2000, widget: 'textarea' },
        manifestacaoAnonima: { type: 'boolean', title: 'Desejo fazer manifestação anônima' }
      },
      required: ['tipoManifestacao', 'orgaoRelacionado', 'assunto', 'descricao']
    }
  },

  {
    name: 'Denúncia de Irregularidade Administrativa',
    description: 'Denuncie irregularidades, má conduta ou desvios na administração pública municipal',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_ADMINISTRATIVA',
    requiresDocuments: false,
    estimatedDays: 30,
    priority: 5,
    category: 'Controle',
    icon: 'AlertTriangle',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        tipoIrregularidade: { type: 'string', title: 'Tipo de Irregularidade', enum: ['Desvio de Recursos Públicos', 'Nepotismo', 'Má Conduta de Servidor', 'Licitação Irregular', 'Abuso de Poder', 'Assédio Moral/Sexual', 'Conflito de Interesses', 'Outra'] },
        orgaoEnvolvido: { type: 'string', title: 'Órgão Envolvido', maxLength: 200 },
        descricaoFatos: { type: 'string', title: 'Descrição Detalhada dos Fatos', maxLength: 3000, widget: 'textarea' },
        dataOcorrencia: { type: 'string', title: 'Data da Ocorrência', format: 'date' },
        testemunhas: { type: 'string', title: 'Testemunhas (se houver)', maxLength: 500, widget: 'textarea' },
        denunciaAnonima: { type: 'boolean', title: 'Desejo fazer denúncia anônima' }
      },
      required: ['tipoIrregularidade', 'orgaoEnvolvido', 'descricaoFatos']
    }
  },

  {
    name: 'Solicitação de Declaração/Atestado',
    description: 'Solicite declarações ou atestados diversos emitidos pela administração municipal',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DECLARACOES',
    requiresDocuments: true,
    requiredDocuments: ['RG e CPF', 'Comprovante de Residência (se aplicável)'],
    estimatedDays: 10,
    priority: 3,
    category: 'Documentos',
    icon: 'FileText',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone'],
      properties: {
        tipoDocumento: { type: 'string', title: 'Tipo de Documento', enum: ['Declaração de Residência', 'Declaração de Hipossuficiência', 'Atestado de Antecedentes', 'Declaração de Nada Consta', 'Outro'] },
        finalidade: { type: 'string', title: 'Finalidade', maxLength: 300 },
        informacoesComplementares: { type: 'string', title: 'Informações Complementares', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoDocumento', 'finalidade']
    }
  },

  {
    name: 'Solicitação de Cópia de Processo Administrativo',
    description: 'Solicite cópia de processos administrativos em que seja parte ou interessado',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'COPIA_PROCESSOS',
    requiresDocuments: true,
    requiredDocuments: ['RG e CPF', 'Procuração (se representante legal)'],
    estimatedDays: 15,
    priority: 3,
    category: 'Processos',
    icon: 'Copy',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        numeroProcesso: { type: 'string', title: 'Número do Processo', maxLength: 30 },
        anoProcesso: { type: 'integer', title: 'Ano do Processo', minimum: 1990, maximum: 2030 },
        assunto: { type: 'string', title: 'Assunto do Processo', maxLength: 200 },
        tipoSolicitacao: { type: 'string', title: 'Tipo de Solicitação', enum: ['Cópia Integral', 'Cópia Parcial (especificar folhas)', 'Vista aos Autos'] },
        folhasEspecificas: { type: 'string', title: 'Folhas Específicas (se aplicável)', maxLength: 100 },
        justificativa: { type: 'string', title: 'Justificativa', maxLength: 500, widget: 'textarea' }
      },
      required: ['numeroProcesso', 'anoProcesso', 'tipoSolicitacao', 'justificativa']
    }
  },

  {
    name: 'Agendamento de Serviços Gerais',
    description: 'Agende atendimento presencial para serviços administrativos diversos',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'AGENDAMENTO_GERAL',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Agendamentos',
    icon: 'Calendar',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        tipoServico: { type: 'string', title: 'Tipo de Serviço', enum: ['Atendimento Protocolo', 'Consulta Processo', 'Atendimento Jurídico', 'Atendimento Recursos Humanos', 'Atendimento Contabilidade', 'Outro'] },
        orgaoDestino: { type: 'string', title: 'Órgão/Secretaria', maxLength: 200 },
        dataPreferencial: { type: 'string', title: 'Data Preferencial', format: 'date' },
        periodoPreferencial: { type: 'string', title: 'Período Preferencial', enum: ['Manhã (8h-12h)', 'Tarde (13h-17h)', 'Qualquer Horário'] },
        assunto: { type: 'string', title: 'Assunto', maxLength: 300, widget: 'textarea' }
      },
      required: ['tipoServico', 'orgaoDestino', 'dataPreferencial', 'periodoPreferencial', 'assunto']
    }
  },

  {
    name: 'Solicitação de Uso de Espaço Público',
    description: 'Solicite autorização para uso temporário de espaços públicos municipais',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'USO_ESPACO_PUBLICO',
    requiresDocuments: true,
    requiredDocuments: ['RG e CPF do Responsável', 'Projeto do Evento (se aplicável)', 'Comprovante de Endereço'],
    estimatedDays: 20,
    priority: 3,
    category: 'Autorizações',
    icon: 'MapPin',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone'],
      properties: {
        tipoEvento: { type: 'string', title: 'Tipo de Evento', enum: ['Evento Cultural', 'Evento Esportivo', 'Evento Religioso', 'Feira/Comércio', 'Manifestação', 'Filmagem', 'Outro'] },
        localSolicitado: { type: 'string', title: 'Local Solicitado', maxLength: 200 },
        dataEvento: { type: 'string', title: 'Data do Evento', format: 'date' },
        horaInicio: { type: 'string', title: 'Hora de Início', format: 'time' },
        horaTermino: { type: 'string', title: 'Hora de Término', format: 'time' },
        publicoEstimado: { type: 'integer', title: 'Público Estimado', minimum: 1 },
        descricaoEvento: { type: 'string', title: 'Descrição do Evento', maxLength: 1000, widget: 'textarea' },
        infraestruturaDesejada: { type: 'string', title: 'Infraestrutura Necessária (palco, som, etc)', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoEvento', 'localSolicitado', 'dataEvento', 'horaInicio', 'horaTermino', 'publicoEstimado', 'descricaoEvento']
    }
  },

  // ========== COM_DADOS - CAPTURA_COMPLETA (2) ==========

  {
    name: 'Agendamento de Atendimento Presencial Especializado',
    description: 'Agende atendimento presencial especializado em diversos órgãos municipais',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AGENDAMENTO_ESPECIALIZADO',
    requiresDocuments: true,
    requiredDocuments: ['RG e CPF', 'Documentos relacionados ao assunto do agendamento'],
    estimatedDays: 10,
    priority: 4,
    category: 'Agendamentos',
    icon: 'CalendarCheck',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        tipoAtendimento: { type: 'string', title: 'Tipo de Atendimento', enum: ['Jurídico (Procuradoria)', 'Recursos Humanos', 'Contabilidade/Finanças', 'Licitações e Contratos', 'Controladoria', 'Planejamento', 'Outro'] },
        orgaoDestino: { type: 'string', title: 'Órgão/Departamento', maxLength: 200 },
        assunto: { type: 'string', title: 'Assunto do Atendimento', maxLength: 300 },
        descricaoDetalhada: { type: 'string', title: 'Descrição Detalhada', maxLength: 1000, widget: 'textarea' },
        dataPreferencial: { type: 'string', title: 'Data Preferencial', format: 'date' },
        periodoPreferencial: { type: 'string', title: 'Período Preferencial', enum: ['Manhã (8h-12h)', 'Tarde (13h-17h)', 'Qualquer Horário'] },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais de Acessibilidade', maxLength: 300, widget: 'textarea' }
      },
      required: ['tipoAtendimento', 'orgaoDestino', 'assunto', 'descricaoDetalhada', 'dataPreferencial', 'periodoPreferencial']
    }
  },

  {
    name: 'Inscrição em Concurso Público Municipal',
    description: 'Realize inscrição em concursos públicos municipais',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'INSCRICAO_CONCURSO',
    requiresDocuments: true,
    requiredDocuments: ['RG e CPF', 'Comprovante de Escolaridade', 'Foto 3x4', 'Comprovante de Residência', 'Certificados (se aplicável)'],
    estimatedDays: 15,
    priority: 5,
    category: 'RH',
    icon: 'UserCheck',
    color: '#3b82f6',
    // Permite múltiplos: cidadão pode se inscrever em vários concursos
    allowMultipleActiveProtocols: true,
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation'],
      properties: {
        numeroConcurso: { type: 'string', title: 'Número do Concurso/Edital', maxLength: 30 },
        cargo: { type: 'string', title: 'Cargo Pretendido', maxLength: 200 },
        escolaridade: { type: 'string', title: 'Escolaridade', enum: ['Ensino Fundamental', 'Ensino Médio', 'Ensino Técnico', 'Ensino Superior', 'Pós-Graduação', 'Mestrado', 'Doutorado'] },
        formacoaoSuperior: { type: 'string', title: 'Formação Superior (se aplicável)', maxLength: 200 },
        necessidadesEspeciais: { type: 'boolean', title: 'Possui Necessidades Especiais' },
        tipoDeficiencia: { type: 'string', title: 'Tipo de Deficiência (se aplicável)', maxLength: 200 },
        necessitaAcompanhante: { type: 'boolean', title: 'Necessita de Acompanhante' },
        condicaoEspecialProva: { type: 'string', title: 'Condição Especial para Prova', maxLength: 300, widget: 'textarea' },
        experienciaProfissional: { type: 'string', title: 'Resumo da Experiência Profissional', maxLength: 1000, widget: 'textarea' }
      },
      required: ['numeroConcurso', 'cargo', 'escolaridade']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (10) ==========

  {
    name: 'Consulta de Processo Administrativo',
    description: 'Consulte o andamento de processos administrativos',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 3,
    category: 'Consultas',
    icon: 'Search',
    color: '#6366f1'
  },

  {
    name: 'Consulta de Protocolo',
    description: 'Consulte o status de protocolos realizados',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 3,
    category: 'Consultas',
    icon: 'FileSearch',
    color: '#6366f1'
  },

  {
    name: 'Consulta de Solicitações ao SIC',
    description: 'Consulte suas solicitações ao Serviço de Informação ao Cidadão',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Info',
    color: '#06b6d4'
  },

  {
    name: 'Consulta de Manifestações na Ouvidoria',
    description: 'Consulte o status de suas manifestações registradas na ouvidoria',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'MessageSquare',
    color: '#8b5cf6'
  },

  {
    name: 'Certidão de Nada Consta',
    description: 'Emita certidão negativa de processos administrativos',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 3,
    category: 'Certidões',
    icon: 'FileCheck',
    color: '#10b981'
  },

  {
    name: 'Certidão de Tempo de Serviço',
    description: 'Emita certidão de tempo de serviço público municipal (para servidores)',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'Clock',
    color: '#10b981'
  },

  {
    name: 'Consulta de Licitações e Contratos',
    description: 'Consulte informações sobre licitações e contratos municipais',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'FileSignature',
    color: '#f59e0b'
  },

  {
    name: 'Consulta ao Diário Oficial Municipal',
    description: 'Consulte publicações do Diário Oficial do Município',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'BookOpen',
    color: '#64748b'
  },

  {
    name: 'Consulta de Legislação Municipal',
    description: 'Consulte leis, decretos e portarias municipais',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Consultas',
    icon: 'Scale',
    color: '#64748b'
  },

  {
    name: 'Consulta de Concursos Públicos',
    description: 'Consulte editais e resultados de concursos públicos municipais',
    departmentCode: 'ADMINISTRACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Users',
    color: '#3b82f6'
  }
];
