/**
 * SEED DE SERVIÇOS - SECRETARIA DE OBRAS PÚBLICAS
 * Total: 6 serviços (3 COM_DADOS + 3 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const publicWorksServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (3) ==========

  {
    name: 'Solicitação de Reparo de Via',
    description: 'Solicitação de reparo de ruas, calçadas e vias públicas',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
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

  // ========== SERVIÇOS SEM_DADOS (3) ==========

  {
    name: 'Certidão de Numeração Predial',
    description: 'Emissão de certidão de numeração predial',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Propriedade'],
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'Hash',
    color: '#6366f1'
  },

  {
    name: 'Habite-se',
    description: 'Emissão de habite-se (certificado de conclusão de obra)',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Alvará de Construção', 'ART', 'Fotos da Obra Concluída'],
    estimatedDays: 20,
    priority: 4,
    category: 'Certificados',
    icon: 'Home',
    color: '#10b981'
  },

  {
    name: 'Laudo de Vistoria Técnica',
    description: 'Emissão de laudo de vistoria técnica de edificação',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Propriedade', 'Solicitação Formal'],
    estimatedDays: 15,
    priority: 3,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#3b82f6'
  }
];
