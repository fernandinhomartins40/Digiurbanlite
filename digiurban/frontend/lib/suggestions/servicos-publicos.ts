import { ServiceSuggestion } from './types';

export const servicospublicosSuggestions: ServiceSuggestion[] = [
  {
    id: 'segunda-via-conta-agua',
    name: 'Segunda Via de Conta de Água',
    description: 'Emissão de segunda via de conta de água e esgoto',
    icon: 'FileText',
    category: 'Água e Esgoto',
    estimatedDays: 1,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'mes_referencia', type: 'text', label: 'Mês de Referência', required: true },
    ]
  },
  {
    id: 'religacao-agua',
    name: 'Religação de Água',
    description: 'Solicitação de religação após corte por inadimplência',
    icon: 'Droplet',
    category: 'Água e Esgoto',
    estimatedDays: 2,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'num_protocolo_pagamento', type: 'text', label: 'Protocolo de Pagamento', required: true },
    ]
  },
  {
    id: 'nova-ligacao-agua',
    name: 'Nova Ligação de Água e Esgoto',
    description: 'Solicitação de nova ligação de água e esgoto',
    icon: 'Droplets',
    category: 'Água e Esgoto',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_imovel', type: 'select', label: 'Tipo de Imóvel', required: true },
      { name: 'area_construida', type: 'number', label: 'Área Construída (m²)', required: true },
      { name: 'num_economias', type: 'number', label: 'Número de Economias', required: true },
    ]
  },
  {
    id: 'troca-hidrometro',
    name: 'Troca de Hidrômetro',
    description: 'Solicitação de troca, vistoria ou aferição de hidrômetro',
    icon: 'Gauge',
    category: 'Água e Esgoto',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço', required: true },
      { name: 'motivo_solicitacao', type: 'select', label: 'Motivo da Solicitação', required: true },
      { name: 'descricao_problema', type: 'textarea', label: 'Descrição do Problema', required: true },
    ]
  },
  {
    id: 'vazamento-agua',
    name: 'Denúncia de Vazamento na Rede Pública',
    description: 'Reporte de vazamentos na rede pública de água',
    icon: 'AlertCircle',
    category: 'Água e Esgoto',
    estimatedDays: 1,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_vazamento', type: 'text', label: 'Local do Vazamento', required: true },
      { name: 'ponto_referencia', type: 'text', label: 'Ponto de Referência', required: false },
      { name: 'intensidade', type: 'select', label: 'Intensidade do Vazamento', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição', required: true },
    ]
  },
  {
    id: 'limpeza-fossa',
    name: 'Limpeza de Fossa Séptica',
    description: 'Solicitação de serviço de limpa-fossa municipal',
    icon: 'Trash2',
    category: 'Saneamento',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_servico', type: 'text', label: 'Endereço do Serviço', required: true },
      { name: 'tipo_fossa', type: 'select', label: 'Tipo de Fossa', required: true },
      { name: 'capacidade_estimada', type: 'text', label: 'Capacidade Estimada', required: false },
      { name: 'local_acesso_caminhao', type: 'select', label: 'Caminhão tem Acesso?', required: true },
    ]
  },
  {
    id: 'desobstrucao-esgoto',
    name: 'Desobstrução de Esgoto',
    description: 'Desobstrução de rede de esgoto e galerias pluviais',
    icon: 'Wrench',
    category: 'Saneamento',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_obstrucao', type: 'text', label: 'Local da Obstrução', required: true },
      { name: 'tipo_rede', type: 'select', label: 'Tipo de Rede', required: true },
      { name: 'descricao_problema', type: 'textarea', label: 'Descrição do Problema', required: true },
    ]
  },
  {
    id: 'coleta-entulho',
    name: 'Agendamento de Coleta de Entulho',
    description: 'Agendamento de coleta de entulho e materiais de construção',
    icon: 'Truck',
    category: 'Limpeza Urbana',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_coleta', type: 'text', label: 'Endereço da Coleta', required: true },
      { name: 'tipo_material', type: 'select', label: 'Tipo de Material', required: true },
      { name: 'volume_estimado', type: 'select', label: 'Volume Estimado', required: true },
      { name: 'data_preferencial', type: 'date', label: 'Data Preferencial', required: true },
    ]
  },
  {
    id: 'poda-terreno-publico',
    name: 'Capina e Limpeza de Terreno Público',
    description: 'Solicitação de capina e limpeza de terrenos públicos',
    icon: 'TreeDeciduous',
    category: 'Limpeza Urbana',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_terreno', type: 'text', label: 'Localização do Terreno', required: true },
      { name: 'area_estimada', type: 'text', label: 'Área Estimada', required: false },
      { name: 'descricao_situacao', type: 'textarea', label: 'Descrição da Situação', required: true },
    ]
  },
  {
    id: 'coleta-moveis-velhos',
    name: 'Coleta de Móveis e Objetos Volumosos',
    description: 'Agendamento de coleta de móveis velhos e objetos volumosos',
    icon: 'Sofa',
    category: 'Limpeza Urbana',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_coleta', type: 'text', label: 'Endereço da Coleta', required: true },
      { name: 'descricao_itens', type: 'textarea', label: 'Descrição dos Itens', required: true },
      { name: 'quantidade_itens', type: 'number', label: 'Quantidade de Itens', required: true },
      { name: 'data_preferencial', type: 'date', label: 'Data Preferencial', required: true },
    ]
  },
  {
    id: 'denuncia-lixo-irregular',
    name: 'Denúncia de Descarte Irregular de Lixo',
    description: 'Denúncia de descarte irregular de lixo e entulho',
    icon: 'AlertTriangle',
    category: 'Limpeza Urbana',
    estimatedDays: 2,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_descarte', type: 'text', label: 'Local do Descarte Irregular', required: true },
      { name: 'tipo_material', type: 'select', label: 'Tipo de Material', required: true },
      { name: 'volume_estimado', type: 'select', label: 'Volume Estimado', required: false },
      { name: 'descricao', type: 'textarea', label: 'Descrição', required: true },
    ]
  },
  {
    id: 'iluminacao-publica-manutencao',
    name: 'Manutenção de Iluminação Pública',
    description: 'Solicitação de reparo em iluminação pública',
    icon: 'Lightbulb',
    category: 'Iluminação',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_poste', type: 'text', label: 'Endereço/Localização do Poste', required: true },
      { name: 'numero_poste', type: 'text', label: 'Número do Poste (se houver)', required: false },
      { name: 'tipo_problema', type: 'select', label: 'Tipo de Problema', required: true },
      { name: 'ponto_referencia', type: 'text', label: 'Ponto de Referência', required: false },
    ]
  },
  {
    id: 'nova-luminaria-publica',
    name: 'Solicitação de Nova Luminária',
    description: 'Pedido de instalação de nova luminária pública',
    icon: 'Plus',
    category: 'Iluminação',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_solicitacao', type: 'text', label: 'Local Solicitado', required: true },
      { name: 'tipo_local', type: 'select', label: 'Tipo de Local', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'concessao-sepultura',
    name: 'Concessão de Sepultura',
    description: 'Solicitação de concessão de sepultura em cemitério municipal',
    icon: 'Home',
    category: 'Cemitérios',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cemiterio_pretendido', type: 'select', label: 'Cemitério Pretendido', required: true },
      { name: 'tipo_sepultura', type: 'select', label: 'Tipo de Sepultura', required: true },
      { name: 'tipo_concessao', type: 'select', label: 'Tipo de Concessão', required: true },
    ]
  },
  {
    id: 'exumacao',
    name: 'Solicitação de Exumação',
    description: 'Pedido de exumação de restos mortais',
    icon: 'FileText',
    category: 'Cemitérios',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'grau_parentesco', type: 'text', label: 'Grau de Parentesco com o Falecido', required: true },
      { name: 'cemiterio', type: 'text', label: 'Cemitério', required: true },
      { name: 'quadra_sepultura', type: 'text', label: 'Quadra/Sepultura', required: true },
      { name: 'data_falecimento', type: 'date', label: 'Data do Falecimento', required: true },
      { name: 'motivo_exumacao', type: 'textarea', label: 'Motivo da Exumação', required: true },
    ]
  },
  {
    id: 'renovacao-concessao-cemiterio',
    name: 'Renovação de Concessão de Sepultura',
    description: 'Renovação de concessão de uso de sepultura',
    icon: 'RefreshCw',
    category: 'Cemitérios',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cemiterio', type: 'text', label: 'Cemitério', required: true },
      { name: 'quadra_sepultura', type: 'text', label: 'Quadra/Sepultura', required: true },
      { name: 'num_concessao_anterior', type: 'text', label: 'Número da Concessão Anterior', required: true },
      { name: 'periodo_renovacao', type: 'select', label: 'Período de Renovação', required: true },
    ]
  },
  {
    id: 'permissao-uso-box-feira',
    name: 'Permissão de Uso de Box em Feira Livre',
    description: 'Solicitação de permissão para uso de box em feira livre',
    icon: 'Store',
    category: 'Feiras e Mercados',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_residencia', type: 'text', label: 'Endereço Residencial', required: true },
      { name: 'feira_pretendida', type: 'select', label: 'Feira Pretendida', required: true },
      { name: 'tipo_produto', type: 'select', label: 'Tipo de Produto a Vender', required: true },
      { name: 'experiencia_anterior', type: 'select', label: 'Possui Experiência como Feirante?', required: false },
      { name: 'possui_veiculo', type: 'select', label: 'Possui Veículo para Transporte?', required: true },
    ]
  },
  {
    id: 'permissao-box-mercado-municipal',
    name: 'Permissão de Box em Mercado Municipal',
    description: 'Solicitação de permissão para uso de box em mercado municipal',
    icon: 'ShoppingBag',
    category: 'Feiras e Mercados',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'mercado_pretendido', type: 'select', label: 'Mercado Pretendido', required: true },
      { name: 'ramo_atividade', type: 'select', label: 'Ramo de Atividade', required: true },
      { name: 'area_box_pretendida', type: 'text', label: 'Área de Box Pretendida (m²)', required: false },
      { name: 'descricao_atividade', type: 'textarea', label: 'Descrição da Atividade', required: true },
    ]
  },
  {
    id: 'taxa-lixo-isencao',
    name: 'Isenção de Taxa de Lixo',
    description: 'Solicitação de isenção de taxa de coleta de lixo',
    icon: 'DollarSign',
    category: 'Taxas e Tributos',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'inscricao_imobiliaria', type: 'text', label: 'Inscrição Imobiliária', required: true },
      { name: 'motivo_isencao', type: 'select', label: 'Motivo da Isenção', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'alteracao-titularidade-agua',
    name: 'Alteração de Titularidade de Conta de Água',
    description: 'Transferência de titularidade de conta de água e esgoto',
    icon: 'UserSwitch',
    category: 'Água e Esgoto',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_novo_titular', type: 'cpf', label: 'CPF do Novo Titular', required: true },
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'motivo_alteracao', type: 'select', label: 'Motivo da Alteração', required: true },
    ]
  },
  {
    id: 'vistoria-caixa-dagua',
    name: 'Vistoria de Caixa d\'Água',
    description: 'Solicitação de vistoria técnica em caixa d\'água',
    icon: 'CheckCircle',
    category: 'Água e Esgoto',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_imovel', type: 'select', label: 'Tipo de Imóvel', required: true },
      { name: 'capacidade_caixa', type: 'text', label: 'Capacidade da Caixa (litros)', required: false },
      { name: 'motivo_vistoria', type: 'textarea', label: 'Motivo da Vistoria', required: true },
    ]
  },
  {
    id: 'tampao-bueiro-manutencao',
    name: 'Manutenção de Tampão de Bueiro',
    description: 'Solicitação de manutenção ou instalação de tampão de bueiro',
    icon: 'Grid',
    category: 'Saneamento',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_bueiro', type: 'text', label: 'Localização do Bueiro', required: true },
      { name: 'ponto_referencia', type: 'text', label: 'Ponto de Referência', required: false },
      { name: 'tipo_problema', type: 'select', label: 'Tipo de Problema', required: true },
      { name: 'nivel_risco', type: 'select', label: 'Nível de Risco', required: true },
    ]
  },
  {
    id: 'limpeza-caixa-rua',
    name: 'Limpeza de Caixa de Rua',
    description: 'Solicitação de limpeza de caixa de captação pluvial',
    icon: 'Droplets',
    category: 'Saneamento',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_caixa', type: 'text', label: 'Localização da Caixa', required: true },
      { name: 'ponto_referencia', type: 'text', label: 'Ponto de Referência', required: false },
      { name: 'descricao_problema', type: 'textarea', label: 'Descrição do Problema', required: true },
    ]
  },
  {
    id: 'poda-arvore-municipal',
    name: 'Poda de Árvore em Via Pública',
    description: 'Solicitação de poda de árvores em vias públicas',
    icon: 'TreeDeciduous',
    category: 'Limpeza Urbana',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_arvore', type: 'text', label: 'Localização da Árvore', required: true },
      { name: 'tipo_arvore', type: 'text', label: 'Tipo de Árvore (se souber)', required: false },
      { name: 'motivo_poda', type: 'select', label: 'Motivo da Poda', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição', required: true },
    ]
  },
  {
    id: 'autorizacao-evento-feira',
    name: 'Autorização para Evento em Feira',
    description: 'Autorização para realização de evento em feira ou mercado',
    icon: 'Calendar',
    category: 'Feiras e Mercados',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'tipo_evento', type: 'text', label: 'Tipo de Evento', required: true },
      { name: 'local_pretendido', type: 'select', label: 'Local Pretendido', required: true },
      { name: 'data_evento', type: 'date', label: 'Data do Evento', required: true },
      { name: 'horario_inicio', type: 'text', label: 'Horário de Início', required: true },
      { name: 'horario_termino', type: 'text', label: 'Horário de Término', required: true },
      { name: 'descricao_evento', type: 'textarea', label: 'Descrição do Evento', required: true },
    ]
  },
  {
    id: 'varricao-rua',
    name: 'Solicitação de Varrição de Rua',
    description: 'Pedido de varrição de vias públicas',
    icon: 'Broom',
    category: 'Limpeza Urbana',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_rua', type: 'text', label: 'Endereço da Rua', required: true },
      { name: 'trecho', type: 'text', label: 'Trecho (entre quais ruas)', required: false },
      { name: 'motivo', type: 'textarea', label: 'Motivo da Solicitação', required: true },
    ]
  },
  {
    id: 'parcelamento-debitos-agua',
    name: 'Parcelamento de Débitos de Água',
    description: 'Solicitação de parcelamento de dívidas de água e esgoto',
    icon: 'Calculator',
    category: 'Água e Esgoto',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: true },
      { name: 'valor_total_debito', type: 'text', label: 'Valor Total do Débito', required: true },
      { name: 'num_parcelas_desejadas', type: 'number', label: 'Número de Parcelas Desejadas', required: true },
      { name: 'renda_familiar', type: 'text', label: 'Renda Familiar', required: true },
    ]
  },
  {
    id: 'autorizacao-queima-terreno',
    name: 'Autorização para Queima Controlada',
    description: 'Autorização para queima controlada em terreno privado',
    icon: 'Flame',
    category: 'Limpeza Urbana',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_terreno', type: 'text', label: 'Endereço do Terreno', required: true },
      { name: 'area_terreno', type: 'text', label: 'Área do Terreno (m²)', required: true },
      { name: 'tipo_material_queimar', type: 'text', label: 'Tipo de Material a Queimar', required: true },
      { name: 'data_pretendida', type: 'date', label: 'Data Pretendida', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'relocacao-ponto-feira',
    name: 'Relocação de Ponto em Feira Livre',
    description: 'Solicitação de mudança de ponto em feira livre',
    icon: 'MoveHorizontal',
    category: 'Feiras e Mercados',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_permissao_atual', type: 'text', label: 'Número da Permissão Atual', required: true },
      { name: 'feira_atual', type: 'text', label: 'Feira Atual', required: true },
      { name: 'ponto_atual', type: 'text', label: 'Ponto Atual', required: true },
      { name: 'ponto_desejado', type: 'text', label: 'Ponto Desejado', required: true },
      { name: 'motivo_relocacao', type: 'textarea', label: 'Motivo da Relocação', required: true },
    ]
  },
  {
    id: 'limpeza-caixa-dagua-comunitaria',
    name: 'Limpeza de Caixa d\'Água Comunitária',
    description: 'Solicitação de limpeza de caixa d\'água comunitária',
    icon: 'Users',
    category: 'Água e Esgoto',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_comunidade', type: 'select', label: 'Tipo de Comunidade', required: true },
      { name: 'endereco_caixa', type: 'text', label: 'Localização da Caixa d\'Água', required: true },
      { name: 'num_familias_beneficiadas', type: 'number', label: 'Número de Famílias Beneficiadas', required: true },
      { name: 'capacidade_caixa', type: 'text', label: 'Capacidade da Caixa (litros)', required: false },
    ]
  },
  {
    id: 'certidao-regularidade-agua',
    name: 'Certidão de Regularidade de Água e Esgoto',
    description: 'Emissão de certidão de regularidade de pagamento',
    icon: 'FileCheck',
    category: 'Água e Esgoto',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'finalidade_certidao', type: 'select', label: 'Finalidade da Certidão', required: true },
    ]
  },
  {
    id: 'cadastro-carrinheiro',
    name: 'Cadastro de Carrinheiro de Feirante',
    description: 'Registro de carrinheiros para trabalho em feiras livres',
    icon: 'ShoppingCart',
    category: 'Feiras e Mercados',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_residencia', type: 'text', label: 'Endereço Residencial', required: true },
      { name: 'feira_trabalho', type: 'select', label: 'Feira onde Trabalha', required: true },
      { name: 'possui_carrinho_proprio', type: 'select', label: 'Possui Carrinho Próprio?', required: true },
      { name: 'tempo_experiencia', type: 'text', label: 'Tempo de Experiência', required: false },
    ]
  },
  {
    id: 'limpeza-boca-lobo',
    name: 'Limpeza de Boca de Lobo',
    description: 'Solicitação de limpeza de boca de lobo entupida',
    icon: 'Wind',
    category: 'Saneamento',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_boca_lobo', type: 'text', label: 'Localização da Boca de Lobo', required: true },
      { name: 'ponto_referencia', type: 'text', label: 'Ponto de Referência', required: false },
      { name: 'nivel_obstrucao', type: 'select', label: 'Nível de Obstrução', required: true },
      { name: 'causa_provavel', type: 'text', label: 'Causa Provável', required: false },
    ]
  },
  {
    id: 'instalacao-lixeira-publica',
    name: 'Instalação de Lixeira Pública',
    description: 'Solicitação de instalação de lixeira em via pública',
    icon: 'Trash',
    category: 'Limpeza Urbana',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_solicitado', type: 'text', label: 'Local Solicitado', required: true },
      { name: 'tipo_local', type: 'select', label: 'Tipo de Local', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'reclamacao-horario-coleta-lixo',
    name: 'Reclamação sobre Horário de Coleta',
    description: 'Reclamação sobre horário inadequado de coleta de lixo',
    icon: 'Clock',
    category: 'Limpeza Urbana',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'horario_atual_coleta', type: 'text', label: 'Horário Atual da Coleta', required: true },
      { name: 'problema_horario', type: 'textarea', label: 'Problema com o Horário', required: true },
      { name: 'horario_sugerido', type: 'text', label: 'Horário Sugerido', required: false },
    ]
  },
  {
    id: 'analise-qualidade-agua',
    name: 'Solicitação de Análise de Qualidade de Água',
    description: 'Pedido de análise laboratorial de qualidade da água',
    icon: 'Beaker',
    category: 'Água e Esgoto',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: false },
      { name: 'motivo_analise', type: 'select', label: 'Motivo da Análise', required: true },
      { name: 'descricao_problema', type: 'textarea', label: 'Descrição do Problema', required: true },
    ]
  },
  {
    id: 'denuncia-agua-clandestina',
    name: 'Denúncia de Ligação Clandestina de Água',
    description: 'Denúncia de ligação irregular na rede de água',
    icon: 'AlertCircle',
    category: 'Água e Esgoto',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel com Irregularidade', required: true },
      { name: 'tipo_irregularidade', type: 'select', label: 'Tipo de Irregularidade', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição', required: true },
    ]
  },
  {
    id: 'conserto-bebedouro-publico',
    name: 'Manutenção de Bebedouro Público',
    description: 'Solicitação de conserto de bebedouro em espaço público',
    icon: 'Droplet',
    category: 'Água e Esgoto',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_bebedouro', type: 'text', label: 'Localização do Bebedouro', required: true },
      { name: 'tipo_local', type: 'select', label: 'Tipo de Local', required: true },
      { name: 'descricao_problema', type: 'textarea', label: 'Descrição do Problema', required: true },
    ]
  },
  {
    id: 'horta-comunitaria-residuos',
    name: 'Doação de Composto para Horta Comunitária',
    description: 'Solicitação de doação de composto orgânico para hortas comunitárias',
    icon: 'Leaf',
    category: 'Limpeza Urbana',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_horta', type: 'text', label: 'Endereço da Horta', required: true },
      { name: 'num_participantes', type: 'number', label: 'Número de Participantes', required: true },
      { name: 'quantidade_necessaria', type: 'text', label: 'Quantidade Necessária (kg ou m³)', required: true },
      { name: 'finalidade', type: 'textarea', label: 'Finalidade do Composto', required: true },
    ]
  },
  {
    id: 'inclusao-roteiro-coleta',
    name: 'Inclusão de Endereço em Roteiro de Coleta',
    description: 'Solicitação de inclusão de novo endereço no roteiro de coleta de lixo',
    icon: 'MapPin',
    category: 'Limpeza Urbana',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_imovel', type: 'select', label: 'Tipo de Imóvel', required: true },
      { name: 'ponto_referencia', type: 'text', label: 'Ponto de Referência', required: false },
    ]
  },
  {
    id: 'cadastro-coletor-reciclavel',
    name: 'Cadastro de Coletor de Material Reciclável',
    description: 'Registro de catadores de material reciclável',
    icon: 'Recycle',
    category: 'Limpeza Urbana',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_residencia', type: 'text', label: 'Endereço Residencial', required: true },
      { name: 'tipo_veiculo', type: 'select', label: 'Tipo de Veículo de Coleta', required: true },
      { name: 'area_atuacao', type: 'text', label: 'Área de Atuação', required: true },
      { name: 'associacao_cooperativa', type: 'text', label: 'Associação/Cooperativa (se houver)', required: false },
      { name: 'tempo_atividade', type: 'text', label: 'Tempo na Atividade', required: false },
    ]
  },
  {
    id: 'autorizacao-ocupacao-calcada-feira',
    name: 'Autorização de Ocupação Temporária de Calçada em Feira',
    description: 'Autorização temporária de uso de calçada durante feira livre',
    icon: 'Footprints',
    category: 'Feiras e Mercados',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_comercio', type: 'text', label: 'Endereço do Comércio', required: true },
      { name: 'feira', type: 'select', label: 'Feira', required: true },
      { name: 'dias_semana', type: 'text', label: 'Dias da Semana', required: true },
      { name: 'tipo_atividade', type: 'text', label: 'Tipo de Atividade', required: true },
      { name: 'area_ocupacao', type: 'text', label: 'Área de Ocupação (m²)', required: true },
    ]
  },
  {
    id: 'suspensao-fornecimento-agua',
    name: 'Suspensão Temporária de Fornecimento',
    description: 'Solicitação de suspensão temporária de fornecimento de água',
    icon: 'PauseCircle',
    category: 'Água e Esgoto',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'data_inicio_suspensao', type: 'date', label: 'Data de Início da Suspensão', required: true },
      { name: 'periodo_estimado', type: 'text', label: 'Período Estimado (meses)', required: true },
      { name: 'motivo_suspensao', type: 'textarea', label: 'Motivo da Suspensão', required: true },
    ]
  },
  {
    id: 'autorizacao-desfile-rua',
    name: 'Autorização para Desfile em Via Pública',
    description: 'Autorização para desfiles cívicos, carnavalescos e eventos similares',
    icon: 'PartyPopper',
    category: 'Eventos Públicos',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'tipo_desfile', type: 'select', label: 'Tipo de Desfile', required: true },
      { name: 'data_evento', type: 'date', label: 'Data do Evento', required: true },
      { name: 'horario_inicio', type: 'text', label: 'Horário de Início', required: true },
      { name: 'horario_termino', type: 'text', label: 'Horário de Término', required: true },
      { name: 'percurso', type: 'textarea', label: 'Percurso Pretendido', required: true },
      { name: 'publico_estimado', type: 'number', label: 'Público Estimado', required: true },
      { name: 'num_participantes', type: 'number', label: 'Número de Participantes', required: true },
    ]
  },
  {
    id: 'visita-tecnica-educacional',
    name: 'Agendamento de Visita Técnica Educacional',
    description: 'Agendamento de visitas técnicas a estações de tratamento e aterros',
    icon: 'Users',
    category: 'Educação Ambiental',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'instituicao', type: 'text', label: 'Nome da Instituição', required: true },
      { name: 'tipo_instituicao', type: 'select', label: 'Tipo de Instituição', required: true },
      { name: 'local_visita', type: 'select', label: 'Local da Visita', required: true },
      { name: 'num_visitantes', type: 'number', label: 'Número de Visitantes', required: true },
      { name: 'faixa_etaria', type: 'text', label: 'Faixa Etária', required: true },
      { name: 'data_preferencial', type: 'date', label: 'Data Preferencial', required: true },
      { name: 'objetivos_visita', type: 'textarea', label: 'Objetivos da Visita', required: true },
    ]
  },
  {
    id: 'denuncia-desperdicio-agua-publica',
    name: 'Denúncia de Desperdício de Água em Órgão Público',
    description: 'Denúncia de desperdício de água em prédios públicos',
    icon: 'Building2',
    category: 'Água e Esgoto',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_orgao', type: 'text', label: 'Endereço do Órgão', required: true },
      { name: 'tipo_desperdicio', type: 'select', label: 'Tipo de Desperdício', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição Detalhada', required: true },
    ]
  },
  {
    id: 'transferencia-jazigo',
    name: 'Transferência de Titularidade de Jazigo',
    description: 'Transferência de propriedade de jazigo ou sepultura',
    icon: 'FileSignature',
    category: 'Cemitérios',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_atual_titular', type: 'cpf', label: 'CPF do Atual Titular', required: true },
      { name: 'cpf_novo_titular', type: 'cpf', label: 'CPF do Novo Titular', required: true },
      { name: 'cemiterio', type: 'text', label: 'Cemitério', required: true },
      { name: 'quadra_jazigo', type: 'text', label: 'Quadra/Jazigo', required: true },
      { name: 'num_concessao', type: 'text', label: 'Número da Concessão', required: true },
      { name: 'motivo_transferencia', type: 'select', label: 'Motivo da Transferência', required: true },
    ]
  },
  {
    id: 'recarga-caminhao-pipa',
    name: 'Solicitação de Caminhão Pipa',
    description: 'Solicitação de abastecimento por caminhão pipa em emergências',
    icon: 'Truck',
    category: 'Água e Esgoto',
    estimatedDays: 2,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_abastecimento', type: 'text', label: 'Endereço para Abastecimento', required: true },
      { name: 'tipo_solicitante', type: 'select', label: 'Tipo de Solicitante', required: true },
      { name: 'motivo_solicitacao', type: 'select', label: 'Motivo da Solicitação', required: true },
      { name: 'num_pessoas_beneficiadas', type: 'number', label: 'Número de Pessoas Beneficiadas', required: true },
      { name: 'capacidade_armazenamento', type: 'text', label: 'Capacidade de Armazenamento (litros)', required: false },
      { name: 'descricao_emergencia', type: 'textarea', label: 'Descrição da Emergência', required: true },
    ]
  },
];
