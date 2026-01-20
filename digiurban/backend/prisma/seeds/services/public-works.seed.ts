/**
 * SEED DE SERVIÇOS - SECRETARIA DE OBRAS PÚBLICAS
 * Total: 20 serviços (14 COM_DADOS + 6 SEM_DADOS)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const publicWorksServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS - CAPTURA_COMPLETA (9) ==========

  {
    name: 'Solicitação de Reparo de Via',
    description: 'Solicitação de reparo de ruas, calçadas e vias públicas',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'SOLICITACAO_REPARO_VIA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 4,
    category: 'Reparos',
    icon: 'Construction',
    color: '#f97316',
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
        tipoReparo: {
          type: 'string',
          title: 'Tipo de Reparo',
          enum: ['Buraco na Rua', 'Calçada Quebrada', 'Pavimentação Danificada', 'Meio-fio Quebrado', 'Outro']
        },
        enderecoProblema: {
          type: 'string',
          title: 'Endereço do Problema',
          maxLength: 300
        },
        descricaoProblema: {
          type: 'string',
          title: 'Descrição do Problema',
          minLength: 20,
          maxLength: 1000,
          widget: 'textarea'
        },
        gravidade: {
          type: 'string',
          title: 'Gravidade',
          enum: ['Baixa', 'Média', 'Alta', 'Urgente']
        }
      },
      required: ['tipoReparo', 'enderecoProblema', 'descricaoProblema', 'gravidade']
    }
  },

  {
    name: 'Autorização para Demolição',
    description: 'Solicitação de autorização para demolição de edificação',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AUTORIZACAO_DEMOLICAO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Matrícula do Imóvel', 'Projeto de Demolição', 'ART'],
    estimatedDays: 20,
    priority: 4,
    category: 'Autorizações',
    icon: 'HardHat',
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
        enderecoImovel: {
          type: 'string',
          title: 'Endereço do Imóvel',
          maxLength: 300
        },
        motivoDemolicao: {
          type: 'string',
          title: 'Motivo da Demolição',
          enum: ['Risco de Desabamento', 'Reforma Total', 'Obra Nova', 'Outro']
        },
        areaImovel: {
          type: 'number',
          title: 'Área do Imóvel (m²)',
          minimum: 1
        },
        nomeResponsavelTecnico: {
          type: 'string',
          title: 'Nome do Responsável Técnico',
          maxLength: 200
        },
        creaResponsavel: {
          type: 'string',
          title: 'CREA do Responsável',
          maxLength: 50
        }
      },
      required: ['enderecoImovel', 'motivoDemolicao', 'areaImovel', 'nomeResponsavelTecnico', 'creaResponsavel']
    }
  },

  {
    name: 'Autorização para Intervenção em Via Pública',
    description: 'Autorização para obras ou intervenções em vias públicas',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AUTORIZACAO_INTERVENCAO_VIA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'CNPJ (se empresa)', 'Projeto de Intervenção', 'ART'],
    estimatedDays: 15,
    priority: 4,
    category: 'Autorizações',
    icon: 'TrafficCone',
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
        tipoIntervencao: {
          type: 'string',
          title: 'Tipo de Intervenção',
          enum: ['Abertura de Vala', 'Passagem de Tubulação', 'Instalação de Poste', 'Pavimentação', 'Outro']
        },
        enderecoIntervencao: {
          type: 'string',
          title: 'Endereço da Intervenção',
          maxLength: 300
        },
        dataInicio: {
          type: 'string',
          format: 'date',
          title: 'Data de Início Prevista'
        },
        prazoObra: {
          type: 'integer',
          title: 'Prazo da Obra (dias)',
          minimum: 1
        },
        descricaoIntervencao: {
          type: 'string',
          title: 'Descrição da Intervenção',
          minLength: 30,
          maxLength: 1000,
          widget: 'textarea'
        }
      },
      required: ['tipoIntervencao', 'enderecoIntervencao', 'dataInicio', 'prazoObra', 'descricaoIntervencao']
    }
  },

  {
    name: 'Aprovação de Projeto de Construção',
    description: 'Solicitação de aprovação de projeto arquitetônico de construção',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'APROVACAO_PROJETO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Arquitetônico', 'ART', 'Matrícula do Imóvel', 'Planta de Situação'],
    estimatedDays: 30,
    priority: 5,
    category: 'Aprovações',
    icon: 'FileText',
    color: '#3b82f6',
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
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        tipoObra: { type: 'string', title: 'Tipo de Obra', enum: ['Residencial', 'Comercial', 'Industrial', 'Mista'] },
        areaTotal: { type: 'number', title: 'Área Total do Projeto (m²)', minimum: 1 },
        numeroAndares: { type: 'integer', title: 'Número de Andares', minimum: 1 },
        nomeResponsavelTecnico: { type: 'string', title: 'Nome do Responsável Técnico', maxLength: 200 },
        creaResponsavel: { type: 'string', title: 'CREA do Responsável', maxLength: 50 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoImovel', 'tipoObra', 'areaTotal', 'numeroAndares', 'nomeResponsavelTecnico', 'creaResponsavel']
    }
  },

  {
    name: 'Licença para Obra',
    description: 'Solicitação de licença para início de obra aprovada',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'LICENCA_OBRA',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Aprovado', 'ART', 'Matrícula do Imóvel', 'IPTU'],
    estimatedDays: 15,
    priority: 5,
    category: 'Licenças',
    icon: 'FileCheck',
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
        enderecoObra: { type: 'string', title: 'Endereço da Obra', maxLength: 300 },
        numeroProtocoloProjeto: { type: 'string', title: 'Número do Protocolo do Projeto Aprovado', maxLength: 50 },
        dataInicioPrevista: { type: 'string', format: 'date', title: 'Data de Início Prevista' },
        prazoExecucao: { type: 'integer', title: 'Prazo de Execução (meses)', minimum: 1 },
        nomeResponsavelTecnico: { type: 'string', title: 'Nome do Responsável Técnico', maxLength: 200 },
        creaResponsavel: { type: 'string', title: 'CREA do Responsável', maxLength: 50 }
      },
      required: ['enderecoObra', 'numeroProtocoloProjeto', 'dataInicioPrevista', 'prazoExecucao', 'nomeResponsavelTecnico', 'creaResponsavel']
    }
  },

  {
    name: 'Alvará de Reforma',
    description: 'Solicitação de alvará para reforma de edificação existente',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ALVARA_REFORMA',
    requiresDocuments: true,
    requiredDocuments: ['Projeto de Reforma', 'ART', 'Matrícula do Imóvel'],
    estimatedDays: 20,
    priority: 4,
    category: 'Licenças',
    icon: 'Wrench',
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
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        tipoReforma: { type: 'string', title: 'Tipo de Reforma', enum: ['Ampliação', 'Modificação Interna', 'Fachada', 'Estrutural', 'Outro'] },
        areaReforma: { type: 'number', title: 'Área da Reforma (m²)', minimum: 1 },
        descricaoReforma: { type: 'string', title: 'Descrição da Reforma', maxLength: 500, widget: 'textarea' },
        nomeResponsavelTecnico: { type: 'string', title: 'Nome do Responsável Técnico', maxLength: 200 },
        creaResponsavel: { type: 'string', title: 'CREA do Responsável', maxLength: 50 }
      },
      required: ['enderecoImovel', 'tipoReforma', 'areaReforma', 'descricaoReforma', 'nomeResponsavelTecnico', 'creaResponsavel']
    }
  },

  {
    name: 'Aprovação de Loteamento',
    description: 'Solicitação de aprovação de projeto de loteamento urbano',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'APROVACAO_LOTEAMENTO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto de Loteamento', 'Memorial Descritivo', 'Matrícula do Terreno', 'ART', 'Licença Ambiental'],
    estimatedDays: 90,
    priority: 5,
    category: 'Aprovações',
    icon: 'Map',
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
        nomeLoteamento: { type: 'string', title: 'Nome do Loteamento', maxLength: 200 },
        localizacao: { type: 'string', title: 'Localização', maxLength: 300 },
        areaTotal: { type: 'number', title: 'Área Total (m²)', minimum: 1 },
        numeroLotes: { type: 'integer', title: 'Número de Lotes', minimum: 1 },
        nomeResponsavelTecnico: { type: 'string', title: 'Nome do Responsável Técnico', maxLength: 200 },
        creaResponsavel: { type: 'string', title: 'CREA do Responsável', maxLength: 50 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeLoteamento', 'localizacao', 'areaTotal', 'numeroLotes', 'nomeResponsavelTecnico', 'creaResponsavel']
    }
  },

  {
    name: 'Regularização de Obra',
    description: 'Solicitação de regularização de obra executada sem licença',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'REGULARIZACAO_OBRA',
    requiresDocuments: true,
    requiredDocuments: ['Projeto As-Built', 'ART', 'Matrícula do Imóvel', 'Fotos da Edificação'],
    estimatedDays: 45,
    priority: 4,
    category: 'Regularização',
    icon: 'FileWarning',
    color: '#f97316',
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
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        anoConstructao: { type: 'integer', title: 'Ano de Construção', minimum: 1900 },
        areaEdificada: { type: 'number', title: 'Área Edificada (m²)', minimum: 1 },
        tipoEdificacao: { type: 'string', title: 'Tipo de Edificação', enum: ['Residencial', 'Comercial', 'Industrial', 'Mista'] },
        nomeResponsavelTecnico: { type: 'string', title: 'Nome do Responsável Técnico', maxLength: 200 },
        creaResponsavel: { type: 'string', title: 'CREA do Responsável', maxLength: 50 },
        motivoRegularizacao: { type: 'string', title: 'Motivo da Regularização', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoImovel', 'anoConstructao', 'areaEdificada', 'tipoEdificacao', 'nomeResponsavelTecnico', 'creaResponsavel']
    }
  },

  {
    name: 'Aprovação de Demolição Parcial',
    description: 'Solicitação de aprovação para demolição parcial de edificação',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'APROVACAO_DEMOLICAO_PARCIAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto de Demolição', 'ART', 'Matrícula do Imóvel'],
    estimatedDays: 15,
    priority: 4,
    category: 'Aprovações',
    icon: 'Hammer',
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
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        areaDemolir: { type: 'number', title: 'Área a Demolir (m²)', minimum: 1 },
        descricaoDemolicao: { type: 'string', title: 'Descrição da Demolição', maxLength: 500, widget: 'textarea' },
        motivoDemolicao: { type: 'string', title: 'Motivo da Demolição', enum: ['Reforma', 'Ampliação', 'Modificação', 'Risco Estrutural', 'Outro'] },
        nomeResponsavelTecnico: { type: 'string', title: 'Nome do Responsável Técnico', maxLength: 200 },
        creaResponsavel: { type: 'string', title: 'CREA do Responsável', maxLength: 50 }
      },
      required: ['enderecoImovel', 'areaDemolir', 'descricaoDemolicao', 'motivoDemolicao', 'nomeResponsavelTecnico', 'creaResponsavel']
    }
  },

  // ========== SERVIÇOS COM_DADOS - SOLICITACAO_SIMPLES (5) ==========

  {
    name: 'Vistoria Técnica de Edificação',
    description: 'Solicitação de vistoria técnica para avaliação de edificação',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'VISTORIA_TECNICA',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 4,
    category: 'Vistorias',
    icon: 'Eye',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        motivoVistoria: { type: 'string', title: 'Motivo da Vistoria', enum: ['Verificação Estrutural', 'Habite-se', 'Regularização', 'Laudo Técnico', 'Outro'] },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoImovel', 'motivoVistoria', 'descricao']
    }
  },

  {
    name: 'Aprovação de Muro e Gradil',
    description: 'Solicitação de aprovação para construção de muro ou gradil',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'APROVACAO_MURO',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 3,
    category: 'Aprovações',
    icon: 'Grid',
    color: '#64748b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        tipoObra: { type: 'string', title: 'Tipo de Obra', enum: ['Muro', 'Gradil', 'Muro com Gradil'] },
        alturaMuro: { type: 'number', title: 'Altura do Muro (metros)', minimum: 0.5 },
        extensao: { type: 'number', title: 'Extensão (metros lineares)', minimum: 1 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['enderecoImovel', 'tipoObra', 'alturaMuro', 'extensao']
    }
  },

  {
    name: 'Aprovação de Calçada',
    description: 'Solicitação de aprovação para construção ou reforma de calçada',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'APROVACAO_CALCADA',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 3,
    category: 'Aprovações',
    icon: 'Move',
    color: '#6b7280',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        tipoServico: { type: 'string', title: 'Tipo de Serviço', enum: ['Construção Nova', 'Reforma', 'Reparo'] },
        areaCalcada: { type: 'number', title: 'Área da Calçada (m²)', minimum: 1 },
        materiaisUtilizar: { type: 'string', title: 'Materiais a Utilizar', maxLength: 200 }
      },
      required: ['enderecoImovel', 'tipoServico', 'areaCalcada']
    }
  },

  {
    name: 'Vistoria Estrutural',
    description: 'Solicitação de vistoria para avaliação de segurança estrutural',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'VISTORIA_ESTRUTURAL',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 5,
    category: 'Vistorias',
    icon: 'AlertTriangle',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        problemaReportado: { type: 'string', title: 'Problema Reportado', enum: ['Rachaduras', 'Infiltração', 'Risco de Desabamento', 'Deslocamento', 'Outro'] },
        descricaoProblema: { type: 'string', title: 'Descrição do Problema', maxLength: 500, widget: 'textarea' },
        urgente: { type: 'boolean', title: 'Situação de Urgência' }
      },
      required: ['enderecoImovel', 'problemaReportado', 'descricaoProblema']
    }
  },

  {
    name: 'Aprovação de Terraplanagem',
    description: 'Solicitação de aprovação para serviços de terraplanagem',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'APROVACAO_TERRAPLENO',
    requiresDocuments: false,
    estimatedDays: 20,
    priority: 4,
    category: 'Aprovações',
    icon: 'Mountain',
    color: '#92400e',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        enderecoTerreno: { type: 'string', title: 'Endereço do Terreno', maxLength: 300 },
        areaTerreno: { type: 'number', title: 'Área do Terreno (m²)', minimum: 1 },
        tipoServico: { type: 'string', title: 'Tipo de Serviço', enum: ['Corte', 'Aterro', 'Nivelamento', 'Misto'] },
        volumeMovimentacao: { type: 'number', title: 'Volume de Movimentação Estimado (m³)', minimum: 1 },
        finalidade: { type: 'string', title: 'Finalidade', maxLength: 300, widget: 'textarea' }
      },
      required: ['enderecoTerreno', 'areaTerreno', 'tipoServico', 'finalidade']
    }
  },

  // ========== SERVIÇOS SEM_DADOS - CONSULTIVO (6) ==========

  {
    name: 'Certidão de Numeração Predial',
    description: 'Emissão de certidão de numeração predial (usa dados do perfil do cidadão)',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'Hash',
    color: '#6366f1'
  },

  {
    name: 'Habite-se',
    description: 'Emissão de habite-se (certificado de conclusão de obra) (usa dados do perfil do cidadão)',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 20,
    priority: 4,
    category: 'Certificados',
    icon: 'Home',
    color: '#10b981'
  },

  {
    name: 'Laudo de Vistoria Técnica',
    description: 'Emissão de laudo de vistoria técnica de edificação (usa dados do perfil do cidadão)',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 15,
    priority: 3,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#3b82f6'
  },

  {
    name: 'Certidão de Área Construída',
    description: 'Emissão de certidão comprovando área construída do imóvel (usa dados do perfil do cidadão)',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 7,
    priority: 2,
    category: 'Certidões',
    icon: 'FileText',
    color: '#6366f1'
  },

  {
    name: 'Certidão de Conclusão de Obra',
    description: 'Emissão de certidão atestando conclusão de obra (usa dados do perfil do cidadão)',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'CheckCircle',
    color: '#10b981'
  },

  {
    name: 'Certidão de Área Non Aedificandi',
    description: 'Emissão de certidão de área non aedificandi (área de preservação) (usa dados do perfil do cidadão)',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'Shield',
    color: '#16a34a'
  }
];
