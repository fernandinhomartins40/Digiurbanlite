/**
 * SEED DE SERVIÇOS - SECRETARIA DE EDUCAÇÃO
 * Total: 11 serviços
 */

import { ServiceDefinition } from './types';

export const educationServices: ServiceDefinition[] = [
  {
    name: 'Matrícula Escolar',
    description: 'Solicitação de matrícula em escolas municipais',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'MATRICULA_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Certidão de Nascimento', 'Comprovante de Residência', 'Cartão de Vacina'],
    estimatedDays: 5,
    priority: 5,
    category: 'Matrícula',
    icon: 'GraduationCap',
    color: '#8b5cf6',
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
          id: 'nomeAluno',
          label: 'Nome Completo do Aluno',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'dataNascimentoAluno',
          label: 'Data de Nascimento do Aluno',
          type: 'date',
          required: true
        },
        {
          id: 'sexoAluno',
          label: 'Sexo do Aluno',
          type: 'select',
          options: ['Masculino', 'Feminino', 'Outro'],
          required: true
        },
        {
          id: 'nomeResponsavel',
          label: 'Nome Completo do Responsável',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'cpfResponsavel',
          label: 'CPF do Responsável',
          type: 'text',
          pattern: '^\\d{11}$',
          required: true
        },
        {
          id: 'parentescoResponsavel',
          label: 'Grau de Parentesco',
          type: 'select',
          options: ['Pai', 'Mãe', 'Avô/Avó', 'Tio(a)', 'Irmão(ã)', 'Outro'],
          required: true
        },
        {
          id: 'escolaPreferencial',
          label: 'Escola Preferencial',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'anoEscolar',
          label: 'Ano Escolar',
          type: 'select',
          options: ['Educação Infantil (0-3 anos)', 'Pré-Escola (4-5 anos)', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', 'EJA - Ensino Fundamental', 'EJA - Ensino Médio'],
          required: true
        },
        {
          id: 'turnoPreferencial',
          label: 'Turno Preferencial',
          type: 'select',
          options: ['Manhã', 'Tarde', 'Integral', 'Qualquer'],
          required: true
        },
        {
          id: 'possuiNecessidadesEspeciais',
          label: 'Possui Necessidades Especiais?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'descricaoNecessidades',
          label: 'Descrição das Necessidades Especiais',
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
    },
    linkedCitizensConfig: {
      enabled: true,
      links: [{
        linkType: 'STUDENT',
        role: 'BENEFICIARY',
        label: 'Aluno',
        description: 'Selecione o aluno que será matriculado',
        required: true,
        mapFromLegacyFields: {
          name: 'nomeAluno',
          birthDate: 'dataNascimentoAluno'
        },
        contextFields: [
          { id: 'sexoAluno', sourceField: 'sexoAluno' },
          { id: 'escolaPreferencial', sourceField: 'escolaPreferencial' },
          { id: 'anoEscolar', sourceField: 'anoEscolar' },
          { id: 'turnoPreferencial', sourceField: 'turnoPreferencial' },
          { id: 'possuiNecessidadesEspeciais', sourceField: 'possuiNecessidadesEspeciais' },
          { id: 'descricaoNecessidades', sourceField: 'descricaoNecessidades' }
        ],
        expectedRelationships: ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER']
      }]
    }
  },
  {
    name: 'Transferência Escolar',
    description: 'Solicitação de transferência entre escolas',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'TRANSFERENCIA_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Histórico Escolar', 'Comprovante de Residência', 'Declaração de Transferência'],
    estimatedDays: 7,
    priority: 4,
    category: 'Transferência',
    icon: 'ArrowRightLeft',
    color: '#7c3aed',
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
          id: 'nomeAluno',
          label: 'Nome Completo do Aluno',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'escolaOrigem',
          label: 'Escola de Origem',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'escolaDestino',
          label: 'Escola de Destino',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'anoAtual',
          label: 'Ano Escolar Atual',
          type: 'select',
          options: ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'],
          required: true
        },
        {
          id: 'motivoTransferencia',
          label: 'Motivo da Transferência',
          type: 'select',
          options: ['Mudança de Endereço', 'Preferência de Turno', 'Melhor Infraestrutura', 'Proximidade com Trabalho', 'Outro'],
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
    },
    linkedCitizensConfig: {
      enabled: true,
      links: [{
        linkType: 'STUDENT',
        role: 'BENEFICIARY',
        label: 'Aluno',
        required: true,
        mapFromLegacyFields: {
          name: 'nomeAluno'
        },
        contextFields: [
          { id: 'escolaOrigem', sourceField: 'escolaOrigem' },
          { id: 'escolaDestino', sourceField: 'escolaDestino' }
        ],
        expectedRelationships: ['SON', 'DAUGHTER']
      }]
    }
  },
  {
    name: 'Gestão de Merenda Escolar',
    description: 'Controle de cardápios e estoque de merenda',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_MERENDA',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 3,
    category: 'Gestão Interna',
    icon: 'Utensils',
    color: '#6d28d9',
    formSchema: {
      citizenFields: [],
      fields: [
        {
          id: 'escola',
          label: 'Escola',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'dataCardapio',
          label: 'Data do Cardápio',
          type: 'date',
          required: true
        },
        {
          id: 'cardapio',
          label: 'Cardápio do Dia',
          type: 'textarea',
          minLength: 10,
          maxLength: 1000,
          required: true
        },
        {
          id: 'quantidadeAlunos',
          label: 'Quantidade de Alunos Atendidos',
          type: 'number',
          minimum: 1,
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
    name: 'Solicitação de Transporte Escolar',
    description: 'Cadastro para uso do transporte escolar',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_TRANSPORTE_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Matrícula', 'Comprovante de Residência'],
    estimatedDays: 10,
    priority: 4,
    category: 'Transporte',
    icon: 'Bus',
    color: '#5b21b6',
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
          id: 'nomeAluno',
          label: 'Nome do Aluno',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'escola',
          label: 'Escola',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'enderecoColeta',
          label: 'Endereço de Coleta',
          type: 'text',
          minLength: 10,
          maxLength: 300,
          required: true
        },
        {
          id: 'horarioColeta',
          label: 'Horário de Coleta',
          type: 'text',
          pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
          required: true
        },
        {
          id: 'possuiNecessidadesEspeciais',
          label: 'Necessita Veículo Adaptado?',
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
    },
    linkedCitizensConfig: {
      enabled: true,
      links: [{
        linkType: 'STUDENT',
        role: 'BENEFICIARY',
        label: 'Aluno',
        description: 'Selecione o aluno que utilizará o transporte escolar',
        required: true,
        mapFromLegacyFields: {
          name: 'nomeAluno'
        },
        contextFields: [
          { id: 'escola', sourceField: 'escola' },
          { id: 'enderecoColeta', sourceField: 'enderecoColeta' },
          { id: 'horarioColeta', sourceField: 'horarioColeta' },
          { id: 'possuiNecessidadesEspeciais', sourceField: 'possuiNecessidadesEspeciais' }
        ],
        expectedRelationships: ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER']
      }]
    }
  },
  {
    name: 'Inscrição em Cursos Livres',
    description: 'Inscrição em cursos de capacitação oferecidos pela secretaria',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_CURSO_LIVRE',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência'],
    estimatedDays: 3,
    priority: 3,
    category: 'Cursos',
    icon: 'BookOpen',
    color: '#4c1d95',
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
          id: 'cursoInteresse',
          label: 'Curso de Interesse',
          type: 'select',
          options: ['Informática Básica', 'Inglês', 'Artesanato', 'Culinária', 'Dança', 'Música', 'Teatro', 'Outro'],
          required: true
        },
        {
          id: 'nivelEscolaridade',
          label: 'Nível de Escolaridade',
          type: 'select',
          options: ['Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo'],
          required: true
        },
        {
          id: 'turnoPreferencial',
          label: 'Turno Preferencial',
          type: 'select',
          options: ['Manhã', 'Tarde', 'Noite', 'Qualquer'],
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
    name: 'Cadastro de Professores',
    description: 'Cadastro de professores para banco de talentos',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PROFESSOR',
    requiresDocuments: true,
    requiredDocuments: ['Diploma', 'Currículo', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 4,
    category: 'Cadastro',
    icon: 'ChalkboardTeacher',
    color: '#6b21a8',
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
          id: 'formacao',
          label: 'Formação Acadêmica',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'disciplinas',
          label: 'Disciplinas que Leciona',
          type: 'text',
          maxLength: 300,
          required: true
        },
        {
          id: 'experiencia',
          label: 'Experiência Profissional',
          type: 'textarea',
          maxLength: 1000,
          required: true
        },
        {
          id: 'disponibilidade',
          label: 'Disponibilidade de Horário',
          type: 'text',
          maxLength: 200,
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
    name: 'Relatórios de Frequência',
    description: 'Consulta de frequência escolar',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'ChartBar',
    color: '#94a3b8',
  },
  {
    name: 'Calendário Escolar',
    description: 'Visualização do calendário letivo',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#94a3b8',
  },
  {
    name: 'Certidão de Conclusão',
    description: 'Emissão de certidão de conclusão de curso',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Histórico Escolar'],
    estimatedDays: 7,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#7c3aed',
  },
  {
    name: 'Declaração de Matrícula',
    description: 'Emissão de declaração de matrícula',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Nome do Aluno'],
    estimatedDays: 3,
    priority: 2,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#7c3aed',
  },
  {
    name: 'Atestado de Frequência',
    description: 'Emissão de atestado de frequência escolar',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Nome do Aluno'],
    estimatedDays: 3,
    priority: 2,
    category: 'Atestados',
    icon: 'CheckCircle',
    color: '#7c3aed',
  },
  {
      name: 'Atendimentos - Educação',
      description: 'Registro geral de atendimentos na área educacional',
      departmentCode: 'EDUCACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'ATENDIMENTOS_EDUCACAO',
      requiresDocuments: false,
      estimatedDays: 1,
      priority: 3,
      category: 'Atendimento',
      icon: 'GraduationCap',
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
          // ========== BLOCO 1: IDENTIFICAÇÃO DO RESPONSÁVEL ==========

          // ========== BLOCO 2: CONTATO ==========

          // ========== BLOCO 3: ENDEREÇO ==========
          pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

          // ========== BLOCO 4: COMPLEMENTARES ==========

          // ========== BLOCO 5: DADOS DO ATENDIMENTO ==========
          tipoAtendimento: {
            type: 'string',
            title: 'Tipo de Atendimento',
            enum: ['Matrícula', 'Transferência', 'Documentação', 'Transporte Escolar', 'Reunião Pedagógica', 'Reclamação', 'Solicitação', 'Outro']
          },
          assunto: { type: 'string', title: 'Assunto do Atendimento', minLength: 5, maxLength: 200 },
          descricao: { type: 'string', title: 'Descrição Detalhada', minLength: 10, maxLength: 2000 },
          unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
          dataAtendimento: { type: 'string', format: 'date', title: 'Data do Atendimento' },
          horarioAtendimento: { type: 'string', title: 'Horário do Atendimento', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
          servidorResponsavel: { type: 'string', title: 'Servidor Responsável', minLength: 3, maxLength: 200 },
          setor: { type: 'string', title: 'Setor', enum: ['Secretaria Escolar', 'Direção', 'Coordenação Pedagógica', 'Transporte', 'Merenda', 'Outro'] },
          prioridade: { type: 'string', title: 'Prioridade', enum: ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'], default: 'NORMAL' },
          resolvido: { type: 'boolean', title: 'Atendimento Resolvido?', default: false },
          dataResolucao: { type: 'string', format: 'date', title: 'Data da Resolução (se resolvido)' },
          observacoes: { type: 'string', title: 'Observações e Encaminhamentos', maxLength: 1000 }
        },
        required: [
          'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
          'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
          'tipoAtendimento', 'assunto', 'descricao', 'unidadeEscolar', 'dataAtendimento', 'servidorResponsavel'
        ]
      }
    },
  {
      name: 'Matrícula de Aluno',
      description: 'Matrícula e rematrícula de alunos na rede municipal',
      departmentCode: 'EDUCACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'MATRICULA_ALUNO',
      requiresDocuments: true,
      requiredDocuments: ['Certidão de Nascimento', 'RG do Responsável', 'Comprovante de Endereço', 'Cartão de Vacina'],
      estimatedDays: 7,
      priority: 5,
      category: 'Matrícula',
      icon: 'UserPlus',
      color: '#2563eb',
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
          // ========== BLOCO 1: IDENTIFICAÇÃO DO RESPONSÁVEL (CIDADÃO) ==========

          // ========== BLOCO 2: CONTATO DO RESPONSÁVEL ==========

          // ========== BLOCO 3: ENDEREÇO DO RESPONSÁVEL ==========
          pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

          // ========== BLOCO 4: COMPLEMENTARES DO RESPONSÁVEL ==========

          // ========== BLOCO 5: DADOS DO ALUNO ==========
          nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
          dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
          cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
          rgAluno: { type: 'string', title: 'RG do Aluno (se possuir)', maxLength: 20 },
          certidaoNascimento: { type: 'string', title: 'Número da Certidão de Nascimento', maxLength: 50 },
          nomeMaeAluno: { type: 'string', title: 'Nome da Mãe do Aluno', minLength: 3, maxLength: 200 },
          nomePaiAluno: { type: 'string', title: 'Nome do Pai do Aluno', maxLength: 200 },
          sexoAluno: { type: 'string', title: 'Sexo do Aluno', enum: ['Masculino', 'Feminino'] },
          racaCorAluno: { type: 'string', title: 'Raça/Cor', enum: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não declarada'] },

          // ========== BLOCO 6: VÍNCULO FAMILIAR ==========
          grauParentesco: { type: 'string', title: 'Grau de Parentesco com o Aluno', enum: ['Pai', 'Mãe', 'Avô/Avó', 'Tio/Tia', 'Irmão(ã) maior', 'Tutor Legal', 'Outro'] },
          possuiGuardaJudicial: { type: 'boolean', title: 'Possui Guarda Judicial?', default: false },

          // ========== BLOCO 7: MATRÍCULA ==========
          unidadeEscolarDesejada: { type: 'string', title: 'Unidade Escolar Desejada', minLength: 3, maxLength: 200 },
          nivelEnsino: {
            type: 'string',
            title: 'Nível de Ensino',
            enum: ['Creche (0-3 anos)', 'Pré-escola (4-5 anos)', 'Fundamental I (1º ao 5º ano)', 'Fundamental II (6º ao 9º ano)', 'EJA (Educação de Jovens e Adultos)']
          },
          anoSerieDesejado: { type: 'string', title: 'Ano/Série Desejado', maxLength: 50 },
          turnoDesejado: {
            type: 'string',
            title: 'Turno Desejado',
            enum: ['Matutino', 'Vespertino', 'Integral', 'Noturno']
          },
          tipoMatricula: { type: 'string', title: 'Tipo de Matrícula', enum: ['Matrícula Nova', 'Rematrícula', 'Transferência de outra escola'] },
          escolaOrigem: { type: 'string', title: 'Escola de Origem (se transferência)', maxLength: 200 },

          // ========== BLOCO 8: NECESSIDADES ESPECIAIS E SAÚDE ==========
          possuiNecessidadesEspeciais: { type: 'boolean', title: 'Possui Necessidades Especiais?', default: false },
          tipoNecessidade: { type: 'string', title: 'Tipo de Necessidade', enum: ['Deficiência Física', 'Deficiência Visual', 'Deficiência Auditiva', 'Deficiência Intelectual', 'TEA (Autismo)', 'TDAH', 'Altas Habilidades', 'Outra'] },
          descricaoNecessidades: { type: 'string', title: 'Descrição Detalhada das Necessidades', maxLength: 500 },
          necessitaAcompanhante: { type: 'boolean', title: 'Necessita Acompanhante em Sala?', default: false },
          possuiLaudoMedico: { type: 'boolean', title: 'Possui Laudo Médico?', default: false },
          alergias: { type: 'string', title: 'Alergias (alimentares, medicamentos)', maxLength: 300 },
          medicamentosUso: { type: 'string', title: 'Medicamentos de Uso Contínuo', maxLength: 300 },

          // ========== BLOCO 9: PROGRAMAS SOCIAIS ==========
          bolsaFamilia: { type: 'boolean', title: 'Família participa do Bolsa Família?', default: false },
          nisBolsaFamilia: { type: 'string', title: 'NIS do Bolsa Família', maxLength: 20 },

          // ========== BLOCO 10: OBSERVAÇÕES ==========
          observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
        },
        required: [
          'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
          'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
          'nomeAluno', 'dataNascimentoAluno', 'certidaoNascimento', 'nomeMaeAluno', 'sexoAluno',
          'grauParentesco', 'unidadeEscolarDesejada', 'nivelEnsino', 'turnoDesejado', 'tipoMatricula'
        ]
      },
      linkedCitizensConfig: {
        enabled: true,
        links: [{
          linkType: 'STUDENT',
          role: 'BENEFICIARY',
          label: 'Aluno',
          description: 'Selecione o aluno que será matriculado',
          required: true,
          mapFromLegacyFields: {
            name: 'nomeAluno',
            birthDate: 'dataNascimentoAluno',
            cpf: 'cpfAluno',
            rg: 'rgAluno'
          },
          contextFields: [
            { id: 'sexoAluno', sourceField: 'sexoAluno' },
            { id: 'racaCorAluno', sourceField: 'racaCorAluno' },
            { id: 'certidaoNascimento', sourceField: 'certidaoNascimento' },
            { id: 'nomeMaeAluno', sourceField: 'nomeMaeAluno' },
            { id: 'nomePaiAluno', sourceField: 'nomePaiAluno' },
            { id: 'grauParentesco', sourceField: 'grauParentesco' },
            { id: 'possuiGuardaJudicial', sourceField: 'possuiGuardaJudicial' },
            { id: 'unidadeEscolarDesejada', sourceField: 'unidadeEscolarDesejada' },
            { id: 'nivelEnsino', sourceField: 'nivelEnsino' },
            { id: 'anoSerieDesejado', sourceField: 'anoSerieDesejado' },
            { id: 'turnoDesejado', sourceField: 'turnoDesejado' },
            { id: 'tipoMatricula', sourceField: 'tipoMatricula' },
            { id: 'escolaOrigem', sourceField: 'escolaOrigem' },
            { id: 'possuiNecessidadesEspeciais', sourceField: 'possuiNecessidadesEspeciais' },
            { id: 'tipoNecessidade', sourceField: 'tipoNecessidade' },
            { id: 'descricaoNecessidades', sourceField: 'descricaoNecessidades' },
            { id: 'necessitaAcompanhante', sourceField: 'necessitaAcompanhante' },
            { id: 'possuiLaudoMedico', sourceField: 'possuiLaudoMedico' },
            { id: 'alergias', sourceField: 'alergias' },
            { id: 'medicamentosUso', sourceField: 'medicamentosUso' },
            { id: 'bolsaFamilia', sourceField: 'bolsaFamilia' },
            { id: 'nisBolsaFamilia', sourceField: 'nisBolsaFamilia' }
          ],
          expectedRelationships: ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER']
        }]
      }
    },
  {
      name: 'Transporte Escolar',
      description: 'Solicitação de vaga em transporte escolar',
      departmentCode: 'EDUCACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'CADASTRO_TRANSPORTE_ESCOLAR',
      requiresDocuments: true,
      requiredDocuments: ['Comprovante de Matrícula', 'Comprovante de Endereço'],
      estimatedDays: 10,
      priority: 4,
      category: 'Transporte',
      icon: 'Bus',
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
          // ========== BLOCO 1: IDENTIFICAÇÃO DO RESPONSÁVEL ==========

          // ========== BLOCO 2: CONTATO DO RESPONSÁVEL ==========

          // ========== BLOCO 3: ENDEREÇO DO RESPONSÁVEL ==========
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },

          // ========== BLOCO 4: COMPLEMENTARES DO RESPONSÁVEL ==========

          // ========== BLOCO 5: DADOS DO ALUNO ==========
          nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
          dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
          cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
          unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
          serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
          turno: { type: 'string', title: 'Turno', enum: ['Matutino', 'Vespertino', 'Integral', 'Noturno'] },
          numeroMatricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },

          // ========== BLOCO 6: ENDEREÇO DE EMBARQUE ==========
          enderecoEmbarqueCompleto: { type: 'string', title: 'Endereço Completo de Embarque', minLength: 10, maxLength: 300 },
          pontoReferenciaEmbarque: { type: 'string', title: 'Ponto de Referência para Embarque', minLength: 5, maxLength: 200 },
          distanciaEscolaKm: { type: 'number', title: 'Distância até a Escola (km)', minimum: 0, maximum: 100 },
          zonaResidencia: { type: 'string', title: 'Zona de Residência', enum: ['Urbana', 'Rural'] },

          // ========== BLOCO 7: NECESSIDADES ESPECIAIS ==========
          possuiNecessidadesEspeciais: { type: 'boolean', title: 'Aluno Possui Necessidades Especiais?', default: false },
          tipoNecessidade: { type: 'string', title: 'Tipo de Necessidade', enum: ['Cadeirante', 'Deficiência Visual', 'Deficiência Auditiva', 'Mobilidade Reduzida', 'TEA (Autismo)', 'Outra'] },
          necessitaMonitor: { type: 'boolean', title: 'Necessita Monitor no Transporte?', default: false },
          motivoNecessidadeMonitor: { type: 'string', title: 'Motivo/Descrição da Necessidade de Monitor', maxLength: 500 },
          necessitaCadeiraRodas: { type: 'boolean', title: 'Necessita Transporte Adaptado (Cadeira de Rodas)?', default: false },

          // ========== BLOCO 8: HORÁRIOS ==========
          horarioEntradaEscola: { type: 'string', title: 'Horário de Entrada na Escola', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
          horarioSaidaEscola: { type: 'string', title: 'Horário de Saída da Escola', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
          necessitaTransporteIda: { type: 'boolean', title: 'Necessita Transporte Ida?', default: true },
          necessitaTransporteVolta: { type: 'boolean', title: 'Necessita Transporte Volta?', default: true },

          // ========== BLOCO 9: OBSERVAÇÕES ==========
          observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
        },
        required: [
          'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
          'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
          'nomeAluno', 'dataNascimentoAluno', 'unidadeEscolar', 'serie', 'turno',
          'enderecoEmbarqueCompleto', 'pontoReferenciaEmbarque', 'distanciaEscolaKm', 'horarioEntradaEscola'
        ]
      },
      linkedCitizensConfig: {
        enabled: true,
        links: [{
          linkType: 'STUDENT',
          role: 'BENEFICIARY',
          label: 'Aluno',
          description: 'Selecione o aluno que utilizará o transporte escolar',
          required: true,
          mapFromLegacyFields: {
            name: 'nomeAluno',
            birthDate: 'dataNascimentoAluno',
            cpf: 'cpfAluno'
          },
          contextFields: [
            { id: 'unidadeEscolar', sourceField: 'unidadeEscolar' },
            { id: 'serie', sourceField: 'serie' },
            { id: 'turno', sourceField: 'turno' },
            { id: 'numeroMatricula', sourceField: 'numeroMatricula' },
            { id: 'enderecoEmbarqueCompleto', sourceField: 'enderecoEmbarqueCompleto' },
            { id: 'pontoReferenciaEmbarque', sourceField: 'pontoReferenciaEmbarque' },
            { id: 'distanciaEscolaKm', sourceField: 'distanciaEscolaKm' },
            { id: 'zonaResidencia', sourceField: 'zonaResidencia' },
            { id: 'possuiNecessidadesEspeciais', sourceField: 'possuiNecessidadesEspeciais' },
            { id: 'tipoNecessidade', sourceField: 'tipoNecessidade' },
            { id: 'necessitaMonitor', sourceField: 'necessitaMonitor' },
            { id: 'motivoNecessidadeMonitor', sourceField: 'motivoNecessidadeMonitor' },
            { id: 'necessitaCadeiraRodas', sourceField: 'necessitaCadeiraRodas' },
            { id: 'horarioEntradaEscola', sourceField: 'horarioEntradaEscola' },
            { id: 'horarioSaidaEscola', sourceField: 'horarioSaidaEscola' },
            { id: 'necessitaTransporteIda', sourceField: 'necessitaTransporteIda' },
            { id: 'necessitaTransporteVolta', sourceField: 'necessitaTransporteVolta' }
          ],
          expectedRelationships: ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER']
        }]
      }
    },
  {
      name: 'Registro de Ocorrência Escolar',
      description: 'Registro de ocorrências disciplinares e comportamentais',
      departmentCode: 'EDUCACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR',
      requiresDocuments: false,
      estimatedDays: 1,
      priority: 3,
      category: 'Disciplina',
      icon: 'AlertTriangle',
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
          // ========== BLOCO 1: IDENTIFICAÇÃO DO RESPONSÁVEL ==========

          // ========== BLOCO 2: CONTATO DO RESPONSÁVEL ==========

          // ========== BLOCO 3: ENDEREÇO DO RESPONSÁVEL ==========
          pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

          // ========== BLOCO 4: COMPLEMENTARES DO RESPONSÁVEL ==========

          // ========== BLOCO 5: DADOS DO ALUNO ==========
          nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
          dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
          cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
          numeroMatricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },
          unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
          serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
          turma: { type: 'string', title: 'Turma', maxLength: 50 },
          turno: { type: 'string', title: 'Turno', enum: ['Matutino', 'Vespertino', 'Integral', 'Noturno'] },

          // ========== BLOCO 6: DADOS DA OCORRÊNCIA ==========
          tipoOcorrencia: {
            type: 'string',
            title: 'Tipo de Ocorrência',
            enum: ['Disciplinar', 'Comportamental', 'Falta', 'Violência', 'Bullying', 'Danos ao Patrimônio', 'Outro']
          },
          dataOcorrencia: { type: 'string', format: 'date', title: 'Data da Ocorrência' },
          horaOcorrencia: { type: 'string', title: 'Hora da Ocorrência', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
          localOcorrencia: { type: 'string', title: 'Local da Ocorrência', minLength: 3, maxLength: 200 },
          descricaoOcorrencia: { type: 'string', title: 'Descrição Detalhada da Ocorrência', minLength: 20, maxLength: 2000 },
          gravidadeOcorrencia: {
            type: 'string',
            title: 'Gravidade da Ocorrência',
            enum: ['LEVE', 'MODERADA', 'GRAVE', 'GRAVISSIMA']
          },

          // ========== BLOCO 7: PROFISSIONAL E MEDIDAS ==========
          professorRelator: { type: 'string', title: 'Professor/Servidor Relator', minLength: 3, maxLength: 200 },
          testemunhas: { type: 'string', title: 'Testemunhas (nomes)', maxLength: 500 },
          medidaTomada: { type: 'string', title: 'Medida Disciplinar Tomada', maxLength: 500 },
          responsavelNotificado: { type: 'boolean', title: 'Responsável Foi Notificado?', default: false },
          dataNotificacao: { type: 'string', format: 'date', title: 'Data da Notificação ao Responsável' },
          meioNotificacao: { type: 'string', title: 'Meio de Notificação', enum: ['Telefone', 'E-mail', 'Presencial', 'Carta', 'Outro'] },

          // ========== BLOCO 8: ENCAMINHAMENTOS ==========
          encaminhamentoPsicologico: { type: 'boolean', title: 'Encaminhado para Psicólogo Escolar?', default: false },
          encaminhamentoConselhoTutelar: { type: 'boolean', title: 'Encaminhado ao Conselho Tutelar?', default: false },
          acionamentoPolicia: { type: 'boolean', title: 'Houve Acionamento Policial?', default: false },
          boletimOcorrencia: { type: 'string', title: 'Número do Boletim de Ocorrência (se houver)', maxLength: 50 },

          // ========== BLOCO 9: OBSERVAÇÕES ==========
          observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 1000 }
        },
        required: [
          'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
          'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
          'nomeAluno', 'dataNascimentoAluno', 'numeroMatricula', 'unidadeEscolar', 'serie', 'turma', 'turno',
          'tipoOcorrencia', 'dataOcorrencia', 'horaOcorrencia', 'localOcorrencia', 'descricaoOcorrencia',
          'gravidadeOcorrencia', 'professorRelator'
        ]
      },
      linkedCitizensConfig: {
        enabled: true,
        links: [{
          linkType: 'STUDENT',
          role: 'BENEFICIARY',
          label: 'Aluno',
          description: 'Selecione o aluno relacionado à ocorrência',
          required: true,
          mapFromLegacyFields: {
            name: 'nomeAluno',
            birthDate: 'dataNascimentoAluno',
            cpf: 'cpfAluno'
          },
          contextFields: [
            { id: 'numeroMatricula', sourceField: 'numeroMatricula' },
            { id: 'unidadeEscolar', sourceField: 'unidadeEscolar' },
            { id: 'serie', sourceField: 'serie' },
            { id: 'turma', sourceField: 'turma' },
            { id: 'turno', sourceField: 'turno' },
            { id: 'tipoOcorrencia', sourceField: 'tipoOcorrencia' },
            { id: 'dataOcorrencia', sourceField: 'dataOcorrencia' },
            { id: 'horaOcorrencia', sourceField: 'horaOcorrencia' },
            { id: 'localOcorrencia', sourceField: 'localOcorrencia' },
            { id: 'descricaoOcorrencia', sourceField: 'descricaoOcorrencia' },
            { id: 'gravidadeOcorrencia', sourceField: 'gravidadeOcorrencia' }
          ],
          expectedRelationships: ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER']
        }]
      }
    },
  {
      name: 'Solicitação de Documento Escolar',
      description: 'Solicitação de histórico, declaração ou certificado',
      departmentCode: 'EDUCACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR',
      requiresDocuments: true,
      requiredDocuments: ['RG', 'Comprovante de Matrícula'],
      estimatedDays: 5,
      priority: 3,
      category: 'Documentos',
      icon: 'FileText',
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
          // ========== BLOCO 1: IDENTIFICAÇÃO DO SOLICITANTE (RESPONSÁVEL) ==========

          // ========== BLOCO 2: CONTATO DO SOLICITANTE ==========

          // ========== BLOCO 3: ENDEREÇO DO SOLICITANTE ==========
          pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

          // ========== BLOCO 4: COMPLEMENTARES DO SOLICITANTE ==========

          // ========== BLOCO 5: VÍNCULO COM O ALUNO ==========
          vinculoComAluno: { type: 'string', title: 'Vínculo com o Aluno', enum: ['Próprio Aluno (maior de idade)', 'Pai', 'Mãe', 'Avô/Avó', 'Tio/Tia', 'Irmão(ã) maior', 'Tutor Legal', 'Procurador', 'Outro'] },
          possuiProcuracao: { type: 'boolean', title: 'Possui Procuração? (se não for responsável direto)', default: false },

          // ========== BLOCO 6: DADOS DO ALUNO ==========
          nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
          cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
          dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
          numeroMatricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },
          unidadeEscolar: { type: 'string', title: 'Unidade Escolar onde estudou/estuda', minLength: 3, maxLength: 200 },

          // ========== BLOCO 7: DADOS DO DOCUMENTO SOLICITADO ==========
          tipoDocumento: {
            type: 'string',
            title: 'Tipo de Documento',
            enum: ['Histórico Escolar', 'Declaração de Matrícula', 'Declaração de Conclusão', 'Certificado de Conclusão', 'Boletim Escolar', 'Declaração de Frequência', 'Transferência', 'Outro']
          },
          outroTipoDocumento: { type: 'string', title: 'Especifique o Tipo de Documento (se Outro)', maxLength: 200 },
          anoLetivo: { type: 'string', title: 'Ano Letivo', pattern: '^\\d{4}$' },
          serieAnoReferencia: { type: 'string', title: 'Série/Ano de Referência', maxLength: 50 },
          periodoReferencia: { type: 'string', title: 'Período de Referência (se aplicável)', maxLength: 100 },

          // ========== BLOCO 8: FINALIDADE E ENTREGA ==========
          finalidade: { type: 'string', title: 'Finalidade do Documento', minLength: 10, maxLength: 300 },
          instituicaoDestino: { type: 'string', title: 'Instituição de Destino (se aplicável)', maxLength: 200 },
          urgente: { type: 'boolean', title: 'Solicitação Urgente?', default: false },
          motivoUrgencia: { type: 'string', title: 'Motivo da Urgência (se urgente)', maxLength: 300 },
          formaEntrega: { type: 'string', title: 'Forma de Entrega Desejada', enum: ['Retirada Presencial', 'Correios (sedex)', 'E-mail (se permitido)', 'Outra'] },
          enderecoEntrega: { type: 'string', title: 'Endereço para Entrega (se diferente do cadastro)', maxLength: 300 },

          // ========== BLOCO 9: OBSERVAÇÕES ==========
          observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
        },
        required: [
          'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
          'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
          'vinculoComAluno', 'nomeAluno', 'dataNascimentoAluno', 'unidadeEscolar',
          'tipoDocumento', 'anoLetivo', 'finalidade', 'formaEntrega'
        ]
      },
      linkedCitizensConfig: {
        enabled: true,
        links: [{
          linkType: 'STUDENT',
          role: 'BENEFICIARY',
          label: 'Aluno',
          description: 'Selecione o aluno para o qual o documento será emitido',
          required: true,
          mapFromLegacyFields: {
            name: 'nomeAluno',
            cpf: 'cpfAluno',
            birthDate: 'dataNascimentoAluno'
          },
          contextFields: [
            { id: 'numeroMatricula', sourceField: 'numeroMatricula' },
            { id: 'unidadeEscolar', sourceField: 'unidadeEscolar' },
            { id: 'tipoDocumento', sourceField: 'tipoDocumento' },
            { id: 'anoLetivo', sourceField: 'anoLetivo' },
            { id: 'serieAnoReferencia', sourceField: 'serieAnoReferencia' },
            { id: 'periodoReferencia', sourceField: 'periodoReferencia' }
          ],
          expectedRelationships: ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER']
        }]
      }
    },
  {
      name: 'Consulta de Frequência',
      description: 'Consulta ao registro de frequência do aluno',
      departmentCode: 'EDUCACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'CONSULTA_FREQUENCIA',
      requiresDocuments: false,
      estimatedDays: 1,
      priority: 2,
      category: 'Consulta',
      icon: 'Calendar',
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
          // ========== BLOCO 1: IDENTIFICAÇÃO DO SOLICITANTE ==========

          // ========== BLOCO 2: CONTATO DO SOLICITANTE ==========

          // ========== BLOCO 3: ENDEREÇO DO SOLICITANTE ==========
          pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

          // ========== BLOCO 4: COMPLEMENTARES DO SOLICITANTE ==========

          // ========== BLOCO 5: VÍNCULO COM O ALUNO ==========
          vinculoComAluno: { type: 'string', title: 'Vínculo com o Aluno', enum: ['Próprio Aluno (maior)', 'Pai', 'Mãe', 'Avô/Avó', 'Tio/Tia', 'Irmão(ã)', 'Tutor Legal', 'Outro'] },

          // ========== BLOCO 6: DADOS DO ALUNO ==========
          nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
          matricula: { type: 'string', title: 'Número da Matrícula', minLength: 5, maxLength: 50 },
          unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
          serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
          turma: { type: 'string', title: 'Turma', maxLength: 50 },

          // ========== BLOCO 7: CONSULTA ==========
          periodoConsulta: {
            type: 'string',
            title: 'Período da Consulta',
            enum: ['BIMESTRE_1', 'BIMESTRE_2', 'BIMESTRE_3', 'BIMESTRE_4', 'ANO_COMPLETO']
          },
          anoLetivo: { type: 'string', title: 'Ano Letivo', pattern: '^\\d{4}$' }
        },
        required: [
          'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
          'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
          'vinculoComAluno', 'nomeAluno', 'matricula', 'unidadeEscolar', 'serie',
          'periodoConsulta', 'anoLetivo'
        ]
      },
      linkedCitizensConfig: {
        enabled: true,
        links: [{
          linkType: 'STUDENT',
          role: 'BENEFICIARY',
          label: 'Aluno',
          description: 'Selecione o aluno para consulta de frequência',
          required: true,
          mapFromLegacyFields: {
            name: 'nomeAluno'
          },
          contextFields: [
            { id: 'matricula', sourceField: 'matricula' },
            { id: 'unidadeEscolar', sourceField: 'unidadeEscolar' },
            { id: 'serie', sourceField: 'serie' },
            { id: 'turma', sourceField: 'turma' },
            { id: 'periodoConsulta', sourceField: 'periodoConsulta' },
            { id: 'anoLetivo', sourceField: 'anoLetivo' }
          ],
          expectedRelationships: ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER']
        }]
      }
    },
  {
      name: 'Consulta de Notas e Boletim',
      description: 'Consulta de notas e desempenho escolar',
      departmentCode: 'EDUCACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'CONSULTA_NOTAS',
      requiresDocuments: false,
      estimatedDays: 1,
      priority: 2,
      category: 'Consulta',
      icon: 'ClipboardList',
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
          // ========== BLOCO 1: IDENTIFICAÇÃO DO SOLICITANTE ==========

          // ========== BLOCO 2: CONTATO DO SOLICITANTE ==========

          // ========== BLOCO 3: ENDEREÇO DO SOLICITANTE ==========
          pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

          // ========== BLOCO 4: COMPLEMENTARES DO SOLICITANTE ==========

          // ========== BLOCO 5: VÍNCULO COM O ALUNO ==========
          vinculoComAluno: { type: 'string', title: 'Vínculo com o Aluno', enum: ['Próprio Aluno (maior)', 'Pai', 'Mãe', 'Avô/Avó', 'Tio/Tia', 'Irmão(ã)', 'Tutor Legal', 'Outro'] },

          // ========== BLOCO 6: DADOS DO ALUNO ==========
          nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
          matricula: { type: 'string', title: 'Número da Matrícula', minLength: 5, maxLength: 50 },
          unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
          serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
          turma: { type: 'string', title: 'Turma', maxLength: 50 },

          // ========== BLOCO 7: CONSULTA ==========
          periodoConsulta: {
            type: 'string',
            title: 'Período da Consulta',
            enum: ['BIMESTRE_1', 'BIMESTRE_2', 'BIMESTRE_3', 'BIMESTRE_4', 'ANO_COMPLETO']
          },
          anoLetivo: { type: 'string', title: 'Ano Letivo', pattern: '^\\d{4}$' },
          disciplinaEspecifica: { type: 'string', title: 'Disciplina Específica (opcional)', maxLength: 100 }
        },
        required: [
          'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
          'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
          'vinculoComAluno', 'nomeAluno', 'matricula', 'unidadeEscolar', 'serie',
          'periodoConsulta', 'anoLetivo'
        ]
      },
      linkedCitizensConfig: {
        enabled: true,
        links: [{
          linkType: 'STUDENT',
          role: 'BENEFICIARY',
          label: 'Aluno',
          description: 'Selecione o aluno para consulta de notas e boletim',
          required: true,
          mapFromLegacyFields: {
            name: 'nomeAluno'
          },
          contextFields: [
            { id: 'matricula', sourceField: 'matricula' },
            { id: 'unidadeEscolar', sourceField: 'unidadeEscolar' },
            { id: 'serie', sourceField: 'serie' },
            { id: 'turma', sourceField: 'turma' },
            { id: 'periodoConsulta', sourceField: 'periodoConsulta' },
            { id: 'anoLetivo', sourceField: 'anoLetivo' },
            { id: 'disciplinaEspecifica', sourceField: 'disciplinaEspecifica' }
          ],
          expectedRelationships: ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER']
        }]
      }
    },
  {
      name: 'Gestão Escolar',
      description: 'Administração de unidades escolares',
      departmentCode: 'EDUCACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'GESTAO_ESCOLAR',
      requiresDocuments: false,
      estimatedDays: null,
      priority: 2,
      category: 'Gestão Interna',
      icon: 'Building',
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
          nomeEscola: { type: 'string', title: 'Nome da Unidade Escolar', minLength: 3, maxLength: 200 },
          codigoINEP: { type: 'string', title: 'Código INEP da Escola', maxLength: 50 },
          enderecoEscola: { type: 'string', title: 'Endereço da Escola', maxLength: 300 },
          tipoGestao: { type: 'string', title: 'Tipo de Gestão', enum: ['Administração Geral', 'Gestão Pedagógica', 'Gestão de Recursos Humanos', 'Gestão Financeira', 'Infraestrutura', 'Outro'] },
          numeroAlunos: { type: 'number', title: 'Número de Alunos', minimum: 0 },
          numeroTurmas: { type: 'number', title: 'Número de Turmas', minimum: 0 },
          numeroProfessores: { type: 'number', title: 'Número de Professores', minimum: 0 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 1000 },
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeEscola', 'codigoINEP', 'enderecoEscola', 'tipoGestao'],
      },
    },
  {
      name: 'Histórico Escolar',
      description: 'Emissão de histórico escolar completo do aluno',
      departmentCode: 'EDUCACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['RG do Responsável', 'RG do Aluno (se possuir)'],
      estimatedDays: 7,
      priority: 4,
      category: 'Documentos',
      icon: 'ScrollText',
      color: '#2563eb',
    },
  {
      name: 'Declaração de Conclusão',
      description: 'Emissão de declaração de conclusão de série ou nível de ensino',
      departmentCode: 'EDUCACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['RG do Responsável', 'Comprovante de Conclusão'],
      estimatedDays: 5,
      priority: 3,
      category: 'Declarações',
      icon: 'Award',
      color: '#f59e0b',
    },
  {
      name: 'Segunda Via de Documentos Escolares',
      description: 'Emissão de segunda via de boletim, certificado ou outros documentos',
      departmentCode: 'EDUCACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['RG do Responsável', 'Boletim de Ocorrência (se perda/roubo)'],
      estimatedDays: 7,
      priority: 3,
      category: 'Documentos',
      icon: 'Copy',
      color: '#8b5cf6',
    },
  {
      name: 'Certidão de Escolaridade',
      description: 'Emissão de certidão comprovando nível de escolaridade do aluno',
      departmentCode: 'EDUCACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['RG do Responsável', 'RG do Aluno (se possuir)'],
      estimatedDays: 5,
      priority: 2,
      category: 'Certidões',
      icon: 'FileBadge',
      color: '#06b6d4',
    }
];
