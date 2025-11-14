// Pool de sugestões de serviços para cada secretaria
// Cada sugestão inclui campos sugeridos para o formulário dinâmico

export interface FormFieldSuggestion {
  name: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'cpf' | 'cnpj' | 'cep';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ServiceSuggestion {
  id: string;
  name: string;
  description: string;
  icon: string;
  suggestedFields: FormFieldSuggestion[];
  category: string;
  estimatedDays: number;
  requiresDocuments: boolean;
}

export const SUGGESTIONS_POOL: Record<string, ServiceSuggestion[]> = {
  agricultura: [
    {
      id: 'cadastro-produtor-rural',
      name: 'Cadastro de Produtor Rural',
      description: 'Registre produtores rurais do município com informações detalhadas',
      icon: 'Users',
      category: 'Cadastro',
      estimatedDays: 5,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: false },
        { name: 'endereco_propriedade', type: 'textarea', label: 'Endereço da Propriedade', required: true },
        { name: 'area_hectares', type: 'number', label: 'Área em Hectares', required: true },
        { name: 'tipo_producao', type: 'select', label: 'Tipo de Produção', required: true, options: ['Agricultura Familiar', 'Agronegócio', 'Pecuária', 'Silvicultura', 'Mista'] },
      ]
    },
    {
      id: 'solicitacao-assistencia-tecnica',
      name: 'Solicitação de Assistência Técnica Rural',
      description: 'Solicite assistência técnica especializada para propriedades rurais',
      icon: 'Wrench',
      category: 'Assistência',
      estimatedDays: 7,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_produtor', type: 'text', label: 'Nome do Produtor', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone de Contato', required: true },
        { name: 'tipo_assistencia', type: 'select', label: 'Tipo de Assistência', required: true, options: ['Manejo de Solo', 'Controle de Pragas', 'Irrigação', 'Pecuária', 'Produção Orgânica', 'Outro'] },
        { name: 'descricao_problema', type: 'textarea', label: 'Descrição do Problema', required: true },
        { name: 'urgencia', type: 'select', label: 'Nível de Urgência', required: true, options: ['Baixa', 'Média', 'Alta', 'Urgente'] },
      ]
    },
    {
      id: 'licenca-uso-agua',
      name: 'Licença para Uso de Água',
      description: 'Solicite licença para captação e uso de recursos hídricos',
      icon: 'Droplet',
      category: 'Licenciamento',
      estimatedDays: 15,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_requerente', type: 'text', label: 'Nome do Requerente', required: true },
        { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
        { name: 'endereco_propriedade', type: 'textarea', label: 'Endereço da Propriedade', required: true },
        { name: 'fonte_agua', type: 'select', label: 'Fonte de Água', required: true, options: ['Rio', 'Córrego', 'Lago', 'Poço Artesiano', 'Nascente'] },
        { name: 'finalidade', type: 'select', label: 'Finalidade do Uso', required: true, options: ['Irrigação', 'Dessedentação Animal', 'Consumo Humano', 'Industrial'] },
        { name: 'vazao_solicitada', type: 'number', label: 'Vazão Solicitada (L/s)', required: true },
      ]
    },
    {
      id: 'credito-rural',
      name: 'Solicitação de Crédito Rural',
      description: 'Solicite linhas de crédito para financiamento de atividades rurais',
      icon: 'DollarSign',
      category: 'Financiamento',
      estimatedDays: 10,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_produtor', type: 'text', label: 'Nome do Produtor', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'area_propriedade', type: 'number', label: 'Área da Propriedade (ha)', required: true },
        { name: 'finalidade_credito', type: 'select', label: 'Finalidade do Crédito', required: true, options: ['Custeio', 'Investimento', 'Comercialização', 'Industrialização'] },
        { name: 'valor_solicitado', type: 'number', label: 'Valor Solicitado (R$)', required: true },
        { name: 'projeto_tecnico', type: 'textarea', label: 'Descrição do Projeto', required: true },
      ]
    },
  ],

  'assistencia-social': [
    {
      id: 'cadastro-beneficiario-bolsa-familia',
      name: 'Cadastro Bolsa Família',
      description: 'Cadastro e atualização de beneficiários do Bolsa Família',
      icon: 'Users',
      category: 'Cadastro',
      estimatedDays: 3,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_responsavel', type: 'text', label: 'Nome do Responsável Familiar', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco', type: 'textarea', label: 'Endereço Completo', required: true },
        { name: 'renda_familiar', type: 'number', label: 'Renda Familiar Mensal (R$)', required: true },
        { name: 'numero_dependentes', type: 'number', label: 'Número de Dependentes', required: true },
      ]
    },
    {
      id: 'solicitacao-cesta-basica',
      name: 'Solicitação de Cesta Básica',
      description: 'Solicite cestas básicas para famílias em situação de vulnerabilidade',
      icon: 'ShoppingBasket',
      category: 'Assistência',
      estimatedDays: 2,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_solicitante', type: 'text', label: 'Nome do Solicitante', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco', type: 'textarea', label: 'Endereço Completo', required: true },
        { name: 'numero_pessoas', type: 'number', label: 'Número de Pessoas na Família', required: true },
        { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: false },
        { name: 'motivo_solicitacao', type: 'textarea', label: 'Motivo da Solicitação', required: true },
      ]
    },
    {
      id: 'acolhimento-institucional',
      name: 'Solicitação de Acolhimento Institucional',
      description: 'Solicite acolhimento para crianças, adolescentes ou idosos',
      icon: 'Home',
      category: 'Acolhimento',
      estimatedDays: 1,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_acolhido', type: 'text', label: 'Nome da Pessoa a ser Acolhida', required: true },
        { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { name: 'tipo_acolhimento', type: 'select', label: 'Tipo de Acolhimento', required: true, options: ['Criança/Adolescente', 'Idoso', 'Situação de Rua', 'Violência Doméstica'] },
        { name: 'nome_solicitante', type: 'text', label: 'Nome do Solicitante', required: true },
        { name: 'parentesco', type: 'text', label: 'Parentesco/Vínculo', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone de Contato', required: true },
        { name: 'situacao_atual', type: 'textarea', label: 'Descrição da Situação Atual', required: true },
      ]
    },
  ],

  cultura: [
    {
      id: 'inscricao-oficina-cultural',
      name: 'Inscrição em Oficinas Culturais',
      description: 'Inscreva-se em oficinas de música, dança, teatro e artes',
      icon: 'Music',
      category: 'Oficinas',
      estimatedDays: 3,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_participante', type: 'text', label: 'Nome do Participante', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'tipo_oficina', type: 'select', label: 'Tipo de Oficina', required: true, options: ['Música', 'Dança', 'Teatro', 'Artes Plásticas', 'Literatura', 'Artesanato'] },
        { name: 'experiencia_anterior', type: 'select', label: 'Experiência Anterior', required: true, options: ['Nenhuma', 'Iniciante', 'Intermediário', 'Avançado'] },
      ]
    },
    {
      id: 'cadastro-artista-local',
      name: 'Cadastro de Artista Local',
      description: 'Cadastre-se como artista local para participar de eventos culturais',
      icon: 'User',
      category: 'Cadastro',
      estimatedDays: 5,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_artistico', type: 'text', label: 'Nome Artístico', required: true },
        { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'area_atuacao', type: 'select', label: 'Área de Atuação', required: true, options: ['Música', 'Dança', 'Teatro', 'Artes Visuais', 'Literatura', 'Artesanato', 'Fotografia', 'Cinema'] },
        { name: 'biografia', type: 'textarea', label: 'Biografia/Histórico Artístico', required: true },
      ]
    },
    {
      id: 'solicitacao-espaco-cultural',
      name: 'Solicitação de Espaço Cultural',
      description: 'Solicite espaços culturais para eventos e apresentações',
      icon: 'Building',
      category: 'Espaços',
      estimatedDays: 7,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_solicitante', type: 'text', label: 'Nome do Solicitante', required: true },
        { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'tipo_evento', type: 'text', label: 'Tipo de Evento', required: true },
        { name: 'data_evento', type: 'date', label: 'Data do Evento', required: true },
        { name: 'horario_inicio', type: 'text', label: 'Horário de Início', required: true },
        { name: 'horario_fim', type: 'text', label: 'Horário de Término', required: true },
        { name: 'publico_estimado', type: 'number', label: 'Público Estimado', required: true },
        { name: 'descricao_evento', type: 'textarea', label: 'Descrição do Evento', required: true },
      ]
    },
  ],

  educacao: [
    {
      id: 'matricula-escolar',
      name: 'Matrícula Escolar',
      description: 'Realize a matrícula de estudantes na rede municipal de ensino',
      icon: 'GraduationCap',
      category: 'Matrícula',
      estimatedDays: 5,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_aluno', type: 'text', label: 'Nome Completo do Aluno', required: true },
        { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { name: 'cpf_aluno', type: 'cpf', label: 'CPF do Aluno', required: false },
        { name: 'nome_responsavel', type: 'text', label: 'Nome do Responsável', required: true },
        { name: 'cpf_responsavel', type: 'cpf', label: 'CPF do Responsável', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone de Contato', required: true },
        { name: 'endereco', type: 'textarea', label: 'Endereço Completo', required: true },
        { name: 'serie_pretendida', type: 'select', label: 'Série Pretendida', required: true, options: ['Educação Infantil', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'] },
        { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true, options: ['Manhã', 'Tarde', 'Integral'] },
      ]
    },
    {
      id: 'solicitacao-transporte-escolar',
      name: 'Solicitação de Transporte Escolar',
      description: 'Solicite transporte escolar para estudantes da zona rural',
      icon: 'Bus',
      category: 'Transporte',
      estimatedDays: 7,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_aluno', type: 'text', label: 'Nome do Aluno', required: true },
        { name: 'escola', type: 'text', label: 'Nome da Escola', required: true },
        { name: 'serie', type: 'text', label: 'Série/Ano', required: true },
        { name: 'nome_responsavel', type: 'text', label: 'Nome do Responsável', required: true },
        { name: 'cpf_responsavel', type: 'cpf', label: 'CPF do Responsável', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco_residencia', type: 'textarea', label: 'Endereço de Residência', required: true },
        { name: 'distancia_escola', type: 'number', label: 'Distância até a Escola (km)', required: true },
        { name: 'turno', type: 'select', label: 'Turno Escolar', required: true, options: ['Manhã', 'Tarde', 'Noite'] },
      ]
    },
    {
      id: 'solicitacao-merenda-especial',
      name: 'Solicitação de Merenda Especial',
      description: 'Solicite merenda escolar adaptada para necessidades alimentares especiais',
      icon: 'UtensilsCrossed',
      category: 'Alimentação',
      estimatedDays: 10,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_aluno', type: 'text', label: 'Nome do Aluno', required: true },
        { name: 'escola', type: 'text', label: 'Escola', required: true },
        { name: 'serie', type: 'text', label: 'Série/Ano', required: true },
        { name: 'nome_responsavel', type: 'text', label: 'Nome do Responsável', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'tipo_restricao', type: 'select', label: 'Tipo de Restrição', required: true, options: ['Alergia Alimentar', 'Intolerância (Lactose/Glúten)', 'Diabetes', 'Doença Celíaca', 'Outra'] },
        { name: 'alimentos_restritos', type: 'textarea', label: 'Alimentos Restritos', required: true },
        { name: 'observacoes_medicas', type: 'textarea', label: 'Observações Médicas', required: false },
      ]
    },
  ],

  esportes: [
    {
      id: 'inscricao-escolinha-esporte',
      name: 'Inscrição em Escolinha de Esportes',
      description: 'Inscreva-se em escolinhas esportivas municipais',
      icon: 'Trophy',
      category: 'Escolinhas',
      estimatedDays: 3,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_atleta', type: 'text', label: 'Nome do Atleta', required: true },
        { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: false },
        { name: 'nome_responsavel', type: 'text', label: 'Nome do Responsável (se menor)', required: false },
        { name: 'telefone', type: 'tel', label: 'Telefone de Contato', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: false },
        { name: 'modalidade', type: 'select', label: 'Modalidade Esportiva', required: true, options: ['Futebol', 'Vôlei', 'Basquete', 'Handebol', 'Atletismo', 'Natação', 'Judô', 'Karatê'] },
        { name: 'experiencia', type: 'select', label: 'Nível de Experiência', required: true, options: ['Iniciante', 'Intermediário', 'Avançado'] },
      ]
    },
    {
      id: 'reserva-quadra-esportiva',
      name: 'Reserva de Quadra Esportiva',
      description: 'Reserve quadras esportivas municipais para eventos e treinos',
      icon: 'CalendarCheck',
      category: 'Reservas',
      estimatedDays: 2,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_solicitante', type: 'text', label: 'Nome do Solicitante', required: true },
        { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'tipo_evento', type: 'select', label: 'Tipo de Evento', required: true, options: ['Treino', 'Campeonato', 'Torneio', 'Evento Comunitário', 'Aula'] },
        { name: 'modalidade', type: 'text', label: 'Modalidade Esportiva', required: true },
        { name: 'data_reserva', type: 'date', label: 'Data da Reserva', required: true },
        { name: 'horario_inicio', type: 'text', label: 'Horário de Início', required: true },
        { name: 'horario_fim', type: 'text', label: 'Horário de Término', required: true },
        { name: 'numero_participantes', type: 'number', label: 'Número de Participantes', required: true },
      ]
    },
    {
      id: 'cadastro-equipe-competicao',
      name: 'Cadastro de Equipe para Competições',
      description: 'Cadastre equipes para participar de competições municipais',
      icon: 'Users',
      category: 'Competições',
      estimatedDays: 5,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_equipe', type: 'text', label: 'Nome da Equipe', required: true },
        { name: 'modalidade', type: 'select', label: 'Modalidade', required: true, options: ['Futebol', 'Futsal', 'Vôlei', 'Basquete', 'Handebol'] },
        { name: 'categoria', type: 'select', label: 'Categoria', required: true, options: ['Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto', 'Master'] },
        { name: 'nome_responsavel', type: 'text', label: 'Nome do Responsável', required: true },
        { name: 'cpf_responsavel', type: 'cpf', label: 'CPF do Responsável', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'numero_atletas', type: 'number', label: 'Número de Atletas', required: true },
      ]
    },
  ],

  habitacao: [
    {
      id: 'cadastro-habitacional',
      name: 'Cadastro Habitacional',
      description: 'Cadastre-se para programas habitacionais municipais',
      icon: 'Home',
      category: 'Cadastro',
      estimatedDays: 7,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: false },
        { name: 'estado_civil', type: 'select', label: 'Estado Civil', required: true, options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        { name: 'renda_familiar', type: 'number', label: 'Renda Familiar Mensal (R$)', required: true },
        { name: 'numero_dependentes', type: 'number', label: 'Número de Dependentes', required: true },
        { name: 'situacao_moradia', type: 'select', label: 'Situação Atual de Moradia', required: true, options: ['Aluguel', 'Cedido', 'Próprio', 'Área de Risco', 'Situação de Rua'] },
      ]
    },
    {
      id: 'reforma-habitacional',
      name: 'Solicitação de Reforma Habitacional',
      description: 'Solicite auxílio para reforma de moradia',
      icon: 'Wrench',
      category: 'Reforma',
      estimatedDays: 15,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_proprietario', type: 'text', label: 'Nome do Proprietário', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco_imovel', type: 'textarea', label: 'Endereço do Imóvel', required: true },
        { name: 'tipo_reforma', type: 'select', label: 'Tipo de Reforma', required: true, options: ['Telhado', 'Elétrica', 'Hidráulica', 'Pintura', 'Ampliação', 'Acessibilidade'] },
        { name: 'descricao_necessidade', type: 'textarea', label: 'Descrição da Necessidade', required: true },
        { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      ]
    },
    {
      id: 'regularizacao-fundiaria',
      name: 'Regularização Fundiária',
      description: 'Solicite regularização de propriedade urbana',
      icon: 'FileText',
      category: 'Regularização',
      estimatedDays: 30,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_requerente', type: 'text', label: 'Nome do Requerente', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco_imovel', type: 'textarea', label: 'Endereço do Imóvel', required: true },
        { name: 'tempo_posse', type: 'number', label: 'Tempo de Posse (anos)', required: true },
        { name: 'area_terreno', type: 'number', label: 'Área do Terreno (m²)', required: true },
        { name: 'possui_construcao', type: 'select', label: 'Possui Construção', required: true, options: ['Sim', 'Não'] },
      ]
    },
  ],

  'meio-ambiente': [
    {
      id: 'licenca-ambiental',
      name: 'Solicitação de Licença Ambiental',
      description: 'Solicite licença ambiental para atividades e empreendimentos',
      icon: 'FileCheck',
      category: 'Licenciamento',
      estimatedDays: 30,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_requerente', type: 'text', label: 'Nome do Requerente', required: true },
        { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'tipo_atividade', type: 'select', label: 'Tipo de Atividade', required: true, options: ['Industrial', 'Comercial', 'Serviços', 'Agropecuária', 'Mineração', 'Construção Civil'] },
        { name: 'endereco_empreendimento', type: 'textarea', label: 'Endereço do Empreendimento', required: true },
        { name: 'descricao_atividade', type: 'textarea', label: 'Descrição da Atividade', required: true },
        { name: 'area_total', type: 'number', label: 'Área Total (m²)', required: true },
      ]
    },
    {
      id: 'poda-arvore',
      name: 'Solicitação de Poda de Árvore',
      description: 'Solicite poda de árvores em vias públicas ou propriedades',
      icon: 'TreeDeciduous',
      category: 'Manutenção',
      estimatedDays: 10,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_solicitante', type: 'text', label: 'Nome do Solicitante', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco_arvore', type: 'textarea', label: 'Endereço da Árvore', required: true },
        { name: 'tipo_local', type: 'select', label: 'Local', required: true, options: ['Via Pública', 'Calçada', 'Propriedade Privada'] },
        { name: 'motivo_poda', type: 'select', label: 'Motivo da Poda', required: true, options: ['Galhos sobre Fiação', 'Obstrução de Visibilidade', 'Risco de Queda', 'Invasão de Propriedade', 'Manutenção Preventiva'] },
        { name: 'descricao', type: 'textarea', label: 'Descrição Detalhada', required: true },
      ]
    },
    {
      id: 'denuncia-ambiental',
      name: 'Denúncia Ambiental',
      description: 'Denuncie crimes e infrações ambientais',
      icon: 'AlertTriangle',
      category: 'Fiscalização',
      estimatedDays: 3,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_denunciante', type: 'text', label: 'Nome (opcional)', required: false },
        { name: 'telefone', type: 'tel', label: 'Telefone de Contato', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: false },
        { name: 'tipo_infracaо', type: 'select', label: 'Tipo de Infração', required: true, options: ['Desmatamento', 'Poluição de Rios', 'Queimada Ilegal', 'Descarte Irregular de Lixo', 'Maus Tratos a Animais', 'Poluição Sonora', 'Outro'] },
        { name: 'endereco_ocorrencia', type: 'textarea', label: 'Local da Ocorrência', required: true },
        { name: 'descricao_denuncia', type: 'textarea', label: 'Descrição Detalhada', required: true },
      ]
    },
  ],

  'obras-publicas': [
    {
      id: 'solicitacao-tapa-buraco',
      name: 'Solicitação de Tapa-Buraco',
      description: 'Solicite reparo de buracos em vias públicas',
      icon: 'Construction',
      category: 'Manutenção',
      estimatedDays: 7,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_solicitante', type: 'text', label: 'Nome do Solicitante', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco_ocorrencia', type: 'textarea', label: 'Endereço/Localização do Buraco', required: true },
        { name: 'ponto_referencia', type: 'text', label: 'Ponto de Referência', required: true },
        { name: 'tamanho_aproximado', type: 'select', label: 'Tamanho Aproximado', required: true, options: ['Pequeno (até 50cm)', 'Médio (50cm a 1m)', 'Grande (mais de 1m)'] },
        { name: 'nivel_urgencia', type: 'select', label: 'Nível de Urgência', required: true, options: ['Baixa', 'Média', 'Alta', 'Emergencial'] },
      ]
    },
    {
      id: 'iluminacao-publica',
      name: 'Manutenção de Iluminação Pública',
      description: 'Solicite reparo ou instalação de iluminação pública',
      icon: 'Lightbulb',
      category: 'Iluminação',
      estimatedDays: 5,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_solicitante', type: 'text', label: 'Nome do Solicitante', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco', type: 'textarea', label: 'Endereço', required: true },
        { name: 'tipo_solicitacao', type: 'select', label: 'Tipo de Solicitação', required: true, options: ['Lâmpada Queimada', 'Poste Danificado', 'Nova Instalação', 'Fiação Exposta'] },
        { name: 'numero_poste', type: 'text', label: 'Número do Poste (se souber)', required: false },
        { name: 'descricao', type: 'textarea', label: 'Descrição do Problema', required: true },
      ]
    },
    {
      id: 'limpeza-via-publica',
      name: 'Solicitação de Limpeza de Via Pública',
      description: 'Solicite limpeza e manutenção de vias e espaços públicos',
      icon: 'Trash',
      category: 'Limpeza',
      estimatedDays: 3,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_solicitante', type: 'text', label: 'Nome do Solicitante', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco', type: 'textarea', label: 'Endereço/Localização', required: true },
        { name: 'tipo_limpeza', type: 'select', label: 'Tipo de Limpeza', required: true, options: ['Coleta de Entulho', 'Limpeza de Calçada', 'Capina', 'Remoção de Lixo Acumulado', 'Desobstrução de Bueiro'] },
        { name: 'descricao', type: 'textarea', label: 'Descrição', required: true },
      ]
    },
  ],

  'planejamento-urbano': [
    {
      id: 'alvara-construcao',
      name: 'Alvará de Construção',
      description: 'Solicite alvará para construção, reforma ou ampliação',
      icon: 'Building2',
      category: 'Licenciamento',
      estimatedDays: 20,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_proprietario', type: 'text', label: 'Nome do Proprietário', required: true },
        { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'endereco_obra', type: 'textarea', label: 'Endereço da Obra', required: true },
        { name: 'tipo_obra', type: 'select', label: 'Tipo de Obra', required: true, options: ['Construção Nova', 'Reforma', 'Ampliação', 'Demolição'] },
        { name: 'area_construcao', type: 'number', label: 'Área de Construção (m²)', required: true },
        { name: 'numero_pavimentos', type: 'number', label: 'Número de Pavimentos', required: true },
      ]
    },
    {
      id: 'certidao-uso-solo',
      name: 'Certidão de Uso do Solo',
      description: 'Solicite certidão de uso e ocupação do solo urbano',
      icon: 'FileText',
      category: 'Certidões',
      estimatedDays: 10,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_requerente', type: 'text', label: 'Nome do Requerente', required: true },
        { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'endereco_imovel', type: 'textarea', label: 'Endereço do Imóvel', required: true },
        { name: 'finalidade', type: 'select', label: 'Finalidade da Certidão', required: true, options: ['Residencial', 'Comercial', 'Industrial', 'Misto', 'Institucional'] },
      ]
    },
    {
      id: 'parcelamento-solo',
      name: 'Aprovação de Parcelamento de Solo',
      description: 'Solicite aprovação para loteamento ou desmembramento',
      icon: 'Map',
      category: 'Parcelamento',
      estimatedDays: 45,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_requerente', type: 'text', label: 'Nome do Requerente', required: true },
        { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'endereco_area', type: 'textarea', label: 'Localização da Área', required: true },
        { name: 'tipo_parcelamento', type: 'select', label: 'Tipo de Parcelamento', required: true, options: ['Loteamento', 'Desmembramento', 'Remembramento'] },
        { name: 'area_total', type: 'number', label: 'Área Total (m²)', required: true },
        { name: 'numero_lotes', type: 'number', label: 'Número de Lotes Previstos', required: true },
      ]
    },
  ],

  saude: [
    {
      id: 'agendamento-consulta',
      name: 'Agendamento de Consulta Médica',
      description: 'Agende consultas médicas nas unidades de saúde',
      icon: 'Stethoscope',
      category: 'Agendamento',
      estimatedDays: 5,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_paciente', type: 'text', label: 'Nome do Paciente', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'cartao_sus', type: 'text', label: 'Número do Cartão SUS', required: true },
        { name: 'especialidade', type: 'select', label: 'Especialidade', required: true, options: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Cardiologia', 'Ortopedia', 'Dermatologia', 'Oftalmologia'] },
        { name: 'unidade_preferencia', type: 'text', label: 'Unidade de Saúde de Preferência', required: false },
      ]
    },
    {
      id: 'solicitacao-medicamento',
      name: 'Solicitação de Medicamento',
      description: 'Solicite medicamentos disponíveis na farmácia municipal',
      icon: 'Pill',
      category: 'Farmácia',
      estimatedDays: 3,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_paciente', type: 'text', label: 'Nome do Paciente', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'cartao_sus', type: 'text', label: 'Cartão SUS', required: true },
        { name: 'nome_medicamento', type: 'text', label: 'Nome do Medicamento', required: true },
        { name: 'medico_responsavel', type: 'text', label: 'Médico Responsável', required: true },
        { name: 'uso_continuo', type: 'select', label: 'Uso Contínuo', required: true, options: ['Sim', 'Não'] },
      ]
    },
    {
      id: 'cadastro-gestante',
      name: 'Cadastro de Gestante',
      description: 'Cadastre-se no programa de pré-natal',
      icon: 'Baby',
      category: 'Pré-Natal',
      estimatedDays: 2,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_gestante', type: 'text', label: 'Nome da Gestante', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco', type: 'textarea', label: 'Endereço Completo', required: true },
        { name: 'cartao_sus', type: 'text', label: 'Cartão SUS', required: true },
        { name: 'data_ultima_menstruacao', type: 'date', label: 'Data da Última Menstruação', required: true },
        { name: 'primeira_gestacao', type: 'select', label: 'Primeira Gestação', required: true, options: ['Sim', 'Não'] },
      ]
    },
  ],

  'seguranca-publica': [
    {
      id: 'boletim-ocorrencia',
      name: 'Boletim de Ocorrência Online',
      description: 'Registre boletim de ocorrência para crimes de menor potencial ofensivo',
      icon: 'FileText',
      category: 'Ocorrências',
      estimatedDays: 1,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_declarante', type: 'text', label: 'Nome do Declarante', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'tipo_ocorrencia', type: 'select', label: 'Tipo de Ocorrência', required: true, options: ['Furto', 'Perda de Documentos', 'Dano ao Patrimônio', 'Perturbação do Sossego', 'Ameaça', 'Outro'] },
        { name: 'data_ocorrencia', type: 'date', label: 'Data da Ocorrência', required: true },
        { name: 'local_ocorrencia', type: 'textarea', label: 'Local da Ocorrência', required: true },
        { name: 'descricao_fatos', type: 'textarea', label: 'Descrição dos Fatos', required: true },
      ]
    },
    {
      id: 'solicitacao-videomonitoramento',
      name: 'Solicitação de Imagens de Videomonitoramento',
      description: 'Solicite acesso a imagens de câmeras de segurança municipais',
      icon: 'Camera',
      category: 'Videomonitoramento',
      estimatedDays: 7,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_solicitante', type: 'text', label: 'Nome do Solicitante', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'motivo_solicitacao', type: 'select', label: 'Motivo da Solicitação', required: true, options: ['Investigação Policial', 'Processo Judicial', 'Sinistro de Trânsito', 'Outro'] },
        { name: 'local_camera', type: 'textarea', label: 'Local da Câmera', required: true },
        { name: 'data_ocorrencia', type: 'date', label: 'Data da Ocorrência', required: true },
        { name: 'horario_aproximado', type: 'text', label: 'Horário Aproximado', required: true },
      ]
    },
    {
      id: 'cadastro-veiculo-guardа-municipal',
      name: 'Cadastro de Veículo na Guarda Municipal',
      description: 'Cadastre seu veículo para controle e segurança',
      icon: 'Car',
      category: 'Cadastro',
      estimatedDays: 3,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_proprietario', type: 'text', label: 'Nome do Proprietário', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'placa_veiculo', type: 'text', label: 'Placa do Veículo', required: true },
        { name: 'marca_modelo', type: 'text', label: 'Marca/Modelo', required: true },
        { name: 'cor', type: 'text', label: 'Cor', required: true },
        { name: 'ano_fabricacao', type: 'number', label: 'Ano de Fabricação', required: true },
      ]
    },
  ],

  'servicos-publicos': [
    {
      id: 'segunda-via-conta-agua',
      name: 'Segunda Via de Conta de Água',
      description: 'Solicite segunda via de conta de água e esgoto',
      icon: 'FileText',
      category: 'Segunda Via',
      estimatedDays: 2,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_titular', type: 'text', label: 'Nome do Titular', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'numero_conta', type: 'text', label: 'Número da Conta/Matrícula', required: true },
        { name: 'endereco_imovel', type: 'textarea', label: 'Endereço do Imóvel', required: true },
        { name: 'mes_referencia', type: 'text', label: 'Mês de Referência', required: true },
      ]
    },
    {
      id: 'religacao-agua',
      name: 'Solicitação de Religação de Água',
      description: 'Solicite religação de água após corte ou suspensão',
      icon: 'Droplet',
      category: 'Água e Esgoto',
      estimatedDays: 3,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_titular', type: 'text', label: 'Nome do Titular', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'numero_conta', type: 'text', label: 'Número da Conta', required: true },
        { name: 'endereco_imovel', type: 'textarea', label: 'Endereço do Imóvel', required: true },
        { name: 'motivo_corte', type: 'select', label: 'Motivo do Corte', required: true, options: ['Inadimplência', 'Solicitação do Titular', 'Obra/Manutenção', 'Outro'] },
      ]
    },
    {
      id: 'coleta-seletiva',
      name: 'Cadastro em Coleta Seletiva',
      description: 'Cadastre-se no programa de coleta seletiva de resíduos',
      icon: 'RecycleIcon',
      category: 'Limpeza',
      estimatedDays: 5,
      requiresDocuments: false,
      suggestedFields: [
        { name: 'nome_responsavel', type: 'text', label: 'Nome do Responsável', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'endereco', type: 'textarea', label: 'Endereço Completo', required: true },
        { name: 'tipo_imovel', type: 'select', label: 'Tipo de Imóvel', required: true, options: ['Residencial', 'Comercial', 'Condomínio', 'Instituição'] },
        { name: 'quantidade_pessoas', type: 'number', label: 'Quantidade de Pessoas/Funcionários', required: true },
      ]
    },
  ],

  turismo: [
    {
      id: 'cadastro-guia-turistico',
      name: 'Cadastro de Guia Turístico',
      description: 'Cadastre-se como guia turístico oficial do município',
      icon: 'MapPin',
      category: 'Cadastro',
      estimatedDays: 10,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
        { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { name: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'cadastur', type: 'text', label: 'Número CADASTUR (se possuir)', required: false },
        { name: 'idiomas', type: 'text', label: 'Idiomas que Domina', required: true },
        { name: 'areas_especializacao', type: 'textarea', label: 'Áreas de Especialização', required: true },
      ]
    },
    {
      id: 'cadastro-estabelecimento-turistico',
      name: 'Cadastro de Estabelecimento Turístico',
      description: 'Cadastre hotéis, pousadas e estabelecimentos turísticos',
      icon: 'Building',
      category: 'Cadastro',
      estimatedDays: 15,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_estabelecimento', type: 'text', label: 'Nome do Estabelecimento', required: true },
        { name: 'cnpj', type: 'cnpj', label: 'CNPJ', required: true },
        { name: 'nome_responsavel', type: 'text', label: 'Nome do Responsável', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'endereco', type: 'textarea', label: 'Endereço Completo', required: true },
        { name: 'tipo_estabelecimento', type: 'select', label: 'Tipo de Estabelecimento', required: true, options: ['Hotel', 'Pousada', 'Hostel', 'Restaurante', 'Agência de Turismo', 'Atração Turística', 'Outro'] },
        { name: 'capacidade', type: 'number', label: 'Capacidade de Atendimento', required: true },
      ]
    },
    {
      id: 'autorizacao-evento-turistico',
      name: 'Autorização para Evento Turístico',
      description: 'Solicite autorização para realização de eventos turísticos',
      icon: 'Calendar',
      category: 'Eventos',
      estimatedDays: 20,
      requiresDocuments: true,
      suggestedFields: [
        { name: 'nome_evento', type: 'text', label: 'Nome do Evento', required: true },
        { name: 'nome_organizador', type: 'text', label: 'Nome do Organizador', required: true },
        { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'tipo_evento', type: 'select', label: 'Tipo de Evento', required: true, options: ['Festival', 'Feira', 'Exposição', 'Tour', 'Competição Esportiva', 'Evento Cultural', 'Outro'] },
        { name: 'data_evento', type: 'date', label: 'Data do Evento', required: true },
        { name: 'local_evento', type: 'textarea', label: 'Local do Evento', required: true },
        { name: 'publico_estimado', type: 'number', label: 'Público Estimado', required: true },
        { name: 'descricao_evento', type: 'textarea', label: 'Descrição do Evento', required: true },
      ]
    },
  ],
};

export function getSuggestionsForDepartment(departmentCode: string): ServiceSuggestion[] {
  return SUGGESTIONS_POOL[departmentCode] || [];
}
