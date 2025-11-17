import { ModuleConfig } from './types';

// ============================================================================
// CONFIGURAÇÕES DOS MÓDULOS DE SEGURANÇA PÚBLICA - 10 MÓDULOS COMPLETOS
// ============================================================================

// 1. ATENDIMENTOS DE SEGURANÇA
export const securityAttendanceConfig: ModuleConfig = {
  key: 'security-attendance',
  entityName: 'SecurityAttendance',
  departmentType: 'public-security',
  displayName: 'Atendimentos de Segurança',
  displayNameSingular: 'Atendimentos de Segurança',

  fields: [
    { name: 'citizenName', label: 'Nome do Cidadão', type: 'text', required: true, showInList: true },
    { name: 'citizenCpf', label: 'CPF', type: 'text' },
    { name: 'contact', label: 'Contato', type: 'text', required: true, showInList: true },
    { name: 'serviceType', label: 'Tipo de Serviço', type: 'select', required: true, showInList: true, options: [
      { value: 'OCCURRENCE_REPORT', label: 'Registro de Ocorrência' },
      { value: 'PATROL_REQUEST', label: 'Solicitação de Ronda' },
      { value: 'CAMERA_REQUEST', label: 'Solicitação de Câmeras' },
      { value: 'ANONYMOUS_TIP', label: 'Denúncia Anônima' },
      { value: 'INFORMATION', label: 'Informação' },
      { value: 'COMPLAINT', label: 'Reclamação' },
      { value: 'OTHERS', label: 'Outros' },
    ]},
    { name: 'subject', label: 'Assunto', type: 'text', required: true, showInList: true },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'urgency', label: 'Urgência', type: 'select', showInList: true, options: [
      { value: 'LOW', label: 'Baixa' },
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'URGENT', label: 'Urgente' },
    ]},
    { name: 'location', label: 'Local', type: 'text', showInList: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'UNDER_ANALYSIS', label: 'Em Análise' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
      { value: 'RESOLVED', label: 'Resolvido' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
  ],

  stats: [
    { key: 'total', label: 'Total de Atendimentos', icon: 'Shield' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'urgent', label: 'Urgentes', icon: 'AlertTriangle' },
    { key: 'thisMonth', label: 'Este Mês', icon: 'Calendar' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
      { value: 'RESOLVED', label: 'Resolvido' },
    ]},
    { key: 'urgency', type: 'select', label: 'Urgência', options: [
      { value: 'URGENT', label: 'Urgente' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'NORMAL', label: 'Normal' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/seguranca/attendances',
};

// 2. OCORRÊNCIAS DE SEGURANÇA
export const securityOccurrenceConfig: ModuleConfig = {
  key: 'security-occurrence',
  departmentType: 'public-security',
  entityName: 'SecurityOccurrence',
  displayName: 'Ocorrências de Segurança',
  displayNameSingular: 'Ocorrências de Segurança',

  fields: [
    { name: 'occurrenceType', label: 'Tipo de Ocorrência', type: 'select', required: true, showInList: true, options: [
      { value: 'THEFT', label: 'Furto' },
      { value: 'ROBBERY', label: 'Roubo' },
      { value: 'ASSAULT', label: 'Agressão' },
      { value: 'VANDALISM', label: 'Vandalismo' },
      { value: 'DRUG_TRAFFICKING', label: 'Tráfico de Drogas' },
      { value: 'DISTURBANCE', label: 'Perturbação da Ordem' },
      { value: 'TRAFFIC_ACCIDENT', label: 'Acidente de Trânsito' },
      { value: 'SUSPICIOUS_ACTIVITY', label: 'Atividade Suspeita' },
      { value: 'OTHERS', label: 'Outros' },
    ]},
    { name: 'severity', label: 'Gravidade', type: 'select', required: true, showInList: true, options: [
      { value: 'LOW', label: 'Baixa' },
      { value: 'MEDIUM', label: 'Média' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'CRITICAL', label: 'Crítica' },
    ]},
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'location', label: 'Local da Ocorrência', type: 'text', required: true, showInList: true },
    { name: 'reporterName', label: 'Nome do Denunciante', type: 'text', showInList: true },
    { name: 'reporterPhone', label: 'Telefone', type: 'text' },
    { name: 'reporterCpf', label: 'CPF', type: 'text' },
    { name: 'officerName', label: 'Guarda Responsável', type: 'text', showInList: true },
    { name: 'occurrenceDate', label: 'Data da Ocorrência', type: 'datetime', showInList: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'OPEN', label: 'Aberta' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
      { value: 'UNDER_INVESTIGATION', label: 'Em Investigação' },
      { value: 'RESOLVED', label: 'Resolvida' },
      { value: 'CLOSED', label: 'Fechada' },
    ]},
  ],

  stats: [
    { key: 'total', label: 'Total de Ocorrências', icon: 'AlertCircle' },
    { key: 'open', label: 'Abertas', icon: 'FileText' },
    { key: 'critical', label: 'Críticas', icon: 'AlertTriangle' },
    { key: 'thisWeek', label: 'Esta Semana', icon: 'Calendar' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'OPEN', label: 'Aberta' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
      { value: 'RESOLVED', label: 'Resolvida' },
    ]},
    { key: 'severity', type: 'select', label: 'Gravidade', options: [
      { value: 'CRITICAL', label: 'Crítica' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'MEDIUM', label: 'Média' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/seguranca/occurrences',
};

// 3. SOLICITAÇÕES DE RONDA
export const patrolRequestConfig: ModuleConfig = {
  key: 'patrol-request',
  departmentType: 'public-security',
  entityName: 'PatrolRequest',
  displayName: 'Solicitações de Ronda',
  displayNameSingular: 'Solicitações de Ronda',

  fields: [
    { name: 'type', label: 'Tipo de Solicitação', type: 'select', required: true, showInList: true, options: [
      { value: 'preventive', label: 'Preventiva' },
      { value: 'monitoring', label: 'Monitoramento' },
      { value: 'event', label: 'Evento' },
      { value: 'complaint', label: 'Denúncia' },
    ]},
    { name: 'reason', label: 'Motivo', type: 'text', required: true, showInList: true },
    { name: 'location', label: 'Local', type: 'text', required: true, showInList: true },
    { name: 'area', label: 'Bairro/Região', type: 'text' },
    { name: 'requestedDate', label: 'Data Solicitada', type: 'date' },
    { name: 'requestedTime', label: 'Horário Solicitado', type: 'text' },
    { name: 'frequency', label: 'Frequência', type: 'select', options: [
      { value: 'once', label: 'Uma vez' },
      { value: 'daily', label: 'Diária' },
      { value: 'weekly', label: 'Semanal' },
      { value: 'monthly', label: 'Mensal' },
    ]},
    { name: 'duration', label: 'Duração Estimada', type: 'text' },
    { name: 'requesterName', label: 'Nome do Solicitante', type: 'text', required: true, showInList: true },
    { name: 'requesterPhone', label: 'Telefone', type: 'text', required: true },
    { name: 'requesterEmail', label: 'E-mail', type: 'email' },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'pending', label: 'Pendente' },
      { value: 'approved', label: 'Aprovada' },
      { value: 'scheduled', label: 'Agendada' },
      { value: 'in_progress', label: 'Em Andamento' },
      { value: 'completed', label: 'Concluída' },
      { value: 'cancelled', label: 'Cancelada' },
    ]},
    { name: 'priority', label: 'Prioridade', type: 'select', showInList: true, options: [
      { value: 'low', label: 'Baixa' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'Alta' },
      { value: 'urgent', label: 'Urgente' },
    ]},
  ],

  stats: [
    { key: 'total', label: 'Total de Solicitações', icon: 'MapPin' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'active', label: 'Ativas', icon: 'Activity' },
    { key: 'thisWeek', label: 'Esta Semana', icon: 'Calendar' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'pending', label: 'Pendente' },
      { value: 'scheduled', label: 'Agendada' },
      { value: 'completed', label: 'Concluída' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/seguranca/patrol-requests',
};

// 4. SOLICITAÇÕES DE CÂMERAS
export const cameraRequestConfig: ModuleConfig = {
  key: 'camera-request',
  departmentType: 'public-security',
  entityName: 'CameraRequest',
  displayName: 'Solicitações de Câmeras',
  displayNameSingular: 'Solicitaçõe de Câmera',

  fields: [
    { name: 'type', label: 'Tipo de Solicitação', type: 'select', required: true, showInList: true, options: [
      { value: 'installation', label: 'Instalação' },
      { value: 'footage', label: 'Acesso a Imagens' },
      { value: 'maintenance', label: 'Manutenção' },
    ]},
    { name: 'purpose', label: 'Finalidade', type: 'text', required: true, showInList: true },
    { name: 'location', label: 'Local', type: 'text', required: true, showInList: true },
    { name: 'area', label: 'Bairro/Região', type: 'text' },
    { name: 'address', label: 'Endereço Completo', type: 'text' },
    { name: 'cameraType', label: 'Tipo de Câmera', type: 'select', options: [
      { value: 'fixed', label: 'Fixa' },
      { value: 'ptz', label: 'PTZ (Pan-Tilt-Zoom)' },
      { value: 'dome', label: 'Dome' },
      { value: 'speed', label: 'Speed Dome' },
    ]},
    { name: 'quantity', label: 'Quantidade', type: 'number' },
    { name: 'justification', label: 'Justificativa', type: 'textarea', required: true },
    { name: 'incidentDate', label: 'Data do Incidente', type: 'date' },
    { name: 'incidentTime', label: 'Horário', type: 'text' },
    { name: 'requesterName', label: 'Nome do Solicitante', type: 'text', required: true, showInList: true },
    { name: 'requesterPhone', label: 'Telefone', type: 'text', required: true },
    { name: 'requesterEmail', label: 'E-mail', type: 'email' },
    { name: 'requesterDocument', label: 'CPF/CNPJ', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'pending', label: 'Pendente' },
      { value: 'under_review', label: 'Em Análise' },
      { value: 'approved', label: 'Aprovada' },
      { value: 'in_progress', label: 'Em Andamento' },
      { value: 'completed', label: 'Concluída' },
      { value: 'rejected', label: 'Rejeitada' },
    ]},
    { name: 'priority', label: 'Prioridade', type: 'select', showInList: true, options: [
      { value: 'low', label: 'Baixa' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'Alta' },
    ]},
  ],

  stats: [
    { key: 'total', label: 'Total de Solicitações', icon: 'Camera' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'approved', label: 'Aprovadas', icon: 'CheckCircle' },
    { key: 'thisMonth', label: 'Este Mês', icon: 'Calendar' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'pending', label: 'Pendente' },
      { value: 'approved', label: 'Aprovada' },
      { value: 'completed', label: 'Concluída' },
    ]},
    { key: 'type', type: 'select', label: 'Tipo', options: [
      { value: 'installation', label: 'Instalação' },
      { value: 'footage', label: 'Acesso a Imagens' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/seguranca/camera-requests',
};

// 5. DENÚNCIAS ANÔNIMAS
export const anonymousTipConfig: ModuleConfig = {
  key: 'anonymous-tip',
  departmentType: 'public-security',
  entityName: 'AnonymousTip',
  displayName: 'Denúncias Anônimas',
  displayNameSingular: 'Denúncia Anônima',

  fields: [
    { name: 'type', label: 'Tipo de Denúncia', type: 'select', required: true, showInList: true, options: [
      { value: 'drug_trafficking', label: 'Tráfico de Drogas' },
      { value: 'theft', label: 'Furto/Roubo' },
      { value: 'violence', label: 'Violência' },
      { value: 'vandalism', label: 'Vandalismo' },
      { value: 'corruption', label: 'Corrupção' },
      { value: 'environmental', label: 'Ambiental' },
      { value: 'other', label: 'Outro' },
    ]},
    { name: 'category', label: 'Categoria', type: 'text' },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'location', label: 'Local', type: 'text', showInList: true },
    { name: 'timeframe', label: 'Quando Ocorre', type: 'text' },
    { name: 'frequency', label: 'Frequência', type: 'select', options: [
      { value: 'once', label: 'Uma vez' },
      { value: 'occasional', label: 'Ocasional' },
      { value: 'frequent', label: 'Frequente' },
      { value: 'daily', label: 'Diária' },
    ]},
    { name: 'hasEvidence', label: 'Possui Evidências?', type: 'checkbox' },
    { name: 'evidenceNotes', label: 'Notas sobre Evidências', type: 'textarea' },
    { name: 'isUrgent', label: 'É Urgente?', type: 'checkbox' },
    { name: 'dangerLevel', label: 'Nível de Perigo', type: 'select', options: [
      { value: 'low', label: 'Baixo' },
      { value: 'medium', label: 'Médio' },
      { value: 'high', label: 'Alto' },
      { value: 'critical', label: 'Crítico' },
    ]},
    { name: 'tipNumber', label: 'Número da Denúncia', type: 'text', showInList: true },
    { name: 'feedbackCode', label: 'Código de Retorno', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'received', label: 'Recebida' },
      { value: 'under_investigation', label: 'Em Investigação' },
      { value: 'verified', label: 'Verificada' },
      { value: 'forwarded', label: 'Encaminhada' },
      { value: 'closed', label: 'Fechada' },
    ]},
  ],

  stats: [
    { key: 'total', label: 'Total de Denúncias', icon: 'Flag' },
    { key: 'received', label: 'Recebidas', icon: 'Inbox' },
    { key: 'investigating', label: 'Em Investigação', icon: 'Search' },
    { key: 'thisMonth', label: 'Este Mês', icon: 'Calendar' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'received', label: 'Recebida' },
      { value: 'under_investigation', label: 'Em Investigação' },
      { value: 'verified', label: 'Verificada' },
    ]},
    { key: 'type', type: 'select', label: 'Tipo', options: [
      { value: 'drug_trafficking', label: 'Tráfico de Drogas' },
      { value: 'theft', label: 'Furto/Roubo' },
      { value: 'violence', label: 'Violência' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/seguranca/anonymous-tips',
};

// 6. PONTOS CRÍTICOS
export const criticalPointConfig: ModuleConfig = {
  key: 'critical-point',
  departmentType: 'public-security',
  entityName: 'CriticalPoint',
  displayName: 'Pontos Críticos',
  displayNameSingular: 'Ponto Crítico',

  fields: [
    { name: 'name', label: 'Nome do Ponto', type: 'text', required: true, showInList: true },
    { name: 'location', label: 'Localização', type: 'text', required: true, showInList: true },
    { name: 'address', label: 'Endereço', type: 'text' },
    { name: 'pointType', label: 'Tipo de Ponto', type: 'select', required: true, showInList: true, options: [
      { value: 'crime_hotspot', label: 'Foco de Criminalidade' },
      { value: 'accident_prone', label: 'Propenso a Acidentes' },
      { value: 'drug_point', label: 'Ponto de Drogas' },
      { value: 'vandalism', label: 'Vandalismo Frequente' },
      { value: 'vulnerable_area', label: 'Área Vulnerável' },
      { value: 'others', label: 'Outros' },
    ]},
    { name: 'riskLevel', label: 'Nível de Risco', type: 'select', required: true, showInList: true, options: [
      { value: 'LOW', label: 'Baixo' },
      { value: 'MEDIUM', label: 'Médio' },
      { value: 'HIGH', label: 'Alto' },
      { value: 'CRITICAL', label: 'Crítico' },
    ]},
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'recommendations', label: 'Recomendações', type: 'textarea' },
    { name: 'patrolFrequency', label: 'Frequência de Ronda', type: 'select', options: [
      { value: 'hourly', label: 'A cada hora' },
      { value: 'daily', label: 'Diária' },
      { value: 'weekly', label: 'Semanal' },
      { value: 'monthly', label: 'Mensal' },
    ]},
    { name: 'monitoringLevel', label: 'Nível de Monitoramento', type: 'select', options: [
      { value: 'LOW', label: 'Baixo' },
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'Alto' },
      { value: 'INTENSIVE', label: 'Intensivo' },
    ]},
    { name: 'incidentCount', label: 'Número de Incidentes', type: 'number', showInList: true },
    { name: 'lastIncidentDate', label: 'Último Incidente', type: 'date' },
    { name: 'isActive', label: 'Ativo', type: 'checkbox', showInList: true },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Pontos', icon: 'MapPin' },
    { key: 'critical', label: 'Críticos', icon: 'AlertTriangle' },
    { key: 'highRisk', label: 'Alto Risco', icon: 'AlertCircle' },
    { key: 'active', label: 'Ativos', icon: 'Activity' },
  ],

  filters: [
    { key: 'riskLevel', type: 'select', label: 'Nível de Risco', options: [
      { value: 'CRITICAL', label: 'Crítico' },
      { value: 'HIGH', label: 'Alto' },
      { value: 'MEDIUM', label: 'Médio' },
    ]},
    { key: 'isActive', type: 'select', label: 'Status', options: [
      { value: 'true', label: 'Ativo' },
      { value: 'false', label: 'Inativo' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/seguranca/critical-points',
};

// 7. ALERTAS DE SEGURANÇA
export const securityAlertConfig: ModuleConfig = {
  key: 'security-alert',
  departmentType: 'public-security',
  entityName: 'SecurityAlert',
  displayName: 'Alertas de Segurança',
  displayNameSingular: 'Alertas de Segurança',

  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true, showInList: true },
    { name: 'alertType', label: 'Tipo de Alerta', type: 'select', required: true, showInList: true, options: [
      { value: 'emergency', label: 'Emergência' },
      { value: 'warning', label: 'Aviso' },
      { value: 'information', label: 'Informação' },
      { value: 'weather', label: 'Clima' },
      { value: 'event', label: 'Evento' },
      { value: 'restriction', label: 'Restrição' },
    ]},
    { name: 'message', label: 'Mensagem', type: 'textarea', required: true },
    { name: 'description', label: 'Descrição Detalhada', type: 'textarea' },
    { name: 'location', label: 'Local', type: 'text' },
    { name: 'targetArea', label: 'Área Alvo', type: 'text', showInList: true },
    { name: 'severity', label: 'Gravidade', type: 'select', required: true, showInList: true, options: [
      { value: 'INFO', label: 'Informativa' },
      { value: 'LOW', label: 'Baixa' },
      { value: 'MEDIUM', label: 'Média' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'CRITICAL', label: 'Crítica' },
    ]},
    { name: 'priority', label: 'Prioridade', type: 'select', options: [
      { value: 'LOW', label: 'Baixa' },
      { value: 'MEDIUM', label: 'Média' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'URGENT', label: 'Urgente' },
    ]},
    { name: 'startDate', label: 'Data de Início', type: 'datetime', required: true, showInList: true },
    { name: 'endDate', label: 'Data de Término', type: 'datetime' },
    { name: 'validUntil', label: 'Válido Até', type: 'datetime' },
    { name: 'targetAudience', label: 'Público Alvo', type: 'text' },
    { name: 'isActive', label: 'Ativo', type: 'checkbox', showInList: true },
    { name: 'createdBy', label: 'Criado Por', type: 'text' },
  ],

  stats: [
    { key: 'total', label: 'Total de Alertas', icon: 'Bell' },
    { key: 'active', label: 'Ativos', icon: 'Activity' },
    { key: 'critical', label: 'Críticos', icon: 'AlertTriangle' },
    { key: 'thisWeek', label: 'Esta Semana', icon: 'Calendar' },
  ],

  filters: [
    { key: 'alertType', type: 'select', label: 'Tipo', options: [
      { value: 'emergency', label: 'Emergência' },
      { value: 'warning', label: 'Aviso' },
      { value: 'information', label: 'Informação' },
    ]},
    { key: 'severity', type: 'select', label: 'Gravidade', options: [
      { value: 'CRITICAL', label: 'Crítica' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'MEDIUM', label: 'Média' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/seguranca/alerts',
};

// 8. PATRULHAS
export const securityPatrolConfig: ModuleConfig = {
  key: 'security-patrol',
  departmentType: 'public-security',
  entityName: 'SecurityPatrol',
  displayName: 'Patrulhas',
  displayNameSingular: 'Patrulha',

  fields: [
    { name: 'patrolType', label: 'Tipo de Patrulha', type: 'select', required: true, showInList: true, options: [
      { value: 'routine', label: 'Rotina' },
      { value: 'preventive', label: 'Preventiva' },
      { value: 'tactical', label: 'Tática' },
      { value: 'event', label: 'Evento' },
      { value: 'emergency', label: 'Emergência' },
    ]},
    { name: 'route', label: 'Rota', type: 'text', required: true, showInList: true },
    { name: 'startTime', label: 'Horário de Início', type: 'datetime', required: true, showInList: true },
    { name: 'endTime', label: 'Horário de Término', type: 'datetime' },
    { name: 'guardName', label: 'Nome do Guarda', type: 'text' },
    { name: 'officerName', label: 'Nome do Oficial', type: 'text', required: true, showInList: true },
    { name: 'officerBadge', label: 'Matrícula', type: 'text' },
    { name: 'vehicle', label: 'Viatura', type: 'text', showInList: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'SCHEDULED', label: 'Agendada' },
      { value: 'ACTIVE', label: 'Ativa' },
      { value: 'PAUSED', label: 'Pausada' },
      { value: 'COMPLETED', label: 'Concluída' },
      { value: 'CANCELLED', label: 'Cancelada' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Patrulhas', icon: 'Navigation' },
    { key: 'active', label: 'Ativas', icon: 'Activity' },
    { key: 'completed', label: 'Concluídas', icon: 'CheckCircle' },
    { key: 'today', label: 'Hoje', icon: 'Calendar' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativa' },
      { value: 'SCHEDULED', label: 'Agendada' },
      { value: 'COMPLETED', label: 'Concluída' },
    ]},
    { key: 'patrolType', type: 'select', label: 'Tipo', options: [
      { value: 'routine', label: 'Rotina' },
      { value: 'preventive', label: 'Preventiva' },
      { value: 'tactical', label: 'Tática' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/seguranca/patrols',
};

// 9. GUARDA MUNICIPAL
export const municipalGuardConfig: ModuleConfig = {
  key: 'municipal-guard',
  departmentType: 'public-security',
  entityName: 'MunicipalGuard',
  displayName: 'Guarda Municipal',
  displayNameSingular: 'Guarda Municipal',

  fields: [
    { name: 'name', label: 'Nome Completo', type: 'text', required: true, showInList: true },
    { name: 'badge', label: 'Matrícula', type: 'text', required: true, showInList: true },
    { name: 'cpf', label: 'CPF', type: 'text' },
    { name: 'rg', label: 'RG', type: 'text' },
    { name: 'birthDate', label: 'Data de Nascimento', type: 'date' },
    { name: 'phone', label: 'Telefone', type: 'text', required: true, showInList: true },
    { name: 'email', label: 'E-mail', type: 'email' },
    { name: 'address', label: 'Endereço', type: 'text' },
    { name: 'position', label: 'Cargo', type: 'select', required: true, showInList: true, options: [
      { value: 'guard', label: 'Guarda' },
      { value: 'sergeant', label: 'Sargento' },
      { value: 'lieutenant', label: 'Tenente' },
      { value: 'captain', label: 'Capitão' },
      { value: 'commander', label: 'Comandante' },
    ]},
    { name: 'admissionDate', label: 'Data de Admissão', type: 'date', showInList: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'active', label: 'Ativo' },
      { value: 'on_leave', label: 'De Licença' },
      { value: 'suspended', label: 'Suspenso' },
      { value: 'retired', label: 'Aposentado' },
    ]},
    { name: 'shift', label: 'Turno', type: 'select', options: [
      { value: 'morning', label: 'Manhã' },
      { value: 'afternoon', label: 'Tarde' },
      { value: 'night', label: 'Noite' },
      { value: 'rotating', label: 'Rodízio' },
    ]},
    { name: 'assignedVehicle', label: 'Viatura Designada', type: 'text' },
    { name: 'assignedRadio', label: 'Rádio Designado', type: 'text' },
    { name: 'availability', label: 'Disponibilidade', type: 'select', options: [
      { value: 'available', label: 'Disponível' },
      { value: 'on_duty', label: 'Em Serviço' },
      { value: 'off_duty', label: 'Fora de Serviço' },
      { value: 'unavailable', label: 'Indisponível' },
    ]},
    { name: 'isActive', label: 'Ativo no Sistema', type: 'checkbox', showInList: true },
  ],

  stats: [
    { key: 'total', label: 'Total de Guardas', icon: 'Users' },
    { key: 'active', label: 'Ativos', icon: 'UserCheck' },
    { key: 'onDuty', label: 'Em Serviço', icon: 'Activity' },
    { key: 'available', label: 'Disponíveis', icon: 'Clock' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'active', label: 'Ativo' },
      { value: 'on_leave', label: 'De Licença' },
      { value: 'suspended', label: 'Suspenso' },
    ]},
    { key: 'position', type: 'select', label: 'Cargo', options: [
      { value: 'guard', label: 'Guarda' },
      { value: 'sergeant', label: 'Sargento' },
      { value: 'lieutenant', label: 'Tenente' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/seguranca/guards',
};

// 10. SISTEMA DE VIGILÂNCIA
export const surveillanceSystemConfig: ModuleConfig = {
  key: 'surveillance-system',
  departmentType: 'public-security',
  entityName: 'SurveillanceSystem',
  displayName: 'Sistema de Vigilância',
  displayNameSingular: 'Sistema de Vigilância',

  fields: [
    { name: 'systemName', label: 'Nome do Sistema', type: 'text', required: true, showInList: true },
    { name: 'systemCode', label: 'Código do Sistema', type: 'text', showInList: true },
    { name: 'type', label: 'Tipo', type: 'select', required: true, showInList: true, options: [
      { value: 'camera', label: 'Câmera' },
      { value: 'alarm', label: 'Alarme' },
      { value: 'sensor', label: 'Sensor' },
      { value: 'integrated', label: 'Sistema Integrado' },
    ]},
    { name: 'location', label: 'Localização', type: 'text', required: true, showInList: true },
    { name: 'address', label: 'Endereço', type: 'text' },
    { name: 'area', label: 'Bairro/Região', type: 'text' },
    { name: 'zone', label: 'Zona de Cobertura', type: 'text' },
    { name: 'manufacturer', label: 'Fabricante', type: 'text' },
    { name: 'model', label: 'Modelo', type: 'text', showInList: true },
    { name: 'installationDate', label: 'Data de Instalação', type: 'date', showInList: true },
    { name: 'warrantyExpires', label: 'Vencimento da Garantia', type: 'date' },
    { name: 'cameraType', label: 'Tipo de Câmera', type: 'select', options: [
      { value: 'fixed', label: 'Fixa' },
      { value: 'ptz', label: 'PTZ' },
      { value: 'dome', label: 'Dome' },
      { value: 'speed', label: 'Speed Dome' },
    ]},
    { name: 'resolution', label: 'Resolução', type: 'select', options: [
      { value: '720p', label: '720p (HD)' },
      { value: '1080p', label: '1080p (Full HD)' },
      { value: '4K', label: '4K (Ultra HD)' },
    ]},
    { name: 'hasNightVision', label: 'Visão Noturna', type: 'checkbox' },
    { name: 'hasAudio', label: 'Possui Áudio', type: 'checkbox' },
    { name: 'recordingDays', label: 'Dias de Gravação', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'operational', label: 'Operacional' },
      { value: 'maintenance', label: 'Manutenção' },
      { value: 'offline', label: 'Offline' },
      { value: 'defective', label: 'Defeituoso' },
    ]},
    { name: 'coverageArea', label: 'Área de Cobertura', type: 'text' },
    { name: 'ipAddress', label: 'Endereço IP', type: 'text' },
    { name: 'connectionType', label: 'Tipo de Conexão', type: 'select', options: [
      { value: 'wired', label: 'Com Fio' },
      { value: 'wireless', label: 'Sem Fio' },
      { value: 'fiber', label: 'Fibra Óptica' },
    ]},
    { name: 'isMonitored', label: 'Monitorado', type: 'checkbox', showInList: true },
    { name: 'monitoringCenter', label: 'Central de Monitoramento', type: 'text' },
    { name: 'apiAccess', label: 'Acesso via API', type: 'checkbox' },
    { name: 'isActive', label: 'Ativo', type: 'checkbox', showInList: true },
  ],

  stats: [
    { key: 'total', label: 'Total de Sistemas', icon: 'Video' },
    { key: 'operational', label: 'Operacionais', icon: 'CheckCircle' },
    { key: 'offline', label: 'Offline', icon: 'XCircle' },
    { key: 'monitored', label: 'Monitorados', icon: 'Eye' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'operational', label: 'Operacional' },
      { value: 'maintenance', label: 'Manutenção' },
      { value: 'offline', label: 'Offline' },
    ]},
    { key: 'type', type: 'select', label: 'Tipo', options: [
      { value: 'camera', label: 'Câmera' },
      { value: 'alarm', label: 'Alarme' },
      { value: 'sensor', label: 'Sensor' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/seguranca/surveillance-systems',
};

// ============================================================================
// EXPORTAÇÃO CONSOLIDADA
// ============================================================================

export const segurancaPublicaConfigs = {
  securityAttendance: securityAttendanceConfig,
  securityOccurrence: securityOccurrenceConfig,
  patrolRequest: patrolRequestConfig,
  cameraRequest: cameraRequestConfig,
  anonymousTip: anonymousTipConfig,
  criticalPoint: criticalPointConfig,
  securityAlert: securityAlertConfig,
  securityPatrol: securityPatrolConfig,
  municipalGuard: municipalGuardConfig,
  surveillanceSystem: surveillanceSystemConfig,
};
