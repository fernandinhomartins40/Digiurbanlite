'use client'

/**
 * ============================================================================
 * DOCUMENT SCANNER COMPONENT
 * ============================================================================
 * Componente moderno de digitalização de documentos com câmera
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Camera, X, RotateCw, Check, AlertCircle, Loader2, ZoomIn, ZoomOut, Crop, Palette } from 'lucide-react'
import { compressImage, validateFile, formatFileSize } from '@/lib/document-utils'

type ProcessingMode = 'color' | 'grayscale' | 'blackwhite'

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface DocumentScannerProps {
  documentName: string
  acceptedFormats: string[]
  maxSizeMB: number
  onCapture: (file: File) => void
  onCancel: () => void
}

export function DocumentScanner({
  documentName,
  acceptedFormats,
  maxSizeMB,
  onCapture,
  onCancel
}: DocumentScannerProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [zoom, setZoom] = useState(1)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('color')
  const [showCropTool, setShowCropTool] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  /**
   * Inicia a câmera
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setIsCameraReady(false)

      // Verificar suporte do navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Seu navegador não suporta acesso à câmera.')
        return
      }

      // Tentar diferentes configurações para compatibilidade
      let mediaStream: MediaStream | null = null

      try {
        // Primeira tentativa: com facingMode e resolução
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 }
          },
          audio: false
        })
      } catch (firstError) {
        console.warn('Tentativa 1 falhou, tentando fallback:', firstError)

        try {
          // Segunda tentativa: apenas facingMode
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
          })
        } catch (secondError) {
          console.warn('Tentativa 2 falhou, tentando fallback básico:', secondError)

          // Terceira tentativa: vídeo genérico
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          })
        }
      }

      if (!mediaStream) {
        throw new Error('Não foi possível obter acesso à câmera')
      }

      streamRef.current = mediaStream

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream

        // Configurações para iOS
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.setAttribute('webkit-playsinline', 'true')
        videoRef.current.muted = true

        // Aguardar vídeo carregar
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => {
                setIsCameraReady(true)
                resolve()
              }).catch(() => resolve())
            }
          } else {
            resolve()
          }
        })
      }
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err)

      let errorMessage = 'Não foi possível acessar a câmera.'

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permissão negada. Permita o acesso à câmera nas configurações.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada no dispositivo.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'A câmera está sendo usada por outro aplicativo.'
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Acesso bloqueado. Certifique-se de usar HTTPS.'
      }

      setError(errorMessage)
    }
  }, [facingMode])

  /**
   * Para a câmera
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraReady(false)
  }, [])

  /**
   * Processa imagem com efeito de cor, escala de cinza ou preto e branco
   */
  const applyProcessingMode = useCallback((canvas: HTMLCanvasElement, mode: ProcessingMode) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    if (mode === 'grayscale') {
      // Escala de cinza
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        data[i] = gray
        data[i + 1] = gray
        data[i + 2] = gray
      }
    } else if (mode === 'blackwhite') {
      // Preto e branco com contraste
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

        // Aumentar contraste
        const contrast = 1.5
        const brightness = 20
        let adjusted = (gray - 128) * contrast + 128 + brightness

        // Threshold para preto ou branco
        const threshold = 140
        adjusted = adjusted < threshold ? 0 : 255

        data[i] = adjusted
        data[i + 1] = adjusted
        data[i + 2] = adjusted
      }
    }
    // mode === 'color' não precisa de processamento

    ctx.putImageData(imageData, 0, 0)
  }, [])

  /**
   * Captura foto
   */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Configurar canvas com dimensões do vídeo
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Desenhar frame atual no canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Aplicar zoom se configurado
    if (zoom !== 1) {
      const scaledWidth = video.videoWidth / zoom
      const scaledHeight = video.videoHeight / zoom
      const x = (video.videoWidth - scaledWidth) / 2
      const y = (video.videoHeight - scaledHeight) / 2

      ctx.drawImage(video, x, y, scaledWidth, scaledHeight, 0, 0, canvas.width, canvas.height)
    } else {
      ctx.drawImage(video, 0, 0)
    }

    // Converter para imagem
    const imageData = canvas.toDataURL('image/jpeg', 0.95)
    setCapturedImage(imageData)

    // Inicializar área de corte com imagem completa
    setCropArea({
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height
    })

    stopCamera()
  }, [stopCamera, zoom])

  /**
   * Retira nova foto
   */
  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    setCropArea(null)
    setShowCropTool(false)
    setProcessingMode('color')
    startCamera()
  }, [startCamera])

  /**
   * Manipuladores de crop (recorte) - Mouse
   */
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showCropTool || !cropCanvasRef.current) return

    const canvas = cropCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setIsDragging(true)
    setDragStart({ x, y })
    setCropArea({ x, y, width: 0, height: 0 })
  }, [showCropTool])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !cropCanvasRef.current) return

    const canvas = cropCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const width = x - dragStart.x
    const height = y - dragStart.y

    setCropArea({
      x: width < 0 ? x : dragStart.x,
      y: height < 0 ? y : dragStart.y,
      width: Math.abs(width),
      height: Math.abs(height)
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragStart(null)
  }, [])

  /**
   * Manipuladores de crop (recorte) - Touch (móveis/tablets)
   */
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!showCropTool || !cropCanvasRef.current) return
    e.preventDefault()

    const canvas = cropCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const touch = e.touches[0]
    const x = (touch.clientX - rect.left) * scaleX
    const y = (touch.clientY - rect.top) * scaleY

    setIsDragging(true)
    setDragStart({ x, y })
    setCropArea({ x, y, width: 0, height: 0 })
  }, [showCropTool])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !cropCanvasRef.current) return
    e.preventDefault()

    const canvas = cropCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const touch = e.touches[0]
    const x = (touch.clientX - rect.left) * scaleX
    const y = (touch.clientY - rect.top) * scaleY

    const width = x - dragStart.x
    const height = y - dragStart.y

    setCropArea({
      x: width < 0 ? x : dragStart.x,
      y: height < 0 ? y : dragStart.y,
      width: Math.abs(width),
      height: Math.abs(height)
    })
  }, [isDragging, dragStart])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setDragStart(null)
  }, [])

  const resetCrop = useCallback(() => {
    if (canvasRef.current) {
      setCropArea({
        x: 0,
        y: 0,
        width: canvasRef.current.width,
        height: canvasRef.current.height
      })
    }
  }, [])

  /**
   * Desenha imagem no canvas de crop
   */
  useEffect(() => {
    if (!capturedImage || !showCropTool || !cropCanvasRef.current) return

    const img = new Image()
    img.onload = () => {
      const canvas = cropCanvasRef.current
      if (!canvas) return

      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0)

      // Desenhar área de seleção se existir
      if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 3
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)

        // Overlay escuro fora da área selecionada
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(0, 0, canvas.width, cropArea.y)
        ctx.fillRect(0, cropArea.y, cropArea.x, cropArea.height)
        ctx.fillRect(cropArea.x + cropArea.width, cropArea.y, canvas.width - cropArea.x - cropArea.width, cropArea.height)
        ctx.fillRect(0, cropArea.y + cropArea.height, canvas.width, canvas.height - cropArea.y - cropArea.height)
      }
    }
    img.src = capturedImage
  }, [capturedImage, showCropTool, cropArea])

  /**
   * Atualiza preview com modo de processamento
   */
  useEffect(() => {
    if (!capturedImage || !cropArea || showCropTool) return

    const updatePreview = () => {
      const canvas = previewCanvasRef.current
      if (!canvas) return

      canvas.width = cropArea.width
      canvas.height = cropArea.height

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Desenhar área recortada
        ctx.drawImage(
          img,
          cropArea.x, cropArea.y, cropArea.width, cropArea.height,
          0, 0, cropArea.width, cropArea.height
        )

        // Aplicar processamento
        applyProcessingMode(canvas, processingMode)
      }
      img.src = capturedImage
    }

    updatePreview()
    const timeout = setTimeout(updatePreview, 100)

    return () => clearTimeout(timeout)
  }, [capturedImage, cropArea, processingMode, applyProcessingMode, showCropTool])

  /**
   * Confirma e processa foto
   */
  const confirmPhoto = useCallback(async () => {
    if (!previewCanvasRef.current) return

    setProcessing(true)
    setError(null)

    try {
      // Obter imagem processada do canvas de preview
      const canvas = previewCanvasRef.current

      // Converter canvas para blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error('Erro ao converter canvas'))
        }, 'image/jpeg', 0.95)
      })

      const timestamp = Date.now()
      let file = new File([blob], `${documentName}_${timestamp}.jpg`, { type: 'image/jpeg' })

      // Validar arquivo
      const validation = validateFile(file, {
        name: documentName,
        required: true,
        acceptedFormats,
        maxSizeMB,
        allowCameraUpload: true
      })

      if (!validation.valid) {
        setError(validation.error || 'Arquivo inválido')
        return
      }

      // Comprimir se necessário
      if (file.size > maxSizeMB * 1024 * 1024) {
        file = await compressImage(file, maxSizeMB, 0.8)
      }

      onCapture(file)
    } catch (err) {
      console.error('Erro ao processar foto:', err)
      setError('Erro ao processar a foto. Tente novamente.')
    } finally {
      setProcessing(false)
    }
  }, [documentName, acceptedFormats, maxSizeMB, onCapture])

  /**
   * Alterna câmera (frontal/traseira)
   */
  const switchCamera = useCallback(() => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [stopCamera])

  /**
   * Controle de zoom
   */
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1))

  // Iniciar câmera ao montar componente
  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualizar câmera quando facingMode mudar
  useEffect(() => {
    if (streamRef.current) {
      stopCamera()
      setTimeout(() => {
        startCamera()
      }, 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto">
      <div className="min-h-screen flex items-start sm:items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-4xl my-4 sm:my-auto">
          <Card className="w-full">
            <div className="p-3 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0 mr-2">
              <h3 className="text-base sm:text-lg font-semibold truncate">Digitalizar Documento</h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{documentName}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{error}</span>
            </div>
          )}

          {/* Área de captura */}
          <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden mb-3 sm:mb-4">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${zoom})`
                  }}
                />

                {/* Overlay de guia */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 sm:border-4 border-white/30 border-dashed m-4 sm:m-8 rounded-lg" />
                  <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 text-center text-white text-xs sm:text-sm bg-black/50 py-1 sm:py-2 px-2">
                    Posicione o documento dentro da área marcada
                  </div>
                </div>

                {/* Controles de zoom */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-col gap-1 sm:gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-white/90 hover:bg-white"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-white/90 hover:bg-white"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                  >
                    <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
                {/* Canvas para crop com overlay */}
                {showCropTool ? (
                  <canvas
                    ref={cropCanvasRef}
                    className="cursor-crosshair touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                ) : (
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      display: 'block',
                      objectFit: 'contain'
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Controles de edição após captura */}
          {capturedImage && (
            <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3">
              {/* Seletor de modo de processamento */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <Label className="text-xs sm:text-sm font-medium">Estilo:</Label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={processingMode === 'color' ? 'default' : 'outline'}
                    onClick={() => setProcessingMode('color')}
                    disabled={processing}
                    className="text-xs sm:text-sm"
                  >
                    Colorido
                  </Button>
                  <Button
                    size="sm"
                    variant={processingMode === 'grayscale' ? 'default' : 'outline'}
                    onClick={() => setProcessingMode('grayscale')}
                    disabled={processing}
                    className="text-xs sm:text-sm"
                  >
                    Cinza
                  </Button>
                  <Button
                    size="sm"
                    variant={processingMode === 'blackwhite' ? 'default' : 'outline'}
                    onClick={() => setProcessingMode('blackwhite')}
                    disabled={processing}
                    className="text-xs sm:text-sm"
                  >
                    P&B
                  </Button>
                </div>
              </div>

              {/* Botão de crop */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Crop className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <Label className="text-xs sm:text-sm font-medium">Recortar:</Label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={showCropTool ? 'default' : 'outline'}
                    onClick={() => setShowCropTool(!showCropTool)}
                    disabled={processing}
                    className="text-xs sm:text-sm"
                  >
                    {showCropTool ? 'Aplicar Recorte' : 'Selecionar Área'}
                  </Button>
                  {showCropTool && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={resetCrop}
                      disabled={processing}
                      className="text-xs sm:text-sm"
                    >
                      Resetar
                    </Button>
                  )}
                </div>
              </div>

              {showCropTool && (
                <p className="text-xs text-gray-600">
                  Arraste na imagem para selecionar a área que deseja manter
                </p>
              )}
            </div>
          )}

          {/* Instruções */}
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-1 sm:mb-2">Dicas para melhor digitalização:</h4>
            <ul className="text-xs text-blue-700 space-y-0.5 sm:space-y-1">
              <li>• Certifique-se de que há boa iluminação</li>
              <li>• Evite sombras sobre o documento</li>
              <li>• Mantenha o documento plano e reto</li>
              <li className="hidden sm:list-item">• Capture todo o documento dentro da área marcada</li>
              <li className="hidden sm:list-item">• Use zoom para aproximar se necessário</li>
            </ul>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            {!capturedImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={switchCamera}
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Alternar Câmera</span>
                  <span className="sm:hidden">Alternar</span>
                </Button>
                <Button
                  onClick={capturePhoto}
                  disabled={processing || !isCameraReady}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar Foto
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Tirar Novamente</span>
                  <span className="sm:hidden">Repetir</span>
                </Button>
                <Button
                  onClick={confirmPhoto}
                  disabled={processing}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Informações técnicas */}
          <div className="mt-3 sm:mt-4 text-xs text-gray-500 text-center">
            <span className="hidden sm:inline">Formatos aceitos: {acceptedFormats.map(f => f.toUpperCase()).join(', ')} · </span>
            Tamanho máximo: {maxSizeMB}MB
          </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
