import { ServiceSuggestion } from './types';

export const planejamentourbanoSuggestions: ServiceSuggestion[] = [
  {
    id: 'alvara-construcao',
    name: 'Alvará de Construção',
    description: 'Licença para construir, reformar ou ampliar edificação',
    icon: 'Building2',
    category: 'Licenciamento',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_obra', type: 'text', label: 'Endereço da Obra', required: true },
      { name: 'tipo_obra', type: 'select', label: 'Tipo de Obra', required: true },
      { name: 'area_construir', type: 'number', label: 'Área a Construir (m²)', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
      { name: 'crea_cau', type: 'text', label: 'CREA/CAU', required: true },
    ]
  },
  {
    id: 'certidao-uso-solo',
    name: 'Certidão de Uso do Solo',
    description: 'Certidão informando uso permitido no terreno',
    icon: 'FileText',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: false },
      { name: 'finalidade_certidao', type: 'select', label: 'Finalidade da Certidão', required: true },
    ]
  },
  {
    id: 'parcelamento-solo-loteamento',
    name: 'Aprovação de Loteamento',
    description: 'Aprovação de projeto de loteamento urbano',
    icon: 'Map',
    category: 'Parcelamento',
    estimatedDays: 90,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cnpj', type: 'cnpj', label: 'CNPJ', required: true },
      { name: 'area_gleba', type: 'number', label: 'Área da Gleba (m²)', required: true },
      { name: 'num_lotes', type: 'number', label: 'Número de Lotes Projetados', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
    ]
  },
  {
    id: 'habite-se',
    name: 'Habite-se / CVO',
    description: 'Certificado de Vistoria de Obra / Habite-se',
    icon: 'CheckCircle',
    category: 'Certificados',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_obra', type: 'text', label: 'Endereço da Obra', required: true },
      { name: 'num_alvara', type: 'text', label: 'Número do Alvará de Construção', required: true },
      { name: 'data_conclusao', type: 'date', label: 'Data de Conclusão da Obra', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
    ]
  },
  {
    id: 'desmembramento-terreno',
    name: 'Desmembramento de Terreno',
    description: 'Divisão de terreno em lotes menores',
    icon: 'Scissors',
    category: 'Parcelamento',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_terreno', type: 'text', label: 'Endereço do Terreno', required: true },
      { name: 'area_total', type: 'number', label: 'Área Total (m²)', required: true },
      { name: 'num_lotes_resultantes', type: 'number', label: 'Número de Lotes Resultantes', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
    ]
  },
  {
    id: 'unificacao-lotes',
    name: 'Unificação de Lotes',
    description: 'Junção de lotes contíguos em um único lote',
    icon: 'Merge',
    category: 'Parcelamento',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_lotes', type: 'text', label: 'Endereço dos Lotes', required: true },
      { name: 'num_lotes_unificar', type: 'number', label: 'Número de Lotes a Unificar', required: true },
      { name: 'area_total_resultante', type: 'number', label: 'Área Total Resultante (m²)', required: true },
    ]
  },
  {
    id: 'consulta-previa-viabilidade',
    name: 'Consulta Prévia de Viabilidade',
    description: 'Consulta sobre viabilidade de empreendimento',
    icon: 'FileQuestion',
    category: 'Consultas',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_terreno', type: 'text', label: 'Endereço do Terreno', required: true },
      { name: 'tipo_empreendimento', type: 'select', label: 'Tipo de Empreendimento', required: true },
      { name: 'area_terreno', type: 'number', label: 'Área do Terreno (m²)', required: true },
      { name: 'area_construir_estimada', type: 'number', label: 'Área a Construir Estimada (m²)', required: false },
    ]
  },
  {
    id: 'alvara-demolicao',
    name: 'Alvará de Demolição',
    description: 'Autorização para demolir edificação',
    icon: 'Hammer',
    category: 'Licenciamento',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_demolicao', type: 'select', label: 'Tipo de Demolição', required: true },
      { name: 'motivo_demolicao', type: 'textarea', label: 'Motivo da Demolição', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
    ]
  },
  {
    id: 'certidao-numeracao-predial',
    name: 'Certidão de Numeração Predial',
    description: 'Atribuição de número ao imóvel',
    icon: 'Hash',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel (sem número)', required: true },
      { name: 'tipo_imovel', type: 'select', label: 'Tipo de Imóvel', required: true },
      { name: 'possui_habite_se', type: 'select', label: 'Possui Habite-se?', required: true },
    ]
  },
  {
    id: 'certidao-alinhamento',
    name: 'Certidão de Alinhamento',
    description: 'Certidão com alinhamento e recuos do terreno',
    icon: 'Ruler',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_terreno', type: 'text', label: 'Endereço do Terreno', required: true },
      { name: 'area_terreno', type: 'number', label: 'Área do Terreno (m²)', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'aprovacao-projeto-arquitetonico',
    name: 'Aprovação de Projeto Arquitetônico',
    description: 'Análise e aprovação de projeto arquitetônico',
    icon: 'PenTool',
    category: 'Projetos',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_obra', type: 'text', label: 'Endereço da Obra', required: true },
      { name: 'tipo_projeto', type: 'select', label: 'Tipo de Projeto', required: true },
      { name: 'area_construir', type: 'number', label: 'Área a Construir (m²)', required: true },
      { name: 'num_pavimentos', type: 'number', label: 'Número de Pavimentos', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Arquiteto Responsável', required: true },
      { name: 'cau', type: 'text', label: 'CAU', required: true },
    ]
  },
  {
    id: 'modificacao-projeto-aprovado',
    name: 'Modificação de Projeto Aprovado',
    description: 'Alteração de projeto já aprovado',
    icon: 'Edit',
    category: 'Projetos',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'num_processo_original', type: 'text', label: 'Número do Processo Original', required: true },
      { name: 'descricao_alteracoes', type: 'textarea', label: 'Descrição das Alterações', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
    ]
  },
  {
    id: 'regularizacao-obra',
    name: 'Regularização de Obra',
    description: 'Regularização de obra executada sem licença',
    icon: 'FileWarning',
    category: 'Regularização',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_irregularidade', type: 'select', label: 'Tipo de Irregularidade', required: true },
      { name: 'area_irregular', type: 'number', label: 'Área Irregular (m²)', required: true },
      { name: 'ano_construcao_estimado', type: 'number', label: 'Ano de Construção (estimado)', required: false },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
    ]
  },
  {
    id: 'zoneamento-consulta',
    name: 'Consulta de Zoneamento',
    description: 'Informações sobre zoneamento de área específica',
    icon: 'MapPinned',
    category: 'Consultas',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_consulta', type: 'text', label: 'Endereço para Consulta', required: true },
      { name: 'finalidade_consulta', type: 'textarea', label: 'Finalidade da Consulta', required: true },
    ]
  },
  {
    id: 'certidao-cadastro-urbano',
    name: 'Certidão de Cadastro Urbano',
    description: 'Certidão com dados cadastrais do imóvel',
    icon: 'FileCheck',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'inscricao_municipal', type: 'text', label: 'Inscrição Municipal (se souber)', required: false },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'licenca-localizacao',
    name: 'Licença de Localização e Funcionamento',
    description: 'Licença para estabelecimento comercial/industrial',
    icon: 'Store',
    category: 'Licenciamento',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cnpj', type: 'cnpj', label: 'CNPJ', required: true },
      { name: 'razao_social', type: 'text', label: 'Razão Social', required: true },
      { name: 'endereco_estabelecimento', type: 'text', label: 'Endereço do Estabelecimento', required: true },
      { name: 'atividade_principal', type: 'select', label: 'Atividade Principal', required: true },
      { name: 'area_estabelecimento', type: 'number', label: 'Área do Estabelecimento (m²)', required: true },
      { name: 'num_funcionarios', type: 'number', label: 'Número de Funcionários', required: false },
    ]
  },
  {
    id: 'alvara-reforma',
    name: 'Alvará de Reforma',
    description: 'Licença para reforma de edificação existente',
    icon: 'Wrench',
    category: 'Licenciamento',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_reforma', type: 'select', label: 'Tipo de Reforma', required: true },
      { name: 'area_reforma', type: 'number', label: 'Área da Reforma (m²)', required: true },
      { name: 'descricao_reforma', type: 'textarea', label: 'Descrição da Reforma', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: false },
    ]
  },
  {
    id: 'autorizacao-movimento-terra',
    name: 'Autorização para Movimento de Terra',
    description: 'Licença para terraplenagem e movimentação de terra',
    icon: 'Mountain',
    category: 'Licenciamento',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_terreno', type: 'text', label: 'Endereço do Terreno', required: true },
      { name: 'volume_movimentacao', type: 'number', label: 'Volume de Movimentação (m³)', required: true },
      { name: 'tipo_movimento', type: 'select', label: 'Tipo de Movimento', required: true },
      { name: 'finalidade', type: 'textarea', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'licenca-instalacao-publicidade',
    name: 'Licença para Publicidade',
    description: 'Autorização para instalação de anúncio/placa',
    icon: 'Billboard',
    category: 'Publicidade',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_instalacao', type: 'text', label: 'Endereço da Instalação', required: true },
      { name: 'tipo_publicidade', type: 'select', label: 'Tipo de Publicidade', required: true },
      { name: 'dimensoes', type: 'text', label: 'Dimensões (LxAxP)', required: true },
      { name: 'possui_iluminacao', type: 'select', label: 'Possui Iluminação?', required: true },
    ]
  },
  {
    id: 'certidao-baixa-imovel',
    name: 'Certidão de Baixa de Imóvel',
    description: 'Baixa de imóvel no cadastro municipal',
    icon: 'FileX',
    category: 'Certidões',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'motivo_baixa', type: 'select', label: 'Motivo da Baixa', required: true },
      { name: 'possui_demolicao', type: 'select', label: 'Possui Alvará de Demolição?', required: true },
    ]
  },
  {
    id: 'plano-diretor-consulta',
    name: 'Consulta ao Plano Diretor',
    description: 'Informações sobre Plano Diretor Municipal',
    icon: 'BookOpen',
    category: 'Consultas',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'assunto_consulta', type: 'textarea', label: 'Assunto da Consulta', required: true },
      { name: 'area_interesse', type: 'text', label: 'Área de Interesse (se aplicável)', required: false },
    ]
  },
  {
    id: 'retificacao-area',
    name: 'Retificação de Área',
    description: 'Correção de área de lote ou edificação',
    icon: 'FileEdit',
    category: 'Regularização',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'area_cadastrada', type: 'number', label: 'Área Cadastrada Atualmente (m²)', required: true },
      { name: 'area_real', type: 'number', label: 'Área Real Medida (m²)', required: true },
      { name: 'motivo_retificacao', type: 'textarea', label: 'Motivo da Retificação', required: true },
    ]
  },
  {
    id: 'desdobro-matricula',
    name: 'Desdobro de Matrícula',
    description: 'Orientação para desdobro de matrícula de lote',
    icon: 'Split',
    category: 'Parcelamento',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'matricula_origem', type: 'text', label: 'Matrícula de Origem', required: true },
      { name: 'num_lotes_resultantes', type: 'number', label: 'Número de Lotes Resultantes', required: true },
    ]
  },
  {
    id: 'certidao-confrontacao',
    name: 'Certidão de Confrontação',
    description: 'Certidão com confrontantes do lote',
    icon: 'Grid',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_lote', type: 'text', label: 'Endereço do Lote', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'aprovacao-condominio',
    name: 'Aprovação de Condomínio',
    description: 'Aprovação de projeto de condomínio horizontal',
    icon: 'Building',
    category: 'Parcelamento',
    estimatedDays: 90,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cnpj', type: 'cnpj', label: 'CNPJ', required: true },
      { name: 'area_total', type: 'number', label: 'Área Total (m²)', required: true },
      { name: 'num_unidades', type: 'number', label: 'Número de Unidades', required: true },
      { name: 'tipo_condominio', type: 'select', label: 'Tipo de Condomínio', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
    ]
  },
  {
    id: 'aumento-area-construida',
    name: 'Ampliação de Área Construída',
    description: 'Autorização para ampliar edificação existente',
    icon: 'Maximize',
    category: 'Licenciamento',
    estimatedDays: 25,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'area_existente', type: 'number', label: 'Área Existente (m²)', required: true },
      { name: 'area_ampliar', type: 'number', label: 'Área a Ampliar (m²)', required: true },
      { name: 'finalidade_ampliacao', type: 'textarea', label: 'Finalidade da Ampliação', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
    ]
  },
  {
    id: 'autorizacao-perfuracao-poco',
    name: 'Autorização para Perfuração de Poço',
    description: 'Licença urbanística para poço artesiano',
    icon: 'CircleDot',
    category: 'Licenciamento',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_perfuracao', type: 'text', label: 'Endereço da Perfuração', required: true },
      { name: 'finalidade_uso', type: 'select', label: 'Finalidade do Uso', required: true },
      { name: 'profundidade_prevista', type: 'number', label: 'Profundidade Prevista (metros)', required: true },
    ]
  },
  {
    id: 'certidao-area-verde',
    name: 'Certidão de Área Verde',
    description: 'Certidão sobre áreas verdes do loteamento',
    icon: 'TreePine',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'transferencia-potencial-construtivo',
    name: 'Transferência de Potencial Construtivo',
    description: 'Transferência de direito de construir',
    icon: 'ArrowRightLeft',
    category: 'Instrumentos Urbanísticos',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj_cedente', type: 'text', label: 'CPF/CNPJ Cedente', required: true },
      { name: 'cpf_cnpj_cessionario', type: 'text', label: 'CPF/CNPJ Cessionário', required: true },
      { name: 'imovel_cedente', type: 'text', label: 'Endereço Imóvel Cedente', required: true },
      { name: 'imovel_receptor', type: 'text', label: 'Endereço Imóvel Receptor', required: true },
      { name: 'area_transferir', type: 'number', label: 'Área a Transferir (m²)', required: true },
    ]
  },
  {
    id: 'certidao-baixa-edificacao',
    name: 'Certidão de Baixa de Edificação',
    description: 'Baixa de edificação demolida ou destruída',
    icon: 'FileX',
    category: 'Certidões',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_edificacao', type: 'text', label: 'Endereço da Edificação', required: true },
      { name: 'motivo_baixa', type: 'select', label: 'Motivo da Baixa', required: true },
      { name: 'data_demolicao', type: 'date', label: 'Data da Demolição', required: false },
    ]
  },
  {
    id: 'licenca-ocupacao-temporaria',
    name: 'Licença de Ocupação Temporária',
    description: 'Autorização para ocupação temporária de via',
    icon: 'Calendar',
    category: 'Licenciamento',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_ocupacao', type: 'text', label: 'Endereço da Ocupação', required: true },
      { name: 'finalidade_ocupacao', type: 'select', label: 'Finalidade da Ocupação', required: true },
      { name: 'data_inicio', type: 'date', label: 'Data de Início', required: true },
      { name: 'data_fim', type: 'date', label: 'Data de Término', required: true },
      { name: 'area_ocupar', type: 'number', label: 'Área a Ocupar (m²)', required: true },
    ]
  },
  {
    id: 'aprovacao-remembramento',
    name: 'Remembramento de Lotes',
    description: 'Aprovação de remembramento/unificação cadastral',
    icon: 'Combine',
    category: 'Parcelamento',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'lotes_rememorar', type: 'textarea', label: 'Identificação dos Lotes a Remembrar', required: true },
      { name: 'area_total_resultante', type: 'number', label: 'Área Total Resultante (m²)', required: true },
    ]
  },
  {
    id: 'certidao-restricao-urbanistica',
    name: 'Certidão de Restrições Urbanísticas',
    description: 'Certidão sobre restrições urbanísticas do imóvel',
    icon: 'ShieldAlert',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'outorga-onerosa',
    name: 'Outorga Onerosa do Direito de Construir',
    description: 'Compra de potencial construtivo adicional',
    icon: 'TrendingUp',
    category: 'Instrumentos Urbanísticos',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'area_adicional', type: 'number', label: 'Área Adicional Solicitada (m²)', required: true },
      { name: 'finalidade_uso', type: 'select', label: 'Finalidade do Uso', required: true },
    ]
  },
  {
    id: 'certidao-caracteristicas-urbanisticas',
    name: 'Certidão de Características Urbanísticas',
    description: 'Certidão com parâmetros urbanísticos do lote',
    icon: 'Info',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_lote', type: 'text', label: 'Endereço do Lote', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'aprovacao-edificio-garagem',
    name: 'Aprovação de Edifício Garagem',
    description: 'Aprovação de projeto de edifício exclusivo para garagem',
    icon: 'ParkingSquare',
    category: 'Projetos',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_obra', type: 'text', label: 'Endereço da Obra', required: true },
      { name: 'num_pavimentos', type: 'number', label: 'Número de Pavimentos', required: true },
      { name: 'num_vagas', type: 'number', label: 'Número de Vagas', required: true },
      { name: 'area_total', type: 'number', label: 'Área Total (m²)', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
    ]
  },
  {
    id: 'licenca-instalacao-antena',
    name: 'Licença para Instalação de Antena',
    description: 'Autorização para instalação de antena/torre',
    icon: 'Radio',
    category: 'Licenciamento',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cnpj', type: 'cnpj', label: 'CNPJ', required: true },
      { name: 'endereco_instalacao', type: 'text', label: 'Endereço da Instalação', required: true },
      { name: 'tipo_antena', type: 'select', label: 'Tipo de Antena/Torre', required: true },
      { name: 'altura_estrutura', type: 'number', label: 'Altura da Estrutura (metros)', required: true },
      { name: 'possui_autorizacao_anatel', type: 'select', label: 'Possui Autorização ANATEL?', required: true },
    ]
  },
  {
    id: 'certidao-destinacao-lote',
    name: 'Certidão de Destinação de Lote',
    description: 'Certidão sobre destinação original de lote em loteamento',
    icon: 'FileSearch',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_lote', type: 'text', label: 'Endereço do Lote', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'aprovacao-mezanino',
    name: 'Aprovação de Mezanino',
    description: 'Aprovação de projeto de mezanino',
    icon: 'Layers',
    category: 'Projetos',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'area_mezanino', type: 'number', label: 'Área do Mezanino (m²)', required: true },
      { name: 'pe_direito', type: 'number', label: 'Pé-Direito (metros)', required: true },
      { name: 'finalidade_uso', type: 'select', label: 'Finalidade do Uso', required: true },
      { name: 'responsavel_tecnico', type: 'text', label: 'Responsável Técnico', required: true },
    ]
  },
  {
    id: 'autorizacao-tapume',
    name: 'Autorização para Tapume',
    description: 'Autorização para instalação de tapume na obra',
    icon: 'Shield',
    category: 'Licenciamento',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_obra', type: 'text', label: 'Endereço da Obra', required: true },
      { name: 'extensao_tapume', type: 'number', label: 'Extensão do Tapume (metros)', required: true },
      { name: 'num_alvara', type: 'text', label: 'Número do Alvará de Construção', required: false },
      { name: 'tipo_tapume', type: 'select', label: 'Tipo de Tapume', required: true },
    ]
  },
  {
    id: 'renovacao-alvara',
    name: 'Renovação de Alvará',
    description: 'Renovação de alvará de construção vencido',
    icon: 'RefreshCw',
    category: 'Licenciamento',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_obra', type: 'text', label: 'Endereço da Obra', required: true },
      { name: 'num_alvara_original', type: 'text', label: 'Número do Alvará Original', required: true },
      { name: 'percentual_executado', type: 'number', label: 'Percentual Executado (%)', required: true },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa para Renovação', required: true },
    ]
  },
  {
    id: 'licenca-obra-arte',
    name: 'Licença para Obra de Arte',
    description: 'Autorização para instalação de escultura/monumento',
    icon: 'Palette',
    category: 'Arte Pública',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'local_instalacao', type: 'text', label: 'Local da Instalação', required: true },
      { name: 'tipo_obra', type: 'select', label: 'Tipo de Obra', required: true },
      { name: 'dimensoes_obra', type: 'text', label: 'Dimensões da Obra', required: true },
      { name: 'descricao_conceito', type: 'textarea', label: 'Descrição e Conceito', required: true },
    ]
  },
  {
    id: 'certidao-ocupacao-irregular',
    name: 'Certidão de Ocupação Irregular',
    description: 'Certidão sobre situação de ocupação irregular',
    icon: 'FileWarning',
    category: 'Certidões',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_ocupacao', type: 'text', label: 'Endereço da Ocupação', required: true },
      { name: 'tempo_ocupacao', type: 'number', label: 'Tempo de Ocupação (anos)', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade da Certidão', required: true },
    ]
  },
  {
    id: 'aprovacao-piscina',
    name: 'Aprovação de Piscina',
    description: 'Aprovação de projeto de piscina',
    icon: 'Waves',
    category: 'Projetos',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'tipo_piscina', type: 'select', label: 'Tipo de Piscina', required: true },
      { name: 'dimensoes', type: 'text', label: 'Dimensões (CxLxP)', required: true },
      { name: 'volume_agua', type: 'number', label: 'Volume de Água (m³)', required: false },
    ]
  },
  {
    id: 'certidao-negativa-obra',
    name: 'Certidão Negativa de Obra',
    description: 'Certidão negativa de pendências de obra',
    icon: 'FileCheck2',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
    ]
  },
  {
    id: 'autorizacao-andaime',
    name: 'Autorização para Andaime',
    description: 'Autorização para instalação de andaime em via pública',
    icon: 'Construction',
    category: 'Licenciamento',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'endereco_obra', type: 'text', label: 'Endereço da Obra', required: true },
      { name: 'altura_andaime', type: 'number', label: 'Altura do Andaime (metros)', required: true },
      { name: 'area_ocupacao_calcada', type: 'number', label: 'Área de Ocupação da Calçada (m²)', required: true },
      { name: 'prazo_ocupacao', type: 'number', label: 'Prazo de Ocupação (dias)', required: true },
    ]
  },
  {
    id: 'certidao-averbacao-construcao',
    name: 'Certidão para Averbação de Construção',
    description: 'Certidão para averbação de construção no cartório',
    icon: 'FileSignature',
    category: 'Certidões',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_cnpj', type: 'text', label: 'CPF/CNPJ', required: true },
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'matricula_imovel', type: 'text', label: 'Matrícula do Imóvel', required: true },
      { name: 'area_construida', type: 'number', label: 'Área Construída (m²)', required: true },
      { name: 'possui_habite_se', type: 'select', label: 'Possui Habite-se?', required: true },
    ]
  }
];
