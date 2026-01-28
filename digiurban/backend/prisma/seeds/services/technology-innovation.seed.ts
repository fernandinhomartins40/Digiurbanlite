/**
 * SEED DE SERVIÇOS - SECRETARIA DE TECNOLOGIA E INOVAÇÃO
 * Total: 15 serviços (6 CAPTURA_COMPLETA + 3 SOLICITACAO_SIMPLES + 6 CONSULTIVO)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const technologyInnovationServices: ServiceDefinition[] = [
  // ========== COM_DADOS - CAPTURA_COMPLETA (6) ==========

  {
    name: 'Cadastro no Login Único Gov.br',
    description: 'Cadastre-se ou solicite auxílio para criar sua conta Login Único do governo',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_LOGIN_UNICO',
    requiresDocuments: true,
    requiredDocuments: ['RG ou CNH', 'CPF', 'Comprovante de Residência', 'E-mail e Telefone'],
    estimatedDays: 3,
    priority: 4,
    category: 'Acesso Digital',
    icon: 'User',
    color: '#3b82f6',
    // Validação de unicidade: um cidadão só pode ter uma solicitação de cadastro Login Único ativa
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'CADASTRO_LOGIN_UNICO',
      validationFunction: 'validateCadastroLoginUnico'
    },
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone'],
      properties: {
        tipoSolicitacao: { type: 'string', title: 'Tipo de Solicitação', enum: ['Primeiro Cadastro', 'Recuperação de Senha', 'Atualização de Dados', 'Elevação de Nível (Prata/Ouro)', 'Desbloqueio de Conta'] },
        nivelAtual: { type: 'string', title: 'Nível Atual da Conta (se já possui)', enum: ['Não Possuo', 'Bronze', 'Prata', 'Ouro'] },
        motivoElevacao: { type: 'string', title: 'Motivo para Elevar Nível (se aplicável)', maxLength: 300, widget: 'textarea' },
        possuiSmartphone: { type: 'boolean', title: 'Possui Smartphone' },
        possuiEmail: { type: 'boolean', title: 'Possui E-mail Ativo' },
        dificuldadeAcesso: { type: 'string', title: 'Dificuldade Encontrada (se aplicável)', maxLength: 500, widget: 'textarea' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['tipoSolicitacao', 'possuiSmartphone', 'possuiEmail']
    }
  },

  {
    name: 'Solicitação de Certificado Digital',
    description: 'Solicite emissão ou renovação de certificado digital para serviços municipais',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CERTIFICADO_DIGITAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência', 'CNPJ (para empresas)'],
    estimatedDays: 10,
    priority: 3,
    category: 'Certificação',
    icon: 'Award',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        tipoCertificado: { type: 'string', title: 'Tipo de Certificado', enum: ['e-CPF (Pessoa Física)', 'e-CNPJ (Pessoa Jurídica)', 'e-MEI (Microempreendedor)'] },
        tipoSolicitacao: { type: 'string', title: 'Tipo de Solicitação', enum: ['Primeira Emissão', 'Renovação', 'Segunda Via'] },
        finalidade: { type: 'array', title: 'Finalidade do Uso', items: { type: 'string', enum: ['Nota Fiscal Eletrônica', 'Declaração de Imposto de Renda', 'Licitações', 'Processos Judiciais', 'Acesso a Sistemas Governamentais', 'Outro'] }, minItems: 1 },
        nomeEmpresa: { type: 'string', title: 'Nome da Empresa (se e-CNPJ/e-MEI)', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ (se e-CNPJ/e-MEI)', pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$' },
        validadeCertificado: { type: 'string', title: 'Validade do Certificado Anterior (se renovação)', format: 'date' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoCertificado', 'tipoSolicitacao', 'finalidade']
    }
  },

  {
    name: 'Inscrição em Curso de Inclusão Digital',
    description: 'Inscreva-se em cursos gratuitos de informática e inclusão digital',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CURSO_INCLUSAO_DIGITAL',
    requiresDocuments: true,
    requiredDocuments: ['RG ou CPF', 'Comprovante de Residência'],
    estimatedDays: 10,
    priority: 3,
    category: 'Capacitação',
    icon: 'GraduationCap',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_occupation'],
      properties: {
        tipoCurso: { type: 'string', title: 'Tipo de Curso', enum: ['Informática Básica', 'Internet e Redes Sociais', 'Pacote Office', 'Planilhas Excel', 'Criação de E-mail', 'Segurança Digital', 'Celular e Aplicativos', 'E-commerce', 'Marketing Digital', 'Programação Básica'] },
        nivelConhecimento: { type: 'string', title: 'Nível de Conhecimento Atual', enum: ['Nenhum', 'Básico', 'Intermediário'] },
        escolaridade: { type: 'string', title: 'Escolaridade', enum: ['Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo'] },
        faixaEtaria: { type: 'string', title: 'Faixa Etária', enum: ['14-17 anos', '18-29 anos', '30-44 anos', '45-59 anos', '60+ anos'] },
        possuiComputador: { type: 'boolean', title: 'Possui Computador em Casa' },
        possuiInternet: { type: 'boolean', title: 'Possui Internet em Casa' },
        possuiSmartphone: { type: 'boolean', title: 'Possui Smartphone' },
        motivoCurso: { type: 'string', title: 'Motivo de Interesse no Curso', maxLength: 500, widget: 'textarea' },
        disponibilidade: { type: 'string', title: 'Disponibilidade de Horário', enum: ['Manhã (8h-12h)', 'Tarde (13h-17h)', 'Noite (18h-22h)', 'Fins de Semana', 'Flexível'] },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais (se houver)', maxLength: 300, widget: 'textarea' }
      },
      required: ['tipoCurso', 'nivelConhecimento', 'escolaridade', 'faixaEtaria', 'possuiComputador', 'possuiInternet', 'possuiSmartphone', 'motivoCurso', 'disponibilidade']
    }
  },

  {
    name: 'Cadastro de Startup/Empresa de Tecnologia',
    description: 'Cadastre sua startup ou empresa de tecnologia no hub de inovação municipal',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_STARTUP',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ ou Protocolo de Abertura', 'Contrato Social', 'RG e CPF dos Sócios', 'Pitch Deck ou Apresentação da Empresa'],
    estimatedDays: 15,
    priority: 3,
    category: 'Inovação',
    icon: 'Rocket',
    color: '#f59e0b',
    // Validação de unicidade: uma startup/empresa só pode ter um cadastro ativo
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'CADASTRO_STARTUP',
      validationFunction: 'validateCadastroStartup'
    },
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        nomeEmpresa: { type: 'string', title: 'Nome da Empresa/Startup', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ (se já formalizado)', pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$' },
        estagioEmpresa: { type: 'string', title: 'Estágio da Empresa', enum: ['Ideia/Pré-Operação', 'MVP (Produto Mínimo)', 'Operacional sem Faturamento', 'Operacional com Faturamento', 'Crescimento', 'Consolidada'] },
        segmentoAtuacao: { type: 'string', title: 'Segmento de Atuação', enum: ['Fintech', 'Healthtech', 'Edtech', 'Agritech', 'Govtech', 'E-commerce', 'SaaS', 'Aplicativos', 'IoT', 'IA/Machine Learning', 'Outro'] },
        descricaoNegocio: { type: 'string', title: 'Descrição do Negócio', maxLength: 1000, widget: 'textarea' },
        problemaResolve: { type: 'string', title: 'Que Problema Resolve', maxLength: 500, widget: 'textarea' },
        publicoAlvo: { type: 'string', title: 'Público-Alvo', maxLength: 300 },
        quantidadeSocios: { type: 'integer', title: 'Quantidade de Sócios', minimum: 1, maximum: 10 },
        quantidadeFuncionarios: { type: 'integer', title: 'Quantidade de Funcionários', minimum: 0, maximum: 100 },
        faturamentoMensal: { type: 'string', title: 'Faturamento Mensal (se houver)', enum: ['Sem faturamento', 'Até R$ 5 mil', 'R$ 5-20 mil', 'R$ 20-50 mil', 'R$ 50-100 mil', 'Mais de R$ 100 mil'] },
        recebeuInvestimento: { type: 'boolean', title: 'Já Recebeu Investimento' },
        valorInvestimento: { type: 'string', title: 'Valor do Investimento (se houver)', maxLength: 100 },
        necessidadesApoio: { type: 'array', title: 'Necessidades de Apoio', items: { type: 'string', enum: ['Mentoria', 'Investimento', 'Espaço de Coworking', 'Networking', 'Validação de Mercado', 'Capacitação', 'Assessoria Jurídica', 'Contabilidade', 'Marketing', 'Tecnologia'] }, minItems: 1 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeEmpresa', 'estagioEmpresa', 'segmentoAtuacao', 'descricaoNegocio', 'problemaResolve', 'publicoAlvo', 'quantidadeSocios', 'quantidadeFuncionarios', 'faturamentoMensal', 'necessidadesApoio']
    }
  },

  {
    name: 'Inscrição em Hackathon/Desafio de Inovação',
    description: 'Inscreva-se em hackathons e desafios de inovação promovidos pela prefeitura',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'INSCRICAO_HACKATHON',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 2,
    category: 'Eventos',
    icon: 'Code',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone', 'citizen_occupation'],
      properties: {
        eventoInteresse: { type: 'string', title: 'Evento de Interesse', maxLength: 200 },
        tipoParticipacao: { type: 'string', title: 'Tipo de Participação', enum: ['Individual', 'Em Equipe (já formada)', 'Busco Equipe'] },
        nomeEquipe: { type: 'string', title: 'Nome da Equipe (se já formada)', maxLength: 100 },
        quantidadeMembros: { type: 'integer', title: 'Quantidade de Membros da Equipe (se já formada)', minimum: 1, maximum: 10 },
        areaAtuacao: { type: 'array', title: 'Área de Atuação/Especialidade', items: { type: 'string', enum: ['Desenvolvimento', 'Design/UX', 'Negócios', 'Marketing', 'Dados/Analytics', 'IA/Machine Learning', 'Hardware/IoT', 'Outro'] }, minItems: 1 },
        linguagensProgramacao: { type: 'string', title: 'Linguagens de Programação (se aplicável)', maxLength: 300 },
        experienciaHackathon: { type: 'string', title: 'Experiência em Hackathons', enum: ['Primeira Vez', '1-2 eventos', '3-5 eventos', 'Mais de 5 eventos'] },
        motivacaoParticipacao: { type: 'string', title: 'Motivação para Participar', maxLength: 500, widget: 'textarea' },
        ideiaInicial: { type: 'string', title: 'Ideia Inicial (se houver)', maxLength: 500, widget: 'textarea' },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', maxLength: 300, widget: 'textarea' }
      },
      required: ['eventoInteresse', 'tipoParticipacao', 'areaAtuacao', 'experienciaHackathon', 'motivacaoParticipacao']
    }
  },

  {
    name: 'Solicitação de Integração via API',
    description: 'Solicite credenciais e documentação para integrar sistemas com APIs municipais',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'API_INTEGRACAO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ da Empresa', 'Contrato Social', 'Termo de Uso e Responsabilidade', 'Documentação Técnica do Sistema'],
    estimatedDays: 15,
    priority: 3,
    category: 'Integração',
    icon: 'Link',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        nomeEmpresa: { type: 'string', title: 'Nome da Empresa/Organização', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$' },
        nomeSistema: { type: 'string', title: 'Nome do Sistema a Integrar', maxLength: 200 },
        tipoSistema: { type: 'string', title: 'Tipo de Sistema', enum: ['Web', 'Mobile', 'Desktop', 'Backend/Microserviço', 'BI/Analytics', 'Outro'] },
        apiInteresse: { type: 'array', title: 'APIs de Interesse', items: { type: 'string', enum: ['Dados Abertos', 'Serviços ao Cidadão', 'Geolocalização', 'Protocolos', 'Tributos', 'Saúde', 'Educação', 'Transportes', 'Outra'] }, minItems: 1 },
        finalidadeUso: { type: 'string', title: 'Finalidade do Uso', maxLength: 1000, widget: 'textarea' },
        volumeRequisicoes: { type: 'string', title: 'Volume Estimado de Requisições/Dia', enum: ['Até 100', '100-1000', '1000-10000', '10000-100000', 'Mais de 100000'] },
        tecnologiasUtilizadas: { type: 'string', title: 'Tecnologias Utilizadas', maxLength: 300 },
        ambienteTeste: { type: 'boolean', title: 'Necessita Ambiente de Testes' },
        dataPrevisaoGolive: { type: 'string', title: 'Data Prevista para Go-Live', format: 'date' },
        contatoTecnico: { type: 'string', title: 'Nome do Contato Técnico', maxLength: 200 },
        emailTecnico: { type: 'string', title: 'E-mail do Contato Técnico', format: 'email' },
        telefoneTecnico: { type: 'string', title: 'Telefone do Contato Técnico', pattern: '^\\(?\\d{2}\\)?[\\s-]?\\d{4,5}-?\\d{4}$' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeEmpresa', 'cnpj', 'nomeSistema', 'tipoSistema', 'apiInteresse', 'finalidadeUso', 'volumeRequisicoes', 'tecnologiasUtilizadas', 'contatoTecnico', 'emailTecnico', 'telefoneTecnico']
    }
  },

  // ========== COM_DADOS - SOLICITACAO_SIMPLES (3) ==========

  {
    name: 'Suporte Técnico em Sistemas Municipais',
    description: 'Solicite suporte técnico para problemas em sistemas da prefeitura',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SUPORTE_TECNICO',
    requiresDocuments: false,
    estimatedDays: 2,
    priority: 4,
    category: 'Suporte',
    icon: 'HelpCircle',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_email', 'citizen_phone'],
      properties: {
        sistema: { type: 'string', title: 'Sistema com Problema', enum: ['Portal do Cidadão', 'Agendamento Online', 'Nota Fiscal Eletrônica', 'IPTU Digital', 'Protocolo Eletrônico', 'e-SUS', 'Sistema de Matrículas', 'Outro'] },
        tipoProblema: { type: 'string', title: 'Tipo de Problema', enum: ['Não Consigo Acessar', 'Erro ao Executar Função', 'Lentidão', 'Dados Incorretos', 'Não Carrega', 'Outro'] },
        descricaoProblema: { type: 'string', title: 'Descrição do Problema', maxLength: 1000, widget: 'textarea' },
        navegador: { type: 'string', title: 'Navegador Utilizado', enum: ['Chrome', 'Firefox', 'Edge', 'Safari', 'Outro'] },
        dispositivo: { type: 'string', title: 'Dispositivo', enum: ['Computador', 'Notebook', 'Tablet', 'Smartphone'] },
        urgente: { type: 'boolean', title: 'Problema Urgente' }
      },
      required: ['sistema', 'tipoProblema', 'descricaoProblema', 'navegador', 'dispositivo']
    }
  },

  {
    name: 'Denúncia de Problema em Sistema/Aplicativo',
    description: 'Reporte bugs, falhas de segurança ou problemas técnicos em sistemas municipais',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_PROBLEMA',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 4,
    category: 'Suporte',
    icon: 'Bug',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_email', 'citizen_phone'],
      properties: {
        sistemaAfetado: { type: 'string', title: 'Sistema/Aplicativo Afetado', maxLength: 200 },
        tipoProblema: { type: 'string', title: 'Tipo de Problema', enum: ['Bug/Erro', 'Falha de Segurança', 'Performance', 'Usabilidade', 'Dados Incorretos', 'Outro'] },
        severidade: { type: 'string', title: 'Severidade', enum: ['Baixa', 'Média', 'Alta', 'Crítica'] },
        descricao: { type: 'string', title: 'Descrição Detalhada do Problema', maxLength: 2000, widget: 'textarea' },
        passosReproduzir: { type: 'string', title: 'Passos para Reproduzir o Problema', maxLength: 1000, widget: 'textarea' },
        comportamentoEsperado: { type: 'string', title: 'Comportamento Esperado', maxLength: 500, widget: 'textarea' },
        ambiente: { type: 'string', title: 'Ambiente', maxLength: 200 }
      },
      required: ['sistemaAfetado', 'tipoProblema', 'severidade', 'descricao']
    }
  },

  {
    name: 'Sugestão de Melhoria em Sistemas',
    description: 'Envie sugestões de melhorias e novas funcionalidades para sistemas municipais',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SUGESTAO_MELHORIA',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 2,
    category: 'Inovação',
    icon: 'Lightbulb',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_email', 'citizen_phone'],
      properties: {
        sistema: { type: 'string', title: 'Sistema/Serviço', maxLength: 200 },
        tipoSugestao: { type: 'string', title: 'Tipo de Sugestão', enum: ['Nova Funcionalidade', 'Melhoria de Interface', 'Otimização de Processo', 'Integração com Outro Sistema', 'Acessibilidade', 'Outro'] },
        descricaoSugestao: { type: 'string', title: 'Descrição da Sugestão', maxLength: 1000, widget: 'textarea' },
        problemaResolve: { type: 'string', title: 'Que Problema Resolve', maxLength: 500, widget: 'textarea' },
        beneficiosEsperados: { type: 'string', title: 'Benefícios Esperados', maxLength: 500, widget: 'textarea' }
      },
      required: ['sistema', 'tipoSugestao', 'descricaoSugestao']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (6) ==========

  {
    name: 'Portal de Dados Abertos',
    description: 'Acesse dados públicos municipais em formato aberto e reutilizável',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Dados',
    icon: 'Database',
    color: '#3b82f6'
  },

  {
    name: 'Portal da Transparência',
    description: 'Consulte informações sobre gastos públicos, licitações e contratos',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Transparência',
    icon: 'Eye',
    color: '#10b981'
  },

  {
    name: 'Tutoriais e Manuais de Sistemas',
    description: 'Acesse tutoriais, vídeos e manuais de uso dos sistemas municipais',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Ajuda',
    icon: 'BookOpen',
    color: '#8b5cf6'
  },

  {
    name: 'Catálogo de Aplicativos Municipais',
    description: 'Conheça todos os aplicativos e sistemas disponíveis para cidadãos',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Informações',
    icon: 'Smartphone',
    color: '#06b6d4'
  },

  {
    name: 'Status dos Sistemas e Serviços',
    description: 'Consulte o status de disponibilidade dos sistemas e APIs municipais',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Monitoramento',
    icon: 'Activity',
    color: '#22c55e'
  },

  {
    name: 'Política de Privacidade e LGPD',
    description: 'Consulte informações sobre tratamento de dados pessoais e LGPD',
    departmentCode: 'TECNOLOGIA_INOVACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Privacidade',
    icon: 'ShieldCheck',
    color: '#6366f1'
  }
];
