'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, Pause, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ProtocolSLA } from '@/types/protocol-enhancements'
import {
  calculateSLAProgress,
  formatSLADaysRemaining,
  isSLANearDue,
} from '@/services/protocol-sla.service'

interface CompactSLACardProps {
  sla: ProtocolSLA | null
  onClick?: () => void
}

export function CompactSLACard({ sla, onClick }: CompactSLACardProps) {
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
      <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm">SLA não configurado</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isNearDue = isSLANearDue(sla)
  const isCompleted = !!sla.actualEndDate

  const getBorderColor = () => {
    if (isCompleted) return 'border-green-200'
    if (sla.isOverdue) return 'border-red-200'
    if (isNearDue) return 'border-yellow-200'
    return 'border-gray-200'
  }

  const getProgressColor = () => {
    if (isCompleted) return '[&>div]:bg-green-500'
    if (sla.isOverdue) return '[&>div]:bg-red-500'
    if (isNearDue) return '[&>div]:bg-yellow-500'
    return '[&>div]:bg-blue-500'
  }

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all ${getBorderColor()}`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Título e Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-4 w-4 text-gray-600 shrink-0" />
            <span className="text-sm font-medium text-gray-900 truncate">SLA</span>
          </div>
          {isCompleted && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluído
            </Badge>
          )}
          {sla.isPaused && !isCompleted && (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
              <Pause className="h-3 w-3 mr-1" />
              Pausado
            </Badge>
          )}
          {sla.isOverdue && !isCompleted && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Atrasado
            </Badge>
          )}
          {isNearDue && !isCompleted && !sla.isOverdue && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Próximo
            </Badge>
          )}
        </div>

        {/* Barra de Progresso */}
        <Progress
          value={progress}
          className={`h-2 ${getProgressColor()}`}
        />

        {/* Informações */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Progresso</span>
            <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
          </div>

          <div className="p-2 rounded bg-gray-50 border border-gray-200">
            <p className={`text-xs font-medium text-center ${
              sla.isOverdue && !isCompleted ? 'text-red-600' : 'text-gray-900'
            }`}>
              {daysRemaining}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{sla.workingDays} dias úteis</span>
            <span>{sla.calendarDays} dias corridos</span>
          </div>

          {sla.totalPausedDays > 0 && (
            <div className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
              Pausado: {sla.totalPausedDays} dia(s)
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
