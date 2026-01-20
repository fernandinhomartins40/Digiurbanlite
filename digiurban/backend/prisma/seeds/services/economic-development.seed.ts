/**
 * SEED DE SERVIÇOS - SECRETARIA DE DESENVOLVIMENTO ECONÔMICO
 * Total: 20 serviços (10 CAPTURA_COMPLETA + 6 SOLICITACAO_SIMPLES + 4 CONSULTIVO)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const economicDevelopmentServices: ServiceDefinition[] = [
  // ========== COM_DADOS - CAPTURA_COMPLETA (10) ==========

  {
    name: 'Alvará de Funcionamento',
    description: 'Solicite alvará de funcionamento para abertura de empresa ou estabelecimento comercial',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ALVARA_FUNCIONAMENTO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Contrato Social', 'Comprovante de Endereço do Estabelecimento', 'Planta Baixa', 'Auto de Vistoria do Corpo de Bombeiros'],
    estimatedDays: 30,
    priority: 5,
    category: 'Licenciamento',
    icon: 'Building',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{14}$', minLength: 14, maxLength: 14 },
        razaoSocial: { type: 'string', title: 'Razão Social', maxLength: 200 },
        nomeFantasia: { type: 'string', title: 'Nome Fantasia', maxLength: 200 },
        ramoAtividade: { type: 'string', title: 'Ramo de Atividade', enum: ['Comércio', 'Indústria', 'Serviços', 'Outro'] },
        atividadePrincipal: { type: 'string', title: 'Atividade Principal (CNAE)', maxLength: 300 },
        enderecoEstabelecimento: { type: 'string', title: 'Endereço do Estabelecimento', maxLength: 300 },
        areaEstabelecimento: { type: 'number', title: 'Área do Estabelecimento (m²)', minimum: 1 },
        numeroFuncionarios: { type: 'integer', title: 'Número Estimado de Funcionários', minimum: 0 },
        horarioFuncionamento: { type: 'string', title: 'Horário de Funcionamento', maxLength: 100 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['cnpj', 'razaoSocial', 'nomeFantasia', 'ramoAtividade', 'atividadePrincipal', 'enderecoEstabelecimento', 'areaEstabelecimento']
    }
  },

  {
    name: 'Baixa de Empresa',
    description: 'Solicite baixa de empresa ou encerramento de atividades comerciais',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'BAIXA_EMPRESA',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Último Alvará de Funcionamento', 'Certidões Negativas (Tributos Municipais, Estaduais e Federais)', 'Comprovante de Pagamento de Débitos (se houver)'],
    estimatedDays: 45,
    priority: 4,
    category: 'Licenciamento',
    icon: 'XCircle',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{14}$', minLength: 14, maxLength: 14 },
        razaoSocial: { type: 'string', title: 'Razão Social', maxLength: 200 },
        motivoBaixa: { type: 'string', title: 'Motivo da Baixa', enum: ['Encerramento Voluntário', 'Mudança de Município', 'Falência', 'Outro'] },
        dataEncerramentoAtividades: { type: 'string', title: 'Data de Encerramento das Atividades', format: 'date' },
        possuiDebitos: { type: 'boolean', title: 'Possui Débitos Pendentes' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['cnpj', 'razaoSocial', 'motivoBaixa', 'dataEncerramentoAtividades', 'possuiDebitos']
    }
  },

  {
    name: 'Cadastro MEI (Microempreendedor Individual)',
    description: 'Cadastre-se como MEI e receba orientação para formalização',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_MEI',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Residência', 'Título de Eleitor ou Recibo da Declaração IRPF'],
    estimatedDays: 7,
    priority: 5,
    category: 'Formalização',
    icon: 'Briefcase',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        atividadePrincipal: { type: 'string', title: 'Atividade Principal que Pretende Exercer', maxLength: 300 },
        nomeFantasia: { type: 'string', title: 'Nome Fantasia Desejado', maxLength: 200 },
        localTrabalho: { type: 'string', title: 'Local de Trabalho', enum: ['Residência', 'Estabelecimento Próprio', 'Via Pública', 'Porta a Porta', 'Internet', 'Outro'] },
        possuiFuncionario: { type: 'boolean', title: 'Pretende Contratar Funcionário' },
        jaPossuiCNPJ: { type: 'boolean', title: 'Já Possui CNPJ' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['atividadePrincipal', 'nomeFantasia', 'localTrabalho', 'possuiFuncionario', 'jaPossuiCNPJ']
    }
  },

  {
    name: 'Agendamento Sala do Empreendedor',
    description: 'Agende atendimento presencial na Sala do Empreendedor para orientação empresarial',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AGENDAMENTO_SALA_EMPREENDEDOR',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 4,
    category: 'Atendimento',
    icon: 'Calendar',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone'],
      properties: {
        assunto: { type: 'string', title: 'Assunto do Atendimento', enum: ['Abertura de Empresa', 'Regularização MEI', 'Alvará', 'Microcrédito', 'Orientação Empresarial', 'Outro'] },
        dataPreferencial: { type: 'string', title: 'Data Preferencial', format: 'date' },
        periodoPreferencial: { type: 'string', title: 'Período Preferencial', enum: ['Manhã', 'Tarde'] },
        possuiEmpresa: { type: 'boolean', title: 'Já Possui Empresa Aberta' },
        descricaoSolicitacao: { type: 'string', title: 'Descreva Brevemente sua Solicitação', maxLength: 500, widget: 'textarea' }
      },
      required: ['assunto', 'dataPreferencial', 'periodoPreferencial', 'possuiEmpresa', 'descricaoSolicitacao']
    }
  },

  {
    name: 'Solicitação de Microcrédito',
    description: 'Solicite crédito para pequenos empreendedores e MEIs',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'SOLICITACAO_MICROCREDITO',
    requiresDocuments: true,
    requiredDocuments: ['RG e CPF', 'Comprovante de Residência', 'Comprovante de Renda', 'CNPJ (se MEI/Empresa)', 'Projeto ou Plano de Negócio Simples'],
    estimatedDays: 20,
    priority: 5,
    category: 'Crédito',
    icon: 'DollarSign',
    color: '#22c55e',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cnpj: { type: 'string', title: 'CNPJ (se possuir)', maxLength: 14 },
        valorSolicitado: { type: 'number', title: 'Valor Solicitado (R$)', minimum: 100, maximum: 21000 },
        finalidadeCredito: { type: 'string', title: 'Finalidade do Crédito', enum: ['Capital de Giro', 'Compra de Equipamentos', 'Reforma do Estabelecimento', 'Compra de Estoque', 'Outro'] },
        ramoAtividade: { type: 'string', title: 'Ramo de Atividade', maxLength: 200 },
        tempoAtividade: { type: 'string', title: 'Tempo de Atividade', enum: ['Menos de 6 meses', '6 meses a 1 ano', '1 a 2 anos', 'Mais de 2 anos', 'Pretendo Iniciar'] },
        faturamentoMensal: { type: 'number', title: 'Faturamento Mensal Médio (R$)', minimum: 0 },
        projetoNegocio: { type: 'string', title: 'Descreva seu Projeto/Negócio', maxLength: 1000, widget: 'textarea' }
      },
      required: ['valorSolicitado', 'finalidadeCredito', 'ramoAtividade', 'tempoAtividade', 'projetoNegocio']
    }
  },

  {
    name: 'Inscrição em Incubadora de Empresas',
    description: 'Inscreva seu projeto ou startup na incubadora municipal de empresas',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'INSCRICAO_INCUBADORA',
    requiresDocuments: true,
    requiredDocuments: ['CPF e RG dos Sócios', 'Currículo dos Sócios', 'Plano de Negócio Completo', 'Pitch Deck (Apresentação)', 'CNPJ (se já constituída)'],
    estimatedDays: 30,
    priority: 4,
    category: 'Inovação',
    icon: 'Rocket',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone'],
      properties: {
        nomeEmpresa: { type: 'string', title: 'Nome do Projeto/Empresa', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ (se já constituída)', maxLength: 14 },
        estagio: { type: 'string', title: 'Estágio do Projeto', enum: ['Ideia', 'Protótipo', 'MVP', 'Produto Lançado', 'Empresa Constituída'] },
        setor: { type: 'string', title: 'Setor de Atuação', enum: ['Tecnologia', 'Saúde', 'Educação', 'Agronegócio', 'Serviços', 'Indústria', 'Outro'] },
        numeroSocios: { type: 'integer', title: 'Número de Sócios', minimum: 1, maximum: 10 },
        descricaoProjeto: { type: 'string', title: 'Descrição do Projeto/Problema que Resolve', maxLength: 1000, widget: 'textarea' },
        diferencialCompetitivo: { type: 'string', title: 'Diferencial Competitivo', maxLength: 500, widget: 'textarea' },
        possuiFaturamento: { type: 'boolean', title: 'Já Possui Faturamento' }
      },
      required: ['nomeEmpresa', 'estagio', 'setor', 'numeroSocios', 'descricaoProjeto', 'diferencialCompetitivo', 'possuiFaturamento']
    }
  },

  {
    name: 'Participação em Feiras e Rodadas de Negócios',
    description: 'Inscreva-se para participar de feiras, exposições e rodadas de negócios',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'PARTICIPACAO_FEIRAS',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Alvará de Funcionamento', 'Catálogo de Produtos/Serviços (se houver)'],
    estimatedDays: 15,
    priority: 3,
    category: 'Eventos',
    icon: 'Users',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{14}$', minLength: 14, maxLength: 14 },
        nomeEmpresa: { type: 'string', title: 'Nome da Empresa', maxLength: 200 },
        ramoAtividade: { type: 'string', title: 'Ramo de Atividade', maxLength: 200 },
        produtosServicos: { type: 'string', title: 'Principais Produtos/Serviços', maxLength: 500, widget: 'textarea' },
        eventoInteresse: { type: 'string', title: 'Tipo de Evento de Interesse', enum: ['Feira Local', 'Feira Regional', 'Rodada de Negócios', 'Missão Comercial', 'Qualquer Evento'] },
        necessitaEstande: { type: 'boolean', title: 'Necessita de Estande' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['cnpj', 'nomeEmpresa', 'ramoAtividade', 'produtosServicos', 'eventoInteresse', 'necessitaEstande']
    }
  },

  {
    name: 'Cadastro de Fornecedor Municipal',
    description: 'Cadastre sua empresa como fornecedor para a Prefeitura Municipal',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_FORNECEDOR',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Contrato Social ou Requerimento de Empresário', 'Comprovante de Endereço da Empresa', 'Certidões Negativas (Federal, Estadual, Municipal, Trabalhista)', 'Alvará de Funcionamento'],
    estimatedDays: 20,
    priority: 4,
    category: 'Fornecimento',
    icon: 'Package',
    color: '#14b8a6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone'],
      properties: {
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{14}$', minLength: 14, maxLength: 14 },
        razaoSocial: { type: 'string', title: 'Razão Social', maxLength: 200 },
        nomeFantasia: { type: 'string', title: 'Nome Fantasia', maxLength: 200 },
        ramoAtividade: { type: 'string', title: 'Ramo de Atividade', maxLength: 200 },
        produtosServicos: { type: 'string', title: 'Produtos/Serviços Oferecidos', maxLength: 1000, widget: 'textarea' },
        categoriasInteresse: { type: 'string', title: 'Categorias de Interesse para Fornecimento', maxLength: 500, widget: 'textarea' },
        inscricaoEstadual: { type: 'string', title: 'Inscrição Estadual', maxLength: 20 },
        site: { type: 'string', title: 'Site (se possuir)', maxLength: 200 }
      },
      required: ['cnpj', 'razaoSocial', 'nomeFantasia', 'ramoAtividade', 'produtosServicos', 'categoriasInteresse']
    }
  },

  {
    name: 'Atração de Empresas e Investimentos',
    description: 'Registre interesse em instalar empresa ou investimento no município',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ATRACAO_EMPRESAS',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 5,
    category: 'Investimentos',
    icon: 'TrendingUp',
    color: '#6366f1',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        nomeEmpresa: { type: 'string', title: 'Nome da Empresa', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ (se já constituída)', maxLength: 14 },
        ramoAtividade: { type: 'string', title: 'Ramo de Atividade', maxLength: 200 },
        porteEmpresa: { type: 'string', title: 'Porte da Empresa', enum: ['MEI', 'Microempresa', 'Pequena Empresa', 'Média Empresa', 'Grande Empresa'] },
        valorInvestimento: { type: 'string', title: 'Valor Estimado do Investimento', enum: ['Até R$ 100 mil', 'R$ 100 mil a R$ 500 mil', 'R$ 500 mil a R$ 1 milhão', 'R$ 1 milhão a R$ 5 milhões', 'Acima de R$ 5 milhões'] },
        geracaoEmpregos: { type: 'integer', title: 'Estimativa de Geração de Empregos', minimum: 0 },
        necessidades: { type: 'string', title: 'Necessidades e Incentivos Buscados', maxLength: 1000, widget: 'textarea' },
        descricaoProjeto: { type: 'string', title: 'Descrição do Projeto de Investimento', maxLength: 1000, widget: 'textarea' }
      },
      required: ['nomeEmpresa', 'ramoAtividade', 'porteEmpresa', 'valorInvestimento', 'geracaoEmpregos', 'descricaoProjeto']
    }
  },

  {
    name: 'Solicitação de Lote no Distrito Industrial',
    description: 'Solicite lote ou área no distrito/parque industrial municipal',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'SOLICITACAO_LOTE_DISTRITO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Contrato Social', 'Projeto Industrial', 'Certidões Negativas', 'Plano de Investimento'],
    estimatedDays: 60,
    priority: 5,
    category: 'Infraestrutura',
    icon: 'Factory',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone'],
      properties: {
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{14}$', minLength: 14, maxLength: 14 },
        razaoSocial: { type: 'string', title: 'Razão Social', maxLength: 200 },
        ramoIndustrial: { type: 'string', title: 'Ramo Industrial', maxLength: 200 },
        areaDesejada: { type: 'number', title: 'Área Desejada (m²)', minimum: 100 },
        valorInvestimento: { type: 'number', title: 'Valor do Investimento Previsto (R$)', minimum: 0 },
        geracaoEmpregos: { type: 'integer', title: 'Geração de Empregos Prevista', minimum: 0 },
        prazoImplantacao: { type: 'string', title: 'Prazo para Implantação', enum: ['Até 6 meses', '6 meses a 1 ano', '1 a 2 anos', 'Acima de 2 anos'] },
        descricaoProjeto: { type: 'string', title: 'Descrição do Projeto Industrial', maxLength: 1000, widget: 'textarea' },
        impactoAmbiental: { type: 'string', title: 'Possui Impacto Ambiental Significativo?', enum: ['Não', 'Baixo', 'Médio', 'Alto'] }
      },
      required: ['cnpj', 'razaoSocial', 'ramoIndustrial', 'areaDesejada', 'valorInvestimento', 'geracaoEmpregos', 'prazoImplantacao', 'descricaoProjeto', 'impactoAmbiental']
    }
  },

  // ========== COM_DADOS - SOLICITACAO_SIMPLES (6) ==========

  {
    name: 'Cadastro no Balcão de Empregos',
    description: 'Cadastre-se no banco de empregos municipal',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CADASTRO_BALCAO_EMPREGOS',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 4,
    category: 'Emprego',
    icon: 'UserPlus',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone'],
      properties: {
        escolaridade: { type: 'string', title: 'Escolaridade', enum: ['Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo', 'Pós-Graduação'] },
        areaInteresse: { type: 'string', title: 'Área de Interesse', maxLength: 300 },
        experiencia: { type: 'string', title: 'Breve Descrição da Experiência Profissional', maxLength: 500, widget: 'textarea' },
        disponibilidadeImediata: { type: 'boolean', title: 'Disponibilidade Imediata' }
      },
      required: ['escolaridade', 'areaInteresse', 'disponibilidadeImediata']
    }
  },

  {
    name: 'Inscrição em Cursos de Qualificação Profissional',
    description: 'Inscreva-se em cursos gratuitos de capacitação e qualificação',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_QUALIFICACAO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Qualificação',
    icon: 'BookOpen',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone'],
      properties: {
        escolaridade: { type: 'string', title: 'Escolaridade', enum: ['Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo'] },
        areaInteresse: { type: 'string', title: 'Área de Interesse', enum: ['Informática', 'Gestão/Administração', 'Vendas', 'Artesanato', 'Beleza', 'Gastronomia', 'Construção Civil', 'Outro'] },
        periodoPreferencial: { type: 'string', title: 'Período Preferencial', enum: ['Manhã', 'Tarde', 'Noite', 'Finais de Semana', 'Qualquer'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['escolaridade', 'areaInteresse', 'periodoPreferencial']
    }
  },

  {
    name: 'Solicitação de Consultoria Empresarial',
    description: 'Solicite consultoria gratuita para gestão e desenvolvimento empresarial',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SOLICITACAO_CONSULTORIA',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 3,
    category: 'Consultoria',
    icon: 'MessageSquare',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        cnpj: { type: 'string', title: 'CNPJ (se possuir)', maxLength: 14 },
        areaConsultoria: { type: 'string', title: 'Área da Consultoria', enum: ['Gestão Financeira', 'Marketing Digital', 'Vendas', 'Planejamento Estratégico', 'Recursos Humanos', 'Outro'] },
        descricaoNecessidade: { type: 'string', title: 'Descreva sua Necessidade', maxLength: 500, widget: 'textarea' }
      },
      required: ['areaConsultoria', 'descricaoNecessidade']
    }
  },

  {
    name: 'Denúncia de Comércio Irregular',
    description: 'Denuncie estabelecimentos comerciais operando sem licença',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_COMERCIO_IRREGULAR',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 3,
    category: 'Fiscalização',
    icon: 'AlertTriangle',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        nomeEstabelecimento: { type: 'string', title: 'Nome do Estabelecimento', maxLength: 200 },
        endereco: { type: 'string', title: 'Endereço', maxLength: 300 },
        tipoIrregularidade: { type: 'string', title: 'Tipo de Irregularidade', enum: ['Sem Alvará', 'Atividade Não Permitida', 'Horário Irregular', 'Outro'] },
        descricao: { type: 'string', title: 'Descrição da Irregularidade', maxLength: 500, widget: 'textarea' },
        denunciaAnonima: { type: 'boolean', title: 'Desejo fazer denúncia anônima' }
      },
      required: ['endereco', 'tipoIrregularidade', 'descricao']
    }
  },

  {
    name: 'Programa Compra Direta do Produtor',
    description: 'Cadastre-se para vender produtos diretamente para a merenda escolar',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'COMPRA_DIRETA_PRODUTOR',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'DAP (Declaração de Aptidão ao Pronaf)', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 4,
    category: 'Agricultura',
    icon: 'ShoppingCart',
    color: '#22c55e',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoProduto: { type: 'string', title: 'Tipo de Produto', enum: ['Hortaliças', 'Frutas', 'Laticínios', 'Grãos', 'Carnes', 'Panificados', 'Outro'] },
        producaoPrincipal: { type: 'string', title: 'Produção Principal', maxLength: 300 },
        capacidadeProducao: { type: 'string', title: 'Capacidade de Produção Mensal', maxLength: 200 },
        possuiDAP: { type: 'boolean', title: 'Possui DAP (Declaração de Aptidão ao Pronaf)' }
      },
      required: ['tipoProduto', 'producaoPrincipal', 'capacidadeProducao', 'possuiDAP']
    }
  },

  {
    name: 'Orientação para Economia Criativa',
    description: 'Receba orientação para projetos de economia criativa (artesanato, cultura, design)',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'ORIENTACAO_ECONOMIA_CRIATIVA',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 3,
    category: 'Economia Criativa',
    icon: 'Palette',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        areaAtuacao: { type: 'string', title: 'Área de Atuação', enum: ['Artesanato', 'Design', 'Moda', 'Gastronomia', 'Música', 'Artes Visuais', 'Audiovisual', 'Outro'] },
        estagioNegocio: { type: 'string', title: 'Estágio do Negócio', enum: ['Ideia', 'Iniciando', 'Em Atividade', 'Formalizado'] },
        descricaoAtividade: { type: 'string', title: 'Descreva sua Atividade/Projeto', maxLength: 500, widget: 'textarea' }
      },
      required: ['areaAtuacao', 'estagioNegocio', 'descricaoAtividade']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (4) ==========

  {
    name: 'Consulta de Processos de Alvará',
    description: 'Consulte o andamento de processos de alvará de funcionamento',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Search',
    color: '#3b82f6'
  },

  {
    name: 'Lista de Vagas de Emprego Disponíveis',
    description: 'Consulte vagas de emprego disponíveis no balcão de empregos',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'List',
    color: '#10b981'
  },

  {
    name: 'Calendário de Cursos e Eventos',
    description: 'Consulte calendário de cursos de qualificação e eventos empresariais',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Consultas',
    icon: 'Calendar',
    color: '#8b5cf6'
  },

  {
    name: 'Informações sobre Incentivos Fiscais',
    description: 'Consulte informações sobre incentivos fiscais municipais para empresas',
    departmentCode: 'DESENVOLVIMENTO_ECONOMICO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Info',
    color: '#f59e0b'
  }
];
