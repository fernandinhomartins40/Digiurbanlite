/**
 * ============================================================================
 * SERVICE SCHEMA TYPES - ESTRUTURA UNIFICADA
 * ============================================================================
 * Tipos para schema estruturado de serviços, unificando formSchema,
 * formFieldsConfig e linkedCitizensConfig em uma estrutura consistente.
 */

import { CitizenLinkType, ServiceRole, FamilyRelationship } from '@prisma/client';

// ========================================
// FIELD TYPES
// ========================================

export type ServiceFormFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'select-table'
  | 'date'
  | 'datetime'
  | 'checkbox'
  | 'radio'
  | 'number'
  | 'email'
  | 'phone'
  | 'cpf'
  | 'cep'
  | 'file'
  | 'multiselect';

export type FieldCategory = 'citizen' | 'additional' | 'system';

// ========================================
// FIELD DEFINITIONS
// ========================================

/**
 * Configuração de data source para campos select-table
 */
export interface FieldDataSource {
  /** Nome da tabela auxiliar (ex: 'UnidadeSaude') */
  table: string;
  /** Campo usado como valor (geralmente 'id') */
  valueField: string;
  /** Campo usado como label (ex: 'nome') */
  labelField: string;
  /** Filtros a aplicar na query (ex: { tipo: 'UBS', isActive: true }) */
  filters?: Record<string, any>;
  /** Campos adicionais para exibir (ex: ['endereco', 'telefone']) */
  displayFields?: string[];
}

/**
 * Validações customizadas para campos
 */
export interface FieldValidation {
  /** Valor mínimo (para number, date) */
  min?: number | string;
  /** Valor máximo (para number, date) */
  max?: number | string;
  /** Comprimento mínimo (para text, textarea) */
  minLength?: number;
  /** Comprimento máximo (para text, textarea) */
  maxLength?: number;
  /** Pattern regex */
  pattern?: string;
  /** Mensagem de erro customizada */
  errorMessage?: string;
  /** Função de validação customizada (nome da função) */
  customValidator?: string;
}

/**
 * Definição de um campo do formulário
 */
export interface ServiceFormField {
  /** ID único do campo */
  id: string;
  /** Label exibido ao usuário */
  label: string;
  /** Tipo do campo */
  type: ServiceFormFieldType;
  /** Se o campo é obrigatório */
  required: boolean;
  /** Se o campo está habilitado (pode ser desabilitado pelo admin) */
  enabled?: boolean;
  /** Categoria do campo */
  category?: FieldCategory;
  /** Texto de ajuda/placeholder */
  placeholder?: string;
  /** Descrição/tooltip */
  description?: string;

  // Opções para selects simples
  /** Opções para campos select/radio/multiselect */
  options?: string[] | { value: string; label: string }[];

  // Data source para selects de tabela
  /** Configuração de data source para select-table */
  dataSource?: FieldDataSource;

  // Validações
  /** Regras de validação */
  validation?: FieldValidation;

  // Configurações de exibição
  /** Ordem de exibição */
  order?: number;
  /** Largura do campo (1-12 para grid) */
  width?: number;
  /** Se deve ser exibido em linha separada */
  fullWidth?: boolean;
  /** Classe CSS customizada */
  className?: string;

  // Lógica condicional
  /** Condições para exibir o campo */
  showIf?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  }[];

  // Valores padrão
  /** Valor padrão */
  defaultValue?: any;

  // Metadata
  /** Metadados adicionais */
  metadata?: Record<string, any>;
}

// ========================================
// LINKED CITIZENS CONFIG
// ========================================

/**
 * Configuração de um tipo de vínculo de cidadão
 */
export interface LinkedCitizenLinkConfig {
  /** Tipo de vínculo (enum CitizenLinkType) */
  linkType: CitizenLinkType;
  /** Papel/função no serviço (enum ServiceRole) */
  role: ServiceRole;
  /** Label para exibição */
  label: string;
  /** Descrição do vínculo */
  description?: string;
  /** Se o vínculo é obrigatório */
  required: boolean;

  // Mapeamento de campos legacy
  /** Mapeamento de campos antigos para buscar cidadão */
  mapFromLegacyFields?: {
    cpf?: string;
    name?: string;
    birthDate?: string;
    rg?: string;
    [key: string]: string | undefined;
  };

  // Campos contextuais
  /** Campos adicionais específicos deste vínculo */
  contextFields?: Array<{
    id: string;
    label: string;
    type: ServiceFormFieldType;
    required?: boolean;
    sourceField?: string;  // Campo do formData de onde copiar
    value?: any;           // Valor fixo
    options?: string[];
  }>;

