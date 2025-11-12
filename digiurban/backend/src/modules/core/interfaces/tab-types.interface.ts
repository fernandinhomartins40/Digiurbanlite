/**
 * @file tab-types.interface.ts
 * @description Tipos e interfaces genéricas para o sistema de abas dos módulos
 * @module core/interfaces
 */

// ============================================================================
// TIPOS BÁSICOS
// ============================================================================

export type TabType = 'list' | 'approval' | 'dashboard' | 'management';

export type ApprovalWorkflowType = 'simple' | 'multi-step' | 'technical-review';

export type CRUDAction = 'create' | 'read' | 'update' | 'delete';

export type OrderDirection = 'asc' | 'desc';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

// ============================================================================
// INTERFACES DE FILTROS
// ============================================================================

export interface BaseFilters {
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  orderBy?: string;
  orderDirection?: OrderDirection;
}

export interface ListFilters extends BaseFilters {
  status?: string[];
  page: number;
  limit: number;
  departmentId?: string;
  citizenId?: string;
}

export interface ApprovalFilters extends BaseFilters {
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  pendingOnly?: boolean;
}

export interface DashboardFilters {
  dateFrom: Date | string;
  dateTo: Date | string;
  departmentId?: string;
  compareWithPrevious?: boolean;
}

export interface ManagementFilters extends BaseFilters {
  entityType: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// INTERFACES DE RESPOSTA
// ============================================================================

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters?: Record<string, any>;
}

export interface ApprovalItem {
  id: string;
  protocolNumber: string;
  requestType: string;
  requestDate: Date;
  citizen: {
    id: string;
    name: string;
    cpf: string;
    email?: string;
    phone?: string;
  };
  currentStep?: number;
  totalSteps?: number;
  currentApprover?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  daysWaiting: number;
  expiresAt?: Date;
  formData: Record<string, any>;
  attachments?: AttachmentInfo[];
  history: ApprovalHistoryItem[];
}

export interface AttachmentInfo {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ApprovalHistoryItem {
  id: string;
  action: 'submitted' | 'approved' | 'rejected' | 'correction_requested' | 'forwarded';
  user: string;
  userRole: string;
  date: Date;
  comments?: string;
  attachments?: AttachmentInfo[];
}

// ============================================================================
// INTERFACES DE DASHBOARD
// ============================================================================

export interface KPIData {
  label: string;
  value: number;
  unit?: string;
  change?: number; // Percentual de mudança em relação ao período anterior
  trend?: 'up' | 'down' | 'stable';
  target?: number;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
}

export interface TrendData {
  period: string;
  date: Date;
  value: number;
  label?: string;
}

export interface DistributionData {
  category: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  benchmark?: number;
  status: 'good' | 'warning' | 'critical';
}

export interface DashboardData {
  kpis: KPIData[];
  trends: {
    label: string;
    data: TrendData[];
  }[];
  distribution: {
    label: string;
    data: DistributionData[];
  }[];
  performance: PerformanceMetric[];
  rankings?: {
    label: string;
    items: { name: string; value: number; rank: number }[];
  }[];
}

// ============================================================================
// INTERFACES DE GERENCIAMENTO
// ============================================================================

export interface EntityConfig {
  name: string;
  label: string;
  pluralLabel: string;
  icon?: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
  fields: EntityField[];
  validations?: Record<string, any>;
}

export interface EntityField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'multiselect' | 'file' | 'relation';
  required?: boolean;
  readOnly?: boolean;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  relation?: {
    entity: string;
    displayField: string;
    multiple?: boolean;
  };
}

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: CRUDAction;
  user: {
    id: string;
    name: string;
    role: string;
  };
  timestamp: Date;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
}

// ============================================================================
// INTERFACES DE APROVAÇÃO
// ============================================================================

export interface ApprovalStep {
  order: number;
  role: string;
  name: string;
  description?: string;
  requiredDocuments?: string[];
  canSkip?: boolean;
  autoApprove?: boolean;
  autoApproveConditions?: Record<string, any>;
}

export interface ApprovalConfig {
  required: boolean;
  workflow: ApprovalWorkflowType;
  roles: string[];
  steps?: ApprovalStep[];
  sla?: {
    analysisTime: number;
    approvalTime: number;
    totalTime?: number;
    unit: 'hours' | 'days' | 'weeks';
  };
  notifications?: {
    onSubmit?: boolean;
    onApprove?: boolean;
    onReject?: boolean;
    onDelay?: boolean;
  };
}

export interface ApprovalData {
  decision: 'approve' | 'reject' | 'request_correction' | 'forward';
  comments: string;
  attachments?: File[];
  forwardTo?: string;
  correctionsNeeded?: string[];
  scheduledInspection?: {
    date: Date;
    inspector: string;
    location: string;
  };
  conditions?: string[];
  expirationDate?: Date;
}

// ============================================================================
// INTERFACES DE MÓDULO
// ============================================================================

export interface ModuleConfig {
  code: string;
  name: string;
  department: string;
  description?: string;
  icon?: string;

  // Configuração de abas
  tabs: {
    list: boolean;
    approval: boolean;
    dashboard: boolean;
    management: boolean;
  };

  // Configuração de aprovação
  approval?: ApprovalConfig;

  // Entidades relacionadas
  entities: string[];

  // KPIs do dashboard
  dashboardKPIs: string[];
  customKPIs?: {
    name: string;
    query: string;
    label: string;
    format?: KPIData['format'];
  }[];

  // Entidades gerenciáveis
  managementEntities: EntityConfig[];

  // Permissões
  permissions?: {
    view?: string[];
    create?: string[];
    edit?: string[];
    delete?: string[];
    approve?: string[];
    manage?: string[];
  };

  // Configurações específicas
  settings?: Record<string, any>;
}

// ============================================================================
// INTERFACES DE PARÂMETROS
// ============================================================================

export interface ListParams {
  filters: ListFilters;
  include?: string[];
  select?: string[];
}

export interface ApprovalParams {
  filters: ApprovalFilters;
  includeHistory?: boolean;
  includeAttachments?: boolean;
}

export interface DashboardParams {
  filters: DashboardFilters;
  kpis?: string[];
  includeComparison?: boolean;
}

export interface ManagementParams {
  filters: ManagementFilters;
  action?: CRUDAction;
  data?: any;
}

// ============================================================================
// INTERFACE DE EXPORTAÇÃO
// ============================================================================

export interface ExportOptions {
  format: ExportFormat;
  filters?: Record<string, any>;
  columns?: string[];
  includeHeaders?: boolean;
  template?: string;
}

export interface ExportResult {
  filename: string;
  url: string;
  size: number;
  format: ExportFormat;
  generatedAt: Date;
  expiresAt: Date;
}

// ============================================================================
// INTERFACE DE IMPORTAÇÃO
// ============================================================================

export interface ImportOptions {
  entity: string;
  file: File;
  validateOnly?: boolean;
  skipErrors?: boolean;
  updateExisting?: boolean;
}

export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: {
    row: number;
    field?: string;
    message: string;
  }[];
}
