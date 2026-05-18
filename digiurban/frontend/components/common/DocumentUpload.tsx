'use client'

/**
 * ============================================================================
 * DOCUMENT UPLOAD COMPONENT
 * ============================================================================
 * Componente de upload de documentos com suporte a câmera
 */

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

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
        <Card className="w-full border-2 border-green-300 bg-green-50 overflow-hidden">
          <div className="p-3">
            {/* linha principal: thumbnail + info + botões */}
            <div className="grid overflow-hidden" style={{ gridTemplateColumns: '48px 1fr auto' , gap: '8px' }}>
              {/* Thumbnail — 48×48 fixo, nunca cresce nem encolhe */}
              <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 border-green-400 bg-green-100 flex items-center justify-center">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    width={48}
                    height={48}
                    className="block w-12 h-12 object-cover"
                  />
                ) : (
                  <FileText className="h-5 w-5 text-green-600" />
                )}
              </div>

              {/* Info — ocupa o espaço restante, trunca o nome */}
              <div className="min-w-0 overflow-hidden flex flex-col justify-center">
                <p className="text-sm font-medium text-gray-900 truncate">{value.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(value.size)}</p>
                {uploading && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    Processando...
                  </p>
                )}
                {!uploading && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                    <Check className="h-3 w-3 shrink-0" />
                    Pronto para envio
                  </p>
                )}
              </div>

              {/* Botões — largura fixa, nunca empurra o nome */}
              <div className="flex items-center gap-0.5 shrink-0">
                {preview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setShowPreviewModal(true)}
                    title="Visualizar"
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
                  title="Remover"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Scanner — renderizado via portal no body para nunca afetar o layout do chat */}
      {showScanner && mounted && createPortal(
        <DocumentScanner
          documentName={documentConfig.name}
          acceptedFormats={documentConfig.acceptedFormats}
          maxSizeMB={documentConfig.maxSizeMB}
          onCapture={handleCameraCapture}
          onCancel={() => setShowScanner(false)}
        />,
        document.body
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
