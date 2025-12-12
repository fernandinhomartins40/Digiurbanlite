/**
 * SEED DE SERVIÇOS - SECRETARIA DE SEGURANÇA PÚBLICA
 * Total: 13 serviços (8 COM_DADOS + 5 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const publicSafetyServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (8) ==========

  {
    name: 'Registro de Boletim de Ocorrência',
    description: 'Registro de boletim de ocorrência para crimes, acidentes ou situações que necessitam de registro oficial',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_OCORRENCIA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF'],
    estimatedDays: 1,
    priority: 5,
    category: 'Ocorrências',
    icon: 'FileWarning',
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
        tipoOcorrencia: {
          type: 'string',
          title: 'Tipo de Ocorrência',
          enum: ['Furto', 'Roubo', 'Lesão Corporal', 'Ameaça', 'Dano ao Patrimônio', 'Perturbação do Sossego', 'Acidente de Trânsito', 'Desaparecimento', 'Outro']
        },
        dataHoraOcorrencia: {
          type: 'string',
          format: 'date-time',
          title: 'Data e Hora da Ocorrência'
        },
        localOcorrencia: {
          type: 'string',
          title: 'Local da Ocorrência',
          maxLength: 300
        },
        relatoDetalhado: {
          type: 'string',
          title: 'Relato Detalhado da Ocorrência',
          minLength: 50,
          maxLength: 2000,
          widget: 'textarea'
        },
        testemunhas: {
          type: 'string',
          title: 'Testemunhas (nomes e contatos)',
          maxLength: 500,
          widget: 'textarea'
        },
        envolvidos: {
          type: 'string',
          title: 'Pessoas Envolvidas',
          maxLength: 500,
          widget: 'textarea'
        },
        observacoes: {
          type: 'string',
          title: 'Observações',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['tipoOcorrencia', 'dataHoraOcorrencia', 'localOcorrencia', 'relatoDetalhado']
    }
  },

  {
    name: 'Solicitação de Patrulhamento',
    description: 'Solicitação de patrulhamento em área específica ou período determinado',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_PATRULHAMENTO',
    requiresDocuments: false,
    estimatedDays: 2,
    priority: 4,
    category: 'Patrulhamento',
    icon: 'Car',
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
        enderecoRonda: {
          type: 'string',
          title: 'Endereço da Área para Ronda',
          maxLength: 300
        },
        motivoSolicitacao: {
          type: 'string',
          title: 'Motivo da Solicitação',
          enum: ['Aumento de Criminalidade', 'Ponto de Drogas', 'Perturbação do Sossego', 'Vandalismo', 'Outro']
        },
        periodoPreferencial: {
          type: 'string',
          title: 'Período Preferencial',
          enum: ['Manhã', 'Tarde', 'Noite', 'Madrugada', 'Indiferente']
        },
        justificativa: {
          type: 'string',
          title: 'Justificativa Detalhada',
          minLength: 30,
          maxLength: 1000,
          widget: 'textarea'
        },
        observacoes: {
          type: 'string',
          title: 'Observações',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['enderecoRonda', 'motivoSolicitacao', 'justificativa']
    }
  },

  {
    name: 'Solicitação de Câmera de Segurança',
    description: 'Solicitação de instalação de câmera de monitoramento em via pública',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_CAMERA_SEGURANCA',
    requiresDocuments: true,
    requiredDocuments: ['Justificativa', 'Abaixo-assinado', 'Fotos do Local'],
    estimatedDays: 30,
    priority: 4,
    category: 'Câmeras',
    icon: 'Camera',
    color: '#7f1d1d',
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
        localInstalacao: {
          type: 'string',
          title: 'Local Sugerido para Instalação',
          maxLength: 300
        },
        motivoInstalacao: {
          type: 'string',
          title: 'Motivo da Solicitação',
          enum: ['Furtos Frequentes', 'Vandalismo', 'Tráfico de Drogas', 'Proteção de Equipamento Público', 'Outro']
        },
        numeroAssinaturas: {
          type: 'integer',
          title: 'Número de Assinaturas Coletadas',
          minimum: 1
        },
        justificativa: {
          type: 'string',
          title: 'Justificativa Detalhada',
          minLength: 50,
          maxLength: 1000,
          widget: 'textarea'
        },
        observacoes: {
          type: 'string',
          title: 'Observações',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['localInstalacao', 'motivoInstalacao', 'numeroAssinaturas', 'justificativa']
    }
  },

  {
    name: 'Denúncia Anônima (Disque Denúncia)',
    description: 'Registro de denúncias sobre atividades criminosas (pode ser anônima)',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'DENUNCIA_ANONIMA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 5,
    category: 'Denúncia',
    icon: 'AlertCircle',
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
        tipoDenuncia: {
          type: 'string',
          title: 'Tipo de Denúncia',
          enum: ['Tráfico de Drogas', 'Roubo/Furto', 'Violência Doméstica', 'Corrupção', 'Maus-tratos', 'Porte Ilegal de Arma', 'Outro']
        },
        localDenuncia: {
          type: 'string',
          title: 'Local da Denúncia',
          maxLength: 300
        },
        relatoDenuncia: {
          type: 'string',
          title: 'Relato Detalhado da Denúncia',
          minLength: 30,
          maxLength: 2000,
          widget: 'textarea'
        },
        denunciaAnonima: {
          type: 'boolean',
          title: 'Deseja fazer a denúncia de forma anônima?',
          default: false
        },
        observacoes: {
          type: 'string',
          title: 'Observações',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['tipoDenuncia', 'localDenuncia', 'relatoDenuncia']
    }
  },

  {
    name: 'Cadastro de Ponto Crítico',
    description: 'Registro de áreas de risco e vulnerabilidade para mapeamento de segurança',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PONTO_CRITICO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Mapeamento',
    icon: 'MapPin',
    color: '#f87171',
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
        localPontoCritico: {
          type: 'string',
          title: 'Local do Ponto Crítico',
          maxLength: 300
        },
        tipoPontoCritico: {
          type: 'string',
          title: 'Tipo de Ponto Crítico',
          enum: ['Alta Criminalidade', 'Tráfico de Drogas', 'Ponto de Prostituição', 'Vandalismo', 'Aglomeração de Pessoas', 'Outro']
        },
        descricaoSituacao: {
          type: 'string',
          title: 'Descrição da Situação',
          minLength: 30,
          maxLength: 1000,
          widget: 'textarea'
        },
        nivelGravidade: {
          type: 'string',
          title: 'Nível de Gravidade',
          enum: ['Baixo', 'Médio', 'Alto', 'Crítico']
        },
        observacoes: {
          type: 'string',
          title: 'Observações',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['localPontoCritico', 'tipoPontoCritico', 'descricaoSituacao', 'nivelGravidade']
    }
  },

  {
    name: 'Alerta de Segurança',
    description: 'Registro de avisos e alertas de segurança em tempo real',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'ALERTA_SEGURANCA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 5,
    category: 'Alerta',
    icon: 'Bell',
    color: '#fca5a5',
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
        tipoAlerta: {
          type: 'string',
          title: 'Tipo de Alerta',
          enum: ['Suspeito Circulando', 'Veículo Suspeito', 'Situação de Risco', 'Evento de Segurança', 'Outro']
        },
        localAlerta: {
          type: 'string',
          title: 'Local do Alerta',
          maxLength: 300
        },
        descricaoAlerta: {
          type: 'string',
          title: 'Descrição do Alerta',
          minLength: 20,
          maxLength: 1000,
          widget: 'textarea'
        },
        urgencia: {
          type: 'string',
          title: 'Nível de Urgência',
          enum: ['Baixa', 'Média', 'Alta', 'Emergencial']
        },
        observacoes: {
          type: 'string',
          title: 'Observações',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['tipoAlerta', 'localAlerta', 'descricaoAlerta', 'urgencia']
    }
  },

  {
    name: 'Autorização de Segurança para Eventos',
    description: 'Autorização de segurança para eventos com aglomeração de pessoas',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'AUTORIZACAO_EVENTO_SEGURANCA',
    requiresDocuments: true,
    requiredDocuments: ['Projeto do Evento', 'Plano de Segurança', 'Seguro (opcional)'],
    estimatedDays: 15,
    priority: 4,
    category: 'Autorizações',
    icon: 'Shield',
    color: '#991b1b',
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
        nomeEvento: {
          type: 'string',
          title: 'Nome do Evento',
          maxLength: 200
        },
        tipoEvento: {
          type: 'string',
          title: 'Tipo de Evento',
          enum: ['Show', 'Festival', 'Evento Esportivo', 'Festa Popular', 'Manifestação', 'Outro']
        },
        dataEvento: {
          type: 'string',
          format: 'date',
          title: 'Data do Evento'
        },
        localEvento: {
          type: 'string',
          title: 'Local do Evento',
          maxLength: 300
        },
        publicoEstimado: {
          type: 'integer',
          title: 'Público Estimado',
          minimum: 1
        },
        observacoes: {
          type: 'string',
          title: 'Observações',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['nomeEvento', 'tipoEvento', 'dataEvento', 'localEvento', 'publicoEstimado']
    }
  },

  {
    name: 'Laudo de Vistoria de Segurança',
    description: 'Solicitação de vistoria de segurança de estabelecimento comercial',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'LAUDO_VISTORIA_SEGURANCA',
    requiresDocuments: true,
    requiredDocuments: ['Alvará de Funcionamento', 'CNPJ'],
    estimatedDays: 15,
    priority: 3,
    category: 'Vistorias',
    icon: 'ClipboardCheck',
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
        nomeEstabelecimento: {
          type: 'string',
          title: 'Nome do Estabelecimento',
          maxLength: 200
        },
        cnpj: {
          type: 'string',
          title: 'CNPJ',
          maxLength: 18,
          pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$'
        },
        tipoEstabelecimento: {
          type: 'string',
          title: 'Tipo de Estabelecimento',
          enum: ['Comércio', 'Indústria', 'Serviços', 'Casa Noturna', 'Eventos', 'Outro']
        },
        enderecoEstabelecimento: {
          type: 'string',
          title: 'Endereço do Estabelecimento',
          maxLength: 300
        },
        finalidadeVistoria: {
          type: 'string',
          title: 'Finalidade da Vistoria',
          maxLength: 500,
          widget: 'textarea'
        }
      },
      required: ['nomeEstabelecimento', 'cnpj', 'tipoEstabelecimento', 'enderecoEstabelecimento', 'finalidadeVistoria']
    }
  },

  // ========== SERVIÇOS SEM_DADOS (5) ==========

  {
    name: 'Consulta de Estatísticas de Segurança',
    description: 'Consulta de estatísticas e análises regionais de segurança pública',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'BarChart',
    color: '#94a3b8'
  },

  {
    name: 'Certidão de Antecedentes',
    description: 'Emissão de certidão de antecedentes da guarda municipal',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Residência'],
    estimatedDays: 5,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#dc2626'
  },

  {
    name: 'Certidão de Ocorrência Policial',
    description: 'Emissão de certidão de registro de ocorrência policial',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Número da Ocorrência'],
    estimatedDays: 3,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#dc2626'
  },

  {
    name: 'Declaração de Perda de Documentos',
    description: 'Emissão de declaração de perda de documentos',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'BO (opcional)'],
    estimatedDays: 1,
    priority: 2,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#dc2626'
  },

  {
    name: 'Atestado de Bons Antecedentes',
    description: 'Emissão de atestado de bons antecedentes municipais',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Residência'],
    estimatedDays: 7,
    priority: 3,
    category: 'Atestados',
    icon: 'CheckCircle',
    color: '#dc2626'
  }
];
