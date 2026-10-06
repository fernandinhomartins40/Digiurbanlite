/**
 * SEED DE SERVIÇOS - SECRETARIA DE ESPORTES
 * Total: 20 serviços (16 COM_DADOS + 4 SEM_DADOS)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const sportsServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (16) ==========

  {
    name: 'Reserva de Espaço Esportivo',
    description: 'Reserva de quadras, campos e espaços esportivos municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'RESERVA_ESPACO_ESPORTIVO',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 3,
    category: 'Reservas',
    icon: 'CalendarCheck',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoEspaco: { type: 'string', title: 'Tipo de Espaço', enum: ['Quadra de Futebol', 'Quadra Poliesportiva', 'Campo de Futebol', 'Ginásio', 'Pista de Atletismo', 'Outro'] },
        dataReserva: { type: 'string', format: 'date', title: 'Data da Reserva' },
        horarioInicio: { type: 'string', title: 'Horário de Início', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        horarioFim: { type: 'string', title: 'Horário de Término', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        finalidade: { type: 'string', title: 'Finalidade', maxLength: 300 }
      },
      required: ['tipoEspaco', 'dataReserva', 'horarioInicio', 'horarioFim', 'finalidade']
    }
  },

  {
    name: 'Inscrição em Competição',
    description: 'Inscrição em competições e torneios municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_COMPETICAO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico', 'Foto 3x4'],
    estimatedDays: 10,
    priority: 4,
    category: 'Competições',
    icon: 'Medal',
    color: '#eab308',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeCompeticao: { type: 'string', title: 'Nome da Competição', maxLength: 200 },
        modalidade: { type: 'string', title: 'Modalidade', maxLength: 100 },
        categoria: { type: 'string', title: 'Categoria', enum: ['Infantil', 'Juvenil', 'Adulto', 'Master', 'Livre'] },
        tipoParticipacao: { type: 'string', title: 'Tipo de Participação', enum: ['Individual', 'Equipe'] },
        nomeEquipe: { type: 'string', title: 'Nome da Equipe (se aplicável)', maxLength: 200 }
      },
      required: ['nomeCompeticao', 'modalidade', 'categoria', 'tipoParticipacao']
    }
  },

  {
    name: 'Cadastro de Atleta Municipal',
    description: 'Cadastro oficial de atletas do município',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_ATLETA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico', 'Foto 3x4', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 4,
    category: 'Cadastros',
    icon: 'User',
    color: '#3b82f6',
    // Validação de unicidade: um atleta só pode ter um cadastro oficial ativo
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'CADASTRO_ATLETA',
      validationFunction: 'validateCadastroAtleta'
    },
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        modalidadePrincipal: { type: 'string', title: 'Modalidade Principal', maxLength: 100 },
        nivelCompetitivo: { type: 'string', title: 'Nível Competitivo', enum: ['Iniciante', 'Amador', 'Profissional'] },
        equipesAtuais: { type: 'string', title: 'Equipes/Clubes Atuais', maxLength: 300 },
        conquistas: { type: 'string', title: 'Principais Conquistas', maxLength: 500, widget: 'textarea' }
      },
      required: ['modalidadePrincipal', 'nivelCompetitivo']
    }
  },

  {
    name: 'Inscrição Escolinha Futebol',
    description: 'Inscrição em escolinha de futebol municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_ESCOLINHA_FUTEBOL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico'],
    estimatedDays: 7,
    priority: 4,
    category: 'Inscrições',
    icon: 'CircleDot',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        categoria: { type: 'string', title: 'Categoria', enum: ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17'] },
        turno: { type: 'string', title: 'Turno de Preferência', enum: ['Manhã', 'Tarde'] },
        posicaoPreferida: { type: 'string', title: 'Posição Preferida', enum: ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-Campo', 'Atacante', 'Qualquer'] }
      },
      required: ['categoria', 'turno']
    }
  },

  {
    name: 'Inscrição Escolinha Basquete',
    description: 'Inscrição em escolinha de basquete municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_ESCOLINHA_BASQUETE',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico'],
    estimatedDays: 7,
    priority: 4,
    category: 'Inscrições',
    icon: 'CircleDot',
    color: '#ea580c',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        categoria: { type: 'string', title: 'Categoria', enum: ['Infantil', 'Juvenil', 'Adulto'] },
        turno: { type: 'string', title: 'Turno de Preferência', enum: ['Manhã', 'Tarde', 'Noite'] }
      },
      required: ['categoria', 'turno']
    }
  },

  {
    name: 'Inscrição Escolinha Vôlei',
    description: 'Inscrição em escolinha de vôlei municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_ESCOLINHA_VOLEI',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico'],
    estimatedDays: 7,
    priority: 4,
    category: 'Inscrições',
    icon: 'CircleDot',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        categoria: { type: 'string', title: 'Categoria', enum: ['Infantil', 'Juvenil', 'Adulto'] },
        turno: { type: 'string', title: 'Turno de Preferência', enum: ['Manhã', 'Tarde', 'Noite'] }
      },
      required: ['categoria', 'turno']
    }
  },

  {
    name: 'Inscrição Escolinha Natação',
    description: 'Inscrição em escolinha de natação municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_ESCOLINHA_NATACAO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico'],
    estimatedDays: 7,
    priority: 4,
    category: 'Inscrições',
    icon: 'Droplet',
    color: '#0ea5e9',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nivel: { type: 'string', title: 'Nível', enum: ['Iniciante', 'Intermediário', 'Avançado'] },
        turno: { type: 'string', title: 'Turno de Preferência', enum: ['Manhã', 'Tarde'] }
      },
      required: ['nivel', 'turno']
    }
  },

  {
    name: 'Inscrição Escolinha Judô',
    description: 'Inscrição em escolinha de judô municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_ESCOLINHA_JUDO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico'],
    estimatedDays: 7,
    priority: 4,
    category: 'Inscrições',
    icon: 'User',
    color: '#6366f1',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        categoria: { type: 'string', title: 'Categoria', enum: ['Infantil', 'Juvenil', 'Adulto'] },
        turno: { type: 'string', title: 'Turno de Preferência', enum: ['Manhã', 'Tarde', 'Noite'] }
      },
      required: ['categoria', 'turno']
    }
  },

  {
    name: 'Inscrição Escolinha Capoeira',
    description: 'Inscrição em escolinha de capoeira municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_ESCOLINHA_CAPOEIRA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico'],
    estimatedDays: 7,
    priority: 4,
    category: 'Inscrições',
    icon: 'Music',
    color: '#eab308',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        categoria: { type: 'string', title: 'Categoria', enum: ['Infantil', 'Juvenil', 'Adulto'] },
        turno: { type: 'string', title: 'Turno de Preferência', enum: ['Manhã', 'Tarde', 'Noite'] }
      },
      required: ['categoria', 'turno']
    }
  },

  {
    name: 'Inscrição Escolinha Ginástica',
    description: 'Inscrição em escolinha de ginástica municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_ESCOLINHA_GINASTICA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico'],
    estimatedDays: 7,
    priority: 4,
    category: 'Inscrições',
    icon: 'User',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoGinastica: { type: 'string', title: 'Tipo de Ginástica', enum: ['Artística', 'Rítmica', 'Aeróbica', 'Localizada'] },
        turno: { type: 'string', title: 'Turno de Preferência', enum: ['Manhã', 'Tarde', 'Noite'] }
      },
      required: ['tipoGinastica', 'turno']
    }
  },

  {
    name: 'Inscrição Corrida de Rua',
    description: 'Inscrição em eventos de corrida de rua municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_CORRIDA_RUA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico'],
    estimatedDays: 5,
    priority: 3,
    category: 'Eventos',
    icon: 'Footprints',
    color: '#14b8a6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeCorrida: { type: 'string', title: 'Nome da Corrida', maxLength: 200 },
        distancia: { type: 'string', title: 'Distância', enum: ['5km', '10km', 'Meia Maratona', 'Maratona'] },
        categoriaSexo: { type: 'string', title: 'Categoria por Sexo', enum: ['Masculino', 'Feminino'] }
      },
      required: ['nomeCorrida', 'distancia', 'categoriaSexo']
    }
  },

  {
    name: 'Empréstimo Material Esportivo',
    description: 'Solicitação de empréstimo de material esportivo municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'EMPRESTIMO_MATERIAL_ESPORTIVO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG'],
    estimatedDays: 5,
    priority: 3,
    category: 'Empréstimo',
    icon: 'Package',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoMaterial: { type: 'string', title: 'Tipo de Material', enum: ['Bolas', 'Redes', 'Cones', 'Coletes', 'Arcos', 'Cordas', 'Outro'] },
        quantidade: { type: 'integer', title: 'Quantidade', minimum: 1 },
        dataRetirada: { type: 'string', format: 'date', title: 'Data de Retirada' },
        dataDevolucao: { type: 'string', format: 'date', title: 'Data de Devolução' },
        finalidade: { type: 'string', title: 'Finalidade', maxLength: 300 }
      },
      required: ['tipoMaterial', 'quantidade', 'dataRetirada', 'dataDevolucao', 'finalidade']
    }
  },

  {
    name: 'Credenciamento Instrutor',
    description: 'Credenciamento de instrutores esportivos',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CREDENCIAMENTO_INSTRUTOR',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'CREF', 'Currículo', 'Certificados'],
    estimatedDays: 20,
    priority: 4,
    category: 'Credenciamento',
    icon: 'GraduationCap',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        modalidade: { type: 'string', title: 'Modalidade', maxLength: 200 },
        numeroCREF: { type: 'string', title: 'Número do CREF', maxLength: 50 },
        experiencia: { type: 'integer', title: 'Experiência (anos)', minimum: 0 },
        formacaoAcademica: { type: 'string', title: 'Formação Acadêmica', maxLength: 300 }
      },
      required: ['modalidade', 'numeroCREF', 'experiencia', 'formacaoAcademica']
    }
  },

  {
    name: 'Uso Ginásio',
    description: 'Solicitação de uso de ginásio municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'USO_GINASIO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Projeto do Evento'],
    estimatedDays: 10,
    priority: 3,
    category: 'Reservas',
    icon: 'Building',
    color: '#f97316',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeEvento: { type: 'string', title: 'Nome do Evento', maxLength: 200 },
        dataEvento: { type: 'string', format: 'date', title: 'Data do Evento' },
        horarioInicio: { type: 'string', title: 'Horário de Início', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        horarioFim: { type: 'string', title: 'Horário de Término', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        publicoEstimado: { type: 'integer', title: 'Público Estimado', minimum: 1 }
      },
      required: ['nomeEvento', 'dataEvento', 'horarioInicio', 'horarioFim', 'publicoEstimado']
    }
  },

  {
    name: 'Campeonato Municipal',
    description: 'Inscrição em campeonatos municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CAMPEONATO_MUNICIPAL',
    requiresDocuments: true,
    requiredDocuments: ['Lista de Atletas', 'Documentos dos Atletas'],
    estimatedDays: 15,
    priority: 4,
    category: 'Competições',
    icon: 'Trophy',
    color: '#eab308',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeCampeonato: { type: 'string', title: 'Nome do Campeonato', maxLength: 200 },
        modalidade: { type: 'string', title: 'Modalidade', maxLength: 100 },
        nomeEquipe: { type: 'string', title: 'Nome da Equipe', maxLength: 200 },
        categoria: { type: 'string', title: 'Categoria', enum: ['Infantil', 'Juvenil', 'Adulto', 'Master', 'Livre'] },
        numeroAtletas: { type: 'integer', title: 'Número de Atletas', minimum: 1 }
      },
      required: ['nomeCampeonato', 'modalidade', 'nomeEquipe', 'categoria', 'numeroAtletas']
    }
  },

  {
    name: 'Bolsa Atleta',
    description: 'Solicitação de bolsa atleta municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'BOLSA_ATLETA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'Histórico Esportivo', 'Cartas de Recomendação'],
    estimatedDays: 30,
    priority: 5,
    category: 'Benefícios',
    icon: 'Award',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        modalidade: { type: 'string', title: 'Modalidade Esportiva', maxLength: 100 },
        categoria: { type: 'string', title: 'Categoria', enum: ['Estudantil', 'Nacional', 'Internacional', 'Paralímpico'] },
        conquistasRecentes: { type: 'string', title: 'Conquistas Recentes', maxLength: 1000, widget: 'textarea' },
        justificativa: { type: 'string', title: 'Justificativa', maxLength: 1000, widget: 'textarea' }
      },
      required: ['modalidade', 'categoria', 'conquistasRecentes', 'justificativa']
    }
  },

  // ========== SERVIÇOS SEM_DADOS (4) ==========

  {
    name: 'Certidão de Atleta Municipal',
    description: 'Emissão de certidão comprovando cadastro como atleta municipal (usa dados do perfil do cidadão)',
    departmentCode: 'ESPORTES',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.EMISSAO_AUTOMATICA,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#f97316'
  },

  {
    name: 'Declaração de Participação em Competição',
    description: 'Emissão de declaração de participação em evento esportivo (usa dados do perfil do cidadão)',
    departmentCode: 'ESPORTES',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.EMISSAO_ASSISTIDA,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 3,
    priority: 2,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#10b981'
  },

  {
    name: 'Calendário Esportivo',
    description: 'Consulta ao calendário de eventos esportivos municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTA_PUBLICA,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#94a3b8'
  },

  {
    name: 'Ranking de Atletas Municipal',
    description: 'Consulta ao ranking oficial de atletas do município (usa dados do perfil do cidadão)',
    departmentCode: 'ESPORTES',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Consultas',
    icon: 'Award',
    color: '#6b7280'
  }
];
