/**
 * SEED DE SERVIÇOS - SECRETARIA DE TURISMO
 * Total: 15 serviços (9 COM_DADOS + 6 SEM_DADOS)
 * ✅ Expandido e atualizado
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const tourismServices: ServiceDefinition[] = [
  // ========== COM_DADOS - CAPTURA_COMPLETA (9) ==========

  {
    name: 'Cadastro de Estabelecimento Turístico',
    description: 'Cadastro de hotéis, pousadas, restaurantes e outros estabelecimentos turísticos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Alvará de Funcionamento', 'Contrato Social'],
    estimatedDays: 15,
    priority: 4,
    category: 'Cadastros',
    icon: 'Building',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoEstabelecimento: { type: 'string', title: 'Tipo de Estabelecimento', enum: ['Hotel', 'Pousada', 'Hostel', 'Restaurante', 'Agência de Turismo', 'Atração Turística', 'Outro'] },
        nomeEstabelecimento: { type: 'string', title: 'Nome do Estabelecimento', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$', maxLength: 18 },
        enderecoEstabelecimento: { type: 'string', title: 'Endereço Completo', maxLength: 300 },
        capacidade: { type: 'integer', title: 'Capacidade de Atendimento', minimum: 1 },
        descricaoServicos: { type: 'string', title: 'Descrição dos Serviços', maxLength: 1000, widget: 'textarea' }
      },
      required: ['tipoEstabelecimento', 'nomeEstabelecimento', 'cnpj', 'enderecoEstabelecimento', 'descricaoServicos']
    }
  },

  {
    name: 'Cadastro de Guia Turístico',
    description: 'Cadastro oficial de guias turísticos do município',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_GUIA_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Certificado de Guia Turístico', 'Foto 3x4'],
    estimatedDays: 10,
    priority: 4,
    category: 'Cadastros',
    icon: 'UserCheck',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        numeroCadtur: { type: 'string', title: 'Número CADASTUR (se possuir)', maxLength: 50 },
        idiomas: { type: 'string', title: 'Idiomas que Domina', maxLength: 200 },
        especialidades: { type: 'string', title: 'Especialidades (tipos de turismo)', maxLength: 300 },
        experiencia: { type: 'string', title: 'Experiência Profissional', maxLength: 500, widget: 'textarea' }
      },
      required: ['idiomas', 'especialidades']
    }
  },

  {
    name: 'Registro de Evento Turístico',
    description: 'Registro de eventos, festas e atrações turísticas do município',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'REGISTRO_EVENTO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Projeto do Evento', 'Autorizações Necessárias'],
    estimatedDays: 20,
    priority: 4,
    category: 'Eventos',
    icon: 'PartyPopper',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeEvento: { type: 'string', title: 'Nome do Evento', maxLength: 200 },
        tipoEvento: { type: 'string', title: 'Tipo de Evento', enum: ['Festa Popular', 'Festival Cultural', 'Evento Gastronômico', 'Evento Esportivo', 'Exposição', 'Outro'] },
        dataEvento: { type: 'string', format: 'date', title: 'Data do Evento' },
        localEvento: { type: 'string', title: 'Local do Evento', maxLength: 300 },
        publicoEstimado: { type: 'integer', title: 'Público Estimado', minimum: 1 },
        descricaoEvento: { type: 'string', title: 'Descrição do Evento', maxLength: 1000, widget: 'textarea' }
      },
      required: ['nomeEvento', 'tipoEvento', 'dataEvento', 'localEvento', 'descricaoEvento']
    }
  },

  // 🆕 NOVOS SERVIÇOS COM_DADOS (6)

  {
    name: 'Licença para Atividade Turística',
    description: 'Solicitação de licença para exercer atividade turística no município',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'LICENCA_ATIVIDADE_TURISTICA',
    requiresDocuments: true,
    requiredDocuments: ['CPF ou CNPJ', 'RG', 'Contrato Social (se empresa)', 'Projeto da Atividade'],
    estimatedDays: 20,
    priority: 4,
    category: 'Licenças',
    icon: 'BadgeCheck',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone', 'citizen_address', 'citizen_addressnumber', 'citizen_neighborhood'],
      properties: {
        tipoAtividade: { type: 'string', title: 'Tipo de Atividade Turística', enum: ['Passeios Guiados', 'Turismo de Aventura', 'Ecoturismo', 'Turismo Rural', 'Turismo Náutico', 'Outro'] },
        nomeAtividade: { type: 'string', title: 'Nome da Atividade/Empresa', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ (se aplicável)', maxLength: 18 },
        localOperacao: { type: 'string', title: 'Local de Operação', maxLength: 300 },
        capacidadeAtendimento: { type: 'integer', title: 'Capacidade de Atendimento Simultâneo', minimum: 1 },
        equipamentosUtilizados: { type: 'string', title: 'Equipamentos Utilizados', maxLength: 500, widget: 'textarea' },
        medidasSeguranca: { type: 'string', title: 'Medidas de Segurança Adotadas', maxLength: 500, widget: 'textarea' },
        descricaoDetalhada: { type: 'string', title: 'Descrição Detalhada da Atividade', maxLength: 1000, widget: 'textarea' }
      },
      required: ['tipoAtividade', 'nomeAtividade', 'localOperacao', 'capacidadeAtendimento', 'descricaoDetalhada']
    }
  },

  {
    name: 'Credenciamento de Agência de Turismo',
    description: 'Credenciamento oficial de agência de viagens e turismo',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CREDENCIAMENTO_AGENCIA_TURISMO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Contrato Social', 'Cadastur', 'Alvará de Funcionamento', 'Seguro de Responsabilidade Civil'],
    estimatedDays: 25,
    priority: 5,
    category: 'Credenciamento',
    icon: 'Plane',
    color: '#0ea5e9',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        razaoSocial: { type: 'string', title: 'Razão Social', maxLength: 200 },
        nomeFantasia: { type: 'string', title: 'Nome Fantasia', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$', maxLength: 18 },
        numeroCadtur: { type: 'string', title: 'Número CADASTUR', maxLength: 50 },
        enderecoAgencia: { type: 'string', title: 'Endereço da Agência', maxLength: 300 },
        tipoServicos: { type: 'array', title: 'Serviços Oferecidos', items: { type: 'string', enum: ['Venda de Passagens', 'Reserva de Hospedagem', 'Pacotes Turísticos', 'Receptivo', 'Turismo Corporativo', 'Outro'] } },
        numeroFuncionarios: { type: 'integer', title: 'Número de Funcionários', minimum: 1 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['razaoSocial', 'nomeFantasia', 'cnpj', 'numeroCadtur', 'enderecoAgencia', 'tipoServicos']
    }
  },

  {
    name: 'Autorização para Transporte Turístico',
    description: 'Autorização para operação de transporte turístico municipal',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AUTORIZACAO_TRANSPORTE_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'CNH Categoria D ou E', 'Documentos dos Veículos', 'Seguro dos Veículos'],
    estimatedDays: 30,
    priority: 5,
    category: 'Autorizações',
    icon: 'Bus',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone'],
      properties: {
        nomeEmpresa: { type: 'string', title: 'Nome da Empresa', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$', maxLength: 18 },
        tipoTransporte: { type: 'string', title: 'Tipo de Transporte', enum: ['Ônibus Turístico', 'Van', 'Micro-ônibus', 'Outro'] },
        quantidadeVeiculos: { type: 'integer', title: 'Quantidade de Veículos', minimum: 1 },
        capacidadeTotal: { type: 'integer', title: 'Capacidade Total de Passageiros', minimum: 1 },
        roteirosAtendidos: { type: 'string', title: 'Roteiros Turísticos Atendidos', maxLength: 500, widget: 'textarea' },
        numeroMotoristas: { type: 'integer', title: 'Número de Motoristas Habilitados', minimum: 1 }
      },
      required: ['nomeEmpresa', 'cnpj', 'tipoTransporte', 'quantidadeVeiculos', 'capacidadeTotal', 'numeroMotoristas']
    }
  },

  {
    name: 'Cadastro de Atração Turística',
    description: 'Cadastro de pontos turísticos, monumentos e atrações culturais',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_ATRACAO_TURISTICA',
    requiresDocuments: true,
    requiredDocuments: ['CPF ou CNPJ', 'Fotos do Local', 'Autorização de Funcionamento'],
    estimatedDays: 15,
    priority: 3,
    category: 'Cadastros',
    icon: 'MapPin',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        nomeAtracao: { type: 'string', title: 'Nome da Atração', maxLength: 200 },
        tipoAtracao: { type: 'string', title: 'Tipo de Atração', enum: ['Monumento Histórico', 'Museu', 'Parque', 'Praia', 'Cachoeira', 'Mirante', 'Igreja/Templo', 'Outro'] },
        enderecoAtracao: { type: 'string', title: 'Endereço/Localização', maxLength: 300 },
        horarioFuncionamento: { type: 'string', title: 'Horário de Funcionamento', maxLength: 200 },
        valorIngresso: { type: 'string', title: 'Valor do Ingresso (se houver)', maxLength: 100 },
        infraestruturaDisponivel: { type: 'array', title: 'Infraestrutura Disponível', items: { type: 'string', enum: ['Estacionamento', 'Banheiros', 'Alimentação', 'Acessibilidade', 'Guia Local', 'Loja de Souvenirs', 'Outro'] } },
        descricaoCompleta: { type: 'string', title: 'Descrição Completa da Atração', maxLength: 1500, widget: 'textarea' }
      },
      required: ['nomeAtracao', 'tipoAtracao', 'enderecoAtracao', 'descricaoCompleta']
    }
  },

  {
    name: 'Solicitação de Apoio a Feira/Exposição',
    description: 'Solicitação de apoio municipal para realização de feiras e exposições turísticas',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'APOIO_FEIRA_EXPOSICAO',
    requiresDocuments: true,
    requiredDocuments: ['CPF ou CNPJ', 'Projeto do Evento', 'Cronograma'],
    estimatedDays: 30,
    priority: 4,
    category: 'Apoio',
    icon: 'Store',
    color: '#a855f7',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        nomeFeira: { type: 'string', title: 'Nome da Feira/Exposição', maxLength: 200 },
        tipoFeira: { type: 'string', title: 'Tipo', enum: ['Feira de Artesanato', 'Exposição Cultural', 'Feira Gastronômica', 'Feira de Negócios', 'Outro'] },
        dataInicio: { type: 'string', format: 'date', title: 'Data de Início' },
        dataFim: { type: 'string', format: 'date', title: 'Data de Término' },
        localPretendido: { type: 'string', title: 'Local Pretendido', maxLength: 300 },
        numeroExpositores: { type: 'integer', title: 'Número Estimado de Expositores', minimum: 1 },
        publicoEsperado: { type: 'integer', title: 'Público Esperado', minimum: 1 },
        tipoApoioSolicitado: { type: 'array', title: 'Tipo de Apoio Solicitado', items: { type: 'string', enum: ['Divulgação', 'Espaço Público', 'Infraestrutura', 'Apoio Logístico', 'Isenção de Taxas', 'Outro'] } },
        descricaoEvento: { type: 'string', title: 'Descrição do Evento', maxLength: 1000, widget: 'textarea' }
      },
      required: ['nomeFeira', 'tipoFeira', 'dataInicio', 'dataFim', 'localPretendido', 'numeroExpositores', 'tipoApoioSolicitado', 'descricaoEvento']
    }
  },

  {
    name: 'Inscrição em Circuito Turístico Regional',
    description: 'Inscrição de estabelecimento ou atividade em circuito turístico oficial',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_CIRCUITO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ ou CPF', 'Alvará de Funcionamento', 'Cadastur (se aplicável)'],
    estimatedDays: 20,
    priority: 3,
    category: 'Inscrições',
    icon: 'Route',
    color: '#14b8a6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        nomeEstabelecimento: { type: 'string', title: 'Nome do Estabelecimento/Atividade', maxLength: 200 },
        tipoEstabelecimento: { type: 'string', title: 'Tipo', enum: ['Hotel/Pousada', 'Restaurante', 'Agência', 'Atração Turística', 'Artesanato', 'Outro'] },
        circuitoPretendido: { type: 'string', title: 'Circuito Turístico Pretendido', enum: ['Circuito Histórico-Cultural', 'Circuito Natural/Ecológico', 'Circuito Gastronômico', 'Circuito Religioso', 'Circuito Rural', 'Outro'] },
        enderecoEstabelecimento: { type: 'string', title: 'Endereço', maxLength: 300 },
        horarioFuncionamento: { type: 'string', title: 'Horário de Funcionamento', maxLength: 200 },
        infraestruturaOferecida: { type: 'string', title: 'Infraestrutura Oferecida', maxLength: 500, widget: 'textarea' },
        motivoInscricao: { type: 'string', title: 'Motivo da Inscrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeEstabelecimento', 'tipoEstabelecimento', 'circuitoPretendido', 'enderecoEstabelecimento', 'motivoInscricao']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (6) ==========

  {
    name: 'Guia Turístico da Cidade',
    description: 'Consulta ao guia turístico oficial do município',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Map',
    color: '#94a3b8'
  },

  {
    name: 'Certidão de Cadastro Turístico',
    description: 'Emissão de certidão de cadastro turístico',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 7,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#06b6d4'
  },

  {
    name: 'Declaração de Apoio a Evento Turístico',
    description: 'Emissão de declaração de apoio municipal a evento turístico',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 10,
    priority: 3,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#8b5cf6'
  },

  // 🆕 NOVOS SERVIÇOS SEM_DADOS (3)

  {
    name: 'Consulta de Calendário de Eventos',
    description: 'Consulta ao calendário oficial de eventos turísticos do município',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#64748b'
  },

  {
    name: 'Material Promocional Turístico',
    description: 'Solicitação de material promocional e informativos turísticos',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 2,
    category: 'Material',
    icon: 'BookOpen',
    color: '#0891b2'
  },

  {
    name: 'Certidão de Atividade Turística',
    description: 'Certidão comprovando o exercício de atividade turística regularizada',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'Award',
    color: '#d97706'
  }
];
