/**
 * SEED DE SERVIÇOS - SECRETARIA DE AGRICULTURA
 * Total: 20 serviços (17 COM_DADOS + 3 SEM_DADOS)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const agricultureServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS - CAPTURA_COMPLETA (11) ==========

  {
    name: 'Cadastro de Produtor Rural',
    description: 'Registro oficial de produtores rurais do município para acesso a programas e benefícios',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_PRODUTOR',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Residência', 'DAP - Declaração de Aptidão ao Pronaf (opcional)'],
    estimatedDays: 10,
    priority: 4,
    category: 'Cadastro',
    icon: 'Tractor',
    color: '#16a34a',
    // Validação de unicidade: não permite múltiplos cadastros ativos
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'CADASTRO_PRODUTOR',
      validationFunction: 'validateCadastroProdutor'
    },
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
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        areaPropriedade: { type: 'number', title: 'Área da Propriedade (hectares)', minimum: 0 },
        tipoProducao: {
          type: 'string',
          title: 'Tipo de Produção',
          enum: ['Agricultura Familiar', 'Agricultura Comercial', 'Pecuária', 'Horticultura', 'Silvicultura', 'Outros']
        },
        possuiDAP: { type: 'boolean', title: 'Possui DAP?', default: false },
        numeroDAP: { type: 'string', title: 'Número da DAP', maxLength: 50 }
      },
      required: ['areaPropriedade', 'tipoProducao']
    }
  },

  {
    name: 'Solicitação de Máquinas e Equipamentos Agrícolas',
    description: 'Solicitação de uso de máquinas e equipamentos agrícolas da prefeitura',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'SOLICITACAO_MAQUINAS',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Propriedade ou Posse'],
    estimatedDays: 7,
    priority: 4,
    category: 'Máquinas',
    icon: 'Wrench',
    color: '#15803d',
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
        tipoMaquina: {
          type: 'string',
          title: 'Tipo de Máquina',
          enum: ['Trator', 'Grade', 'Arado', 'Plantadeira', 'Colheitadeira', 'Roçadeira', 'Pulverizador', 'Outros']
        },
        dataDesejada: { type: 'string', format: 'date', title: 'Data Desejada para Uso' },
        areaTrabalho: { type: 'number', title: 'Área a Ser Trabalhada (hectares)', minimum: 0 },
        descricaoNecessidade: { type: 'string', title: 'Descrição da Necessidade', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoMaquina', 'dataDesejada', 'areaTrabalho']
    }
  },

  {
    name: 'Inscrição na Feira do Produtor',
    description: 'Inscrição para participar da feira municipal de produtores rurais',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'FEIRA_PRODUTOR',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Residência'],
    estimatedDays: 5,
    priority: 3,
    category: 'Feira',
    icon: 'Store',
    color: '#166534',
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
        tipoProdutos: {
          type: 'string',
          title: 'Tipo de Produtos',
          enum: ['Hortaliças', 'Frutas', 'Legumes', 'Produtos Artesanais', 'Ovos', 'Mel', 'Outros']
        },
        possuiBarracaPropria: { type: 'boolean', title: 'Possui Barraca Própria?', default: false },
        quantidadeProdutos: { type: 'number', title: 'Quantidade de Produtos Diferentes', minimum: 1 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['tipoProdutos', 'quantidadeProdutos']
    }
  },

  {
    name: 'Assistência Técnica Rural',
    description: 'Solicitação de assistência técnica rural (ATER) para produtores',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ASSISTENCIA_TECNICA',
    requiresDocuments: true,
    requiredDocuments: ['Cadastro de Produtor Rural (opcional)', 'Documento da Propriedade (opcional)'],
    estimatedDays: 15,
    priority: 4,
    category: 'Assistência',
    icon: 'Headphones',
    color: '#059669',
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
        tipoAssistencia: {
          type: 'string',
          title: 'Tipo de Assistência',
          enum: ['Análise de Solo', 'Controle de Pragas', 'Manejo de Irrigação', 'Produção Animal', 'Produção Vegetal', 'Outros']
        },
        enderecoPropriedade: { type: 'string', title: 'Endereço da Propriedade', maxLength: 300 },
        areaPropriedade: { type: 'number', title: 'Área da Propriedade (hectares)', minimum: 0 },
        descricaoProblema: { type: 'string', title: 'Descrição do Problema', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoAssistencia', 'enderecoPropriedade', 'descricaoProblema']
    }
  },

  {
    name: 'Cadastro de Propriedade Rural',
    description: 'Cadastro e regularização de propriedades rurais no município',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
    requiresDocuments: true,
    requiredDocuments: ['Escritura ou Contrato', 'CAR - Cadastro Ambiental Rural (opcional)', 'ITR - Imposto Territorial Rural (opcional)'],
    estimatedDays: 30,
    priority: 4,
    category: 'Cadastro',
    icon: 'Map',
    color: '#059669',
    // Permite múltiplas propriedades
    allowMultipleActiveProtocols: true,
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
        nomePropriedade: { type: 'string', title: 'Nome da Propriedade', maxLength: 200 },
        localizacao: { type: 'string', title: 'Endereço/Localização', maxLength: 300 },
        areaTotal: { type: 'number', title: 'Área Total (hectares)', minimum: 0 },
        areaCultivavel: { type: 'number', title: 'Área Cultivável (hectares)', minimum: 0 },
        numeroCAR: { type: 'string', title: 'CAR - Cadastro Ambiental Rural', maxLength: 50 },
        principalAtividade: {
          type: 'string',
          title: 'Principal Atividade',
          enum: ['Agricultura', 'Pecuária', 'Mista', 'Extrativismo', 'Outros']
        },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['nomePropriedade', 'localizacao', 'areaTotal', 'principalAtividade']
    }
  },

  {
    name: 'Solicitação de Atendimento Geral - Agricultura',
    description: 'Registro de solicitações e atendimentos gerais da Secretaria de Agricultura',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ATENDIMENTOS_AGRICULTURA',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Atendimento',
    icon: 'Sprout',
    color: '#10b981',
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
          enum: ['Informações', 'Reclamação', 'Sugestão', 'Dúvida Técnica', 'Outros']
        },
        assunto: {
          type: 'string',
          title: 'Assunto',
          enum: ['Cadastros', 'Programas', 'Máquinas', 'Assistência Técnica', 'Feira do Produtor', 'Outros']
        },
        descricaoSolicitacao: { type: 'string', title: 'Descrição da Solicitação', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoAtendimento', 'assunto', 'descricaoSolicitacao']
    }
  },

  {
    name: 'Inscrição em Programas Rurais',
    description: 'Inscrição em programas de apoio ao produtor rural (sementes, insumos, capacitações, etc.)',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'INSCRICAO_PROGRAMA_RURAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Residência', 'Cadastro de Produtor Rural (opcional)'],
    estimatedDays: 15,
    priority: 4,
    category: 'Programas',
    icon: 'FileCheck',
    color: '#16a34a',
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
        tipoPrograma: {
          type: 'string',
          title: 'Tipo de Programa',
          enum: ['Distribuição de Sementes', 'Distribuição de Mudas', 'Capacitação Técnica', 'Apoio à Comercialização', 'Outros']
        },
        nomePrograma: { type: 'string', title: 'Nome do Programa', maxLength: 200 },
        areaBeneficiar: { type: 'number', title: 'Área a Beneficiar (hectares)', minimum: 0 },
        justificativa: { type: 'string', title: 'Justificativa/Necessidade', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoPrograma', 'nomePrograma', 'justificativa']
    }
  },

  {
    name: 'Solicitação de Análise de Solo',
    description: 'Solicitação de coleta e análise de solo para recomendação de cultivo',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ANALISE_SOLO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Cadastro de Produtor Rural (opcional)'],
    estimatedDays: 20,
    priority: 4,
    category: 'Assistência',
    icon: 'TestTube',
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
        localizacaoPropriedade: { type: 'string', title: 'Localização da Propriedade', maxLength: 300 },
        areaAnalise: { type: 'number', title: 'Área para Análise (hectares)', minimum: 0 },
        finalidade: {
          type: 'string',
          title: 'Finalidade',
          enum: ['Plantio Anual', 'Plantio Perene', 'Horticultura', 'Pastagem', 'Outros']
        },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['localizacaoPropriedade', 'areaAnalise', 'finalidade']
    }
  },

  {
    name: 'Licença para Eventos Rurais',
    description: 'Solicitação de licença para realização de eventos rurais (feiras, exposições, leilões)',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'LICENCA_EVENTOS_RURAIS',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'CNPJ (se pessoa jurídica)', 'Projeto do Evento'],
    estimatedDays: 30,
    priority: 3,
    category: 'Licenças',
    icon: 'Calendar',
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
        nomeEvento: { type: 'string', title: 'Nome do Evento', maxLength: 200 },
        tipoEvento: {
          type: 'string',
          title: 'Tipo de Evento',
          enum: ['Feira', 'Exposição', 'Leilão', 'Rodeio', 'Festival', 'Outros']
        },
        dataEvento: { type: 'string', format: 'date', title: 'Data do Evento' },
        localEvento: { type: 'string', title: 'Local do Evento', maxLength: 300 },
        publicoEsperado: { type: 'number', title: 'Público Esperado', minimum: 1 },
        descricaoEvento: { type: 'string', title: 'Descrição do Evento', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeEvento', 'tipoEvento', 'dataEvento', 'localEvento', 'publicoEsperado']
    }
  },

  {
    name: 'Cadastro de Piscicultura',
    description: 'Cadastro de produtores de piscicultura (criação de peixes)',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_PISCICULTURA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Propriedade', 'Licença Ambiental (se houver)'],
    estimatedDays: 15,
    priority: 4,
    category: 'Cadastro',
    icon: 'Fish',
    color: '#0891b2',
    // Validação de unicidade: um cadastro de piscicultura por cidadão
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'CADASTRO_PISCICULTURA',
      validationFunction: 'validateCadastroPiscicultura'
    },
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
        localizacaoTanques: { type: 'string', title: 'Localização dos Tanques', maxLength: 300 },
        numeroTanques: { type: 'integer', title: 'Número de Tanques', minimum: 1 },
        areaLaminaAgua: { type: 'number', title: 'Área de Lâmina d\'Água (m²)', minimum: 1 },
        especiesCriadas: { type: 'string', title: 'Espécies Criadas', maxLength: 200 },
        finalidadeProducao: { type: 'string', title: 'Finalidade da Produção', enum: ['Comercial', 'Subsistência', 'Mista'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['localizacaoTanques', 'numeroTanques', 'areaLaminaAgua', 'especiesCriadas', 'finalidadeProducao']
    }
  },

  {
    name: 'Cadastro de Agroindústria Familiar',
    description: 'Cadastro de agroindústrias familiares para beneficiamento de produtos agrícolas',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_AGROINDUSTRIA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'CNPJ (se houver)', 'Licença Sanitária', 'Comprovante de Endereço da Agroindústria'],
    estimatedDays: 20,
    priority: 4,
    category: 'Cadastro',
    icon: 'Factory',
    color: '#ea580c',
    // Validação de unicidade: uma agroindústria por cidadão
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'CADASTRO_AGROINDUSTRIA',
      validationFunction: 'validateCadastroAgroindustria'
    },
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
        nomeAgroindustria: { type: 'string', title: 'Nome da Agroindústria', maxLength: 200 },
        enderecoAgroindustria: { type: 'string', title: 'Endereço da Agroindústria', maxLength: 300 },
        tipoProduto: { type: 'string', title: 'Tipo de Produto', enum: ['Laticínios', 'Doces/Geleias', 'Embutidos', 'Panificação', 'Conservas', 'Polpa de Frutas', 'Outros'] },
        producaoMensal: { type: 'string', title: 'Produção Mensal Estimada', maxLength: 100 },
        possuiRegistroSanitario: { type: 'boolean', title: 'Possui Registro Sanitário?' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['nomeAgroindustria', 'enderecoAgroindustria', 'tipoProduto', 'possuiRegistroSanitario']
    }
  },

  // ========== SERVIÇOS COM_DADOS - SOLICITACAO_SIMPLES (6) ==========

  {
    name: 'Licença para Perfuração de Poço',
    description: 'Solicitação de licença para perfuração de poço artesiano ou semi-artesiano',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'LICENCA_PERFURACAO_POCO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Propriedade', 'Projeto Técnico'],
    estimatedDays: 30,
    priority: 4,
    category: 'Licenças',
    icon: 'Droplet',
    color: '#0284c7',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        localizacaoPropriedade: { type: 'string', title: 'Localização da Propriedade', maxLength: 300 },
        tipoPoco: { type: 'string', title: 'Tipo de Poço', enum: ['Artesiano', 'Semi-artesiano', 'Cacimba'] },
        profundidadeEstimada: { type: 'number', title: 'Profundidade Estimada (metros)', minimum: 1 },
        finalidadeUso: { type: 'string', title: 'Finalidade do Uso', enum: ['Irrigação', 'Consumo Animal', 'Consumo Humano', 'Misto'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['localizacaoPropriedade', 'tipoPoco', 'profundidadeEstimada', 'finalidadeUso']
    }
  },

  {
    name: 'Programa de Hortas Comunitárias',
    description: 'Inscrição no programa de hortas comunitárias urbanas',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'PROGRAMA_HORTAS_COMUNITARIAS',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Residência'],
    estimatedDays: 10,
    priority: 3,
    category: 'Programas',
    icon: 'Leaf',
    color: '#22c55e',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        bairro: { type: 'string', title: 'Bairro de Preferência', maxLength: 100 },
        experienciaAgricola: { type: 'boolean', title: 'Possui Experiência em Agricultura?' },
        tamanhoArea: { type: 'string', title: 'Tamanho de Área Desejado', enum: ['Pequeno (10-20m²)', 'Médio (20-40m²)', 'Grande (40m² ou mais)'] },
        disponibilidadeSemanal: { type: 'string', title: 'Disponibilidade Semanal', maxLength: 100 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['bairro', 'experienciaAgricola', 'tamanhoArea']
    }
  },

  {
    name: 'Seguro Safra',
    description: 'Solicitação de adesão ao programa seguro safra',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SEGURO_SAFRA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'DAP', 'Comprovante de Área Plantada'],
    estimatedDays: 15,
    priority: 4,
    category: 'Programas',
    icon: 'Shield',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        numeroDAP: { type: 'string', title: 'Número da DAP', maxLength: 50 },
        culturasPrincipais: { type: 'string', title: 'Culturas Principais', maxLength: 200 },
        areaPlantada: { type: 'number', title: 'Área Plantada (hectares)', minimum: 0 },
        safraAno: { type: 'string', title: 'Safra/Ano', maxLength: 20 }
      },
      required: ['numeroDAP', 'culturasPrincipais', 'areaPlantada', 'safraAno']
    }
  },

  {
    name: 'DAP Digital - Declaração de Aptidão ao Pronaf',
    description: 'Solicitação de emissão da Declaração de Aptidão ao Pronaf (DAP) Digital',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DAP_DIGITAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Residência', 'Comprovante de Atividade Rural'],
    estimatedDays: 10,
    priority: 4,
    category: 'Documentação',
    icon: 'FileText',
    color: '#16a34a',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoDAP: { type: 'string', title: 'Tipo de DAP', enum: ['Principal', 'Cônjuge', 'Sucessor'] },
        areaPropriedade: { type: 'number', title: 'Área da Propriedade (hectares)', minimum: 0 },
        principalAtividade: { type: 'string', title: 'Principal Atividade', enum: ['Agricultura', 'Pecuária', 'Mista', 'Extrativismo', 'Pesca'] },
        rendaBrutaAnual: { type: 'number', title: 'Renda Bruta Anual Estimada (R$)', minimum: 0 }
      },
      required: ['tipoDAP', 'areaPropriedade', 'principalAtividade']
    }
  },

  {
    name: 'Programa de Distribuição de Sementes',
    description: 'Solicitação de sementes subsidiadas para plantio',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DISTRIBUICAO_SEMENTES',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Cadastro de Produtor Rural'],
    estimatedDays: 10,
    priority: 3,
    category: 'Programas',
    icon: 'Sprout',
    color: '#84cc16',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        tipoSemente: { type: 'string', title: 'Tipo de Semente', enum: ['Milho', 'Feijão', 'Hortaliças', 'Forrageiras', 'Outras'] },
        quantidadeDesejada: { type: 'string', title: 'Quantidade Desejada', maxLength: 100 },
        areaPlantio: { type: 'number', title: 'Área de Plantio (hectares)', minimum: 0 },
        epocaPlantio: { type: 'string', title: 'Época de Plantio Prevista', maxLength: 50 }
      },
      required: ['tipoSemente', 'areaPlantio']
    }
  },

  {
    name: 'Programa de Distribuição de Mudas',
    description: 'Solicitação de mudas frutíferas e florestais',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DISTRIBUICAO_MUDAS',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Propriedade ou Posse'],
    estimatedDays: 15,
    priority: 3,
    category: 'Programas',
    icon: 'TreePine',
    color: '#15803d',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        tipoMuda: { type: 'string', title: 'Tipo de Muda', enum: ['Frutíferas', 'Florestais Nativas', 'Ornamentais', 'Outras'] },
        especieDesejada: { type: 'string', title: 'Espécie Desejada', maxLength: 200 },
        quantidadeMudas: { type: 'integer', title: 'Quantidade de Mudas', minimum: 1 },
        finalidade: { type: 'string', title: 'Finalidade', enum: ['Reflorestamento', 'Pomar Doméstico', 'Comercial', 'Ornamentação', 'Outra'] }
      },
      required: ['tipoMuda', 'quantidadeMudas', 'finalidade']
    }
  },

  // ========== SERVIÇOS SEM_DADOS - CONSULTIVO (3) ==========

  {
    name: 'Certidão de Produtor Rural',
    description: 'Emissão de certidão comprovando cadastro como produtor rural (usa dados do perfil do cidadão)',
    departmentCode: 'AGRICULTURA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 7,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#16a34a'
  },

  {
    name: 'Declaração de Atividade Rural',
    description: 'Emissão de declaração comprovando exercício de atividade rural (usa dados do perfil do cidadão)',
    departmentCode: 'AGRICULTURA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 7,
    priority: 3,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#16a34a'
  },

  {
    name: 'Segunda Via de Cadastro de Produtor',
    description: 'Emissão de segunda via do cadastro de produtor rural (usa dados do perfil do cidadão)',
    departmentCode: 'AGRICULTURA',
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
  }
];
