/**
 * ============================================================================
 * MODULE CONFIGURATION TYPES
 * ============================================================================
 *
 * Tipos para configuração de módulos padrões genéricos
 * Permite criar páginas CRUD reutilizáveis para qualquer entidade
 */

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'textarea'
  | 'boolean'
  | 'checkbox'
  | 'file'
  | 'json';

export interface ModuleField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;         // Valor padrão do campo
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  showInList?: boolean;      // Exibir na listagem
  showInForm?: boolean;       // Exibir no formulário
  showInDetails?: boolean;    // Exibir nos detalhes
  sortable?: boolean;         // Permitir ordenação
  filterable?: boolean;       // Permitir filtro
  subfields?: ModuleField[];  // Subcampos aninhados
}

export interface ModuleStatConfig {
  key: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  variant?: string;
  format?: 'number' | 'currency' | 'percentage' | 'area' | 'decimal';
  getValue?: (stats: any) => number | string;
}

export interface ModuleFilter {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'boolean';
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

export interface ModuleAction {
  key: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  showInList?: boolean;       // Exibir na linha da tabela
  showInDetails?: boolean;    // Exibir na página de detalhes
  onClick: (record: any) => void;
}

export interface ModuleConfig {
  // Identificação
  key: string;                        // 'rural-producers'
  departmentType: string;             // 'agriculture'
  entityName: string;                 // 'RuralProducer'

  // Exibição
  displayName: string;                // 'Produtores Rurais'
  displayNameSingular: string;        // 'Produtor Rural'
  description?: string;
  icon?: string;
  color?: string;

  // Campos
  fields: ModuleField[];

  // Estatísticas para mini dashboard
  stats: ModuleStatConfig[];

  // Filtros
  filters?: ModuleFilter[];

  // Ações customizadas
  actions?: ModuleAction[];

  // API endpoints (gerados automaticamente se não fornecidos)
  apiEndpoint?: string;               // '/api/admin/secretarias/agricultura/produtores'

  // Controle de criação
  canCreate?: boolean;                 // Permite criar novos registros

  // Permissões (para futuro)
  permissions?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };

  // Features
  features?: {
    hasProtocol?: boolean;            // Suporta vínculo com protocolo
    hasSource?: boolean;              // Tem campo 'source' (manual/service/import)
    hasStatus?: boolean;              // Tem campo 'status'
    hasEnrollments?: boolean;         // Permite gerenciar inscrições
    exportable?: boolean;             // Permite exportar dados
    importable?: boolean;             // Permite importar dados
  };
}

export interface ModuleRecord {
  id: string;
  tenantId: string;
  source?: 'manual' | 'service' | 'import';
  protocol?: string;
  serviceId?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface ModuleStats {
  total: number;
  active?: number;
  inactive?: number;
  pending?: number;
  [key: string]: number | undefined;
}

export interface ModuleListResponse {
  data: ModuleRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: ModuleStats;
}
