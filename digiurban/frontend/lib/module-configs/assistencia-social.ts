import { ModuleConfig } from './types';

// ============================================================================
// CONFIGURAÇÕES DOS MÓDULOS DE ASSISTÊNCIA SOCIAL - 9 MÓDULOS COMPLETOS
// ============================================================================

// 1. ATENDIMENTOS DE ASSISTÊNCIA SOCIAL
export const socialAssistanceAttendanceConfig: ModuleConfig = {
  key: 'social-assistance-attendance',
  entityName: 'SocialAssistanceAttendance',
  departmentType: 'social-assistance',
  displayName: 'Atendimentos de Assistência Social',
  displayNameSingular: 'Atendimentos de Assistência Social',

  fields: [
    { name: 'citizenName', label: 'Nome do Cidadão', type: 'text', required: true, showInList: true },
    { name: 'citizenCpf', label: 'CPF', type: 'text', required: true, showInList: true },
    { name: 'contact', label: 'Contato (JSON)', type: 'text', required: true },
    { name: 'familyIncome', label: 'Renda Familiar', type: 'number', showInList: true },
    { name: 'familySize', label: 'Tamanho da Família', type: 'number', showInList: true },
    { name: 'serviceType', label: 'Tipo de Serviço', type: 'select', required: true, showInList: true, options: [
      { value: 'CRAS', label: 'CRAS - Centro de Referência' },
      { value: 'CREAS', label: 'CREAS - Centro Especializado' },
      { value: 'CADASTRO_UNICO', label: 'Cadastro Único' },
      { value: 'BOLSA_FAMILIA', label: 'Bolsa Família' },
      { value: 'BPC', label: 'BPC - Benefício de Prestação Continuada' },
      { value: 'ACOLHIMENTO', label: 'Acolhimento' },
      { value: 'ORIENTACAO', label: 'Orientação Social' },
    ]},
    { name: 'attendanceType', label: 'Tipo de Atendimento', type: 'select', options: [
      { value: 'INDIVIDUAL', label: 'Individual' },
      { value: 'FAMILIAR', label: 'Familiar' },
      { value: 'GRUPO', label: 'Em Grupo' },
      { value: 'VISITA', label: 'Visita Domiciliar' },
    ]},
    { name: 'subject', label: 'Assunto', type: 'text', required: true, showInList: true },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'vulnerability', label: 'Vulnerabilidade', type: 'select', showInList: true, options: [
      { value: 'BAIXA', label: 'Baixa' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'ALTISSIMA', label: 'Altíssima' },
    ]},
    { name: 'urgency', label: 'Urgência', type: 'select', showInList: true, options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'CRITICAL', label: 'Crítica' },
    ]},
    { name: 'referredBy', label: 'Encaminhado por', type: 'text' },
    { name: 'socialWorker', label: 'Assistente Social', type: 'text' },
    { name: 'priority', label: 'Prioridade', type: 'select', options: [
      { value: 'LOW', label: 'Baixa' },
      { value: 'MEDIUM', label: 'Média' },
      { value: 'HIGH', label: 'Alta' },
    ]},
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'IN_PROGRESS', label: 'Em Atendimento' },
      { value: 'AWAITING_DOCUMENTS', label: 'Aguardando Documentos' },
      { value: 'COMPLETED', label: 'Concluído' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'followUpNeeded', label: 'Necessita Acompanhamento', type: 'checkbox' },
    { name: 'followUpDate', label: 'Data de Acompanhamento', type: 'date' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Atendimentos', icon: 'Users' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'completed', label: 'Concluídos', icon: 'CheckCircle' },
    { key: 'highVulnerability', label: 'Alta Vulnerabilidade', icon: 'AlertTriangle' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'IN_PROGRESS', label: 'Em Atendimento' },
      { value: 'COMPLETED', label: 'Concluído' },
    ]},
    { key: 'vulnerability', type: 'select', label: 'Vulnerabilidade', options: [
      { value: 'ALTA', label: 'Alta' },
      { value: 'ALTISSIMA', label: 'Altíssima' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/assistencia-social/atendimentos',
};

// 2. FAMÍLIAS VULNERÁVEIS (Cadastro Único)
export const vulnerableFamilyConfig: ModuleConfig = {
  key: 'vulnerable-family',
  departmentType: 'social-assistance',
  entityName: 'VulnerableFamily',
  displayName: 'Cadastro Único - Famílias Vulneráveis',
  displayNameSingular: 'Cadastro Único - Famílias Vulneráveis',

  fields: [
    { name: 'responsibleName', label: 'Nome do Responsável', type: 'text', required: true, showInList: true },
    { name: 'familyCode', label: 'Código da Família (NIS)', type: 'text', showInList: true },
    { name: 'memberCount', label: 'Número de Membros', type: 'number', required: true, showInList: true },
    { name: 'monthlyIncome', label: 'Renda Mensal (R$)', type: 'number', showInList: true },
    { name: 'riskLevel', label: 'Nível de Risco', type: 'select', required: true, showInList: true, options: [
      { value: 'LOW', label: 'Baixo' },
      { value: 'MEDIUM', label: 'Médio' },
      { value: 'HIGH', label: 'Alto' },
      { value: 'CRITICAL', label: 'Crítico' },
    ]},
    { name: 'vulnerabilityType', label: 'Tipo de Vulnerabilidade', type: 'select', required: true, showInList: true, options: [
      { value: 'EXTREMA_POBREZA', label: 'Extrema Pobreza' },
      { value: 'VIOLENCIA_DOMESTICA', label: 'Violência Doméstica' },
      { value: 'ABANDONO', label: 'Abandono' },
      { value: 'TRABALHO_INFANTIL', label: 'Trabalho Infantil' },
      { value: 'ABUSO_DROGAS', label: 'Abuso de Drogas' },
      { value: 'SITUACAO_RUA', label: 'Situação de Rua' },
      { value: 'DEFICIENCIA', label: 'Pessoa com Deficiência' },
      { value: 'IDOSO_VULNERAVEL', label: 'Idoso Vulnerável' },
    ]},
    { name: 'socialWorker', label: 'Assistente Social Responsável', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
      { value: 'PENDING_UPDATE', label: 'Pendente Atualização' },
    ]},
    { name: 'lastVisitDate', label: 'Última Visita', type: 'date', showInList: true },
    { name: 'nextVisitDate', label: 'Próxima Visita', type: 'date', showInList: true },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Famílias', icon: 'Home' },
    { key: 'critical', label: 'Risco Crítico', icon: 'AlertTriangle' },
    { key: 'activePrograms', label: 'Em Programas', icon: 'TrendingUp' },
    { key: 'needVisit', label: 'Necessitam Visita', icon: 'MapPin' },
  ],

  filters: [
    { key: 'riskLevel', type: 'select', label: 'Nível de Risco', options: [
      { value: 'HIGH', label: 'Alto' },
      { value: 'CRITICAL', label: 'Crítico' },
    ]},
    { key: 'vulnerabilityType', type: 'select', label: 'Tipo de Vulnerabilidade', options: [
      { value: 'EXTREMA_POBREZA', label: 'Extrema Pobreza' },
      { value: 'VIOLENCIA_DOMESTICA', label: 'Violência Doméstica' },
      { value: 'SITUACAO_RUA', label: 'Situação de Rua' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/assistencia-social/familias-vulneraveis',
};

// 3. SOLICITAÇÃO DE BENEFÍCIOS
export const benefitRequestConfig: ModuleConfig = {
  key: 'benefit-request',
  departmentType: 'social-assistance',
  entityName: 'BenefitRequest',
  displayName: 'Solicitação de Benefícios',
  displayNameSingular: 'Solicitação de Benefício',

  fields: [
    { name: 'familyId', label: 'ID da Família', type: 'text', required: true },
    { name: 'benefitType', label: 'Tipo de Benefício', type: 'select', required: true, showInList: true, options: [
      { value: 'CESTA_BASICA', label: 'Cesta Básica' },
      { value: 'AUXILIO_ALUGUEL', label: 'Auxílio Aluguel' },
      { value: 'AUXILIO_FUNERAL', label: 'Auxílio Funeral' },
      { value: 'AUXILIO_NATALIDADE', label: 'Auxílio Natalidade' },
      { value: 'PASSAGEM', label: 'Passagem' },
      { value: 'MATERIAL_CONSTRUCAO', label: 'Material de Construção' },
      { value: 'CADEIRA_RODAS', label: 'Cadeira de Rodas' },
      { value: 'FRALDAS', label: 'Fraldas Geriátricas' },
      { value: 'OUTRO', label: 'Outro' },
    ]},
    { name: 'requestDate', label: 'Data da Solicitação', type: 'date', showInList: true },
    { name: 'status', label: 'Status', type: 'select', required: true, showInList: true, options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'UNDER_REVIEW', label: 'Em Análise' },
      { value: 'APPROVED', label: 'Aprovado' },
      { value: 'DENIED', label: 'Negado' },
      { value: 'DELIVERED', label: 'Entregue' },
    ]},
    { name: 'urgency', label: 'Urgência', type: 'select', showInList: true, options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'EMERGENCY', label: 'Emergencial' },
    ]},
    { name: 'reason', label: 'Justificativa', type: 'textarea', required: true },
    { name: 'approvedBy', label: 'Aprovado por', type: 'text' },
    { name: 'approvedDate', label: 'Data de Aprovação', type: 'date' },
    { name: 'deliveredDate', label: 'Data de Entrega', type: 'date' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Solicitações', icon: 'FileText' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'approved', label: 'Aprovadas', icon: 'CheckCircle' },
    { key: 'delivered', label: 'Entregues', icon: 'Package' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'APPROVED', label: 'Aprovado' },
      { value: 'DENIED', label: 'Negado' },
    ]},
    { key: 'benefitType', type: 'select', label: 'Tipo de Benefício', options: [
      { value: 'CESTA_BASICA', label: 'Cesta Básica' },
      { value: 'AUXILIO_ALUGUEL', label: 'Auxílio Aluguel' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/assistencia-social/solicitacoes-beneficios',
};

// 4. ENTREGAS EMERGENCIAIS
export const emergencyDeliveryConfig: ModuleConfig = {
  key: 'emergency-delivery',
  departmentType: 'social-assistance',
  entityName: 'EmergencyDelivery',
  displayName: 'Entregas Emergenciais',
  displayNameSingular: 'Entrega Emergenciai',

  fields: [
    { name: 'recipientName', label: 'Nome do Beneficiário', type: 'text', required: true, showInList: true },
    { name: 'deliveryType', label: 'Tipo de Entrega', type: 'select', required: true, showInList: true, options: [
      { value: 'CESTA_BASICA', label: 'Cesta Básica' },
      { value: 'COBERTOR', label: 'Cobertor' },
      { value: 'COLCHAO', label: 'Colchão' },
      { value: 'PASSAGEM', label: 'Passagem' },
      { value: 'FRALDAS', label: 'Fraldas' },
      { value: 'MEDICAMENTO', label: 'Medicamento' },
      { value: 'ALIMENTO_INFANTIL', label: 'Alimento Infantil' },
      { value: 'KIT_HIGIENE', label: 'Kit Higiene' },
    ]},
    { name: 'quantity', label: 'Quantidade', type: 'number', required: true, showInList: true },
    { name: 'deliveryDate', label: 'Data de Entrega', type: 'date', required: true, showInList: true },
    { name: 'deliveredBy', label: 'Entregue por', type: 'text', required: true },
    { name: 'recipientSignature', label: 'Assinatura do Recebedor', type: 'text' },
    { name: 'urgency', label: 'Urgência', type: 'select', options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'EMERGENCY', label: 'Emergencial' },
    ]},
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'IN_TRANSIT', label: 'Em Trânsito' },
      { value: 'DELIVERED', label: 'Entregue' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Entregas', icon: 'Package' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'delivered', label: 'Entregues', icon: 'CheckCircle' },
    { key: 'thisMonth', label: 'Este Mês', icon: 'Calendar' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'DELIVERED', label: 'Entregue' },
    ]},
    { key: 'deliveryType', type: 'select', label: 'Tipo', options: [
      { value: 'CESTA_BASICA', label: 'Cesta Básica' },
      { value: 'COBERTOR', label: 'Cobertor' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/assistencia-social/entregas-emergenciais',
};

// 5. INSCRIÇÕES EM GRUPOS E OFICINAS
export const socialGroupEnrollmentConfig: ModuleConfig = {
  key: 'social-group-enrollment',
  departmentType: 'social-assistance',
  entityName: 'SocialGroupEnrollment',
  displayName: 'Grupos e Oficinas Sociais',
  displayNameSingular: 'Grupo e Oficina Sociai',

  fields: [
    { name: 'participantName', label: 'Nome do Participante', type: 'text', required: true, showInList: true },
    { name: 'participantCpf', label: 'CPF', type: 'text', showInList: true },
    { name: 'groupName', label: 'Nome do Grupo', type: 'text', required: true, showInList: true },
    { name: 'groupType', label: 'Tipo de Grupo', type: 'select', required: true, showInList: true, options: [
      { value: 'ARTESANATO', label: 'Artesanato' },
      { value: 'COSTURA', label: 'Costura' },
      { value: 'INFORMATICA', label: 'Informática' },
      { value: 'ALFABETIZACAO', label: 'Alfabetização' },
      { value: 'IDOSOS', label: 'Grupo de Idosos' },
      { value: 'MULHERES', label: 'Grupo de Mulheres' },
      { value: 'JOVENS', label: 'Grupo de Jovens' },
      { value: 'GESTANTES', label: 'Gestantes' },
      { value: 'CONVIVENCIA', label: 'Convivência' },
    ]},
    { name: 'enrollmentDate', label: 'Data de Inscrição', type: 'date', showInList: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
      { value: 'WAITING_LIST', label: 'Lista de Espera' },
      { value: 'COMPLETED', label: 'Concluído' },
    ]},
    { name: 'frequency', label: 'Frequência', type: 'select', options: [
      { value: 'WEEKLY', label: 'Semanal' },
      { value: 'BIWEEKLY', label: 'Quinzenal' },
      { value: 'MONTHLY', label: 'Mensal' },
    ]},
    { name: 'instructor', label: 'Instrutor/Facilitador', type: 'text' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Inscrições', icon: 'Users' },
    { key: 'active', label: 'Ativos', icon: 'UserCheck' },
    { key: 'groups', label: 'Grupos Ativos', icon: 'Briefcase' },
    { key: 'waitingList', label: 'Lista de Espera', icon: 'Clock' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'WAITING_LIST', label: 'Lista de Espera' },
    ]},
    { key: 'groupType', type: 'select', label: 'Tipo de Grupo', options: [
      { value: 'ARTESANATO', label: 'Artesanato' },
      { value: 'IDOSOS', label: 'Grupo de Idosos' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/assistencia-social/inscricoes-grupos',
};

// 6. VISITAS DOMICILIARES
export const homeVisitConfig: ModuleConfig = {
  key: 'home-visit',
  departmentType: 'social-assistance',
  entityName: 'HomeVisit',
  displayName: 'Visitas Domiciliares',
  displayNameSingular: 'Visita Domiciliare',

  fields: [
    { name: 'familyId', label: 'ID da Família', type: 'text', required: true },
    { name: 'visitDate', label: 'Data da Visita', type: 'datetime', required: true, showInList: true },
    { name: 'socialWorker', label: 'Assistente Social', type: 'text', required: true, showInList: true },
    { name: 'visitType', label: 'Tipo de Visita', type: 'select', required: true, showInList: true, options: [
      { value: 'ROUTINE', label: 'Rotina' },
      { value: 'FOLLOW_UP', label: 'Acompanhamento' },
      { value: 'EMERGENCY', label: 'Emergência' },
      { value: 'EVALUATION', label: 'Avaliação' },
      { value: 'REINSERTION', label: 'Reinserção' },
    ]},
    { name: 'visitPurpose', label: 'Objetivo da Visita', type: 'textarea', required: true },
    { name: 'findings', label: 'Constatações', type: 'textarea' },
    { name: 'recommendations', label: 'Recomendações', type: 'textarea' },
    { name: 'nextVisitDate', label: 'Próxima Visita', type: 'date', showInList: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'SCHEDULED', label: 'Agendada' },
      { value: 'COMPLETED', label: 'Realizada' },
      { value: 'CANCELLED', label: 'Cancelada' },
      { value: 'RESCHEDULED', label: 'Reagendada' },
    ]},
  ],

  stats: [
    { key: 'total', label: 'Total de Visitas', icon: 'Home' },
    { key: 'scheduled', label: 'Agendadas', icon: 'Calendar' },
    { key: 'completed', label: 'Realizadas', icon: 'CheckCircle' },
    { key: 'thisWeek', label: 'Esta Semana', icon: 'TrendingUp' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'SCHEDULED', label: 'Agendada' },
      { value: 'COMPLETED', label: 'Realizada' },
    ]},
    { key: 'visitType', type: 'select', label: 'Tipo', options: [
      { value: 'ROUTINE', label: 'Rotina' },
      { value: 'EMERGENCY', label: 'Emergência' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/assistencia-social/visitas-domiciliares',
};

// 7. INSCRIÇÕES EM PROGRAMAS SOCIAIS
export const socialProgramEnrollmentConfig: ModuleConfig = {
  key: 'social-program-enrollment',
  departmentType: 'social-assistance',
  entityName: 'SocialProgramEnrollment',
  displayName: 'Programas Sociais',
  displayNameSingular: 'Programa Sociai',

  fields: [
    { name: 'beneficiaryName', label: 'Nome do Beneficiário', type: 'text', required: true, showInList: true },
    { name: 'beneficiaryCpf', label: 'CPF', type: 'text', showInList: true },
    { name: 'programName', label: 'Nome do Programa', type: 'text', required: true, showInList: true },
    { name: 'programType', label: 'Tipo de Programa', type: 'select', required: true, showInList: true, options: [
      { value: 'BOLSA_FAMILIA', label: 'Bolsa Família' },
      { value: 'BPC', label: 'BPC - Benefício de Prestação Continuada' },
      { value: 'PETI', label: 'PETI - Programa de Erradicação do Trabalho Infantil' },
      { value: 'HABITACAO', label: 'Programa Habitacional' },
      { value: 'QUALIFICACAO', label: 'Qualificação Profissional' },
      { value: 'EMPREENDEDORISMO', label: 'Empreendedorismo Social' },
      { value: 'PROTECAO_IDOSO', label: 'Proteção ao Idoso' },
      { value: 'PROTECAO_CRIANCA', label: 'Proteção à Criança' },
    ]},
    { name: 'enrollmentDate', label: 'Data de Inscrição', type: 'date', showInList: true },
    { name: 'status', label: 'Status', type: 'select', required: true, showInList: true, options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'APPROVED', label: 'Aprovado' },
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'SUSPENDED', label: 'Suspenso' },
      { value: 'CANCELLED', label: 'Cancelado' },
      { value: 'COMPLETED', label: 'Concluído' },
    ]},
    { name: 'monthlyIncome', label: 'Renda Mensal', type: 'number', showInList: true },
    { name: 'familySize', label: 'Membros da Família', type: 'number', showInList: true },
    { name: 'priority', label: 'Prioridade', type: 'select', options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'URGENT', label: 'Urgente' },
    ]},
    { name: 'approvedDate', label: 'Data de Aprovação', type: 'date' },
    { name: 'startDate', label: 'Data de Início', type: 'date' },
    { name: 'endDate', label: 'Data de Término', type: 'date' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Inscrições', icon: 'FileText' },
    { key: 'active', label: 'Ativos', icon: 'Activity' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'approved', label: 'Aprovados', icon: 'CheckCircle' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'APPROVED', label: 'Aprovado' },
    ]},
    { key: 'programType', type: 'select', label: 'Tipo de Programa', options: [
      { value: 'BOLSA_FAMILIA', label: 'Bolsa Família' },
      { value: 'BPC', label: 'BPC' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/assistencia-social/inscricoes-programas',
};

// 8. AGENDAMENTOS SOCIAIS
export const socialAppointmentConfig: ModuleConfig = {
  key: 'social-appointment',
  departmentType: 'social-assistance',
  entityName: 'SocialAppointment',
  displayName: 'Agendamentos Sociais',
  displayNameSingular: 'Agendamento Sociai',

  fields: [
    { name: 'citizenName', label: 'Nome do Cidadão', type: 'text', required: true, showInList: true },
    { name: 'citizenCpf', label: 'CPF', type: 'text', showInList: true },
    { name: 'appointmentType', label: 'Tipo de Agendamento', type: 'select', required: true, showInList: true, options: [
      { value: 'ENTREVISTA', label: 'Entrevista Social' },
      { value: 'CADASTRO', label: 'Cadastro/Atualização' },
      { value: 'ACOMPANHAMENTO', label: 'Acompanhamento' },
      { value: 'ORIENTACAO', label: 'Orientação' },
      { value: 'ENCAMINHAMENTO', label: 'Encaminhamento' },
      { value: 'AVALIACAO', label: 'Avaliação Socioeconômica' },
    ]},
    { name: 'appointmentDate', label: 'Data/Hora do Agendamento', type: 'datetime', required: true, showInList: true },
    { name: 'socialWorker', label: 'Assistente Social', type: 'text', showInList: true },
    { name: 'purpose', label: 'Objetivo', type: 'textarea', required: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'CONFIRMED', label: 'Confirmado' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
      { value: 'COMPLETED', label: 'Realizado' },
      { value: 'CANCELLED', label: 'Cancelado' },
      { value: 'NO_SHOW', label: 'Faltou' },
    ]},
    { name: 'notes', label: 'Anotações', type: 'textarea' },
    { name: 'result', label: 'Resultado', type: 'textarea' },
    { name: 'followUpNeeded', label: 'Necessita Acompanhamento', type: 'checkbox' },
    { name: 'followUpDate', label: 'Data de Retorno', type: 'date' },
  ],

  stats: [
    { key: 'total', label: 'Total de Agendamentos', icon: 'Calendar' },
    { key: 'scheduled', label: 'Agendados', icon: 'Clock' },
    { key: 'completed', label: 'Realizados', icon: 'CheckCircle' },
    { key: 'today', label: 'Hoje', icon: 'CalendarDays' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'COMPLETED', label: 'Realizado' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { key: 'appointmentType', type: 'select', label: 'Tipo', options: [
      { value: 'ENTREVISTA', label: 'Entrevista Social' },
      { value: 'ACOMPANHAMENTO', label: 'Acompanhamento' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/assistencia-social/agendamentos',
};

// 9. EQUIPAMENTOS SOCIAIS (CRAS/CREAS)
export const socialEquipmentConfig: ModuleConfig = {
  key: 'social-equipment',
  departmentType: 'social-assistance',
  entityName: 'SocialEquipment',
  displayName: 'Gestão de Equipamentos Sociais (CRAS/CREAS)',
  displayNameSingular: 'Gestão de Equipamentos Sociais (CRAS/CREAS)',

  fields: [
    { name: 'equipmentName', label: 'Nome do Equipamento', type: 'text', required: true, showInList: true },
    { name: 'equipmentType', label: 'Tipo de Equipamento', type: 'select', required: true, showInList: true, options: [
      { value: 'CRAS', label: 'CRAS - Centro de Referência de Assistência Social' },
      { value: 'CREAS', label: 'CREAS - Centro de Referência Especializado' },
      { value: 'CENTRO_POP', label: 'Centro Pop - População em Situação de Rua' },
      { value: 'ABRIGO', label: 'Abrigo Institucional' },
      { value: 'CASA_PASSAGEM', label: 'Casa de Passagem' },
      { value: 'CENTRO_CONVIVENCIA', label: 'Centro de Convivência' },
    ]},
    { name: 'address', label: 'Endereço', type: 'text', required: true, showInList: true },
    { name: 'capacity', label: 'Capacidade de Atendimento', type: 'number', showInList: true },
    { name: 'currentOccupancy', label: 'Ocupação Atual', type: 'number', showInList: true },
    { name: 'coordinator', label: 'Coordenador', type: 'text', showInList: true },
    { name: 'phone', label: 'Telefone', type: 'text', showInList: true },
    { name: 'email', label: 'E-mail', type: 'email' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
      { value: 'MAINTENANCE', label: 'Em Manutenção' },
      { value: 'CONSTRUCTION', label: 'Em Construção' },
    ]},
    { name: 'isActive', label: 'Ativo', type: 'checkbox' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Equipamentos', icon: 'Building' },
    { key: 'active', label: 'Ativos', icon: 'CheckCircle' },
    { key: 'totalCapacity', label: 'Capacidade Total', icon: 'Users' },
    { key: 'occupancy', label: 'Taxa de Ocupação', icon: 'TrendingUp' },
  ],

  filters: [
    { key: 'equipmentType', type: 'select', label: 'Tipo', options: [
      { value: 'CRAS', label: 'CRAS' },
      { value: 'CREAS', label: 'CREAS' },
      { value: 'CENTRO_POP', label: 'Centro Pop' },
    ]},
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/assistencia-social/equipamentos',
};

// Exportar todas as configurações
export const assistenciaSocialConfigs = {
  socialAssistanceAttendance: socialAssistanceAttendanceConfig,
  vulnerableFamily: vulnerableFamilyConfig,
  benefitRequest: benefitRequestConfig,
  emergencyDelivery: emergencyDeliveryConfig,
  socialGroupEnrollment: socialGroupEnrollmentConfig,
  homeVisit: homeVisitConfig,
  socialProgramEnrollment: socialProgramEnrollmentConfig,
  socialAppointment: socialAppointmentConfig,
  socialEquipment: socialEquipmentConfig,
};
