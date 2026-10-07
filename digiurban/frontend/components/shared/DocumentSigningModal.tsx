'use client'

/**
 * Assinar documento enviado (servidor ou cidadão). Agora é o diálogo único de
 * assinatura por senha (SignDocumentDialog) — sem PIN e sem chave no navegador.
 */

import { SignDocumentDialog } from './SignDocumentDialog'

interface DocumentSigningModalProps {
  document: {
    id: string
    fileName: string
    fileUrl: string
    fileSize?: number
    signatures?: unknown[]
  }
  userType: 'admin' | 'citizen'
  onClose: () => void
  onSuccess?: (signature: any) => void
}

export function DocumentSigningModal({ document, userType, onClose, onSuccess }: DocumentSigningModalProps) {
  return (
    <SignDocumentDialog
      document={{ id: document.id, fileName: document.fileName, fileUrl: document.fileUrl }}
      userType={userType}
      documentType="external"
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}
