'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  SkipForward
} from 'lucide-react'
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
        <CardTitle className="text-sm">Progresso do Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Linha de Conexão */}
          <div className="absolute left-[10px] top-2 bottom-2 w-0.5 bg-gray-200" />

          {/* Etapas */}
          <div className="space-y-3">
            {sortedStages.map((stage, index) => (
              <div key={stage.id} className="relative flex items-start gap-3">
                {/* Ícone */}
                <div className="relative z-10 bg-white">
                  {getStatusIcon(stage.status)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground">
                        {stage.stageOrder}.
                      </span>
                      <p className={`text-sm truncate ${getStatusColor(stage.status)}`}>
                        {stage.stageName}
                      </p>
                    </div>
                    {stage.status === StageStatus.IN_PROGRESS && (
                      <Badge variant="default" className="ml-2 text-xs bg-blue-600 flex-shrink-0">
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
