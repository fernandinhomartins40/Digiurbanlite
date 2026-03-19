'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, PauseCircle, XCircle, SkipForward } from 'lucide-react'
import { StageStatus } from '@/types/protocol-enhancements'

interface WorkflowProgressProps {
  stages: Array<{
    id: string
    stageName: string
    stageOrder: number
    status: string
  }>
}

export function WorkflowProgress({ stages }: WorkflowProgressProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case StageStatus.COMPLETED:
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case StageStatus.IN_PROGRESS:
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
      case StageStatus.PAUSED:
        return <PauseCircle className="h-5 w-5 text-amber-600" />
      case StageStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-600" />
      case StageStatus.SKIPPED:
        return <SkipForward className="h-5 w-5 text-gray-400" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case StageStatus.COMPLETED:
        return 'text-green-700'
      case StageStatus.IN_PROGRESS:
        return 'text-blue-700 font-semibold'
      case StageStatus.PAUSED:
        return 'text-amber-700 font-semibold'
      case StageStatus.FAILED:
        return 'text-red-700'
      case StageStatus.SKIPPED:
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Progresso do workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute bottom-2 left-[10px] top-2 w-0.5 bg-gray-200" />

          <div className="space-y-3">
            {sortedStages.map((stage) => (
              <div key={stage.id} className="relative flex items-start gap-2 sm:gap-3">
                <div className="relative z-10 shrink-0 bg-white">
                  {getStatusIcon(stage.status)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
                      <span className="shrink-0 text-xs text-muted-foreground">{stage.stageOrder}.</span>
                      <p className={`break-words text-xs sm:text-sm ${getStatusColor(stage.status)}`}>
                        {stage.stageName}
                      </p>
                    </div>
                    {(stage.status === StageStatus.IN_PROGRESS || stage.status === StageStatus.PAUSED) && (
                      <Badge variant="default" className="shrink-0 bg-blue-600 px-2 py-0 text-xs">
                        Atual
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
