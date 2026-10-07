'use client'

/**
 * Assinar documento (gerado no protocolo ou enviado). Agora é o diálogo único
 * de assinatura por senha (SignDocumentDialog): sem escolher posição no PDF —
 * a assinatura vai na folha de assinaturas, no fim do PDF, com QR Code.
 */

import { SignDocumentDialog } from './SignDocumentDialog'

interface DocumentSigningModalSimpleProps {
  document: {
    id: string
    fileName: string
    fileUrl: string
    fileSize?: number
    signatures?: unknown[]
  }
  userType: 'admin' | 'citizen'
  documentType?: 'generated' | 'external'
  onClose: () => void
  onSuccess?: (signature: any) => void
}

export function DocumentSigningModalSimple({ document, userType, documentType = 'external', onClose, onSuccess }: DocumentSigningModalSimpleProps) {
  return (
    <SignDocumentDialog
      document={{ id: document.id, fileName: document.fileName, fileUrl: document.fileUrl }}
      userType={userType}
      documentType={documentType}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}
