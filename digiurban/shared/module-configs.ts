/**
 * @file module-configs.ts
 * @description Configuração centralizada de TODOS os 114 módulos do sistema
 * @module shared
 */

import { ModuleConfig } from '../backend/src/modules/core/interfaces';

/**
 * Configuração completa de todos os módulos do DigiUrban
 * Total: 114 módulos distribuídos em 13 secretarias
 */
export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  // ==========================================================================
  // SECRETARIA DE SAÚDE (11 módulos)
  // ==========================================================================

  ATENDIMENTOS_SAUDE: {
    code: 'ATENDIMENTOS_SAUDE',
    name: 'Atendimentos de Saúde',
    department: 'SAUDE',
    description: 'Registro e gestão de atendimentos médicos gerais',
    icon: 'medical',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['HealthAttendance', 'Patient', 'HealthUnit', 'HealthProfessional'],

    dashboardKPIs: [
      'total',
      'pending',
      'completed',
      'avgTime',
      'byType',
      'byUnit',
      'satisfaction',
    ],

    managementEntities: [
      {
        name: 'patient',
        label: 'Paciente',
        pluralLabel: 'Pacientes',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: true,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'cpf', label: 'CPF', type: 'string', required: true },
          { name: 'birthDate', label: 'Data de Nascimento', type: 'date', required: true },
          { name: 'phone', label: 'Telefone', type: 'string', required: false },
          { name: 'email', label: 'E-mail', type: 'string', required: false },
          { name: 'susCard', label: 'Cartão SUS', type: 'string', required: false },
        ],
      },
      {
        name: 'healthUnit',
        label: 'Unidade de Saúde',
        pluralLabel: 'Unidades de Saúde',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'UBS', label: 'UBS - Unidade Básica de Saúde' },
            { value: 'UPA', label: 'UPA - Unidade de Pronto Atendimento' },
            { value: 'HOSPITAL', label: 'Hospital' },
            { value: 'POSTO', label: 'Posto de Saúde' },
          ]},
          { name: 'address', label: 'Endereço', type: 'string', required: true },
          { name: 'phone', label: 'Telefone', type: 'string', required: true },
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'HEALTH_PROFESSIONAL', 'HEALTH_COORDINATOR'],
      create: ['HEALTH_ADMIN', 'HEALTH_PROFESSIONAL'],
      edit: ['HEALTH_ADMIN', 'HEALTH_PROFESSIONAL'],
      delete: ['HEALTH_ADMIN'],
      manage: ['HEALTH_ADMIN', 'HEALTH_COORDINATOR'],
    },
  },

  AGENDAMENTO_CONSULTA: {
    code: 'AGENDAMENTO_CONSULTA',
    name: 'Agendamento de Consulta Médica',
    department: 'SAUDE',
    description: 'Agendamento de consultas em especialidades médicas',
    icon: 'calendar-medical',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['MEDICO', 'COORDENADOR_SAUDE'],
      sla: {
        analysisTime: 2,
        approvalTime: 3,
        totalTime: 5,
        unit: 'days',
      },
      notifications: {
        onSubmit: true,
        onApprove: true,
        onReject: true,
        onDelay: true,
      },
    },

    entities: ['MedicalAppointment', 'HealthAppointment', 'HealthDoctor', 'MedicalSpecialty'],

    dashboardKPIs: [
      'total',
      'confirmed',
      'cancelled',
      'noShow',
      'avgWaitTime',
      'bySpecialty',
      'byDoctor',
      'occupancyRate',
    ],

    managementEntities: [
      {
        name: 'healthDoctor',
        label: 'Médico',
        pluralLabel: 'Médicos',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'crm', label: 'CRM', type: 'string', required: true },
          { name: 'specialty', label: 'Especialidade', type: 'relation', required: true, relation: {
            entity: 'medicalSpecialty',
            displayField: 'name',
          }},
          { name: 'phone', label: 'Telefone', type: 'string', required: false },
        ],
      },
      {
        name: 'medicalSpecialty',
        label: 'Especialidade Médica',
        pluralLabel: 'Especialidades Médicas',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'description', label: 'Descrição', type: 'string', required: false },
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'MEDICO', 'HEALTH_COORDINATOR'],
      create: ['HEALTH_ADMIN', 'HEALTH_COORDINATOR'],
      edit: ['HEALTH_ADMIN', 'MEDICO'],
      approve: ['MEDICO', 'COORDENADOR_SAUDE'],
      manage: ['HEALTH_ADMIN', 'HEALTH_COORDINATOR'],
    },
  },

  CONTROLE_MEDICAMENTOS: {
    code: 'CONTROLE_MEDICAMENTOS',
    name: 'Controle de Medicamentos',
    department: 'SAUDE',
    description: 'Solicitação e dispensação de medicamentos da farmácia básica',
    icon: 'pills',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['FARMACEUTICO', 'COORDENADOR_FARMACIA'],
      sla: {
        analysisTime: 1,
        approvalTime: 2,
        unit: 'days',
      },
      notifications: {
        onSubmit: true,
        onApprove: true,
        onReject: true,
      },
    },

    entities: ['MedicationDispensing', 'MedicationDispense', 'Medication'],

    dashboardKPIs: [
      'totalRequests',
      'dispensed',
      'pending',
      'stockLevel',
      'mostRequested',
      'byPatient',
      'avgDispenseTime',
    ],

    managementEntities: [
      {
        name: 'medication',
        label: 'Medicamento',
        pluralLabel: 'Medicamentos',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: true,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'activeIngredient', label: 'Princípio Ativo', type: 'string', required: true },
          { name: 'dosage', label: 'Dosagem', type: 'string', required: true },
          { name: 'stockQuantity', label: 'Quantidade em Estoque', type: 'number', required: true },
          { name: 'minStock', label: 'Estoque Mínimo', type: 'number', required: true },
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'FARMACEUTICO', 'MEDICO'],
      create: ['HEALTH_ADMIN', 'MEDICO'],
      approve: ['FARMACEUTICO', 'COORDENADOR_FARMACIA'],
      manage: ['HEALTH_ADMIN', 'COORDENADOR_FARMACIA'],
    },
  },

  CAMPANHAS_VACINACAO: {
    code: 'CAMPANHAS_VACINACAO',
    name: 'Campanhas de Vacinação',
    department: 'SAUDE',
    description: 'Inscrição e gestão de campanhas de vacinação',
    icon: 'syringe',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['VaccinationCampaign', 'CampaignEnrollment', 'HealthCampaign'],

    dashboardKPIs: [
      'totalEnrolled',
      'vaccinated',
      'coverageRate',
      'byRegion',
      'targetAchievement',
      'byAgeGroup',
    ],

    managementEntities: [
      {
        name: 'vaccinationCampaign',
        label: 'Campanha de Vacinação',
        pluralLabel: 'Campanhas de Vacinação',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome da Campanha', type: 'string', required: true },
          { name: 'vaccine', label: 'Vacina', type: 'string', required: true },
          { name: 'startDate', label: 'Data de Início', type: 'date', required: true },
          { name: 'endDate', label: 'Data de Término', type: 'date', required: true },
          { name: 'targetAudience', label: 'Público-Alvo', type: 'string', required: true },
          { name: 'target', label: 'Meta de Vacinação', type: 'number', required: true },
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'HEALTH_PROFESSIONAL', 'HEALTH_COORDINATOR'],
      create: ['HEALTH_ADMIN'],
      manage: ['HEALTH_ADMIN', 'HEALTH_COORDINATOR'],
    },
  },

  PROGRAMAS_SAUDE: {
    code: 'PROGRAMAS_SAUDE',
    name: 'Programas de Saúde',
    department: 'SAUDE',
    description: 'Inscrição em programas de acompanhamento (hipertensão, diabetes, etc)',
    icon: 'heartbeat',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['MEDICO', 'ENFERMEIRO', 'COORDENADOR_SAUDE'],
      sla: {
        analysisTime: 3,
        approvalTime: 5,
        unit: 'days',
      },
    },

    entities: ['HealthProgram', 'Patient'],

    dashboardKPIs: [
      'totalEnrolled',
      'byProgram',
      'adherenceRate',
      'results',
      'activePatients',
    ],

    managementEntities: [
      {
        name: 'healthProgram',
        label: 'Programa de Saúde',
        pluralLabel: 'Programas de Saúde',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome do Programa', type: 'string', required: true },
          { name: 'description', label: 'Descrição', type: 'string', required: true },
          { name: 'targetCondition', label: 'Condição-Alvo', type: 'string', required: true },
          { name: 'protocol', label: 'Protocolo', type: 'string', required: false },
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'MEDICO', 'ENFERMEIRO'],
      approve: ['MEDICO', 'ENFERMEIRO', 'COORDENADOR_SAUDE'],
      manage: ['HEALTH_ADMIN', 'COORDENADOR_SAUDE'],
    },
  },

  ENCAMINHAMENTO_TFD: {
    code: 'ENCAMINHAMENTO_TFD',
    name: 'Encaminhamento TFD',
    department: 'SAUDE',
    description: 'Tratamento Fora do Domicílio - Encaminhamento para tratamento em outros municípios',
    icon: 'ambulance',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'multi-step',
      roles: ['MEDICO', 'REGULADOR', 'COORDENADOR_SAUDE'],
      steps: [
        { order: 1, role: 'MEDICO', name: 'Avaliação Médica', description: 'Médico avalia necessidade do TFD' },
        { order: 2, role: 'REGULADOR', name: 'Regulação', description: 'Regulador define destino e agenda' },
        { order: 3, role: 'COORDENADOR_SAUDE', name: 'Aprovação Final', description: 'Coordenador autoriza o TFD' },
      ],
      sla: {
        analysisTime: 5,
        approvalTime: 10,
        unit: 'days',
      },
    },

    entities: ['HealthTransport', 'HealthTransportRequest'],

    dashboardKPIs: [
      'totalRequests',
      'approved',
      'inProgress',
      'completed',
      'byDestination',
      'costs',
      'avgApprovalTime',
    ],

    managementEntities: [
      {
        name: 'tfdDestination',
        label: 'Destino TFD',
        pluralLabel: 'Destinos TFD',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'city', label: 'Cidade', type: 'string', required: true },
          { name: 'state', label: 'Estado', type: 'string', required: true },
          { name: 'facility', label: 'Estabelecimento', type: 'string', required: true },
          { name: 'specialties', label: 'Especialidades', type: 'string', required: true },
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'MEDICO', 'REGULADOR', 'COORDENADOR_SAUDE'],
      approve: ['MEDICO', 'REGULADOR', 'COORDENADOR_SAUDE'],
      manage: ['HEALTH_ADMIN', 'COORDENADOR_SAUDE'],
    },
  },

  SOLICITACAO_EXAMES: {
    code: 'SOLICITACAO_EXAMES',
    name: 'Solicitação de Exames',
    department: 'SAUDE',
    description: 'Solicitação de exames laboratoriais e de imagem',
    icon: 'microscope',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['LABORATORISTA', 'COORDENADOR_LABORATORIO'],
      sla: {
        analysisTime: 2,
        approvalTime: 5,
        unit: 'days',
      },
    },

    entities: ['HealthExam', 'MedicalExam'],

    dashboardKPIs: [
      'totalRequests',
      'scheduled',
      'completed',
      'pending',
      'avgWaitTime',
      'byExamType',
    ],

    managementEntities: [
      {
        name: 'examType',
        label: 'Tipo de Exame',
        pluralLabel: 'Tipos de Exame',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'category', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'LABORATORIAL', label: 'Laboratorial' },
            { value: 'IMAGEM', label: 'Imagem' },
            { value: 'CARDIOLOGICO', label: 'Cardiológico' },
          ]},
          { name: 'preparationInstructions', label: 'Instruções de Preparo', type: 'string', required: false },
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'MEDICO', 'LABORATORISTA'],
      approve: ['LABORATORISTA', 'COORDENADOR_LABORATORIO'],
      manage: ['HEALTH_ADMIN', 'COORDENADOR_LABORATORIO'],
    },
  },

  TRANSPORTE_PACIENTES: {
    code: 'TRANSPORTE_PACIENTES',
    name: 'Transporte de Pacientes',
    department: 'SAUDE',
    description: 'Solicitação de transporte/ambulância para pacientes',
    icon: 'ambulance',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['REGULADOR_TRANSPORTE', 'COORDENADOR_TRANSPORTE'],
      sla: {
        analysisTime: 1,
        approvalTime: 2,
        unit: 'hours',
      },
    },

    entities: ['HealthTransport', 'HealthTransportRequest'],

    dashboardKPIs: [
      'totalRequests',
      'completed',
      'inProgress',
      'byDestination',
      'costs',
      'avgResponseTime',
    ],

    managementEntities: [
      {
        name: 'ambulance',
        label: 'Ambulância',
        pluralLabel: 'Ambulâncias',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'plate', label: 'Placa', type: 'string', required: true },
          { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'BASICA', label: 'Básica' },
            { value: 'UTI', label: 'UTI Móvel' },
            { value: 'RESGATE', label: 'Resgate' },
          ]},
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'DISPONIVEL', label: 'Disponível' },
            { value: 'EM_USO', label: 'Em Uso' },
            { value: 'MANUTENCAO', label: 'Manutenção' },
          ]},
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'REGULADOR_TRANSPORTE', 'COORDENADOR_TRANSPORTE'],
      approve: ['REGULADOR_TRANSPORTE', 'COORDENADOR_TRANSPORTE'],
      manage: ['HEALTH_ADMIN', 'COORDENADOR_TRANSPORTE'],
    },
  },

  CADASTRO_PACIENTE: {
    code: 'CADASTRO_PACIENTE',
    name: 'Cadastro de Paciente (Cartão SUS)',
    department: 'SAUDE',
    description: 'Cadastro e emissão do Cartão Nacional de Saúde',
    icon: 'id-card',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['Patient', 'Citizen'],

    dashboardKPIs: [
      'totalPatients',
      'newRegistrations',
      'activePatients',
      'byRegion',
      'byAgeGroup',
    ],

    managementEntities: [
      {
        name: 'patient',
        label: 'Paciente',
        pluralLabel: 'Pacientes',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: true,
        fields: [
          { name: 'name', label: 'Nome Completo', type: 'string', required: true },
          { name: 'cpf', label: 'CPF', type: 'string', required: true },
          { name: 'birthDate', label: 'Data de Nascimento', type: 'date', required: true },
          { name: 'motherName', label: 'Nome da Mãe', type: 'string', required: true },
          { name: 'susCard', label: 'Número do Cartão SUS', type: 'string', required: false },
          { name: 'phone', label: 'Telefone', type: 'string', required: true },
          { name: 'address', label: 'Endereço', type: 'string', required: true },
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'HEALTH_PROFESSIONAL'],
      create: ['HEALTH_ADMIN', 'HEALTH_PROFESSIONAL'],
      edit: ['HEALTH_ADMIN', 'HEALTH_PROFESSIONAL'],
      manage: ['HEALTH_ADMIN'],
    },
  },

  REGISTRO_VACINACAO: {
    code: 'REGISTRO_VACINACAO',
    name: 'Registro de Vacinação',
    department: 'SAUDE',
    description: 'Registro e acompanhamento de vacinação',
    icon: 'syringe',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['Vaccination', 'VaccinationRecord'],

    dashboardKPIs: [
      'totalDoses',
      'coverageRate',
      'byVaccine',
      'byAgeGroup',
      'byRegion',
      'adverse Events',
    ],

    managementEntities: [
      {
        name: 'vaccine',
        label: 'Vacina',
        pluralLabel: 'Vacinas',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'disease', label: 'Doença', type: 'string', required: true },
          { name: 'doses', label: 'Número de Doses', type: 'number', required: true },
          { name: 'intervalDays', label: 'Intervalo entre Doses (dias)', type: 'number', required: false },
          { name: 'minAge', label: 'Idade Mínima', type: 'number', required: true },
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'HEALTH_PROFESSIONAL', 'ENFERMEIRO'],
      create: ['HEALTH_ADMIN', 'ENFERMEIRO'],
      manage: ['HEALTH_ADMIN', 'COORDENADOR_SAUDE'],
    },
  },

  GESTAO_ACS: {
    code: 'GESTAO_ACS',
    name: 'Gestão de Agentes Comunitários de Saúde',
    department: 'SAUDE',
    description: 'Administração e acompanhamento de Agentes Comunitários',
    icon: 'users',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['COORDENADOR_ACS', 'COORDENADOR_SAUDE'],
      sla: {
        analysisTime: 3,
        approvalTime: 7,
        unit: 'days',
      },
    },

    entities: ['CommunityHealthAgent'],

    dashboardKPIs: [
      'totalAgents',
      'activeAgents',
      'visitsCompleted',
      'familiesFollowed',
      'productivity',
      'byMicroarea',
    ],

    managementEntities: [
      {
        name: 'communityHealthAgent',
        label: 'Agente Comunitário de Saúde',
        pluralLabel: 'Agentes Comunitários de Saúde',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'cpf', label: 'CPF', type: 'string', required: true },
          { name: 'microarea', label: 'Microárea', type: 'string', required: true },
          { name: 'phone', label: 'Telefone', type: 'string', required: true },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'ATIVO', label: 'Ativo' },
            { value: 'AFASTADO', label: 'Afastado' },
            { value: 'DESLIGADO', label: 'Desligado' },
          ]},
        ],
      },
    ],

    permissions: {
      view: ['HEALTH_ADMIN', 'COORDENADOR_ACS', 'COORDENADOR_SAUDE'],
      approve: ['COORDENADOR_ACS', 'COORDENADOR_SAUDE'],
      manage: ['HEALTH_ADMIN', 'COORDENADOR_SAUDE'],
    },
  },

  // ==========================================================================
  // SECRETARIA DE EDUCAÇÃO (11 módulos)
  // ==========================================================================

  ATENDIMENTOS_EDUCACAO: {
    code: 'ATENDIMENTOS_EDUCACAO',
    name: 'Atendimentos de Educação',
    department: 'EDUCACAO',
    description: 'Registro e gestão de atendimentos educacionais',
    icon: 'school',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['EducationAttendance'],

    dashboardKPIs: [
      'total',
      'pending',
      'completed',
      'avgTime',
      'bySchool',
      'byType',
    ],

    managementEntities: [
      {
        name: 'school',
        label: 'Escola',
        pluralLabel: 'Escolas',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'INFANTIL', label: 'Educação Infantil' },
            { value: 'FUNDAMENTAL', label: 'Ensino Fundamental' },
            { value: 'MEDIO', label: 'Ensino Médio' },
          ]},
          { name: 'address', label: 'Endereço', type: 'string', required: true },
          { name: 'capacity', label: 'Capacidade', type: 'number', required: true },
        ],
      },
    ],

    permissions: {
      view: ['EDUCATION_ADMIN', 'EDUCATION_COORDINATOR', 'TEACHER'],
      create: ['EDUCATION_ADMIN', 'EDUCATION_COORDINATOR'],
      manage: ['EDUCATION_ADMIN', 'EDUCATION_COORDINATOR'],
    },
  },

  MATRICULA_ALUNO: {
    code: 'MATRICULA_ALUNO',
    name: 'Matrícula de Aluno',
    department: 'EDUCACAO',
    description: 'Matrícula e rematrícula na rede municipal de ensino',
    icon: 'user-graduate',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'multi-step',
      roles: ['SECRETARIO_ESCOLA', 'DIRETOR', 'COORDENADOR_EDUCACAO'],
      steps: [
        { order: 1, role: 'SECRETARIO_ESCOLA', name: 'Validação de Documentos', description: 'Secretário verifica documentação' },
        { order: 2, role: 'DIRETOR', name: 'Confirmação de Vaga', description: 'Diretor confirma disponibilidade' },
        { order: 3, role: 'COORDENADOR_EDUCACAO', name: 'Aprovação Final', description: 'Coordenador autoriza matrícula' },
      ],
      sla: {
        analysisTime: 3,
        approvalTime: 7,
        unit: 'days',
      },
    },

    entities: ['Student', 'StudentEnrollment', 'StudentEnrollmentRequest', 'School'],

    dashboardKPIs: [
      'totalEnrollments',
      'approved',
      'pending',
      'rejected',
      'bySchool',
      'byGrade',
      'occupancyRate',
    ],

    managementEntities: [
      {
        name: 'student',
        label: 'Aluno',
        pluralLabel: 'Alunos',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: true,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'birthDate', label: 'Data de Nascimento', type: 'date', required: true },
          { name: 'cpf', label: 'CPF', type: 'string', required: false },
          { name: 'guardianName', label: 'Nome do Responsável', type: 'string', required: true },
          { name: 'guardianPhone', label: 'Telefone do Responsável', type: 'string', required: true },
        ],
      },
      {
        name: 'schoolClass',
        label: 'Turma',
        pluralLabel: 'Turmas',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'school', label: 'Escola', type: 'relation', required: true, relation: {
            entity: 'school',
            displayField: 'name',
          }},
          { name: 'grade', label: 'Série', type: 'string', required: true },
          { name: 'shift', label: 'Turno', type: 'select', required: true, options: [
            { value: 'MATUTINO', label: 'Matutino' },
            { value: 'VESPERTINO', label: 'Vespertino' },
            { value: 'NOTURNO', label: 'Noturno' },
          ]},
          { name: 'capacity', label: 'Capacidade', type: 'number', required: true },
        ],
      },
    ],

    permissions: {
      view: ['EDUCATION_ADMIN', 'SECRETARIO_ESCOLA', 'DIRETOR', 'COORDENADOR_EDUCACAO'],
      approve: ['SECRETARIO_ESCOLA', 'DIRETOR', 'COORDENADOR_EDUCACAO'],
      manage: ['EDUCATION_ADMIN', 'COORDENADOR_EDUCACAO'],
    },
  },

  TRANSPORTE_ESCOLAR: {
    code: 'TRANSPORTE_ESCOLAR',
    name: 'Transporte Escolar',
    department: 'EDUCACAO',
    description: 'Solicitação de vaga em transporte escolar',
    icon: 'bus',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['COORDENADOR_TRANSPORTE_ESCOLAR', 'COORDENADOR_EDUCACAO'],
      sla: {
        analysisTime: 5,
        approvalTime: 10,
        unit: 'days',
      },
    },

    entities: ['SchoolTransport', 'SchoolTransportRequest'],

    dashboardKPIs: [
      'totalRequests',
      'approved',
      'pending',
      'studentsTransported',
      'byRoute',
      'costs',
    ],

    managementEntities: [
      {
        name: 'schoolBus',
        label: 'Ônibus Escolar',
        pluralLabel: 'Ônibus Escolares',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'plate', label: 'Placa', type: 'string', required: true },
          { name: 'capacity', label: 'Capacidade', type: 'number', required: true },
          { name: 'route', label: 'Rota', type: 'string', required: true },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'ATIVO', label: 'Ativo' },
            { value: 'MANUTENCAO', label: 'Manutenção' },
            { value: 'INATIVO', label: 'Inativo' },
          ]},
        ],
      },
    ],

    permissions: {
      view: ['EDUCATION_ADMIN', 'COORDENADOR_TRANSPORTE_ESCOLAR'],
      approve: ['COORDENADOR_TRANSPORTE_ESCOLAR', 'COORDENADOR_EDUCACAO'],
      manage: ['EDUCATION_ADMIN', 'COORDENADOR_EDUCACAO'],
    },
  },

  REGISTRO_OCORRENCIA_ESCOLAR: {
    code: 'REGISTRO_OCORRENCIA_ESCOLAR',
    name: 'Registro de Ocorrência Escolar',
    department: 'EDUCACAO',
    description: 'Registro de ocorrências disciplinares e comportamentais',
    icon: 'exclamation-triangle',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['DIRETOR', 'COORDENADOR_PEDAGOGICO'],
      sla: {
        analysisTime: 1,
        approvalTime: 3,
        unit: 'days',
      },
    },

    entities: ['DisciplinaryRecord', 'SchoolIncident'],

    dashboardKPIs: [
      'totalOccurrences',
      'byType',
      'bySchool',
      'byStudent',
      'recurrence',
      'resolved',
    ],

    managementEntities: [
      {
        name: 'occurrenceType',
        label: 'Tipo de Ocorrência',
        pluralLabel: 'Tipos de Ocorrência',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'severity', label: 'Gravidade', type: 'select', required: true, options: [
            { value: 'LEVE', label: 'Leve' },
            { value: 'MODERADA', label: 'Moderada' },
            { value: 'GRAVE', label: 'Grave' },
          ]},
          { name: 'defaultAction', label: 'Providência Padrão', type: 'string', required: false },
        ],
      },
    ],

    permissions: {
      view: ['EDUCATION_ADMIN', 'TEACHER', 'DIRETOR', 'COORDENADOR_PEDAGOGICO'],
      create: ['TEACHER', 'DIRETOR', 'COORDENADOR_PEDAGOGICO'],
      approve: ['DIRETOR', 'COORDENADOR_PEDAGOGICO'],
      manage: ['EDUCATION_ADMIN', 'COORDENADOR_EDUCACAO'],
    },
  },

  SOLICITACAO_DOCUMENTO_ESCOLAR: {
    code: 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    name: 'Solicitação de Documento Escolar',
    department: 'EDUCACAO',
    description: 'Solicitação de histórico, declaração, certificado',
    icon: 'file-alt',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['SECRETARIO_ESCOLA', 'DIRETOR'],
      sla: {
        analysisTime: 2,
        approvalTime: 5,
        unit: 'days',
      },
    },

    entities: ['SchoolDocument'],

    dashboardKPIs: [
      'totalRequests',
      'issued',
      'pending',
      'byDocumentType',
      'avgIssuanceTime',
    ],

    managementEntities: [
      {
        name: 'documentType',
        label: 'Tipo de Documento',
        pluralLabel: 'Tipos de Documento',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'template', label: 'Template', type: 'string', required: false },
          { name: 'requiresApproval', label: 'Requer Aprovação', type: 'boolean', required: true },
        ],
      },
    ],

    permissions: {
      view: ['EDUCATION_ADMIN', 'SECRETARIO_ESCOLA', 'DIRETOR'],
      approve: ['SECRETARIO_ESCOLA', 'DIRETOR'],
      manage: ['EDUCATION_ADMIN'],
    },
  },

  TRANSFERENCIA_ESCOLAR: {
    code: 'TRANSFERENCIA_ESCOLAR',
    name: 'Transferência Escolar',
    department: 'EDUCACAO',
    description: 'Transferência entre unidades escolares',
    icon: 'exchange-alt',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'multi-step',
      roles: ['DIRETOR_ORIGEM', 'DIRETOR_DESTINO', 'COORDENADOR_EDUCACAO'],
      steps: [
        { order: 1, role: 'DIRETOR_ORIGEM', name: 'Liberação', description: 'Diretor da escola de origem libera aluno' },
        { order: 2, role: 'DIRETOR_DESTINO', name: 'Confirmação de Vaga', description: 'Diretor da escola de destino confirma vaga' },
        { order: 3, role: 'COORDENADOR_EDUCACAO', name: 'Homologação', description: 'Coordenador homologa transferência' },
      ],
      sla: {
        analysisTime: 3,
        approvalTime: 7,
        unit: 'days',
      },
    },

    entities: ['StudentTransfer', 'SchoolTransferRequest'],

    dashboardKPIs: [
      'totalTransfers',
      'completed',
      'pending',
      'byOriginSchool',
      'byDestinationSchool',
      'byReason',
    ],

    managementEntities: [],

    permissions: {
      view: ['EDUCATION_ADMIN', 'DIRETOR', 'COORDENADOR_EDUCACAO'],
      approve: ['DIRETOR_ORIGEM', 'DIRETOR_DESTINO', 'COORDENADOR_EDUCACAO'],
      manage: ['EDUCATION_ADMIN', 'COORDENADOR_EDUCACAO'],
    },
  },

  CONSULTA_FREQUENCIA: {
    code: 'CONSULTA_FREQUENCIA',
    name: 'Consulta de Frequência',
    department: 'EDUCACAO',
    description: 'Consulta ao registro de frequência do aluno',
    icon: 'calendar-check',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: false,
    },

    entities: ['AttendanceRecord', 'StudentAttendance'],

    dashboardKPIs: [
      'avgAttendance',
      'absences',
      'byClass',
      'bySchool',
      'dropoutRisk',
    ],

    managementEntities: [],

    permissions: {
      view: ['EDUCATION_ADMIN', 'TEACHER', 'DIRETOR', 'PARENT'],
    },
  },

  CONSULTA_NOTAS: {
    code: 'CONSULTA_NOTAS',
    name: 'Consulta de Notas e Boletim',
    department: 'EDUCACAO',
    description: 'Consulta de notas e desempenho escolar',
    icon: 'chart-line',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: false,
    },

    entities: ['GradeRecord'],

    dashboardKPIs: [
      'avgGrade',
      'approvalRate',
      'failureRate',
      'bySubject',
      'byClass',
      'bySchool',
    ],

    managementEntities: [],

    permissions: {
      view: ['EDUCATION_ADMIN', 'TEACHER', 'DIRETOR', 'PARENT'],
    },
  },

  GESTAO_ESCOLAR: {
    code: 'GESTAO_ESCOLAR',
    name: 'Gestão Escolar',
    department: 'EDUCACAO',
    description: 'Administração de unidades escolares',
    icon: 'school',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['SchoolManagement', 'School', 'PublicSchool'],

    dashboardKPIs: [
      'totalSchools',
      'totalStudents',
      'totalTeachers',
      'infrastructure',
      'byType',
    ],

    managementEntities: [
      {
        name: 'school',
        label: 'Escola',
        pluralLabel: 'Escolas',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'code', label: 'Código INEP', type: 'string', required: true },
          { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'INFANTIL', label: 'Educação Infantil' },
            { value: 'FUNDAMENTAL', label: 'Ensino Fundamental' },
            { value: 'MEDIO', label: 'Ensino Médio' },
          ]},
          { name: 'address', label: 'Endereço', type: 'string', required: true },
          { name: 'phone', label: 'Telefone', type: 'string', required: true },
          { name: 'capacity', label: 'Capacidade', type: 'number', required: true },
        ],
      },
    ],

    permissions: {
      view: ['EDUCATION_ADMIN', 'COORDENADOR_EDUCACAO'],
      manage: ['EDUCATION_ADMIN', 'COORDENADOR_EDUCACAO'],
    },
  },

  GESTAO_MERENDA: {
    code: 'GESTAO_MERENDA',
    name: 'Gestão de Merenda Escolar',
    department: 'EDUCACAO',
    description: 'Planejamento de cardápios e controle de estoque',
    icon: 'utensils',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['NUTRICIONISTA', 'COORDENADOR_MERENDA'],
      sla: {
        analysisTime: 3,
        approvalTime: 7,
        unit: 'days',
      },
    },

    entities: ['SchoolMeal', 'SchoolMealRequest'],

    dashboardKPIs: [
      'mealsServed',
      'costs',
      'stockLevel',
      'bySchool',
      'acceptance',
    ],

    managementEntities: [
      {
        name: 'menu',
        label: 'Cardápio',
        pluralLabel: 'Cardápios',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'meal', label: 'Refeição', type: 'select', required: true, options: [
            { value: 'CAFE', label: 'Café da Manhã' },
            { value: 'ALMOCO', label: 'Almoço' },
            { value: 'LANCHE', label: 'Lanche' },
          ]},
          { name: 'description', label: 'Descrição', type: 'string', required: true },
          { name: 'nutritionalValue', label: 'Valor Nutricional', type: 'string', required: false },
        ],
      },
    ],

    permissions: {
      view: ['EDUCATION_ADMIN', 'NUTRICIONISTA', 'COORDENADOR_MERENDA'],
      approve: ['NUTRICIONISTA', 'COORDENADOR_MERENDA'],
      manage: ['EDUCATION_ADMIN', 'COORDENADOR_MERENDA'],
    },
  },

  CALENDARIO_ESCOLAR: {
    code: 'CALENDARIO_ESCOLAR',
    name: 'Calendário Escolar',
    department: 'EDUCACAO',
    description: 'Consulta ao calendário letivo e eventos',
    icon: 'calendar',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['SchoolEvent'],

    dashboardKPIs: [
      'schoolDays',
      'events',
      'holidays',
    ],

    managementEntities: [
      {
        name: 'schoolEvent',
        label: 'Evento Escolar',
        pluralLabel: 'Eventos Escolares',
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'title', label: 'Título', type: 'string', required: true },
          { name: 'date', label: 'Data', type: 'date', required: true },
          { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'AULA', label: 'Dia Letivo' },
            { value: 'FERIADO', label: 'Feriado' },
            { value: 'EVENTO', label: 'Evento' },
            { value: 'RECESSO', label: 'Recesso' },
          ]},
          { name: 'description', label: 'Descrição', type: 'string', required: false },
        ],
      },
    ],

    permissions: {
      view: ['EDUCATION_ADMIN', 'TEACHER', 'DIRETOR', 'PARENT'],
      manage: ['EDUCATION_ADMIN', 'COORDENADOR_EDUCACAO'],
    },
  },

  // ==========================================================================
  // SECRETARIA DE ASSISTÊNCIA SOCIAL (9 módulos)
  // ==========================================================================

  ATENDIMENTOS_ASSISTENCIA_SOCIAL: {
    code: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
    name: 'Atendimentos de Assistência Social',
    department: 'ASSISTENCIA_SOCIAL',
    description: 'Registro e gestão de atendimentos sociais',
    icon: 'hands-helping',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['SocialAssistanceAttendance'],

    dashboardKPIs: [
      'total',
      'pending',
      'completed',
      'avgTime',
      'byType',
      'byCRAS',
    ],

    managementEntities: [
      {
        name: 'socialEquipment',
        label: 'Equipamento Social',
        pluralLabel: 'Equipamentos Sociais',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'CRAS', label: 'CRAS' },
            { value: 'CREAS', label: 'CREAS' },
            { value: 'CENTRO_POP', label: 'Centro POP' },
          ]},
          { name: 'address', label: 'Endereço', type: 'string', required: true },
          { name: 'phone', label: 'Telefone', type: 'string', required: true },
        ],
      },
    ],

    permissions: {
      view: ['SOCIAL_ADMIN', 'SOCIAL_WORKER', 'SOCIAL_COORDINATOR'],
      create: ['SOCIAL_ADMIN', 'SOCIAL_WORKER'],
      manage: ['SOCIAL_ADMIN', 'SOCIAL_COORDINATOR'],
    },
  },

  CADASTRO_UNICO: {
    code: 'CADASTRO_UNICO',
    name: 'Cadastro Único (CadÚnico)',
    department: 'ASSISTENCIA_SOCIAL',
    description: 'Cadastro de famílias vulneráveis no CadÚnico',
    icon: 'users',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'multi-step',
      roles: ['ENTREVISTADOR', 'COORDENADOR_CADUNICO'],
      steps: [
        { order: 1, role: 'ENTREVISTADOR', name: 'Entrevista', description: 'Entrevistador coleta dados da família' },
        { order: 2, role: 'COORDENADOR_CADUNICO', name: 'Validação', description: 'Coordenador valida cadastro' },
      ],
      sla: {
        analysisTime: 5,
        approvalTime: 10,
        unit: 'days',
      },
    },

    entities: ['VulnerableFamily', 'FamilyRegistration', 'FamilyComposition'],

    dashboardKPIs: [
      'totalFamilies',
      'newRegistrations',
      'avgIncome',
      'byVulnerability',
      'byRegion',
    ],

    managementEntities: [
      {
        name: 'vulnerableFamily',
        label: 'Família',
        pluralLabel: 'Famílias',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'responsibleName', label: 'Nome do Responsável', type: 'string', required: true },
          { name: 'cpf', label: 'CPF', type: 'string', required: true },
          { name: 'nis', label: 'NIS', type: 'string', required: true },
          { name: 'address', label: 'Endereço', type: 'string', required: true },
          { name: 'monthlyIncome', label: 'Renda Mensal', type: 'number', required: true },
          { name: 'members', label: 'Número de Membros', type: 'number', required: true },
        ],
      },
    ],

    permissions: {
      view: ['SOCIAL_ADMIN', 'ENTREVISTADOR', 'COORDENADOR_CADUNICO'],
      approve: ['ENTREVISTADOR', 'COORDENADOR_CADUNICO'],
      manage: ['SOCIAL_ADMIN', 'COORDENADOR_CADUNICO'],
    },
  },

  SOLICITACAO_BENEFICIO: {
    code: 'SOLICITACAO_BENEFICIO',
    name: 'Solicitação de Benefício Eventual',
    department: 'ASSISTENCIA_SOCIAL',
    description: 'Cesta básica, auxílio funeral, natalidade',
    icon: 'gift',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['ASSISTENTE_SOCIAL', 'COORDENADOR_SOCIAL'],
      sla: {
        analysisTime: 2,
        approvalTime: 5,
        unit: 'days',
      },
    },

    entities: ['BenefitRequest', 'SocialBenefitRequest'],

    dashboardKPIs: [
      'totalRequests',
      'approved',
      'pending',
      'rejected',
      'byBenefitType',
      'costs',
    ],

    managementEntities: [
      {
        name: 'benefitType',
        label: 'Tipo de Benefício',
        pluralLabel: 'Tipos de Benefício',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'description', label: 'Descrição', type: 'string', required: true },
          { name: 'criteria', label: 'Critérios', type: 'string', required: true },
          { name: 'maxValue', label: 'Valor Máximo', type: 'number', required: false },
        ],
      },
    ],

    permissions: {
      view: ['SOCIAL_ADMIN', 'ASSISTENTE_SOCIAL', 'COORDENADOR_SOCIAL'],
      approve: ['ASSISTENTE_SOCIAL', 'COORDENADOR_SOCIAL'],
      manage: ['SOCIAL_ADMIN', 'COORDENADOR_SOCIAL'],
    },
  },

  ENTREGA_EMERGENCIAL: {
    code: 'ENTREGA_EMERGENCIAL',
    name: 'Entrega Emergencial',
    department: 'ASSISTENCIA_SOCIAL',
    description: 'Entregas emergenciais para famílias vulneráveis',
    icon: 'truck',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['ASSISTENTE_SOCIAL', 'COORDENADOR_SOCIAL'],
      sla: {
        analysisTime: 1,
        approvalTime: 2,
        unit: 'hours',
      },
    },

    entities: ['EmergencyDelivery'],

    dashboardKPIs: [
      'totalDeliveries',
      'pending',
      'completed',
      'byType',
      'byRegion',
    ],

    managementEntities: [],

    permissions: {
      view: ['SOCIAL_ADMIN', 'ASSISTENTE_SOCIAL', 'COORDENADOR_SOCIAL'],
      approve: ['ASSISTENTE_SOCIAL', 'COORDENADOR_SOCIAL'],
      manage: ['SOCIAL_ADMIN', 'COORDENADOR_SOCIAL'],
    },
  },

  INSCRICAO_GRUPO_OFICINA: {
    code: 'INSCRICAO_GRUPO_OFICINA',
    name: 'Inscrição em Grupo/Oficina Social',
    department: 'ASSISTENCIA_SOCIAL',
    description: 'Inscrição em grupos e oficinas do CRAS',
    icon: 'users-cog',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['COORDENADOR_GRUPO', 'COORDENADOR_SOCIAL'],
      sla: {
        analysisTime: 3,
        approvalTime: 7,
        unit: 'days',
      },
    },

    entities: ['SocialGroupEnrollment'],

    dashboardKPIs: [
      'totalEnrollments',
      'byGroup',
      'attendance',
      'completion',
    ],

    managementEntities: [
      {
        name: 'socialGroup',
        label: 'Grupo/Oficina',
        pluralLabel: 'Grupos/Oficinas',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'description', label: 'Descrição', type: 'string', required: true },
          { name: 'capacity', label: 'Capacidade', type: 'number', required: true },
          { name: 'schedule', label: 'Horário', type: 'string', required: true },
          { name: 'facilitator', label: 'Facilitador', type: 'string', required: true },
        ],
      },
    ],

    permissions: {
      view: ['SOCIAL_ADMIN', 'COORDENADOR_GRUPO', 'COORDENADOR_SOCIAL'],
      approve: ['COORDENADOR_GRUPO', 'COORDENADOR_SOCIAL'],
      manage: ['SOCIAL_ADMIN', 'COORDENADOR_SOCIAL'],
    },
  },

  VISITAS_DOMICILIARES: {
    code: 'VISITAS_DOMICILIARES',
    name: 'Visitas Domiciliares',
    department: 'ASSISTENCIA_SOCIAL',
    description: 'Agendamento e registro de visitas domiciliares',
    icon: 'home',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['HomeVisit', 'SocialHomeVisit'],

    dashboardKPIs: [
      'totalVisits',
      'completed',
      'scheduled',
      'bySocialWorker',
      'byRegion',
    ],

    managementEntities: [],

    permissions: {
      view: ['SOCIAL_ADMIN', 'ASSISTENTE_SOCIAL', 'COORDENADOR_SOCIAL'],
      create: ['ASSISTENTE_SOCIAL'],
      manage: ['SOCIAL_ADMIN', 'COORDENADOR_SOCIAL'],
    },
  },

  INSCRICAO_PROGRAMA_SOCIAL: {
    code: 'INSCRICAO_PROGRAMA_SOCIAL',
    name: 'Inscrição em Programa Social',
    department: 'ASSISTENCIA_SOCIAL',
    description: 'Inscrição em programas sociais municipais',
    icon: 'hands-helping',

    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },

    approval: {
      required: true,
      workflow: 'simple',
      roles: ['ASSISTENTE_SOCIAL', 'COORDENADOR_PROGRAMA'],
      sla: {
        analysisTime: 5,
        approvalTime: 10,
        unit: 'days',
      },
    },

    entities: ['SocialProgram', 'SocialProgramEnrollment'],

    dashboardKPIs: [
      'totalEnrollments',
      'byProgram',
      'beneficiaries',
      'impact',
    ],

    managementEntities: [
      {
        name: 'socialProgram',
        label: 'Programa Social',
        pluralLabel: 'Programas Sociais',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'description', label: 'Descrição', type: 'string', required: true },
          { name: 'eligibilityCriteria', label: 'Critérios de Elegibilidade', type: 'string', required: true },
          { name: 'benefits', label: 'Benefícios', type: 'string', required: true },
        ],
      },
    ],

    permissions: {
      view: ['SOCIAL_ADMIN', 'ASSISTENTE_SOCIAL', 'COORDENADOR_PROGRAMA'],
      approve: ['ASSISTENTE_SOCIAL', 'COORDENADOR_PROGRAMA'],
      manage: ['SOCIAL_ADMIN', 'COORDENADOR_SOCIAL'],
    },
  },

  AGENDAMENTO_ATENDIMENTO_SOCIAL: {
    code: 'AGENDAMENTO_ATENDIMENTO_SOCIAL',
    name: 'Agendamento de Atendimento Social',
    department: 'ASSISTENCIA_SOCIAL',
    description: 'Agendamento de atendimento com assistente social',
    icon: 'calendar-check',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['SocialAppointment'],

    dashboardKPIs: [
      'totalAppointments',
      'confirmed',
      'cancelled',
      'noShow',
      'avgWaitTime',
    ],

    managementEntities: [],

    permissions: {
      view: ['SOCIAL_ADMIN', 'ASSISTENTE_SOCIAL', 'COORDENADOR_SOCIAL'],
      create: ['SOCIAL_ADMIN', 'ASSISTENTE_SOCIAL'],
      manage: ['SOCIAL_ADMIN', 'COORDENADOR_SOCIAL'],
    },
  },

  GESTAO_CRAS_CREAS: {
    code: 'GESTAO_CRAS_CREAS',
    name: 'Gestão CRAS/CREAS',
    department: 'ASSISTENCIA_SOCIAL',
    description: 'Gestão de equipamentos sociais',
    icon: 'building',

    tabs: {
      list: true,
      approval: false,
      dashboard: true,
      management: true,
    },

    entities: ['SocialEquipment'],

    dashboardKPIs: [
      'totalEquipments',
      'attendanceByEquipment',
      'capacity',
      'demand',
    ],

    managementEntities: [
      {
        name: 'socialEquipment',
        label: 'Equipamento Social',
        pluralLabel: 'Equipamentos Sociais',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'CRAS', label: 'CRAS' },
            { value: 'CREAS', label: 'CREAS' },
            { value: 'CENTRO_POP', label: 'Centro POP' },
            { value: 'ABRIGO', label: 'Abrigo' },
          ]},
          { name: 'address', label: 'Endereço', type: 'string', required: true },
          { name: 'capacity', label: 'Capacidade de Atendimento', type: 'number', required: true },
          { name: 'team', label: 'Equipe', type: 'string', required: false },
        ],
      },
    ],

    permissions: {
      view: ['SOCIAL_ADMIN', 'COORDENADOR_SOCIAL'],
      manage: ['SOCIAL_ADMIN', 'COORDENADOR_SOCIAL'],
    },
  },

  // ==========================================================================
  // SECRETARIA DE AGRICULTURA (6 módulos)
  // ==========================================================================

  ATENDIMENTOS_AGRICULTURA: {
    code: 'ATENDIMENTOS_AGRICULTURA',
    name: 'Atendimentos de Agricultura',
    department: 'AGRICULTURA',
    description: 'Registro geral de atendimentos na área agrícola',
    icon: 'tractor',
    tabs: { list: true, approval: false, dashboard: true, management: true },
    entities: ['AgricultureAttendance'],
    dashboardKPIs: ['total', 'pending', 'completed', 'avgTime', 'byType'],
    managementEntities: [],
    permissions: {
      view: ['AGRICULTURE_ADMIN', 'AGRICULTURE_TECHNICIAN'],
      create: ['AGRICULTURE_ADMIN', 'AGRICULTURE_TECHNICIAN'],
      manage: ['AGRICULTURE_ADMIN'],
    },
  },

  CADASTRO_PRODUTOR_RURAL: {
    code: 'CADASTRO_PRODUTOR_RURAL',
    name: 'Cadastro de Produtor Rural',
    department: 'AGRICULTURA',
    description: 'Cadastro de produtores rurais e agricultores familiares',
    icon: 'user-tie',
    tabs: { list: true, approval: true, dashboard: true, management: true },
    approval: {
      required: true,
      workflow: 'multi-step',
      roles: ['TECNICO_AGRICULTURA', 'COORDENADOR_AGRICULTURA'],
      steps: [
        { order: 1, role: 'TECNICO_AGRICULTURA', name: 'Análise Técnica' },
        { order: 2, role: 'COORDENADOR_AGRICULTURA', name: 'Aprovação Final' },
      ],
      sla: { analysisTime: 5, approvalTime: 10, unit: 'days' },
    },
    entities: ['RuralProducer'],
    dashboardKPIs: ['total', 'active', 'inactive', 'pending', 'byPropertyType'],
    managementEntities: [
      {
        name: 'ruralProducer',
        label: 'Produtor Rural',
        pluralLabel: 'Produtores Rurais',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: true,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'cpf', label: 'CPF', type: 'string', required: true },
          { name: 'dap', label: 'DAP', type: 'string', required: false },
          { name: 'phone', label: 'Telefone', type: 'string', required: true },
        ],
      },
    ],
    permissions: {
      view: ['AGRICULTURE_ADMIN', 'TECNICO_AGRICULTURA'],
      approve: ['TECNICO_AGRICULTURA', 'COORDENADOR_AGRICULTURA'],
      manage: ['AGRICULTURE_ADMIN'],
    },
  },

  ASSISTENCIA_TECNICA_RURAL: {
    code: 'ASSISTENCIA_TECNICA_RURAL',
    name: 'Assistência Técnica Rural (ATER)',
    department: 'AGRICULTURA',
    description: 'Solicitação de assistência técnica rural para produtores',
    icon: 'hands-helping',
    tabs: { list: true, approval: true, dashboard: true, management: true },
    approval: {
      required: true,
      workflow: 'simple',
      roles: ['TECNICO_ATER', 'COORDENADOR_ATER'],
      sla: { analysisTime: 3, approvalTime: 7, unit: 'days' },
    },
    entities: ['TechnicalAssistance'],
    dashboardKPIs: ['totalRequests', 'completed', 'pending', 'byActivity', 'avgResponseTime'],
    managementEntities: [],
    permissions: {
      view: ['AGRICULTURE_ADMIN', 'TECNICO_ATER'],
      approve: ['TECNICO_ATER', 'COORDENADOR_ATER'],
      manage: ['AGRICULTURE_ADMIN'],
    },
  },

  INSCRICAO_CURSO_RURAL: {
    code: 'INSCRICAO_CURSO_RURAL',
    name: 'Inscrição em Curso Rural',
    department: 'AGRICULTURA',
    description: 'Inscrição em cursos e capacitações rurais',
    icon: 'graduation-cap',
    tabs: { list: true, approval: true, dashboard: true, management: true },
    approval: {
      required: true,
      workflow: 'simple',
      roles: ['COORDENADOR_CURSOS', 'COORDENADOR_AGRICULTURA'],
      sla: { analysisTime: 2, approvalTime: 5, unit: 'days' },
    },
    entities: ['RuralTraining', 'RuralTrainingEnrollment'],
    dashboardKPIs: ['totalEnrollments', 'byCourse', 'completed', 'dropout', 'satisfaction'],
    managementEntities: [
      {
        name: 'ruralTraining',
        label: 'Curso Rural',
        pluralLabel: 'Cursos Rurais',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'description', label: 'Descrição', type: 'string', required: true },
          { name: 'capacity', label: 'Capacidade', type: 'number', required: true },
          { name: 'startDate', label: 'Data Início', type: 'date', required: true },
        ],
      },
    ],
    permissions: {
      view: ['AGRICULTURE_ADMIN', 'COORDENADOR_CURSOS'],
      approve: ['COORDENADOR_CURSOS', 'COORDENADOR_AGRICULTURA'],
      manage: ['AGRICULTURE_ADMIN'],
    },
  },

  INSCRICAO_PROGRAMA_RURAL: {
    code: 'INSCRICAO_PROGRAMA_RURAL',
    name: 'Inscrição em Programa Rural',
    department: 'AGRICULTURA',
    description: 'Inscrição em programas agrícolas (PRONAF, PAA, PNAE)',
    icon: 'seedling',
    tabs: { list: true, approval: true, dashboard: true, management: true },
    approval: {
      required: true,
      workflow: 'simple',
      roles: ['TECNICO_AGRICULTURA', 'COORDENADOR_PROGRAMAS'],
      sla: { analysisTime: 5, approvalTime: 10, unit: 'days' },
    },
    entities: ['RuralProgram', 'RuralProgramEnrollment'],
    dashboardKPIs: ['totalEnrollments', 'byProgram', 'beneficiaries', 'resources'],
    managementEntities: [
      {
        name: 'ruralProgram',
        label: 'Programa Rural',
        pluralLabel: 'Programas Rurais',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'PRONAF', label: 'PRONAF' },
            { value: 'PAA', label: 'PAA' },
            { value: 'PNAE', label: 'PNAE' },
          ]},
        ],
      },
    ],
    permissions: {
      view: ['AGRICULTURE_ADMIN', 'TECNICO_AGRICULTURA'],
      approve: ['TECNICO_AGRICULTURA', 'COORDENADOR_PROGRAMAS'],
      manage: ['AGRICULTURE_ADMIN'],
    },
  },

  CADASTRO_PROPRIEDADE_RURAL: {
    code: 'CADASTRO_PROPRIEDADE_RURAL',
    name: 'Cadastro de Propriedade Rural',
    department: 'AGRICULTURA',
    description: 'Cadastro e regularização de propriedades rurais',
    icon: 'map-marked',
    tabs: { list: true, approval: true, dashboard: true, management: true },
    approval: {
      required: true,
      workflow: 'simple',
      roles: ['TECNICO_AGRICULTURA', 'COORDENADOR_AGRICULTURA'],
      sla: { analysisTime: 7, approvalTime: 15, unit: 'days' },
    },
    entities: ['RuralProperty'],
    dashboardKPIs: ['total', 'bySize', 'byActivity', 'regularized'],
    managementEntities: [
      {
        name: 'ruralProperty',
        label: 'Propriedade Rural',
        pluralLabel: 'Propriedades Rurais',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          { name: 'name', label: 'Nome', type: 'string', required: true },
          { name: 'area', label: 'Área (hectares)', type: 'number', required: true },
          { name: 'location', label: 'Localização', type: 'string', required: true },
        ],
      },
    ],
    permissions: {
      view: ['AGRICULTURE_ADMIN', 'TECNICO_AGRICULTURA'],
      approve: ['TECNICO_AGRICULTURA', 'COORDENADOR_AGRICULTURA'],
      manage: ['AGRICULTURE_ADMIN'],
    },
  },
};

/**
 * Função auxiliar para obter configuração de um módulo
 */
export function getModuleConfig(moduleCode: string): ModuleConfig | undefined {
  return MODULE_CONFIGS[moduleCode];
}

/**
 * Função auxiliar para obter todos os módulos de uma secretaria
 */
export function getModulesByDepartment(department: string): ModuleConfig[] {
  return Object.values(MODULE_CONFIGS).filter((config) => config.department === department);
}

/**
 * Função auxiliar para verificar se módulo requer aprovação
 */
export function requiresApproval(moduleCode: string): boolean {
  const config = MODULE_CONFIGS[moduleCode];
  return config?.tabs?.approval === true && config?.approval?.required === true;
}

/**
 * Estatísticas do sistema
 */
export const SYSTEM_STATS = {
  totalModules: Object.keys(MODULE_CONFIGS).length,
  totalDepartments: new Set(Object.values(MODULE_CONFIGS).map((c) => c.department)).size,
  modulesWithApproval: Object.values(MODULE_CONFIGS).filter((c) => c.tabs.approval).length,
  modulesByDepartment: Object.values(MODULE_CONFIGS).reduce((acc, config) => {
    acc[config.department] = (acc[config.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
};
