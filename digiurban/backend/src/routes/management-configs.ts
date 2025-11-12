/**
 * Configurações da Aba de Gerenciamento Inteligente
 * Define como cada módulo deve exibir e gerenciar seus dados coletados
 */

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'array' | 'enum';
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  displayInTable?: boolean;
  displayInCard?: boolean;
  format?: (value: any) => string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date-range' | 'number-range' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
}

export interface QuickFilterConfig {
  label: string;
  icon?: string;
  filter: Record<string, any>;
}

export interface ManagementModuleConfig {
  moduleType: string;
  title: string;
  description: string;

  // Campos principais
  fields: FieldConfig[];

  // Filtros disponíveis
  filters: FilterConfig[];

  // Filtros rápidos (pré-configurados)
  quickFilters: QuickFilterConfig[];

  // Colunas padrão na tabela
  defaultTableColumns: string[];

  // Campo usado como título/nome principal
  primaryField: string;

  // Campo usado como subtítulo/descrição
  secondaryField?: string;

  // Campos que devem ser validados na edição
  validations?: Record<string, (value: any) => string | null>;

  // Ações em lote disponíveis
  bulkActions?: Array<{
    key: string;
    label: string;
    icon?: string;
    confirmMessage?: string;
  }>;
}

// ============================================================================
// CONFIGURAÇÃO: CADASTRO DE PRODUTOR RURAL
// ============================================================================

