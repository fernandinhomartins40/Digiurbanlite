'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Clock, XCircle, SkipForward, AlertCircle } from 'lucide-react'
import { ProtocolStage, StageStatus } from '@/types/protocol-enhancements'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProtocolStagesTabProps {
  protocolId: string
  stages: ProtocolStage[]
  onRefresh: () => void
}

export function ProtocolStagesTab({ protocolId, stages, onRefresh }: ProtocolStagesTabProps) {
  const getStatusIcon = (status: StageStatus) => {
    switch (status) {
      case StageStatus.COMPLETED: return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case StageStatus.IN_PROGRESS: return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
      case StageStatus.SKIPPED: return <SkipForward className="h-5 w-5 text-gray-400" />
      case StageStatus.FAILED: return <XCircle className="h-5 w-5 text-red-600" />
      default: return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getStatusBadge = (status: StageStatus) => {
    const config = {
      [StageStatus.PENDING]: { label: 'Pendente', className: 'bg-gray-100 text-gray-700' },
      [StageStatus.IN_PROGRESS]: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700' },
      [StageStatus.COMPLETED]: { label: 'Concluída', className: 'bg-green-100 text-green-700' },
      [StageStatus.SKIPPED]: { label: 'Pulada', className: 'bg-gray-100 text-gray-500' },
      [StageStatus.FAILED]: { label: 'Falhou', className: 'bg-red-100 text-red-700' },
    }
    return <Badge variant="outline" className={config[status].className}>{config[status].label}</Badge>
  }

  const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Workflow / Etapas</h3>
      </div>

      {stages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum workflow configurado para este protocolo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Linha Vertical de Conexão */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200" />

          {/* Etapas */}
          <div className="space-y-6">
            {sortedStages.map((stage, index) => (
              <div key={stage.id} className="relative">
                <Card className={stage.status === StageStatus.IN_PROGRESS ? 'border-blue-300 shadow-md' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Ícone de Status */}
                      <div className="relative z-10 bg-white">
                        {getStatusIcon(stage.status)}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Etapa {stage.stageOrder}</span>
                            <h4 className="font-medium">{stage.stageName}</h4>
                            {getStatusBadge(stage.status)}
                          </div>
                          {stage.status === StageStatus.IN_PROGRESS && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">Completar</Button>
                              <Button size="sm" variant="ghost">Pular</Button>
                            </div>
                          )}
                        </div>

                        {/* Informações */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          {stage.startedAt && (
                            <div>
                              <span className="font-medium">Iniciada:</span> {format(new Date(stage.startedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                          )}
                          {stage.completedAt && (
                            <div>
                              <span className="font-medium">Concluída:</span> {format(new Date(stage.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                          )}
                          {stage.dueDate && (
                            <div>
                              <span className="font-medium">Prazo:</span> {format(new Date(stage.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          )}
                          {stage.assignedTo && (
                            <div>
                              <span className="font-medium">Responsável:</span> {stage.assignedTo}
                            </div>
                          )}
                        </div>

                        {/* Notas */}
                        {stage.notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <span className="font-medium">Notas:</span> {stage.notes}
                          </div>
                        )}

                        {/* Resultado */}
                        {stage.result && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                            <span className="font-medium">Resultado:</span> {stage.result}
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
