'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  SkipForward
} from 'lucide-react'
import { StageStatus } from '@/types/protocol-enhancements'

interface WorkflowProgressBarProps {
  stages: Array<{
    id: string
    stageName: string
    stageOrder: number
    status: string
  }>
  compact?: boolean
}

export function WorkflowProgressBar({ stages, compact = false }: WorkflowProgressBarProps) {
  const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder)

  const completedCount = sortedStages.filter(s => s.status === StageStatus.COMPLETED).length
  const totalCount = sortedStages.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const getStatusIcon = (status: string, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

    switch (status) {
      case StageStatus.COMPLETED:
        return <CheckCircle2 className={`${sizeClass} text-green-600`} />
      case StageStatus.IN_PROGRESS:
        return <Clock className={`${sizeClass} text-blue-600 animate-pulse`} />
      case StageStatus.FAILED:
        return <XCircle className={`${sizeClass} text-red-600`} />
      case StageStatus.SKIPPED:
        return <SkipForward className={`${sizeClass} text-gray-400`} />
      default:
        return <Circle className={`${sizeClass} text-gray-300`} />
    }
  }

  const getStageColor = (status: string) => {
    switch (status) {
      case StageStatus.COMPLETED:
        return 'bg-green-500'
      case StageStatus.IN_PROGRESS:
        return 'bg-blue-500'
      case StageStatus.FAILED:
        return 'bg-red-500'
      case StageStatus.SKIPPED:
        return 'bg-gray-300'
      default:
        return 'bg-gray-200'
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progresso do Workflow</span>
          <span className="font-medium text-gray-900">
            {completedCount} de {totalCount} etapas
          </span>
        </div>
        <Progress
          value={progressPercentage}
          className="h-2"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Título e Progresso Geral */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">Progresso do Workflow</h3>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <span className="text-sm text-gray-600">
          {Math.round(progressPercentage)}% concluído
        </span>
      </div>

      {/* Barra de Progresso */}
      <Progress
        value={progressPercentage}
        className="h-3"
      />

      {/* Etapas Horizontal */}
      <div className="relative">
        <div className="flex items-start justify-between gap-2 overflow-x-auto pb-2">
          {sortedStages.map((stage, index) => {
            const isCurrentStage = stage.status === StageStatus.IN_PROGRESS

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center gap-2 min-w-[80px] flex-1"
              >
                {/* Ícone */}
                <div
                  className={`
                    relative flex items-center justify-center
                    w-10 h-10 rounded-full border-2 bg-white
                    ${isCurrentStage ? 'border-blue-500 ring-4 ring-blue-100' : 'border-gray-300'}
                  `}
                >
                  {getStatusIcon(stage.status, 'sm')}
                </div>

                {/* Linha de Conexão */}
                {index < sortedStages.length - 1 && (
                  <div
                    className={`
                      absolute top-5 h-0.5 transition-all
                      ${getStageColor(stage.status)}
                    `}
                    style={{
                      left: `calc(${(index / (sortedStages.length - 1)) * 100}% + 40px)`,
                      width: `calc(${(1 / (sortedStages.length - 1)) * 100}% - 40px)`
                    }}
                  />
                )}

                {/* Nome da Etapa */}
                <div className="text-center">
                  <p className={`text-xs font-medium line-clamp-2 ${
                    isCurrentStage ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {stage.stageName}
                  </p>
                  {isCurrentStage && (
                    <Badge variant="default" className="mt-1 bg-blue-600 text-xs px-2 py-0">
                      Atual
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Concluída</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-blue-600" />
          <span>Em Andamento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle className="h-4 w-4 text-gray-300" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-4 w-4 text-red-600" />
          <span>Falhada</span>
        </div>
      </div>
    </div>
  )
}
