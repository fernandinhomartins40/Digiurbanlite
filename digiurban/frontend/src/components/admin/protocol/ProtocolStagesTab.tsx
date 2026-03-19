'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, PauseCircle, XCircle, SkipForward, AlertCircle, Building2, UserRound, Shield } from 'lucide-react'
import { ProtocolStage, StageStatus } from '@/types/protocol-enhancements'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ProtocolStageActions } from './ProtocolStageActions'
import { PendingCreationContext } from './protocol-pending-context'

interface ProtocolStagesTabProps {
  protocolId: string
  stages: ProtocolStage[]
  onRefresh: () => void
  onCreatePendingRequest?: (context: PendingCreationContext) => void
}

export function ProtocolStagesTab({ protocolId, stages, onRefresh, onCreatePendingRequest }: ProtocolStagesTabProps) {
  const getStatusIcon = (status: StageStatus) => {
    switch (status) {
      case StageStatus.COMPLETED:
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case StageStatus.IN_PROGRESS:
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
      case StageStatus.PAUSED:
        return <PauseCircle className="h-5 w-5 text-amber-600" />
      case StageStatus.SKIPPED:
        return <SkipForward className="h-5 w-5 text-gray-400" />
      case StageStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getStatusBadge = (status: StageStatus) => {
    const config: Record<StageStatus, { label: string; className: string }> = {
      [StageStatus.PENDING]: { label: 'Pendente', className: 'bg-gray-100 text-gray-700' },
      [StageStatus.IN_PROGRESS]: { label: 'Em andamento', className: 'bg-blue-100 text-blue-700' },
      [StageStatus.PAUSED]: { label: 'Pausada', className: 'bg-amber-100 text-amber-700' },
      [StageStatus.COMPLETED]: { label: 'Conclu?da', className: 'bg-green-100 text-green-700' },
      [StageStatus.SKIPPED]: { label: 'Pulada', className: 'bg-gray-100 text-gray-500' },
      [StageStatus.FAILED]: { label: 'Falhou', className: 'bg-red-100 text-red-700' },
    }

    return <Badge variant="outline" className={config[status].className}>{config[status].label}</Badge>
  }

  const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder)
  const currentStage = sortedStages.find(
    (stage) => stage.status === StageStatus.IN_PROGRESS || stage.status === StageStatus.PAUSED
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Workflow / Etapas</h3>
      </div>

      {currentStage && (
        <ProtocolStageActions
          protocolId={protocolId}
          stageId={currentStage.id}
          stageName={currentStage.stageName}
          stageStatus={currentStage.status}
          metadata={currentStage.metadata}
          onActionComplete={onRefresh}
          onCreatePendingRequest={onCreatePendingRequest}
        />
      )}

      {stages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <AlertCircle className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>Nenhum workflow configurado para este protocolo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute bottom-8 left-6 top-8 w-0.5 bg-gray-200" />

          <div className="space-y-6">
            {sortedStages.map((stage) => (
              <div key={stage.id} className="relative">
                <Card className={stage.status === StageStatus.IN_PROGRESS || stage.status === StageStatus.PAUSED ? 'border-blue-300 shadow-md' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative z-10 bg-white">
                        {getStatusIcon(stage.status)}
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Etapa {stage.stageOrder}</span>
                            <h4 className="font-medium">{stage.stageName}</h4>
                            {getStatusBadge(stage.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          {stage.startedAt && (
                            <div>
                              <span className="font-medium">Iniciada:</span>{' '}
                              {format(new Date(stage.startedAt), "dd/MM/yyyy '?s' HH:mm", { locale: ptBR })}
                            </div>
                          )}
                          {stage.completedAt && (
                            <div>
                              <span className="font-medium">Conclu?da:</span>{' '}
                              {format(new Date(stage.completedAt), "dd/MM/yyyy '?s' HH:mm", { locale: ptBR })}
                            </div>
                          )}
                          {stage.dueDate && (
                            <div>
                              <span className="font-medium">Prazo:</span>{' '}
                              {format(new Date(stage.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          )}
                          {stage.assignedTo && (
                            <div>
                              <span className="font-medium">Respons?vel:</span> {stage.assignedTo}
                            </div>
                          )}
                        </div>

                        {stage.notes && (
                          <div className="mt-2 rounded bg-muted p-2 text-sm">
                            <span className="font-medium">Notas:</span> {stage.notes}
                          </div>
                        )}

                        {stage.result && (
                          <div className="mt-2 rounded border border-green-200 bg-green-50 p-2 text-sm">
                            <span className="font-medium">Resultado:</span> {stage.result}
                          </div>
                        )}

                        {(stage.metadata?.stageSupportAssignments?.length || 0) > 0 && (
                          <div className="mt-3">
                            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                              Execu??o da etapa
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {stage.metadata?.stageSupportAssignments?.map((assignment, assignmentIndex) => (
                                <Badge
                                  key={assignment.id || `${assignment.targetType}-${assignment.userId || assignment.departmentId || assignment.organizationalUnitId || assignmentIndex}`}
                                  variant="outline"
                                  className={`text-xs ${
                                    assignment.mode === 'REQUIRED_EXECUTION'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : assignment.mode === 'SUGGEST_ASSIGNMENT'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {assignment.targetType === 'USER' ? (
                                    <UserRound className="mr-1 h-3 w-3" />
                                  ) : assignment.targetType === 'DEPARTMENT' ? (
                                    <Shield className="mr-1 h-3 w-3" />
                                  ) : (
                                    <Building2 className="mr-1 h-3 w-3" />
                                  )}
                                  {assignment.mode === 'REQUIRED_EXECUTION'
                                    ? 'Obrigat?rio'
                                    : assignment.mode === 'SUGGEST_ASSIGNMENT'
                                      ? 'Sugest?o'
                                      : 'Refer?ncia'}
                                  : {assignment.userName || assignment.departmentName || assignment.organizationalUnitName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
