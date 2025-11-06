// ETL Components - ETL Process e Data Warehouse

export { ETLDashboard } from './ETLDashboard'
export { ETLJobConfig } from './ETLJobConfig'
export { DataQuality } from './DataQuality'

// ETL types and interfaces
export interface ETLJob {
  id: string
  name: string
  description: string
  source: string
  destination: string
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'stopped'
  progress: number
  recordsProcessed: number
  totalRecords: number
  duration: number
  startTime: string
  endTime?: string
  lastRun: string
  nextRun?: string
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly'
  error?: string
}

export interface DataSource {
  id: string
  name: string
  type: 'database' | 'api' | 'file' | 'csv' | 'json'
  connectionString?: string
  endpoint?: string
  path?: string
  tables?: string[]
  fields?: string[]
}

export interface DataTransformation {
  id: string
  type: 'filter' | 'map' | 'aggregate' | 'join' | 'clean' | 'validate'
  name: string
  config: any
  enabled: boolean
}

export interface ETLJobConfig {
  id?: string
  name: string
  description: string
  source: DataSource
  destination: DataSource
  transformations: DataTransformation[]
  schedule: {
    frequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly'
    time?: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  enabled: boolean
  retryPolicy: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
  notifications: {
    onSuccess: boolean
    onFailure: boolean
    recipients: string[]
  }
}

export interface QualityMetric {
  id: string
  name: string
  description: string
  category: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'validity'
  score: number
  threshold: number
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  lastChecked: string
  issues: number
  recordsAffected: number
}

export interface QualityIssue {
  id: string
  rule: string
  table: string
  field: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recordsAffected: number
  firstDetected: string
  lastDetected: string
  status: 'open' | 'resolved' | 'ignored'
  sampleData?: string[]
}

export interface DataProfileStat {
  field: string
  type: string
  completeness: number
  uniqueness: number
  nullCount: number
  minValue?: string
  maxValue?: string
  avgLength?: number
  patterns?: Array<{ pattern: string; count: number }>
}

export interface ETLMetrics {
  totalJobs: number
  activeJobs: number
  successRate: number
  failedJobs: number
  totalRecordsProcessed: number
  avgDuration: number
}

// Constants
export const ETL_JOB_STATUSES = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SCHEDULED: 'scheduled',
  STOPPED: 'stopped'
} as const

export const DATA_SOURCE_TYPES = {
  DATABASE: 'database',
  API: 'api',
  FILE: 'file',
  CSV: 'csv',
  JSON: 'json'
} as const

export const TRANSFORMATION_TYPES = {
  FILTER: 'filter',
  MAP: 'map',
  AGGREGATE: 'aggregate',
  JOIN: 'join',
  CLEAN: 'clean',
  VALIDATE: 'validate'
} as const

export const SCHEDULE_FREQUENCIES = {
  MANUAL: 'manual',
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
} as const

export const QUALITY_CATEGORIES = {
  COMPLETENESS: 'completeness',
  ACCURACY: 'accuracy',
  CONSISTENCY: 'consistency',
  TIMELINESS: 'timeliness',
  VALIDITY: 'validity'
} as const

export const QUALITY_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

// Utility functions
export const getJobStatusLabel = (status: string): string => {
  const labels = {
    running: 'Executando',
    completed: 'Concluído',
    failed: 'Falhou',
    scheduled: 'Agendado',
    stopped: 'Parado'
  }
  return labels[status as keyof typeof labels] || status
}

export const getSourceTypeLabel = (type: string): string => {
  const labels = {
    database: 'Banco de Dados',
    api: 'API',
    file: 'Arquivo',
    csv: 'CSV',
    json: 'JSON'
  }
  return labels[type as keyof typeof labels] || type
}

export const getTransformationTypeLabel = (type: string): string => {
  const labels = {
    filter: 'Filtro',
    map: 'Mapeamento',
    aggregate: 'Agregação',
    join: 'Junção',
    clean: 'Limpeza',
    validate: 'Validação'
  }
  return labels[type as keyof typeof labels] || type
}

export const getFrequencyLabel = (frequency: string): string => {
  const labels = {
    manual: 'Manual',
    hourly: 'De hora em hora',
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal'
  }
  return labels[frequency as keyof typeof labels] || frequency
}

export const getQualityCategoryLabel = (category: string): string => {
  const labels = {
    completeness: 'Completude',
    accuracy: 'Precisão',
    consistency: 'Consistência',
    timeliness: 'Pontualidade',
    validity: 'Validade'
  }
  return labels[category as keyof typeof labels] || category
}

export const getSeverityColor = (severity: string): string => {
  const colors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  }
  return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export const getJobStatusColor = (status: string): string => {
  const colors = {
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
    stopped: 'bg-gray-100 text-gray-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export const getQualityStatusColor = (status: string): string => {
  const colors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  }
  return colors[status as keyof typeof colors] || 'text-gray-600'
}