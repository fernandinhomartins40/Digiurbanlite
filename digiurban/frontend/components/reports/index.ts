// Report Components - Report Builder Customizável

export { ReportBuilder } from './ReportBuilder'
export { ReportPreview } from './ReportPreview'
export { ReportList } from './ReportList'

// Report types and interfaces
export interface ReportField {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  table: string
  required?: boolean
}

export interface ReportFilter {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in'
  value: string
  label: string
}

export interface ReportVisualization {
  id: string
  type: 'table' | 'chart' | 'metric'
  title: string
  config: any
}

export interface ReportSchedule {
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly'
  time?: string
  recipients?: string[]
}

export interface Report {
  id: string
  name: string
  description?: string
  type: 'operational' | 'managerial' | 'executive'
  category: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  lastExecutedAt?: string
  executionCount: number
  scheduleFrequency?: 'manual' | 'daily' | 'weekly' | 'monthly'
  config: {
    fields: ReportField[]
    filters: ReportFilter[]
    visualizations: ReportVisualization[]
    schedule?: ReportSchedule
  }
}

export interface ReportExecution {
  id: string
  reportId: string
  executedAt: string
  executedBy: string
  status: 'running' | 'completed' | 'failed'
  duration?: number
  recordCount?: number
  filePath?: string
  error?: string
}

export interface ReportPreviewData {
  id?: string
  name: string
  description: string
  type: 'operational' | 'managerial' | 'executive'
  category: string
  executedAt: string
  executedBy: string
  data: any[]
  summary: {
    totalRecords: number
    dateRange: {
      start: string
      end: string
    }
    filters: Array<{
      field: string
      operator: string
      value: string
    }>
  }
  visualizations: Array<{
    id: string
    type: 'table' | 'chart' | 'metric'
    title: string
    config: any
    data: any[]
  }>
}

// Constants
export const REPORT_TYPES = {
  OPERATIONAL: 'operational',
  MANAGERIAL: 'managerial',
  EXECUTIVE: 'executive'
} as const

export const REPORT_CATEGORIES = {
  GENERAL: 'general',
  PROTOCOLS: 'protocols',
  CITIZENS: 'citizens',
  DEPARTMENTS: 'departments',
  PERFORMANCE: 'performance',
  SATISFACTION: 'satisfaction'
} as const

export const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json'
} as const

export const FILTER_OPERATORS = {
  EQUALS: 'equals',
  CONTAINS: 'contains',
  GREATER: 'greater',
  LESS: 'less',
  BETWEEN: 'between',
  IN: 'in'
} as const

export const VISUALIZATION_TYPES = {
  TABLE: 'table',
  CHART: 'chart',
  METRIC: 'metric'
} as const

export const SCHEDULE_FREQUENCIES = {
  MANUAL: 'manual',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
} as const

// Utility functions
export const getReportTypeLabel = (type: string): string => {
  const labels = {
    operational: 'Operacional',
    managerial: 'Gerencial',
    executive: 'Executivo'
  }
  return labels[type as keyof typeof labels] || type
}

export const getReportCategoryLabel = (category: string): string => {
  const labels = {
    general: 'Geral',
    protocols: 'Protocolos',
    citizens: 'Cidadãos',
    departments: 'Departamentos',
    performance: 'Performance',
    satisfaction: 'Satisfação'
  }
  return labels[category as keyof typeof labels] || category
}

export const getScheduleFrequencyLabel = (frequency: string): string => {
  const labels = {
    manual: 'Manual',
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal'
  }
  return labels[frequency as keyof typeof labels] || frequency
}

export const getFilterOperatorLabel = (operator: string): string => {
  const labels = {
    equals: 'Igual a',
    contains: 'Contém',
    greater: 'Maior que',
    less: 'Menor que',
    between: 'Entre',
    in: 'Dentro de'
  }
  return labels[operator as keyof typeof labels] || operator
}

export const getReportTypeColor = (type: string): string => {
  const colors = {
    operational: 'bg-blue-100 text-blue-800',
    managerial: 'bg-green-100 text-green-800',
    executive: 'bg-purple-100 text-purple-800'
  }
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}