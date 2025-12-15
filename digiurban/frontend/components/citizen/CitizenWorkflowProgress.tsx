'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, XCircle, AlertCircle } from 'lucide-react'
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
}

export function CitizenWorkflowProgress({ protocolId, apiRequest }: CitizenWorkflowProgressProps) {
  const [stages, setStages] = useState<WorkflowStage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWorkflow()
  }, [protocolId])

  const loadWorkflow = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest(`/protocols/${protocolId}/stages`)

      if (response.success) {
        setStages(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar workflow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case StageStatus.COMPLETED:
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case StageStatus.IN_PROGRESS:
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
      case StageStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-600" />
      case StageStatus.PENDING:
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case StageStatus.COMPLETED:
        return <Badge className="bg-green-600 text-white">Concluída</Badge>
      case StageStatus.IN_PROGRESS:
        return <Badge className="bg-blue-600 text-white">Em Andamento</Badge>
      case StageStatus.FAILED:
        return <Badge variant="destructive">Falhou</Badge>
      case StageStatus.PENDING:
      default:
        return <Badge variant="outline" className="text-gray-600">Pendente</Badge>
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

  const currentStageIndex = stages.findIndex(s => s.status === StageStatus.IN_PROGRESS)
  const completedCount = stages.filter(s => s.status === StageStatus.COMPLETED).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Progresso do Atendimento
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{stages.length} etapas
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Andamento</span>
            <span className="font-medium">{Math.round((completedCount / stages.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${(completedCount / stages.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Timeline de Etapas */}
        <div className="space-y-3 pt-2">
          {stages.map((stage, index) => {
            const isCurrent = stage.status === StageStatus.IN_PROGRESS
            const isCompleted = stage.status === StageStatus.COMPLETED
            const isFailed = stage.status === StageStatus.FAILED

            return (
              <div key={stage.id} className="relative">
                {/* Linha conectora */}
                {index < stages.length - 1 && (
                  <div
                    className={`absolute left-[10px] top-[24px] w-0.5 h-6 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}

                <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : isCompleted
                    ? 'bg-green-50 border border-green-200'
                    : isFailed
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  {/* Ícone de Status */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(stage.status)}
                  </div>

                  {/* Informações da Etapa */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium text-sm ${
                        isCurrent ? 'text-blue-900' :
                        isCompleted ? 'text-green-900' :
                        isFailed ? 'text-red-900' :
                        'text-gray-700'
                      }`}>
                        {stage.stageName}
                      </h4>
                      {isCurrent && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                          Atual
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(stage.status)}

                      {stage.completedAt && (
                        <span className="text-xs text-gray-500">
                          Concluída em {new Date(stage.completedAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {stage.startedAt && !stage.completedAt && (
                        <span className="text-xs text-gray-500">
                          Iniciada em {new Date(stage.startedAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
