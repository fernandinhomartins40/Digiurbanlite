/**
 * SEED DE SERVIÇOS - SECRETARIA DE PLANEJAMENTO URBANO
 * Total: 11 serviços (6 COM_DADOS + 5 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const urbanPlanningServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (6) ==========

  {
    name: 'Autorização de Parcelamento do Solo',
    description: 'Autorização para parcelamento, desmembramento ou remembramento de terreno',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'PARCELAMENTO_SOLO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'CNPJ (se empresa)', 'Matrícula do Imóvel', 'Projeto de Parcelamento', 'ART do Responsável Técnico'],
    estimatedDays: 30,
    priority: 5,
    category: 'Autorizações',
    icon: 'Grid',
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
        tipoParcelamento: {
          type: 'string',
          title: 'Tipo de Parcelamento',
          enum: ['Loteamento', 'Desmembramento', 'Remembramento']
        },
        matriculaImovel: {
          type: 'string',
          title: 'Matrícula do Imóvel',
          maxLength: 50
        },
        enderecoImovel: {
          type: 'string',
          title: 'Endereço Completo do Imóvel',
          maxLength: 300
        },
        areaTotal: {
          type: 'number',
          title: 'Área Total do Terreno (m²)',
          minimum: 1
        },
        numeroLotes: {
          type: 'integer',
          title: 'Número de Lotes Previsto',
          minimum: 1
        },
        nomeResponsavelTecnico: {
          type: 'string',
          title: 'Nome do Responsável Técnico',
          maxLength: 200
        },
        creaResponsavel: {
          type: 'string',
          title: 'CREA do Responsável Técnico',
          maxLength: 20
        },
        numeroART: {
          type: 'string',
          title: 'Número da ART',
          maxLength: 50
        },
        descricaoProjeto: {
          type: 'string',
          title: 'Descrição do Projeto',
          minLength: 50,
          maxLength: 2000,
          widget: 'textarea'
        }
      },
      required: ['tipoParcelamento', 'matriculaImovel', 'enderecoImovel', 'areaTotal', 'numeroLotes', 'nomeResponsavelTecnico', 'creaResponsavel', 'numeroART', 'descricaoProjeto']
    }
  },

  {
    name: 'Consulta de Viabilidade Urbanística',
    description: 'Consulta de viabilidade para empreendimentos imobiliários',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'VIABILIDADE_URBANISTICA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Matrícula do Imóvel', 'Memorial Descritivo'],
    estimatedDays: 15,
    priority: 4,
    category: 'Consultas',
    icon: 'Search',
    color: '#06b6d4',
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
        tipoEmpreendimento: {
          type: 'string',
          title: 'Tipo de Empreendimento',
          enum: ['Residencial', 'Comercial', 'Industrial', 'Misto', 'Institucional']
        },
        matriculaImovel: {
          type: 'string',
          title: 'Matrícula do Imóvel',
          maxLength: 50
        },
        enderecoImovel: {
          type: 'string',
          title: 'Endereço do Imóvel',
          maxLength: 300
        },
        areaTerreno: {
          type: 'number',
          title: 'Área do Terreno (m²)',
          minimum: 1
        },
        areaConstruir: {
          type: 'number',
          title: 'Área a Construir (m²)',
          minimum: 1
        },
        descricaoEmpreendimento: {
          type: 'string',
          title: 'Descrição do Empreendimento',
          minLength: 20,
          maxLength: 1000,
          widget: 'textarea'
        }
      },
      required: ['tipoEmpreendimento', 'matriculaImovel', 'enderecoImovel', 'areaTerreno', 'areaConstruir', 'descricaoEmpreendimento']
    }
  },

  {
    name: 'Aprovação de Projeto Arquitetônico',
    description: 'Aprovação de projetos de construção, reforma, ampliação ou regularização',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'APROVACAO_PROJETO_ARQUITETONICO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Arquitetônico', 'ART', 'Documentação do Imóvel'],
    estimatedDays: 30,
    priority: 5,
    category: 'Aprovação',
    icon: 'FileCheck',
    color: '#4f46e5',
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
        enderecoObra: {
          type: 'string',
          title: 'Endereço Completo da Obra',
          maxLength: 300
        },
        tipoProjeto: {
          type: 'string',
          title: 'Tipo de Projeto',
          enum: ['Construção Nova', 'Reforma', 'Ampliação', 'Regularização', 'Demolição']
        },
        areaTerreno: {
          type: 'number',
          title: 'Área do Terreno (m²)',
          minimum: 1
        },
        areaConstruir: {
          type: 'number',
          title: 'Área a Construir (m²)',
          minimum: 1
        },
        numeroMatricula: {
          type: 'string',
          title: 'Número da Matrícula do Imóvel',
          maxLength: 50
        },
        nomeResponsavelTecnico: {
          type: 'string',
          title: 'Nome do Responsável Técnico',
          maxLength: 200
        },
        creaResponsavel: {
          type: 'string',
          title: 'CREA do Responsável Técnico',
          maxLength: 50
        },
        numeroART: {
          type: 'string',
          title: 'Número da ART',
          maxLength: 50
        },
        descricaoProjeto: {
          type: 'string',
          title: 'Descrição do Projeto',
          minLength: 50,
          maxLength: 1000,
          widget: 'textarea'
        }
      },
      required: ['enderecoObra', 'tipoProjeto', 'areaTerreno', 'areaConstruir', 'numeroMatricula', 'nomeResponsavelTecnico', 'creaResponsavel', 'numeroART', 'descricaoProjeto']
    }
  },

  {
    name: 'Alvará de Construção',
    description: 'Solicitação de licença para execução de obra',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'ALVARA_CONSTRUCAO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Aprovado', 'Matrícula do Imóvel', 'ART'],
    estimatedDays: 20,
    priority: 5,
    category: 'Alvará',
    icon: 'Building',
    color: '#4338ca',
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
        enderecoObra: {
          type: 'string',
          title: 'Endereço Completo da Obra',
          maxLength: 300
        },
        numeroMatricula: {
          type: 'string',
          title: 'Número da Matrícula do Imóvel',
          maxLength: 50
        },
        numeroProjetoAprovado: {
          type: 'string',
          title: 'Número do Projeto Aprovado',
          maxLength: 50
        },
        dataAprovacaoProjeto: {
          type: 'string',
          format: 'date',
          title: 'Data de Aprovação do Projeto'
        },
        areaTotal: {
          type: 'number',
          title: 'Área Total da Construção (m²)',
          minimum: 1
        },
        numeroPavimentos: {
          type: 'integer',
          title: 'Número de Pavimentos',
          minimum: 1,
          maximum: 50
        },
        nomeResponsavelObra: {
          type: 'string',
          title: 'Nome do Responsável pela Obra',
          maxLength: 200
        },
        creaResponsavel: {
          type: 'string',
          title: 'CREA do Responsável',
          maxLength: 50
        },
        numeroART: {
          type: 'string',
          title: 'Número da ART de Execução',
          maxLength: 50
        },
        prazoObra: {
          type: 'integer',
          title: 'Prazo Estimado da Obra (meses)',
          minimum: 1,
          maximum: 120
        }
      },
      required: ['enderecoObra', 'numeroMatricula', 'numeroProjetoAprovado', 'dataAprovacaoProjeto', 'areaTotal', 'numeroPavimentos', 'nomeResponsavelObra', 'creaResponsavel', 'numeroART']
    }
  },

  {
    name: 'Alvará de Funcionamento',
    description: 'Licença comercial para estabelecimentos',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'ALVARA_FUNCIONAMENTO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Contrato Social', 'Laudo Técnico', 'Comprovante de Endereço'],
    estimatedDays: 15,
    priority: 5,
    category: 'Alvará',
    icon: 'Store',
    color: '#3730a3',
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
        razaoSocial: {
          type: 'string',
          title: 'Razão Social da Empresa',
          maxLength: 200
        },
        nomeFantasia: {
          type: 'string',
          title: 'Nome Fantasia',
          maxLength: 200
        },
        cnpj: {
          type: 'string',
          title: 'CNPJ',
          pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$',
          maxLength: 18
        },
        enderecoEstabelecimento: {
          type: 'string',
          title: 'Endereço Completo do Estabelecimento',
          maxLength: 300
        },
        areaEstabelecimento: {
          type: 'number',
          title: 'Área do Estabelecimento (m²)',
          minimum: 1
        },
        ramoAtividade: {
          type: 'string',
          title: 'Ramo de Atividade',
          maxLength: 200
        },
        numeroFuncionarios: {
          type: 'integer',
          title: 'Número de Funcionários',
          minimum: 0
        },
        horarioFuncionamento: {
          type: 'string',
          title: 'Horário de Funcionamento',
          maxLength: 100
        }
      },
      required: ['razaoSocial', 'nomeFantasia', 'cnpj', 'enderecoEstabelecimento', 'areaEstabelecimento', 'ramoAtividade', 'numeroFuncionarios', 'horarioFuncionamento']
    }
  },

  {
    name: 'Denúncia de Construção Irregular',
    description: 'Registro de denúncias de obras irregulares ou sem licença',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 4,
    category: 'Denúncia',
    icon: 'AlertTriangle',
    color: '#dc2626',
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
        enderecoObraIrregular: {
          type: 'string',
          title: 'Endereço da Obra Irregular',
          maxLength: 300
        },
        tipoIrregularidade: {
          type: 'string',
          title: 'Tipo de Irregularidade',
          enum: ['Construção sem Licença', 'Ampliação Irregular', 'Obra em Área de Preservação', 'Desrespeito ao Projeto Aprovado', 'Invasão de Via Pública', 'Outra']
        },
        descricaoDenuncia: {
          type: 'string',
          title: 'Descrição Detalhada da Denúncia',
          minLength: 30,
          maxLength: 1000,
          widget: 'textarea'
        },
        denunciaAnonima: {
          type: 'boolean',
          title: 'Deseja fazer a denúncia de forma anônima?',
          default: false
        }
      },
      required: ['enderecoObraIrregular', 'tipoIrregularidade', 'descricaoDenuncia']
    }
  },

  // ========== SERVIÇOS SEM_DADOS (5) ==========

  {
    name: 'Consulta ao Plano Diretor e Zoneamento',
    description: 'Consulta de informações sobre Plano Diretor, zoneamento e uso do solo',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informações',
    icon: 'Map',
    color: '#94a3b8'
  },

  {
    name: 'Certidão de Zoneamento e Uso do Solo',
    description: 'Emissão de certidão de zoneamento e uso do solo de imóvel',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Matrícula do Imóvel ou Endereço Completo'],
    estimatedDays: 7,
    priority: 4,
    category: 'Certidões',
    icon: 'FileText',
    color: '#f59e0b'
  },

  {
    name: 'Declaração de Conformidade Urbanística',
    description: 'Declaração de que o imóvel está em conformidade com as normas urbanísticas',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'CNPJ (se empresa)', 'Matrícula do Imóvel', 'Projeto Aprovado'],
    estimatedDays: 10,
    priority: 4,
    category: 'Declarações',
    icon: 'CheckCircle',
    color: '#10b981'
  },

  {
    name: 'Laudo de Vistoria Urbanística',
    description: 'Laudo técnico de vistoria urbanística de imóvel',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Matrícula do Imóvel', 'Comprovante de Propriedade'],
    estimatedDays: 15,
    priority: 4,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#3b82f6'
  },

  {
    name: 'Atestado de Regularidade de Obra',
    description: 'Emissão de atestado confirmando regularidade da obra executada',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Alvará de Construção', 'ART'],
    estimatedDays: 15,
    priority: 3,
    category: 'Atestados',
    icon: 'CheckCircle',
    color: '#6366f1'
  }
];
