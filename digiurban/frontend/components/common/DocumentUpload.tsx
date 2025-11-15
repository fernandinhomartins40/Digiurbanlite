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
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {documentConfig.name}
          {documentConfig.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
        {documentConfig.description && (
          <span className="text-xs text-gray-500">
            {documentConfig.description}
          </span>
        )}
      </div>

      {/* Área de upload */}
      {!value ? (
        <Card className={`border-2 border-dashed ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-amber-400'} transition-colors`}>
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">
                {allowCamera ? 'Tire uma foto ou selecione um arquivo' : 'Selecione um arquivo'}
              </p>
              <p className="text-xs text-gray-500">
                {formatAcceptedFormats(documentConfig.acceptedFormats)} até {documentConfig.maxSizeMB}MB
              </p>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {allowCamera && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={openScanner}
                  disabled={disabled || uploading}
                  className="w-full sm:w-auto"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Digitalizar
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={openFileDialog}
                disabled={disabled || uploading}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>

            {/* Input file oculto */}
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
        /* Preview do arquivo */
        <Card className="border-2 border-green-300 bg-green-50">
          <div className="p-4">
            <div className="flex items-start gap-4">
              {/* Preview de imagem ou ícone */}
              <div className="flex-shrink-0">
                {preview ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-green-400">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-green-100 border-2 border-green-400 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                )}
              </div>

              {/* Informações do arquivo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {value.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(value.size)}
                    </p>
                  </div>

                  <div className="flex gap-1 ml-2">
                    {preview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setShowPreviewModal(true)}
                        title="Visualizar imagem"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={removeFile}
                      disabled={disabled}
                      title="Remover arquivo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Barra de progresso (se uploading) */}
                {uploading && (
                  <div className="space-y-1">
                    <Progress value={100} className="h-1" />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Processando...
                    </p>
                  </div>
                )}

                {!uploading && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Check className="h-3 w-3" />
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