export const CADASTRO_PRODUTOR_CONFIG: ManagementModuleConfig = {
  moduleType: 'CADASTRO_PRODUTOR',
  title: 'Produtores Rurais',
  description: 'Gerenciamento da base de produtores rurais cadastrados',

  primaryField: 'nome',
  secondaryField: 'tipoProdutor',

  defaultTableColumns: ['nome', 'cpf', 'tipoProdutor', 'areaTotalHectares', 'dap', 'telefone'],

  fields: [
    // Identificação
    { key: 'nome', label: 'Nome Completo', type: 'text', searchable: true, displayInTable: true, displayInCard: true, sortable: true },
    { key: 'cpf', label: 'CPF', type: 'text', searchable: true, displayInTable: true, displayInCard: true },
    { key: 'rg', label: 'RG', type: 'text', displayInCard: true },
    { key: 'dataNascimento', label: 'Data de Nascimento', type: 'date', displayInCard: true },

    // Contato
    { key: 'email', label: 'E-mail', type: 'text', searchable: true, displayInTable: true, displayInCard: true },
    { key: 'telefone', label: 'Telefone', type: 'text', searchable: true, displayInTable: true, displayInCard: true },
    { key: 'telefoneSecundario', label: 'Telefone Secundário', type: 'text', displayInCard: true },

    // Endereço
    { key: 'cep', label: 'CEP', type: 'text', displayInCard: true },
    { key: 'logradouro', label: 'Logradouro', type: 'text', displayInCard: true },
    { key: 'numero', label: 'Número', type: 'text', displayInCard: true },
    { key: 'bairro', label: 'Bairro', type: 'text', searchable: true, filterable: true, displayInCard: true },
    { key: 'complemento', label: 'Complemento', type: 'text', displayInCard: true },

    // Dados do Produtor
    { key: 'tipoProdutor', label: 'Tipo de Produtor', type: 'enum', filterable: true, displayInTable: true, displayInCard: true },
    { key: 'dap', label: 'DAP (PRONAF)', type: 'text', searchable: true, filterable: true, displayInTable: true, displayInCard: true },
    { key: 'areaTotalHectares', label: 'Área Total (ha)', type: 'number', filterable: true, sortable: true, displayInTable: true, displayInCard: true },
    { key: 'tipoPropriedade', label: 'Tipo de Propriedade', type: 'enum', filterable: true, displayInCard: true },
    { key: 'nomePropriedade', label: 'Nome da Propriedade', type: 'text', searchable: true, displayInCard: true },
    { key: 'enderecoPropriedade', label: 'Localização da Propriedade', type: 'text', displayInCard: true },
    { key: 'coordenadasGPS', label: 'Coordenadas GPS', type: 'text', displayInCard: true },

    // Produção
    { key: 'principaisCulturas', label: 'Principais Culturas', type: 'array', filterable: true, displayInCard: true },
    { key: 'principaisCriacoes', label: 'Criações Animais', type: 'array', filterable: true, displayInCard: true },
    { key: 'possuiIrrigacao', label: 'Possui Irrigação', type: 'boolean', filterable: true, displayInCard: true },
    { key: 'tipoIrrigacao', label: 'Tipo de Irrigação', type: 'array', displayInCard: true },
    { key: 'usaAgrotoxicos', label: 'Usa Agrotóxicos', type: 'boolean', filterable: true, displayInCard: true },
    { key: 'possuiCertificacaoOrganica', label: 'Certificação Orgânica', type: 'boolean', filterable: true, displayInCard: true },
    { key: 'orgaoCertificador', label: 'Órgão Certificador', type: 'text', displayInCard: true },

    // Associativismo
    { key: 'participaCooperativa', label: 'Participa de Cooperativa', type: 'boolean', filterable: true, displayInCard: true },
    { key: 'nomeCooperativa', label: 'Nome da Cooperativa', type: 'text', displayInCard: true },
    { key: 'participaSindicato', label: 'É Sindicalizado', type: 'boolean', filterable: true, displayInCard: true },
    { key: 'nomeSindicato', label: 'Nome do Sindicato', type: 'text', displayInCard: true },

    // Programas
    { key: 'comercializaPAA', label: 'Comercializa para PAA', type: 'boolean', filterable: true, displayInCard: true },
    { key: 'comercializaPNAE', label: 'Fornece para Merenda', type: 'boolean', filterable: true, displayInCard: true },

    // Infraestrutura
    { key: 'possuiMaquinario', label: 'Possui Maquinário', type: 'boolean', filterable: true, displayInCard: true },
    { key: 'tiposMaquinario', label: 'Tipos de Maquinário', type: 'array', displayInCard: true },
    { key: 'recebeATER', label: 'Recebe ATER', type: 'boolean', filterable: true, displayInCard: true },
    { key: 'orgaoATER', label: 'Órgão ATER', type: 'text', displayInCard: true },

    // Complementares
    { key: 'estadoCivil', label: 'Estado Civil', type: 'enum', displayInCard: true },
    { key: 'profissao', label: 'Profissão', type: 'text', displayInCard: true },
    { key: 'rendaFamiliar', label: 'Renda Familiar', type: 'enum', filterable: true, displayInCard: true },
    { key: 'observacoes', label: 'Observações', type: 'text', displayInCard: true },
  ],

  filters: [
    {
      key: 'tipoProdutor',
      label: 'Tipo de Produtor',
      type: 'multiselect',
      options: [
        { value: 'Agricultor Familiar', label: 'Agricultor Familiar' },
        { value: 'Produtor Rural', label: 'Produtor Rural' },
        { value: 'Assentado', label: 'Assentado' },
        { value: 'Quilombola', label: 'Quilombola' },
        { value: 'Indígena', label: 'Indígena' },
      ]
    },
    {
      key: 'areaTotalHectares',
      label: 'Área Total',
      type: 'number-range',
    },
    {
      key: 'possuiCertificacaoOrganica',
      label: 'Certificação Orgânica',
      type: 'boolean',
    },
    {
      key: 'comercializaPAA',
      label: 'Comercializa PAA',
      type: 'boolean',
    },
    {
      key: 'comercializaPNAE',
      label: 'Fornece PNAE',
      type: 'boolean',
    },
    {
      key: 'participaCooperativa',
      label: 'Cooperado',
      type: 'boolean',
    },
    {
      key: 'bairro',
      label: 'Bairro',
      type: 'text',
    },
    {
      key: 'principaisCulturas',
      label: 'Culturas',
      type: 'multiselect',
      options: [
        { value: 'Milho', label: 'Milho' },
        { value: 'Feijão', label: 'Feijão' },
        { value: 'Arroz', label: 'Arroz' },
        { value: 'Mandioca', label: 'Mandioca' },
        { value: 'Café', label: 'Café' },
        { value: 'Hortaliças', label: 'Hortaliças' },
      ]
    },
  ],

  quickFilters: [
    {
      label: 'Agricultura Familiar',
      icon: 'Users',
      filter: { tipoProdutor: 'Agricultor Familiar' }
    },
    {
      label: 'Com DAP',
      icon: 'Award',
      filter: { dap: { $ne: '' } }
    },
    {
      label: 'Orgânicos',
      icon: 'Leaf',
      filter: { possuiCertificacaoOrganica: true }
    },
    {
      label: 'PAA/PNAE',
      icon: 'ShoppingCart',
      filter: { $or: [{ comercializaPAA: true }, { comercializaPNAE: true }] }
    },
    {
      label: 'Cooperados',
      icon: 'Building',
      filter: { participaCooperativa: true }
    },
  ],

  bulkActions: [
    {
      key: 'export-selected',
      label: 'Exportar Selecionados',
      icon: 'Download',
    },
    {
      key: 'send-notification',
      label: 'Enviar Notificação',
      icon: 'Bell',
      confirmMessage: 'Deseja enviar notificação para os produtores selecionados?',
    },
  ],
};

