/**
 * SEED DE SERVIÇOS - SECRETARIA DE ASSISTÊNCIA SOCIAL
 * Total: 9 serviços
 */

import { ServiceDefinition } from './types';

export const socialServices: ServiceDefinition[] = [
  {
    name: 'Cadastro Único (CadÚnico)',
    description: 'Inscrição ou atualização no Cadastro Único',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_UNICO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Residência', 'Comprovante de Renda'],
    estimatedDays: 10,
    priority: 5,
    category: 'Benefícios',
    icon: 'Users',
    color: '#dc2626',
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
          id: 'nis',
          label: 'NIS (se já possui)',
          type: 'text',
          pattern: '^\\d{11}$',
          required: false
        },
        {
          id: 'membrosFamilia',
          label: 'Membros da Família',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parentesco: { type: 'string', title: 'Parentesco', enum: ['Responsável', 'Cônjuge', 'Filho(a)', 'Enteado(a)', 'Pai/Mãe', 'Outro'] },
              renda: { type: 'number', title: 'Renda Mensal', minimum: 0 }
            },
            required: ['nome', 'parentesco']
          },
          minItems: 1,
          required: true
        },
        {
          id: 'beneficiosRecebidos',
          label: 'Benefícios Recebidos',
          type: 'text',
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
    name: 'Bolsa Família',
    description: 'Solicitação de inclusão no Bolsa Família',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'BOLSA_FAMILIA',
    requiresDocuments: true,
    requiredDocuments: ['CadÚnico', 'Comprovante de Renda', 'Cartão de Vacina das Crianças'],
    estimatedDays: 30,
    priority: 5,
    category: 'Benefícios',
    icon: 'Wallet',
    color: '#b91c1c',
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
          id: 'nisResponsavel',
          label: 'NIS do Responsável Familiar',
          type: 'text',
          pattern: '^\\d{11}$',
          required: true
        },
        {
          id: 'criancasEscola',
          label: 'Crianças em Idade Escolar (6-17 anos)',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              escola: { type: 'string', title: 'Nome da Escola', maxLength: 200 },
              frequencia: { type: 'number', title: 'Frequência (%)', minimum: 0, maximum: 100 }
            },
            required: ['nome', 'dataNascimento', 'escola']
          },
          required: false
        },
        {
          id: 'gestante',
          label: 'Há Gestante na Família?',
          type: 'checkbox',
          defaultValue: false,
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
    name: 'CRAS - Atendimento',
    description: 'Agendamento de atendimento no CRAS',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTO_CRAS',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência'],
    estimatedDays: 3,
    priority: 4,
    category: 'Atendimento',
    icon: 'Home',
    color: '#991b1b',
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
          id: 'crasReferencia',
          label: 'CRAS de Referência',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'dataPreferencial',
          label: 'Data Preferencial',
          type: 'date',
          required: true
        },
        {
          id: 'turnoPreferencial',
          label: 'Turno Preferencial',
          type: 'select',
          options: ['Manhã', 'Tarde'],
          required: true
        },
        {
          id: 'motivoAtendimento',
          label: 'Motivo do Atendimento',
          type: 'textarea',
          minLength: 10,
          maxLength: 500,
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
    name: 'Cesta Básica',
    description: 'Solicitação de cesta básica emergencial',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'CESTA_BASICA',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Residência', 'Declaração de Renda', 'Laudo Social'],
    estimatedDays: 5,
    priority: 5,
    category: 'Assistência',
    icon: 'Package',
    color: '#7f1d1d',
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
          id: 'quantidadePessoas',
          label: 'Quantidade de Pessoas na Residência',
          type: 'number',
          minimum: 1,
          required: true
        },
        {
          id: 'situacaoEmergencia',
          label: 'Situação de Emergência',
          type: 'textarea',
          minLength: 20,
          maxLength: 1000,
          required: true
        },
        {
          id: 'rendaTotal',
          label: 'Renda Total Familiar',
          type: 'number',
          minimum: 0,
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
    name: 'Gestão de Benefícios Sociais',
    description: 'Controle interno de benefícios concedidos',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_BENEFICIOS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 3,
    category: 'Gestão Interna',
    icon: 'ShieldCheck',
    color: '#6b7280',
    formSchema: {
      citizenFields: [],
      fields: [
        {
          id: 'beneficio',
          label: 'Tipo de Benefício',
          type: 'select',
          options: ['Bolsa Família', 'BPC', 'Cesta Básica', 'Auxílio Emergencial', 'Outro'],
          required: true
        },
        {
          id: 'nisBeneficiario',
          label: 'NIS do Beneficiário',
          type: 'text',
          pattern: '^\\d{11}$',
          required: true
        },
        {
          id: 'valor',
          label: 'Valor Concedido',
          type: 'number',
          minimum: 0,
          required: true
        },
        {
          id: 'dataConcessao',
          label: 'Data de Concessão',
          type: 'date',
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
    name: 'Relatório de Atendimentos',
    description: 'Consulta de atendimentos realizados',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'FileText',
    color: '#94a3b8',
  },
  {
    name: 'Certidão de CadÚnico',
    description: 'Emissão de certidão de inscrição no CadÚnico',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG'],
    estimatedDays: 5,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#dc2626',
  },
  {
    name: 'Declaração de Benefício',
    description: 'Emissão de declaração de recebimento de benefício',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'NIS'],
    estimatedDays: 5,
    priority: 3,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#dc2626',
  },
  {
    name: 'Laudo Social',
    description: 'Emissão de laudo técnico social',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 4,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#dc2626',
  },
  {
      name: 'Atendimentos - Assistência Social',
      description: 'Registro geral de atendimentos na área social',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'COM_DADOS',
      moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
      requiresDocuments: false,
      estimatedDays: 1,
      priority: 3,
      category: 'Atendimento',
      icon: 'Heart',
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
          // ========== BLOCO 1: IDENTIFICAÇÃO ==========

          // ========== BLOCO 2: CONTATO ==========

          // ========== BLOCO 3: ENDEREÇO ==========
          pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

          // ========== BLOCO 4: COMPLEMENTARES ==========

          // ========== BLOCO 5: DADOS DO ATENDIMENTO ==========
          tipoAtendimento: {
            type: 'string',
            title: 'Tipo de Atendimento',
            enum: ['Cadastro/Orientação', 'Benefício Eventual', 'Programa Social', 'Encaminhamento', 'Acompanhamento Familiar', 'Visita Domiciliar', 'Grupo/Oficina', 'Atendimento Psicossocial', 'Emergência Social', 'Outro']
          },
          unidadeCRAS: { type: 'string', title: 'Unidade CRAS/CREAS', minLength: 3, maxLength: 200 },
          dataAtendimento: { type: 'string', format: 'date', title: 'Data do Atendimento' },
          assistenteSocial: { type: 'string', title: 'Assistente Social Responsável', minLength: 3, maxLength: 200 },
          motivoAtendimento: { type: 'string', title: 'Motivo/Demanda do Atendimento', minLength: 10, maxLength: 1000 },
          descricaoAtendimento: { type: 'string', title: 'Descrição do Atendimento Realizado', minLength: 10, maxLength: 2000 },

          // ========== BLOCO 6: VULNERABILIDADE E ENCAMINHAMENTOS ==========
          situacaoVulnerabilidade: {
            type: 'string',
            title: 'Situação de Vulnerabilidade',
            enum: ['Pobreza extrema', 'Desemprego', 'Violência doméstica', 'Negligência/Abandono', 'Situação de rua', 'Dependência química', 'Idoso em risco', 'Criança/Adolescente em risco', 'Deficiência', 'Outra']
          },
          encaminhado: { type: 'boolean', title: 'Houve Encaminhamento?', default: false },
          encaminhamentoPara: { type: 'string', title: 'Encaminhamento Para', maxLength: 300 },
          prioridade: {
            type: 'string',
            title: 'Prioridade do Caso',
            enum: ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'],
            default: 'NORMAL'
          },
          acompanhamentoContinuo: { type: 'boolean', title: 'Necessita Acompanhamento Contínuo?', default: false },

          // ========== BLOCO 7: OBSERVAÇÕES ==========
          observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 1000 }
        },
        required: [
          'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
          'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
          'tipoAtendimento', 'unidadeCRAS', 'dataAtendimento', 'assistenteSocial', 'motivoAtendimento', 'descricaoAtendimento'
        ]
      }
    },
  {
      name: 'Solicitação de Benefício Social',
      description: 'Solicitação de benefícios sociais (BPC, Bolsa Família, etc)',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'COM_DADOS',
      moduleType: 'SOLICITACAO_BENEFICIO',
      requiresDocuments: true,
      requiredDocuments: ['CadÚnico', 'Documentos Pessoais', 'Comprovante de Renda'],
      estimatedDays: 15,
      priority: 5,
      category: 'Benefícios',
      icon: 'DollarSign',
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
          // ========== BLOCO 1: IDENTIFICAÇÃO ==========

          // ========== BLOCO 2: CONTATO ==========

          // ========== BLOCO 3: ENDEREÇO ==========
          pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

          // ========== BLOCO 4: COMPLEMENTARES ==========

          // ========== BLOCO 5: CADASTRO ÚNICO ==========
          possuiCadUnico: { type: 'boolean', title: 'Possui Cadastro Único (CadÚnico)?', default: false },
          nisCadUnico: { type: 'string', title: 'NIS do CadÚnico', maxLength: 20 },

          // ========== BLOCO 6: TIPO DE BENEFÍCIO ==========
          tipoBeneficio: { type: 'string', title: 'Tipo de Benefício Solicitado', enum: ['BPC (Idoso)', 'BPC (Pessoa com Deficiência)', 'Bolsa Família', 'Auxílio Emergencial', 'Cesta Básica', 'Tarifa Social de Energia', 'Outro'] },
          outroBeneficio: { type: 'string', title: 'Outro Benefício (especificar)', maxLength: 200 },

          // ========== BLOCO 7: JUSTIFICATIVA ==========
          motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', minLength: 20, maxLength: 1000 },
          situacaoVulnerabilidade: { type: 'string', title: 'Situação de Vulnerabilidade', enum: ['Extrema Pobreza', 'Desemprego', 'Doença/Deficiência', 'Idoso sem Renda', 'Situação de Rua', 'Violência Doméstica', 'Outro'] },
          urgente: { type: 'boolean', title: 'Caso Urgente?', default: false },

          // ========== BLOCO 8: COMPOSIÇÃO FAMILIAR ==========
          quantidadePessoasFamilia: { type: 'integer', title: 'Quantidade de Pessoas na Família', minimum: 1, maximum: 30 },
          quantidadeCriancas: { type: 'integer', title: 'Quantidade de Crianças (0-12 anos)', minimum: 0, maximum: 20 },
          quantidadeAdolescentes: { type: 'integer', title: 'Quantidade de Adolescentes (13-17 anos)', minimum: 0, maximum: 20 },
          quantidadeIdosos: { type: 'integer', title: 'Quantidade de Idosos (60+ anos)', minimum: 0, maximum: 10 },
          quantidadePCD: { type: 'integer', title: 'Quantidade de Pessoas com Deficiência', minimum: 0, maximum: 10 },

          // ========== BLOCO 9: RENDA ==========
          rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
          possuiRendaFixa: { type: 'boolean', title: 'Possui Renda Fixa?', default: false },
          fonteRenda: { type: 'string', title: 'Principal Fonte de Renda', maxLength: 200 },

          // ========== BLOCO 10: OBSERVAÇÕES ==========
          observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
        },
        required: [
          'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
          'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
          'tipoBeneficio', 'motivoSolicitacao', 'situacaoVulnerabilidade',
          'quantidadePessoasFamilia', 'rendaFamiliarMensal'
        ]
      }
    },
  {
      name: 'Entrega Emergencial (Cesta Básica)',
      description: 'Solicitação de auxílio emergencial e cestas básicas',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'COM_DADOS',
      moduleType: 'ENTREGA_EMERGENCIAL',
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'Comprovante de Endereço', 'Declaração de Vulnerabilidade'],
      estimatedDays: 3,
      priority: 5,
      category: 'Emergencial',
      icon: 'Package',
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
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          tipoAjuda: { type: 'string', title: 'Tipo de Ajuda Necessária', enum: ['Cesta Básica', 'Auxílio Alimentação', 'Kit Higiene', 'Auxílio Emergencial (dinheiro)', 'Medicamentos', 'Outro'] },
          quantidadePessoasFamilia: { type: 'integer', title: 'Quantas pessoas moram na casa?', minimum: 1, maximum: 30 },
          quantidadeCriancas: { type: 'integer', title: 'Quantas crianças (0-12 anos)?', minimum: 0, maximum: 20 },
          motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação Emergencial', minLength: 20, maxLength: 1000 },
          situacaoEmergencial: { type: 'string', title: 'Situação Emergencial', enum: ['Desemprego recente', 'Doença na família', 'Perda de moradia', 'Calamidade (incêndio, enchente)', 'Fome/Extrema necessidade', 'Outro'] },
          possuiCadUnico: { type: 'boolean', title: 'Possui CadÚnico?', default: false },
          nisCadUnico: { type: 'string', title: 'NIS (se possuir)', maxLength: 20 },
          urgente: { type: 'boolean', title: 'Caso URGENTE (risco de fome)?', default: false },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoAjuda', 'quantidadePessoasFamilia', 'motivoSolicitacao', 'situacaoEmergencial']
      }
    },
  {
      name: 'Inscrição em Grupo ou Oficina Social',
      description: 'Inscrição em grupos e oficinas do CRAS/CREAS',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'COM_DADOS',
      moduleType: 'INSCRICAO_GRUPO_OFICINA',
      requiresDocuments: true,
      requiredDocuments: ['RG', 'CPF', 'Comprovante de Endereço'],
      estimatedDays: 5,
      priority: 3,
      category: 'Programas',
      icon: 'Users',
      color: '#a855f7',
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
          tipoAtividade: { type: 'string', title: 'Tipo de Atividade', enum: ['Oficina de Artesanato', 'Oficina de Informática', 'Grupo de Idosos', 'Grupo de Mulheres', 'Grupo de Jovens', 'Reforço Escolar', 'Oficina Cultural', 'Esporte e Lazer', 'Outro'] },
          nomeGrupoOficina: { type: 'string', title: 'Nome do Grupo/Oficina', minLength: 3, maxLength: 200 },
          unidadeCRAS: { type: 'string', title: 'Unidade CRAS/CREAS', minLength: 3, maxLength: 200 },
          turnoPreferido: { type: 'string', title: 'Turno Preferido', enum: ['Manhã', 'Tarde', 'Noite', 'Qualquer'] },
          motivoInteresse: { type: 'string', title: 'Motivo do Interesse', minLength: 10, maxLength: 500 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'telefone', 'cep', 'bairro', 'nomeMae', 'tipoAtividade', 'nomeGrupoOficina', 'unidadeCRAS', 'motivoInteresse']
      }
    },
  {
      name: 'Visitas Domiciliares',
      description: 'Agendamento de visitas técnicas domiciliares',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'COM_DADOS',
      moduleType: 'VISITAS_DOMICILIARES',
      requiresDocuments: true,
      requiredDocuments: ['Comprovante de Endereço'],
      estimatedDays: 7,
      priority: 4,
      category: 'Atendimento',
      icon: 'Home',
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
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          motivoVisita: { type: 'string', title: 'Motivo da Visita', minLength: 20, maxLength: 1000 },
          dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial' },
          turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Manhã', 'Tarde', 'Qualquer'] },
          urgente: { type: 'boolean', title: 'Caso Urgente?', default: false },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'motivoVisita']
      }
    },
  {
      name: 'Inscrição em Programa Social',
      description: 'Inscrição em programas sociais municipais',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'COM_DADOS',
      moduleType: 'INSCRICAO_PROGRAMA_SOCIAL',
      requiresDocuments: true,
      requiredDocuments: ['CadÚnico', 'Documentos Pessoais'],
      estimatedDays: 10,
      priority: 4,
      category: 'Programas',
      icon: 'FileCheck',
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
          nisCadUnico: { type: 'string', title: 'NIS do CadÚnico', maxLength: 20 },
          nomePrograma: { type: 'string', title: 'Nome do Programa', minLength: 3, maxLength: 200 },
          tipoPrograma: { type: 'string', title: 'Tipo de Programa', enum: ['Programa de Transferência de Renda', 'Programa para Idosos', 'Programa para Crianças', 'Programa para Mulheres', 'Programa de Capacitação', 'Outro'] },
          rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal', minimum: 0 },
          quantidadePessoasFamilia: { type: 'integer', title: 'Pessoas na Família', minimum: 1, maximum: 30 },
          motivoInscricao: { type: 'string', title: 'Motivo da Inscrição', minLength: 20, maxLength: 500 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'telefone', 'cep', 'bairro', 'nomeMae', 'nomePrograma', 'tipoPrograma', 'motivoInscricao']
      }
    },
  {
      name: 'Agendamento de Atendimento Social',
      description: 'Agendamento de atendimento com assistente social',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'COM_DADOS',
      moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL',
      requiresDocuments: false,
      estimatedDays: 3,
      priority: 3,
      category: 'Agendamento',
      icon: 'Calendar',
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
          unidadeCRAS: { type: 'string', title: 'Unidade CRAS/CREAS', minLength: 3, maxLength: 200 },
          motivoAtendimento: { type: 'string', title: 'Motivo do Atendimento', minLength: 10, maxLength: 500 },
          tipoAtendimento: { type: 'string', title: 'Tipo de Atendimento', enum: ['Primeira vez', 'Retorno', 'Orientação', 'Acompanhamento', 'Outro'] },
          dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial' },
          turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Manhã', 'Tarde', 'Qualquer'] },
          urgente: { type: 'boolean', title: 'Caso Urgente?', default: false },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'telefone', 'bairro', 'nomeMae', 'unidadeCRAS', 'motivoAtendimento', 'tipoAtendimento']
      }
    },
  {
      name: 'Gestão CRAS/CREAS',
      description: 'Administração de equipamentos sociais (CRAS e CREAS)',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'COM_DADOS',
      moduleType: 'GESTAO_CRAS_CREAS',
      requiresDocuments: false,
      estimatedDays: null,
      priority: 2,
      category: 'Gestão Interna',
      icon: 'Building2',
      color: '#64748b',
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
          tipoEquipamento: { type: 'string', title: 'Tipo de Equipamento', enum: ['CRAS', 'CREAS'] },
          nomeUnidade: { type: 'string', title: 'Nome da Unidade', minLength: 3, maxLength: 200 },
          enderecoUnidade: { type: 'string', title: 'Endereço da Unidade', maxLength: 300 },
          numeroFamilias: { type: 'number', title: 'Número de Famílias Atendidas', minimum: 0 },
          numeroProfissionais: { type: 'number', title: 'Número de Profissionais', minimum: 0 },
          servicosOferecidos: { type: 'string', title: 'Serviços Oferecidos', minLength: 10, maxLength: 1000 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 1000 },
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoEquipamento', 'nomeUnidade', 'enderecoUnidade', 'numeroFamilias', 'servicosOferecidos'],
      },
    },
  {
      name: 'Certidão de Família em Situação de Vulnerabilidade',
      description: 'Emissão de certidão oficial para famílias em vulnerabilidade social',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: false,
      estimatedDays: 3,
      priority: 3,
      category: 'Certidões e Declarações',
      icon: 'FileText',
      color: '#3b82f6',
      formSchema: null
    },
  {
      name: 'Declaração de Atendimento Social',
      description: 'Declaração oficial de atendimento realizado pela assistência social',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: false,
      estimatedDays: 2,
      priority: 2,
      category: 'Certidões e Declarações',
      icon: 'FileCheck',
      color: '#10b981',
      formSchema: null
    },
  {
      name: 'Guia de Encaminhamento para Serviços',
      description: 'Emissão de guia oficial para encaminhamento a outros serviços ou órgãos',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: false,
      estimatedDays: 1,
      priority: 4,
      category: 'Documentos e Guias',
      icon: 'ArrowRightCircle',
      color: '#f59e0b',
      formSchema: null
    },
  {
      name: 'Segunda Via de Documentos Sociais',
      description: 'Solicitação de segunda via de certidões, declarações ou outros documentos',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: false,
      estimatedDays: 5,
      priority: 2,
      category: 'Documentos e Guias',
      icon: 'Copy',
      color: '#6366f1',
      formSchema: null
    },
  {
      name: 'Consulta de Situação Cadastral (CadÚnico)',
      description: 'Consulta oficial sobre situação no Cadastro Único',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: false,
      estimatedDays: 2,
      priority: 3,
      category: 'Consultas e Informações',
      icon: 'Search',
      color: '#8b5cf6',
      formSchema: null
    },
  {
      name: 'Declaração de Participação em Programa Social',
      description: 'Comprovante oficial de participação em programas sociais municipais',
      departmentCode: 'ASSISTENCIA_SOCIAL',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: false,
      estimatedDays: 3,
      priority: 2,
      category: 'Certidões e Declarações',
      icon: 'Award',
      color: '#ec4899',
      formSchema: null
    }
];
