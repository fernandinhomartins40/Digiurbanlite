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
  const openPendings = citizenPendings.filter((pending) => ['OPEN', 'IN_PROGRESS'].includes(pending.status))
  const hasDocumentOnlyPendings =
    openPendings.length > 0 && openPendings.every((pending) => pending.type === 'DOCUMENT')

  if (mode === CitizenProtocolViewMode.WAITING && openPendings.length > 0) {
    return (
      <Card className="border-2 border-orange-300 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-lg font-bold text-orange-900">AÇÃO NECESSÁRIA</h3>
                <Badge variant="destructive">{openPendings.length}</Badge>
              </div>
              <p className="mb-3 text-sm text-orange-800">
                {openPendings.length === 1
                  ? (hasDocumentOnlyPendings
                    ? 'Você precisa enviar um documento para continuar:'
                    : 'Você precisa responder uma pendência para continuar:')
                  : (hasDocumentOnlyPendings
                    ? `Você precisa enviar ${openPendings.length} documentos para continuar:`
                    : `Você precisa resolver ${openPendings.length} pendências para continuar:`)}
              </p>
              <ul className="mb-4 space-y-1">
                {openPendings.slice(0, 3).map((pending) => (
                  <li key={pending.id} className="flex items-start gap-2 text-sm text-orange-800">
                    <span className="mt-0.5 text-orange-600">•</span>
                    <span className="font-medium">{pending.description}</span>
                  </li>
                ))}
                {openPendings.length > 3 && (
                  <li className="text-sm italic text-orange-700">
                    + {openPendings.length - 3} outro(s)
                  </li>
                )}
              </ul>
              {onGoToPendings && (
                <Button
                  size="sm"
                  onClick={onGoToPendings}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Resolver Pendências
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mode === CitizenProtocolViewMode.ACTIVE && currentStage) {
    return (
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                <Clock className="h-6 w-6 animate-pulse text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="mb-2 text-lg font-bold text-blue-900">AGUARDANDO ANÁLISE</h3>
              <p className="mb-2 text-sm text-blue-800">
                Sua solicitação está sendo analisada pela equipe responsável.
              </p>
              <div className="mb-3 space-y-1">
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
              <p className="text-xs italic text-blue-700">
                Você será notificado quando houver atualizações ou se precisarmos de mais informações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mode === CitizenProtocolViewMode.COMPLETING) {
    return (
      <Card className="border-2 border-purple-300 bg-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="mb-2 text-lg font-bold text-purple-900">FASE FINAL</h3>
              <p className="mb-2 text-sm text-purple-800">
                Seu protocolo está em fase final.
              </p>
              <p className="mb-3 text-sm text-purple-800">
                Estamos gerando seu documento. Em breve você receberá a conclusão do processo.
              </p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-purple-200">
                  <div className="h-full w-[90%] animate-pulse rounded-full bg-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-900">90%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mode === CitizenProtocolViewMode.ARCHIVED && completedAt) {
    return (
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="mb-2 text-lg font-bold text-green-900">PROTOCOLO CONCLUÍDO</h3>
              <p className="mb-2 text-sm text-green-800">
                Concluído em {new Date(completedAt).toLocaleDateString('pt-BR')} às{' '}
                {new Date(completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="mb-4 text-sm text-green-800">
                Seu documento está disponível para download na aba "Documentos Gerados".
              </p>
              {onDownloadDocument && (
                <Button
                  size="sm"
                  onClick={onDownloadDocument}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" />
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
