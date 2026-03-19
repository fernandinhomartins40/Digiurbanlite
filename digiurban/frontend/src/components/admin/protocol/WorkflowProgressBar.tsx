'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, PauseCircle, XCircle, SkipForward } from 'lucide-react'
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

  const completedCount = sortedStages.filter((stage) => stage.status === StageStatus.COMPLETED).length
  const totalCount = sortedStages.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const getStatusIcon = (status: string, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

    switch (status) {
      case StageStatus.COMPLETED:
        return <CheckCircle2 className={`${sizeClass} text-green-600`} />
      case StageStatus.IN_PROGRESS:
        return <Clock className={`${sizeClass} text-blue-600 animate-pulse`} />
      case StageStatus.PAUSED:
        return <PauseCircle className={`${sizeClass} text-amber-600`} />
      case StageStatus.FAILED:
        return <XCircle className={`${sizeClass} text-red-600`} />
      case StageStatus.SKIPPED:
        return <SkipForward className={`${sizeClass} text-gray-400`} />
      default:
        return <Circle className={`${sizeClass} text-gray-300`} />
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progresso do workflow</span>
          <span className="font-medium text-gray-900">
            {completedCount} de {totalCount} etapas
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">Progresso do workflow</h3>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <span className="text-sm text-gray-600">{Math.round(progressPercentage)}% conclu?do</span>
      </div>

      <Progress value={progressPercentage} className="h-3" />

      <div className="relative pt-2">
        <div className="absolute left-0 right-0 top-7 h-0.5 bg-gray-200" />

        <div className="relative flex items-start justify-between gap-2">
          {sortedStages.map((stage, index) => {
            const isCurrentStage = stage.status === StageStatus.IN_PROGRESS || stage.status === StageStatus.PAUSED
            const isCompleted = stage.status === StageStatus.COMPLETED

            return (
              <div key={stage.id} className="relative flex min-w-[80px] flex-1 flex-col items-center gap-2">
                {index > 0 && isCompleted && (
                  <div
                    className="absolute top-5 -z-10 h-0.5 w-full bg-green-500 right-1/2"
                    style={{ transform: 'translateX(50%)' }}
                  />
                )}

                <div
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white ${
                    isCurrentStage
                      ? 'border-blue-500 ring-4 ring-blue-100'
                      : isCompleted
                        ? 'border-green-500'
                        : 'border-gray-300'
                  }`}
                >
                  {getStatusIcon(stage.status, 'sm')}
                </div>

                <div className="text-center">
                  <p className={`line-clamp-2 text-xs font-medium ${
                    isCurrentStage ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {stage.stageName}
                  </p>
                  {isCurrentStage && (
                    <Badge variant="default" className="mt-1 bg-blue-600 px-2 py-0 text-xs">
                      Atual
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-t pt-2 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Conclu?da</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-blue-600" />
          <span>Em andamento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <PauseCircle className="h-4 w-4 text-amber-600" />
          <span>Pausada</span>
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
