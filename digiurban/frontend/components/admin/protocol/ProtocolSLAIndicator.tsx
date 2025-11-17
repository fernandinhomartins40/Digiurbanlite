'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Clock, Pause, Play, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ProtocolSLA } from '@/types/protocol-enhancements'
import {
  calculateSLAProgress,
  formatSLADaysRemaining,
  isSLANearDue,
} from '@/services/protocol-sla.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProtocolSLAIndicatorProps {
  sla: ProtocolSLA | null
  onPause?: () => void
  onResume?: () => void
  onComplete?: () => void
  isLoading?: boolean
}

export function ProtocolSLAIndicator({
  sla,
  onPause,
  onResume,
  onComplete,
  isLoading = false,
}: ProtocolSLAIndicatorProps) {
  const [progress, setProgress] = useState(0)
  const [daysRemaining, setDaysRemaining] = useState('')

  useEffect(() => {
    if (sla) {
      setProgress(calculateSLAProgress(sla))
      setDaysRemaining(formatSLADaysRemaining(sla))
    }
  }, [sla])

  if (!sla) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            SLA não configurado
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const isNearDue = isSLANearDue(sla)
  const isCompleted = !!sla.actualEndDate

  return (
    <Card className={isCompleted ? 'border-green-200' : isNearDue ? 'border-yellow-200' : sla.isOverdue ? 'border-red-200' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Prazo de Atendimento (SLA)
          </div>
          {isCompleted && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluído
            </Badge>
          )}
          {sla.isPaused && !isCompleted && (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              <Pause className="h-3 w-3 mr-1" />
              Pausado
            </Badge>
          )}
          {sla.isOverdue && !isCompleted && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Em Atraso
            </Badge>
          )}
          {isNearDue && !isCompleted && !sla.isOverdue && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Próximo do Vencimento
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className={`h-2 ${
              isCompleted
                ? '[&>div]:bg-green-500'
                : sla.isOverdue
                ? '[&>div]:bg-red-500'
                : isNearDue
                ? '[&>div]:bg-yellow-500'
                : '[&>div]:bg-blue-500'
            }`}
          />
        </div>

        {/* Informações de Prazo */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Início</p>
            <p className="font-medium">
              {format(new Date(sla.startDate), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">
              {isCompleted ? 'Concluído em' : 'Vencimento'}
            </p>
            <p className={`font-medium ${sla.isOverdue && !isCompleted ? 'text-red-600' : ''}`}>
              {isCompleted
                ? format(new Date(sla.actualEndDate!), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })
                : format(new Date(sla.expectedEndDate), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
            </p>
          </div>
        </div>

        {/* Dias Restantes/Atraso */}
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-sm font-medium text-center">{daysRemaining}</p>
        </div>

        {/* Informações de Dias Úteis */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Dias Úteis</p>
            <p className="font-medium">{sla.workingDays} dias</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Dias Corridos</p>
            <p className="font-medium">{sla.calendarDays} dias</p>
          </div>
        </div>

        {/* Informações de Pausa */}
        {sla.totalPausedDays > 0 && (
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Pausado:</strong> {sla.totalPausedDays} dia(s)
              {sla.isPaused && sla.pausedReason && (
                <span className="block mt-1 text-xs">Motivo: {sla.pausedReason}</span>
              )}
            </p>
          </div>
        )}

        {/* Ações */}
        {!isCompleted && (
          <div className="flex gap-2 pt-2">
            {!sla.isPaused ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onPause}
                disabled={isLoading}
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={onResume}
                disabled={isLoading}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Retomar
              </Button>
            )}
            <Button
              size="sm"
              variant="default"
              onClick={onComplete}
              disabled={isLoading}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Concluir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
