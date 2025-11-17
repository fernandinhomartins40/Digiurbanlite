/**
 * ============================================================================
 * PROTOCOL SLA SERVICE
 * ============================================================================
 * Serviço para gerenciar SLA (Service Level Agreement) de protocolos
 */

import { differenceInDays, differenceInHours, parseISO } from 'date-fns'
import { ProtocolSLA, SLAStatus } from '@/types/protocol-enhancements'

/**
 * Calcular progresso do SLA (0-100%)
 */
export function calculateSLAProgress(sla: ProtocolSLA): number {
  if (!sla) return 0

  const now = new Date()
  const start = typeof sla.startDate === 'string' ? parseISO(sla.startDate) : sla.startDate
  const end = typeof sla.dueDate === 'string' ? parseISO(sla.dueDate) : sla.dueDate

  // Se já foi completado, retorna 100%
  if (sla.completedAt) return 100

  // Se está pausado, retorna o progresso atual
  if (sla.isPaused) {
    const pausedAt = typeof sla.pausedAt === 'string' ? parseISO(sla.pausedAt) : sla.pausedAt
    if (pausedAt) {
      const elapsed = differenceInDays(pausedAt, start)
      const total = differenceInDays(end, start)
      return Math.min(100, Math.max(0, (elapsed / total) * 100))
    }
  }

  // Calcular progresso normal
  const elapsed = differenceInDays(now, start)
  const total = differenceInDays(end, start)

  if (total <= 0) return 0

  const progress = (elapsed / total) * 100

  return Math.min(100, Math.max(0, progress))
}

/**
 * Formatar dias restantes
 */
export function formatSLADaysRemaining(sla: ProtocolSLA): string {
  if (!sla) return 'N/A'

  if (sla.completedAt) return 'Concluído'
  if (sla.isPaused) return 'Pausado'

  const now = new Date()
  const end = typeof sla.dueDate === 'string' ? parseISO(sla.dueDate) : sla.dueDate

  const daysRemaining = differenceInDays(end, now)
  const hoursRemaining = differenceInHours(end, now)

  if (daysRemaining < 0) {
    return `${Math.abs(daysRemaining)} dias atrasado`
  }

  if (daysRemaining === 0) {
    if (hoursRemaining <= 0) {
      return 'Venceu hoje'
    }
    return `${hoursRemaining}h restantes`
  }

  if (daysRemaining === 1) {
    return '1 dia restante'
  }

  return `${daysRemaining} dias restantes`
}

/**
 * Verificar se SLA está próximo do vencimento (< 20% do tempo)
 */
export function isSLANearDue(sla: ProtocolSLA): boolean {
  if (!sla) return false
  if (sla.completedAt || sla.isPaused) return false

  const progress = calculateSLAProgress(sla)
  return progress >= 80 && progress < 100
}

/**
 * Verificar se SLA está atrasado
 */
export function isSLAOverdue(sla: ProtocolSLA): boolean {
  if (!sla) return false
  if (sla.completedAt) return false

  return sla.isOverdue || calculateSLAProgress(sla) >= 100
}

/**
 * Obter cor do SLA baseada no status
 */
export function getSLAColor(sla: ProtocolSLA): string {
  if (!sla) return 'gray'
  if (sla.completedAt) return 'green'
  if (sla.isPaused) return 'yellow'
  if (isSLAOverdue(sla)) return 'red'
  if (isSLANearDue(sla)) return 'orange'
  return 'blue'
}

/**
 * Obter status do SLA
 */
export function getSLAStatus(sla: ProtocolSLA): SLAStatus {
  if (!sla) return SLAStatus.WITHIN_SLA
  if (sla.completedAt) return SLAStatus.COMPLETED
  if (sla.isPaused) return SLAStatus.PAUSED
  if (isSLAOverdue(sla)) return SLAStatus.OVERDUE
  if (isSLANearDue(sla)) return SLAStatus.NEAR_DUE
  return SLAStatus.WITHIN_SLA
}
