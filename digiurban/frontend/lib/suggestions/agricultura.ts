import { ServiceSuggestion } from './types';

export const agriculturaSuggestions: ServiceSuggestion[] = [
  {
    id: 'cadastro-produtor-rural',
    name: 'Cadastro de Produtor Rural',
    description: 'Registro oficial de produtor rural do município',
    icon: 'Users',
    category: 'Cadastro',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_propriedade', type: 'text', label: 'Endereço da Propriedade', required: true },
      { name: 'tamanho_propriedade', type: 'number', label: 'Tamanho da Propriedade (hectares)', required: true },
      { name: 'tipo_producao', type: 'select', label: 'Tipo de Produção', required: true },
      { name: 'possui_dap', type: 'select', label: 'Possui DAP (Declaração de Aptidão ao PRONAF)', required: false },
    ]
  },
  {
    id: 'dap-declaracao',
    name: 'DAP - Declaração de Aptidão ao PRONAF',
    description: 'Emissão e renovação de DAP para agricultura familiar',
    icon: 'FileText',
    category: 'Cadastro',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_propriedade', type: 'text', label: 'Endereço da Propriedade', required: true },
      { name: 'area_total', type: 'number', label: 'Área Total (hectares)', required: true },
      { name: 'renda_bruta_anual', type: 'number', label: 'Renda Bruta Anual Estimada (R$)', required: true },
      { name: 'num_membros_familia', type: 'number', label: 'Número de Membros da Família', required: true },
      { name: 'tipo_renovacao', type: 'select', label: 'Tipo de Solicitação', required: true },
    ]
  },
  {
    id: 'emprestimo-maquinas',
    name: 'Empréstimo de Máquinas Agrícolas',
    description: 'Solicitação de empréstimo de tratores e implementos',
    icon: 'Tractor',
    category: 'Mecanização',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_maquina', type: 'select', label: 'Tipo de Máquina/Implemento', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade do Uso', required: true },
      { name: 'area_trabalhar', type: 'number', label: 'Área a Trabalhar (hectares)', required: true },
      { name: 'data_preferencial', type: 'date', label: 'Data Preferencial de Uso', required: true },
      { name: 'periodo_necessario', type: 'number', label: 'Período Necessário (dias)', required: true },
    ]
  },
  {
    id: 'cadastro-cooperativa',
    name: 'Cadastro de Cooperativa Rural',
    description: 'Registro de cooperativas e associações rurais',
    icon: 'Users',
    category: 'Cadastro',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cnpj', type: 'cnpj', label: 'CNPJ', required: true },
      { name: 'cpf_presidente', type: 'cpf', label: 'CPF do Presidente', required: true },
      { name: 'num_cooperados', type: 'number', label: 'Número de Cooperados', required: true },
      { name: 'area_atuacao', type: 'select', label: 'Área de Atuação', required: true },
    ]
  },
  {
    id: 'cadastro-agroindustria',
    name: 'Cadastro de Agroindústria Familiar',
    description: 'Registro de agroindústrias de pequeno porte',
    icon: 'Factory',
    category: 'Cadastro',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_produto', type: 'select', label: 'Tipo de Produto', required: true },
      { name: 'endereco_agroindustria', type: 'text', label: 'Endereço da Agroindústria', required: true },
      { name: 'producao_mensal', type: 'number', label: 'Produção Mensal Estimada (kg)', required: false },
      { name: 'possui_alvara', type: 'select', label: 'Possui Alvará Sanitário', required: false },
    ]
  },
  {
    id: 'cadastro-apicultor',
    name: 'Cadastro de Apicultor',
    description: 'Registro de produtores de mel e derivados',
    icon: 'Hexagon',
    category: 'Cadastro',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_colmeias', type: 'number', label: 'Número de Colmeias', required: true },
      { name: 'local_apiario', type: 'text', label: 'Localização do Apiário', required: true },
      { name: 'producao_anual', type: 'number', label: 'Produção Anual Estimada (kg)', required: false },
      { name: 'tipo_producao', type: 'select', label: 'Tipo de Produção', required: true },
    ]
  },
  {
    id: 'licenca-uso-agua',
    name: 'Licença para Uso de Água na Irrigação',
    description: 'Autorização municipal para captação de água',
    icon: 'Droplet',
    category: 'Licenciamento',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_fonte', type: 'select', label: 'Tipo de Fonte de Água', required: true },
      { name: 'vazao_pretendida', type: 'number', label: 'Vazão Pretendida (L/h)', required: true },
      { name: 'area_irrigar', type: 'number', label: 'Área a Irrigar (hectares)', required: true },
      { name: 'cultura_irrigada', type: 'select', label: 'Cultura a ser Irrigada', required: true },
      { name: 'coordenadas_gps', type: 'text', label: 'Coordenadas GPS do Ponto de Captação', required: false },
    ]
  },
  {
    id: 'licenca-poco',
    name: 'Licença para Perfuração de Poço',
    description: 'Autorização para perfuração de poço artesiano ou semi-artesiano',
    icon: 'Droplets',
    category: 'Licenciamento',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_propriedade', type: 'text', label: 'Endereço da Propriedade', required: true },
      { name: 'tipo_poco', type: 'select', label: 'Tipo de Poço', required: true },
      { name: 'profundidade_estimada', type: 'number', label: 'Profundidade Estimada (metros)', required: true },
      { name: 'finalidade_uso', type: 'select', label: 'Finalidade do Uso', required: true },
      { name: 'vazao_pretendida', type: 'number', label: 'Vazão Pretendida (L/h)', required: false },
    ]
  },
  {
    id: 'selo-inspecao-municipal',
    name: 'SIM - Selo de Inspeção Municipal',
    description: 'Certificação sanitária para produtos de origem animal e vegetal',
    icon: 'Shield',
    category: 'Licenciamento',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_estabelecimento', type: 'select', label: 'Tipo de Estabelecimento', required: true },
      { name: 'tipo_produto', type: 'select', label: 'Tipo de Produto', required: true },
      { name: 'endereco_estabelecimento', type: 'text', label: 'Endereço do Estabelecimento', required: true },
      { name: 'volume_producao', type: 'number', label: 'Volume de Produção Mensal', required: true },
    ]
  },
  {
    id: 'assistencia-tecnica',
    name: 'Assistência Técnica e Extensão Rural',
    description: 'Solicitação de visita técnica e orientação',
    icon: 'Wrench',
    category: 'Assistência',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_propriedade', type: 'text', label: 'Endereço da Propriedade', required: true },
      { name: 'tipo_assistencia', type: 'select', label: 'Tipo de Assistência Solicitada', required: true },
      { name: 'cultura_atividade', type: 'select', label: 'Cultura/Atividade', required: true },
      { name: 'descricao_problema', type: 'textarea', label: 'Descrição do Problema/Necessidade', required: true },
    ]
  },
  {
    id: 'analise-solo',
    name: 'Análise de Solo',
    description: 'Coleta e análise de solo para correção e adubação',
    icon: 'TestTube',
    category: 'Assistência',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_coleta', type: 'text', label: 'Local da Coleta', required: true },
      { name: 'area_analisar', type: 'number', label: 'Área a Analisar (hectares)', required: true },
      { name: 'cultura_pretendida', type: 'select', label: 'Cultura Pretendida', required: true },
      { name: 'num_amostras', type: 'number', label: 'Número de Amostras', required: true },
    ]
  },
  {
    id: 'distribuicao-sementes',
    name: 'Distribuição de Sementes e Mudas',
    description: 'Solicitação de sementes e mudas subsidiadas',
    icon: 'Sprout',
    category: 'Insumos',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_semente_muda', type: 'select', label: 'Tipo de Semente/Muda', required: true },
      { name: 'quantidade_solicitada', type: 'number', label: 'Quantidade Solicitada', required: true },
      { name: 'area_plantio', type: 'number', label: 'Área de Plantio (hectares)', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'credito-rural',
    name: 'Orientação para Crédito Rural',
    description: 'Assistência para obtenção de crédito rural e PRONAF',
    icon: 'DollarSign',
    category: 'Crédito',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_credito', type: 'select', label: 'Tipo de Crédito Desejado', required: true },
      { name: 'finalidade_credito', type: 'select', label: 'Finalidade do Crédito', required: true },
      { name: 'valor_estimado', type: 'number', label: 'Valor Estimado (R$)', required: false },
      { name: 'possui_dap', type: 'select', label: 'Possui DAP', required: true },
    ]
  },
  {
    id: 'nota-produtor',
    name: 'Cadastro para Nota Fiscal de Produtor',
    description: 'Habilitação para emissão de nota fiscal de produtor rural',
    icon: 'FileText',
    category: 'Fiscal',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'inscricao_estadual', type: 'text', label: 'Inscrição Estadual (se houver)', required: false },
      { name: 'produtos_comercializar', type: 'textarea', label: 'Produtos a Comercializar', required: true },
      { name: 'volume_mensal', type: 'text', label: 'Volume Mensal Estimado', required: false },
    ]
  },
  {
    id: 'piscicultura-cadastro',
    name: 'Cadastro de Produtor de Piscicultura',
    description: 'Registro de produtores de peixes',
    icon: 'Fish',
    category: 'Cadastro',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'local_producao', type: 'text', label: 'Local de Produção', required: true },
      { name: 'num_tanques', type: 'number', label: 'Número de Tanques', required: true },
      { name: 'area_total', type: 'number', label: 'Área Total de Lâmina d\'água (m²)', required: true },
      { name: 'especies_criadas', type: 'textarea', label: 'Espécies Criadas', required: true },
    ]
  },
  {
    id: 'feira-produtor',
    name: 'Inscrição na Feira do Produtor',
    description: 'Cadastro para venda em feira municipal',
    icon: 'Store',
    category: 'Comercialização',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_produtos', type: 'select', label: 'Tipo de Produtos', required: true },
      { name: 'lista_produtos', type: 'textarea', label: 'Lista de Produtos', required: true },
      { name: 'dia_preferencia', type: 'select', label: 'Dia de Preferência', required: true },
      { name: 'tamanho_banca', type: 'select', label: 'Tamanho de Banca Desejado', required: true },
    ]
  },
  {
    id: 'pnae-cadastro',
    name: 'PNAE - Venda para Merenda Escolar',
    description: 'Cadastro para fornecimento ao Programa Nacional de Alimentação Escolar',
    icon: 'School',
    category: 'Comercialização',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'produtos_oferecer', type: 'textarea', label: 'Produtos a Oferecer', required: true },
      { name: 'capacidade_fornecimento', type: 'text', label: 'Capacidade de Fornecimento', required: true },
      { name: 'possui_dap', type: 'select', label: 'Possui DAP', required: true },
    ]
  },
  {
    id: 'organicos-certificacao',
    name: 'Certificação de Produção Orgânica',
    description: 'Processo de certificação para produtos orgânicos',
    icon: 'Leaf',
    category: 'Certificação',
    estimatedDays: 90,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'area_organica', type: 'number', label: 'Área de Produção Orgânica (hectares)', required: true },
      { name: 'produtos_organicos', type: 'textarea', label: 'Produtos Orgânicos', required: true },
      { name: 'tempo_transicao', type: 'number', label: 'Tempo em Transição (meses)', required: false },
      { name: 'tipo_certificacao', type: 'select', label: 'Tipo de Certificação Desejada', required: true },
    ]
  },
  {
    id: 'patrulha-mecanizada',
    name: 'Patrulha Mecanizada Agrícola',
    description: 'Serviços de aração, gradagem e plantio mecanizado',
    icon: 'Tractor',
    category: 'Mecanização',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'local_servico', type: 'text', label: 'Local do Serviço', required: true },
      { name: 'tipo_servico', type: 'select', label: 'Tipo de Serviço', required: true },
      { name: 'area_trabalhar', type: 'number', label: 'Área a Trabalhar (hectares)', required: true },
      { name: 'data_preferencial', type: 'date', label: 'Data Preferencial', required: true },
    ]
  },
  {
    id: 'vacina-animal',
    name: 'Vacinação Animal',
    description: 'Campanha de vacinação de bovinos, suínos e aves',
    icon: 'Syringe',
    category: 'Sanidade Animal',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_animal', type: 'select', label: 'Tipo de Animal', required: true },
      { name: 'num_animais', type: 'number', label: 'Número de Animais', required: true },
      { name: 'tipo_vacina', type: 'select', label: 'Tipo de Vacina', required: true },
      { name: 'local_vacinacao', type: 'text', label: 'Local da Vacinação', required: true },
    ]
  },
  {
    id: 'gta-guia-transito',
    name: 'GTA - Guia de Trânsito Animal',
    description: 'Emissão de guia para transporte de animais',
    icon: 'Truck',
    category: 'Sanidade Animal',
    estimatedDays: 3,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_animal', type: 'select', label: 'Tipo/Espécie Animal', required: true },
      { name: 'num_animais', type: 'number', label: 'Número de Animais', required: true },
      { name: 'origem', type: 'text', label: 'Origem (Propriedade)', required: true },
      { name: 'destino', type: 'text', label: 'Destino', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade do Transporte', required: true },
    ]
  },
  {
    id: 'curso-capacitacao',
    name: 'Inscrição em Cursos de Capacitação Rural',
    description: 'Cursos para produtores rurais e familiares',
    icon: 'BookOpen',
    category: 'Capacitação',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'curso_interesse', type: 'select', label: 'Curso de Interesse', required: true },
      { name: 'nivel_conhecimento', type: 'select', label: 'Nível de Conhecimento', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'cadastro-horta-comunitaria',
    name: 'Cadastro em Horta Comunitária',
    description: 'Registro para uso de hortas comunitárias municipais',
    icon: 'Sprout',
    category: 'Agricultura Urbana',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'horta_interesse', type: 'select', label: 'Horta de Interesse', required: true },
      { name: 'experiencia_agricultura', type: 'select', label: 'Experiência em Agricultura', required: true },
      { name: 'disponibilidade_semanal', type: 'select', label: 'Disponibilidade Semanal', required: true },
    ]
  },
  {
    id: 'desmatamento-autorizacao',
    name: 'Autorização para Supressão Vegetal',
    description: 'Autorização para desmatamento em área rural',
    icon: 'TreeDeciduous',
    category: 'Licenciamento Ambiental',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'local_propriedade', type: 'text', label: 'Local da Propriedade', required: true },
      { name: 'area_suprimir', type: 'number', label: 'Área a Suprimir (hectares)', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade da Supressão', required: true },
      { name: 'possui_car', type: 'select', label: 'Possui CAR (Cadastro Ambiental Rural)', required: true },
    ]
  },
  {
    id: 'car-cadastro',
    name: 'CAR - Cadastro Ambiental Rural',
    description: 'Cadastro ambiental de propriedades rurais',
    icon: 'Map',
    category: 'Licenciamento Ambiental',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'area_total', type: 'number', label: 'Área Total (hectares)', required: true },
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: true },
      { name: 'possui_app', type: 'select', label: 'Possui APP (Área de Preservação Permanente)', required: false },
    ]
  },
  {
    id: 'agrotoxico-receituario',
    name: 'Receituário Agronômico',
    description: 'Emissão de receita para compra de defensivos agrícolas',
    icon: 'FileWarning',
    category: 'Assistência',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'cultura', type: 'select', label: 'Cultura', required: true },
      { name: 'area_aplicacao', type: 'number', label: 'Área de Aplicação (hectares)', required: true },
      { name: 'praga_doenca', type: 'textarea', label: 'Praga/Doença a Controlar', required: true },
    ]
  },
  {
    id: 'adubo-organico',
    name: 'Distribuição de Adubo Orgânico',
    description: 'Solicitação de composto orgânico e esterco',
    icon: 'Leaf',
    category: 'Insumos',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_adubo', type: 'select', label: 'Tipo de Adubo Orgânico', required: true },
      { name: 'quantidade_solicitada', type: 'number', label: 'Quantidade Solicitada (m³ ou kg)', required: true },
      { name: 'cultura_destino', type: 'select', label: 'Cultura de Destino', required: true },
      { name: 'endereco_entrega', type: 'text', label: 'Endereço para Entrega', required: true },
    ]
  },
  {
    id: 'calcario-distribuicao',
    name: 'Distribuição de Calcário',
    description: 'Programa de correção de solo com calcário',
    icon: 'Mountain',
    category: 'Insumos',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'area_aplicar', type: 'number', label: 'Área a Aplicar (hectares)', required: true },
      { name: 'analise_solo', type: 'select', label: 'Possui Análise de Solo Recente', required: true },
      { name: 'cultura_pretendida', type: 'select', label: 'Cultura Pretendida', required: true },
      { name: 'local_entrega', type: 'text', label: 'Local de Entrega', required: true },
    ]
  },
  {
    id: 'tanque-peixe',
    name: 'Construção de Tanque para Piscicultura',
    description: 'Apoio técnico e financeiro para tanques escavados',
    icon: 'Waves',
    category: 'Infraestrutura',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'local_construcao', type: 'text', label: 'Local da Construção', required: true },
      { name: 'dimensoes_tanque', type: 'text', label: 'Dimensões do Tanque (m²)', required: true },
      { name: 'fonte_agua', type: 'select', label: 'Fonte de Água', required: true },
      { name: 'especie_criar', type: 'select', label: 'Espécie a Criar', required: true },
    ]
  },
  {
    id: 'irrigacao-projeto',
    name: 'Projeto de Sistema de Irrigação',
    description: 'Elaboração de projeto técnico de irrigação',
    icon: 'Droplets',
    category: 'Assistência',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'area_irrigar', type: 'number', label: 'Área a Irrigar (hectares)', required: true },
      { name: 'fonte_agua', type: 'select', label: 'Fonte de Água Disponível', required: true },
      { name: 'tipo_cultura', type: 'select', label: 'Tipo de Cultura', required: true },
      { name: 'sistema_desejado', type: 'select', label: 'Sistema de Irrigação Desejado', required: false },
    ]
  },
  {
    id: 'cerca-eletrica',
    name: 'Curso de Instalação de Cerca Elétrica',
    description: 'Capacitação para instalação e manejo de cerca elétrica',
    icon: 'Zap',
    category: 'Capacitação',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_criacao', type: 'select', label: 'Tipo de Criação', required: true },
      { name: 'area_propriedade', type: 'number', label: 'Área da Propriedade (hectares)', required: false },
      { name: 'experiencia_cerca', type: 'select', label: 'Experiência com Cerca Elétrica', required: true },
    ]
  },
  {
    id: 'silagem-orientacao',
    name: 'Orientação para Produção de Silagem',
    description: 'Assistência técnica para ensilagem',
    icon: 'Package',
    category: 'Assistência',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_silagem', type: 'select', label: 'Tipo de Silagem', required: true },
      { name: 'volume_produzir', type: 'number', label: 'Volume a Produzir (toneladas)', required: true },
      { name: 'num_animais', type: 'number', label: 'Número de Animais', required: true },
    ]
  },
  {
    id: 'inseminacao-artificial',
    name: 'Programa de Inseminação Artificial',
    description: 'Serviço de inseminação artificial em bovinos',
    icon: 'HeartPulse',
    category: 'Sanidade Animal',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'num_femeas', type: 'number', label: 'Número de Fêmeas', required: true },
      { name: 'raca_desejada', type: 'select', label: 'Raça Desejada', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade (Leite/Corte)', required: true },
    ]
  },
  {
    id: 'castanha-programa',
    name: 'Programa de Fomento à Castanha',
    description: 'Apoio a produtores de castanha e nozes',
    icon: 'Nut',
    category: 'Fomento',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_castanha', type: 'select', label: 'Tipo de Castanha', required: true },
      { name: 'area_plantada', type: 'number', label: 'Área Plantada (hectares)', required: false },
      { name: 'num_arvores', type: 'number', label: 'Número de Árvores', required: true },
      { name: 'producao_anual', type: 'number', label: 'Produção Anual (kg)', required: false },
    ]
  },
  {
    id: 'fruticultura-mudas',
    name: 'Distribuição de Mudas Frutíferas',
    description: 'Programa de fomento à fruticultura',
    icon: 'Apple',
    category: 'Insumos',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_fruta', type: 'select', label: 'Tipo de Fruta', required: true },
      { name: 'num_mudas', type: 'number', label: 'Número de Mudas Desejadas', required: true },
      { name: 'area_plantio', type: 'number', label: 'Área de Plantio (hectares)', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'olericultura-projeto',
    name: 'Projeto de Olericultura (Horta)',
    description: 'Implantação de horta comercial',
    icon: 'Carrot',
    category: 'Projetos',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'area_disponivel', type: 'number', label: 'Área Disponível (m² ou hectares)', required: true },
      { name: 'tipo_cultivo', type: 'select', label: 'Tipo de Cultivo', required: true },
      { name: 'possui_irrigacao', type: 'select', label: 'Possui Irrigação', required: true },
      { name: 'hortalizas_interesse', type: 'textarea', label: 'Hortaliças de Interesse', required: true },
    ]
  },
  {
    id: 'mandioca-processamento',
    name: 'Casa de Farinha Comunitária',
    description: 'Agendamento de uso de casa de farinha',
    icon: 'Wheat',
    category: 'Infraestrutura',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'quantidade_mandioca', type: 'number', label: 'Quantidade de Mandioca (kg)', required: true },
      { name: 'data_preferencial', type: 'date', label: 'Data Preferencial', required: true },
      { name: 'produto_final', type: 'select', label: 'Produto Final Desejado', required: true },
    ]
  },
  {
    id: 'leite-resfriador',
    name: 'Programa Leite Mais',
    description: 'Apoio a produtores de leite - tanque de resfriamento',
    icon: 'Milk',
    category: 'Fomento',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_vacas_ordenha', type: 'number', label: 'Número de Vacas em Ordenha', required: true },
      { name: 'producao_diaria', type: 'number', label: 'Produção Diária (litros)', required: true },
      { name: 'possui_energia', type: 'select', label: 'Possui Energia Elétrica', required: true },
      { name: 'tipo_ordenha', type: 'select', label: 'Tipo de Ordenha', required: true },
    ]
  },
  {
    id: 'avicultura-galinheiro',
    name: 'Projeto de Galinheiro Caipira',
    description: 'Apoio para criação de aves caipiras',
    icon: 'Egg',
    category: 'Projetos',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_aves', type: 'number', label: 'Número de Aves Pretendido', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
      { name: 'area_disponivel', type: 'number', label: 'Área Disponível (m²)', required: true },
    ]
  },
  {
    id: 'suinocultura-orientacao',
    name: 'Orientação Técnica em Suinocultura',
    description: 'Assistência para criação de suínos',
    icon: 'PiggyBank',
    category: 'Assistência',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'num_suinos', type: 'number', label: 'Número de Suínos', required: true },
      { name: 'tipo_criacao', type: 'select', label: 'Tipo de Criação', required: true },
      { name: 'problema_encontrado', type: 'textarea', label: 'Problema/Dúvida', required: false },
    ]
  },
  {
    id: 'agrofloresta-projeto',
    name: 'Projeto de Sistema Agroflorestal',
    description: 'Implantação de SAF - Sistema Agroflorestal',
    icon: 'Trees',
    category: 'Projetos',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'area_implantar', type: 'number', label: 'Área a Implantar (hectares)', required: true },
      { name: 'tipo_solo', type: 'select', label: 'Tipo de Solo', required: false },
      { name: 'especies_interesse', type: 'textarea', label: 'Espécies de Interesse', required: true },
    ]
  },
  {
    id: 'cadastro-produtor-organico',
    name: 'Cadastro de Produtor Orgânico',
    description: 'Registro no sistema de produção orgânica do município',
    icon: 'Sprout',
    category: 'Cadastro',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'area_organica', type: 'number', label: 'Área em Produção Orgânica (hectares)', required: true },
      { name: 'produtos_organicos', type: 'textarea', label: 'Produtos Orgânicos Cultivados', required: true },
      { name: 'tipo_certificacao', type: 'select', label: 'Possui Certificação', required: false },
    ]
  },
  {
    id: 'apicultura-enxame',
    name: 'Distribuição de Enxames de Abelhas',
    description: 'Programa de fomento à apicultura',
    icon: 'Hexagon',
    category: 'Insumos',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_enxames', type: 'number', label: 'Número de Enxames Desejados', required: true },
      { name: 'tipo_abelha', type: 'select', label: 'Tipo de Abelha', required: true },
      { name: 'possui_colmeias', type: 'select', label: 'Possui Colmeias', required: true },
      { name: 'experiencia_apicultura', type: 'select', label: 'Experiência em Apicultura', required: true },
    ]
  },
  {
    id: 'agroecologia-transicao',
    name: 'Programa de Transição Agroecológica',
    description: 'Apoio à conversão para agricultura sustentável',
    icon: 'Leaf',
    category: 'Assistência',
    estimatedDays: 90,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'area_transicao', type: 'number', label: 'Área em Transição (hectares)', required: true },
      { name: 'sistema_atual', type: 'select', label: 'Sistema de Produção Atual', required: true },
      { name: 'metas_transicao', type: 'textarea', label: 'Metas da Transição', required: true },
    ]
  },
  {
    id: 'ervas-medicinais',
    name: 'Cultivo de Plantas Medicinais',
    description: 'Orientação para cultivo de ervas medicinais',
    icon: 'FlowerLotus',
    category: 'Assistência',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'area_cultivo', type: 'number', label: 'Área de Cultivo (m²)', required: true },
      { name: 'plantas_interesse', type: 'textarea', label: 'Plantas de Interesse', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'quintal-produtivo',
    name: 'Programa Quintal Produtivo',
    description: 'Apoio para hortas e criações familiares',
    icon: 'Home',
    category: 'Agricultura Urbana',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'area_disponivel', type: 'number', label: 'Área Disponível (m²)', required: true },
      { name: 'tipo_producao', type: 'select', label: 'Tipo de Produção Desejada', required: true },
    ]
  },
  {
    id: 'defensivos-alternativos',
    name: 'Curso de Defensivos Naturais',
    description: 'Capacitação em produção de bioinsumos',
    icon: 'Beaker',
    category: 'Capacitação',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_producao', type: 'select', label: 'Tipo de Produção', required: true },
      { name: 'nivel_conhecimento', type: 'select', label: 'Nível de Conhecimento', required: true },
    ]
  },
  {
    id: 'compostagem-curso',
    name: 'Curso de Compostagem',
    description: 'Capacitação em produção de composto orgânico',
    icon: 'Recycle',
    category: 'Capacitação',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
      { name: 'area_interesse', type: 'number', label: 'Área de Interesse (m²)', required: false },
    ]
  },
  {
    id: 'irrigacao-gotejamento',
    name: 'Curso de Irrigação por Gotejamento',
    description: 'Capacitação em sistemas de irrigação localizada',
    icon: 'Droplets',
    category: 'Capacitação',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'area_irrigar', type: 'number', label: 'Área a Irrigar (hectares)', required: false },
      { name: 'cultura_pretendida', type: 'select', label: 'Cultura Pretendida', required: true },
    ]
  }
];
