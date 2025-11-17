// Alert Components - Sistema de Alertas Automáticos

export { AlertCard } from './AlertCard'
export { AlertList } from './AlertList'
export { AlertDashboard } from './AlertDashboard'
export {
  AlertNotification,
  NotificationManager,
  showNotification,
  type NotificationAlert
} from './AlertNotification'

// Alert types and interfaces
export interface Alert {
  id: string
  title: string
  description: string
  type: 'system' | 'performance' | 'security' | 'business' | 'custom'
  severity: 'info' | 'warning' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved'
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  acknowledgedAt?: string
  data?: any
  source?: string
  relatedEntity?: string
  relatedEntityId?: string
  assignedTo?: string
}

export interface AlertFilter {
  status?: 'all' | 'active' | 'acknowledged' | 'resolved'
  severity?: 'all' | 'info' | 'warning' | 'critical'
  type?: 'all' | 'system' | 'performance' | 'security' | 'business' | 'custom'
  search?: string
}

export interface AlertActionResponse {
  success: boolean
  message?: string
  alert?: Alert
}

// Constants
export const ALERT_TYPES = {
  SYSTEM: 'system',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  BUSINESS: 'business',
  CUSTOM: 'custom'
} as const

export const ALERT_SEVERITIES = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const

export const ALERT_STATUSES = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved'
} as const

// Utility functions
export const getAlertTypeLabel = (type: string): string => {
  const labels = {
    system: 'Sistema',
    performance: 'Performance',
    security: 'Segurança',
    business: 'Negócio',
    custom: 'Personalizado'
  }
  return labels[type as keyof typeof labels] || type
}

export const getAlertSeverityLabel = (severity: string): string => {
  const labels = {
    info: 'Informação',
    warning: 'Aviso',
    critical: 'Crítico'
  }
  return labels[severity as keyof typeof labels] || severity
}

export const getAlertStatusLabel = (status: string): string => {
  const labels = {
    active: 'Ativo',
    acknowledged: 'Reconhecido',
    resolved: 'Resolvido'
  }
  return labels[status as keyof typeof labels] || status
}

export const getSeverityColor = (severity: string): string => {
  const colors = {
    info: '#3B82F6',
    warning: '#F59E0B',
    critical: '#EF4444'
  }
  return colors[severity as keyof typeof colors] || colors.info
}

export const getStatusColor = (status: string): string => {
  const colors = {
    active: '#EF4444',
    acknowledged: '#F59E0B',
    resolved: '#10B981'
  }
  return colors[status as keyof typeof colors] || colors.active
}