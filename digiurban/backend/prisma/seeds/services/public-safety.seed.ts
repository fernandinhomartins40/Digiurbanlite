/**
 * SEED DE SERVIÇOS - SECRETARIA DE SEGURANÇA PÚBLICA
 * Total: 20 serviços (13 COM_DADOS + 7 SEM_DADOS)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const publicSafetyServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (8) ==========

  {
    name: 'Registro de Boletim de Ocorrência',
    description: 'Registro de boletim de ocorrência para crimes, acidentes ou situações que necessitam de registro oficial',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CADASTRO_PONTO_CRITICO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Mapeamento',
    icon: 'MapPin',
    color: '#f87171',
    // Permite múltiplos: um cidadão pode cadastrar vários pontos críticos diferentes
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
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
    description: 'Emissão de certidão de antecedentes da guarda municipal (usa dados do perfil do cidadão)',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#dc2626'
  },

  {
    name: 'Certidão de Ocorrência Policial',
    description: 'Emissão de certidão de registro de ocorrência policial (usa dados do perfil do cidadão)',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 3,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#dc2626'
  },

  {
    name: 'Declaração de Perda de Documentos',
    description: 'Emissão de declaração de perda de documentos (usa dados do perfil do cidadão)',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 1,
    priority: 2,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#dc2626'
  },

  {
    name: 'Atestado de Bons Antecedentes',
    description: 'Emissão de atestado de bons antecedentes municipais (usa dados do perfil do cidadão)',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 7,
    priority: 3,
    category: 'Atestados',
    icon: 'CheckCircle',
    color: '#dc2626'
  },

  // ========== NOVOS SERVIÇOS (7) ==========

  {
    name: 'Cadastro de Câmeras de Segurança de Bairro',
    description: 'Cadastro e registro de câmeras comunitárias de segurança instaladas por moradores',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CADASTRO_CAMERAS_BAIRRO',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 3,
    category: 'Câmeras',
    icon: 'Camera',
    color: '#b91c1c',
    // Permite múltiplos: um cidadão pode cadastrar várias câmeras de segurança
    allowMultipleActiveProtocols: true,
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone', 'citizen_address', 'citizen_addressnumber', 'citizen_neighborhood'],
      properties: {
        localizacaoCamera: { type: 'string', title: 'Localização da Câmera', maxLength: 300 },
        tipoCamera: { type: 'string', title: 'Tipo de Câmera', enum: ['Fixa', 'Móvel', 'PTZ', 'Dome'] },
        alcanceVisao: { type: 'string', title: 'Alcance de Visão', maxLength: 100 },
        responsavelInstalacao: { type: 'string', title: 'Responsável pela Instalação', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['localizacaoCamera', 'tipoCamera', 'responsavelInstalacao']
    }
  },

  {
    name: 'Solicitação de Patrulha Escolar',
    description: 'Solicitação de patrulhamento em horários de entrada e saída de escolas',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'PATRULHA_ESCOLAR',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Patrulhamento',
    icon: 'School',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone', 'citizen_address', 'citizen_neighborhood'],
      properties: {
        nomeEscola: { type: 'string', title: 'Nome da Escola', maxLength: 200 },
        enderecoEscola: { type: 'string', title: 'Endereço da Escola', maxLength: 300 },
        horarioEntrada: { type: 'string', title: 'Horário de Entrada', maxLength: 10 },
        horarioSaida: { type: 'string', title: 'Horário de Saída', maxLength: 10 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', maxLength: 1000, widget: 'textarea' }
      },
      required: ['nomeEscola', 'enderecoEscola', 'horarioEntrada', 'horarioSaida', 'motivoSolicitacao']
    }
  },

  {
    name: 'Solicitação de Iluminação para Segurança',
    description: 'Solicitação de melhoria de iluminação pública em áreas de risco',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'ILUMINACAO_SEGURANCA',
    requiresDocuments: false,
    estimatedDays: 20,
    priority: 4,
    category: 'Infraestrutura',
    icon: 'Lightbulb',
    color: '#991b1b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone', 'citizen_address', 'citizen_neighborhood'],
      properties: {
        localIluminacao: { type: 'string', title: 'Local para Iluminação', maxLength: 300 },
        tipoProblema: { type: 'string', title: 'Tipo de Problema', enum: ['Falta de Iluminação', 'Iluminação Deficiente', 'Lâmpada Queimada', 'Outro'] },
        motivoSeguranca: { type: 'string', title: 'Motivo de Segurança', maxLength: 1000, widget: 'textarea' },
        urgencia: { type: 'string', title: 'Nível de Urgência', enum: ['Baixa', 'Média', 'Alta', 'Emergencial'] }
      },
      required: ['localIluminacao', 'tipoProblema', 'motivoSeguranca', 'urgencia']
    }
  },

  {
    name: 'Cadastro em Grupo de WhatsApp de Segurança de Vizinhança',
    description: 'Cadastro em grupos de WhatsApp de segurança colaborativa entre vizinhos',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'GRUPO_WHATSAPP_VIZINHANCA',
    requiresDocuments: false,
    estimatedDays: 2,
    priority: 2,
    category: 'Segurança Colaborativa',
    icon: 'Users',
    color: '#7f1d1d',
    // Permite múltiplos: um cidadão pode participar de vários grupos de vizinhança
    allowMultipleActiveProtocols: true,
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_address', 'citizen_neighborhood'],
      properties: {
        bairroInteresse: { type: 'string', title: 'Bairro de Interesse', maxLength: 100 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['bairroInteresse']
    }
  },

  {
    name: 'Denúncia de Violência Doméstica',
    description: 'Canal específico para denúncias de violência doméstica e familiar',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'DENUNCIA_VIOLENCIA_DOMESTICA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 5,
    category: 'Denúncia',
    icon: 'ShieldAlert',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email', 'citizen_address', 'citizen_neighborhood'],
      properties: {
        tipoDenuncia: { type: 'string', title: 'Tipo de Violência', enum: ['Física', 'Psicológica', 'Sexual', 'Patrimonial', 'Moral', 'Múltiplas'] },
        localOcorrencia: { type: 'string', title: 'Local da Ocorrência', maxLength: 300 },
        descricaoOcorrencia: { type: 'string', title: 'Descrição da Ocorrência', minLength: 30, maxLength: 2000, widget: 'textarea' },
        vitimaEmRisco: { type: 'boolean', title: 'Vítima em Risco Iminente?', default: false },
        denunciaAnonima: { type: 'boolean', title: 'Deseja fazer denúncia anônima?', default: false },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoDenuncia', 'localOcorrencia', 'descricaoOcorrencia']
    }
  },

  {
    name: 'SOS Mulher - Pedido de Ajuda Urgente',
    description: 'Canal de atendimento urgente para mulheres em situação de violência',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'SOS_MULHER',
    requiresDocuments: false,
    estimatedDays: 0,
    priority: 5,
    category: 'Emergência',
    icon: 'AlertTriangle',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_address', 'citizen_neighborhood'],
      properties: {
        situacaoEmergencia: { type: 'string', title: 'Descrição da Emergência', minLength: 20, maxLength: 1000, widget: 'textarea' },
        localizacaoAtual: { type: 'string', title: 'Localização Atual', maxLength: 300 },
        necessitaAbrigo: { type: 'boolean', title: 'Necessita Abrigo?', default: false },
        necessitaAtendimentoMedico: { type: 'boolean', title: 'Necessita Atendimento Médico?', default: false },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['situacaoEmergencia', 'localizacaoAtual']
    }
  },

  {
    name: 'Solicitação de Guarda Patrimonial',
    description: 'Solicitação de guarda patrimonial para proteção de bens públicos',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'GUARDA_PATRIMONIAL',
    requiresDocuments: true,
    requiredDocuments: ['Justificativa', 'Projeto ou Memorial', 'Autorização do Responsável'],
    estimatedDays: 10,
    priority: 3,
    category: 'Proteção Patrimonial',
    icon: 'Building',
    color: '#b91c1c',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone', 'citizen_address', 'citizen_neighborhood'],
      properties: {
        tipoBem: { type: 'string', title: 'Tipo de Bem', enum: ['Prédio Público', 'Praça', 'Monumento', 'Equipamento Urbano', 'Outro'] },
        localizacaoBem: { type: 'string', title: 'Localização do Bem', maxLength: 300 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', maxLength: 1000, widget: 'textarea' },
        periodoGuarda: { type: 'string', title: 'Período de Guarda', enum: ['Temporário', 'Permanente'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoBem', 'localizacaoBem', 'motivoSolicitacao', 'periodoGuarda']
    }
  }
];
