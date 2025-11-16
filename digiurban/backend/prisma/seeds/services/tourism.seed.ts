/**
 * SEED DE SERVIÇOS - SECRETARIA DE TURISMO
 * Total: 15 serviços
 */

import { ServiceDefinition } from './types';

export const tourismServices: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Turismo',
    description: 'Registro geral de atendimentos na área turística',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_TURISMO',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Plane',
    color: '#3b82f6',
    formSchema: {
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
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'motivoAtendimento',
          label: 'Motivo do Atendimento',
          type: 'select',
          options: ['Informações Turísticas', 'Cadastro de Estabelecimento', 'Cadastro de Guia', 'Programa Turístico', 'Evento', 'Reclamação', 'Outro'],
          required: true
        },
        {
          id: 'descricaoAtendimento',
          label: 'Descrição do Atendimento',
          type: 'textarea',
          minLength: 10,
          maxLength: 1000,
          required: true
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Cadastro de Estabelecimento Turístico',
    description: 'Cadastro de hotéis, pousadas, restaurantes',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Alvará de Funcionamento', 'Documentação do Responsável'],
    estimatedDays: 10,
    priority: 4,
    category: 'Cadastro',
    icon: 'Building',
    color: '#2563eb',
    formSchema: {
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
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'nomeEstabelecimento',
          label: 'Nome do Estabelecimento',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'tipoEstabelecimento',
          label: 'Tipo de Estabelecimento',
          type: 'select',
          options: ['Hotel', 'Pousada', 'Hostel', 'Restaurante', 'Bar', 'Lanchonete', 'Agência de Turismo', 'Outro'],
          required: true
        },
        {
          id: 'cnpj',
          label: 'CNPJ',
          type: 'text',
          pattern: '^\\d{14}$',
          minLength: 14,
          maxLength: 14,
          required: true
        },
        {
          id: 'enderecoEstabelecimento',
          label: 'Endereço do Estabelecimento',
          type: 'text',
          minLength: 10,
          maxLength: 300,
          required: true
        },
        {
          id: 'cepEstabelecimento',
          label: 'CEP do Estabelecimento',
          type: 'text',
          pattern: '^\\d{8}$',
          required: true
        },
        {
          id: 'telefoneEstabelecimento',
          label: 'Telefone do Estabelecimento',
          type: 'text',
          pattern: '^\\d{10,11}$',
          required: true
        },
        {
          id: 'emailEstabelecimento',
          label: 'E-mail do Estabelecimento',
          type: 'email',
          required: false
        },
        {
          id: 'capacidadeAtendimento',
          label: 'Capacidade de Atendimento',
          type: 'number',
          minimum: 1,
          required: false
        },
        {
          id: 'descricaoServicos',
          label: 'Descrição dos Serviços',
          type: 'textarea',
          minLength: 30,
          maxLength: 1000,
          required: false
        },
        {
          id: 'horarioFuncionamento',
          label: 'Horário de Funcionamento',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Cadastro de Guia Turístico',
    description: 'Cadastro de guias de turismo credenciados',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_GUIA_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Cadastur', 'Certificado de Capacitação'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'User',
    color: '#1d4ed8',
    formSchema: {
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
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'numeroCadastur',
          label: 'Número do Cadastur',
          type: 'text',
          maxLength: 50,
          required: true
        },
        {
          id: 'especialidades',
          label: 'Especialidades',
          type: 'text',
          maxLength: 300,
          required: true
        },
        {
          id: 'idiomas',
          label: 'Idiomas que Fala',
          type: 'text',
          maxLength: 200,
          required: true
        },
        {
          id: 'tempoExperiencia',
          label: 'Tempo de Experiência',
          type: 'select',
          options: ['Menos de 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', 'Mais de 10 anos'],
          required: false
        },
        {
          id: 'certificacoes',
          label: 'Certificações e Cursos',
          type: 'textarea',
          maxLength: 500,
          required: false
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Inscrição em Programa Turístico',
    description: 'Inscrição em programas de desenvolvimento turístico',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ ou CPF', 'Projeto', 'Documentação do Estabelecimento'],
    estimatedDays: 15,
    priority: 4,
    category: 'Programas',
    icon: 'FileCheck',
    color: '#1e40af',
    formSchema: {
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
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'nomePrograma',
          label: 'Nome do Programa',
          type: 'text',
          maxLength: 200,
          required: true
        },
        {
          id: 'tipoPrograma',
          label: 'Tipo de Programa',
          type: 'select',
          options: ['Qualificação Profissional', 'Desenvolvimento de Produto', 'Marketing Turístico', 'Infraestrutura', 'Outro'],
          required: true
        },
        {
          id: 'tipoInscrito',
          label: 'Tipo de Inscrito',
          type: 'select',
          options: ['Pessoa Física', 'Pessoa Jurídica'],
          required: true
        },
        {
          id: 'cnpj',
          label: 'CNPJ (se pessoa jurídica)',
          type: 'text',
          pattern: '^\\d{14}$',
          required: false
        },
        {
          id: 'descricaoProjeto',
          label: 'Descrição do Projeto',
          type: 'textarea',
          minLength: 50,
          maxLength: 1000,
          required: true
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Registro de Atrativo Turístico',
    description: 'Cadastro de pontos turísticos e atrativos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_ATRATIVO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Fotos', 'Descrição', 'Localização GPS'],
    estimatedDays: 5,
    priority: 3,
    category: 'Atrativos',
    icon: 'MapPin',
    color: '#1e3a8a',
    formSchema: {
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
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'nomeAtrativo',
          label: 'Nome do Atrativo',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'tipoAtrativo',
          label: 'Tipo de Atrativo',
          type: 'select',
          options: ['Natural', 'Cultural', 'Histórico', 'Religioso', 'Gastronômico', 'Esportivo', 'Outro'],
          required: true
        },
        {
          id: 'descricaoAtrativo',
          label: 'Descrição do Atrativo',
          type: 'textarea',
          minLength: 50,
          maxLength: 1000,
          required: true
        },
        {
          id: 'enderecoAtrativo',
          label: 'Endereço do Atrativo',
          type: 'text',
          minLength: 10,
          maxLength: 300,
          required: true
        },
        {
          id: 'acessibilidade',
          label: 'Acessibilidade',
          type: 'select',
          options: ['Total', 'Parcial', 'Não Possui'],
          required: false
        },
        {
          id: 'horarioFuncionamento',
          label: 'Horário de Funcionamento',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'valorEntrada',
          label: 'Valor da Entrada',
          type: 'select',
          options: ['Gratuito', 'Pago'],
          required: false
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Cadastro de Roteiro Turístico',
    description: 'Cadastro de roteiros e passeios turísticos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ROTEIRO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Roteiro Detalhado', 'Fotos', 'Valores', 'Contatos'],
    estimatedDays: 10,
    priority: 3,
    category: 'Roteiros',
    icon: 'Route',
    color: '#3b82f6',
    formSchema: {
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
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'nomeRoteiro',
          label: 'Nome do Roteiro',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'tipoRoteiro',
          label: 'Tipo de Roteiro',
          type: 'select',
          options: ['Histórico-Cultural', 'Ecoturismo', 'Gastronômico', 'Religioso', 'Aventura', 'Rural', 'Outro'],
          required: true
        },
        {
          id: 'descricaoRoteiro',
          label: 'Descrição do Roteiro',
          type: 'textarea',
          minLength: 50,
          maxLength: 1000,
          required: true
        },
        {
          id: 'duracao',
          label: 'Duração',
          type: 'select',
          options: ['Meio Período', '1 Dia', '2 Dias', '3 ou mais Dias'],
          required: true
        },
        {
          id: 'pontosParada',
          label: 'Pontos de Parada',
          type: 'textarea',
          minLength: 20,
          maxLength: 500,
          required: false
        },
        {
          id: 'nivelDificuldade',
          label: 'Nível de Dificuldade',
          type: 'select',
          options: ['Fácil', 'Moderado', 'Difícil'],
          required: false
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Cadastro de Evento Turístico',
    description: 'Registro de eventos e festivais turísticos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_EVENTO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto do Evento', 'Autorizações', 'Cronograma'],
    estimatedDays: 20,
    priority: 4,
    category: 'Eventos',
    icon: 'Calendar',
    color: '#2563eb',
    formSchema: {
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
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'nomeEvento',
          label: 'Nome do Evento',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'tipoEvento',
          label: 'Tipo de Evento',
          type: 'select',
          options: ['Festival', 'Feira', 'Show', 'Congresso', 'Exposição', 'Competição Esportiva', 'Outro'],
          required: true
        },
        {
          id: 'descricaoEvento',
          label: 'Descrição do Evento',
          type: 'textarea',
          minLength: 50,
          maxLength: 1000,
          required: true
        },
        {
          id: 'dataInicio',
          label: 'Data de Início',
          type: 'date',
          required: true
        },
        {
          id: 'dataFim',
          label: 'Data de Término',
          type: 'date',
          required: true
        },
        {
          id: 'localEvento',
          label: 'Local do Evento',
          type: 'text',
          minLength: 10,
          maxLength: 300,
          required: true
        },
        {
          id: 'publicoEstimado',
          label: 'Público Estimado',
          type: 'number',
          minimum: 1,
          required: false
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Mapa Turístico',
    description: 'Visualização de atrativos turísticos no mapa',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Map',
    color: '#94a3b8',
  },
  {
    name: 'Guia Turístico da Cidade',
    description: 'Informações gerais sobre a cidade',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Book',
    color: '#94a3b8',
  },
  {
    name: 'Certidão de Cadastro Turístico',
    description: 'Emissão de certidão de cadastro no sistema turístico municipal',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'CNPJ', 'Alvará de Funcionamento'],
    estimatedDays: 7,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#3b82f6',
  },
  {
    name: 'Certidão de Regularidade Turística',
    description: 'Emissão de certidão de regularidade de estabelecimento turístico',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'CNPJ', 'Cadastro Turístico'],
    estimatedDays: 7,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#3b82f6',
  },
  {
    name: 'Declaração de Apoio a Evento Turístico',
    description: 'Emissão de declaração de apoio institucional a eventos',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Projeto do Evento', 'Cronograma'],
    estimatedDays: 10,
    priority: 3,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#3b82f6',
  },
  {
    name: 'Atestado de Participação em Capacitação',
    description: 'Emissão de atestado de participação em curso de turismo',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Inscrição'],
    estimatedDays: 5,
    priority: 2,
    category: 'Atestados',
    icon: 'CheckCircle',
    color: '#3b82f6',
  },
  {
    name: 'Laudo de Vistoria de Equipamento Turístico',
    description: 'Emissão de laudo de vistoria de estabelecimentos turísticos',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'CNPJ', 'Cadastro Turístico', 'Alvará'],
    estimatedDays: 15,
    priority: 3,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#3b82f6',
  },
  {
    name: 'Autorização de Uso de Marca Turística',
    description: 'Emissão de autorização para uso da marca turística da cidade',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'CNPJ', 'Projeto de Uso da Marca'],
    estimatedDays: 20,
    priority: 4,
    category: 'Autorizações',
    icon: 'Award',
    color: '#3b82f6',
  },
];
