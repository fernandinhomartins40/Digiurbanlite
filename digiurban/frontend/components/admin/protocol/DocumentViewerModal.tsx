'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { useState } from 'react'

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string
  documentName: string
  documentType?: string
  onDownload?: () => void
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  documentUrl,
  documentName,
  documentType = 'application/pdf',
  onDownload
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const isPDF = documentType === 'application/pdf' || documentName.toLowerCase().endsWith('.pdf')
  const isImage = documentType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(documentName)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  const resetView = () => {
    setZoom(100)
    setRotation(0)
  }

  // Reset ao fechar
  const handleClose = () => {
    resetView()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate max-w-md">
              {documentName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isImage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[4rem] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotate}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex items-center justify-center min-h-full">
            {isPDF ? (
              <iframe
                src={documentUrl}
                className="w-full h-full min-h-[70vh] bg-white rounded-lg shadow-lg"
                title={documentName}
              />
            ) : isImage ? (
              <div className="flex items-center justify-center">
                <img
                  src={documentUrl}
                  alt={documentName}
                  className="max-w-full h-auto rounded-lg shadow-lg bg-white"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>
            ) : (
              <div className="text-center p-8">
                <p className="text-gray-600 mb-4">
                  Pré-visualização não disponível para este tipo de arquivo.
                </p>
                {onDownload && (
                  <Button onClick={onDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
