import { ModuleConfig } from './types';

// ============================================================================
// CONFIGURAÇÕES DOS MÓDULOS DE SAÚDE
// ============================================================================

export const healthAttendanceConfig: ModuleConfig = {
  key: 'health-attendance',
  entityName: 'HealthAttendance',
  departmentType: 'health',
  displayName: 'Atendimentos de Saúde',
  displayNameSingular: 'Atendimentos de Saúde',

  fields: [
    { name: 'citizenName', label: 'Nome do Paciente', type: 'text', required: true, showInList: true },
    { name: 'citizenCPF', label: 'CPF', type: 'text', required: true, showInList: true },
    { name: 'contact', label: 'Contato', type: 'text', required: true, showInList: true },
    { name: 'type', label: 'Tipo de Atendimento', type: 'select', required: true, showInList: true, options: [
      { value: 'GENERAL', label: 'Geral' },
      { value: 'APPOINTMENT_REQUEST', label: 'Solicitação de Consulta' },
      { value: 'EXAM_REQUEST', label: 'Solicitação de Exame' },
      { value: 'MEDICATION_REQUEST', label: 'Solicitação de Medicamento' },
      { value: 'HOME_VISIT', label: 'Visita Domiciliar' },
      { value: 'VACCINATION', label: 'Vacinação' },
      { value: 'HEALTH_CERTIFICATE', label: 'Atestado de Saúde' },
    ]},
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'IN_PROGRESS', label: 'Em Atendimento' },
      { value: 'COMPLETED', label: 'Concluído' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'urgency', label: 'Urgência', type: 'select', showInList: true, options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'CRITICAL', label: 'Crítica' },
    ]},
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'symptoms', label: 'Sintomas', type: 'textarea' },
    { name: 'medicalUnit', label: 'Unidade de Saúde', type: 'text' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Atendimentos', icon: 'Activity' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'completed', label: 'Concluídos', icon: 'CheckCircle' },
    { key: 'critical', label: 'Críticos', icon: 'AlertTriangle' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'COMPLETED', label: 'Concluído' },
    ]},
    { key: 'urgency', type: 'select', label: 'Urgência', options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'CRITICAL', label: 'Crítica' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/saude/health-attendances',
};