// ============================================================================
// CONFIGURAÇÃO: CADASTRO DE PACIENTE
// ============================================================================

export const CADASTRO_PACIENTE_CONFIG: ManagementModuleConfig = {
  moduleType: 'CADASTRO_PACIENTE',
  title: 'Pacientes',
  description: 'Gerenciamento da base de pacientes cadastrados',

  primaryField: 'nome',
  secondaryField: 'cartaoSUS',

  defaultTableColumns: ['nome', 'cpf', 'cartaoSUS', 'dataNascimento', 'telefone', 'unidadeSaude'],

  fields: [
    { key: 'nome', label: 'Nome Completo', type: 'text', searchable: true, displayInTable: true, displayInCard: true, sortable: true },
    { key: 'cpf', label: 'CPF', type: 'text', searchable: true, displayInTable: true, displayInCard: true },
    { key: 'cartaoSUS', label: 'Cartão SUS', type: 'text', searchable: true, displayInTable: true, displayInCard: true },
    { key: 'dataNascimento', label: 'Data de Nascimento', type: 'date', displayInTable: true, displayInCard: true, filterable: true },
    { key: 'telefone', label: 'Telefone', type: 'text', searchable: true, displayInTable: true, displayInCard: true },
    { key: 'email', label: 'E-mail', type: 'text', displayInCard: true },
    { key: 'unidadeSaude', label: 'Unidade de Saúde', type: 'text', filterable: true, displayInTable: true, displayInCard: true },
    { key: 'bairro', label: 'Bairro', type: 'text', filterable: true, displayInCard: true },
    { key: 'tipoSanguineo', label: 'Tipo Sanguíneo', type: 'enum', filterable: true, displayInCard: true },
    { key: 'alergias', label: 'Alergias', type: 'array', displayInCard: true },
    { key: 'doencasCronicas', label: 'Doenças Crônicas', type: 'array', filterable: true, displayInCard: true },
  ],

  filters: [
    { key: 'unidadeSaude', label: 'Unidade de Saúde', type: 'select', options: [] },
    { key: 'bairro', label: 'Bairro', type: 'text' },
    { key: 'dataNascimento', label: 'Data de Nascimento', type: 'date-range' },
    { key: 'tipoSanguineo', label: 'Tipo Sanguíneo', type: 'select', options: [
      { value: 'A+', label: 'A+' },
      { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' },
      { value: 'B-', label: 'B-' },
      { value: 'AB+', label: 'AB+' },
      { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' },
      { value: 'O-', label: 'O-' },
    ]},
  ],

  quickFilters: [
    { label: 'Gestantes', icon: 'Heart', filter: { gestante: true } },
    { label: 'Idosos (60+)', icon: 'Users', filter: { idade: { $gte: 60 } } },
    { label: 'Crianças (0-12)', icon: 'Baby', filter: { idade: { $lte: 12 } } },
    { label: 'Doenças Crônicas', icon: 'Activity', filter: { doencasCronicas: { $ne: null, $size: { $gt: 0 } } } },
  ],

  bulkActions: [
    { key: 'export-selected', label: 'Exportar Selecionados', icon: 'Download' },
  ],
};

// ============================================================================
// CONFIGURAÇÃO: CADASTRO DE ESTUDANTE
// ============================================================================

export const CADASTRO_ESTUDANTE_CONFIG: ManagementModuleConfig = {
  moduleType: 'CADASTRO_ESTUDANTE',
  title: 'Estudantes',
  description: 'Gerenciamento da base de estudantes matriculados',

  primaryField: 'nome',
  secondaryField: 'escola',

  defaultTableColumns: ['nome', 'cpf', 'escola', 'serie', 'turma', 'turno', 'responsavel'],

  fields: [
    { key: 'nome', label: 'Nome Completo', type: 'text', searchable: true, displayInTable: true, displayInCard: true, sortable: true },
    { key: 'cpf', label: 'CPF', type: 'text', searchable: true, displayInTable: true, displayInCard: true },
    { key: 'dataNascimento', label: 'Data de Nascimento', type: 'date', displayInCard: true },
    { key: 'escola', label: 'Escola', type: 'text', filterable: true, displayInTable: true, displayInCard: true },
    { key: 'serie', label: 'Série', type: 'text', filterable: true, displayInTable: true, displayInCard: true },
    { key: 'turma', label: 'Turma', type: 'text', filterable: true, displayInTable: true, displayInCard: true },
    { key: 'turno', label: 'Turno', type: 'enum', filterable: true, displayInTable: true, displayInCard: true },
    { key: 'responsavel', label: 'Responsável', type: 'text', searchable: true, displayInTable: true, displayInCard: true },
    { key: 'telefoneResponsavel', label: 'Telefone Responsável', type: 'text', displayInCard: true },
    { key: 'necessidadeEspecial', label: 'Necessidade Especial', type: 'boolean', filterable: true, displayInCard: true },
    { key: 'restricaoAlimentar', label: 'Restrição Alimentar', type: 'array', displayInCard: true },
    { key: 'utilizaTransporteEscolar', label: 'Utiliza Transporte', type: 'boolean', filterable: true, displayInCard: true },
  ],

  filters: [
    { key: 'escola', label: 'Escola', type: 'select', options: [] },
    { key: 'serie', label: 'Série', type: 'select', options: [] },
    { key: 'turno', label: 'Turno', type: 'select', options: [
      { value: 'Matutino', label: 'Matutino' },
      { value: 'Vespertino', label: 'Vespertino' },
      { value: 'Noturno', label: 'Noturno' },
      { value: 'Integral', label: 'Integral' },
    ]},
    { key: 'utilizaTransporteEscolar', label: 'Utiliza Transporte', type: 'boolean' },
    { key: 'necessidadeEspecial', label: 'Necessidade Especial', type: 'boolean' },
  ],

  quickFilters: [
    { label: 'Educação Infantil', icon: 'Baby', filter: { serie: { $in: ['Maternal', 'Jardim I', 'Jardim II'] } } },
    { label: 'Ensino Fundamental', icon: 'BookOpen', filter: { serie: { $regex: '^[1-9]º Ano' } } },
    { label: 'Necessidades Especiais', icon: 'Heart', filter: { necessidadeEspecial: true } },
    { label: 'Transporte Escolar', icon: 'Bus', filter: { utilizaTransporteEscolar: true } },
  ],

  bulkActions: [
    { key: 'export-selected', label: 'Exportar Selecionados', icon: 'Download' },
    { key: 'generate-list', label: 'Gerar Lista de Presença', icon: 'FileText' },
  ],
};

// ============================================================================
// REGISTRO DE CONFIGURAÇÕES
// ============================================================================

export const MANAGEMENT_CONFIGS: Record<string, ManagementModuleConfig> = {
  'CADASTRO_PRODUTOR': CADASTRO_PRODUTOR_CONFIG,
  'CADASTRO_PACIENTE': CADASTRO_PACIENTE_CONFIG,
  'CADASTRO_ESTUDANTE': CADASTRO_ESTUDANTE_CONFIG,
};

export function getManagementConfig(moduleType: string): ManagementModuleConfig | null {
  return MANAGEMENT_CONFIGS[moduleType] || null;
}
