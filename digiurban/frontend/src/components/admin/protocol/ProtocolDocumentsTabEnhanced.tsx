// Wrapper para adicionar lógica de "documentos obrigatórios da etapa atual"
'use client'

import { ProtocolDocumentsTab } from './ProtocolDocumentsTab'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import { ProtocolDocument, DocumentStatus } from '@/types/protocol-enhancements'

interface ProtocolDocumentsTabEnhancedProps {
  protocolId: string
  documents: ProtocolDocument[]
  currentStageMetadata?: {
    requiredDocumentTypes?: string[]
  }
  onRefresh: () => void
}

export function ProtocolDocumentsTabEnhanced({
  protocolId,
  documents,
  currentStageMetadata,
  onRefresh
}: ProtocolDocumentsTabEnhancedProps) {
  const requiredForCurrentStage = currentStageMetadata?.requiredDocumentTypes || []

  // Separar documentos
  const requiredDocs = documents.filter(d =>
    requiredForCurrentStage.includes(d.documentType)
  )
  const otherDocs = documents.filter(d =>
    !requiredForCurrentStage.includes(d.documentType)
  )

  const missingRequiredDocs = requiredForCurrentStage.filter(docType =>
    !documents.some(d => d.documentType === docType && d.status === DocumentStatus.APPROVED)
  )

  return (
    <div className="space-y-6">
      {/* Avisos sobre etapa atual */}
      {requiredForCurrentStage.length > 0 && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos Exigidos pela Etapa Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {missingRequiredDocs.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-amber-900 mb-1">
                      {missingRequiredDocs.length} documento(s) pendente(s):
                    </p>
                    <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                      {missingRequiredDocs.map((docType, i) => (
                        <li key={i}>{docType}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Todos os documentos obrigatórios foram aprovados!
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab original de documentos */}
      <ProtocolDocumentsTab
        protocolId={protocolId}
        documents={documents}
        onRefresh={onRefresh}
      />
    </div>
  )
}
