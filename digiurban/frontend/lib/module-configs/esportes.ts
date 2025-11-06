import { ModuleConfig } from './types';

// ============================================================================
// CONFIGURAÇÕES DOS MÓDULOS DE ESPORTES - 9 MÓDULOS COMPLETOS
// ============================================================================

// 1. ATENDIMENTOS ESPORTIVOS
export const sportsAttendanceConfig: ModuleConfig = {
  key: 'sports-attendance',
  entityName: 'SportsAttendance',
  departmentType: 'sports',
  displayName: 'Atendimentos Esportivos',
  displayNameSingular: 'Atendimento Esportivo',

  fields: [
    { name: 'citizenName', label: 'Nome do Cidadão', type: 'text', required: true, showInList: true },
    { name: 'contact', label: 'Contato', type: 'text', required: true },
    { name: 'type', label: 'Tipo de Atendimento', type: 'select', required: true, showInList: true, options: [
      { value: 'GENERAL', label: 'Atendimento Geral' },
      { value: 'EVENT_REGISTRATION', label: 'Inscrição em Evento' },
      { value: 'FACILITIES_REQUEST', label: 'Solicitação de Espaço' },
      { value: 'INFORMATION', label: 'Informação' },
      { value: 'COMPLAINT', label: 'Reclamação' },
      { value: 'OTHERS', label: 'Outros' },
    ]},
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'sport', label: 'Modalidade Esportiva', type: 'text', showInList: true },
    { name: 'eventDate', label: 'Data do Evento', type: 'date' },
    { name: 'location', label: 'Local', type: 'text' },
    { name: 'expectedParticipants', label: 'Participantes Esperados', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'UNDER_ANALYSIS', label: 'Em Análise' },
      { value: 'APPROVED', label: 'Aprovado' },
      { value: 'REJECTED', label: 'Rejeitado' },
      { value: 'COMPLETED', label: 'Concluído' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'priority', label: 'Prioridade', type: 'select', showInList: true, options: [
      { value: 'LOW', label: 'Baixa' },
      { value: 'MEDIUM', label: 'Média' },
      { value: 'HIGH', label: 'Alta' },
    ]},
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
      { value: 'APPROVED', label: 'Aprovado' },
      { value: 'COMPLETED', label: 'Concluído' },
    ]},
  ],

  apiEndpoint: '/api/secretarias/esportes/sports-attendances',
};

