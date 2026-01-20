/**
 * SEED DE SERVIÇOS - SECRETARIA DE FINANÇAS/FAZENDA
 * Total: 20 serviços (5 PAGAMENTO + 5 CAPTURA_COMPLETA + 10 CONSULTIVO)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const financeServices: ServiceDefinition[] = [
  // ========== COM_DADOS - PAGAMENTO (5) ==========

  {
    name: 'Pagamento de IPTU',
    description: 'Pague o Imposto Predial e Territorial Urbano online',
    departmentCode: 'FINANCAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.PAGAMENTO,
    moduleType: 'PAGAMENTO_IPTU',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 5,
    category: 'Pagamentos',
    icon: 'Home',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        inscricaoImobiliaria: { type: 'string', title: 'Inscrição Imobiliária', maxLength: 20 },
        exercicio: { type: 'integer', title: 'Exercício (Ano)', minimum: 2020, maximum: 2030 },
        formaPagamento: { type: 'string', title: 'Forma de Pagamento', enum: ['À Vista', 'Parcelado'] },
        numeroParcelas: { type: 'integer', title: 'Número de Parcelas', minimum: 1, maximum: 12 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['inscricaoImobiliaria', 'exercicio', 'formaPagamento']
    }
  },

  {
    name: 'Pagamento de ISS',
    description: 'Pague o Imposto Sobre Serviços de Qualquer Natureza',
    departmentCode: 'FINANCAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.PAGAMENTO,
    moduleType: 'PAGAMENTO_ISS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 5,
    category: 'Pagamentos',
    icon: 'Briefcase',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        inscricaoMunicipal: { type: 'string', title: 'Inscrição Municipal', maxLength: 20 },
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{14}$', minLength: 14, maxLength: 14 },
        mesCompetencia: { type: 'string', title: 'Mês de Competência', enum: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'] },
        anoCompetencia: { type: 'integer', title: 'Ano de Competência', minimum: 2020, maximum: 2030 },
        valorServicos: { type: 'number', title: 'Valor dos Serviços Prestados (R$)', minimum: 0 }
      },
      required: ['inscricaoMunicipal', 'cnpj', 'mesCompetencia', 'anoCompetencia', 'valorServicos']
    }
  },

  {
    name: 'Pagamento de ITBI',
    description: 'Pague o Imposto de Transmissão de Bens Imóveis',
    departmentCode: 'FINANCAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.PAGAMENTO,
    moduleType: 'PAGAMENTO_ITBI',
    requiresDocuments: true,
    requiredDocuments: ['Escritura ou Contrato de Compra e Venda', 'RG e CPF do Comprador', 'Certidão de Matrícula do Imóvel'],
    estimatedDays: 5,
    priority: 5,
    category: 'Pagamentos',
    icon: 'FileText',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        inscricaoImobiliaria: { type: 'string', title: 'Inscrição Imobiliária', maxLength: 20 },
        matriculaImovel: { type: 'string', title: 'Matrícula do Imóvel', maxLength: 20 },
        valorTransacao: { type: 'number', title: 'Valor da Transação (R$)', minimum: 0 },
        tipoTransacao: { type: 'string', title: 'Tipo de Transação', enum: ['Compra e Venda', 'Doação', 'Permuta', 'Arrematação'] },
        nomeVendedor: { type: 'string', title: 'Nome do Vendedor', maxLength: 200 },
        cpfVendedor: { type: 'string', title: 'CPF do Vendedor', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 }
      },
      required: ['inscricaoImobiliaria', 'valorTransacao', 'tipoTransacao', 'nomeVendedor', 'cpfVendedor']
    }
  },

  {
    name: 'Pagamento de Taxa de Coleta de Lixo',
    description: 'Pague a Taxa de Coleta e Destinação de Resíduos Sólidos',
    departmentCode: 'FINANCAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.PAGAMENTO,
    moduleType: 'PAGAMENTO_TAXA_LIXO',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 4,
    category: 'Pagamentos',
    icon: 'Trash',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        inscricaoImobiliaria: { type: 'string', title: 'Inscrição Imobiliária', maxLength: 20 },
        exercicio: { type: 'integer', title: 'Exercício (Ano)', minimum: 2020, maximum: 2030 },
        tipoPagamento: { type: 'string', title: 'Tipo de Pagamento', enum: ['À Vista', 'Parcelado'] },
        numeroParcelas: { type: 'integer', title: 'Número de Parcelas', minimum: 1, maximum: 12 }
      },
      required: ['inscricaoImobiliaria', 'exercicio', 'tipoPagamento']
    }
  },

  {
    name: 'Parcelamento de Débitos Tributários',
    description: 'Parcele seus débitos tributários municipais',
    departmentCode: 'FINANCAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.PAGAMENTO,
    moduleType: 'PARCELAMENTO_DEBITOS',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Renda', 'RG e CPF', 'Comprovante de Residência'],
    estimatedDays: 10,
    priority: 4,
    category: 'Pagamentos',
    icon: 'DollarSign',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        tipoDebito: { type: 'string', title: 'Tipo de Débito', enum: ['IPTU', 'ISS', 'Taxa de Lixo', 'Multas', 'Múltiplos Débitos'] },
        inscricao: { type: 'string', title: 'Número de Inscrição (Imobiliária ou Municipal)', maxLength: 20 },
        valorTotal: { type: 'number', title: 'Valor Total do Débito (R$)', minimum: 0 },
        numeroParcelas: { type: 'integer', title: 'Número de Parcelas Desejado', minimum: 2, maximum: 60 },
        rendaMensal: { type: 'number', title: 'Renda Mensal (R$)', minimum: 0 },
        observacoes: { type: 'string', title: 'Justificativa/Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoDebito', 'inscricao', 'valorTotal', 'numeroParcelas', 'rendaMensal']
    }
  },

  // ========== COM_DADOS - CAPTURA_COMPLETA (5) ==========

  {
    name: 'Solicitação de Isenção de IPTU',
    description: 'Solicite isenção de IPTU conforme critérios legais (idosos, aposentados, baixa renda)',
    departmentCode: 'FINANCAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ISENCAO_IPTU',
    requiresDocuments: true,
    requiredDocuments: ['RG e CPF', 'Comprovante de Propriedade do Imóvel', 'Comprovante de Renda', 'Certidão de Nascimento ou Casamento', 'Comprovante de Aposentadoria (se aplicável)'],
    estimatedDays: 30,
    priority: 4,
    category: 'Benefícios Fiscais',
    icon: 'Award',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        inscricaoImobiliaria: { type: 'string', title: 'Inscrição Imobiliária', maxLength: 20 },
        motivoIsencao: { type: 'string', title: 'Motivo da Isenção', enum: ['Aposentado/Pensionista', 'Idoso (60+ anos)', 'Baixa Renda', 'Deficiente Físico', 'Outro'] },
        valorVenalImovel: { type: 'number', title: 'Valor Venal do Imóvel (R$)', minimum: 0 },
        rendaFamiliar: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        possuiOutroImovel: { type: 'boolean', title: 'Possui Outro Imóvel' },
        observacoes: { type: 'string', title: 'Observações Complementares', maxLength: 500, widget: 'textarea' }
      },
      required: ['inscricaoImobiliaria', 'motivoIsencao', 'valorVenalImovel', 'rendaFamiliar', 'numeroMoradores']
    }
  },

  {
    name: 'Solicitação de Revisão de Lançamento de IPTU',
    description: 'Solicite revisão do valor lançado de IPTU por erro cadastral ou avaliação',
    departmentCode: 'FINANCAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'REVISAO_IPTU',
    requiresDocuments: true,
    requiredDocuments: ['Carnê de IPTU', 'Fotos do Imóvel', 'Laudo de Avaliação (se houver)', 'Escritura do Imóvel'],
    estimatedDays: 45,
    priority: 3,
    category: 'Revisões',
    icon: 'FileEdit',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        inscricaoImobiliaria: { type: 'string', title: 'Inscrição Imobiliária', maxLength: 20 },
        exercicio: { type: 'integer', title: 'Exercício (Ano)', minimum: 2020, maximum: 2030 },
        motivoRevisao: { type: 'string', title: 'Motivo da Revisão', enum: ['Área Construída Incorreta', 'Padrão de Construção Incorreto', 'Testada Incorreta', 'Tipo de Uso Incorreto', 'Valor Venal Superestimado', 'Outro'] },
        valorAtual: { type: 'number', title: 'Valor Atual do IPTU (R$)', minimum: 0 },
        valorEstimado: { type: 'number', title: 'Valor Estimado Correto (R$)', minimum: 0 },
        areaConstruida: { type: 'number', title: 'Área Construída Real (m²)', minimum: 0 },
        areaTerreno: { type: 'number', title: 'Área do Terreno Real (m²)', minimum: 0 },
        fundamentacao: { type: 'string', title: 'Fundamentação do Pedido', maxLength: 1000, widget: 'textarea' }
      },
      required: ['inscricaoImobiliaria', 'exercicio', 'motivoRevisao', 'valorAtual', 'fundamentacao']
    }
  },

  {
    name: 'Atualização Cadastral de Imóvel',
    description: 'Atualize os dados cadastrais do seu imóvel no sistema tributário municipal',
    departmentCode: 'FINANCAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ATUALIZACAO_CADASTRAL_IMOVEL',
    requiresDocuments: true,
    requiredDocuments: ['Escritura ou Contrato de Compra e Venda', 'RG e CPF do Proprietário', 'Comprovante de Endereço', 'Carnê de IPTU'],
    estimatedDays: 20,
    priority: 3,
    category: 'Cadastros',
    icon: 'RefreshCw',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        inscricaoImobiliaria: { type: 'string', title: 'Inscrição Imobiliária', maxLength: 20 },
        tipoAtualizacao: { type: 'string', title: 'Tipo de Atualização', enum: ['Mudança de Proprietário', 'Correção de Endereço', 'Atualização de Área', 'Mudança de Uso', 'Múltiplas Alterações'] },
        novoProprietario: { type: 'string', title: 'Nome do Novo Proprietário (se aplicável)', maxLength: 200 },
        cpfNovoProprietario: { type: 'string', title: 'CPF do Novo Proprietário (se aplicável)', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        enderecoCompleto: { type: 'string', title: 'Endereço Completo Atualizado', maxLength: 300 },
        tipoUso: { type: 'string', title: 'Tipo de Uso do Imóvel', enum: ['Residencial', 'Comercial', 'Industrial', 'Misto'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['inscricaoImobiliaria', 'tipoAtualizacao', 'enderecoCompleto', 'tipoUso']
    }
  },

  {
    name: 'Atualização Cadastral de Empresa',
    description: 'Atualize os dados da sua empresa no cadastro municipal de contribuintes',
    departmentCode: 'FINANCAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ATUALIZACAO_CADASTRAL_EMPRESA',
    requiresDocuments: true,
    requiredDocuments: ['Contrato Social Atualizado', 'CNPJ', 'RG e CPF do Responsável', 'Comprovante de Endereço Comercial'],
    estimatedDays: 15,
    priority: 3,
    category: 'Cadastros',
    icon: 'Building',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone'],
      properties: {
        inscricaoMunicipal: { type: 'string', title: 'Inscrição Municipal', maxLength: 20 },
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{14}$', minLength: 14, maxLength: 14 },
        razaoSocial: { type: 'string', title: 'Razão Social', maxLength: 200 },
        nomeFantasia: { type: 'string', title: 'Nome Fantasia', maxLength: 200 },
        tipoAtualizacao: { type: 'string', title: 'Tipo de Atualização', enum: ['Mudança de Endereço', 'Alteração de Sócios', 'Mudança de Atividade', 'Alteração Contratual', 'Múltiplas Alterações'] },
        enderecoComercial: { type: 'string', title: 'Endereço Comercial Atualizado', maxLength: 300 },
        atividadePrincipal: { type: 'string', title: 'Atividade Principal (CNAE)', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['inscricaoMunicipal', 'cnpj', 'razaoSocial', 'tipoAtualizacao', 'enderecoComercial']
    }
  },

  {
    name: 'Cadastro de Contribuinte (Pessoa Física)',
    description: 'Realize o cadastro inicial como contribuinte do município',
    departmentCode: 'FINANCAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_CONTRIBUINTE',
    requiresDocuments: true,
    requiredDocuments: ['RG e CPF', 'Comprovante de Residência', 'Título de Propriedade (se possuir imóvel)', 'Contrato de Locação (se locatário)'],
    estimatedDays: 15,
    priority: 3,
    category: 'Cadastros',
    icon: 'UserPlus',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_maritalstatus', 'citizen_occupation'],
      properties: {
        tipoContribuinte: { type: 'string', title: 'Tipo de Contribuinte', enum: ['Proprietário de Imóvel', 'Locatário', 'Prestador de Serviços', 'Outro'] },
        possuiImovel: { type: 'boolean', title: 'Possui Imóvel no Município' },
        inscricaoImobiliaria: { type: 'string', title: 'Inscrição Imobiliária (se possuir)', maxLength: 20 },
        prestaServicos: { type: 'boolean', title: 'Presta Serviços no Município' },
        atividadeEconomica: { type: 'string', title: 'Atividade Econômica (se aplicável)', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoContribuinte', 'possuiImovel']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (10) ==========

  {
    name: 'Consulta de Débitos Tributários',
    description: 'Consulte todos os seus débitos tributários municipais',
    departmentCode: 'FINANCAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Search',
    color: '#6366f1'
  },

  {
    name: 'Emissão de Certidão Negativa de Débitos (CND)',
    description: 'Emita certidão negativa de débitos tributários municipais',
    departmentCode: 'FINANCAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 1,
    priority: 4,
    category: 'Certidões',
    icon: 'FileCheck',
    color: '#10b981'
  },

  {
    name: 'Emissão de Certidão Positiva com Efeitos de Negativa',
    description: 'Emita certidão positiva de débitos com efeitos de negativa',
    departmentCode: 'FINANCAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 1,
    priority: 4,
    category: 'Certidões',
    icon: 'FileText',
    color: '#f59e0b'
  },

  {
    name: 'Consulta de Cadastro Imobiliário',
    description: 'Consulte os dados cadastrais do seu imóvel',
    departmentCode: 'FINANCAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Home',
    color: '#3b82f6'
  },

  {
    name: 'Consulta de Cadastro de Empresa',
    description: 'Consulte os dados da sua empresa no cadastro municipal',
    departmentCode: 'FINANCAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Building',
    color: '#3b82f6'
  },

  {
    name: 'Segunda Via de Carnê de IPTU',
    description: 'Emita segunda via do carnê de IPTU',
    departmentCode: 'FINANCAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 3,
    category: 'Documentos',
    icon: 'Receipt',
    color: '#06b6d4'
  },

  {
    name: 'Segunda Via de Alvará de Funcionamento',
    description: 'Emita segunda via do alvará de funcionamento da sua empresa',
    departmentCode: 'FINANCAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 3,
    priority: 3,
    category: 'Documentos',
    icon: 'FileSignature',
    color: '#06b6d4'
  },

  {
    name: 'Consulta de Valor Venal de Imóvel',
    description: 'Consulte o valor venal do seu imóvel para fins tributários',
    departmentCode: 'FINANCAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'DollarSign',
    color: '#10b981'
  },

  {
    name: 'Consulta de Planta de Valores',
    description: 'Consulte a planta genérica de valores do município',
    departmentCode: 'FINANCAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Consultas',
    icon: 'Map',
    color: '#8b5cf6'
  },

  {
    name: 'Histórico de Pagamentos',
    description: 'Consulte o histórico completo de pagamentos de tributos municipais',
    departmentCode: 'FINANCAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'History',
    color: '#64748b'
  }
];
