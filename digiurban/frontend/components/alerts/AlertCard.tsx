'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Bell, CheckCircle, Clock, Info, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
// LEGADO: import { useAlerts } from '@/hooks/api/analytics'

interface Alert {
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

interface AlertCardProps {
  alert: Alert
  onAcknowledge?: (alertId: string) => void
  onResolve?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
  showActions?: boolean
  compact?: boolean
  className?: string
}

export function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  onDismiss,
  showActions = true,
  compact = false,
  className
}: AlertCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  // TODO: Implementar via API
  const resolveAlert = async (id: string) => {};
  const acknowledgeAlert = async (id: string) => {};

  const handleAction = async (action: 'acknowledge' | 'resolve' | 'dismiss') => {
    setIsProcessing(true)

    try {
      switch (action) {
        case 'acknowledge':
          await acknowledgeAlert(alert.id)
          onAcknowledge?.(alert.id)
          break
        case 'resolve':
          await resolveAlert(alert.id)
          onResolve?.(alert.id)
          break
        case 'dismiss':
          onDismiss?.(alert.id)
          break
      }
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getIcon = () => {
    switch (alert.severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <Bell className="h-5 w-5 text-yellow-600" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getSeverityStyles = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          card: 'border-l-4 border-red-500 bg-red-50',
          badge: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'warning':
        return {
          card: 'border-l-4 border-yellow-500 bg-yellow-50',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      case 'info':
      default:
        return {
          card: 'border-l-4 border-blue-500 bg-blue-50',
          badge: 'bg-blue-100 text-blue-800 border-blue-200'
        }
    }
  }

  const getStatusIcon = () => {
    switch (alert.status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'acknowledged':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'active':
      default:
        return <Bell className="h-4 w-4 text-red-600" />
    }
  }

  const getTypeLabel = () => {
    const labels = {
      system: 'Sistema',
      performance: 'Performance',
      security: 'Segurança',
      business: 'Negócio',
      custom: 'Personalizado'
    }
    return labels[alert.type] || alert.type
  }

  const styles = getSeverityStyles()

  return (
    <Card className={cn(
      styles.card,
      'transition-all duration-200',
      compact && 'py-2',
      className
    )}>
      <CardHeader className={cn(
        'flex flex-row items-start justify-between space-y-0',
        compact ? 'pb-2 pt-3' : 'pb-3'
      )}>
        <div className="flex items-start space-x-3 flex-1">
          <div className="mt-0.5">
            {getIcon()}
          </div>
          <div className="space-y-1 flex-1">
            <CardTitle className={cn(
              'leading-tight',
              compact ? 'text-sm' : 'text-base'
            )}>
              {alert.title}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={styles.badge}>
                {alert.severity.toUpperCase()}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {getTypeLabel()}
              </Badge>
              <div className="flex items-center space-x-1">
                {getStatusIcon()}
                <span className="text-xs text-muted-foreground capitalize">
                  {alert.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="text-xs text-muted-foreground text-right">
            <p>{new Date(alert.createdAt).toLocaleString('pt-BR')}</p>
            {alert.source && (
              <p className="mt-1">{alert.source}</p>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className={cn(compact && 'pb-3 pt-0')}>
        <p className={cn(
          'text-muted-foreground mb-3',
          compact ? 'text-sm' : 'text-base'
        )}>
          {alert.description}
        </p>

        {alert.data && (
          <div className="mb-3 p-2 bg-white bg-opacity-50 rounded border text-sm">
            <p className="font-medium mb-1">Dados Adicionais:</p>
            <div className="space-y-1 text-xs">
              {Object.entries(alert.data).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alert.relatedEntity && (
          <div className="mb-3 flex items-center space-x-2 text-sm">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Relacionado a: <span className="font-medium">{alert.relatedEntity}</span>
            </span>
          </div>
        )}

        {alert.assignedTo && (
          <div className="mb-3 text-sm">
            <span className="text-muted-foreground">
              Atribuído a: <span className="font-medium">{alert.assignedTo}</span>
            </span>
          </div>
        )}

        {showActions && alert.status === 'active' && (
          <div className="flex items-center space-x-2">
            {alert.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('acknowledge')}
                disabled={isProcessing}
              >
                <Clock className="h-4 w-4 mr-1" />
                Reconhecer
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => handleAction('resolve')}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolver
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('dismiss')}
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-1" />
              Dispensar
            </Button>
          </div>
        )}

        {alert.status === 'acknowledged' && alert.acknowledgedAt && (
          <div className="text-xs text-muted-foreground">
            Reconhecido em {new Date(alert.acknowledgedAt).toLocaleString('pt-BR')}
          </div>
        )}

        {alert.status === 'resolved' && alert.resolvedAt && (
          <div className="text-xs text-green-600 flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Resolvido em {new Date(alert.resolvedAt).toLocaleString('pt-BR')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}