/**
 * SEED DE SERVIÇOS - SECRETARIA DE MEIO AMBIENTE
 * Total: 8 serviços (5 COM_DADOS + 3 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const environmentServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (5) ==========

  {
    name: 'Licenciamento Ambiental',
    description: 'Solicitação de licença ambiental para atividades com impacto ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'LICENCIAMENTO_AMBIENTAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto', 'Estudo de Impacto Ambiental', 'ART'],
    estimatedDays: 60,
    priority: 5,
    category: 'Licenças',
    icon: 'Leaf',
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
        tipoAtividade: {
          type: 'string',
          title: 'Tipo de Atividade',
          maxLength: 200
        },
        areaImpacto: {
          type: 'number',
          title: 'Área de Impacto (hectares)',
          minimum: 0
        },
        medidasMitigacao: {
          type: 'string',
          title: 'Medidas de Mitigação',
          minLength: 50,
          maxLength: 2000,
          widget: 'textarea'
        }
      },
      required: ['tipoAtividade', 'areaImpacto', 'medidasMitigacao']
    }
  },

  {
    name: 'Autorização para Poda ou Supressão de Árvores',
    description: 'Solicitação de autorização para poda ou corte de árvores em propriedade privada ou pública',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'AUTORIZACAO_PODA_ARVORES',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Propriedade', 'Fotos do Local'],
    estimatedDays: 15,
    priority: 4,
    category: 'Autorizações',
    icon: 'TreeDeciduous',
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
        tipoSolicitacao: {
          type: 'string',
          title: 'Tipo de Solicitação',
          enum: ['Poda', 'Supressão (Corte Total)']
        },
        localArvore: {
          type: 'string',
          title: 'Local da Árvore',
          maxLength: 300
        },
        especie: {
          type: 'string',
          title: 'Espécie (se conhecida)',
          maxLength: 200
        },
        quantidadeArvores: {
          type: 'integer',
          title: 'Quantidade de Árvores',
          minimum: 1
        },
        justificativa: {
          type: 'string',
          title: 'Justificativa',
          minLength: 30,
          maxLength: 1000,
          widget: 'textarea'
        }
      },
      required: ['tipoSolicitacao', 'localArvore', 'quantidadeArvores', 'justificativa']
    }
  },

  {
    name: 'Denúncia Ambiental',
    description: 'Registro de denúncias de crimes ou infrações ambientais',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'DENUNCIA_AMBIENTAL',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 5,
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
        tipoDenuncia: {
          type: 'string',
          title: 'Tipo de Denúncia',
          enum: ['Poluição de Água', 'Poluição do Ar', 'Desmatamento', 'Queimada Ilegal', 'Descarte Irregular de Lixo', 'Maus-tratos a Animais', 'Outra']
        },
        localDenuncia: {
          type: 'string',
          title: 'Local da Infração',
          maxLength: 300
        },
        descricaoDenuncia: {
          type: 'string',
          title: 'Descrição Detalhada da Denúncia',
          minLength: 30,
          maxLength: 2000,
          widget: 'textarea'
        },
        denunciaAnonima: {
          type: 'boolean',
          title: 'Deseja fazer a denúncia de forma anônima?',
          default: false
        }
      },
      required: ['tipoDenuncia', 'localDenuncia', 'descricaoDenuncia']
    }
  },

  {
    name: 'Cadastro em Programa Ambiental',
    description: 'Inscrição em programas ambientais municipais (coleta seletiva, compostagem, educação ambiental)',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'PROGRAMA_AMBIENTAL',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 3,
    category: 'Programas',
    icon: 'Recycle',
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
        tipoPrograma: {
          type: 'string',
          title: 'Tipo de Programa',
          enum: ['Coleta Seletiva', 'Compostagem Doméstica', 'Educação Ambiental', 'Horta Comunitária', 'Reflorestamento', 'Outro']
        },
        motivoParticipacao: {
          type: 'string',
          title: 'Motivo da Participação',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['tipoPrograma']
    }
  },

  {
    name: 'Vistoria Ambiental',
    description: 'Solicitação de vistoria ambiental em propriedade ou empreendimento',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'VISTORIA_AMBIENTAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Propriedade'],
    estimatedDays: 20,
    priority: 4,
    category: 'Vistorias',
    icon: 'ClipboardCheck',
    color: '#0891b2',
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
        tipoVistoria: {
          type: 'string',
          title: 'Tipo de Vistoria',
          enum: ['Área de Preservação', 'Empreendimento', 'Propriedade Rural', 'Denúncia', 'Outro']
        },
        enderecoVistoria: {
          type: 'string',
          title: 'Endereço para Vistoria',
          maxLength: 300
        },
        finalidade: {
          type: 'string',
          title: 'Finalidade da Vistoria',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['tipoVistoria', 'enderecoVistoria', 'finalidade']
    }
  },

  // ========== SERVIÇOS SEM_DADOS (3) ==========

  {
    name: 'Certidão Ambiental',
    description: 'Emissão de certidão de regularidade ambiental (usa dados do perfil do cidadão)',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 15,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#16a34a'
  },

  {
    name: 'Declaração de Conformidade Ambiental',
    description: 'Emissão de declaração de conformidade com normas ambientais (usa dados do perfil do cidadão)',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 10,
    priority: 3,
    category: 'Declarações',
    icon: 'CheckCircle',
    color: '#059669'
  },

  {
    name: 'Laudo Técnico Ambiental',
    description: 'Emissão de laudo técnico ambiental (usa dados do perfil do cidadão)',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 30,
    priority: 4,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#0891b2'
  }
];