// 2. ESCOLINHAS ESPORTIVAS
export const sportsSchoolConfig: ModuleConfig = {
  key: 'sports-school',
  departmentType: 'sports',
  entityName: 'SportsSchool',
  displayName: 'Escolinhas Esportivas',
  displayNameSingular: 'Escolinha Esportiva',

  fields: [
    { name: 'name', label: 'Nome da Escolinha', type: 'text', required: true, showInList: true },
    { name: 'sport', label: 'Modalidade', type: 'select', required: true, showInList: true, options: [
      { value: 'FUTEBOL', label: 'Futebol' },
      { value: 'FUTSAL', label: 'Futsal' },
      { value: 'VOLEI', label: 'Vôlei' },
      { value: 'BASQUETE', label: 'Basquete' },
      { value: 'HANDEBOL', label: 'Handebol' },
      { value: 'NATACAO', label: 'Natação' },
      { value: 'JUDO', label: 'Judô' },
      { value: 'KARATE', label: 'Karatê' },
      { value: 'TAEKWONDO', label: 'Taekwondo' },
      { value: 'CAPOEIRA', label: 'Capoeira' },
      { value: 'ATLETISMO', label: 'Atletismo' },
      { value: 'GINASTICA', label: 'Ginástica' },
      { value: 'TENIS', label: 'Tênis' },
      { value: 'TENIS_MESA', label: 'Tênis de Mesa' },
      { value: 'XADREZ', label: 'Xadrez' },
      { value: 'OUTROS', label: 'Outros' },
    ]},
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'instructor', label: 'Nome do Instrutor', type: 'text', required: true, showInList: true },
    { name: 'instructorCpf', label: 'CPF do Instrutor', type: 'text' },
    { name: 'targetAge', label: 'Faixa Etária', type: 'select', required: true, showInList: true, options: [
      { value: 'INFANTIL', label: 'Infantil (6-12 anos)' },
      { value: 'JUVENIL', label: 'Juvenil (13-17 anos)' },
      { value: 'ADULTO', label: 'Adulto (18+ anos)' },
      { value: 'LIVRE', label: 'Livre' },
    ]},
    { name: 'maxStudents', label: 'Vagas Disponíveis', type: 'number', required: true, showInList: true },
    { name: 'currentStudents', label: 'Alunos Matriculados', type: 'number', showInList: true },
    { name: 'location', label: 'Local das Aulas', type: 'text', required: true },
    { name: 'monthlyFee', label: 'Mensalidade (R$)', type: 'number' },
    { name: 'startDate', label: 'Data de Início', type: 'date', required: true, showInList: true },
    { name: 'endDate', label: 'Data de Término', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'ACTIVE', label: 'Ativa' },
      { value: 'INACTIVE', label: 'Inativa' },
      { value: 'FULL', label: 'Vagas Esgotadas' },
      { value: 'PENDING', label: 'Aguardando Início' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Escolinhas', icon: 'School' },
    { key: 'active', label: 'Ativas', icon: 'Activity' },
    { key: 'totalStudents', label: 'Total de Alunos', icon: 'Users' },
    { key: 'availableSlots', label: 'Vagas Disponíveis', icon: 'UserPlus' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativa' },
      { value: 'INACTIVE', label: 'Inativa' },
    ]},
    { key: 'sport', type: 'select', label: 'Modalidade', options: [
      { value: 'FUTEBOL', label: 'Futebol' },
      { value: 'VOLEI', label: 'Vôlei' },
      { value: 'BASQUETE', label: 'Basquete' },
    ]},
  ],

  apiEndpoint: '/api/secretarias/esportes/sports-schools',
};

// 3. CADASTRO DE ATLETAS
export const athleteConfig: ModuleConfig = {
  key: 'athlete',
  departmentType: 'sports',
  entityName: 'Athlete',
  displayName: 'Cadastro de Atletas',
  displayNameSingular: 'Cadastro de Atleta',

  fields: [
    { name: 'name', label: 'Nome Completo', type: 'text', required: true, showInList: true },
    { name: 'birthDate', label: 'Data de Nascimento', type: 'date', required: true, showInList: true },
    { name: 'cpf', label: 'CPF', type: 'text', showInList: true },
    { name: 'rg', label: 'RG', type: 'text' },
    { name: 'email', label: 'E-mail', type: 'email' },
    { name: 'phone', label: 'Telefone', type: 'text', required: true },
    { name: 'address', label: 'Endereço', type: 'text' },
    { name: 'sport', label: 'Modalidade Principal', type: 'select', required: true, showInList: true, options: [
      { value: 'FUTEBOL', label: 'Futebol' },
      { value: 'FUTSAL', label: 'Futsal' },
      { value: 'VOLEI', label: 'Vôlei' },
      { value: 'BASQUETE', label: 'Basquete' },
      { value: 'HANDEBOL', label: 'Handebol' },
      { value: 'NATACAO', label: 'Natação' },
      { value: 'ATLETISMO', label: 'Atletismo' },
      { value: 'JUDO', label: 'Judô' },
      { value: 'KARATE', label: 'Karatê' },
      { value: 'OUTROS', label: 'Outros' },
    ]},
    { name: 'category', label: 'Categoria', type: 'select', required: true, showInList: true, options: [
      { value: 'SUB_11', label: 'Sub-11' },
      { value: 'SUB_13', label: 'Sub-13' },
      { value: 'SUB_15', label: 'Sub-15' },
      { value: 'SUB_17', label: 'Sub-17' },
      { value: 'SUB_20', label: 'Sub-20' },
      { value: 'ADULTO', label: 'Adulto' },
      { value: 'MASTER', label: 'Master' },
    ]},
    { name: 'team', label: 'Equipe', type: 'text', showInList: true },
    { name: 'position', label: 'Posição', type: 'text' },
    { name: 'federationNumber', label: 'Número da Federação', type: 'text' },
    { name: 'federationExpiry', label: 'Validade da Federação', type: 'date' },
    { name: 'isActive', label: 'Ativo', type: 'checkbox', showInList: true },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Atletas', icon: 'Users' },
    { key: 'active', label: 'Ativos', icon: 'UserCheck' },
    { key: 'federated', label: 'Federados', icon: 'Award' },
    { key: 'byCategory', label: 'Por Categoria', icon: 'BarChart' },
  ],

  filters: [
    { key: 'sport', type: 'select', label: 'Modalidade', options: [
      { value: 'FUTEBOL', label: 'Futebol' },
      { value: 'VOLEI', label: 'Vôlei' },
      { value: 'BASQUETE', label: 'Basquete' },
    ]},
    { key: 'category', type: 'select', label: 'Categoria', options: [
      { value: 'SUB_15', label: 'Sub-15' },
      { value: 'SUB_17', label: 'Sub-17' },
      { value: 'ADULTO', label: 'Adulto' },
    ]},
  ],

  apiEndpoint: '/api/secretarias/esportes/athletes',
};

