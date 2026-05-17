'use client'

/**
 * ============================================================================
 * DOCUMENT UPLOAD COMPONENT
 * ============================================================================
 * Componente de upload de documentos com suporte a câmera
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  Camera,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react'
import { DocumentScanner } from './DocumentScanner'
import {
  validateFile,
  formatFileSize,
  formatAcceptedFormats,
  getAcceptAttribute,
  canUseCameraUpload,
  type DocumentConfig
} from '@/lib/document-utils'

interface DocumentUploadProps {
  documentConfig: DocumentConfig
  value?: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}

export function DocumentUpload({
  documentConfig,
  value,
  onChange,
  disabled = false
}: DocumentUploadProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowCamera = canUseCameraUpload(documentConfig)

  /**
   * Manipula seleção de arquivo
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    await processFile(file)
  }

  /**
   * Processa arquivo selecionado
   */
  const processFile = async (file: File) => {
    setError(null)
    setUploading(true)

    try {
      // Validar arquivo
      const validation = validateFile(file, documentConfig)

      if (!validation.valid) {
        setError(validation.error || 'Arquivo inválido')
        setUploading(false)
        return
      }

      // Criar preview se for imagem
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }

      onChange(file)
    } catch (err) {
      console.error('Erro ao processar arquivo:', err)
      setError('Erro ao processar arquivo')
    } finally {
      setUploading(false)
    }
  }

  /**
   * Remove arquivo
   */
  const removeFile = () => {
    onChange(null)
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Abre seletor de arquivo
   */
  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  /**
   * Abre scanner de câmera
   */
  const openScanner = () => {
    setShowScanner(true)
  }

  /**
   * Manipula captura da câmera
   */
  const handleCameraCapture = async (file: File) => {
    setShowScanner(false)
    await processFile(file)
  }

  return (
    <div className="space-y-2 w-full min-w-0 max-w-full overflow-hidden">
      {/* Label */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <Label className="text-sm font-medium break-words">
          {documentConfig.name}
          {documentConfig.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
        {documentConfig.description && (
          <span className="text-xs text-gray-500 break-words">
            {documentConfig.description}
          </span>
        )}
      </div>

      {/* Área de upload */}
      {!value ? (
        <Card className={`w-full min-w-0 border-2 border-dashed overflow-hidden ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-amber-400'} transition-colors`}>
          <div className="p-4 text-center overflow-hidden">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />

            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-1">
                {allowCamera ? 'Tire uma foto ou selecione um arquivo' : 'Selecione um arquivo'}
              </p>
              <p className="text-xs text-gray-500 break-words">
                {formatAcceptedFormats(documentConfig.acceptedFormats)} até {documentConfig.maxSizeMB}MB
              </p>
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 flex items-start gap-2 text-left break-words">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {allowCamera && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={openScanner}
                  disabled={disabled || uploading}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2 shrink-0" />
                  Digitalizar
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={openFileDialog}
                disabled={disabled || uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2 shrink-0" />
                Selecionar Arquivo
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptAttribute(documentConfig.acceptedFormats)}
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
          </div>
        </Card>
      ) : (
        <Card className="w-full min-w-0 border-2 border-green-300 bg-green-50 overflow-hidden">
          <div className="p-3 w-full min-w-0 overflow-hidden">
            <div className="flex items-start gap-2 w-full min-w-0 overflow-hidden">
              {/* Thumbnail — tamanho fixo pequeno, nunca cresce */}
              <div className="shrink-0">
                {preview ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-green-400">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-green-100 border-2 border-green-400 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                )}
              </div>

              {/* Info — ocupa o restante, nunca ultrapassa */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-start gap-1 min-w-0">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate w-full">{value.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(value.size)}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {preview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setShowPreviewModal(true)}
                        title="Visualizar imagem"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={removeFile}
                      disabled={disabled}
                      title="Remover arquivo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-1 mt-1.5">
                    <Progress value={100} className="h-1" />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                      Processando...
                    </p>
                  </div>
                )}

                {!uploading && (
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <Check className="h-3 w-3 shrink-0" />
                    Arquivo pronto para envio
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Scanner modal */}
      {showScanner && (
        <DocumentScanner
          documentName={documentConfig.name}
          acceptedFormats={documentConfig.acceptedFormats}
          maxSizeMB={documentConfig.maxSizeMB}
          onCapture={handleCameraCapture}
          onCancel={() => setShowScanner(false)}
        />
      )}

      {/* Preview modal */}
      {showPreviewModal && preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full">
            {/* Botão fechar */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setShowPreviewModal(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Imagem */}
            <div className="flex items-center justify-center h-full">
              <img
                src={preview}
                alt={documentConfig.name}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Info */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <div className="inline-block bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-white text-sm font-medium">{value?.name}</p>
                <p className="text-gray-300 text-xs">{value && formatFileSize(value.size)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