export const healthAppointmentConfig: ModuleConfig = {
  key: 'health-appointment',
  departmentType: 'health',
  entityName: 'HealthAppointment',
  displayName: 'Agendamentos Médicos',
  displayNameSingular: 'Agendamento Médico',

  fields: [
    { name: 'patientName', label: 'Nome do Paciente', type: 'text', required: true, showInList: true },
    { name: 'patientCpf', label: 'CPF', type: 'text', required: true, showInList: true },
    { name: 'patientPhone', label: 'Telefone', type: 'text', showInList: true },
    { name: 'appointmentDate', label: 'Data da Consulta', type: 'date', required: true, showInList: true },
    { name: 'appointmentTime', label: 'Horário', type: 'time', required: true, showInList: true },
    { name: 'speciality', label: 'Especialidade', type: 'select', required: true, showInList: true, options: [
      { value: 'GENERAL', label: 'Clínico Geral' },
      { value: 'PEDIATRICS', label: 'Pediatria' },
      { value: 'GYNECOLOGY', label: 'Ginecologia' },
      { value: 'CARDIOLOGY', label: 'Cardiologia' },
      { value: 'DERMATOLOGY', label: 'Dermatologia' },
      { value: 'PSYCHIATRY', label: 'Psiquiatria' },
      { value: 'DENTISTRY', label: 'Odontologia' },
    ]},
    { name: 'priority', label: 'Prioridade', type: 'select', showInList: true, options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'URGENT', label: 'Urgente' },
      { value: 'EMERGENCY', label: 'Emergência' },
    ]},
    { name: 'symptoms', label: 'Sintomas', type: 'textarea' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Agendamentos', icon: 'Calendar' },
    { key: 'scheduled', label: 'Agendados', icon: 'Clock' },
    { key: 'completed', label: 'Realizados', icon: 'CheckCircle' },
    { key: 'cancelled', label: 'Cancelados', icon: 'XCircle' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'COMPLETED', label: 'Realizado' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { key: 'speciality', type: 'select', label: 'Especialidade', options: [
      { value: 'GENERAL', label: 'Clínico Geral' },
      { value: 'PEDIATRICS', label: 'Pediatria' },
      { value: 'GYNECOLOGY', label: 'Ginecologia' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/saude/atendimentos',
};

export const medicationDispenseConfig: ModuleConfig = {
  key: 'medication-dispense',
  departmentType: 'health',
  entityName: 'MedicationDispense',
  displayName: 'Dispensação de Medicamentos',
  displayNameSingular: 'Dispensação de Medicamento',

  fields: [
    { name: 'patientName', label: 'Nome do Paciente', type: 'text', required: true, showInList: true },
    { name: 'patientCpf', label: 'CPF', type: 'text', required: true, showInList: true },
    { name: 'medicationName', label: 'Medicamento', type: 'text', required: true, showInList: true },
    { name: 'dosage', label: 'Dosagem', type: 'text', required: true, showInList: true },
    { name: 'quantity', label: 'Quantidade', type: 'number', required: true, showInList: true },
    { name: 'dispenseDate', label: 'Data de Dispensação', type: 'date', showInList: true },
    { name: 'pharmacistName', label: 'Farmacêutico', type: 'text', required: true },
    { name: 'prescriptionId', label: 'ID da Receita', type: 'text' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total Dispensado', icon: 'Package' },
    { key: 'today', label: 'Hoje', icon: 'Calendar' },
    { key: 'thisWeek', label: 'Esta Semana', icon: 'TrendingUp' },
    { key: 'thisMonth', label: 'Este Mês', icon: 'BarChart3' },
  ],

  filters: [
    { key: 'date', type: 'date', label: 'Data' },
  ],

  apiEndpoint: '/api/admin/secretarias/saude/medicamentos',
};

export const healthCampaignConfig: ModuleConfig = {
  key: 'health-campaign',
  departmentType: 'health',
  entityName: 'HealthCampaign',
  displayName: 'Campanhas de Saúde',
  displayNameSingular: 'Campanhas de Saúde',

  fields: [
    { name: 'name', label: 'Nome da Campanha', type: 'text', required: true, showInList: true },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'campaignType', label: 'Tipo', type: 'select', required: true, showInList: true, options: [
      { value: 'VACCINATION', label: 'Vacinação' },
      { value: 'PREVENTION', label: 'Prevenção' },
      { value: 'AWARENESS', label: 'Conscientização' },
      { value: 'SCREENING', label: 'Rastreamento' },
    ]},
    { name: 'startDate', label: 'Data de Início', type: 'date', required: true, showInList: true },
    { name: 'endDate', label: 'Data de Término', type: 'date', required: true, showInList: true },
    { name: 'targetAudience', label: 'Público Alvo', type: 'text', required: true },
    { name: 'coordinatorName', label: 'Coordenador', type: 'text', required: true },
    { name: 'budget', label: 'Orçamento', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PLANNED', label: 'Planejada' },
      { value: 'ACTIVE', label: 'Ativa' },
      { value: 'COMPLETED', label: 'Concluída' },
      { value: 'CANCELLED', label: 'Cancelada' },
    ]},
  ],

  stats: [
    { key: 'total', label: 'Total de Campanhas', icon: 'Megaphone' },
    { key: 'active', label: 'Ativas', icon: 'Activity' },
    { key: 'planned', label: 'Planejadas', icon: 'Calendar' },
    { key: 'completed', label: 'Concluídas', icon: 'CheckCircle' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativa' },
      { value: 'PLANNED', label: 'Planejada' },
      { value: 'COMPLETED', label: 'Concluída' },
    ]},
    { key: 'campaignType', type: 'select', label: 'Tipo', options: [
      { value: 'VACCINATION', label: 'Vacinação' },
      { value: 'PREVENTION', label: 'Prevenção' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/saude/campanhas',
};

export const healthProgramConfig: ModuleConfig = {
  key: 'health-program',
  departmentType: 'health',
  entityName: 'HealthProgram',
  displayName: 'Programas de Saúde',
  displayNameSingular: 'Programas de Saúde',

  fields: [
    { name: 'name', label: 'Nome do Programa', type: 'text', required: true, showInList: true },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'programType', label: 'Tipo', type: 'select', required: true, showInList: true, options: [
      { value: 'CHRONIC_DISEASE', label: 'Doença Crônica (Hiperdia)' },
      { value: 'MENTAL_HEALTH', label: 'Saúde Mental' },
      { value: 'PRENATAL', label: 'Pré-natal' },
      { value: 'CHILD_HEALTH', label: 'Saúde da Criança' },
      { value: 'ELDERLY_HEALTH', label: 'Saúde do Idoso' },
      { value: 'WOMENS_HEALTH', label: 'Saúde da Mulher' },
    ]},
    { name: 'targetAudience', label: 'Público Alvo', type: 'text', required: true },
    { name: 'coordinatorName', label: 'Coordenador', type: 'text', required: true },
    { name: 'startDate', label: 'Data de Início', type: 'date', required: true, showInList: true },
    { name: 'endDate', label: 'Data de Término', type: 'date' },
    { name: 'budget', label: 'Orçamento', type: 'number' },
    { name: 'participants', label: 'Participantes', type: 'number', showInList: true },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Programas', icon: 'Briefcase' },
    { key: 'active', label: 'Ativos', icon: 'Activity' },
    { key: 'participants', label: 'Total Participantes', icon: 'Users' },
  ],

  filters: [
    { key: 'programType', type: 'select', label: 'Tipo', options: [
      { value: 'CHRONIC_DISEASE', label: 'Doença Crônica' },
      { value: 'MENTAL_HEALTH', label: 'Saúde Mental' },
      { value: 'PRENATAL', label: 'Pré-natal' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/saude/programas',
};

export const healthTransportConfig: ModuleConfig = {
  key: 'health-transport',
  departmentType: 'health',
  entityName: 'HealthTransport',
  displayName: 'Transporte TFD',
  displayNameSingular: 'Transporte TFD',

  fields: [
    { name: 'patientName', label: 'Nome do Paciente', type: 'text', required: true, showInList: true },
    { name: 'origin', label: 'Origem', type: 'text', required: true, showInList: true },
    { name: 'destination', label: 'Destino', type: 'text', required: true, showInList: true },
    { name: 'transportType', label: 'Tipo de Transporte', type: 'select', required: true, options: [
      { value: 'TFD', label: 'TFD - Tratamento Fora Domicílio' },
      { value: 'AMBULANCE', label: 'Ambulância' },
      { value: 'VEHICLE', label: 'Veículo Comum' },
    ]},
    { name: 'urgencyLevel', label: 'Nível de Urgência', type: 'select', required: true, showInList: true, options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'URGENT', label: 'Urgente' },
      { value: 'EMERGENCY', label: 'Emergência' },
    ]},
    { name: 'scheduledDate', label: 'Data Agendada', type: 'datetime', required: true, showInList: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'IN_TRANSIT', label: 'Em Trânsito' },
      { value: 'COMPLETED', label: 'Concluído' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Transportes', icon: 'Ambulance' },
    { key: 'scheduled', label: 'Agendados', icon: 'Calendar' },
    { key: 'completed', label: 'Concluídos', icon: 'CheckCircle' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'COMPLETED', label: 'Concluído' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/saude/transportes',
};

export const healthExamConfig: ModuleConfig = {
  key: 'health-exam',
  departmentType: 'health',
  entityName: 'HealthExam',
  displayName: 'Exames',
  displayNameSingular: 'Exame',

  fields: [
    { name: 'patientName', label: 'Nome do Paciente', type: 'text', required: true, showInList: true },
    { name: 'patientCpf', label: 'CPF', type: 'text', required: true, showInList: true },
    { name: 'patientPhone', label: 'Telefone', type: 'text' },
    { name: 'examType', label: 'Tipo de Exame', type: 'select', required: true, showInList: true, options: [
      { value: 'LABORATORIAL', label: 'Laboratorial' },
      { value: 'IMAGING', label: 'Imagem' },
      { value: 'SPECIALTY', label: 'Especializado' },
    ]},
    { name: 'examName', label: 'Nome do Exame', type: 'text', required: true, showInList: true },
    { name: 'requestedBy', label: 'Solicitado por', type: 'text', required: true },
    { name: 'scheduledDate', label: 'Data Agendada', type: 'date', showInList: true },
    { name: 'priority', label: 'Prioridade', type: 'select', options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'URGENT', label: 'Urgente' },
    ]},
    { name: 'healthUnit', label: 'Unidade de Saúde', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'REQUESTED', label: 'Solicitado' },
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'COMPLETED', label: 'Realizado' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Exames', icon: 'FileText' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'completed', label: 'Realizados', icon: 'CheckCircle' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'REQUESTED', label: 'Solicitado' },
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'COMPLETED', label: 'Realizado' },
    ]},
    { key: 'examType', type: 'select', label: 'Tipo', options: [
      { value: 'LABORATORIAL', label: 'Laboratorial' },
      { value: 'IMAGING', label: 'Imagem' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/saude/exames',
};

export const healthTransportRequestConfig: ModuleConfig = {
  key: 'health-transport-request',
  departmentType: 'health',
  entityName: 'HealthTransportRequest',
  displayName: 'Solicitações de Transporte',
  displayNameSingular: 'Solicitações de Transporte',

  fields: [
    { name: 'patientName', label: 'Nome do Paciente', type: 'text', required: true, showInList: true },
    { name: 'patientCpf', label: 'CPF', type: 'text', required: true, showInList: true },
    { name: 'patientPhone', label: 'Telefone', type: 'text' },
    { name: 'origin', label: 'Origem', type: 'text', required: true },
    { name: 'destination', label: 'Destino', type: 'text', required: true },
    { name: 'reason', label: 'Motivo', type: 'textarea', required: true },
    { name: 'transportType', label: 'Tipo de Transporte', type: 'select', required: true, options: [
      { value: 'AMBULANCE', label: 'Ambulância' },
      { value: 'VEHICLE', label: 'Veículo Comum' },
      { value: 'ADAPTED', label: 'Veículo Adaptado' },
    ]},
    { name: 'urgencyLevel', label: 'Urgência', type: 'select', showInList: true, options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'URGENT', label: 'Urgente' },
      { value: 'EMERGENCY', label: 'Emergência' },
    ]},
    { name: 'scheduledDate', label: 'Data Solicitada', type: 'datetime', showInList: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'REQUESTED', label: 'Solicitado' },
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'IN_TRANSIT', label: 'Em Trânsito' },
      { value: 'COMPLETED', label: 'Concluído' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Solicitações', icon: 'Car' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'completed', label: 'Concluídas', icon: 'CheckCircle' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'REQUESTED', label: 'Solicitado' },
      { value: 'SCHEDULED', label: 'Agendado' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/saude/solicitacoes-transporte',
};

export const vaccinationConfig: ModuleConfig = {
  key: 'vaccination',
  departmentType: 'health',
  entityName: 'Vaccination',
  displayName: 'Vacinação',
  displayNameSingular: 'Vacinação',

  fields: [
    { name: 'patientId', label: 'ID do Paciente', type: 'text', required: true },
    { name: 'vaccine', label: 'Vacina', type: 'text', required: true, showInList: true },
    { name: 'dose', label: 'Dose', type: 'select', required: true, showInList: true, options: [
      { value: '1ª dose', label: '1ª dose' },
      { value: '2ª dose', label: '2ª dose' },
      { value: '3ª dose', label: '3ª dose' },
      { value: 'Dose única', label: 'Dose única' },
      { value: 'Reforço', label: 'Reforço' },
    ]},
    { name: 'appliedAt', label: 'Data de Aplicação', type: 'date', required: true, showInList: true },
    { name: 'appliedBy', label: 'Aplicado por', type: 'text', required: true },
    { name: 'lotNumber', label: 'Número do Lote', type: 'text', showInList: true },
    { name: 'nextDose', label: 'Próxima Dose', type: 'date' },
    { name: 'campaignId', label: 'ID da Campanha', type: 'text' },
  ],

  stats: [
    { key: 'total', label: 'Total de Doses', icon: 'Syringe' },
    { key: 'today', label: 'Hoje', icon: 'Calendar' },
    { key: 'thisWeek', label: 'Esta Semana', icon: 'TrendingUp' },
  ],

  filters: [
    { key: 'vaccine', type: 'text', label: 'Vacina' },
    { key: 'date', type: 'date', label: 'Data' },
  ],

  apiEndpoint: '/api/admin/secretarias/saude/vacinacao',
};

export const patientConfig: ModuleConfig = {
  key: 'patient',
  departmentType: 'health',
  entityName: 'Patient',
  displayName: 'Cadastro de Pacientes',
  displayNameSingular: 'Cadastro de Paciente',

  fields: [
    { name: 'fullName', label: 'Nome Completo', type: 'text', required: true, showInList: true },
    { name: 'cpf', label: 'CPF', type: 'text', required: true, showInList: true },
    { name: 'rg', label: 'RG', type: 'text' },
    { name: 'birthDate', label: 'Data de Nascimento', type: 'date', required: true, showInList: true },
    { name: 'gender', label: 'Gênero', type: 'select', required: true, options: [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Feminino' },
      { value: 'O', label: 'Outro' },
    ]},
    { name: 'bloodType', label: 'Tipo Sanguíneo', type: 'select', options: [
      { value: 'A+', label: 'A+' },
      { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' },
      { value: 'B-', label: 'B-' },
      { value: 'AB+', label: 'AB+' },
      { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' },
      { value: 'O-', label: 'O-' },
    ]},
    { name: 'phone', label: 'Telefone', type: 'text', showInList: true },
    { name: 'email', label: 'E-mail', type: 'email' },
    { name: 'address', label: 'Endereço', type: 'text' },
    { name: 'city', label: 'Cidade', type: 'text' },
    { name: 'state', label: 'Estado', type: 'text' },
    { name: 'zipCode', label: 'CEP', type: 'text' },
    { name: 'susCardNumber', label: 'Cartão SUS', type: 'text', showInList: true },
    { name: 'allergies', label: 'Alergias', type: 'textarea' },
    { name: 'chronicDiseases', label: 'Doenças Crônicas', type: 'textarea' },
    { name: 'medications', label: 'Medicamentos em Uso', type: 'textarea' },
    { name: 'emergencyContact', label: 'Contato de Emergência', type: 'text' },
    { name: 'emergencyPhone', label: 'Telefone de Emergência', type: 'text' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Pacientes', icon: 'Users' },
    { key: 'active', label: 'Ativos', icon: 'UserCheck' },
    { key: 'newThisMonth', label: 'Novos este Mês', icon: 'UserPlus' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/saude/pacientes',
};

export const communityHealthAgentConfig: ModuleConfig = {
  key: 'community-health-agent',
  departmentType: 'health',
  entityName: 'CommunityHealthAgent',
  displayName: 'Agentes Comunitários de Saúde',
  displayNameSingular: 'Agentes Comunitários de Saúde',

  fields: [
    { name: 'fullName', label: 'Nome Completo', type: 'text', required: true, showInList: true },
    { name: 'cpf', label: 'CPF', type: 'text', required: true, showInList: true },
    { name: 'phone', label: 'Telefone', type: 'text', required: true, showInList: true },
    { name: 'email', label: 'E-mail', type: 'email' },
    { name: 'address', label: 'Endereço', type: 'text' },
    { name: 'assignedArea', label: 'Área de Atuação', type: 'text', required: true, showInList: true },
    { name: 'registrationNum', label: 'Número de Registro', type: 'text' },
    { name: 'hireDate', label: 'Data de Contratação', type: 'date', required: true, showInList: true },
    { name: 'healthUnit', label: 'Unidade de Saúde', type: 'text' },
    { name: 'supervisor', label: 'Supervisor', type: 'text' },
    { name: 'familiesServed', label: 'Famílias Atendidas', type: 'number', showInList: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
      { value: 'ON_LEAVE', label: 'Afastado' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de ACS', icon: 'UserCheck' },
    { key: 'active', label: 'Ativos', icon: 'Activity' },
    { key: 'totalFamilies', label: 'Total de Famílias', icon: 'Home' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/saude/acs',
};

// Exportar todas as configurações
export const saudeConfigs = {
  healthAttendance: healthAttendanceConfig,
  healthAppointment: healthAppointmentConfig,
  medicationDispense: medicationDispenseConfig,
  healthCampaign: healthCampaignConfig,
  healthProgram: healthProgramConfig,
  healthTransport: healthTransportConfig,
  healthExam: healthExamConfig,
  healthTransportRequest: healthTransportRequestConfig,
  vaccination: vaccinationConfig,
  patient: patientConfig,
  communityHealthAgent: communityHealthAgentConfig,
};