  // Validação de relacionamento familiar
  /** Relacionamentos esperados na FamilyComposition */
  expectedRelationships?: FamilyRelationship[];
  /** Se deve validar relacionamento automaticamente */
  validateRelationship?: boolean;

  // Configurações de exibição
  /** Ordem de exibição */
  order?: number;
  /** Ícone para exibir */
  icon?: string;
}

/**
 * Configuração completa de vinculação de cidadãos
 */
export interface LinkedCitizensConfig {
  /** Se a vinculação está habilitada */
  enabled: boolean;
  /** Descrição geral da vinculação */
  description?: string;
  /** Configurações de cada tipo de vínculo */
  links: LinkedCitizenLinkConfig[];
  /** Número mínimo de vínculos */
  minLinks?: number;
  /** Número máximo de vínculos */
  maxLinks?: number;
  /** Se deve permitir auto-seleção (cidadão escolhe quem vincular) */
  allowSelfSelection?: boolean;
  /** Se deve buscar automaticamente da composição familiar */
  autoPopulateFromFamily?: boolean;
}

// ========================================
// SERVICE FORM SCHEMA
// ========================================

/**
 * Schema completo do formulário de um serviço
 */
export interface ServiceFormSchema {
  /** Versão do schema (para versionamento/migração) */
  version?: string;

  // Campos do cidadão solicitante
  /** IDs dos campos do cidadão a serem exibidos/coletados */
  citizenFields: string[];

  // Campos adicionais do formulário
  /** Campos customizados do serviço */
  fields: ServiceFormField[];

  // Configuração de vinculação de cidadãos
  /** Configuração de vinculação de outros cidadãos */
  linkedCitizensConfig?: LinkedCitizensConfig;

  // Configurações gerais do formulário
  /** Se deve agrupar campos por seções */
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    fields: string[];  // IDs dos campos nesta seção
    order?: number;
    collapsible?: boolean;
  }>;

  /** Configurações de layout */
  layout?: {
    columns?: number;
    spacing?: 'compact' | 'normal' | 'spacious';
    labelPosition?: 'top' | 'left' | 'inline';
  };

  // Validações globais
  /** Validações que envolvem múltiplos campos */
  crossFieldValidations?: Array<{
    id: string;
    type: 'required-if' | 'required-unless' | 'mutually-exclusive' | 'at-least-one';
    fields: string[];
    condition?: any;
    errorMessage: string;
  }>;

  // Configurações de submissão
  /** Configurações de como processar o formulário */
  submission?: {
    /** Se deve processar citizen links automaticamente */
    autoProcessCitizenLinks?: boolean;
    /** Se deve validar composição familiar */
    validateFamilyComposition?: boolean;
    /** Webhooks a chamar após submissão */
    webhooks?: string[];
  };

  // Metadata
  /** Metadados adicionais */
  metadata?: Record<string, any>;
}

// ========================================
// UTILITY TYPES
// ========================================

/**
 * Dados extraídos de um formulário preenchido
 */
export interface ServiceFormData {
  /** Dados dos campos do cidadão */
  citizenData?: Record<string, any>;
  /** Dados dos campos customizados */
  fieldData: Record<string, any>;
  /** Cidadãos vinculados */
  linkedCitizens?: Array<{
    linkedCitizenId: string;
    linkType: CitizenLinkType;
    contextData?: Record<string, any>;
  }>;
  /** Arquivos anexados */
  attachments?: Array<{
    fieldId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

/**
 * Resultado da validação de um formulário
 */
export interface FormValidationResult {
  /** Se o formulário é válido */
  valid: boolean;
  /** Erros por campo */
  errors: Record<string, string[]>;
  /** Warnings por campo */
  warnings?: Record<string, string[]>;
  /** Erros globais */
  globalErrors?: string[];
}

// ========================================
// HELPER FUNCTIONS TYPES
// ========================================

/**
 * Opções para normalizar um schema antigo
 */
export interface NormalizeSchemaOptions {
  /** Se deve preservar campos desabilitados */
  preserveDisabledFields?: boolean;
  /** Se deve migrar linkedCitizensConfig */
  migrateLinkedCitizens?: boolean;
  /** Versão de destino do schema */
  targetVersion?: string;
}

/**
 * Resultado da normalização
 */
export interface NormalizeSchemaResult {
  /** Schema normalizado */
  schema: ServiceFormSchema;
  /** Se houve mudanças */
  changed: boolean;
  /** Log de mudanças */
  changes: string[];
  /** Warnings de migração */
  warnings?: string[];
}
