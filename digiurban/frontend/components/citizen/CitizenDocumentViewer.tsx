'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X, ExternalLink, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react'

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
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const isPDF = mimeType?.includes('pdf') || documentName.toLowerCase().endsWith('.pdf')
  const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(documentName)

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

  const handleClose = () => {
    setZoom(100)
    setRotation(0)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[92vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <DialogTitle className="truncate flex-1 text-sm font-semibold">{documentName}</DialogTitle>

            {/* Controles de zoom/rotação para imagens */}
            {isImage && (
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(z - 25, 25))} disabled={zoom <= 25}>
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-gray-500 min-w-[36px] text-center">{zoom}%</span>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(z + 25, 300))} disabled={zoom >= 300}>
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setRotation(r => (r + 90) % 360)}>
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => { setZoom(100); setRotation(0) }} title="Resetar">
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-1" />
              Baixar
            </Button>
            <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs" onClick={() => window.open(fullUrl, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Nova aba
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto bg-gray-100">
          {isPDF ? (
            <iframe
              src={fullUrl}
              className="w-full h-full border-0"
              title={documentName}
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4 min-h-[300px]">
              <img
                src={fullUrl}
                alt={documentName}
                className="rounded-lg shadow-lg bg-white"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                  maxWidth: zoom <= 100 ? '100%' : 'none',
                  maxHeight: zoom <= 100 ? '100%' : 'none',
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 border-2 border-dashed m-4 rounded-lg">
              <div className="text-center space-y-4 p-8">
                <p className="text-gray-600">Visualização não disponível para este tipo de arquivo</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Documento
                  </Button>
                  <Button variant="outline" onClick={() => window.open(fullUrl, '_blank')}>
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
