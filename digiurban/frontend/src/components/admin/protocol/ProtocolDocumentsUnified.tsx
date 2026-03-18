'use client'

import { ProtocolDocumentsTab } from './ProtocolDocumentsTab'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, FileText, AlertTriangle } from 'lucide-react'
import { ProtocolDocument, DocumentStatus } from '@/types/protocol-enhancements'
import { matchProtocolDocumentLabel } from '@/lib/protocol-document-matching'

interface ProtocolDocumentsUnifiedProps {
  protocolId: string
  documents: ProtocolDocument[]
  currentStageMetadata?: {
    requiredDocumentTypes?: string[]
  }
  onRefresh: () => void
}

export function ProtocolDocumentsUnified({
  protocolId,
  documents,
  currentStageMetadata,
  onRefresh,
}: ProtocolDocumentsUnifiedProps) {
  const requiredForCurrentStage = currentStageMetadata?.requiredDocumentTypes || []

  const documentMatchesStageRequirement = (document: ProtocolDocument, requiredType: string) =>
    matchProtocolDocumentLabel(document.documentType, requiredType)

  const requiredDocs = documents.filter((document) =>
    requiredForCurrentStage.some((requiredType) => documentMatchesStageRequirement(document, requiredType))
  )

  const approvedRequiredDocs = requiredDocs.filter((document) => document.status === DocumentStatus.APPROVED)
  const pendingRequiredDocs = requiredDocs.filter(
    (document) => document.status !== DocumentStatus.APPROVED && document.status !== DocumentStatus.REJECTED
  )
  const rejectedRequiredDocs = requiredDocs.filter((document) => document.status === DocumentStatus.REJECTED)

  const missingRequiredDocs = requiredForCurrentStage.filter((requiredType) =>
    !documents.some(
      (document) =>
        documentMatchesStageRequirement(document, requiredType) && document.status === DocumentStatus.APPROVED
    )
  )

  const totalDocuments = documents.length
  const approvedDocuments = documents.filter((document) => document.status === DocumentStatus.APPROVED).length
  const pendingDocuments = documents.filter(
    (document) => document.status !== DocumentStatus.APPROVED && document.status !== DocumentStatus.REJECTED
  ).length
  const rejectedDocuments = documents.filter((document) => document.status === DocumentStatus.REJECTED).length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Resumo de documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
              <p className="mt-1 text-xs text-gray-600">Total</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{approvedDocuments}</p>
              <p className="mt-1 text-xs text-gray-600">Aprovados</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">{pendingDocuments}</p>
              <p className="mt-1 text-xs text-gray-600">Pendentes</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{rejectedDocuments}</p>
              <p className="mt-1 text-xs text-gray-600">Rejeitados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {requiredForCurrentStage.length > 0 && (
        <Alert
          variant={missingRequiredDocs.length === 0 ? 'default' : 'destructive'}
          className={missingRequiredDocs.length === 0 ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}
        >
          {missingRequiredDocs.length === 0 ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Documentos da etapa atual: completos</AlertTitle>
              <AlertDescription className="mt-2 space-y-2 text-green-800">
                <p className="font-medium">
                  Todos os {requiredForCurrentStage.length} documentos obrigatórios desta etapa foram aprovados.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {requiredForCurrentStage.map((documentType) => (
                    <Badge key={documentType} variant="outline" className="border-green-300 bg-green-100 text-green-800">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {documentType}
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Documentos obrigatórios da etapa atual</AlertTitle>
              <AlertDescription className="mt-2 space-y-3 text-amber-800">
                <div>
                  <p className="mb-2 font-medium">{missingRequiredDocs.length} documento(s) pendente(s):</p>
                  <div className="flex flex-wrap gap-2">
                    {missingRequiredDocs.map((documentType) => (
                      <Badge key={documentType} variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        {documentType}
                      </Badge>
                    ))}
                  </div>
                </div>

                {approvedRequiredDocs.length > 0 && (
                  <div className="border-t border-amber-200 pt-2">
                    <p className="mb-1 text-sm font-medium">Aprovados ({approvedRequiredDocs.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {approvedRequiredDocs.map((document) => (
                        <Badge key={document.id} variant="outline" className="border-green-300 bg-green-100 text-xs text-green-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {document.documentType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {rejectedRequiredDocs.length > 0 && (
                  <div className="border-t border-amber-200 pt-2">
                    <p className="mb-1 text-sm font-medium text-red-800">
                      Rejeitados ({rejectedRequiredDocs.length}) - precisam ser reenviados:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rejectedRequiredDocs.map((document) => (
                        <Badge key={document.id} variant="outline" className="border-red-300 bg-red-100 text-xs text-red-800">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {document.documentType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {pendingRequiredDocs.length > 0 && (
                  <div className="border-t border-amber-200 pt-2">
                    <p className="mb-1 text-sm font-medium text-amber-900">
                      Já existem arquivos vinculados, mas ainda sem aprovação final ({pendingRequiredDocs.length}).
                    </p>
                  </div>
                )}
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Gerenciar documentos ({totalDocuments})</h3>
          {requiredForCurrentStage.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {requiredForCurrentStage.length} obrigatórios nesta etapa
            </Badge>
          )}
        </div>

        <ProtocolDocumentsTab
          protocolId={protocolId}
          documents={documents}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  )
}