import { ServiceSuggestion } from './types';

export const habitacaoSuggestions: ServiceSuggestion[] = [
  {
    id: 'cadastro-habitacional-municipal',
    name: 'Cadastro Habitacional Municipal',
    description: 'Cadastro único para programas habitacionais do município',
    icon: 'Home',
    category: 'Cadastro',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
      { name: 'situacao_moradia', type: 'select', label: 'Situação Atual de Moradia', required: true },
      { name: 'possui_imovel', type: 'select', label: 'Possui Imóvel Próprio', required: true },
    ]
  },
  {
    id: 'minha-casa-minha-vida',
    name: 'Minha Casa Minha Vida',
    description: 'Inscrição no programa Minha Casa Minha Vida',
    icon: 'Home',
    category: 'Programas Federais',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'estado_civil', type: 'select', label: 'Estado Civil', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'num_dependentes', type: 'number', label: 'Número de Dependentes', required: true },
      { name: 'tempo_residencia_municipio', type: 'number', label: 'Tempo de Residência no Município (anos)', required: true },
      { name: 'cadastro_unico', type: 'select', label: 'Possui Cadastro Único', required: true },
    ]
  },
  {
    id: 'regularizacao-fundiaria',
    name: 'Regularização Fundiária',
    description: 'Processo de regularização de terrenos e moradias',
    icon: 'FileText',
    category: 'Regularização',
    estimatedDays: 90,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'area_terreno', type: 'number', label: 'Área do Terreno (m²)', required: true },
      { name: 'tempo_ocupacao', type: 'number', label: 'Tempo de Ocupação (anos)', required: true },
      { name: 'tipo_regularizacao', type: 'select', label: 'Tipo de Regularização', required: true },
    ]
  },
  {
    id: 'auxilio-aluguel-social',
    name: 'Auxílio Aluguel Social',
    description: 'Benefício temporário para pagamento de aluguel',
    icon: 'DollarSign',
    category: 'Auxílio',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_atual', type: 'text', label: 'Endereço Atual', required: true },
      { name: 'valor_aluguel', type: 'number', label: 'Valor do Aluguel (R$)', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'motivo_solicitacao', type: 'textarea', label: 'Motivo da Solicitação', required: true },
    ]
  },
  {
    id: 'reforma-habitacional',
    name: 'Programa de Reforma Habitacional',
    description: 'Apoio para reformas e melhorias em moradias',
    icon: 'Wrench',
    category: 'Reforma',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_reforma', type: 'select', label: 'Tipo de Reforma Necessária', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'descricao_necessidade', type: 'textarea', label: 'Descrição da Necessidade', required: true },
    ]
  },
  {
    id: 'lote-urbanizado',
    name: 'Lote Urbanizado',
    description: 'Cadastro para aquisição de lote com infraestrutura',
    icon: 'Map',
    category: 'Loteamento',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'estado_civil', type: 'select', label: 'Estado Civil', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'possui_imovel', type: 'select', label: 'Possui Outro Imóvel', required: true },
      { name: 'num_dependentes', type: 'number', label: 'Número de Dependentes', required: true },
    ]
  },
  {
    id: 'autoconstrucao-assistida',
    name: 'Autoconstrução Assistida',
    description: 'Programa de apoio técnico e material para autoconstrução',
    icon: 'HardHat',
    category: 'Construção',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_terreno', type: 'text', label: 'Endereço do Terreno', required: true },
      { name: 'area_terreno', type: 'number', label: 'Área do Terreno (m²)', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'possui_projeto', type: 'select', label: 'Possui Projeto Arquitetônico', required: false },
    ]
  },
  {
    id: 'usucapiao-urbano',
    name: 'Usucapião Urbano',
    description: 'Processo de usucapião de imóvel urbano',
    icon: 'Scale',
    category: 'Regularização',
    estimatedDays: 120,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'area_imovel', type: 'number', label: 'Área do Imóvel (m²)', required: true },
      { name: 'tempo_posse', type: 'number', label: 'Tempo de Posse (anos)', required: true },
      { name: 'tipo_usucapiao', type: 'select', label: 'Tipo de Usucapião', required: true },
    ]
  },
  {
    id: 'melhorias-sanitarias',
    name: 'Melhorias Sanitárias',
    description: 'Construção ou reforma de banheiros e fossas',
    icon: 'Droplet',
    category: 'Saneamento',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_melhoria', type: 'select', label: 'Tipo de Melhoria', required: true },
      { name: 'possui_banheiro', type: 'select', label: 'Possui Banheiro', required: true },
      { name: 'tipo_esgoto', type: 'select', label: 'Tipo de Esgotamento', required: true },
    ]
  },
  {
    id: 'kit-construcao',
    name: 'Kit Construção',
    description: 'Fornecimento de material básico de construção',
    icon: 'Package',
    category: 'Material',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_entrega', type: 'text', label: 'Endereço de Entrega', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
    ]
  },
  {
    id: 'habitacao-rural',
    name: 'Habitação Rural',
    description: 'Programa habitacional para área rural',
    icon: 'Home',
    category: 'Programas',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'localizacao_propriedade', type: 'text', label: 'Localização da Propriedade', required: true },
      { name: 'area_propriedade', type: 'number', label: 'Área da Propriedade (hectares)', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'possui_dap', type: 'select', label: 'Possui DAP', required: false },
    ]
  },
  {
    id: 'planta-gratuita',
    name: 'Planta e Projeto Gratuito',
    description: 'Elaboração gratuita de projeto arquitetônico popular',
    icon: 'FileText',
    category: 'Projeto',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_terreno', type: 'text', label: 'Endereço do Terreno', required: true },
      { name: 'area_construir', type: 'number', label: 'Área a Construir (m²)', required: true },
      { name: 'num_comodos', type: 'number', label: 'Número de Cômodos Desejado', required: true },
      { name: 'tipo_projeto', type: 'select', label: 'Tipo de Projeto', required: true },
    ]
  },
  {
    id: 'assistencia-tecnica-habitacional',
    name: 'Assistência Técnica para Habitação',
    description: 'Orientação técnica gratuita para construção e reforma',
    icon: 'Users',
    category: 'Assistência',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_assistencia', type: 'select', label: 'Tipo de Assistência', required: true },
      { name: 'descricao_problema', type: 'textarea', label: 'Descrição do Problema', required: true },
    ]
  },
  {
    id: 'reurb-regularizacao',
    name: 'REURB - Regularização Urbanística',
    description: 'Regularização de núcleos urbanos informais',
    icon: 'MapPin',
    category: 'Regularização',
    estimatedDays: 180,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_ocupacao', type: 'text', label: 'Endereço da Ocupação', required: true },
      { name: 'tempo_ocupacao', type: 'number', label: 'Tempo de Ocupação (anos)', required: true },
    ]
  },
  {
    id: 'energia-solar-social',
    name: 'Energia Solar em Habitação Social',
    description: 'Instalação de painéis solares em moradias populares',
    icon: 'Sun',
    category: 'Sustentabilidade',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_telhado', type: 'select', label: 'Tipo de Telhado', required: true },
      { name: 'conta_energia_media', type: 'number', label: 'Valor Médio Conta de Energia (R$)', required: false },
    ]
  },
  {
    id: 'cisterna-residencial',
    name: 'Cisterna Residencial',
    description: 'Construção de cisterna para captação de água da chuva',
    icon: 'Droplets',
    category: 'Sustentabilidade',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'area_telhado', type: 'number', label: 'Área do Telhado (m²)', required: false },
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
    ]
  },
  {
    id: 'acessibilidade-residencial',
    name: 'Adequação de Acessibilidade',
    description: 'Adaptação de moradia para pessoas com deficiência',
    icon: 'Accessibility',
    category: 'Acessibilidade',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_deficiencia', type: 'select', label: 'Tipo de Deficiência', required: true },
      { name: 'adaptacoes_necessarias', type: 'textarea', label: 'Adaptações Necessárias', required: true },
    ]
  },
  {
    id: 'mutirao-habitacional',
    name: 'Mutirão Habitacional',
    description: 'Inscrição em programa de mutirão para construção',
    icon: 'Users',
    category: 'Programas',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'disponibilidade_trabalho', type: 'select', label: 'Disponibilidade para Trabalho', required: true },
      { name: 'habilidade_construcao', type: 'select', label: 'Possui Habilidade em Construção', required: false },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
    ]
  },
  {
    id: 'troca-imovel',
    name: 'Programa de Troca de Imóvel',
    description: 'Permuta de imóvel em área de risco por moradia adequada',
    icon: 'Repeat',
    category: 'Reassentamento',
    estimatedDays: 90,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_atual', type: 'text', label: 'Endereço Atual', required: true },
      { name: 'area_risco', type: 'select', label: 'Tipo de Área de Risco', required: true },
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
    ]
  },
  {
    id: 'desapropriacao-compensacao',
    name: 'Compensação por Desapropriação',
    description: 'Solicitação de compensação por desapropriação',
    icon: 'FileText',
    category: 'Indenização',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'motivo_desapropriacao', type: 'textarea', label: 'Motivo da Desapropriação', required: false },
      { name: 'tipo_compensacao', type: 'select', label: 'Tipo de Compensação Desejada', required: true },
    ]
  },
  {
    id: 'habitacao-indigena',
    name: 'Habitação Indígena',
    description: 'Programa habitacional para comunidades indígenas',
    icon: 'Home',
    category: 'Programas Especiais',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'aldeia_comunidade', type: 'text', label: 'Aldeia/Comunidade', required: true },
      { name: 'etnia', type: 'text', label: 'Etnia', required: false },
      { name: 'num_familia', type: 'number', label: 'Número de Membros da Família', required: true },
    ]
  },
  {
    id: 'habitacao-quilombola',
    name: 'Habitação Quilombola',
    description: 'Programa habitacional para comunidades quilombolas',
    icon: 'Home',
    category: 'Programas Especiais',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'comunidade', type: 'text', label: 'Comunidade Quilombola', required: true },
      { name: 'possui_certidao', type: 'select', label: 'Possui Certidão Quilombola', required: false },
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
    ]
  },
  {
    id: 'visita-tecnica-habitacional',
    name: 'Solicitação de Vistoria Técnica',
    description: 'Vistoria técnica em imóvel para avaliação',
    icon: 'ClipboardCheck',
    category: 'Vistoria',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'motivo_vistoria', type: 'select', label: 'Motivo da Vistoria', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição', required: false },
    ]
  },
  {
    id: 'laudos-habitabilidade',
    name: 'Laudo de Habitabilidade',
    description: 'Emissão de laudo técnico de habitabilidade',
    icon: 'FileCheck',
    category: 'Documentação',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'finalidade_laudo', type: 'select', label: 'Finalidade do Laudo', required: true },
    ]
  },
  {
    id: 'defesa-civil-moradia',
    name: 'Avaliação Defesa Civil em Moradia',
    description: 'Vistoria de Defesa Civil em áreas de risco',
    icon: 'AlertTriangle',
    category: 'Segurança',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_risco', type: 'select', label: 'Tipo de Risco Observado', required: true },
      { name: 'descricao_situacao', type: 'textarea', label: 'Descrição da Situação', required: true },
    ]
  },
  {
    id: 'aluguel-social-emergencial',
    name: 'Aluguel Social Emergencial',
    description: 'Auxílio emergencial para vítimas de desastres',
    icon: 'AlertCircle',
    category: 'Emergência',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_anterior', type: 'text', label: 'Endereço Anterior', required: true },
      { name: 'tipo_desastre', type: 'select', label: 'Tipo de Desastre', required: true },
      { name: 'num_desabrigados', type: 'number', label: 'Número de Desabrigados', required: true },
    ]
  },
  {
    id: 'conjuntos-habitacionais',
    name: 'Sorteio em Conjuntos Habitacionais',
    description: 'Inscrição para sorteio de unidades habitacionais',
    icon: 'Building',
    category: 'Programas',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'num_dependentes', type: 'number', label: 'Número de Dependentes', required: true },
      { name: 'conjunto_preferencia', type: 'select', label: 'Conjunto de Preferência', required: false },
      { name: 'grupo_prioritario', type: 'select', label: 'Pertence a Grupo Prioritário', required: false },
    ]
  },
  {
    id: 'parcelamento-lote',
    name: 'Parcelamento de Lote Social',
    description: 'Solicitação de parcelamento de pagamento de lote',
    icon: 'CreditCard',
    category: 'Financiamento',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'identificacao_lote', type: 'text', label: 'Identificação do Lote', required: true },
      { name: 'valor_lote', type: 'number', label: 'Valor do Lote (R$)', required: true },
      { name: 'renda_mensal', type: 'number', label: 'Renda Mensal (R$)', required: true },
      { name: 'entrada_proposta', type: 'number', label: 'Valor de Entrada Proposto (R$)', required: false },
    ]
  },
  {
    id: 'habite-se-popular',
    name: 'Habite-se Popular',
    description: 'Emissão de habite-se simplificado para moradia popular',
    icon: 'FileCheck',
    category: 'Documentação',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'area_construida', type: 'number', label: 'Área Construída (m²)', required: true },
      { name: 'ano_construcao', type: 'number', label: 'Ano da Construção', required: true },
    ]
  },
  {
    id: 'certidao-posse',
    name: 'Certidão de Posse',
    description: 'Emissão de certidão de posse para fins de regularização',
    icon: 'FileText',
    category: 'Documentação',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tempo_posse', type: 'number', label: 'Tempo de Posse (anos)', required: true },
      { name: 'finalidade_certidao', type: 'select', label: 'Finalidade da Certidão', required: true },
    ]
  },
  {
    id: 'doacao-terreno-municipal',
    name: 'Doação de Terreno Municipal',
    description: 'Solicitação de doação de terreno público para moradia',
    icon: 'Gift',
    category: 'Doação',
    estimatedDays: 90,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'num_dependentes', type: 'number', label: 'Número de Dependentes', required: true },
      { name: 'situacao_moradia_atual', type: 'select', label: 'Situação de Moradia Atual', required: true },
      { name: 'tempo_residencia_municipio', type: 'number', label: 'Tempo de Residência no Município (anos)', required: true },
    ]
  },
  {
    id: 'permuta-terreno',
    name: 'Permuta de Terreno',
    description: 'Troca de terreno em área irregular por lote regular',
    icon: 'Repeat',
    category: 'Permuta',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_terreno_atual', type: 'text', label: 'Endereço do Terreno Atual', required: true },
      { name: 'area_terreno_atual', type: 'number', label: 'Área do Terreno Atual (m²)', required: true },
      { name: 'motivo_permuta', type: 'textarea', label: 'Motivo da Permuta', required: true },
    ]
  },
  {
    id: 'credito-habitacional-municipal',
    name: 'Crédito Habitacional Municipal',
    description: 'Financiamento municipal para aquisição de moradia',
    icon: 'DollarSign',
    category: 'Financiamento',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'valor_imovel', type: 'number', label: 'Valor do Imóvel (R$)', required: true },
      { name: 'valor_entrada', type: 'number', label: 'Valor de Entrada (R$)', required: true },
      { name: 'prazo_desejado', type: 'number', label: 'Prazo Desejado (meses)', required: true },
    ]
  },
  {
    id: 'programa-locacao-social',
    name: 'Locação Social',
    description: 'Aluguel subsidiado de imóveis municipais',
    icon: 'Key',
    category: 'Locação',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
      { name: 'capacidade_pagamento', type: 'number', label: 'Capacidade de Pagamento Mensal (R$)', required: true },
    ]
  },
  {
    id: 'piso-tatil-residencial',
    name: 'Instalação de Piso Tátil Residencial',
    description: 'Instalação de piso tátil para deficientes visuais',
    icon: 'Accessibility',
    category: 'Acessibilidade',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_deficiencia', type: 'select', label: 'Tipo de Deficiência', required: true },
      { name: 'area_instalar', type: 'textarea', label: 'Área a Instalar', required: true },
    ]
  },
  {
    id: 'rampa-acessibilidade',
    name: 'Construção de Rampa de Acesso',
    description: 'Construção de rampa para acessibilidade',
    icon: 'TrendingUp',
    category: 'Acessibilidade',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_mobilidade', type: 'select', label: 'Tipo de Mobilidade Reduzida', required: true },
      { name: 'local_rampa', type: 'select', label: 'Local da Rampa', required: true },
    ]
  },
  {
    id: 'adequacao-incendio',
    name: 'Adequação de Prevenção a Incêndio',
    description: 'Orientação e adequação para prevenção de incêndios',
    icon: 'Flame',
    category: 'Segurança',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_imovel', type: 'select', label: 'Tipo de Imóvel', required: true },
      { name: 'num_pavimentos', type: 'number', label: 'Número de Pavimentos', required: false },
    ]
  },
  {
    id: 'eficiencia-energetica',
    name: 'Programa de Eficiência Energética',
    description: 'Orientação e melhorias para eficiência energética',
    icon: 'Lightbulb',
    category: 'Sustentabilidade',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'gasto_energia_mensal', type: 'number', label: 'Gasto Médio Mensal com Energia (R$)', required: false },
    ]
  },
  {
    id: 'horta-comunitaria-residencial',
    name: 'Horta em Conjunto Habitacional',
    description: 'Implantação de horta comunitária em conjunto',
    icon: 'Sprout',
    category: 'Sustentabilidade',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'conjunto_habitacional', type: 'select', label: 'Conjunto Habitacional', required: true },
      { name: 'area_disponivel', type: 'number', label: 'Área Disponível (m²)', required: false },
      { name: 'num_interessados', type: 'number', label: 'Número de Interessados', required: false },
    ]
  },
  {
    id: 'coleta-seletiva-condominio',
    name: 'Implantação de Coleta Seletiva',
    description: 'Programa de coleta seletiva em condomínios populares',
    icon: 'Recycle',
    category: 'Sustentabilidade',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'num_unidades', type: 'number', label: 'Número de Unidades', required: true },
    ]
  },
  {
    id: 'mediacao-conflitos-habitacionais',
    name: 'Mediação de Conflitos Habitacionais',
    description: 'Serviço de mediação para conflitos em moradias',
    icon: 'MessageSquare',
    category: 'Mediação',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_conflito', type: 'select', label: 'Tipo de Conflito', required: true },
      { name: 'descricao_conflito', type: 'textarea', label: 'Descrição do Conflito', required: true },
    ]
  },
  {
    id: 'curso-sindico',
    name: 'Curso para Síndicos',
    description: 'Capacitação para síndicos de conjuntos habitacionais',
    icon: 'GraduationCap',
    category: 'Capacitação',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'conjunto_habitacional', type: 'text', label: 'Conjunto Habitacional', required: false },
      { name: 'tempo_sindico', type: 'select', label: 'Tempo como Síndico', required: false },
    ]
  },
  {
    id: 'oficina-manutencao-residencial',
    name: 'Oficina de Manutenção Residencial',
    description: 'Curso de pequenos reparos e manutenção doméstica',
    icon: 'Wrench',
    category: 'Capacitação',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'area_interesse', type: 'select', label: 'Área de Interesse', required: true },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'declaracao-residencia',
    name: 'Declaração de Residência',
    description: 'Emissão de declaração de residência',
    icon: 'FileText',
    category: 'Documentação',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tempo_residencia', type: 'number', label: 'Tempo de Residência (anos)', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'consorcio-habitacional',
    name: 'Consórcio Habitacional Municipal',
    description: 'Inscrição em consórcio público habitacional',
    icon: 'Users',
    category: 'Financiamento',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'valor_credito_desejado', type: 'number', label: 'Valor de Crédito Desejado (R$)', required: true },
      { name: 'capacidade_parcela', type: 'number', label: 'Capacidade de Parcela Mensal (R$)', required: true },
    ]
  },
  {
    id: 'cadastro-morador-conjunto',
    name: 'Cadastro de Morador em Conjunto',
    description: 'Atualização cadastral de moradores de conjuntos habitacionais',
    icon: 'UserCheck',
    category: 'Cadastro',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'conjunto_habitacional', type: 'select', label: 'Conjunto Habitacional', required: true },
      { name: 'unidade_bloco', type: 'text', label: 'Unidade/Bloco', required: true },
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
    ]
  },
  {
    id: 'transferencia-unidade',
    name: 'Transferência de Unidade Habitacional',
    description: 'Solicitação de transferência de unidade por motivo justificado',
    icon: 'ArrowRightLeft',
    category: 'Transferência',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'unidade_atual', type: 'text', label: 'Unidade Atual', required: true },
      { name: 'motivo_transferencia', type: 'textarea', label: 'Motivo da Transferência', required: true },
      { name: 'local_preferencia', type: 'select', label: 'Local de Preferência', required: false },
    ]
  },
  {
    id: 'segunda-via-contrato',
    name: 'Segunda Via de Contrato',
    description: 'Emissão de segunda via de contrato habitacional',
    icon: 'FileText',
    category: 'Documentação',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'numero_contrato', type: 'text', label: 'Número do Contrato Original', required: false },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
    ]
  },
  {
    id: 'quitacao-imovel',
    name: 'Solicitação de Quitação de Imóvel',
    description: 'Processo de quitação e escrituração de imóvel',
    icon: 'CheckCircle',
    category: 'Quitação',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'numero_contrato', type: 'text', label: 'Número do Contrato', required: true },
      { name: 'valor_quitacao', type: 'number', label: 'Valor de Quitação (R$)', required: false },
    ]
  }
];
