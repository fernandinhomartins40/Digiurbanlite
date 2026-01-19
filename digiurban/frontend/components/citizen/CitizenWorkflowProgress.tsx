'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  SkipForward,
  AlertCircle
} from 'lucide-react'
import { StageStatus } from '@/types/protocol-enhancements'

interface WorkflowStage {
  id: string
  stageName: string
  stageOrder: number
  status: string
  startedAt: string | null
  completedAt: string | null
}

interface CitizenWorkflowProgressProps {
  protocolId: string
  apiRequest: (url: string) => Promise<any>
  protocolStatus?: string // Status do protocolo para verificar se está concluído
}

export function CitizenWorkflowProgress({ protocolId, apiRequest, protocolStatus }: CitizenWorkflowProgressProps) {
  const [stages, setStages] = useState<WorkflowStage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWorkflow()
  }, [protocolId])

  const loadWorkflow = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest(`/citizen/protocols/${protocolId}/stages`)

      if (response.success) {
        let loadedStages = response.data || []

        // Se o protocolo está CONCLUIDO, marcar todas as etapas como COMPLETED
        if (protocolStatus === 'CONCLUIDO') {
          loadedStages = loadedStages.map((stage: WorkflowStage) => ({
            ...stage,
            status: StageStatus.COMPLETED,
            completedAt: stage.completedAt || new Date().toISOString()
          }))
        }

        setStages(loadedStages)
      }
    } catch (error) {
      console.error('Erro ao carregar workflow:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
          <p className="text-sm text-gray-500">Carregando etapas...</p>
        </CardContent>
      </Card>
    )
  }

  if (stages.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Nenhuma etapa de workflow encontrada</p>
        </CardContent>
      </Card>
    )
  }

  const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder)
  const completedCount = sortedStages.filter(s => s.status === StageStatus.COMPLETED).length
  const totalCount = sortedStages.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Se protocolo concluído, progresso deve ser 100%
  const isProtocolCompleted = protocolStatus === 'CONCLUIDO'
  const displayProgress = isProtocolCompleted ? 100 : progressPercentage
  const displayCompleted = isProtocolCompleted ? totalCount : completedCount

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso do Atendimento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Título e Progresso Geral */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">Progresso do Workflow</h3>
              <Badge variant="outline" className="text-xs">
                {displayCompleted}/{totalCount}
              </Badge>
            </div>
            <span className="text-sm text-gray-600">
              {Math.round(displayProgress)}% concluído
            </span>
          </div>

          {/* Barra de Progresso */}
          <Progress
            value={displayProgress}
            className="h-3"
          />

          {/* Etapas Horizontal */}
          <div className="relative pt-2">
            {/* Linha de fundo (cinza) */}
            <div className="absolute top-7 left-0 right-0 h-0.5 bg-gray-200" />

            <div className="relative flex items-start justify-between gap-2">
              {sortedStages.map((stage, index) => {
                // Se protocolo concluído, não mostrar etapa atual
                const isCurrentStage = !isProtocolCompleted && stage.status === StageStatus.IN_PROGRESS
                const isCompleted = stage.status === StageStatus.COMPLETED || isProtocolCompleted

                return (
                  <div
                    key={stage.id}
                    className="relative flex flex-col items-center gap-2 flex-1 min-w-[80px]"
                  >
                    {/* Linha de Conexão para etapa concluída */}
                    {index > 0 && isCompleted && (
                      <div
                        className="absolute top-5 right-1/2 w-full h-0.5 bg-green-500 -z-10"
                        style={{ transform: 'translateX(50%)' }}
                      />
                    )}

                    {/* Ícone */}
                    <div
                      className={`
                        relative z-10 flex items-center justify-center
                        w-10 h-10 rounded-full border-2 bg-white
                        ${isCurrentStage ? 'border-blue-500 ring-4 ring-blue-100' :
                          isCompleted ? 'border-green-500' : 'border-gray-300'}
                      `}
                    >
                      {isProtocolCompleted ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : getStatusIcon(stage.status, 'sm')}
                    </div>

                    {/* Nome da Etapa */}
                    <div className="text-center">
                      <p className={`text-xs font-medium line-clamp-2 ${
                        isCurrentStage ? 'text-blue-700' :
                        isCompleted ? 'text-green-700' : 'text-gray-600'
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
      </CardContent>
    </Card>
  )
}
