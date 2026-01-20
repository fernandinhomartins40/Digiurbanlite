/**
 * SEED DE SERVIÇOS - SECRETARIA DE MEIO AMBIENTE
 * Total: 20 serviços (15 COM_DADOS + 5 SEM_DADOS)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const environmentServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (15) ==========

  {
    name: 'Licenciamento Ambiental',
    description: 'Solicitação de licença ambiental para atividades com impacto ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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

  {
    name: 'Licença Ambiental Simplificada',
    description: 'Licença ambiental para atividades de baixo impacto',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'LICENCA_AMBIENTAL_SIMPLIFICADA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Projeto Simplificado'],
    estimatedDays: 30,
    priority: 4,
    category: 'Licenças',
    icon: 'FileCheck',
    color: '#22c55e',
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
        areaTotal: {
          type: 'number',
          title: 'Área Total (m²)',
          minimum: 0
        },
        descricaoAtividade: {
          type: 'string',
          title: 'Descrição da Atividade',
          minLength: 30,
          maxLength: 1000,
          widget: 'textarea'
        }
      },
      required: ['tipoAtividade', 'areaTotal', 'descricaoAtividade']
    }
  },

  {
    name: 'Autorização Supressão Vegetal',
    description: 'Autorização para supressão de vegetação em área específica',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AUTORIZACAO_SUPRESSAO_VEGETAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Levantamento Topográfico', 'Fotos'],
    estimatedDays: 45,
    priority: 5,
    category: 'Autorizações',
    icon: 'TreePine',
    color: '#14532d',
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
        areaSupressao: {
          type: 'number',
          title: 'Área de Supressão (hectares)',
          minimum: 0
        },
        tipoVegetacao: {
          type: 'string',
          title: 'Tipo de Vegetação',
          enum: ['Mata Nativa', 'Mata Ciliar', 'Cerrado', 'Restinga', 'Mangue', 'Outro']
        },
        finalidade: {
          type: 'string',
          title: 'Finalidade da Supressão',
          maxLength: 500,
          widget: 'textarea'
        },
        medidasCompensatorias: {
          type: 'string',
          title: 'Medidas Compensatórias Propostas',
          maxLength: 1000,
          widget: 'textarea'
        }
      },
      required: ['areaSupressao', 'tipoVegetacao', 'finalidade']
    }
  },

  {
    name: 'Cadastro Gerador Resíduos',
    description: 'Cadastro de gerador de resíduos sólidos',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CADASTRO_GERADOR_RESIDUOS',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'CNPJ', 'Alvará de Funcionamento'],
    estimatedDays: 15,
    priority: 4,
    category: 'Cadastros',
    icon: 'Trash2',
    color: '#b91c1c',
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
        tipoResiduo: {
          type: 'string',
          title: 'Tipo de Resíduo',
          enum: ['Orgânico', 'Reciclável', 'Perigoso', 'Construção Civil', 'Eletrônico', 'Outro']
        },
        volumeMensal: {
          type: 'number',
          title: 'Volume Mensal Estimado (kg)',
          minimum: 0
        },
        formaDescarte: {
          type: 'string',
          title: 'Forma de Descarte Atual',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['tipoResiduo', 'volumeMensal', 'formaDescarte']
    }
  },

  {
    name: 'Denúncia Poluição Sonora',
    description: 'Registro de denúncia de poluição sonora',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_POLUICAO_SONORA',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 4,
    category: 'Denúncia',
    icon: 'Volume2',
    color: '#ef4444',
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
        localDenuncia: {
          type: 'string',
          title: 'Local da Denúncia',
          maxLength: 300
        },
        tipoFonte: {
          type: 'string',
          title: 'Tipo de Fonte Sonora',
          enum: ['Estabelecimento Comercial', 'Residência', 'Obra', 'Evento', 'Veículo', 'Igreja/Templo', 'Outro']
        },
        periodoOcorrencia: {
          type: 'string',
          title: 'Período de Ocorrência',
          enum: ['Manhã', 'Tarde', 'Noite', 'Madrugada', 'Todo o Dia']
        },
        descricao: {
          type: 'string',
          title: 'Descrição da Denúncia',
          maxLength: 1000,
          widget: 'textarea'
        },
        denunciaAnonima: {
          type: 'boolean',
          title: 'Deseja fazer denúncia anônima?',
          default: false
        }
      },
      required: ['localDenuncia', 'tipoFonte', 'periodoOcorrencia', 'descricao']
    }
  },

  {
    name: 'Denúncia Queimada',
    description: 'Registro de denúncia de queimada irregular',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_QUEIMADA',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 5,
    category: 'Denúncia',
    icon: 'Flame',
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
        localQueimada: {
          type: 'string',
          title: 'Local da Queimada',
          maxLength: 300
        },
        tipoArea: {
          type: 'string',
          title: 'Tipo de Área',
          enum: ['Terreno Urbano', 'Área Rural', 'Mata', 'Lixo', 'Outro']
        },
        extensaoAproximada: {
          type: 'string',
          title: 'Extensão Aproximada',
          maxLength: 200
        },
        descricao: {
          type: 'string',
          title: 'Descrição da Ocorrência',
          maxLength: 1000,
          widget: 'textarea'
        },
        denunciaAnonima: {
          type: 'boolean',
          title: 'Deseja fazer denúncia anônima?',
          default: false
        }
      },
      required: ['localQueimada', 'tipoArea', 'descricao']
    }
  },

  {
    name: 'Autorização Manejo Fauna',
    description: 'Autorização para manejo de fauna silvestre',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AUTORIZACAO_MANEJO_FAUNA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Projeto de Manejo', 'ART'],
    estimatedDays: 60,
    priority: 5,
    category: 'Autorizações',
    icon: 'Bird',
    color: '#047857',
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
        tipoManejo: {
          type: 'string',
          title: 'Tipo de Manejo',
          enum: ['Captura', 'Marcação', 'Translocação', 'Soltura', 'Monitoramento', 'Outro']
        },
        especiesEnvolvidas: {
          type: 'string',
          title: 'Espécies Envolvidas',
          maxLength: 300
        },
        localManejo: {
          type: 'string',
          title: 'Local do Manejo',
          maxLength: 300
        },
        justificativa: {
          type: 'string',
          title: 'Justificativa Técnica',
          minLength: 50,
          maxLength: 2000,
          widget: 'textarea'
        }
      },
      required: ['tipoManejo', 'especiesEnvolvidas', 'localManejo', 'justificativa']
    }
  },

  {
    name: 'Certidão Uso Solo',
    description: 'Emissão de certidão de uso e ocupação do solo',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CERTIDAO_USO_SOLO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Matrícula do Imóvel'],
    estimatedDays: 20,
    priority: 3,
    category: 'Certidões',
    icon: 'MapPin',
    color: '#0d9488',
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
        finalidade: {
          type: 'string',
          title: 'Finalidade da Certidão',
          enum: ['Financiamento', 'Compra e Venda', 'Licenciamento', 'Outro']
        },
        observacoes: {
          type: 'string',
          title: 'Observações',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['enderecoImovel', 'finalidade']
    }
  },

  {
    name: 'Licença Atividade Potencialmente Poluidora',
    description: 'Licença para atividades potencialmente poluidoras',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'LICENCA_ATIVIDADE_POLUIDORA',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Projeto Técnico', 'ART', 'Plano de Controle'],
    estimatedDays: 90,
    priority: 5,
    category: 'Licenças',
    icon: 'Factory',
    color: '#7c2d12',
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
        nomeEmpreendimento: {
          type: 'string',
          title: 'Nome do Empreendimento',
          maxLength: 200
        },
        tipoAtividade: {
          type: 'string',
          title: 'Tipo de Atividade',
          enum: ['Industrial', 'Comercial', 'Serviços', 'Agropecuária', 'Mineração', 'Outro']
        },
        potencialPoluidor: {
          type: 'string',
          title: 'Potencial Poluidor',
          enum: ['Baixo', 'Médio', 'Alto']
        },
        descricaoProcesso: {
          type: 'string',
          title: 'Descrição do Processo Produtivo',
          minLength: 50,
          maxLength: 2000,
          widget: 'textarea'
        }
      },
      required: ['nomeEmpreendimento', 'tipoAtividade', 'potencialPoluidor', 'descricaoProcesso']
    }
  },

  {
    name: 'Autorização Captação Água',
    description: 'Autorização para captação de água superficial ou subterrânea',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AUTORIZACAO_CAPTACAO_AGUA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Projeto Hidráulico', 'ART'],
    estimatedDays: 45,
    priority: 5,
    category: 'Autorizações',
    icon: 'Droplet',
    color: '#0284c7',
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
        tipoCaptacao: {
          type: 'string',
          title: 'Tipo de Captação',
          enum: ['Superficial', 'Subterrânea (Poço)', 'Mista']
        },
        finalidadeUso: {
          type: 'string',
          title: 'Finalidade do Uso',
          enum: ['Abastecimento Humano', 'Irrigação', 'Industrial', 'Dessedentação Animal', 'Outro']
        },
        vazaoSolicitada: {
          type: 'number',
          title: 'Vazão Solicitada (m³/h)',
          minimum: 0
        },
        localizacao: {
          type: 'string',
          title: 'Localização do Ponto de Captação',
          maxLength: 300
        }
      },
      required: ['tipoCaptacao', 'finalidadeUso', 'vazaoSolicitada', 'localizacao']
    }
  },

  {
    name: 'Cadastro Viveiro Mudas',
    description: 'Cadastro de viveiro de produção de mudas nativas',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CADASTRO_VIVEIRO_MUDAS',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Projeto do Viveiro', 'Fotos'],
    estimatedDays: 30,
    priority: 3,
    category: 'Cadastros',
    icon: 'Sprout',
    color: '#65a30d',
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
        nomeViveiro: {
          type: 'string',
          title: 'Nome do Viveiro',
          maxLength: 200
        },
        capacidadeProducao: {
          type: 'integer',
          title: 'Capacidade de Produção Anual (mudas)',
          minimum: 1
        },
        especiesProduzidas: {
          type: 'string',
          title: 'Principais Espécies Produzidas',
          maxLength: 500,
          widget: 'textarea'
        },
        areaViveiro: {
          type: 'number',
          title: 'Área do Viveiro (m²)',
          minimum: 0
        }
      },
      required: ['nomeViveiro', 'capacidadeProducao', 'especiesProduzidas', 'areaViveiro']
    }
  },

  {
    name: 'Denúncia Descarte Irregular',
    description: 'Denúncia de descarte irregular de resíduos',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_DESCARTE_IRREGULAR',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 5,
    category: 'Denúncia',
    icon: 'AlertOctagon',
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
        localDescarte: {
          type: 'string',
          title: 'Local do Descarte Irregular',
          maxLength: 300
        },
        tipoResiduo: {
          type: 'string',
          title: 'Tipo de Resíduo',
          enum: ['Entulho', 'Lixo Doméstico', 'Móveis', 'Eletrônicos', 'Pneus', 'Resíduos Perigosos', 'Outro']
        },
        volumeAproximado: {
          type: 'string',
          title: 'Volume Aproximado',
          enum: ['Pequeno', 'Médio', 'Grande']
        },
        descricao: {
          type: 'string',
          title: 'Descrição da Denúncia',
          maxLength: 1000,
          widget: 'textarea'
        },
        denunciaAnonima: {
          type: 'boolean',
          title: 'Deseja fazer denúncia anônima?',
          default: false
        }
      },
      required: ['localDescarte', 'tipoResiduo', 'volumeAproximado', 'descricao']
    }
  },

  // ========== SERVIÇOS SEM_DADOS (5) ==========

  {
    name: 'Certidão Ambiental',
    description: 'Emissão de certidão de regularidade ambiental (usa dados do perfil do cidadão)',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 30,
    priority: 4,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#0891b2'
  },

  {
    name: 'Segunda Via de Licença Ambiental',
    description: 'Emissão de segunda via de licenças e autorizações ambientais (usa dados do perfil do cidadão)',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 10,
    priority: 2,
    category: 'Documentos',
    icon: 'Copy',
    color: '#6b7280'
  }
];
