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
}

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
  onRefresh
}: CitizenProtocolHeaderProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  // Determinar badge de status
  const getStatusBadge = () => {
    switch (status) {
      case 'VINCULADO':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )
      case 'PROGRESSO':
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

          {/* Linha 2: Etapa Atual (se houver) */}
          {currentStage && mode !== CitizenProtocolViewMode.ARCHIVED && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-900 truncate">
                    Etapa Atual: {currentStage.stageName}
                  </p>
                </div>
                {mode === CitizenProtocolViewMode.WAITING && (
                  <Badge variant="destructive" className="shrink-0">
                    Ação Necessária
                  </Badge>
                )}
              </div>
            </div>
          )}

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
