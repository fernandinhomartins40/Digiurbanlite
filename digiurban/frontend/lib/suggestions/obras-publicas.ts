import { ServiceSuggestion } from './types';

export const obraspublicasSuggestions: ServiceSuggestion[] = [
  {
    id: 'tapa-buraco',
    name: 'Solicitação de Tapa-Buraco',
    description: 'Reparo de buracos e irregularidades em vias públicas',
    icon: 'Construction',
    category: 'Manutenção Viária',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_buraco', type: 'text', label: 'Endereço/Localização do Buraco', required: true },
      { name: 'ponto_referencia', type: 'text', label: 'Ponto de Referência', required: false },
      { name: 'tamanho_estimado', type: 'select', label: 'Tamanho Estimado', required: true },
      { name: 'nivel_urgencia', type: 'select', label: 'Nível de Urgência', required: true },
      { name: 'descricao_situacao', type: 'textarea', label: 'Descrição da Situação', required: true },
    ]
  },
  {
    id: 'iluminacao-publica-manutencao',
    name: 'Manutenção de Iluminação Pública',
    description: 'Reparo de poste, lâmpada ou instalação de iluminação',
    icon: 'Lightbulb',
    category: 'Iluminação',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_poste', type: 'text', label: 'Endereço do Poste', required: true },
      { name: 'numero_poste', type: 'text', label: 'Número do Poste (se visível)', required: false },
      { name: 'tipo_problema', type: 'select', label: 'Tipo de Problema', required: true },
      { name: 'horario_notado', type: 'select', label: 'Horário em que o Problema foi Notado', required: false },
    ]
  },
  {
    id: 'limpeza-via-publica',
    name: 'Limpeza de Via Pública',
    description: 'Solicitação de limpeza de rua, praça ou área pública',
    icon: 'Trash',
    category: 'Limpeza Urbana',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_local', type: 'text', label: 'Endereço do Local', required: true },
      { name: 'tipo_limpeza', type: 'select', label: 'Tipo de Limpeza', required: true },
      { name: 'tipo_residuo', type: 'select', label: 'Tipo de Resíduo', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição', required: true },
    ]
  },
  {
    id: 'calcada-cidada',
    name: 'Programa Calçada Cidadã',
    description: 'Orientação e fiscalização para regularização de calçadas',
    icon: 'Footprints',
    category: 'Acessibilidade',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'metragem_calcada', type: 'number', label: 'Metragem da Calçada (m²)', required: true },
      { name: 'situacao_atual', type: 'select', label: 'Situação Atual da Calçada', required: true },
      { name: 'tipo_solicitacao', type: 'select', label: 'Tipo de Solicitação', required: true },
    ]
  },
  {
    id: 'drenagem-pluvial',
    name: 'Manutenção de Drenagem Pluvial',
    description: 'Limpeza de bueiros, bocas de lobo e galerias pluviais',
    icon: 'Droplets',
    category: 'Drenagem',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_problema', type: 'text', label: 'Endereço do Problema', required: true },
      { name: 'tipo_estrutura', type: 'select', label: 'Tipo de Estrutura', required: true },
      { name: 'problema_identificado', type: 'select', label: 'Problema Identificado', required: true },
      { name: 'causa_alagamento', type: 'select', label: 'Causa Alagamento?', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição', required: true },
    ]
  },
  {
    id: 'pavimentacao-rua',
    name: 'Solicitação de Pavimentação',
    description: 'Pedido de pavimentação asfáltica ou com paralelepípedos',
    icon: 'Route',
    category: 'Pavimentação',
    estimatedDays: 90,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'extensao_estimada', type: 'number', label: 'Extensão Estimada (metros)', required: false },
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores Beneficiados', required: false },
      { name: 'tipo_pavimento_desejado', type: 'select', label: 'Tipo de Pavimento Desejado', required: false },
    ]
  },
  {
    id: 'sinalizacao-viaria',
    name: 'Sinalização Viária',
    description: 'Solicitação ou reparo de placas e sinalização de trânsito',
    icon: 'SignpostBig',
    category: 'Trânsito',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_local', type: 'text', label: 'Endereço/Cruzamento', required: true },
      { name: 'tipo_sinalizacao', type: 'select', label: 'Tipo de Sinalização', required: true },
      { name: 'tipo_solicitacao', type: 'select', label: 'Tipo de Solicitação', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'pintura-faixa-pedestre',
    name: 'Pintura de Faixa de Pedestre',
    description: 'Solicitação de pintura ou repintura de faixa',
    icon: 'Stripes',
    category: 'Trânsito',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_faixa', type: 'text', label: 'Endereço da Faixa', required: true },
      { name: 'tipo_faixa', type: 'select', label: 'Tipo de Faixa', required: true },
      { name: 'situacao_atual', type: 'select', label: 'Situação Atual', required: true },
      { name: 'proximo_estabelecimento', type: 'text', label: 'Próximo a (escola, hospital, etc.)', required: false },
    ]
  },
  {
    id: 'reducao-velocidade',
    name: 'Instalação de Redutor de Velocidade',
    description: 'Solicitação de lombada ou redutor eletrônico',
    icon: 'TrendingDown',
    category: 'Trânsito',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_instalacao', type: 'text', label: 'Endereço para Instalação', required: true },
      { name: 'tipo_redutor', type: 'select', label: 'Tipo de Redutor', required: true },
      { name: 'motivo_solicitacao', type: 'select', label: 'Motivo da Solicitação', required: true },
      { name: 'num_acidentes', type: 'number', label: 'Número de Acidentes Recentes (se souber)', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa Detalhada', required: true },
    ]
  },
  {
    id: 'semaforo-instalacao',
    name: 'Instalação de Semáforo',
    description: 'Solicitação de instalação de semáforo em cruzamento',
    icon: 'TrafficCone',
    category: 'Trânsito',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_cruzamento', type: 'text', label: 'Endereço do Cruzamento', required: true },
      { name: 'ruas_envolvidas', type: 'text', label: 'Ruas Envolvidas no Cruzamento', required: true },
      { name: 'fluxo_veiculos', type: 'select', label: 'Fluxo de Veículos', required: true },
      { name: 'fluxo_pedestres', type: 'select', label: 'Fluxo de Pedestres', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'meio-fio',
    name: 'Construção de Meio-Fio',
    description: 'Solicitação de instalação de meio-fio/guia',
    icon: 'Minimize2',
    category: 'Infraestrutura',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_local', type: 'text', label: 'Endereço do Local', required: true },
      { name: 'extensao_estimada', type: 'number', label: 'Extensão Estimada (metros)', required: false },
      { name: 'motivo', type: 'select', label: 'Motivo da Solicitação', required: true },
    ]
  },
  {
    id: 'ponte-manutencao',
    name: 'Manutenção de Ponte ou Viaduto',
    description: 'Solicitação de reparo em ponte ou viaduto',
    icon: 'Bridge',
    category: 'Infraestrutura',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'localizacao', type: 'text', label: 'Localização', required: true },
      { name: 'tipo_problema', type: 'select', label: 'Tipo de Problema', required: true },
      { name: 'nivel_gravidade', type: 'select', label: 'Nível de Gravidade', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição do Problema', required: true },
    ]
  },
  {
    id: 'recapeamento-asfaltico',
    name: 'Recapeamento Asfáltico',
    description: 'Solicitação de recapeamento de via deteriorada',
    icon: 'Layers',
    category: 'Pavimentação',
    estimatedDays: 45,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'trecho_inicio', type: 'text', label: 'Trecho Início', required: true },
      { name: 'trecho_fim', type: 'text', label: 'Trecho Fim', required: true },
      { name: 'estado_pavimento', type: 'select', label: 'Estado do Pavimento', required: true },
      { name: 'extensao_estimada', type: 'number', label: 'Extensão Estimada (metros)', required: false },
    ]
  },
  {
    id: 'rampa-acessibilidade',
    name: 'Rampa de Acessibilidade',
    description: 'Instalação de rampa para acessibilidade',
    icon: 'Accessibility',
    category: 'Acessibilidade',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_instalacao', type: 'text', label: 'Endereço para Instalação', required: true },
      { name: 'tipo_local', type: 'select', label: 'Tipo de Local', required: true },
      { name: 'publico_beneficiado', type: 'textarea', label: 'Público Beneficiado', required: true },
    ]
  },
  {
    id: 'praca-reforma',
    name: 'Reforma de Praça Pública',
    description: 'Solicitação de reforma ou manutenção em praça',
    icon: 'TreePalm',
    category: 'Espaços Públicos',
    estimatedDays: 60,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'itens_reforma', type: 'textarea', label: 'Itens que Necessitam Reforma', required: true },
      { name: 'estado_conservacao', type: 'select', label: 'Estado de Conservação', required: true },
    ]
  },
  {
    id: 'parque-infantil',
    name: 'Instalação de Parque Infantil',
    description: 'Solicitação de instalação de playground em área pública',
    icon: 'Baby',
    category: 'Espaços Públicos',
    estimatedDays: 90,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_sugerido', type: 'text', label: 'Local Sugerido', required: true },
      { name: 'num_criancas_beneficiadas', type: 'number', label: 'Número de Crianças Beneficiadas (estimativa)', required: false },
      { name: 'possui_area_disponivel', type: 'select', label: 'Área Possui Espaço Disponível?', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'academia-ar-livre',
    name: 'Academia ao Ar Livre',
    description: 'Instalação de aparelhos de ginástica em espaço público',
    icon: 'Dumbbell',
    category: 'Espaços Públicos',
    estimatedDays: 60,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'publico_alvo', type: 'select', label: 'Público-Alvo', required: true },
      { name: 'possui_iluminacao', type: 'select', label: 'Local Possui Iluminação?', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'quadra-esportiva',
    name: 'Construção de Quadra Esportiva',
    description: 'Solicitação de construção de quadra poliesportiva',
    icon: 'Goal',
    category: 'Espaços Públicos',
    estimatedDays: 180,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'local_construcao', type: 'text', label: 'Local para Construção', required: true },
      { name: 'area_disponivel', type: 'number', label: 'Área Disponível (m²)', required: false },
      { name: 'tipo_quadra', type: 'select', label: 'Tipo de Quadra', required: true },
      { name: 'num_beneficiados', type: 'number', label: 'Número de Beneficiados (estimativa)', required: false },
    ]
  },
  {
    id: 'ponto-onibus',
    name: 'Instalação de Ponto de Ônibus',
    description: 'Solicitação de instalação de abrigo de ônibus',
    icon: 'Bus',
    category: 'Transporte',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_instalacao', type: 'text', label: 'Endereço para Instalação', required: true },
      { name: 'linha_onibus', type: 'text', label: 'Linha(s) de Ônibus', required: true },
      { name: 'num_usuarios_diarios', type: 'number', label: 'Número de Usuários Diários (estimativa)', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'ciclovia-ciclofaixa',
    name: 'Implantação de Ciclovia/Ciclofaixa',
    description: 'Solicitação de via exclusiva para bicicletas',
    icon: 'Bike',
    category: 'Mobilidade',
    estimatedDays: 90,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'trecho_sugerido', type: 'text', label: 'Trecho Sugerido', required: true },
      { name: 'tipo_via', type: 'select', label: 'Tipo de Via', required: true },
      { name: 'extensao_estimada', type: 'number', label: 'Extensão Estimada (km)', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'estacionamento-rotativo',
    name: 'Zona Azul / Estacionamento Rotativo',
    description: 'Implantação de estacionamento rotativo',
    icon: 'ParkingCircle',
    category: 'Trânsito',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'rua_implantacao', type: 'text', label: 'Rua para Implantação', required: true },
      { name: 'numero_vagas', type: 'number', label: 'Número de Vagas (estimativa)', required: false },
      { name: 'motivo', type: 'select', label: 'Motivo da Solicitação', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'bueiro-instalacao',
    name: 'Instalação de Bueiro',
    description: 'Solicitação de instalação de bueiro ou boca de lobo',
    icon: 'CircleDot',
    category: 'Drenagem',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_instalacao', type: 'text', label: 'Endereço para Instalação', required: true },
      { name: 'motivo_instalacao', type: 'select', label: 'Motivo da Instalação', required: true },
      { name: 'frequencia_alagamento', type: 'select', label: 'Frequência de Alagamentos', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição', required: true },
    ]
  },
  {
    id: 'muro-contencao',
    name: 'Muro de Contenção',
    description: 'Construção de muro de contenção ou arrimo',
    icon: 'Wall',
    category: 'Infraestrutura',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_local', type: 'text', label: 'Endereço do Local', required: true },
      { name: 'altura_estimada', type: 'number', label: 'Altura Estimada (metros)', required: false },
      { name: 'extensao_estimada', type: 'number', label: 'Extensão Estimada (metros)', required: false },
      { name: 'risco_deslizamento', type: 'select', label: 'Existe Risco de Deslizamento?', required: true },
      { name: 'descricao_situacao', type: 'textarea', label: 'Descrição da Situação', required: true },
    ]
  },
  {
    id: 'galeria-pluvial',
    name: 'Construção de Galeria Pluvial',
    description: 'Implantação de galeria de águas pluviais',
    icon: 'GitBranch',
    category: 'Drenagem',
    estimatedDays: 120,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'rua_implantacao', type: 'text', label: 'Rua para Implantação', required: true },
      { name: 'extensao_estimada', type: 'number', label: 'Extensão Estimada (metros)', required: false },
      { name: 'problema_drenagem', type: 'textarea', label: 'Descrição do Problema de Drenagem', required: true },
      { name: 'frequencia_alagamento', type: 'select', label: 'Frequência de Alagamentos', required: true },
    ]
  },
  {
    id: 'passarela-pedestre',
    name: 'Passarela para Pedestres',
    description: 'Construção de passarela elevada ou subterrânea',
    icon: 'ArrowUpDown',
    category: 'Mobilidade',
    estimatedDays: 180,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'local_construcao', type: 'text', label: 'Local para Construção', required: true },
      { name: 'tipo_passarela', type: 'select', label: 'Tipo de Passarela', required: true },
      { name: 'fluxo_pedestres', type: 'select', label: 'Fluxo de Pedestres', required: true },
      { name: 'num_acidentes', type: 'number', label: 'Número de Acidentes Recentes (se souber)', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'rotatoria',
    name: 'Construção de Rotatória',
    description: 'Implantação de rotatória em cruzamento',
    icon: 'CircleDot',
    category: 'Trânsito',
    estimatedDays: 90,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'local_cruzamento', type: 'text', label: 'Local do Cruzamento', required: true },
      { name: 'ruas_envolvidas', type: 'text', label: 'Ruas Envolvidas', required: true },
      { name: 'problema_atual', type: 'select', label: 'Problema Atual', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'pista-caminhada',
    name: 'Pista de Caminhada',
    description: 'Implantação de pista para caminhada e corrida',
    icon: 'PersonStanding',
    category: 'Espaços Públicos',
    estimatedDays: 60,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_sugerido', type: 'text', label: 'Local Sugerido', required: true },
      { name: 'extensao_estimada', type: 'number', label: 'Extensão Estimada (metros)', required: false },
      { name: 'possui_iluminacao', type: 'select', label: 'Local Possui Iluminação?', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'mirante-publico',
    name: 'Construção de Mirante Público',
    description: 'Implantação de mirante em área com vista privilegiada',
    icon: 'Eye',
    category: 'Espaços Públicos',
    estimatedDays: 120,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'local_construcao', type: 'text', label: 'Local para Construção', required: true },
      { name: 'caracteristicas_local', type: 'textarea', label: 'Características do Local', required: true },
      { name: 'possui_acesso', type: 'select', label: 'Local Possui Acesso?', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'banheiro-publico',
    name: 'Banheiro Público',
    description: 'Instalação de banheiro público em área de grande circulação',
    icon: 'Bath',
    category: 'Espaços Públicos',
    estimatedDays: 90,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'fluxo_pessoas', type: 'select', label: 'Fluxo de Pessoas', required: true },
      { name: 'tipo_area', type: 'select', label: 'Tipo de Área', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'fonte-agua-potavel',
    name: 'Bebedouro Público',
    description: 'Instalação de bebedouro em espaço público',
    icon: 'Droplet',
    category: 'Espaços Públicos',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'tipo_local', type: 'select', label: 'Tipo de Local', required: true },
      { name: 'possui_rede_agua', type: 'select', label: 'Local Possui Rede de Água?', required: true },
    ]
  },
  {
    id: 'canaleta-escoamento',
    name: 'Canaleta de Escoamento',
    description: 'Construção de canaleta para escoamento de águas',
    icon: 'MoveRight',
    category: 'Drenagem',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_instalacao', type: 'text', label: 'Endereço para Instalação', required: true },
      { name: 'extensao_estimada', type: 'number', label: 'Extensão Estimada (metros)', required: false },
      { name: 'problema_atual', type: 'select', label: 'Problema Atual', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição', required: true },
    ]
  },
  {
    id: 'escadaria-publica',
    name: 'Construção de Escadaria Pública',
    description: 'Implantação de escadaria em área de desnível',
    icon: 'Stairs',
    category: 'Acessibilidade',
    estimatedDays: 45,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_construcao', type: 'text', label: 'Local para Construção', required: true },
      { name: 'desnivel_estimado', type: 'number', label: 'Desnível Estimado (metros)', required: false },
      { name: 'num_usuarios_diarios', type: 'number', label: 'Usuários Diários (estimativa)', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'paisagismo-urbano',
    name: 'Projeto de Paisagismo Urbano',
    description: 'Implantação de projeto paisagístico em área pública',
    icon: 'Flower',
    category: 'Espaços Públicos',
    estimatedDays: 60,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_implantacao', type: 'text', label: 'Local para Implantação', required: true },
      { name: 'tipo_local', type: 'select', label: 'Tipo de Local', required: true },
      { name: 'area_estimada', type: 'number', label: 'Área Estimada (m²)', required: false },
      { name: 'elementos_desejados', type: 'textarea', label: 'Elementos Desejados', required: true },
    ]
  },
  {
    id: 'cerca-alambrado',
    name: 'Cerca ou Alambrado em Área Pública',
    description: 'Instalação de cerca ou alambrado em espaço público',
    icon: 'Fence',
    category: 'Infraestrutura',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'tipo_cerca', type: 'select', label: 'Tipo de Cerca', required: true },
      { name: 'extensao_estimada', type: 'number', label: 'Extensão Estimada (metros)', required: false },
      { name: 'motivo', type: 'select', label: 'Motivo da Instalação', required: true },
    ]
  },
  {
    id: 'pintura-edificio-publico',
    name: 'Pintura de Edifício Público',
    description: 'Solicitação de pintura de prédio público',
    icon: 'Paintbrush',
    category: 'Manutenção',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_edificio', type: 'select', label: 'Tipo de Edifício', required: true },
      { name: 'estado_conservacao', type: 'select', label: 'Estado de Conservação', required: true },
    ]
  },
  {
    id: 'cobertura-arquibancada',
    name: 'Cobertura de Arquibancada',
    description: 'Instalação de cobertura em arquibancada de campo',
    icon: 'Umbrella',
    category: 'Espaços Públicos',
    estimatedDays: 90,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_campo', type: 'text', label: 'Local do Campo', required: true },
      { name: 'capacidade_arquibancada', type: 'number', label: 'Capacidade da Arquibancada', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'guarita-seguranca',
    name: 'Guarita de Segurança',
    description: 'Instalação de guarita em equipamento público',
    icon: 'ShieldCheck',
    category: 'Infraestrutura',
    estimatedDays: 45,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'tipo_equipamento', type: 'select', label: 'Tipo de Equipamento Público', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'estacionamento-bicicletario',
    name: 'Bicicletário Público',
    description: 'Instalação de bicicletário em área pública',
    icon: 'Bike',
    category: 'Mobilidade',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'num_vagas', type: 'number', label: 'Número de Vagas Sugerido', required: false },
      { name: 'tipo_local', type: 'select', label: 'Tipo de Local', required: true },
      { name: 'demanda_estimada', type: 'select', label: 'Demanda Estimada', required: true },
    ]
  },
  {
    id: 'murais-artisticos',
    name: 'Autorização para Mural Artístico',
    description: 'Autorização para pintura de mural em espaço público',
    icon: 'Palette',
    category: 'Arte Urbana',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'local_mural', type: 'text', label: 'Local do Mural', required: true },
      { name: 'dimensoes', type: 'text', label: 'Dimensões (altura x largura)', required: true },
      { name: 'tema_obra', type: 'textarea', label: 'Tema da Obra', required: true },
      { name: 'possui_portfolio', type: 'select', label: 'Possui Portfólio?', required: true },
    ]
  },
  {
    id: 'relogio-publico',
    name: 'Instalação de Relógio Público',
    description: 'Implantação de relógio em praça ou área pública',
    icon: 'Clock',
    category: 'Mobiliário Urbano',
    estimatedDays: 45,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'tipo_area', type: 'select', label: 'Tipo de Área', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'totem-informativo',
    name: 'Totem Informativo',
    description: 'Instalação de totem com informações turísticas ou institucionais',
    icon: 'Info',
    category: 'Mobiliário Urbano',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'tipo_informacao', type: 'select', label: 'Tipo de Informação', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'bancos-praça',
    name: 'Instalação de Bancos em Praça',
    description: 'Solicitação de bancos para descanso em área pública',
    icon: 'Armchair',
    category: 'Mobiliário Urbano',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'quantidade_bancos', type: 'number', label: 'Quantidade de Bancos', required: false },
      { name: 'motivo', type: 'textarea', label: 'Motivo da Solicitação', required: true },
    ]
  },
  {
    id: 'lixeiras-publicas',
    name: 'Instalação de Lixeiras Públicas',
    description: 'Solicitação de instalação de lixeiras em vias ou praças',
    icon: 'Trash2',
    category: 'Mobiliário Urbano',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'tipo_lixeira', type: 'select', label: 'Tipo de Lixeira', required: true },
      { name: 'quantidade', type: 'number', label: 'Quantidade', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'marquise-ponto-onibus',
    name: 'Cobertura para Ponto de Ônibus',
    description: 'Instalação de cobertura em ponto de ônibus existente',
    icon: 'Tent',
    category: 'Transporte',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_ponto', type: 'text', label: 'Endereço do Ponto', required: true },
      { name: 'linha_onibus', type: 'text', label: 'Linha(s) de Ônibus', required: true },
      { name: 'num_usuarios', type: 'number', label: 'Usuários Diários (estimativa)', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'piso-tatil',
    name: 'Instalação de Piso Tátil',
    description: 'Implantação de piso tátil para acessibilidade',
    icon: 'Grid3x3',
    category: 'Acessibilidade',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'tipo_local', type: 'select', label: 'Tipo de Local', required: true },
      { name: 'extensao_estimada', type: 'number', label: 'Extensão Estimada (metros)', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'cameras-monitoramento',
    name: 'Instalação de Câmeras de Monitoramento',
    description: 'Solicitação de câmeras de segurança em área pública',
    icon: 'Camera',
    category: 'Segurança',
    estimatedDays: 45,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'tipo_area', type: 'select', label: 'Tipo de Área', required: true },
      { name: 'motivo_solicitacao', type: 'select', label: 'Motivo da Solicitação', required: true },
      { name: 'historico_ocorrencias', type: 'textarea', label: 'Histórico de Ocorrências', required: true },
    ]
  },
  {
    id: 'parquimetro-digital',
    name: 'Parquímetro Digital',
    description: 'Instalação de parquímetro digital para zona azul',
    icon: 'Smartphone',
    category: 'Trânsito',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_instalacao', type: 'text', label: 'Local para Instalação', required: true },
      { name: 'numero_vagas', type: 'number', label: 'Número de Vagas', required: false },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ]
  },
  {
    id: 'revitalizacao-fachada',
    name: 'Revitalização de Fachada Histórica',
    description: 'Projeto de revitalização de fachada de prédio histórico',
    icon: 'Building',
    category: 'Patrimônio',
    estimatedDays: 120,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_edificio', type: 'text', label: 'Endereço do Edifício', required: true },
      { name: 'ano_construcao', type: 'number', label: 'Ano de Construção (aproximado)', required: false },
      { name: 'estado_conservacao', type: 'select', label: 'Estado de Conservação', required: true },
      { name: 'tombamento', type: 'select', label: 'Imóvel Tombado?', required: true },
    ]
  }
];
