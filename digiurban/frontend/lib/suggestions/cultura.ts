import { ServiceSuggestion } from './types';

export const culturaSuggestions: ServiceSuggestion[] = [
  {
    id: 'oficina-musica',
    name: 'Oficina de Música',
    description: 'Inscrição em oficinas de instrumentos musicais e canto',
    icon: 'Music',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
      { name: 'instrumento_interesse', type: 'select', label: 'Instrumento de Interesse', required: true },
      { name: 'nivel_conhecimento', type: 'select', label: 'Nível de Conhecimento', required: true },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'oficina-danca',
    name: 'Oficina de Dança',
    description: 'Aulas de dança popular, contemporânea e folclórica',
    icon: 'Music',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
      { name: 'estilo_danca', type: 'select', label: 'Estilo de Dança', required: true },
      { name: 'experiencia_anterior', type: 'select', label: 'Experiência Anterior', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'oficina-teatro',
    name: 'Oficina de Teatro',
    description: 'Curso de iniciação e aperfeiçoamento teatral',
    icon: 'Drama',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
      { name: 'faixa_etaria', type: 'select', label: 'Faixa Etária', required: true },
      { name: 'experiencia_teatro', type: 'select', label: 'Experiência em Teatro', required: true },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'oficina-artes-plasticas',
    name: 'Oficina de Artes Plásticas',
    description: 'Pintura, desenho, escultura e outras artes visuais',
    icon: 'Palette',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
      { name: 'modalidade_arte', type: 'select', label: 'Modalidade de Arte', required: true },
      { name: 'nivel_habilidade', type: 'select', label: 'Nível de Habilidade', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'cadastro-artista-local',
    name: 'Cadastro de Artista Local',
    description: 'Registro oficial de artistas do município',
    icon: 'User',
    category: 'Cadastro',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'area_atuacao', type: 'select', label: 'Área de Atuação', required: true },
      { name: 'tempo_atuacao', type: 'number', label: 'Tempo de Atuação (anos)', required: true },
      { name: 'portfolio_link', type: 'text', label: 'Link do Portfólio', required: false },
    ]
  },
  {
    id: 'reserva-teatro-municipal',
    name: 'Reserva de Teatro Municipal',
    description: 'Solicitação de uso do teatro para apresentações',
    icon: 'Building',
    category: 'Espaços',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_evento', type: 'select', label: 'Tipo de Evento', required: true },
      { name: 'data_preferencial', type: 'date', label: 'Data Preferencial', required: true },
      { name: 'duracao_evento', type: 'text', label: 'Duração do Evento', required: true },
      { name: 'publico_estimado', type: 'number', label: 'Público Estimado', required: true },
      { name: 'descricao_evento', type: 'textarea', label: 'Descrição do Evento', required: true },
    ]
  },
  {
    id: 'reserva-centro-cultural',
    name: 'Reserva de Centro Cultural',
    description: 'Agendamento de salas e espaços culturais',
    icon: 'Building2',
    category: 'Espaços',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_espaco', type: 'select', label: 'Tipo de Espaço', required: true },
      { name: 'data_uso', type: 'date', label: 'Data de Uso', required: true },
      { name: 'horario_inicio', type: 'text', label: 'Horário de Início', required: true },
      { name: 'horario_fim', type: 'text', label: 'Horário de Término', required: true },
      { name: 'finalidade', type: 'textarea', label: 'Finalidade do Uso', required: true },
    ]
  },
  {
    id: 'lei-incentivo-cultura',
    name: 'Lei Municipal de Incentivo à Cultura',
    description: 'Submissão de projetos culturais para captação de recursos',
    icon: 'FileText',
    category: 'Incentivo',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'titulo_projeto', type: 'text', label: 'Título do Projeto', required: true },
      { name: 'area_cultural', type: 'select', label: 'Área Cultural', required: true },
      { name: 'valor_solicitado', type: 'number', label: 'Valor Solicitado (R$)', required: true },
      { name: 'contrapartida', type: 'textarea', label: 'Contrapartida Social', required: true },
      { name: 'resumo_projeto', type: 'textarea', label: 'Resumo do Projeto', required: true },
    ]
  },
  {
    id: 'tombamento-patrimonio',
    name: 'Solicitação de Tombamento de Patrimônio',
    description: 'Pedido de tombamento de bens culturais e históricos',
    icon: 'Landmark',
    category: 'Patrimônio',
    estimatedDays: 90,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_bem', type: 'select', label: 'Tipo de Bem', required: true },
      { name: 'localizacao', type: 'text', label: 'Localização', required: true },
      { name: 'periodo_historico', type: 'text', label: 'Período Histórico', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa do Tombamento', required: true },
    ]
  },
  {
    id: 'cadastro-biblioteca',
    name: 'Cadastro na Biblioteca Municipal',
    description: 'Registro para empréstimo de livros e materiais',
    icon: 'Book',
    category: 'Bibliotecas',
    estimatedDays: 1,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
      { name: 'escolaridade', type: 'select', label: 'Escolaridade', required: false },
    ]
  },
  {
    id: 'visita-museu',
    name: 'Agendamento de Visita ao Museu',
    description: 'Agendamento de visitas guiadas individuais ou em grupo',
    icon: 'Building2',
    category: 'Museus',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_visita', type: 'select', label: 'Tipo de Visita', required: true },
      { name: 'data_preferencial', type: 'date', label: 'Data Preferencial', required: true },
      { name: 'horario_preferencial', type: 'text', label: 'Horário Preferencial', required: true },
      { name: 'num_visitantes', type: 'number', label: 'Número de Visitantes', required: true },
      { name: 'faixa_etaria', type: 'select', label: 'Faixa Etária do Grupo', required: false },
    ]
  },
  {
    id: 'inscricao-festival',
    name: 'Inscrição em Festivais Culturais',
    description: 'Cadastro de artistas para festivais municipais',
    icon: 'Calendar',
    category: 'Eventos',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'festival_interesse', type: 'select', label: 'Festival de Interesse', required: true },
      { name: 'modalidade_artistica', type: 'select', label: 'Modalidade Artística', required: true },
      { name: 'num_integrantes', type: 'number', label: 'Número de Integrantes', required: true },
      { name: 'link_portfolio', type: 'text', label: 'Link de Vídeo/Portfólio', required: false },
      { name: 'sinopse', type: 'textarea', label: 'Sinopse da Apresentação', required: true },
    ]
  },
  {
    id: 'cadastro-grupo-teatral',
    name: 'Cadastro de Grupo Teatral',
    description: 'Registro de grupos e companhias de teatro',
    icon: 'Users',
    category: 'Cadastro',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_diretor', type: 'cpf', label: 'CPF do Diretor', required: true },
      { name: 'ano_fundacao', type: 'number', label: 'Ano de Fundação', required: false },
      { name: 'num_integrantes', type: 'number', label: 'Número de Integrantes', required: true },
      { name: 'genero_teatral', type: 'select', label: 'Gênero Teatral', required: true },
    ]
  },
  {
    id: 'ponto-cultura',
    name: 'Cadastro de Ponto de Cultura',
    description: 'Registro de iniciativas culturais comunitárias',
    icon: 'MapPin',
    category: 'Cadastro',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'area_atuacao', type: 'select', label: 'Área de Atuação', required: true },
      { name: 'publico_atendido', type: 'number', label: 'Público Atendido (mensal)', required: false },
      { name: 'descricao_atividades', type: 'textarea', label: 'Descrição das Atividades', required: true },
    ]
  },
  {
    id: 'oficina-fotografia',
    name: 'Oficina de Fotografia',
    description: 'Curso de fotografia básica e avançada',
    icon: 'Camera',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nivel_conhecimento', type: 'select', label: 'Nível de Conhecimento', required: true },
      { name: 'possui_camera', type: 'select', label: 'Possui Câmera Própria', required: false },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'oficina-video',
    name: 'Oficina de Produção Audiovisual',
    description: 'Curso de produção e edição de vídeos',
    icon: 'Video',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'area_interesse', type: 'select', label: 'Área de Interesse', required: true },
      { name: 'experiencia_previa', type: 'select', label: 'Experiência Prévia', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'circo-arte',
    name: 'Oficina de Circo e Artes Circenses',
    description: 'Aulas de malabares, acrobacia e outras artes circenses',
    icon: 'Tent',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
      { name: 'modalidade_interesse', type: 'select', label: 'Modalidade de Interesse', required: true },
      { name: 'experiencia_anterior', type: 'select', label: 'Experiência Anterior', required: true },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'literatura-curso',
    name: 'Oficina Literária',
    description: 'Curso de criação literária e escrita criativa',
    icon: 'BookOpen',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'genero_interesse', type: 'select', label: 'Gênero de Interesse', required: true },
      { name: 'nivel_experiencia', type: 'select', label: 'Nível de Experiência', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'capoeira-cultura',
    name: 'Oficina de Capoeira',
    description: 'Aulas de capoeira como manifestação cultural',
    icon: 'Music',
    category: 'Oficinas',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
      { name: 'graduacao_capoeira', type: 'text', label: 'Graduação (se houver)', required: false },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'grafite-arte-urbana',
    name: 'Oficina de Grafite e Arte Urbana',
    description: 'Curso de técnicas de grafite e intervenção urbana',
    icon: 'Paintbrush',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
      { name: 'experiencia_grafite', type: 'select', label: 'Experiência com Grafite', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'artesanato-tradicional',
    name: 'Oficina de Artesanato Tradicional',
    description: 'Técnicas de artesanato e cultura popular',
    icon: 'Scissors',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_artesanato', type: 'select', label: 'Tipo de Artesanato', required: true },
      { name: 'nivel_habilidade', type: 'select', label: 'Nível de Habilidade', required: true },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'coral-municipal',
    name: 'Inscrição no Coral Municipal',
    description: 'Participação no coral da cidade',
    icon: 'Music',
    category: 'Grupos Artísticos',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tessiture_voz', type: 'select', label: 'Tessitura de Voz', required: true },
      { name: 'experiencia_coral', type: 'select', label: 'Experiência em Coral', required: true },
      { name: 'disponibilidade_ensaios', type: 'select', label: 'Disponibilidade para Ensaios', required: true },
    ]
  },
  {
    id: 'banda-municipal',
    name: 'Inscrição na Banda Municipal',
    description: 'Participação na banda de música da cidade',
    icon: 'Music',
    category: 'Grupos Artísticos',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'instrumento', type: 'select', label: 'Instrumento', required: true },
      { name: 'tempo_experiencia', type: 'number', label: 'Tempo de Experiência (anos)', required: true },
      { name: 'disponibilidade_ensaios', type: 'select', label: 'Disponibilidade para Ensaios', required: true },
    ]
  },
  {
    id: 'cinema-itinerante',
    name: 'Solicitação de Cinema Itinerante',
    description: 'Pedido de exibição de filmes em comunidades',
    icon: 'Film',
    category: 'Audiovisual',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'organizacao', type: 'text', label: 'Organização/Comunidade', required: false },
      { name: 'local_exibicao', type: 'text', label: 'Local da Exibição', required: true },
      { name: 'data_preferencial', type: 'date', label: 'Data Preferencial', required: true },
      { name: 'publico_estimado', type: 'number', label: 'Público Estimado', required: true },
      { name: 'tema_preferencia', type: 'select', label: 'Tema de Preferência', required: false },
    ]
  },
  {
    id: 'exposicao-arte',
    name: 'Solicitação de Espaço para Exposição',
    description: 'Reserva de galeria para exposição artística',
    icon: 'Frame',
    category: 'Artes Visuais',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'titulo_exposicao', type: 'text', label: 'Título da Exposição', required: true },
      { name: 'tipo_arte', type: 'select', label: 'Tipo de Arte', required: true },
      { name: 'num_obras', type: 'number', label: 'Número de Obras', required: true },
      { name: 'periodo_solicitado', type: 'text', label: 'Período Solicitado', required: true },
      { name: 'descricao_projeto', type: 'textarea', label: 'Descrição do Projeto', required: true },
    ]
  },
  {
    id: 'quadrinhos-oficina',
    name: 'Oficina de Quadrinhos e Mangá',
    description: 'Curso de criação e desenho de histórias em quadrinhos',
    icon: 'BookOpen',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'estilo_interesse', type: 'select', label: 'Estilo de Interesse', required: true },
      { name: 'nivel_desenho', type: 'select', label: 'Nível de Desenho', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'sarau-cultural',
    name: 'Inscrição para Sarau Cultural',
    description: 'Participação em saraus e eventos literários',
    icon: 'Mic',
    category: 'Eventos',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_apresentacao', type: 'select', label: 'Tipo de Apresentação', required: true },
      { name: 'duracao_aprox', type: 'text', label: 'Duração Aproximada', required: true },
      { name: 'mes_interesse', type: 'select', label: 'Mês de Interesse', required: true },
      { name: 'sinopse_apresentacao', type: 'textarea', label: 'Sinopse da Apresentação', required: true },
    ]
  },
  {
    id: 'dj-producao-musical',
    name: 'Oficina de DJ e Produção Musical',
    description: 'Curso de técnicas de DJ e produção musical digital',
    icon: 'Radio',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'area_interesse', type: 'select', label: 'Área de Interesse', required: true },
      { name: 'experiencia_musica', type: 'select', label: 'Experiência com Música', required: true },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'moda-design',
    name: 'Oficina de Moda e Design de Roupas',
    description: 'Curso de costura, modelagem e design de moda',
    icon: 'Shirt',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'area_interesse', type: 'select', label: 'Área de Interesse', required: true },
      { name: 'nivel_conhecimento', type: 'select', label: 'Nível de Conhecimento', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'cultura-popular',
    name: 'Cadastro de Grupo de Cultura Popular',
    description: 'Registro de grupos folclóricos e tradicionais',
    icon: 'Users',
    category: 'Cadastro',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_manifestacao', type: 'select', label: 'Tipo de Manifestação Cultural', required: true },
      { name: 'num_integrantes', type: 'number', label: 'Número de Integrantes', required: true },
      { name: 'tempo_atuacao', type: 'number', label: 'Tempo de Atuação (anos)', required: false },
      { name: 'descricao_atividades', type: 'textarea', label: 'Descrição das Atividades', required: true },
    ]
  },
  {
    id: 'patrimonio-imaterial',
    name: 'Registro de Patrimônio Imaterial',
    description: 'Cadastro de manifestações culturais imateriais',
    icon: 'BookOpen',
    category: 'Patrimônio',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_manifestacao', type: 'select', label: 'Tipo de Manifestação', required: true },
      { name: 'tempo_tradicao', type: 'text', label: 'Tempo de Tradição', required: false },
      { name: 'area_abrangencia', type: 'text', label: 'Área de Abrangência', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa do Registro', required: true },
    ]
  },
  {
    id: 'contacao-historias',
    name: 'Oficina de Contação de Histórias',
    description: 'Curso de técnicas de narração e contação de histórias',
    icon: 'BookOpen',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'publico_alvo_interesse', type: 'select', label: 'Público-alvo de Interesse', required: true },
      { name: 'experiencia_anterior', type: 'select', label: 'Experiência Anterior', required: true },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'radio-comunitaria',
    name: 'Oficina de Rádio Comunitária',
    description: 'Curso de produção e locução radiofônica',
    icon: 'Radio',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'area_interesse', type: 'select', label: 'Área de Interesse', required: true },
      { name: 'experiencia_comunicacao', type: 'select', label: 'Experiência em Comunicação', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'restauracao-obras',
    name: 'Solicitação de Restauração de Obra Cultural',
    description: 'Pedido de restauro de obras de arte e bens culturais',
    icon: 'Wrench',
    category: 'Patrimônio',
    estimatedDays: 90,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_obra', type: 'select', label: 'Tipo de Obra', required: true },
      { name: 'descricao_obra', type: 'textarea', label: 'Descrição da Obra', required: true },
      { name: 'estado_conservacao', type: 'select', label: 'Estado de Conservação', required: true },
      { name: 'valor_historico', type: 'textarea', label: 'Valor Histórico/Cultural', required: true },
    ]
  },
  {
    id: 'cultura-indigena',
    name: 'Oficina de Cultura Indígena',
    description: 'Valorização e aprendizado de culturas indígenas',
    icon: 'TreePine',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'area_interesse', type: 'select', label: 'Área de Interesse', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'cultura-afro',
    name: 'Oficina de Cultura Afro-Brasileira',
    description: 'Valorização da cultura afro-brasileira e africana',
    icon: 'Users',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'modalidade_interesse', type: 'select', label: 'Modalidade de Interesse', required: true },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'jogos-tradicionais',
    name: 'Oficina de Jogos e Brincadeiras Tradicionais',
    description: 'Resgate de jogos e brincadeiras populares',
    icon: 'Gamepad2',
    category: 'Oficinas',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'faixa_etaria', type: 'select', label: 'Faixa Etária', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'culinaria-cultural',
    name: 'Oficina de Culinária Tradicional',
    description: 'Resgate de receitas e técnicas culinárias tradicionais',
    icon: 'ChefHat',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_culinaria', type: 'select', label: 'Tipo de Culinária', required: true },
      { name: 'nivel_experiencia', type: 'select', label: 'Nível de Experiência', required: true },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'musica-eletronica',
    name: 'Oficina de Música Eletrônica',
    description: 'Produção musical digital e música eletrônica',
    icon: 'Music',
    category: 'Oficinas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'software_interesse', type: 'select', label: 'Software de Interesse', required: true },
      { name: 'nivel_conhecimento', type: 'select', label: 'Nível de Conhecimento', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'pintura-mural',
    name: 'Projeto de Mural Artístico',
    description: 'Solicitação para criação de murais em espaços públicos',
    icon: 'Paintbrush',
    category: 'Arte Urbana',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'local_proposto', type: 'text', label: 'Local Proposto', required: true },
      { name: 'tema_mural', type: 'text', label: 'Tema do Mural', required: true },
      { name: 'dimensoes_aprox', type: 'text', label: 'Dimensões Aproximadas', required: true },
      { name: 'descricao_projeto', type: 'textarea', label: 'Descrição do Projeto', required: true },
    ]
  },
  {
    id: 'festa-junina',
    name: 'Inscrição para Festa Junina Municipal',
    description: 'Participação em festividades juninas',
    icon: 'Flame',
    category: 'Eventos',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_apresentacao', type: 'select', label: 'Tipo de Apresentação', required: true },
      { name: 'num_participantes', type: 'number', label: 'Número de Participantes', required: true },
      { name: 'necessita_espaco', type: 'select', label: 'Necessita Espaço para Ensaio', required: false },
    ]
  },
  {
    id: 'carnaval-blocos',
    name: 'Cadastro de Bloco Carnavalesco',
    description: 'Registro de blocos para o carnaval municipal',
    icon: 'Music',
    category: 'Eventos',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'ano_fundacao', type: 'number', label: 'Ano de Fundação', required: false },
      { name: 'num_integrantes', type: 'number', label: 'Número de Integrantes', required: true },
      { name: 'estilo_musical', type: 'select', label: 'Estilo Musical', required: true },
      { name: 'percurso_proposto', type: 'textarea', label: 'Percurso Proposto', required: false },
    ]
  },
  {
    id: 'eventos-religiosos',
    name: 'Apoio a Manifestações Culturais Religiosas',
    description: 'Solicitação de apoio para festas e eventos religiosos',
    icon: 'Church',
    category: 'Eventos',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_manifestacao', type: 'text', label: 'Tipo de Manifestação', required: true },
      { name: 'data_evento', type: 'date', label: 'Data do Evento', required: true },
      { name: 'publico_esperado', type: 'number', label: 'Público Esperado', required: true },
      { name: 'tipo_apoio', type: 'textarea', label: 'Tipo de Apoio Solicitado', required: true },
    ]
  },
  {
    id: 'feira-artesanato',
    name: 'Inscrição para Feira de Artesanato',
    description: 'Participação em feiras culturais de artesanato',
    icon: 'Store',
    category: 'Eventos',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_artesanato', type: 'select', label: 'Tipo de Artesanato', required: true },
      { name: 'tamanho_estande', type: 'select', label: 'Tamanho de Estande Desejado', required: true },
      { name: 'descricao_produtos', type: 'textarea', label: 'Descrição dos Produtos', required: true },
    ]
  },
  {
    id: 'circo-apresentacao',
    name: 'Apresentação de Circo Municipal',
    description: 'Solicitação de apresentação circense em eventos',
    icon: 'Tent',
    category: 'Eventos',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_evento', type: 'text', label: 'Tipo de Evento', required: true },
      { name: 'data_solicitada', type: 'date', label: 'Data Solicitada', required: true },
      { name: 'local_apresentacao', type: 'text', label: 'Local da Apresentação', required: true },
      { name: 'publico_esperado', type: 'number', label: 'Público Esperado', required: true },
    ]
  },
  {
    id: 'pesquisa-cultural',
    name: 'Solicitação de Pesquisa em Acervo Cultural',
    description: 'Acesso a documentos e acervos para pesquisa',
    icon: 'Search',
    category: 'Pesquisa',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'instituicao_vinculo', type: 'text', label: 'Instituição de Vínculo', required: false },
      { name: 'tema_pesquisa', type: 'text', label: 'Tema da Pesquisa', required: true },
      { name: 'periodo_interesse', type: 'text', label: 'Período de Interesse', required: false },
      { name: 'objetivos_pesquisa', type: 'textarea', label: 'Objetivos da Pesquisa', required: true },
    ]
  },
  {
    id: 'clube-leitura',
    name: 'Inscrição em Clube de Leitura',
    description: 'Participação em grupos de leitura na biblioteca',
    icon: 'BookOpen',
    category: 'Bibliotecas',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'genero_literario', type: 'select', label: 'Gênero Literário de Preferência', required: true },
      { name: 'disponibilidade_encontros', type: 'select', label: 'Disponibilidade para Encontros', required: true },
    ]
  },
  {
    id: 'doacao-livros',
    name: 'Doação de Livros para Biblioteca',
    description: 'Doação de acervo literário para biblioteca pública',
    icon: 'BookHeart',
    category: 'Bibliotecas',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'quantidade_livros', type: 'number', label: 'Quantidade de Livros', required: true },
      { name: 'tipo_livros', type: 'select', label: 'Tipo de Livros', required: true },
      { name: 'forma_entrega', type: 'select', label: 'Forma de Entrega', required: true },
    ]
  },
  {
    id: 'lampiao-gas',
    name: 'Cadastro de Lampiões de Gás (Patrimônio)',
    description: 'Registro e manutenção de lampiões históricos',
    icon: 'Lamp',
    category: 'Patrimônio',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'localizacao_lampiao', type: 'text', label: 'Localização do Lampião', required: true },
      { name: 'estado_conservacao', type: 'select', label: 'Estado de Conservação', required: true },
      { name: 'tipo_solicitacao', type: 'select', label: 'Tipo de Solicitação', required: true },
    ]
  }
];