// 4. RESERVA DE ESPAÇOS ESPORTIVOS
export const sportsInfrastructureReservationConfig: ModuleConfig = {
  key: 'sports-infrastructure-reservation',
  departmentType: 'sports',
  entityName: 'SportsInfrastructureReservation',
  displayName: 'Reserva de Espaços Esportivos',
  displayNameSingular: 'Reserva de Espaço Esportivo',

  fields: [
    { name: 'requesterName', label: 'Nome do Solicitante', type: 'text', required: true, showInList: true },
    { name: 'contact', label: 'Contato', type: 'text', required: true },
    { name: 'infrastructureName', label: 'Espaço Esportivo', type: 'text', required: true, showInList: true },
    { name: 'reservationType', label: 'Tipo de Reserva', type: 'select', required: true, showInList: true, options: [
      { value: 'TREINO', label: 'Treino' },
      { value: 'JOGO', label: 'Jogo/Partida' },
      { value: 'TORNEIO', label: 'Torneio' },
      { value: 'EVENTO', label: 'Evento Esportivo' },
      { value: 'AULA', label: 'Aula' },
      { value: 'OUTROS', label: 'Outros' },
    ]},
    { name: 'sport', label: 'Modalidade', type: 'text', required: true, showInList: true },
    { name: 'reservationDate', label: 'Data da Reserva', type: 'date', required: true, showInList: true },
    { name: 'startTime', label: 'Horário de Início', type: 'time', required: true },
    { name: 'endTime', label: 'Horário de Término', type: 'time', required: true },
    { name: 'expectedParticipants', label: 'Participantes Esperados', type: 'number' },
    { name: 'purpose', label: 'Finalidade', type: 'textarea', required: true },
    { name: 'needsEquipment', label: 'Necessita Equipamentos', type: 'checkbox' },
    { name: 'equipmentList', label: 'Lista de Equipamentos', type: 'textarea' },
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
    { key: 'today', label: 'Hoje', icon: 'TrendingUp' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'APPROVED', label: 'Aprovada' },
      { value: 'CONFIRMED', label: 'Confirmada' },
    ]},
  ],

  apiEndpoint: '/api/secretarias/esportes/reservations',
};

