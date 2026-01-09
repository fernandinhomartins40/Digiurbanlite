/**
 * SEED DE SERVIÇOS - SECRETARIA DE AGRICULTURA
 * Total: 14 serviços
 * - 11 serviços COM_DADOS (com formulário)
 * - 3 serviços SEM_DADOS (apenas documentos)
 */

import { ServiceDefinition } from './types';

export const agricultureServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (11) ==========

  {
    name: 'Cadastro de Produtor Rural',
    description: 'Registro oficial de produtores rurais do município para acesso a programas e benefícios',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PRODUTOR',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Residência', 'DAP - Declaração de Aptidão ao Pronaf (opcional)'],
    estimatedDays: 10,
    priority: 4,
    category: 'Cadastro',
    icon: 'Tractor',
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
    moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
    requiresDocuments: true,
    requiredDocuments: ['Escritura ou Contrato', 'CAR - Cadastro Ambiental Rural (opcional)', 'ITR - Imposto Territorial Rural (opcional)'],
    estimatedDays: 30,
    priority: 4,
    category: 'Cadastro',
    icon: 'Map',
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

  // ========== SERVIÇOS SEM_DADOS (3) ==========

  {
    name: 'Certidão de Produtor Rural',
    description: 'Emissão de certidão comprovando cadastro como produtor rural (usa dados do perfil do cidadão)',
    departmentCode: 'AGRICULTURA',
    serviceType: 'SEM_DADOS',
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
