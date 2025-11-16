import { ServiceSuggestion } from './types';

export const esportesSuggestions: ServiceSuggestion[] = [
  {
    id: 'escolinha-futebol',
    name: 'Escolinha de Futebol',
    description: 'Inscrição em escolinha de futebol para crianças e adolescentes',
    icon: 'Trophy',
    category: 'Escolinhas',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'categoria', type: 'select', label: 'Categoria (Sub-10, Sub-12, etc.)', required: true },
      { name: 'experiencia', type: 'select', label: 'Experiência Prévia', required: false },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'escolinha-volei',
    name: 'Escolinha de Vôlei',
    description: 'Aulas de voleibol para iniciantes e intermediários',
    icon: 'Circle',
    category: 'Escolinhas',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'altura', type: 'number', label: 'Altura (cm)', required: false },
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'horario_preferencia', type: 'select', label: 'Horário de Preferência', required: true },
    ]
  },
  {
    id: 'escolinha-basquete',
    name: 'Escolinha de Basquete',
    description: 'Treinamento de basquetebol para todas as idades',
    icon: 'Circle',
    category: 'Escolinhas',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'altura', type: 'number', label: 'Altura (cm)', required: false },
      { name: 'categoria_idade', type: 'select', label: 'Categoria de Idade', required: true },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'natacao-criancas',
    name: 'Natação Infantil',
    description: 'Aulas de natação para crianças',
    icon: 'Waves',
    category: 'Natação',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nivel_natacao', type: 'select', label: 'Nível de Natação', required: true },
      { name: 'restricao_saude', type: 'textarea', label: 'Restrições de Saúde', required: false },
      { name: 'turma_preferencia', type: 'select', label: 'Turma de Preferência', required: true },
    ]
  },
  {
    id: 'natacao-adultos',
    name: 'Natação para Adultos',
    description: 'Aulas de natação para adultos e idosos',
    icon: 'Waves',
    category: 'Natação',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'objetivo', type: 'select', label: 'Objetivo', required: true },
      { name: 'horario_disponibilidade', type: 'select', label: 'Horário de Disponibilidade', required: true },
    ]
  },
  {
    id: 'hidroginastica',
    name: 'Hidroginástica',
    description: 'Aulas de hidroginástica para todas as idades',
    icon: 'Waves',
    category: 'Atividades Aquáticas',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'restricao_medica', type: 'textarea', label: 'Restrições Médicas', required: false },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'reserva-quadra-futebol',
    name: 'Reserva de Campo de Futebol',
    description: 'Agendamento de campos de futebol society e suíço',
    icon: 'CalendarCheck',
    category: 'Reservas',
    estimatedDays: 2,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_campo', type: 'select', label: 'Tipo de Campo', required: true },
      { name: 'data_uso', type: 'date', label: 'Data do Uso', required: true },
      { name: 'horario_inicio', type: 'text', label: 'Horário de Início', required: true },
      { name: 'duracao', type: 'select', label: 'Duração', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'reserva-quadra-poliesportiva',
    name: 'Reserva de Quadra Poliesportiva',
    description: 'Agendamento de quadras para vôlei, basquete, futsal',
    icon: 'CalendarCheck',
    category: 'Reservas',
    estimatedDays: 2,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'quadra_desejada', type: 'select', label: 'Quadra Desejada', required: true },
      { name: 'modalidade', type: 'select', label: 'Modalidade Esportiva', required: true },
      { name: 'data_reserva', type: 'date', label: 'Data da Reserva', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'reserva-ginasio',
    name: 'Reserva de Ginásio Esportivo',
    description: 'Agendamento de ginásios para eventos e competições',
    icon: 'Building',
    category: 'Reservas',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'organizacao', type: 'text', label: 'Organização/Instituição', required: false },
      { name: 'tipo_evento', type: 'select', label: 'Tipo de Evento', required: true },
      { name: 'data_evento', type: 'date', label: 'Data do Evento', required: true },
      { name: 'publico_estimado', type: 'number', label: 'Público Estimado', required: true },
      { name: 'descricao_evento', type: 'textarea', label: 'Descrição do Evento', required: true },
    ]
  },
  {
    id: 'cadastro-equipe-campeonato',
    name: 'Cadastro de Equipe em Campeonato',
    description: 'Inscrição de times em campeonatos municipais',
    icon: 'Users',
    category: 'Competições',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'modalidade', type: 'select', label: 'Modalidade', required: true },
      { name: 'categoria', type: 'select', label: 'Categoria', required: true },
      { name: 'num_atletas', type: 'number', label: 'Número de Atletas', required: true },
    ]
  },
  {
    id: 'bolsa-atleta-municipal',
    name: 'Bolsa Atleta Municipal',
    description: 'Programa de auxílio financeiro para atletas de destaque',
    icon: 'Award',
    category: 'Incentivo',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'modalidade', type: 'select', label: 'Modalidade Esportiva', required: true },
      { name: 'categoria_atleta', type: 'select', label: 'Categoria de Atleta', required: true },
      { name: 'titulos_recentes', type: 'textarea', label: 'Títulos e Conquistas Recentes', required: true },
      { name: 'clube_associacao', type: 'text', label: 'Clube/Associação', required: false },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
    ]
  },
  {
    id: 'academia-saude-programa',
    name: 'Academia da Saúde',
    description: 'Programa de atividades físicas e orientação para comunidade',
    icon: 'Dumbbell',
    category: 'Saúde e Bem-Estar',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'polo_preferencia', type: 'select', label: 'Polo de Preferência', required: true },
      { name: 'atividade_interesse', type: 'select', label: 'Atividade de Interesse', required: true },
      { name: 'problema_saude', type: 'textarea', label: 'Problemas de Saúde', required: false },
    ]
  },
  {
    id: 'ginastica-terceira-idade',
    name: 'Ginástica para Terceira Idade',
    description: 'Atividades físicas adaptadas para idosos',
    icon: 'Heart',
    category: 'Terceira Idade',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'local_preferencia', type: 'select', label: 'Local de Preferência', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
      { name: 'limitacao_fisica', type: 'textarea', label: 'Limitações Físicas', required: false },
    ]
  },
  {
    id: 'corrida-rua-inscricao',
    name: 'Inscrição em Corrida de Rua',
    description: 'Participação em corridas e caminhadas municipais',
    icon: 'Trophy',
    category: 'Eventos',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'evento', type: 'select', label: 'Evento', required: true },
      { name: 'categoria', type: 'select', label: 'Categoria', required: true },
      { name: 'tamanho_camisa', type: 'select', label: 'Tamanho da Camisa', required: true },
    ]
  },
  {
    id: 'arbitro-cadastro',
    name: 'Cadastro de Árbitro',
    description: 'Registro de árbitros para competições municipais',
    icon: 'Whistle',
    category: 'Cadastro Profissional',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'modalidade', type: 'select', label: 'Modalidade', required: true },
      { name: 'nivel_certificacao', type: 'select', label: 'Nível de Certificação', required: true },
      { name: 'tempo_experiencia', type: 'number', label: 'Tempo de Experiência (anos)', required: true },
    ]
  },
  {
    id: 'treinador-cadastro',
    name: 'Cadastro de Treinador/Professor',
    description: 'Registro profissional de treinadores esportivos',
    icon: 'Users',
    category: 'Cadastro Profissional',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'registro_cref', type: 'text', label: 'Registro CREF', required: true },
      { name: 'especialidade', type: 'select', label: 'Especialidade', required: true },
      { name: 'formacao', type: 'select', label: 'Formação', required: true },
    ]
  },
  {
    id: 'escolinha-futsal',
    name: 'Escolinha de Futsal',
    description: 'Treinamento de futsal para crianças e adolescentes',
    icon: 'Trophy',
    category: 'Escolinhas',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'categoria', type: 'select', label: 'Categoria por Idade', required: true },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'escolinha-handbol',
    name: 'Escolinha de Handebol',
    description: 'Aulas de handebol para iniciantes',
    icon: 'Circle',
    category: 'Escolinhas',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'faixa_etaria', type: 'select', label: 'Faixa Etária', required: true },
      { name: 'horario_preferencia', type: 'select', label: 'Horário de Preferência', required: true },
    ]
  },
  {
    id: 'escolinha-tenis-mesa',
    name: 'Escolinha de Tênis de Mesa',
    description: 'Treinamento de tênis de mesa',
    icon: 'Circle',
    category: 'Escolinhas',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'escolinha-judo',
    name: 'Escolinha de Judô',
    description: 'Aulas de judô para todas as idades',
    icon: 'Award',
    category: 'Artes Marciais',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'faixa_atual', type: 'select', label: 'Faixa Atual', required: false },
      { name: 'experiencia_previa', type: 'select', label: 'Experiência Prévia', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'escolinha-karate',
    name: 'Escolinha de Karatê',
    description: 'Treinamento de karatê para crianças e adultos',
    icon: 'Award',
    category: 'Artes Marciais',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'faixa_graduacao', type: 'select', label: 'Faixa/Graduação', required: false },
      { name: 'turma', type: 'select', label: 'Turma', required: true },
    ]
  },
  {
    id: 'escolinha-atletismo',
    name: 'Escolinha de Atletismo',
    description: 'Treinamento de atletismo - corrida, saltos e arremessos',
    icon: 'Trophy',
    category: 'Escolinhas',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'prova_interesse', type: 'select', label: 'Prova de Interesse', required: false },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'ciclismo-grupo',
    name: 'Grupo de Ciclismo',
    description: 'Inscrição em grupo de pedal municipal',
    icon: 'Bike',
    category: 'Grupos',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_bike', type: 'select', label: 'Tipo de Bike', required: true },
      { name: 'nivel_experiencia', type: 'select', label: 'Nível de Experiência', required: true },
      { name: 'dia_preferencia', type: 'select', label: 'Dia de Preferência', required: true },
    ]
  },
  {
    id: 'caminhada-orientada',
    name: 'Grupo de Caminhada Orientada',
    description: 'Caminhadas orientadas por profissionais',
    icon: 'Heart',
    category: 'Grupos',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'local_preferencia', type: 'select', label: 'Local de Preferência', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'xadrez-aulas',
    name: 'Aulas de Xadrez',
    description: 'Curso de xadrez para iniciantes e intermediários',
    icon: 'Circle',
    category: 'Esportes de Raciocínio',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'patinacao-aulas',
    name: 'Aulas de Patinação',
    description: 'Patinação artística e velocidade',
    icon: 'Circle',
    category: 'Modalidades Especiais',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'modalidade', type: 'select', label: 'Modalidade', required: true },
      { name: 'possui_patins', type: 'select', label: 'Possui Patins Próprios', required: true },
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
    ]
  },
  {
    id: 'skate-pista',
    name: 'Aulas de Skate',
    description: 'Iniciação ao skate na pista municipal',
    icon: 'Circle',
    category: 'Esportes Radicais',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nivel_experiencia', type: 'select', label: 'Nível de Experiência', required: true },
      { name: 'possui_equipamento', type: 'select', label: 'Possui Skate e Equipamentos', required: true },
    ]
  },
  {
    id: 'yoga-aulas',
    name: 'Aulas de Yoga',
    description: 'Práticas de yoga para bem-estar',
    icon: 'Heart',
    category: 'Bem-Estar',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'experiencia_yoga', type: 'select', label: 'Experiência com Yoga', required: true },
      { name: 'horario_preferencia', type: 'select', label: 'Horário de Preferência', required: true },
      { name: 'local', type: 'select', label: 'Local', required: true },
    ]
  },
  {
    id: 'pilates-solo',
    name: 'Pilates Solo',
    description: 'Aulas de pilates em grupo',
    icon: 'Heart',
    category: 'Bem-Estar',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'objetivo', type: 'select', label: 'Objetivo', required: true },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'danca-ritmos',
    name: 'Aulas de Dança e Ritmos',
    description: 'Zumba, dança de salão e outros ritmos',
    icon: 'Music',
    category: 'Dança',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'ritmo_interesse', type: 'select', label: 'Ritmo de Interesse', required: true },
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'musculacao-academia',
    name: 'Academia de Musculação',
    description: 'Acesso a academia municipal de musculação',
    icon: 'Dumbbell',
    category: 'Academia',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'objetivo', type: 'select', label: 'Objetivo', required: true },
      { name: 'horario_treino', type: 'select', label: 'Horário de Treino', required: true },
      { name: 'problema_saude', type: 'textarea', label: 'Problemas de Saúde', required: false },
    ]
  },
  {
    id: 'avaliacao-fisica',
    name: 'Avaliação Física',
    description: 'Avaliação física e composição corporal',
    icon: 'Activity',
    category: 'Saúde',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'objetivo_avaliacao', type: 'select', label: 'Objetivo da Avaliação', required: true },
      { name: 'pratica_atividade', type: 'select', label: 'Pratica Atividade Física', required: true },
    ]
  },
  {
    id: 'escolinha-tenis-campo',
    name: 'Escolinha de Tênis de Campo',
    description: 'Aulas de tênis em quadra',
    icon: 'Circle',
    category: 'Escolinhas',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'possui_raquete', type: 'select', label: 'Possui Raquete', required: false },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'badminton-aulas',
    name: 'Aulas de Badminton',
    description: 'Iniciação e treinamento de badminton',
    icon: 'Circle',
    category: 'Modalidades Especiais',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'capoeira-esporte',
    name: 'Capoeira',
    description: 'Aulas de capoeira como esporte e cultura',
    icon: 'Award',
    category: 'Artes Marciais',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'corda_graduacao', type: 'text', label: 'Corda/Graduação (se houver)', required: false },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'tai-chi-chuan',
    name: 'Tai Chi Chuan',
    description: 'Prática de tai chi chuan para saúde e bem-estar',
    icon: 'Heart',
    category: 'Bem-Estar',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'experiencia_anterior', type: 'select', label: 'Experiência Anterior', required: false },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'futevolei-aulas',
    name: 'Futevôlei',
    description: 'Treinamento de futevôlei na areia',
    icon: 'Trophy',
    category: 'Modalidades Especiais',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nivel_habilidade', type: 'select', label: 'Nível de Habilidade', required: true },
      { name: 'horario_preferencia', type: 'select', label: 'Horário de Preferência', required: true },
    ]
  },
  {
    id: 'beach-tennis',
    name: 'Beach Tennis',
    description: 'Aulas de beach tennis',
    icon: 'Circle',
    category: 'Esportes de Praia',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'possui_raquete', type: 'select', label: 'Possui Raquete', required: false },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'funcional-treino',
    name: 'Treino Funcional',
    description: 'Aulas de treinamento funcional ao ar livre',
    icon: 'Dumbbell',
    category: 'Academia',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nivel_condicionamento', type: 'select', label: 'Nível de Condicionamento', required: true },
      { name: 'local_preferencia', type: 'select', label: 'Local de Preferência', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'alongamento-grupo',
    name: 'Grupo de Alongamento',
    description: 'Sessões de alongamento e flexibilidade',
    icon: 'Heart',
    category: 'Bem-Estar',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'local', type: 'select', label: 'Local', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'corrida-orientacao',
    name: 'Corrida de Orientação',
    description: 'Prática de corrida de orientação em trilhas',
    icon: 'Map',
    category: 'Esportes de Aventura',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'experiencia', type: 'select', label: 'Experiência', required: true },
      { name: 'dia_atividade', type: 'select', label: 'Dia da Atividade', required: true },
    ]
  },
  {
    id: 'slackline-aulas',
    name: 'Slackline',
    description: 'Iniciação e prática de slackline',
    icon: 'Activity',
    category: 'Esportes de Aventura',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'ginastica-ritmica',
    name: 'Ginástica Rítmica',
    description: 'Aulas de ginástica rítmica',
    icon: 'Award',
    category: 'Ginástica',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'ginastica-artistica',
    name: 'Ginástica Artística',
    description: 'Treinamento de ginástica olímpica',
    icon: 'Award',
    category: 'Ginástica',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'genero', type: 'select', label: 'Gênero', required: true },
      { name: 'experiencia', type: 'select', label: 'Experiência', required: true },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'esgrima-aulas',
    name: 'Esgrima',
    description: 'Aulas de esgrima esportiva',
    icon: 'Award',
    category: 'Modalidades Especiais',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'arma_interesse', type: 'select', label: 'Arma de Interesse', required: false },
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
    ]
  },
  {
    id: 'tiro-arco',
    name: 'Tiro com Arco',
    description: 'Iniciação e treinamento de tiro com arco',
    icon: 'Target',
    category: 'Modalidades Especiais',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'experiencia', type: 'select', label: 'Experiência', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'rugby-escolinha',
    name: 'Escolinha de Rugby',
    description: 'Iniciação ao rugby para crianças e adolescentes',
    icon: 'Trophy',
    category: 'Escolinhas',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'categoria', type: 'select', label: 'Categoria', required: true },
      { name: 'turno', type: 'select', label: 'Turno', required: true },
    ]
  },
  {
    id: 'bocha-terceira-idade',
    name: 'Bocha para Terceira Idade',
    description: 'Prática de bocha para idosos',
    icon: 'Circle',
    category: 'Terceira Idade',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'local_preferencia', type: 'select', label: 'Local de Preferência', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'frescobol-aulas',
    name: 'Frescobol',
    description: 'Aulas de frescobol na praia ou quadra',
    icon: 'Circle',
    category: 'Esportes de Praia',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nivel', type: 'select', label: 'Nível', required: true },
      { name: 'local', type: 'select', label: 'Local', required: true },
      { name: 'horario', type: 'select', label: 'Horário', required: true },
    ]
  },
  {
    id: 'evento-esportivo-organizacao',
    name: 'Organização de Evento Esportivo',
    description: 'Apoio para realização de eventos esportivos',
    icon: 'Trophy',
    category: 'Eventos',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'modalidade', type: 'select', label: 'Modalidade', required: true },
      { name: 'data_evento', type: 'date', label: 'Data do Evento', required: true },
      { name: 'local_desejado', type: 'select', label: 'Local Desejado', required: true },
      { name: 'num_participantes', type: 'number', label: 'Número de Participantes Esperados', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição do Evento', required: true },
    ]
  },
  {
    id: 'material-esportivo-emprestimo',
    name: 'Empréstimo de Material Esportivo',
    description: 'Solicitação de empréstimo de bolas, redes e equipamentos',
    icon: 'Package',
    category: 'Equipamentos',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'material_solicitado', type: 'select', label: 'Material Solicitado', required: true },
      { name: 'quantidade', type: 'number', label: 'Quantidade', required: true },
      { name: 'data_retirada', type: 'date', label: 'Data de Retirada', required: true },
      { name: 'data_devolucao', type: 'date', label: 'Data de Devolução', required: true },
      { name: 'finalidade', type: 'textarea', label: 'Finalidade', required: true },
    ]
  }
];
