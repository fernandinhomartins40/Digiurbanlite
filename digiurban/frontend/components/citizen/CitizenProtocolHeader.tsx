'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Upload,
  MessageSquare,
  XCircle,
  Download,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { CitizenProtocolViewMode } from '@/lib/citizen-protocol-view-mode'
import { CancelProtocolDialog } from './CancelProtocolDialog'

interface CitizenProtocolHeaderProps {
  protocolId: string
  protocolNumber: string
  serviceName: string
  departmentName: string
  status: string
  mode: CitizenProtocolViewMode
  currentStage?: {
    id: string
    stageName: string
  }
  citizenPendingsCount: number
  unreadMessagesCount: number
  hasGeneratedDocuments: boolean
  canCancel: boolean
  onBack: () => void
  onUploadDocuments?: () => void
  onViewMessages?: () => void
  onDownloadDocument?: () => void
  onRefresh: () => void
  /** data prevista (ProtocolSLA.expectedEndDate), vem da API do pedido */
  expectedEndDate?: string | null
  isLate?: boolean
  slaPaused?: boolean
  concludedAt?: string | null
}

const brDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

export function CitizenProtocolHeader({
  protocolId,
  protocolNumber,
  serviceName,
  departmentName,
  status,
  mode,
  currentStage,
  citizenPendingsCount,
  unreadMessagesCount,
  hasGeneratedDocuments,
  canCancel,
  onBack,
  onUploadDocuments,
  onViewMessages,
  onDownloadDocument,
  onRefresh,
  expectedEndDate,
  isLate = false,
  slaPaused = false,
  concludedAt
}: CitizenProtocolHeaderProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  // Determinar badge de status
  const getStatusBadge = () => {
    switch (status) {
      case 'VINCULADO':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Recebido
          </Badge>
        )
      case 'PENDENCIA':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Com Pendência
          </Badge>
        )
      case 'PROGRESSO':
      case 'ATUALIZACAO':
      case 'EM_ANDAMENTO':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Em Andamento
          </Badge>
        )
      case 'CONCLUIDO':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        )
      case 'CANCELADO':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleCancelSuccess = () => {
    setCancelDialogOpen(false)
    onRefresh()
  }

  return (
    <>
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          {/* Linha 1: Voltar + Título + Status */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="shrink-0 mt-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {protocolNumber}
                </h1>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {serviceName}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {departmentName}
                </p>
              </div>
            </div>
            <div className="shrink-0">
              {getStatusBadge()}
            </div>
          </div>

          {/* Linha 2: onde está e quando sai — uma frase só (nunca o nome do servidor) */}
          {(() => {
            if (status === 'CANCELADO') return null
            if (status === 'CONCLUIDO') {
              return (
                <p className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-900">
                  Pedido concluído{concludedAt ? ` em ${brDate(concludedAt)}` : ''}.
                </p>
              )
            }
            const waitingYou = slaPaused || mode === CitizenProtocolViewMode.WAITING
            const where = `${departmentName} está com o seu pedido${currentStage ? `, na etapa “${currentStage.stageName}”` : ''}.`
            const when = waitingYou
              ? ' Falta uma resposta sua; o prazo volta a contar quando você responder.'
              : isLate && expectedEndDate
                ? ` Era para ficar pronto até ${brDate(expectedEndDate)} e está atrasado.`
                : expectedEndDate
                  ? ` Previsão: até ${brDate(expectedEndDate)}.`
                  : ''
            const tone = waitingYou
              ? 'border-orange-200 bg-orange-50 text-orange-900'
              : isLate
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-blue-200 bg-blue-50 text-blue-900'
            return (
              <div className={`mb-4 flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center ${tone}`}>
                <p className="flex-1 text-sm font-medium">
                  <Clock className="mr-1.5 inline h-4 w-4 align-[-2px]" />
                  {where}
                  {when}
                </p>
                {isLate && !waitingYou && onViewMessages && (
                  <Button size="sm" variant="outline" onClick={onViewMessages} className="shrink-0 bg-white">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Falar com a prefeitura
                  </Button>
                )}
              </div>
            )
          })()}

          {/* Linha 3: Ações do Cidadão */}
          <div className="flex flex-wrap gap-2">
            {/* Enviar Documentos (se modo WAITING ou tem pendências) */}
            {(mode === CitizenProtocolViewMode.WAITING || citizenPendingsCount > 0) && onUploadDocuments && (
              <Button
                size="sm"
                onClick={onUploadDocuments}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Enviar Documentos
                {citizenPendingsCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-red-600 text-white">
                    {citizenPendingsCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Mensagens */}
            {onViewMessages && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewMessages}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Mensagens
                {unreadMessagesCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-600 text-white">
                    {unreadMessagesCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Baixar Documento (se ARCHIVED e houver docs) */}
            {mode === CitizenProtocolViewMode.ARCHIVED && hasGeneratedDocuments && onDownloadDocument && (
              <Button
                size="sm"
                variant="default"
                onClick={onDownloadDocument}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Documento
              </Button>
            )}

            {/* Cancelar Protocolo */}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCancelDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cancelamento */}
      <CancelProtocolDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        protocolId={protocolId}
        protocolNumber={protocolNumber}
        onSuccess={handleCancelSuccess}
      />
    </>
  )
}
