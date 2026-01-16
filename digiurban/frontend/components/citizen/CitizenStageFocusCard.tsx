'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Target,
  Upload,
  Download
} from 'lucide-react'
import { CitizenProtocolViewMode } from '@/lib/citizen-protocol-view-mode'

interface CitizenStageFocusCardProps {
  mode: CitizenProtocolViewMode
  currentStage?: {
    stageName: string
    stageOrder: number
  }
  totalStages: number
  citizenPendings: Array<{
    id: string
    type: string
    description: string
    status: string
  }>
  estimatedDays?: number
  completedAt?: string
  onGoToPendings?: () => void
  onDownloadDocument?: () => void
}

export function CitizenStageFocusCard({
  mode,
  currentStage,
  totalStages,
  citizenPendings,
  estimatedDays,
  completedAt,
  onGoToPendings,
  onDownloadDocument
}: CitizenStageFocusCardProps) {
  // MODO: WAITING - Ação necessária do cidadão
  if (mode === CitizenProtocolViewMode.WAITING && citizenPendings.length > 0) {
    return (
      <Card className="border-2 border-orange-300 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="h-12 w-12 rounded-full bg-orange-600 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-orange-900">
                  AÇÃO NECESSÁRIA
                </h3>
                <Badge variant="destructive">
                  {citizenPendings.length}
                </Badge>
              </div>
              <p className="text-sm text-orange-800 mb-3">
                {citizenPendings.length === 1
                  ? 'Você precisa enviar um documento para continuar:'
                  : `Você precisa enviar ${citizenPendings.length} documentos para continuar:`}
              </p>
              <ul className="space-y-1 mb-4">
                {citizenPendings.slice(0, 3).map((pending) => (
                  <li key={pending.id} className="text-sm text-orange-800 flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span className="font-medium">{pending.description}</span>
                  </li>
                ))}
                {citizenPendings.length > 3 && (
                  <li className="text-sm text-orange-700 italic">
                    + {citizenPendings.length - 3} outro(s)
                  </li>
                )}
              </ul>
              {onGoToPendings && (
                <Button
                  size="sm"
                  onClick={onGoToPendings}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Ir para Pendências
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // MODO: ACTIVE - Aguardando análise
  if (mode === CitizenProtocolViewMode.ACTIVE && currentStage) {
    return (
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                AGUARDANDO ANÁLISE
              </h3>
              <p className="text-sm text-blue-800 mb-2">
                Sua solicitação está sendo analisada pela equipe responsável.
              </p>
              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-blue-900">Etapa Atual:</span>
                  <span className="text-blue-800">{currentStage.stageName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-blue-900">Progresso:</span>
                  <span className="text-blue-800">
                    Etapa {currentStage.stageOrder} de {totalStages}
                  </span>
                </div>
                {estimatedDays && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-blue-900">Prazo estimado:</span>
                    <span className="text-blue-800">{estimatedDays} dias úteis</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-blue-700 italic">
                Você será notificado quando houver atualizações ou se precisarmos de mais informações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // MODO: COMPLETING - Última etapa
  if (mode === CitizenProtocolViewMode.COMPLETING) {
    return (
      <Card className="border-2 border-purple-300 bg-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-purple-900 mb-2">
                FASE FINAL
              </h3>
              <p className="text-sm text-purple-800 mb-2">
                Seu protocolo está em fase final!
              </p>
              <p className="text-sm text-purple-800 mb-3">
                Estamos gerando seu documento. Em breve você receberá a conclusão do processo.
              </p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-purple-200 rounded-full overflow-hidden">
                  <div className="h-full w-[90%] bg-purple-600 rounded-full animate-pulse" />
                </div>
                <span className="text-sm font-medium text-purple-900">90%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // MODO: ARCHIVED - Concluído
  if (mode === CitizenProtocolViewMode.ARCHIVED && completedAt) {
    return (
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-green-900 mb-2">
                PROTOCOLO CONCLUÍDO
              </h3>
              <p className="text-sm text-green-800 mb-2">
                Concluído em {new Date(completedAt).toLocaleDateString('pt-BR')} às{' '}
                {new Date(completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-green-800 mb-4">
                Seu documento está disponível para download na aba "Documentos Gerados".
              </p>
              {onDownloadDocument && (
                <Button
                  size="sm"
                  onClick={onDownloadDocument}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Agora
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
