/**
 * SEED DE SERVIÇOS - SECRETARIA DE PLANEJAMENTO URBANO
 * Total: 20 serviços (9 COM_DADOS + 11 SEM_DADOS)
 * ✅ Atualizado com serviceSubtype e expandido
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const urbanPlanningServices: ServiceDefinition[] = [
  // ========== COM_DADOS - CAPTURA_COMPLETA (9) ==========

  {
    name: 'Autorização de Parcelamento do Solo',
    description: 'Autorização para parcelamento, desmembramento ou remembramento de terreno',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ALVARA_FUNCIONAMENTO_PLANEJAMENTO',
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
        'citizen_phone'
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

  // 🆕 NOVOS SERVIÇOS COM_DADOS (3)

  {
    name: 'Anuência para Remembramento de Lote',
    description: 'Autorização para unificação de lotes contíguos',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'REMEMBRAMENTO_LOTE',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Matrículas dos Lotes', 'Planta de Situação', 'ART'],
    estimatedDays: 25,
    priority: 4,
    category: 'Autorizações',
    icon: 'Combine',
    color: '#7c3aed',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_email',
        'citizen_phone',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_neighborhood'
      ],
      properties: {
        numeroLotes: {
          type: 'integer',
          title: 'Quantidade de Lotes a Unificar',
          minimum: 2,
          maximum: 10
        },
        matriculasLotes: {
          type: 'string',
          title: 'Matrículas dos Lotes (separadas por vírgula)',
          maxLength: 300
        },
        areaTotal: {
          type: 'number',
          title: 'Área Total Resultante (m²)',
          minimum: 1
        },
        enderecoLotes: {
          type: 'string',
          title: 'Endereço/Localização dos Lotes',
          maxLength: 300
        },
        finalidade: {
          type: 'string',
          title: 'Finalidade do Remembramento',
          enum: ['Residencial', 'Comercial', 'Industrial', 'Mista']
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
        observacoes: {
          type: 'string',
          title: 'Observações',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['numeroLotes', 'matriculasLotes', 'areaTotal', 'enderecoLotes', 'finalidade', 'nomeResponsavelTecnico', 'creaResponsavel']
    }
  },

  {
    name: 'Análise de Viabilidade de Empreendimento',
    description: 'Estudo de viabilidade técnica e urbanística para grandes empreendimentos',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ANALISE_VIABILIDADE_EMPREENDIMENTO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Projeto Preliminar', 'Estudo de Impacto', 'Matrícula do Terreno'],
    estimatedDays: 45,
    priority: 5,
    category: 'Análises',
    icon: 'LineChart',
    color: '#ea580c',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_email',
        'citizen_phone'
      ],
      properties: {
        nomeEmpreendimento: {
          type: 'string',
          title: 'Nome do Empreendimento',
          maxLength: 200
        },
        tipoEmpreendimento: {
          type: 'string',
          title: 'Tipo de Empreendimento',
          enum: ['Loteamento', 'Condomínio Residencial', 'Condomínio Comercial', 'Conjunto Habitacional', 'Shopping Center', 'Industrial', 'Outro']
        },
        matriculaTerreno: {
          type: 'string',
          title: 'Matrícula do Terreno',
          maxLength: 50
        },
        enderecoTerreno: {
          type: 'string',
          title: 'Endereço do Terreno',
          maxLength: 300
        },
        areaTerreno: {
          type: 'number',
          title: 'Área Total do Terreno (m²)',
          minimum: 1000
        },
        areaConstruir: {
          type: 'number',
          title: 'Área Total a Construir (m²)',
          minimum: 100
        },
        numeroUnidades: {
          type: 'integer',
          title: 'Número de Unidades/Lotes',
          minimum: 1
        },
        vagasEstacionamento: {
          type: 'integer',
          title: 'Vagas de Estacionamento Previstas',
          minimum: 0
        },
        descricaoDetalhada: {
          type: 'string',
          title: 'Descrição Detalhada do Empreendimento',
          minLength: 100,
          maxLength: 2000,
          widget: 'textarea'
        }
      },
      required: ['nomeEmpreendimento', 'tipoEmpreendimento', 'matriculaTerreno', 'enderecoTerreno', 'areaTerreno', 'areaConstruir', 'numeroUnidades', 'descricaoDetalhada']
    }
  },

  {
    name: 'Aprovação de Projeto de Urbanização',
    description: 'Aprovação de projeto de infraestrutura e urbanização de áreas',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'APROVACAO_PROJETO_URBANIZACAO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto de Urbanização', 'Memorial Descritivo', 'ART', 'Estudo Ambiental'],
    estimatedDays: 60,
    priority: 5,
    category: 'Aprovação',
    icon: 'MapPin',
    color: '#059669',
    formSchema: {
      type: 'object',
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_email',
        'citizen_phone',
        'citizen_address'
      ],
      properties: {
        nomeProjeto: {
          type: 'string',
          title: 'Nome do Projeto',
          maxLength: 200
        },
        localProjeto: {
          type: 'string',
          title: 'Localização do Projeto',
          maxLength: 300
        },
        areaAbrangencia: {
          type: 'number',
          title: 'Área de Abrangência (m²)',
          minimum: 500
        },
        tipoInfraestrutura: {
          type: 'array',
          title: 'Tipo de Infraestrutura',
          items: {
            type: 'string',
            enum: ['Pavimentação', 'Rede de Água', 'Rede de Esgoto', 'Drenagem', 'Iluminação Pública', 'Arborização', 'Calçadas', 'Mobiliário Urbano']
          }
        },
        extensaoVias: {
          type: 'number',
          title: 'Extensão de Vias (metros)',
          minimum: 0
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
        prazoExecucao: {
          type: 'integer',
          title: 'Prazo de Execução (meses)',
          minimum: 1,
          maximum: 36
        },
        descricaoObras: {
          type: 'string',
          title: 'Descrição das Obras de Urbanização',
          minLength: 100,
          maxLength: 2000,
          widget: 'textarea'
        }
      },
      required: ['nomeProjeto', 'localProjeto', 'areaAbrangencia', 'tipoInfraestrutura', 'nomeResponsavelTecnico', 'creaResponsavel', 'prazoExecucao', 'descricaoObras']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (11) ==========

  {
    name: 'Consulta ao Plano Diretor e Zoneamento',
    description: 'Consulta de informações sobre Plano Diretor, zoneamento e uso do solo',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 15,
    priority: 3,
    category: 'Atestados',
    icon: 'CheckCircle',
    color: '#6366f1'
  },

  // 🆕 NOVOS SERVIÇOS SEM_DADOS (6)

  {
    name: 'Consulta de Zoneamento por Endereço',
    description: 'Consulta rápida de zoneamento informando apenas o endereço',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'MapPin',
    color: '#64748b'
  },

  {
    name: 'Certidão de Diretrizes Urbanísticas',
    description: 'Certidão com diretrizes e restrições urbanísticas para imóvel',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 4,
    category: 'Certidões',
    icon: 'FileCheck',
    color: '#d97706'
  },

  {
    name: 'Mapa de Zoneamento Municipal',
    description: 'Acesso ao mapa digital de zoneamento do município',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Mapas',
    icon: 'Map',
    color: '#0891b2'
  },

  {
    name: 'Consulta de Legislação Urbanística',
    description: 'Acesso às leis e normas urbanísticas municipais',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Legislação',
    icon: 'BookOpen',
    color: '#475569'
  },

  {
    name: 'Informações sobre Plano Diretor',
    description: 'Consulta ao Plano Diretor Municipal e suas diretrizes',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informações',
    icon: 'Info',
    color: '#334155'
  },

  {
    name: 'Certidão de Uso e Ocupação do Solo',
    description: 'Certidão com informações sobre parâmetros de uso e ocupação',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#b45309'
  }
];
