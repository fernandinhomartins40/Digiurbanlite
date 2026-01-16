'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CitizenDocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  protocolId: string
  documentType: string
  onUploadSuccess?: () => void
  apiRequest: (url: string, options?: RequestInit) => Promise<any>
}

export function CitizenDocumentUploadModal({
  isOpen,
  onClose,
  protocolId,
  documentType,
  onUploadSuccess,
  apiRequest
}: CitizenDocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB')
        return
      }

      // Validar tipo
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não permitido. Use PDF, JPG, PNG ou DOC/DOCX')
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo primeiro')
      return
    }

    try {
      setUploading(true)

      // Criar FormData
      const formData = new FormData()
      formData.append('document', selectedFile)

      // Fazer upload
      // Nota: Este endpoint precisa ser ajustado conforme a necessidade
      // Por enquanto, vamos usar o endpoint de pendências se existir
      const response = await fetch(`/api/citizen/protocols/${protocolId}/documents/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erro ao fazer upload')
      }

      toast.success('Documento enviado com sucesso!')
      setSelectedFile(null)
      onClose()

      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao enviar documento')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Documento</DialogTitle>
          <DialogDescription>
            Tipo: {documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Área de seleção de arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Selecione o arquivo</Label>
            <div className="flex items-center gap-2">
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Escolher Arquivo
              </Button>
            </div>
          </div>

          {/* Arquivo selecionado */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              {!uploading && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Informações */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Tamanho máximo: 10MB</p>
            <p>• Formatos aceitos: PDF, JPG, PNG, DOC, DOCX</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
