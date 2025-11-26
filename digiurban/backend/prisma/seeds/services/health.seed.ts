/**
 * SEED DE SERVIÇOS - SECRETARIA DE SAÚDE
 * Total: 8 serviços
 */

import { ServiceDefinition } from './types';

export const healthServices: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Saúde',
    description: 'Registro geral de atendimentos na área da saúde',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_SAUDE',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Activity',
    color: '#10b981',
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
          label: 'Ponto de Referência (opcional)',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'cartaoSUS',
          label: 'Cartão SUS (CNS)',
          type: 'text',
          pattern: '^\\d{15}$',
          minLength: 15,
          maxLength: 15,
          required: true
        },
        {
          id: 'tipoSanguineo',
          label: 'Tipo Sanguíneo',
          type: 'select',
          options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não sei'],
          required: false
        },
        {
          id: 'tipoAtendimento',
          label: 'Tipo de Atendimento',
          type: 'select',
          options: ['Consulta', 'Emergência', 'Retorno', 'Preventivo', 'Vacinação', 'Exame'],
          required: true
        },
        {
          id: 'unidadeSaude',
          label: 'Unidade de Saúde',
          type: 'select',
          enumSource: 'MS_UNIDADES_SAUDE',
          required: true
        },
        {
          id: 'dataAtendimento',
          label: 'Data do Atendimento',
          type: 'date',
          required: true
        },
        {
          id: 'horaAtendimento',
          label: 'Hora do Atendimento',
          type: 'text',
          pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
          required: false
        },
        {
          id: 'profissionalResponsavel',
          label: 'Profissional Responsável',
          type: 'select',
          enumSource: 'MS_PROFISSIONAIS_SAUDE',
          required: false
        },
        {
          id: 'cnsProfissional',
          label: 'CNS do Profissional',
          type: 'text',
          maxLength: 20,
          required: false
        },
        {
          id: 'especialidade',
          label: 'Especialidade',
          type: 'text',
          maxLength: 100,
          required: false
        },
        {
          id: 'descricao',
          label: 'Descrição/Queixa Principal',
          type: 'textarea',
          minLength: 10,
          maxLength: 2000,
          required: true
        },
        {
          id: 'diagnostico',
          label: 'Diagnóstico/CID',
          type: 'textarea',
          maxLength: 500,
          required: false
        },
        {
          id: 'procedimentosRealizados',
          label: 'Procedimentos Realizados',
          type: 'textarea',
          maxLength: 1000,
          required: false
        },
        {
          id: 'prescricoes',
          label: 'Prescrições/Orientações Médicas',
          type: 'textarea',
          maxLength: 1000,
          required: false
        },
        {
          id: 'prioridade',
          label: 'Prioridade',
          type: 'select',
          options: ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'],
          defaultValue: 'NORMAL',
          required: false
        },
        {
          id: 'encaminhamento',
          label: 'Houve Encaminhamento?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'especialidadeEncaminhamento',
          label: 'Especialidade do Encaminhamento',
          type: 'text',
          maxLength: 200,
          required: false
        }
      ]
    }
  },
  {
    name: 'Agendamento de Consulta Médica',
    description: 'Agende consultas médicas nas unidades de saúde',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'AGENDAMENTOS_MEDICOS',
    requiresDocuments: true,
    requiredDocuments: ['Cartão SUS', 'Documento de Identidade'],
    estimatedDays: 7,
    priority: 4,
    category: 'Agendamento',
    icon: 'Calendar',
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
        'citizen_maritalstatus'
      ],
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência (opcional)',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'cartaoSUS',
          label: 'Cartão SUS (CNS)',
          type: 'text',
          pattern: '^\\d{15}$',
          minLength: 15,
          maxLength: 15,
          required: true
        },
        {
          id: 'alergiasMedicamentos',
          label: 'Alergias a Medicamentos (se houver)',
          type: 'textarea',
          maxLength: 500,
          required: false
        },
        {
          id: 'necessidadesEspeciais',
          label: 'Necessidades Especiais',
          type: 'select',
          options: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra'],
          required: false
        },
        {
          id: 'possuiConvenio',
          label: 'Possui Convênio Particular?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'nomeConvenio',
          label: 'Nome do Convênio',
          type: 'text',
          maxLength: 100,
          required: false
        },
        {
          id: 'especialidade',
          label: 'Especialidade',
          type: 'select',
          options: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Cardiologia', 'Ortopedia', 'Dermatologia', 'Oftalmologia', 'Odontologia', 'Psicologia', 'Nutrição'],
          required: true
        },
        {
          id: 'unidadePreferencial',
          label: 'Unidade de Saúde Preferencial',
          type: 'select',
          enumSource: 'MS_UNIDADES_SAUDE',
          required: true
        },
        {
          id: 'dataPreferencial',
          label: 'Data Preferencial',
          type: 'date',
          required: false
        },
        {
          id: 'turnoPreferencial',
          label: 'Turno Preferencial',
          type: 'select',
          options: ['Manhã', 'Tarde', 'Qualquer'],
          required: false
        },
        {
          id: 'motivoConsulta',
          label: 'Motivo da Consulta',
          type: 'textarea',
          minLength: 10,
          maxLength: 500,
          required: true
        },
        {
          id: 'primeiraConsulta',
          label: 'Primeira Consulta na Especialidade?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'urgencia',
          label: 'Caso Urgente?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'justificativaUrgencia',
          label: 'Justificativa da Urgência',
          type: 'textarea',
          minLength: 20,
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
    name: 'Controle de Medicamentos',
    description: 'Solicitação e controle de medicamentos da farmácia básica',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CONTROLE_MEDICAMENTOS',
    requiresDocuments: true,
    requiredDocuments: ['Receita Médica', 'Cartão SUS'],
    estimatedDays: 2,
    priority: 5,
    category: 'Medicamentos',
    icon: 'Pill',
    color: '#ef4444',
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
          label: 'Ponto de Referência (opcional)',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'cartaoSUS',
          label: 'Cartão SUS (CNS)',
          type: 'text',
          pattern: '^\\d{15}$',
          minLength: 15,
          maxLength: 15,
          required: true
        },
        {
          id: 'alergiasMedicamentos',
          label: 'Alergias a Medicamentos (se houver)',
          type: 'textarea',
          maxLength: 500,
          required: false
        },
        {
          id: 'necessidadesEspeciais',
          label: 'Necessidades Especiais',
          type: 'select',
          options: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra'],
          required: false
        },
        {
          id: 'dificuldadeLocomocao',
          label: 'Possui Dificuldade de Locomoção?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'numeroReceita',
          label: 'Número da Receita',
          type: 'text',
          minLength: 5,
          maxLength: 50,
          required: true
        },
        {
          id: 'dataReceita',
          label: 'Data da Receita',
          type: 'date',
          required: true
        },
        {
          id: 'nomeMedico',
          label: 'Nome do Médico',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'crmMedico',
          label: 'CRM do Médico',
          type: 'text',
          pattern: '^\\d{4,8}$',
          required: true
        },
        {
          id: 'especialidadeMedico',
          label: 'Especialidade do Médico',
          type: 'text',
          maxLength: 100,
          required: false
        },
        {
          id: 'medicamentos',
          label: 'Medicamentos Solicitados',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dosagem: { type: 'string', title: 'Dosagem', maxLength: 50 },
              quantidade: { type: 'integer', title: 'Quantidade', minimum: 1 },
              posologia: { type: 'string', title: 'Posologia', maxLength: 200 },
              duracao: { type: 'string', title: 'Duração do Tratamento', maxLength: 100 },
              viaAdministracao: { type: 'string', title: 'Via de Administração', enum: ['Oral', 'Injetável', 'Tópica', 'Inalatória', 'Outra'] }
            },
            required: ['nome', 'dosagem', 'quantidade']
          },
          minItems: 1,
          required: true
        },
        {
          id: 'usoContínuo',
          label: 'Uso Contínuo (mais de 3 meses)',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'unidadeRetirada',
          label: 'Unidade de Retirada Preferencial',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'horarioPreferencialRetirada',
          label: 'Horário Preferencial',
          type: 'select',
          options: ['Manhã (08:00-12:00)', 'Tarde (13:00-17:00)', 'Qualquer'],
          required: false
        },
        {
          id: 'solicitaEntregaDomiciliar',
          label: 'Solicita Entrega Domiciliar?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'justificativaEntregaDomiciliar',
          label: 'Justificativa para Entrega Domiciliar',
          type: 'textarea',
          maxLength: 500,
          required: false
        },
        {
          id: 'autorizaFamiliarRetirar',
          label: 'Autoriza Familiar a Retirar?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'nomeFamiliarAutorizado',
          label: 'Nome do Familiar Autorizado',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: false
        },
        {
          id: 'cpfFamiliarAutorizado',
          label: 'CPF do Familiar Autorizado',
          type: 'text',
          pattern: '^\\d{11}$',
          minLength: 11,
          maxLength: 11,
          required: false
        },
        {
          id: 'parentescoFamiliar',
          label: 'Grau de Parentesco',
          type: 'select',
          options: ['Cônjuge', 'Filho(a)', 'Pai/Mãe', 'Irmão(ã)', 'Neto(a)', 'Outro'],
          required: false
        },
        {
          id: 'observacoes',
          label: 'Observações Gerais',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    },
    linkedCitizensConfig: {
      enabled: true,
      links: [{
        linkType: 'AUTHORIZED_PERSON',
        role: 'AUTHORIZED',
        label: 'Familiar Autorizado',
        required: false,
        mapFromLegacyFields: {
          name: 'nomeFamiliarAutorizado',
          cpf: 'cpfFamiliarAutorizado'
        },
        contextFields: [
          { id: 'parentescoFamiliar', sourceField: 'parentescoFamiliar' }
        ],
        expectedRelationships: ['SPOUSE', 'SON', 'DAUGHTER', 'MOTHER', 'FATHER']
      }]
    }
  },
  {
    name: 'Campanhas de Vacinação',
    description: 'Registro de participação em campanhas de vacinação',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CAMPANHAS_SAUDE',
    requiresDocuments: true,
    requiredDocuments: ['Cartão de Vacina', 'Documento de Identidade'],
    estimatedDays: 1,
    priority: 5,
    category: 'Prevenção',
    icon: 'Syringe',
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
        // ========== BLOCO 1: ENDEREÇO COMPLEMENTAR ==========
        { id: 'pontoReferencia', type: 'text', label: 'Ponto de Referência (opcional)', required: false, maxLength: 200 },

        // ========== BLOCO 2: DADOS DE SAÚDE ==========
        { id: 'cartaoSUS', type: 'text', label: 'Cartão SUS (CNS)', required: true, pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        { id: 'possuiCartaoVacina', type: 'checkbox', label: 'Possui Cartão de Vacina?', required: false, defaultValue: false },
        { id: 'numeroCartaoVacina', type: 'text', label: 'Número do Cartão de Vacina', required: false, maxLength: 50 },
        { id: 'alergiasMedicamentos', type: 'textarea', label: 'Alergias a Medicamentos/Vacinas (se houver)', required: false, maxLength: 500 },
        {
          id: 'necessidadesEspeciais',
          type: 'select',
          label: 'Necessidades Especiais',
          required: false,
          options: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra']
        },

        // ========== BLOCO 3: DADOS DA CAMPANHA ==========
        {
          id: 'tipoCampanha',
          type: 'select',
          label: 'Tipo de Campanha/Vacina',
          required: true,
          options: ['Gripe', 'COVID-19', 'Sarampo', 'Pólio', 'Multivacinação', 'HPV', 'Meningite', 'Febre Amarela', 'Hepatite', 'Tétano', 'Pneumonia', 'Outras']
        },
        {
          id: 'grupoRisco',
          type: 'select',
          label: 'Grupo de Risco',
          required: true,
          options: ['Criança (0-11 anos)', 'Adolescente (12-18 anos)', 'Adulto (19-59 anos)', 'Idoso (60+ anos)', 'Gestante', 'Puérpera', 'Profissional de Saúde', 'Professor', 'Portador de Comorbidade', 'Não se aplica']
        },
        { id: 'gestante', type: 'checkbox', label: 'É Gestante?', required: false, defaultValue: false },
        { id: 'semanasGestacao', type: 'number', label: 'Semanas de Gestação', required: false, minimum: 1, maximum: 42 },
        { id: 'possuiComorbidade', type: 'checkbox', label: 'Possui Comorbidade?', required: false, defaultValue: false },
        { id: 'descricaoComorbidade', type: 'textarea', label: 'Descrição da Comorbidade', required: false, maxLength: 500 },

        // ========== BLOCO 4: AGENDAMENTO/LOCAL ==========
        { id: 'unidadePreferencial', type: 'text', label: 'Unidade de Saúde Preferencial', required: true, minLength: 3, maxLength: 200 },
        { id: 'dataPreferencial', type: 'date', label: 'Data Preferencial', required: false },
        {
          id: 'turnoPreferencial',
          type: 'select',
          label: 'Turno Preferencial',
          required: false,
          options: ['Manhã', 'Tarde', 'Qualquer']
        },
        { id: 'temDificuldadeLocomocao', type: 'checkbox', label: 'Possui Dificuldade de Locomoção?', required: false, defaultValue: false },
        { id: 'solicitaVacinacaoDomiciliar', type: 'checkbox', label: 'Solicita Vacinação Domiciliar?', required: false, defaultValue: false },
        { id: 'justificativaVacinacaoDomiciliar', type: 'textarea', label: 'Justificativa para Vacinação Domiciliar', required: false, maxLength: 500 },

        // ========== BLOCO 5: OBSERVAÇÕES ==========
        { id: 'observacoes', type: 'textarea', label: 'Observações Gerais', required: false, maxLength: 500 }
      ]
    }
  },
  {
    name: 'Programas de Saúde',
    description: 'Inscrição em programas de saúde (hipertensão, diabetes, etc)',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'PROGRAMAS_SAUDE',
    requiresDocuments: true,
    requiredDocuments: ['Laudo Médico', 'Cartão SUS'],
    estimatedDays: 5,
    priority: 4,
    category: 'Programas',
    icon: 'Heart',
    color: '#ec4899',
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
        // ========== BLOCO 1: ENDEREÇO COMPLEMENTAR ==========
        { id: 'pontoReferencia', type: 'text', label: 'Ponto de Referência (opcional)', required: false, maxLength: 200 },

        // ========== BLOCO 2: DADOS DE SAÚDE ==========
        { id: 'cartaoSUS', type: 'text', label: 'Cartão SUS (CNS)', required: true, pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        { id: 'alergiasMedicamentos', type: 'textarea', label: 'Alergias a Medicamentos (se houver)', required: false, maxLength: 500 },
        {
          id: 'necessidadesEspeciais',
          type: 'select',
          label: 'Necessidades Especiais',
          required: false,
          options: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra']
        },
        { id: 'peso', type: 'number', label: 'Peso (kg)', required: false, minimum: 1, maximum: 300 },
        { id: 'altura', type: 'number', label: 'Altura (cm)', required: false, minimum: 40, maximum: 250 },

        // ========== BLOCO 3: DADOS DO PROGRAMA ==========
        {
          id: 'tipoPrograma',
          type: 'select',
          label: 'Tipo de Programa',
          required: true,
          options: ['Hipertensão', 'Diabetes', 'Gestante', 'Saúde Mental', 'Idoso', 'Pré-Natal', 'Criança Saudável', 'Obesidade', 'Tabagismo', 'Alcoolismo', 'Hanseníase', 'Tuberculose', 'Outro']
        },
        { id: 'motivoInscricao', type: 'textarea', label: 'Motivo da Inscrição no Programa', required: true, minLength: 10, maxLength: 500 },
        { id: 'diagnostico', type: 'textarea', label: 'Diagnóstico Principal (CID-10)', required: true, minLength: 3, maxLength: 500 },
        { id: 'possuiDiagnosticoMedico', type: 'checkbox', label: 'Possui Diagnóstico Médico Formal?', required: false, defaultValue: false },
        { id: 'comorbidades', type: 'textarea', label: 'Comorbidades (outras doenças)', required: false, maxLength: 500 },

        // ========== BLOCO 4: MÉDICO RESPONSÁVEL ==========
        { id: 'nomeMedico', type: 'text', label: 'Nome do Médico Responsável', required: true, minLength: 3, maxLength: 200 },
        { id: 'crmMedico', type: 'text', label: 'CRM do Médico', required: true, pattern: '^\\d{4,8}$' },
        { id: 'especialidadeMedico', type: 'text', label: 'Especialidade do Médico', required: false, maxLength: 100 },
        { id: 'dataUltimaConsulta', type: 'date', label: 'Data da Última Consulta', required: false },

        // ========== BLOCO 5: ACOMPANHAMENTO ==========
        { id: 'dataInicio', type: 'date', label: 'Data de Início no Programa', required: true },
        { id: 'unidadeAcompanhamento', type: 'text', label: 'Unidade de Saúde para Acompanhamento', required: true, minLength: 3, maxLength: 200 },
        {
          id: 'frequenciaConsultas',
          type: 'select',
          label: 'Frequência de Consultas',
          required: true,
          options: ['Semanal', 'Quinzenal', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral']
        },
        {
          id: 'horarioPreferencial',
          type: 'select',
          label: 'Horário Preferencial',
          required: false,
          options: ['Manhã', 'Tarde', 'Qualquer']
        },
        { id: 'necessitaAcompanhante', type: 'checkbox', label: 'Necessita Acompanhante?', required: false, defaultValue: false },

        // ========== BLOCO 6: MEDICAMENTOS E TRATAMENTO ==========
        { id: 'fazUsoMedicamentoContinuo', type: 'checkbox', label: 'Faz Uso de Medicamento Contínuo?', required: false, defaultValue: false },
        { id: 'medicamentosUso', type: 'textarea', label: 'Medicamentos em Uso Contínuo', required: false, maxLength: 1000 },
        { id: 'possuiDificuldadeObterMedicamento', type: 'checkbox', label: 'Possui Dificuldade em Obter Medicamento?', required: false, defaultValue: false },
        { id: 'retiraraMedicamentoFarmaciaBasica', type: 'checkbox', label: 'Retirará Medicamentos na Farmácia Básica?', required: false, defaultValue: false },

        // ========== BLOCO 7: OBSERVAÇÕES ==========
        { id: 'observacoes', type: 'textarea', label: 'Observações Gerais', required: false, maxLength: 1000 }
      ]
    }
  },
  {
    name: 'Encaminhamento TFD (Tratamento Fora do Domicílio)',
    description: 'Solicitação de transporte e tratamento fora do município',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'ENCAMINHAMENTOS_TFD',
    requiresDocuments: true,
    requiredDocuments: ['Encaminhamento Médico', 'Exames', 'Cartão SUS'],
    estimatedDays: 15,
    priority: 5,
    category: 'TFD',
    icon: 'Ambulance',
    color: '#f59e0b',
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
          label: 'Ponto de Referência (opcional)',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'cartaoSUS',
          label: 'Cartão SUS (CNS)',
          type: 'text',
          pattern: '^\\d{15}$',
          minLength: 15,
          maxLength: 15,
          required: true
        },
        {
          id: 'alergiasMedicamentos',
          label: 'Alergias a Medicamentos (se houver)',
          type: 'textarea',
          maxLength: 500,
          required: false
        },
        {
          id: 'necessidadesEspeciais',
          label: 'Necessidades Especiais',
          type: 'select',
          options: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Acamado', 'Outra'],
          required: false
        },
        {
          id: 'nomeMedicoSolicitante',
          label: 'Médico Solicitante',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'crmMedico',
          label: 'CRM do Médico',
          type: 'text',
          pattern: '^\\d{4,8}$',
          required: true
        },
        {
          id: 'especialidadeMedicoSolicitante',
          label: 'Especialidade do Médico',
          type: 'text',
          maxLength: 100,
          required: false
        },
        {
          id: 'dataEncaminhamento',
          label: 'Data do Encaminhamento Médico',
          type: 'date',
          required: true
        },
        {
          id: 'numeroEncaminhamento',
          label: 'Número do Encaminhamento',
          type: 'text',
          maxLength: 50,
          required: false
        },
        {
          id: 'especialidadeDestino',
          label: 'Especialidade de Destino',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'tipoTratamento',
          label: 'Tipo de Tratamento',
          type: 'select',
          options: ['Consulta Especializada', 'Cirurgia', 'Exames Especializados', 'Radioterapia', 'Quimioterapia', 'Hemodiálise', 'Fisioterapia', 'Outro'],
          required: true
        },
        {
          id: 'motivoEncaminhamento',
          label: 'Motivo do Encaminhamento',
          type: 'textarea',
          minLength: 20,
          maxLength: 1000,
          required: true
        },
        {
          id: 'diagnostico',
          label: 'Diagnóstico Principal (CID-10)',
          type: 'textarea',
          maxLength: 500,
          required: true
        },
        {
          id: 'historicoDoenca',
          label: 'Histórico da Doença',
          type: 'textarea',
          maxLength: 1000,
          required: false
        },
        {
          id: 'urgente',
          label: 'Caso Urgente?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'cidadeDestino',
          label: 'Cidade de Destino',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'estadoDestino',
          label: 'Estado de Destino (UF)',
          type: 'text',
          pattern: '^[A-Z]{2}$',
          minLength: 2,
          maxLength: 2,
          required: true
        },
        {
          id: 'hospitalDestino',
          label: 'Hospital/Clínica de Destino (se conhecido)',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'dataPreferencialAtendimento',
          label: 'Data Preferencial de Atendimento',
          type: 'date',
          required: false
        },
        {
          id: 'necessitaAcompanhante',
          label: 'Necessita Acompanhante?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'nomeAcompanhante',
          label: 'Nome Completo do Acompanhante',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'cpfAcompanhante',
          label: 'CPF do Acompanhante',
          type: 'text',
          pattern: '^\\d{11}$',
          minLength: 11,
          maxLength: 11,
          required: false
        },
        {
          id: 'rgAcompanhante',
          label: 'RG do Acompanhante',
          type: 'text',
          maxLength: 20,
          required: false
        },
        {
          id: 'telefoneAcompanhante',
          label: 'Telefone do Acompanhante',
          type: 'text',
          pattern: '^\\d{10,11}$',
          required: false
        },
        {
          id: 'parentescoAcompanhante',
          label: 'Grau de Parentesco',
          type: 'select',
          options: ['Cônjuge', 'Filho(a)', 'Pai/Mãe', 'Irmão(ã)', 'Neto(a)', 'Outro'],
          required: false
        },
        {
          id: 'necessitaTransporte',
          label: 'Necessita Transporte?',
          type: 'checkbox',
          defaultValue: true,
          required: false
        },
        {
          id: 'tipoTransporte',
          label: 'Tipo de Transporte Necessário',
          type: 'select',
          options: ['Veículo Comum', 'Ambulância Simples', 'Ambulância UTI', 'Outro'],
          required: false
        },
        {
          id: 'necessitaHospedagem',
          label: 'Necessita Hospedagem?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'diasEstimadosHospedagem',
          label: 'Dias Estimados de Hospedagem',
          type: 'number',
          minimum: 1,
          maximum: 90,
          required: false
        },
        {
          id: 'necessitaAjudaCusto',
          label: 'Necessita Ajuda de Custo?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'observacoes',
          label: 'Observações Gerais',
          type: 'textarea',
          maxLength: 1000,
          required: false
        }
      ]
    },
    linkedCitizensConfig: {
      enabled: true,
      links: [{
        linkType: 'COMPANION',
        role: 'COMPANION',
        label: 'Acompanhante',
        required: false,
        mapFromLegacyFields: {
          name: 'nomeAcompanhante',
          cpf: 'cpfAcompanhante'
        },
        contextFields: [
          { id: 'parentescoAcompanhante', sourceField: 'parentescoAcompanhante' }
        ],
        expectedRelationships: ['SPOUSE', 'SON', 'DAUGHTER', 'MOTHER', 'FATHER', 'SIBLING']
      }]
    }
  },
  {
    name: 'Solicitação de Exames',
    description: 'Agendamento de exames laboratoriais e de imagem',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'EXAMES',
    requiresDocuments: true,
    requiredDocuments: ['Pedido Médico', 'Cartão SUS'],
    estimatedDays: 10,
    priority: 4,
    category: 'Exames',
    icon: 'FileText',
    color: '#06b6d4',
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
          label: 'Ponto de Referência (opcional)',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'cartaoSUS',
          label: 'Cartão SUS (CNS)',
          type: 'text',
          pattern: '^\\d{15}$',
          minLength: 15,
          maxLength: 15,
          required: true
        },
        {
          id: 'alergiasMedicamentos',
          label: 'Alergias a Medicamentos/Contrastes (se houver)',
          type: 'textarea',
          maxLength: 500,
          required: false
        },
        {
          id: 'necessidadesEspeciais',
          label: 'Necessidades Especiais',
          type: 'select',
          options: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra'],
          required: false
        },
        {
          id: 'peso',
          label: 'Peso (kg)',
          type: 'number',
          minimum: 1,
          maximum: 300,
          required: false
        },
        {
          id: 'altura',
          label: 'Altura (cm)',
          type: 'number',
          minimum: 40,
          maximum: 250,
          required: false
        },
        {
          id: 'nomeMedicoSolicitante',
          label: 'Médico Solicitante',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'crmMedico',
          label: 'CRM do Médico',
          type: 'text',
          pattern: '^\\d{4,8}$',
          required: true
        },
        {
          id: 'especialidadeMedico',
          label: 'Especialidade do Médico',
          type: 'text',
          maxLength: 100,
          required: false
        },
        {
          id: 'dataPedido',
          label: 'Data do Pedido Médico',
          type: 'date',
          required: true
        },
        {
          id: 'numeroPedido',
          label: 'Número do Pedido',
          type: 'text',
          maxLength: 50,
          required: false
        },
        {
          id: 'tipoExame',
          label: 'Tipo de Exame',
          type: 'select',
          options: ['Laboratorial', 'Imagem (Raio-X, Ultrassom, Tomografia)', 'Cardiológico', 'Oftalmológico', 'Auditivo', 'Endoscópico', 'Outro'],
          required: true
        },
        {
          id: 'examesSolicitados',
          label: 'Exames Solicitados',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nomeExame: { type: 'string', title: 'Nome do Exame', minLength: 3, maxLength: 200 },
              codigoExame: { type: 'string', title: 'Código do Exame (se conhecido)', maxLength: 50 },
              urgencia: { type: 'boolean', title: 'Urgente', default: false }
            },
            required: ['nomeExame']
          },
          minItems: 1,
          required: true
        },
        {
          id: 'motivoSolicitacao',
          label: 'Motivo da Solicitação/Hipótese Diagnóstica',
          type: 'textarea',
          minLength: 10,
          maxLength: 500,
          required: true
        },
        {
          id: 'hipoteseDiagnostica',
          label: 'Hipótese Diagnóstica (CID-10)',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'dataPreferencial',
          label: 'Data Preferencial',
          type: 'date',
          required: false
        },
        {
          id: 'turnoPreferencial',
          label: 'Turno Preferencial',
          type: 'select',
          options: ['Manhã', 'Tarde', 'Qualquer'],
          required: false
        },
        {
          id: 'unidadePreferencial',
          label: 'Unidade de Saúde Preferencial',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: false
        },
        {
          id: 'jejumNecessario',
          label: 'Jejum Necessário?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'horasJejum',
          label: 'Horas de Jejum',
          type: 'number',
          minimum: 1,
          maximum: 24,
          required: false
        },
        {
          id: 'preparoEspecial',
          label: 'Preparo Especial (orientações do médico)',
          type: 'textarea',
          maxLength: 500,
          required: false
        },
        {
          id: 'usaMedicamentoContinuo',
          label: 'Usa Medicamento Contínuo?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'medicamentosEmUso',
          label: 'Medicamentos em Uso',
          type: 'textarea',
          maxLength: 500,
          required: false
        },
        {
          id: 'observacoes',
          label: 'Observações Gerais',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Transporte de Pacientes',
    description: 'Solicitação de ambulância para transporte de pacientes',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'TRANSPORTE_PACIENTES',
    requiresDocuments: true,
    requiredDocuments: ['Atestado Médico', 'Comprovante de Endereço'],
    estimatedDays: 3,
    priority: 5,
    category: 'Transporte',
    icon: 'Truck',
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
          label: 'Ponto de Referência (opcional)',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'cartaoSUS',
          label: 'Cartão SUS (CNS)',
          type: 'text',
          pattern: '^\\d{15}$',
          minLength: 15,
          maxLength: 15,
          required: true
        },
        {
          id: 'nomeMedicoSolicitante',
          label: 'Nome do Médico Solicitante',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: true
        },
        {
          id: 'crmMedico',
          label: 'CRM do Médico',
          type: 'text',
          pattern: '^\\d{4,8}$',
          required: true
        },
        {
          id: 'especialidadeMedico',
          label: 'Especialidade do Médico',
          type: 'text',
          maxLength: 100,
          required: false
        },
        {
          id: 'dataSolicitacao',
          label: 'Data da Solicitação',
          type: 'date',
          required: true
        },
        {
          id: 'motivoTransporte',
          label: 'Motivo do Transporte',
          type: 'textarea',
          minLength: 20,
          maxLength: 1000,
          required: true
        },
        {
          id: 'diagnostico',
          label: 'Diagnóstico Principal (CID-10)',
          type: 'textarea',
          maxLength: 500,
          required: false
        },
        {
          id: 'condicaoPaciente',
          label: 'Condição do Paciente',
          type: 'select',
          options: ['Estável', 'Crítica', 'Mobilidade Reduzida', 'Acamado', 'Outra'],
          required: true
        },
        {
          id: 'tipoTransporte',
          label: 'Tipo de Transporte Necessário',
          type: 'select',
          options: ['Ambulância Simples', 'Ambulância UTI', 'Veículo Adaptado', 'Outro'],
          required: true
        },
        {
          id: 'destino',
          label: 'Destino do Transporte',
          type: 'text',
          minLength: 5,
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
          id: 'horaPreferencial',
          label: 'Hora Preferencial',
          type: 'text',
          pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
          required: false
        },
        {
          id: 'necessitaAcompanhante',
          label: 'Necessita Acompanhante?',
          type: 'checkbox',
          defaultValue: false,
          required: false
        },
        {
          id: 'nomeAcompanhante',
          label: 'Nome do Acompanhante',
          type: 'text',
          minLength: 3,
          maxLength: 200,
          required: false
        },
        {
          id: 'cpfAcompanhante',
          label: 'CPF do Acompanhante',
          type: 'text',
          pattern: '^\\d{11}$',
          minLength: 11,
          maxLength: 11,
          required: false
        },
        {
          id: 'parentescoAcompanhante',
          label: 'Grau de Parentesco',
          type: 'select',
          options: ['Cônjuge', 'Filho(a)', 'Pai/Mãe', 'Irmão(ã)', 'Outro'],
          required: false
        },
        {
          id: 'observacoes',
          label: 'Observações Gerais',
          type: 'textarea',
          maxLength: 1000,
          required: false
        }
      ]
    }
  },
  {
      name: 'Cartão Nacional de Saúde (Cartão SUS)',
      description: 'Cadastro e emissão do Cartão SUS',
      departmentCode: 'SAUDE',
      serviceType: 'COM_DADOS',
      moduleType: 'CADASTRO_PACIENTE',
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço'],
      estimatedDays: 7,
      priority: 3,
      category: 'Cadastro',
      icon: 'CreditCard',
      color: '#10b981',
      formSchema: {
        type: 'object',
          citizenFields: [
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_city',
            'citizen_state',
            'citizen_mothername'
          ],
        properties: {
          nomeCompleto: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
          nomeSocial: { type: 'string', title: 'Nome Social', maxLength: 200 },
          nomePai: { type: 'string', title: 'Nome do Pai', maxLength: 200 },
          sexo: {
            type: 'string',
            title: 'Sexo',
            enum: ['MASCULINO', 'FEMININO'],
            enumNames: ['Masculino', 'Feminino']
          },
        },
        required: ['nomeCompleto', 'cpf', 'dataNascimento', 'nomeMae', 'sexo', 'telefone', 'cep', 'logradouro', 'bairro', 'cidade', 'uf']
      }
    },
  {
      name: 'Registro de Vacinação',
      description: 'Registro e acompanhamento de vacinação',
      departmentCode: 'SAUDE',
      serviceType: 'COM_DADOS',
      moduleType: 'VACINACAO',
      requiresDocuments: true,
      requiredDocuments: ['Cartão de Vacina', 'Documento de Identidade'],
      estimatedDays: 1,
      priority: 5,
      category: 'Vacinação',
      icon: 'Shield',
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
          // ========== BLOCO 1: IDENTIFICAÇÃO ==========

          // ========== BLOCO 2: CONTATO ==========

          // ========== BLOCO 3: ENDEREÇO ==========
          pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

          // ========== BLOCO 4: COMPLEMENTARES ==========

          // ========== BLOCO 5: DADOS DE SAÚDE ==========
          cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
          possuiCartaoVacina: { type: 'boolean', title: 'Possui Cartão de Vacina?', default: false },
          numeroCartaoVacina: { type: 'string', title: 'Número do Cartão de Vacina', maxLength: 50 },
          alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos/Vacinas (se houver)', maxLength: 500 },
          necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra'] },

          // ========== BLOCO 6: DADOS DA VACINA ==========
          nomeVacina: { type: 'string', title: 'Nome da Vacina', minLength: 3, maxLength: 200 },
          tipoVacina: {
            type: 'string',
            title: 'Tipo de Vacina',
            enum: ['COVID-19', 'Gripe', 'Hepatite A', 'Hepatite B', 'Tríplice Viral (Sarampo/Rubéola/Caxumba)', 'Febre Amarela', 'BCG', 'Poliomielite', 'Tetáno', 'HPV', 'Meningite', 'Pneumonia', 'Outra']
          },
          loteVacina: { type: 'string', title: 'Lote da Vacina', minLength: 3, maxLength: 50 },
          fabricante: { type: 'string', title: 'Fabricante', minLength: 3, maxLength: 200 },
          dose: {
            type: 'string',
            title: 'Dose',
            enum: ['Dose Única', '1ª Dose', '2ª Dose', '3ª Dose', '4ª Dose', 'Reforço', '1º Reforço', '2º Reforço']
          },
          viaAdministracao: { type: 'string', title: 'Via de Administração', enum: ['Intramuscular', 'Subcutânea', 'Oral', 'Intradérmica'] },

          // ========== BLOCO 7: APLICAÇÃO ==========
          dataAplicacao: { type: 'string', format: 'date', title: 'Data de Aplicação' },
          horarioAplicacao: { type: 'string', title: 'Horário da Aplicação', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
          unidadeVacinacao: { type: 'string', title: 'Unidade de Saúde (Vacinação)', minLength: 3, maxLength: 200 },
          profissionalAplicador: { type: 'string', title: 'Nome do Profissional Aplicador', minLength: 3, maxLength: 200 },
          cnsProfissional: { type: 'string', title: 'CNS do Profissional', pattern: '^\\d{15}$' },

          // ========== BLOCO 8: AGENDAMENTO PRÓXIMA DOSE ==========
          existeProximaDose: { type: 'boolean', title: 'Existe Próxima Dose?', default: false },
          dataProximaDose: { type: 'string', format: 'date', title: 'Data Prevista da Próxima Dose' },
          observacoesProximaDose: { type: 'string', title: 'Observações sobre Próxima Dose', maxLength: 300 },

          // ========== BLOCO 9: OBSERVAÇÕES ==========
          reacoesAdversas: { type: 'string', title: 'Reações Adversas Observadas', maxLength: 500 },
          observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
        },
        required: [
          'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
          'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
          'cartaoSUS', 'nomeVacina', 'loteVacina', 'fabricante', 'dose',
          'dataAplicacao', 'unidadeVacinacao', 'profissionalAplicador'
        ]
      }
    },
  {
      name: 'Gestão de Agentes Comunitários de Saúde (ACS)',
      description: 'Administração e acompanhamento de ACS',
      departmentCode: 'SAUDE',
      serviceType: 'COM_DADOS',
      moduleType: 'GESTAO_ACS',
      requiresDocuments: false,
      estimatedDays: null,
      priority: 2,
      category: 'Gestão Interna',
      icon: 'Users',
      color: '#64748b',
      formSchema: {
        type: 'object',
          citizenFields: [
            'citizen_cpf',
            'citizen_email',
            'citizen_phone'
          ],
        properties: {
          nomeACS: { type: 'string', title: 'Nome do ACS', minLength: 3, maxLength: 200 },
          cns: { type: 'string', title: 'CNS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
          unidadeSaude: { type: 'string', title: 'Unidade de Saúde', minLength: 3, maxLength: 200 },
          microarea: { type: 'string', title: 'Microárea', maxLength: 50 },
          dataAdmissao: { type: 'string', format: 'date', title: 'Data de Admissão' },
          situacao: {
            type: 'string',
            title: 'Situação',
            enum: ['ATIVO', 'INATIVO', 'FERIAS', 'AFASTADO'],
            enumNames: ['Ativo', 'Inativo', 'Férias', 'Afastado'],
            default: 'ATIVO'
          },
          numeroFamiliasAtendidas: { type: 'integer', title: 'Número de Famílias Atendidas', minimum: 0 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nomeACS', 'cpf', 'cns', 'telefone', 'unidadeSaude', 'dataAdmissao']
      }
    },
  {
      name: 'Certidão de Atendimento',
      description: 'Certidão comprovando atendimento realizado na rede municipal de saúde',
      departmentCode: 'SAUDE',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'Cartão SUS'],
      estimatedDays: 3,
      priority: 3,
      category: 'Certidões',
      icon: 'FileText',
      color: '#f59e0b'
    },
  {
      name: 'Declaração de Vacinação',
      description: 'Declaração oficial de vacinas aplicadas',
      departmentCode: 'SAUDE',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'Cartão SUS', 'Carteira de Vacinação'],
      estimatedDays: 2,
      priority: 3,
      category: 'Certidões',
      icon: 'FileCheck',
      color: '#10b981'
    },
  {
      name: 'Atestado de Acompanhamento em Programa',
      description: 'Atestado de acompanhamento em programa de saúde',
      departmentCode: 'SAUDE',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'Cartão SUS'],
      estimatedDays: 5,
      priority: 3,
      category: 'Certidões',
      icon: 'Heart',
      color: '#ef4444'
    },
  {
      name: 'Segunda Via de Cartão SUS',
      description: 'Reemissão do Cartão Nacional de Saúde',
      departmentCode: 'SAUDE',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço'],
      estimatedDays: 7,
      priority: 2,
      category: 'Documentos',
      icon: 'Copy',
      color: '#6b7280'
    },
  {
      name: 'Consulta de Histórico de Atendimentos',
      description: 'Consulta do histórico de atendimentos na rede municipal',
      departmentCode: 'SAUDE',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'Cartão SUS'],
      estimatedDays: 1,
      priority: 2,
      category: 'Consultas',
      icon: 'Search',
      color: '#3b82f6'
    },
  {
      name: 'Declaração de Participação em Programa de Saúde',
      description: 'Declaração comprovando participação em programas de saúde municipais',
      departmentCode: 'SAUDE',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'Cartão SUS'],
      estimatedDays: 3,
      priority: 3,
      category: 'Certidões',
      icon: 'Award',
      color: '#8b5cf6'
    },

  // ========================================
  // SERVIÇO COM_DADOS: TFD
  // ========================================
  {
    name: 'Encaminhamento TFD (Tratamento Fora do Domicílio)',
    description: 'Solicitação de tratamento médico especializado em outras cidades quando não disponível no município',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'ENCAMINHAMENTOS_TFD',
    requiresDocuments: true,
    requiredDocuments: [
      { id: 'encaminhamento_medico', name: 'Encaminhamento Médico', required: true },
      { id: 'exames', name: 'Exames Médicos', required: false },
      { id: 'documentos_pessoais', name: 'Documentos Pessoais (RG, CPF, Cartão SUS)', required: true }
    ],
    estimatedDays: 30,
    priority: 1,
    category: 'Assistência à Saúde',
    icon: 'FileBarChart',
    color: '#f97316',

    formSchema: {
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_phone',
        'citizen_email',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood'
      ],
      fields: [
        // ========== DADOS MÉDICOS ==========
        {
          id: 'cartaoSUS',
          label: 'Cartão SUS (CNS)',
          type: 'text',
          pattern: '^\\d{15}$',
          minLength: 15,
          maxLength: 15,
          required: true
        },
        {
          id: 'especialidade',
          label: 'Especialidade Médica Necessária',
          type: 'select',
          required: true,
          options: [
            'Cardiologia',
            'Oncologia',
            'Neurologia',
            'Ortopedia',
            'Oftalmologia',
            'Nefrologia',
            'Urologia',
            'Cirurgia Cardíaca',
            'Cirurgia Vascular',
            'Hematologia',
            'Endocrinologia',
            'Outras'
          ]
        },
        {
          id: 'especialidadeOutra',
          label: 'Especifique a Especialidade',
          type: 'text',
          required: false,
          maxLength: 100,
          visibleWhen: { field: 'especialidade', value: 'Outras' }
        },
        {
          id: 'procedimento',
          label: 'Procedimento/Tratamento Necessário',
          type: 'textarea',
          required: true,
          minLength: 20,
          maxLength: 500,
          placeholder: 'Descreva detalhadamente o procedimento ou tratamento necessário'
        },
        {
          id: 'justificativaMedica',
          label: 'Justificativa Médica',
          type: 'textarea',
          required: true,
          minLength: 50,
          maxLength: 1000,
          placeholder: 'Justifique a necessidade do tratamento fora do domicílio (por que não pode ser realizado no município)'
        },
        {
          id: 'medicoSolicitante',
          label: 'Nome do Médico Solicitante',
          type: 'text',
          required: true,
          maxLength: 200
        },
        {
          id: 'crmMedico',
          label: 'CRM do Médico',
          type: 'text',
          required: true,
          pattern: '^\\d{4,8}$',
          placeholder: 'Somente números'
        },
        {
          id: 'crmEstado',
          label: 'Estado do CRM',
          type: 'select',
          required: true,
          options: ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE', 'GO', 'DF', 'Outro']
        },
        {
          id: 'cid10',
          label: 'CID-10',
          type: 'text',
          required: false,
          maxLength: 10,
          placeholder: 'Ex: C50.9'
        },
        {
          id: 'diagnostico',
          label: 'Diagnóstico',
          type: 'textarea',
          required: true,
          minLength: 20,
          maxLength: 500
        },

        // ========== DESTINO ==========
        {
          id: 'cidadeDestino',
          label: 'Cidade de Destino',
          type: 'text',
          required: true,
          maxLength: 100,
          placeholder: 'Ex: São Paulo'
        },
        {
          id: 'estadoDestino',
          label: 'Estado de Destino',
          type: 'select',
          required: true,
          options: ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE', 'GO', 'DF', 'Outro']
        },
        {
          id: 'hospitalDestino',
          label: 'Hospital/Clínica de Destino (se já definido)',
          type: 'text',
          required: false,
          maxLength: 200
        },

        // ========== PRIORIDADE ==========
        {
          id: 'prioridade',
          label: 'Nível de Prioridade',
          type: 'select',
          required: true,
          options: ['EMERGENCIA', 'ALTA', 'MEDIA', 'ROTINA'],
          default: 'MEDIA'
        },
        {
          id: 'justificativaPrioridade',
          label: 'Justificativa da Prioridade',
          type: 'textarea',
          required: false,
          maxLength: 500,
          visibleWhen: { field: 'prioridade', value: ['EMERGENCIA', 'ALTA'] }
        },

        // ========== ACOMPANHANTE ==========
        {
          id: 'necessitaAcompanhante',
          label: 'Necessita Acompanhante?',
          type: 'checkbox',
          required: false,
          default: false
        },
        {
          id: 'justificativaAcompanhante',
          label: 'Justificativa para Acompanhante',
          type: 'textarea',
          required: false,
          maxLength: 500,
          placeholder: 'Ex: Paciente menor de idade, idoso com mobilidade reduzida, necessita auxílio...',
          visibleWhen: { field: 'necessitaAcompanhante', value: true }
        },
        {
          id: 'nomeAcompanhante',
          label: 'Nome Completo do Acompanhante',
          type: 'text',
          required: false,
          maxLength: 200,
          visibleWhen: { field: 'necessitaAcompanhante', value: true }
        },
        {
          id: 'cpfAcompanhante',
          label: 'CPF do Acompanhante',
          type: 'text',
          required: false,
          pattern: '^\\d{11}$',
          placeholder: 'Somente números',
          visibleWhen: { field: 'necessitaAcompanhante', value: true }
        },
        {
          id: 'parentescoAcompanhante',
          label: 'Parentesco do Acompanhante',
          type: 'select',
          required: false,
          options: ['Pai', 'Mãe', 'Filho(a)', 'Cônjuge', 'Irmão(ã)', 'Outro Familiar', 'Cuidador'],
          visibleWhen: { field: 'necessitaAcompanhante', value: true }
        },

        // ========== INFORMAÇÕES ADICIONAIS ==========
        {
          id: 'dataPreferencialConsulta',
          label: 'Data Preferencial para Consulta/Procedimento',
          type: 'date',
          required: false
        },
        {
          id: 'necessidadesEspeciais',
          label: 'Possui Necessidades Especiais?',
          type: 'checkbox',
          required: false,
          default: false
        },
        {
          id: 'descricaoNecessidadesEspeciais',
          label: 'Descreva as Necessidades Especiais',
          type: 'textarea',
          required: false,
          maxLength: 500,
          visibleWhen: { field: 'necessidadesEspeciais', value: true }
        },
        {
          id: 'observacoes',
          label: 'Observações Adicionais',
          type: 'textarea',
          required: false,
          maxLength: 1000,
          placeholder: 'Informações complementares relevantes para a análise da solicitação'
        }
      ]
    },

    // ========== CONFIGURAÇÃO DE CITIZEN LINKS ==========
    linkedCitizensConfig: {
      enabled: true,
      links: [
        {
          linkType: 'COMPANION',
          role: 'COMPANION',
          label: 'Acompanhante',
          required: false,
          mapFromLegacyFields: {
            name: 'nomeAcompanhante',
            cpf: 'cpfAcompanhante'
          },
          onlyIfCondition: {
            field: 'necessitaAcompanhante',
            value: true
          }
        }
      ]
    }
  }
];
