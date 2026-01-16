'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X, ExternalLink } from 'lucide-react'

interface CitizenDocumentViewerProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string
  documentName: string
  mimeType?: string
  protocolId: string
  documentId: string
}

export function CitizenDocumentViewer({
  isOpen,
  onClose,
  documentUrl,
  documentName,
  mimeType,
  protocolId,
  documentId
}: CitizenDocumentViewerProps) {
  const isPDF = mimeType?.includes('pdf') || documentName.toLowerCase().endsWith('.pdf')
  const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(documentName)

  const fullUrl = `/api/citizen/protocols/${protocolId}/documents/${documentId}/download?inline=true`
  const downloadUrl = `/api/citizen/protocols/${protocolId}/documents/${documentId}/download`

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = documentName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenNewTab = () => {
    window.open(fullUrl, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate flex-1 mr-4">{documentName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em Nova Aba
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 mt-4">
          {isPDF ? (
            // Visualizador de PDF
            <iframe
              src={fullUrl}
              className="w-full h-full border rounded-lg"
              title={documentName}
            />
          ) : isImage ? (
            // Visualizador de Imagem
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-auto">
              <img
                src={fullUrl}
                alt={documentName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            // Tipo de arquivo não suportado para visualização
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Visualização não disponível para este tipo de arquivo
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Documento
                  </Button>
                  <Button variant="outline" onClick={handleOpenNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em Nova Aba
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