// 5. COMPETIÇÕES
export const competitionConfig: ModuleConfig = {
  key: 'competition',
  departmentType: 'sports',
  entityName: 'Competition',
  displayName: 'Competições',
  displayNameSingular: 'Competiçõe',

  fields: [
    { name: 'name', label: 'Nome da Competição', type: 'text', required: true, showInList: true },
    { name: 'sport', label: 'Modalidade', type: 'text', required: true, showInList: true },
    { name: 'competitionType', label: 'Tipo de Competição', type: 'select', required: true, showInList: true, options: [
      { value: 'CAMPEONATO', label: 'Campeonato' },
      { value: 'TORNEIO', label: 'Torneio' },
      { value: 'COPA', label: 'Copa' },
      { value: 'FESTIVAL', label: 'Festival Esportivo' },
      { value: 'INTERCLASSE', label: 'Interclasse' },
      { value: 'CIRCUITO', label: 'Circuito' },
      { value: 'OUTROS', label: 'Outros' },
    ]},
    { name: 'category', label: 'Categoria', type: 'text', required: true, showInList: true },
    { name: 'ageGroup', label: 'Faixa Etária', type: 'text', required: true },
    { name: 'startDate', label: 'Data de Início', type: 'date', required: true, showInList: true },
    { name: 'endDate', label: 'Data de Término', type: 'date', required: true, showInList: true },
    { name: 'maxTeams', label: 'Número Máximo de Equipes', type: 'number', showInList: true },
    { name: 'registeredTeams', label: 'Equipes Inscritas', type: 'number', showInList: true },
    { name: 'registrationFee', label: 'Taxa de Inscrição (R$)', type: 'number' },
    { name: 'venue', label: 'Local', type: 'text', showInList: true },
    { name: 'organizer', label: 'Organizador', type: 'text', required: true },
    { name: 'rules', label: 'Regulamento', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PLANNED', label: 'Planejada' },
      { value: 'OPEN_REGISTRATION', label: 'Inscrições Abertas' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
      { value: 'COMPLETED', label: 'Concluída' },
      { value: 'CANCELLED', label: 'Cancelada' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Competições', icon: 'Trophy' },
    { key: 'upcoming', label: 'Próximas', icon: 'Calendar' },
    { key: 'inProgress', label: 'Em Andamento', icon: 'Activity' },
    { key: 'totalTeams', label: 'Total de Equipes', icon: 'Users' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PLANNED', label: 'Planejada' },
      { value: 'OPEN_REGISTRATION', label: 'Inscrições Abertas' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
    ]},
    { key: 'sport', type: 'select', label: 'Modalidade', options: [
      { value: 'FUTEBOL', label: 'Futebol' },
      { value: 'VOLEI', label: 'Vôlei' },
      { value: 'BASQUETE', label: 'Basquete' },
    ]},
  ],

  apiEndpoint: '/api/secretarias/esportes/competitions',
};

// 6. EQUIPES ESPORTIVAS
export const sportsTeamConfig: ModuleConfig = {
  key: 'sports-team',
  departmentType: 'sports',
  entityName: 'SportsTeam',
  displayName: 'Equipes Esportivas',
  displayNameSingular: 'Equipe Esportiva',

  fields: [
    { name: 'name', label: 'Nome da Equipe', type: 'text', required: true, showInList: true },
    { name: 'sport', label: 'Modalidade', type: 'text', required: true, showInList: true },
    { name: 'category', label: 'Categoria', type: 'text', required: true, showInList: true },
    { name: 'ageGroup', label: 'Faixa Etária', type: 'text', required: true },
    { name: 'gender', label: 'Gênero', type: 'select', options: [
      { value: 'MASCULINO', label: 'Masculino' },
      { value: 'FEMININO', label: 'Feminino' },
      { value: 'MISTO', label: 'Misto' },
    ]},
    { name: 'coach', label: 'Nome do Treinador', type: 'text', required: true, showInList: true },
    { name: 'coachCpf', label: 'CPF do Treinador', type: 'text' },
    { name: 'coachPhone', label: 'Telefone do Treinador', type: 'text' },
    { name: 'maxPlayers', label: 'Número Máximo de Jogadores', type: 'number', showInList: true },
    { name: 'currentPlayers', label: 'Jogadores Atuais', type: 'number', showInList: true },
    { name: 'homeVenue', label: 'Local de Treinos', type: 'text' },
    { name: 'foundationDate', label: 'Data de Fundação', type: 'date' },
    { name: 'description', label: 'Descrição', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'ACTIVE', label: 'Ativa' },
      { value: 'INACTIVE', label: 'Inativa' },
      { value: 'SUSPENDED', label: 'Suspensa' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Equipes', icon: 'Users' },
    { key: 'active', label: 'Ativas', icon: 'Activity' },
    { key: 'totalPlayers', label: 'Total de Jogadores', icon: 'User' },
    { key: 'bySport', label: 'Por Modalidade', icon: 'BarChart' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Ativa' },
      { value: 'INACTIVE', label: 'Inativa' },
    ]},
    { key: 'sport', type: 'select', label: 'Modalidade', options: [
      { value: 'FUTEBOL', label: 'Futebol' },
      { value: 'VOLEI', label: 'Vôlei' },
      { value: 'BASQUETE', label: 'Basquete' },
    ]},
  ],

  apiEndpoint: '/api/secretarias/esportes/sports-teams',
};

// 7. TORNEIOS (similar a competições, mas com estrutura de chaveamento)
export const tournamentConfig: ModuleConfig = {
  key: 'tournament',
  departmentType: 'sports',
  entityName: 'Tournament',
  displayName: 'Torneios',
  displayNameSingular: 'Torneio',

  fields: [
    { name: 'name', label: 'Nome do Torneio', type: 'text', required: true, showInList: true },
    { name: 'sport', label: 'Modalidade', type: 'text', required: true, showInList: true },
    { name: 'format', label: 'Formato', type: 'select', required: true, showInList: true, options: [
      { value: 'MATA_MATA', label: 'Mata-Mata' },
      { value: 'PONTOS_CORRIDOS', label: 'Pontos Corridos' },
      { value: 'GRUPOS', label: 'Fase de Grupos + Eliminatórias' },
      { value: 'ROUND_ROBIN', label: 'Round Robin (Todos contra Todos)' },
      { value: 'OUTROS', label: 'Outros' },
    ]},
    { name: 'startDate', label: 'Data de Início', type: 'date', required: true, showInList: true },
    { name: 'endDate', label: 'Data de Término', type: 'date', required: true, showInList: true },
    { name: 'maxTeams', label: 'Número de Equipes', type: 'number', required: true, showInList: true },
    { name: 'registeredTeams', label: 'Equipes Inscritas', type: 'number', showInList: true },
    { name: 'venue', label: 'Local', type: 'text', showInList: true },
    { name: 'organizer', label: 'Organizador', type: 'text', required: true },
    { name: 'registrationDeadline', label: 'Prazo de Inscrição', type: 'date', showInList: true },
    { name: 'registrationFee', label: 'Taxa de Inscrição (R$)', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'PLANNED', label: 'Planejado' },
      { value: 'OPEN_REGISTRATION', label: 'Inscrições Abertas' },
      { value: 'DRAW_PENDING', label: 'Aguardando Sorteio' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
      { value: 'COMPLETED', label: 'Concluído' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ]},
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Torneios', icon: 'Award' },
    { key: 'upcoming', label: 'Próximos', icon: 'Calendar' },
    { key: 'inProgress', label: 'Em Andamento', icon: 'Activity' },
    { key: 'completed', label: 'Concluídos', icon: 'CheckCircle' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'PLANNED', label: 'Planejado' },
      { value: 'OPEN_REGISTRATION', label: 'Inscrições Abertas' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
    ]},
  ],

  apiEndpoint: '/api/secretarias/esportes/tournaments',
};

// 8. MODALIDADES ESPORTIVAS
export const sportsModalityConfig: ModuleConfig = {
  key: 'sports-modality',
  departmentType: 'sports',
  entityName: 'SportsModality',
  displayName: 'Modalidades Esportivas',
  displayNameSingular: 'Modalidade Esportiva',

  fields: [
    { name: 'name', label: 'Nome da Modalidade', type: 'text', required: true, showInList: true },
    { name: 'description', label: 'Descrição', type: 'textarea' },
    { name: 'category', label: 'Categoria', type: 'select', required: true, showInList: true, options: [
      { value: 'individual', label: 'Individual' },
      { value: 'coletivo', label: 'Coletivo' },
    ]},
    { name: 'isActive', label: 'Ativa', type: 'checkbox', showInList: true },
    { name: 'observations', label: 'Observações', type: 'textarea' },
  ],

  stats: [
    { key: 'total', label: 'Total de Modalidades', icon: 'List' },
    { key: 'active', label: 'Ativas', icon: 'CheckCircle' },
    { key: 'individual', label: 'Individuais', icon: 'User' },
    { key: 'team', label: 'Coletivas', icon: 'Users' },
  ],

  filters: [
    { key: 'category', type: 'select', label: 'Categoria', options: [
      { value: 'individual', label: 'Individual' },
      { value: 'coletivo', label: 'Coletivo' },
    ]},
  ],

  apiEndpoint: '/api/secretarias/esportes/sports-modalities',
};

// 9. AGENDA DE EVENTOS ESPORTIVOS (INFORMATIVO)
export const sportsEventConfig: ModuleConfig = {
  key: 'sports-event',
  departmentType: 'sports',
  entityName: 'SportsEvent',
  displayName: 'Agenda de Eventos Esportivos',
  displayNameSingular: 'Agenda de Evento Esportivo',

  fields: [
    { name: 'name', label: 'Nome do Evento', type: 'text', required: true, showInList: true },
    { name: 'type', label: 'Tipo de Evento', type: 'select', required: true, showInList: true, options: [
      { value: 'JOGO', label: 'Jogo/Partida' },
      { value: 'TORNEIO', label: 'Torneio' },
      { value: 'CAMPEONATO', label: 'Campeonato' },
      { value: 'FESTIVAL', label: 'Festival Esportivo' },
      { value: 'CORRIDA', label: 'Corrida' },
      { value: 'MARATONA', label: 'Maratona' },
      { value: 'DEMONSTRACAO', label: 'Demonstração' },
      { value: 'INAUGURACAO', label: 'Inauguração' },
      { value: 'OUTROS', label: 'Outros' },
    ]},
    { name: 'sport', label: 'Modalidade', type: 'text', showInList: true },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'startDate', label: 'Data/Hora de Início', type: 'datetime', required: true, showInList: true },
    { name: 'endDate', label: 'Data/Hora de Término', type: 'datetime', showInList: true },
    { name: 'location', label: 'Local', type: 'text', required: true, showInList: true },
    { name: 'capacity', label: 'Capacidade', type: 'number' },
    { name: 'isFree', label: 'Entrada Gratuita', type: 'checkbox', showInList: true },
    { name: 'ticketPrice', label: 'Valor do Ingresso (R$)', type: 'number' },
    { name: 'organizer', label: 'Organizador', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', showInList: true, options: [
      { value: 'SCHEDULED', label: 'Agendado' },
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
    { key: 'freeEvents', label: 'Eventos Gratuitos', icon: 'Gift' },
  ],

  filters: [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: 'SCHEDULED', label: 'Agendado' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
      { value: 'COMPLETED', label: 'Realizado' },
    ]},
    { key: 'type', type: 'select', label: 'Tipo', options: [
      { value: 'JOGO', label: 'Jogo/Partida' },
      { value: 'TORNEIO', label: 'Torneio' },
      { value: 'FESTIVAL', label: 'Festival Esportivo' },
    ]},
  ],

  apiEndpoint: '/api/secretarias/esportes/events',
};

// Exportar todas as configurações
export const esportesConfigs = {
  sportsAttendance: sportsAttendanceConfig,
  sportsSchool: sportsSchoolConfig,
  athlete: athleteConfig,
  sportsInfrastructureReservation: sportsInfrastructureReservationConfig,
  competition: competitionConfig,
  sportsTeam: sportsTeamConfig,
  tournament: tournamentConfig,
  sportsModality: sportsModalityConfig,
  sportsEvent: sportsEventConfig,
};
