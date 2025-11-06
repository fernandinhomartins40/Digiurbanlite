import { ModuleConfig } from './types';

// ============================================================================
// CONFIGURAÇÕES DOS MÓDULOS DE CULTURA - 9 MÓDULOS COMPLETOS
// ============================================================================

// 1. ATENDIMENTOS CULTURAIS
export const culturalAttendanceConfig: ModuleConfig = {
  key: 'cultural-attendance',
  entityName: 'CulturalAttendance',
  departmentType: 'culture',
  displayName: 'Atendimentos Culturais',
  displayNameSingular: 'Atendimento Culturai',

  fields: [
    { name: 'citizenName', label: 'Nome do Cidadão', type: 'text', required: true, showInList: true },
    { name: 'citizenCpf', label: 'CPF', type: 'text', required: true, showInList: true },
    { name: 'contact', label: 'Contato (JSON)', type: 'text', required: true },
    { name: 'serviceType', label: 'Tipo de Serviço', type: 'select', required: true, showInList: true, options: [
      { value: 'INFORMACAO', label: 'Informação Cultural' },
      { value: 'INSCRICAO_OFICINA', label: 'Inscrição em Oficina' },
      { value: 'RESERVA_ESPACO', label: 'Reserva de Espaço' },
      { value: 'CADASTRO_ARTISTA', label: 'Cadastro de Artista' },
      { value: 'SUBMISSAO_PROJETO', label: 'Submissão de Projeto' },
      { value: 'SOLICITACAO_APOIO', label: 'Solicitação de Apoio' },
      { value: 'OUTRO', label: 'Outro' },
    ]},
    { name: 'subject', label: 'Assunto', type: 'text', required: true, showInList: true },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'culturalArea', label: 'Área Cultural', type: 'select', showInList: true, options: [
      { value: 'MUSICA', label: 'Música' },
      { value: 'DANCA', label: 'Dança' },
      { value: 'TEATRO', label: 'Teatro' },
      { value: 'ARTES_VISUAIS', label: 'Artes Visuais' },
      { value: 'LITERATURA', label: 'Literatura' },
      { value: 'CINEMA', label: 'Cinema e Audiovisual' },
      { value: 'ARTESANATO', label: 'Artesanato' },
      { value: 'CULTURA_POPULAR', label: 'Cultura Popular' },
      { value: 'PATRIMONIO', label: 'Patrimônio Cultural' },
    ]},
    { name: 'priority', label: 'Prioridade', type: 'select', showInList: true, options: [
      { value: 'LOW', label: 'Baixa' },
      { value: 'MEDIUM', label: 'Média' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'URGENT', label: 'Urgente' },
    ]},
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'IN_PROGRESS', label: 'Em Atendimento' },
      { value: 'AWAITING_DOCUMENTS', label: 'Aguardando Documentos' },
      { value: 'COMPLETED', label: 'Concluído' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'attendedBy', label: 'Atendido por', type: 'text' },
    { name: 'followUpNeeded', label: 'Necessita Acompanhamento', type: 'checkbox' },
    { name: 'followUpDate', label: 'Data de Retorno', type: 'date' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Atendimentos', icon: 'Users' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'completed', label: 'Concluídos', icon: 'CheckCircle' },
    { key: 'thisMonth', label: 'Este Mês', icon: 'Calendar' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'IN_PROGRESS', label: 'Em Atendimento' },
      { value: 'COMPLETED', label: 'Concluído' },
    ]},
    { key: 'culturalArea', type: 'select', label: 'Área Cultural', options: [
      { value: 'MUSICA', label: 'Música' },
      { value: 'DANCA', label: 'Dança' },
      { value: 'TEATRO', label: 'Teatro' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/cultura/atendimentos',
};

// 2. RESERVAS DE ESPAÇOS CULTURAIS
export const culturalSpaceReservationConfig: ModuleConfig = {
  key: 'cultural-space-reservation',
  departmentType: 'culture',
  entityName: 'CulturalSpaceReservation',
  displayName: 'Reservas de Espaços Culturais',
  displayNameSingular: 'Reserva de Espaço Culturai',

  fields: [
    { name: 'requesterName', label: 'Nome do Solicitante', type: 'text', required: true, showInList: true },
    { name: 'requesterCpf', label: 'CPF', type: 'text', required: true },
    { name: 'contact', label: 'Contato (JSON)', type: 'text', required: true },
    { name: 'spaceName', label: 'Espaço Cultural', type: 'text', required: true, showInList: true },
    { name: 'eventType', label: 'Tipo de Evento', type: 'select', required: true, showInList: true, options: [
      { value: 'SHOW', label: 'Show Musical' },
      { value: 'TEATRO', label: 'Peça de Teatro' },
      { value: 'EXPOSICAO', label: 'Exposição' },
      { value: 'OFICINA', label: 'Oficina' },
      { value: 'PALESTRA', label: 'Palestra/Conferência' },
      { value: 'CINEMA', label: 'Exibição de Filme' },
      { value: 'ENSAIO', label: 'Ensaio' },
      { value: 'OUTRO', label: 'Outro' },
    ]},
    { name: 'eventName', label: 'Nome do Evento', type: 'text', required: true, showInList: true },
    { name: 'startDate', label: 'Data/Hora de Início', type: 'datetime', required: true, showInList: true },
    { name: 'endDate', label: 'Data/Hora de Término', type: 'datetime', required: true, showInList: true },
    { name: 'expectedAttendance', label: 'Público Esperado', type: 'number', showInList: true },
    { name: 'isPublicEvent', label: 'Evento Aberto ao Público', type: 'checkbox' },
    { name: 'hasTicket', label: 'Evento Pago', type: 'checkbox' },
    { name: 'ticketPrice', label: 'Valor do Ingresso', type: 'number' },
    { name: 'needsTechnicalSupport', label: 'Necessita Apoio Técnico', type: 'checkbox' },
    { name: 'technicalRequirements', label: 'Requisitos Técnicos', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'APPROVED', label: 'Aprovada' },
      { value: 'REJECTED', label: 'Rejeitada' },
      { value: 'CONFIRMED', label: 'Confirmada' },
      { value: 'CANCELLED', label: 'Cancelada' },
      { value: 'COMPLETED', label: 'Realizada' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Reservas', icon: 'Calendar' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock' },
    { key: 'approved', label: 'Aprovadas', icon: 'CheckCircle' },
    { key: 'thisMonth', label: 'Este Mês', icon: 'TrendingUp' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'APPROVED', label: 'Aprovada' },
      { value: 'CONFIRMED', label: 'Confirmada' },
    ]},
    { key: 'eventType', type: 'select', label: 'Tipo de Evento', options: [
      { value: 'SHOW', label: 'Show Musical' },
      { value: 'TEATRO', label: 'Peça de Teatro' },
      { value: 'EXPOSICAO', label: 'Exposição' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/cultura/reservas-espacos',
};

// 3. INSCRIÇÕES EM OFICINAS CULTURAIS
export const culturalWorkshopEnrollmentConfig: ModuleConfig = {
  key: 'cultural-workshop-enrollment',
  departmentType: 'culture',
  entityName: 'CulturalWorkshopEnrollment',
  displayName: 'Inscrições em Oficinas Culturais',
  displayNameSingular: 'Inscriçõe em Oficina Culturai',

  fields: [
    { name: 'participantName', label: 'Nome do Participante', type: 'text', required: true, showInList: true },
    { name: 'participantCpf', label: 'CPF', type: 'text', required: true, showInList: true },
    { name: 'contact', label: 'Contato (JSON)', type: 'text', required: true },
    { name: 'birthDate', label: 'Data de Nascimento', type: 'date', required: true },
    { name: 'workshopName', label: 'Nome da Oficina', type: 'text', required: true, showInList: true },
    { name: 'workshopType', label: 'Tipo de Oficina', type: 'select', required: true, showInList: true, options: [
      { value: 'MUSICA', label: 'Música' },
      { value: 'DANCA', label: 'Dança' },
      { value: 'TEATRO', label: 'Teatro' },
      { value: 'ARTES_VISUAIS', label: 'Artes Visuais' },
      { value: 'ARTESANATO', label: 'Artesanato' },
      { value: 'FOTOGRAFIA', label: 'Fotografia' },
      { value: 'LITERATURA', label: 'Literatura/Escrita Criativa' },
      { value: 'AUDIOVISUAL', label: 'Audiovisual' },
      { value: 'CULTURA_DIGITAL', label: 'Cultura Digital' },
    ]},
    { name: 'ageGroup', label: 'Faixa Etária', type: 'select', showInList: true, options: [
      { value: 'INFANTIL', label: 'Infantil (6-12 anos)' },
      { value: 'ADOLESCENTE', label: 'Adolescente (13-17 anos)' },
      { value: 'JOVEM', label: 'Jovem (18-29 anos)' },
      { value: 'ADULTO', label: 'Adulto (30-59 anos)' },
      { value: 'IDOSO', label: 'Idoso (60+ anos)' },
      { value: 'LIVRE', label: 'Livre' },
    ]},
    { name: 'hasExperience', label: 'Possui Experiência', type: 'checkbox' },
    { name: 'experienceLevel', label: 'Nível de Experiência', type: 'select', options: [
      { value: 'INICIANTE', label: 'Iniciante' },
      { value: 'INTERMEDIARIO', label: 'Intermediário' },
      { value: 'AVANCADO', label: 'Avançado' },
    ]},
    { name: 'enrollmentDate', label: 'Data de Inscrição', type: 'date', showInList: true },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'APPROVED', label: 'Aprovado' },
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'WAITING_LIST', label: 'Lista de Espera' },
      { value: 'COMPLETED', label: 'Concluído' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Inscrições', icon: 'Users' },
    { key: 'active', label: 'Ativos', icon: 'UserCheck' },
    { key: 'waitingList', label: 'Lista de Espera', icon: 'Clock' },
    { key: 'completed', label: 'Concluídos', icon: 'GraduationCap' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'WAITING_LIST', label: 'Lista de Espera' },
      { value: 'COMPLETED', label: 'Concluído' },
    ]},
    { key: 'workshopType', type: 'select', label: 'Tipo de Oficina', options: [
      { value: 'MUSICA', label: 'Música' },
      { value: 'DANCA', label: 'Dança' },
      { value: 'TEATRO', label: 'Teatro' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/cultura/inscricoes-oficinas',
};

// 4. GRUPOS ARTÍSTICOS
export const artisticGroupConfig: ModuleConfig = {
  key: 'artistic-group',
  departmentType: 'culture',
  entityName: 'ArtisticGroup',
  displayName: 'Grupos Artísticos',
  displayNameSingular: 'Grupo Artístico',

  fields: [
    { name: 'groupName', label: 'Nome do Grupo', type: 'text', required: true, showInList: true },
    { name: 'leaderName', label: 'Nome do Líder/Responsável', type: 'text', required: true, showInList: true },
    { name: 'leaderCpf', label: 'CPF do Líder', type: 'text', required: true },
    { name: 'contact', label: 'Contato (JSON)', type: 'text', required: true },
    { name: 'groupType', label: 'Tipo de Grupo', type: 'select', required: true, showInList: true, options: [
      { value: 'MUSICA', label: 'Grupo Musical' },
      { value: 'DANCA', label: 'Grupo de Dança' },
      { value: 'TEATRO', label: 'Grupo de Teatro' },
      { value: 'CORAL', label: 'Coral' },
      { value: 'ORQUESTRA', label: 'Orquestra' },
      { value: 'BANDA', label: 'Banda' },
      { value: 'CAPOEIRA', label: 'Grupo de Capoeira' },
      { value: 'CULTURA_POPULAR', label: 'Grupo de Cultura Popular' },
      { value: 'ARTESANATO', label: 'Grupo de Artesanato' },
    ]},
    { name: 'artisticStyle', label: 'Estilo Artístico', type: 'text', showInList: true },
    { name: 'memberCount', label: 'Número de Membros', type: 'number', showInList: true },
    { name: 'foundationYear', label: 'Ano de Fundação', type: 'number' },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'rehearsalSpace', label: 'Local de Ensaio', type: 'text' },
    { name: 'hasLegalEntity', label: 'Possui CNPJ', type: 'checkbox' },
    { name: 'cnpj', label: 'CNPJ', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
      { value: 'PENDING', label: 'Cadastro Pendente' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Grupos', icon: 'Users' },
    { key: 'active', label: 'Ativos', icon: 'Activity' },
    { key: 'totalMembers', label: 'Total de Artistas', icon: 'User' },
    { key: 'events', label: 'Eventos Realizados', icon: 'Calendar' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
    ]},
    { key: 'groupType', type: 'select', label: 'Tipo de Grupo', options: [
      { value: 'MUSICA', label: 'Grupo Musical' },
      { value: 'DANCA', label: 'Grupo de Dança' },
      { value: 'TEATRO', label: 'Grupo de Teatro' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/cultura/grupos-artisticos',
};

// 5. PROJETOS CULTURAIS
export const culturalProjectConfig: ModuleConfig = {
  key: 'cultural-project',
  departmentType: 'culture',
  entityName: 'CulturalProject',
  displayName: 'Projetos Culturais',
  displayNameSingular: 'Projeto Culturai',

  fields: [
    { name: 'projectName', label: 'Nome do Projeto', type: 'text', required: true, showInList: true },
    { name: 'proponentName', label: 'Nome do Proponente', type: 'text', required: true, showInList: true },
    { name: 'proponentCpf', label: 'CPF/CNPJ', type: 'text', required: true },
    { name: 'contact', label: 'Contato (JSON)', type: 'text', required: true },
    { name: 'projectType', label: 'Tipo de Projeto', type: 'select', required: true, showInList: true, options: [
      { value: 'SHOW', label: 'Show/Apresentação' },
      { value: 'FESTIVAL', label: 'Festival' },
      { value: 'EXPOSICAO', label: 'Exposição' },
      { value: 'OFICINA', label: 'Oficina/Curso' },
      { value: 'CINEMA', label: 'Cinema/Audiovisual' },
      { value: 'LITERATURA', label: 'Literatura' },
      { value: 'PATRIMONIO', label: 'Patrimônio Cultural' },
      { value: 'FORMACAO', label: 'Formação Cultural' },
      { value: 'OUTRO', label: 'Outro' },
    ]},
    { name: 'culturalArea', label: 'Área Cultural', type: 'select', required: true, showInList: true, options: [
      { value: 'MUSICA', label: 'Música' },
      { value: 'DANCA', label: 'Dança' },
      { value: 'TEATRO', label: 'Teatro' },
      { value: 'ARTES_VISUAIS', label: 'Artes Visuais' },
      { value: 'LITERATURA', label: 'Literatura' },
      { value: 'CINEMA', label: 'Cinema e Audiovisual' },
      { value: 'ARTESANATO', label: 'Artesanato' },
      { value: 'CULTURA_POPULAR', label: 'Cultura Popular' },
    ]},
    { name: 'description', label: 'Descrição do Projeto', type: 'textarea', required: true },
    { name: 'objectives', label: 'Objetivos', type: 'textarea' },
    { name: 'targetAudience', label: 'Público-Alvo', type: 'text' },
    { name: 'expectedParticipants', label: 'Participantes Esperados', type: 'number', showInList: true },
    { name: 'startDate', label: 'Data de Início', type: 'date', showInList: true },
    { name: 'endDate', label: 'Data de Término', type: 'date', showInList: true },
    { name: 'budget', label: 'Orçamento (R$)', type: 'number', showInList: true },
    { name: 'fundingSource', label: 'Fonte de Financiamento', type: 'select', options: [
      { value: 'MUNICIPAL', label: 'Recursos Municipais' },
      { value: 'ESTADUAL', label: 'Recursos Estaduais' },
      { value: 'FEDERAL', label: 'Recursos Federais' },
      { value: 'LEI_INCENTIVO', label: 'Lei de Incentivo' },
      { value: 'PATROCINIO', label: 'Patrocínio Privado' },
      { value: 'PROPRIO', label: 'Recursos Próprios' },
      { value: 'MISTO', label: 'Misto' },
    ]},
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'DRAFT', label: 'Rascunho' },
      { value: 'PENDING', label: 'Pendente' },
      { value: 'UNDER_REVIEW', label: 'Em Análise' },
      { value: 'APPROVED', label: 'Aprovado' },
      { value: 'REJECTED', label: 'Rejeitado' },
      { value: 'IN_PROGRESS', label: 'Em Execução' },
      { value: 'COMPLETED', label: 'Concluído' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Projetos', icon: 'Briefcase' },
    { key: 'approved', label: 'Aprovados', icon: 'CheckCircle' },
    { key: 'inProgress', label: 'Em Execução', icon: 'Activity' },
    { key: 'totalBudget', label: 'Orçamento Total', icon: 'DollarSign' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'APPROVED', label: 'Aprovado' },
      { value: 'IN_PROGRESS', label: 'Em Execução' },
    ]},
    { key: 'culturalArea', type: 'select', label: 'Área Cultural', options: [
      { value: 'MUSICA', label: 'Música' },
      { value: 'DANCA', label: 'Dança' },
      { value: 'TEATRO', label: 'Teatro' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/cultura/projetos-culturais',
};

// 6. SUBMISSÕES DE PROJETOS CULTURAIS
export const culturalProjectSubmissionConfig: ModuleConfig = {
  key: 'cultural-project-submission',
  departmentType: 'culture',
  entityName: 'CulturalProjectSubmission',
  displayName: 'Submissões de Projetos Culturais',
  displayNameSingular: 'Submisõe de Projeto Culturai',

  fields: [
    { name: 'submitterName', label: 'Nome do Proponente', type: 'text', required: true, showInList: true },
    { name: 'submitterCpf', label: 'CPF/CNPJ', type: 'text', required: true, showInList: true },
    { name: 'contact', label: 'Contato (JSON)', type: 'text', required: true },
    { name: 'projectTitle', label: 'Título do Projeto', type: 'text', required: true, showInList: true },
    { name: 'callName', label: 'Edital/Chamada Pública', type: 'text', required: true, showInList: true },
    { name: 'culturalArea', label: 'Área Cultural', type: 'select', required: true, showInList: true, options: [
      { value: 'MUSICA', label: 'Música' },
      { value: 'DANCA', label: 'Dança' },
      { value: 'TEATRO', label: 'Teatro' },
      { value: 'ARTES_VISUAIS', label: 'Artes Visuais' },
      { value: 'LITERATURA', label: 'Literatura' },
      { value: 'CINEMA', label: 'Cinema e Audiovisual' },
      { value: 'ARTESANATO', label: 'Artesanato' },
      { value: 'CULTURA_POPULAR', label: 'Cultura Popular' },
      { value: 'PATRIMONIO', label: 'Patrimônio Cultural' },
    ]},
    { name: 'submissionDate', label: 'Data de Submissão', type: 'date', showInList: true },
    { name: 'requestedAmount', label: 'Valor Solicitado (R$)', type: 'number', showInList: true },
    { name: 'projectSummary', label: 'Resumo do Projeto', type: 'textarea', required: true },
    { name: 'projectDuration', label: 'Duração (meses)', type: 'number' },
    { name: 'hasAttachments', label: 'Possui Anexos', type: 'checkbox' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'SUBMITTED', label: 'Submetido' },
      { value: 'UNDER_REVIEW', label: 'Em Análise' },
      { value: 'PENDING_DOCUMENTS', label: 'Documentação Pendente' },
      { value: 'APPROVED', label: 'Aprovado' },
      { value: 'REJECTED', label: 'Rejeitado' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'evaluationScore', label: 'Pontuação', type: 'number' },
    { name: 'evaluatorComments', label: 'Parecer da Comissão', type: 'textarea' },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Submissões', icon: 'FileText' },
    { key: 'underReview', label: 'Em Análise', icon: 'Search' },
    { key: 'approved', label: 'Aprovados', icon: 'CheckCircle' },
    { key: 'totalRequested', label: 'Valor Total Solicitado', icon: 'DollarSign' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'SUBMITTED', label: 'Submetido' },
      { value: 'UNDER_REVIEW', label: 'Em Análise' },
      { value: 'APPROVED', label: 'Aprovado' },
    ]},
    { key: 'culturalArea', type: 'select', label: 'Área Cultural', options: [
      { value: 'MUSICA', label: 'Música' },
      { value: 'DANCA', label: 'Dança' },
      { value: 'TEATRO', label: 'Teatro' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/cultura/submissoes-projetos',
};

// 7. EVENTOS CULTURAIS
export const culturalEventConfig: ModuleConfig = {
  key: 'cultural-event',
  departmentType: 'culture',
  entityName: 'CulturalEvent',
  displayName: 'Eventos Culturais',
  displayNameSingular: 'Evento Culturai',

  fields: [
    { name: 'eventName', label: 'Nome do Evento', type: 'text', required: true, showInList: true },
    { name: 'organizerName', label: 'Nome do Organizador', type: 'text', required: true, showInList: true },
    { name: 'organizerCpf', label: 'CPF/CNPJ', type: 'text', required: true },
    { name: 'contact', label: 'Contato (JSON)', type: 'text', required: true },
    { name: 'eventType', label: 'Tipo de Evento', type: 'select', required: true, showInList: true, options: [
      { value: 'SHOW', label: 'Show' },
      { value: 'TEATRO', label: 'Teatro' },
      { value: 'DANCA', label: 'Dança' },
      { value: 'EXPOSICAO', label: 'Exposição' },
      { value: 'FESTIVAL', label: 'Festival' },
      { value: 'FEIRA', label: 'Feira' },
      { value: 'CINEMA', label: 'Cinema' },
      { value: 'LITERATURA', label: 'Literatura' },
      { value: 'PALESTRA', label: 'Palestra/Conferência' },
      { value: 'OUTRO', label: 'Outro' },
    ]},
    { name: 'culturalArea', label: 'Área Cultural', type: 'select', required: true, showInList: true, options: [
      { value: 'MUSICA', label: 'Música' },
      { value: 'DANCA', label: 'Dança' },
      { value: 'TEATRO', label: 'Teatro' },
      { value: 'ARTES_VISUAIS', label: 'Artes Visuais' },
      { value: 'LITERATURA', label: 'Literatura' },
      { value: 'CINEMA', label: 'Cinema e Audiovisual' },
      { value: 'CULTURA_POPULAR', label: 'Cultura Popular' },
    ]},
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'venue', label: 'Local do Evento', type: 'text', required: true, showInList: true },
    { name: 'startDate', label: 'Data/Hora de Início', type: 'datetime', required: true, showInList: true },
    { name: 'endDate', label: 'Data/Hora de Término', type: 'datetime', required: true, showInList: true },
    { name: 'expectedAttendance', label: 'Público Esperado', type: 'number', showInList: true },
    { name: 'actualAttendance', label: 'Público Real', type: 'number' },
    { name: 'isPublic', label: 'Evento Aberto ao Público', type: 'checkbox' },
    { name: 'isFree', label: 'Entrada Gratuita', type: 'checkbox' },
    { name: 'ticketPrice', label: 'Valor do Ingresso', type: 'number' },
    { name: 'hasAccessibility', label: 'Possui Acessibilidade', type: 'checkbox' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PLANNED', label: 'Planejado' },
      { value: 'CONFIRMED', label: 'Confirmado' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
      { value: 'COMPLETED', label: 'Realizado' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Eventos', icon: 'Calendar' },
    { key: 'upcoming', label: 'Próximos Eventos', icon: 'Clock' },
    { key: 'thisMonth', label: 'Este Mês', icon: 'TrendingUp' },
    { key: 'totalAttendance', label: 'Público Total', icon: 'Users' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PLANNED', label: 'Planejado' },
      { value: 'CONFIRMED', label: 'Confirmado' },
      { value: 'COMPLETED', label: 'Realizado' },
    ]},
    { key: 'eventType', type: 'select', label: 'Tipo de Evento', options: [
      { value: 'SHOW', label: 'Show' },
      { value: 'TEATRO', label: 'Teatro' },
      { value: 'FESTIVAL', label: 'Festival' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/cultura/eventos-culturais',
};

// 8. MANIFESTAÇÕES CULTURAIS
export const culturalManifestationConfig: ModuleConfig = {
  key: 'cultural-manifestation',
  departmentType: 'culture',
  entityName: 'CulturalManifestation',
  displayName: 'Manifestações Culturais',
  displayNameSingular: 'Manifestaçõe Culturai',

  fields: [
    { name: 'manifestationName', label: 'Nome da Manifestação', type: 'text', required: true, showInList: true },
    { name: 'responsibleName', label: 'Nome do Responsável', type: 'text', required: true, showInList: true },
    { name: 'responsibleCpf', label: 'CPF', type: 'text', required: true },
    { name: 'contact', label: 'Contato (JSON)', type: 'text', required: true },
    { name: 'manifestationType', label: 'Tipo de Manifestação', type: 'select', required: true, showInList: true, options: [
      { value: 'FOLCLORE', label: 'Folclore' },
      { value: 'FESTA_POPULAR', label: 'Festa Popular' },
      { value: 'RELIGIOSO', label: 'Manifestação Religiosa' },
      { value: 'ARTESANATO', label: 'Artesanato Tradicional' },
      { value: 'GASTRONOMIA', label: 'Gastronomia Típica' },
      { value: 'MUSICA_TRADICIONAL', label: 'Música Tradicional' },
      { value: 'DANCA_TRADICIONAL', label: 'Dança Tradicional' },
      { value: 'CAPOEIRA', label: 'Capoeira' },
      { value: 'OUTRO', label: 'Outro' },
    ]},
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'origin', label: 'Origem/Tradição', type: 'text', showInList: true },
    { name: 'region', label: 'Região/Bairro', type: 'text', showInList: true },
    { name: 'foundationYear', label: 'Ano de Fundação/Início', type: 'number' },
    { name: 'participantsCount', label: 'Número de Participantes', type: 'number', showInList: true },
    { name: 'frequency', label: 'Periodicidade', type: 'select', options: [
      { value: 'ANUAL', label: 'Anual' },
      { value: 'SEMESTRAL', label: 'Semestral' },
      { value: 'MENSAL', label: 'Mensal' },
      { value: 'SEMANAL', label: 'Semanal' },
      { value: 'ESPORADICO', label: 'Esporádico' },
    ]},
    { name: 'isRegistered', label: 'Registrado como Patrimônio', type: 'checkbox' },
    { name: 'registrationLevel', label: 'Nível de Registro', type: 'select', options: [
      { value: 'MUNICIPAL', label: 'Municipal' },
      { value: 'ESTADUAL', label: 'Estadual' },
      { value: 'FEDERAL', label: 'Federal' },
      { value: 'UNESCO', label: 'UNESCO' },
    ]},
    { name: 'needsSupport', label: 'Necessita Apoio', type: 'checkbox' },
    { name: 'supportType', label: 'Tipo de Apoio Necessário', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'ACTIVE', label: 'Ativa' },
      { value: 'INACTIVE', label: 'Inativa' },
      { value: 'ENDANGERED', label: 'Em Risco' },
      { value: 'UNDER_STUDY', label: 'Em Estudo' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Manifestações', icon: 'Flag' },
    { key: 'active', label: 'Ativas', icon: 'Activity' },
    { key: 'registered', label: 'Registradas', icon: 'Shield' },
    { key: 'endangered', label: 'Em Risco', icon: 'AlertTriangle' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativa' },
      { value: 'ENDANGERED', label: 'Em Risco' },
    ]},
    { key: 'manifestationType', type: 'select', label: 'Tipo', options: [
      { value: 'FOLCLORE', label: 'Folclore' },
      { value: 'FESTA_POPULAR', label: 'Festa Popular' },
      { value: 'ARTESANATO', label: 'Artesanato Tradicional' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/cultura/manifestacoes-culturais',
};

// 9. ESPAÇOS CULTURAIS (INFORMATIVO)
export const culturalSpaceConfig: ModuleConfig = {
  key: 'cultural-space',
  departmentType: 'culture',
  entityName: 'CulturalSpace',
  displayName: 'Espaços Culturais',
  displayNameSingular: 'Espaço Culturai',

  fields: [
    { name: 'spaceName', label: 'Nome do Espaço', type: 'text', required: true, showInList: true },
    { name: 'spaceType', label: 'Tipo de Espaço', type: 'select', required: true, showInList: true, options: [
      { value: 'TEATRO', label: 'Teatro' },
      { value: 'CENTRO_CULTURAL', label: 'Centro Cultural' },
      { value: 'BIBLIOTECA', label: 'Biblioteca' },
      { value: 'MUSEU', label: 'Museu' },
      { value: 'GALERIA', label: 'Galeria de Arte' },
      { value: 'CINEMA', label: 'Cinema' },
      { value: 'ARENA', label: 'Arena/Anfiteatro' },
      { value: 'CASA_CULTURA', label: 'Casa de Cultura' },
      { value: 'OUTRO', label: 'Outro' },
    ]},
    { name: 'address', label: 'Endereço', type: 'text', required: true, showInList: true },
    { name: 'capacity', label: 'Capacidade', type: 'number', showInList: true },
    { name: 'hasAccessibility', label: 'Possui Acessibilidade', type: 'checkbox' },
    { name: 'hasAirConditioning', label: 'Possui Ar Condicionado', type: 'checkbox' },
    { name: 'hasParking', label: 'Possui Estacionamento', type: 'checkbox' },
    { name: 'hasSoundSystem', label: 'Possui Sistema de Som', type: 'checkbox' },
    { name: 'hasLightingSystem', label: 'Possui Sistema de Iluminação', type: 'checkbox' },
    { name: 'phone', label: 'Telefone', type: 'text', showInList: true },
    { name: 'email', label: 'E-mail', type: 'email' },
    { name: 'manager', label: 'Responsável/Gestor', type: 'text', showInList: true },
    { name: 'openingHours', label: 'Horário de Funcionamento', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
      { value: 'MAINTENANCE', label: 'Em Manutenção' },
      { value: 'CONSTRUCTION', label: 'Em Construção' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Espaços', icon: 'Building' },
    { key: 'active', label: 'Ativos', icon: 'CheckCircle' },
    { key: 'totalCapacity', label: 'Capacidade Total', icon: 'Users' },
    { key: 'eventsThisMonth', label: 'Eventos Este Mês', icon: 'Calendar' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
    ]},
    { key: 'spaceType', type: 'select', label: 'Tipo', options: [
      { value: 'TEATRO', label: 'Teatro' },
      { value: 'CENTRO_CULTURAL', label: 'Centro Cultural' },
      { value: 'BIBLIOTECA', label: 'Biblioteca' },
    ]},
  ],

  apiEndpoint: '/api/admin/secretarias/cultura/espacos-culturais',
};

// Exportar todas as configurações
export const culturaConfigs = {
  culturalAttendance: culturalAttendanceConfig,
  culturalSpaceReservation: culturalSpaceReservationConfig,
  culturalWorkshopEnrollment: culturalWorkshopEnrollmentConfig,
  artisticGroup: artisticGroupConfig,
  culturalProject: culturalProjectConfig,
  culturalProjectSubmission: culturalProjectSubmissionConfig,
  culturalEvent: culturalEventConfig,
  culturalManifestation: culturalManifestationConfig,
  culturalSpace: culturalSpaceConfig,
};
