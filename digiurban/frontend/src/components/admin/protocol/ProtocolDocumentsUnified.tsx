'use client'

import { ProtocolDocumentsTab } from './ProtocolDocumentsTab'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, FileText, AlertTriangle } from 'lucide-react'
import { ProtocolDocument, DocumentStatus } from '@/types/protocol-enhancements'

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
  onRefresh
}: ProtocolDocumentsUnifiedProps) {
  const requiredForCurrentStage = currentStageMetadata?.requiredDocumentTypes || []

  // Análise de documentos
  const requiredDocs = documents.filter(d =>
    requiredForCurrentStage.includes(d.documentType)
  )
  const otherDocs = documents.filter(d =>
    !requiredForCurrentStage.includes(d.documentType)
  )

  const approvedRequiredDocs = requiredDocs.filter(d => d.status === DocumentStatus.APPROVED)
  const pendingRequiredDocs = requiredDocs.filter(d =>
    d.status !== DocumentStatus.APPROVED && d.status !== DocumentStatus.REJECTED
  )
  const rejectedRequiredDocs = requiredDocs.filter(d => d.status === DocumentStatus.REJECTED)

  const missingRequiredDocs = requiredForCurrentStage.filter(docType =>
    !documents.some(d => d.documentType === docType && d.status === DocumentStatus.APPROVED)
  )

  const totalDocuments = documents.length
  const approvedDocuments = documents.filter(d => d.status === DocumentStatus.APPROVED).length
  const pendingDocuments = documents.filter(d =>
    d.status !== DocumentStatus.APPROVED && d.status !== DocumentStatus.REJECTED
  ).length
  const rejectedDocuments = documents.filter(d => d.status === DocumentStatus.REJECTED).length

  return (
    <div className="space-y-4">
      {/* Resumo de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resumo de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
              <p className="text-xs text-gray-600 mt-1">Total</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{approvedDocuments}</p>
              <p className="text-xs text-gray-600 mt-1">Aprovados</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-700">{pendingDocuments}</p>
              <p className="text-xs text-gray-600 mt-1">Pendentes</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{rejectedDocuments}</p>
              <p className="text-xs text-gray-600 mt-1">Rejeitados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status da Etapa Atual */}
      {requiredForCurrentStage.length > 0 && (
        <Alert
          variant={missingRequiredDocs.length === 0 ? 'default' : 'destructive'}
          className={missingRequiredDocs.length === 0 ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}
        >
          {missingRequiredDocs.length === 0 ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Documentos da Etapa Atual: Completos</AlertTitle>
              <AlertDescription className="text-green-800">
                <div className="space-y-2 mt-2">
                  <p className="font-medium">
                    Todos os {requiredForCurrentStage.length} documentos obrigatórios foram aprovados!
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {requiredForCurrentStage.map((docType, i) => (
                      <Badge key={i} variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {docType}
                      </Badge>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Documentos Obrigatórios da Etapa Atual</AlertTitle>
              <AlertDescription className="text-amber-800">
                <div className="space-y-3 mt-2">
                  <div>
                    <p className="font-medium mb-2">
                      {missingRequiredDocs.length} documento(s) pendente(s):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {missingRequiredDocs.map((docType, i) => (
                        <Badge key={i} variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {docType}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Documentos Aprovados */}
                  {approvedRequiredDocs.length > 0 && (
                    <div className="pt-2 border-t border-amber-200">
                      <p className="text-sm font-medium mb-1">
                        Aprovados ({approvedRequiredDocs.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {approvedRequiredDocs.map((doc, i) => (
                          <Badge key={i} variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {doc.documentType}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documentos Rejeitados */}
                  {rejectedRequiredDocs.length > 0 && (
                    <div className="pt-2 border-t border-amber-200">
                      <p className="text-sm font-medium mb-1 text-red-800">
                        Rejeitados ({rejectedRequiredDocs.length}) - Precisam ser reenviados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {rejectedRequiredDocs.map((doc, i) => (
                          <Badge key={i} variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {doc.documentType}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {/* Lista Completa de Documentos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            Gerenciar Documentos ({totalDocuments})
          </h3>
          {requiredForCurrentStage.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {requiredForCurrentStage.length} obrigatórios nesta etapa
            </Badge>
          )}
        </div>

        {/* Tab original de documentos */}
        <ProtocolDocumentsTab
          protocolId={protocolId}
          documents={documents}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  )
}
