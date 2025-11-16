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
import { Camera, X, RotateCw, Check, AlertCircle, Loader2, ZoomIn, ZoomOut, Crop, Palette, Edit3, Plus } from 'lucide-react'
import { compressImage, validateFile, formatFileSize } from '@/lib/document-utils'
import { useIsMobile, useHaptics } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import { detectDocument, type DocumentCorners } from '@/lib/document-detection'

type ProcessingMode = 'color' | 'grayscale' | 'blackwhite'
type EditMode = 'filters' | 'crop' | null

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
  const [draggingCorner, setDraggingCorner] = useState<'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft' | null>(null)
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [detectedCorners, setDetectedCorners] = useState<DocumentCorners | null>(null)
  const [autoDetecting, setAutoDetecting] = useState(false)
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0)

  // Hooks mobile
  const isMobile = useIsMobile()
  const { vibrate } = useHaptics()

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
   * Detecta automaticamente as bordas do documento
   */
  const autoDetectDocument = useCallback(async () => {
    if (!canvasRef.current) {
      console.warn('[AutoDetect] Canvas não disponível')
      return
    }

    console.log('[AutoDetect] Iniciando detecção automática...')
    setAutoDetecting(true)
    setDetectedCorners(null) // Limpar detecção anterior

    try {
      const result = await detectDocument(canvasRef.current)

      console.log('[AutoDetect] Resultado da detecção:', result)

      if (result.success && result.corners) {
        console.log('[AutoDetect] Documento detectado com sucesso!', {
          corners: result.corners,
          confidence: result.confidence
        })

        setDetectedCorners(result.corners)
        setDetectionConfidence(result.confidence)

        // Converter corners para cropArea
        const minX = Math.min(
          result.corners.topLeft.x,
          result.corners.topRight.x,
          result.corners.bottomLeft.x,
          result.corners.bottomRight.x
        )
        const maxX = Math.max(
          result.corners.topLeft.x,
          result.corners.topRight.x,
          result.corners.bottomLeft.x,
          result.corners.bottomRight.x
        )
        const minY = Math.min(
          result.corners.topLeft.y,
          result.corners.topRight.y,
          result.corners.bottomLeft.y,
          result.corners.bottomRight.y
        )
        const maxY = Math.max(
          result.corners.topLeft.y,
          result.corners.topRight.y,
          result.corners.bottomLeft.y,
          result.corners.bottomRight.y
        )

        const detectedCropArea = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        }

        console.log('[AutoDetect] Área de recorte calculada:', detectedCropArea)
        setCropArea(detectedCropArea)

        // Mostrar mensagem de sucesso com vibração
        if (isMobile) {
          vibrate(100)
        }
      } else {
        console.warn('[AutoDetect] Detecção falhou, usando imagem completa:', result.error)

        // Fallback para imagem completa
        setCropArea({
          x: 0,
          y: 0,
          width: canvasRef.current.width,
          height: canvasRef.current.height
        })
      }
    } catch (err) {
      console.error('[AutoDetect] Erro na detecção automática:', err)

      // Fallback para imagem completa
      if (canvasRef.current) {
        setCropArea({
          x: 0,
          y: 0,
          width: canvasRef.current.width,
          height: canvasRef.current.height
        })
      }
    } finally {
      setAutoDetecting(false)
      console.log('[AutoDetect] Detecção finalizada')
    }
  }, [isMobile, vibrate])

  /**
   * Captura foto
   */
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    // Feedback háptico em mobile
    if (isMobile) {
      vibrate(50)
    }

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

    stopCamera()

    // Executar detecção automática após um pequeno delay
    setTimeout(() => {
      autoDetectDocument()
    }, 100)
  }, [stopCamera, zoom, isMobile, vibrate, autoDetectDocument])

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
   * Verifica se o ponto está próximo de um canto (handle)
   */
  const getCornerAtPoint = useCallback((x: number, y: number): 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft' | null => {
    if (!cropArea) return null

    const handleRadius = 30 // Área de toque maior para mobile
    const corners = {
      topLeft: { x: cropArea.x, y: cropArea.y },
      topRight: { x: cropArea.x + cropArea.width, y: cropArea.y },
      bottomRight: { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
      bottomLeft: { x: cropArea.x, y: cropArea.y + cropArea.height }
    }

    for (const [name, corner] of Object.entries(corners)) {
      const distance = Math.sqrt(Math.pow(x - corner.x, 2) + Math.pow(y - corner.y, 2))
      if (distance <= handleRadius) {
        return name as 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'
      }
    }

    return null
  }, [cropArea])

  /**
   * Manipuladores de crop (recorte) - Mouse
   */
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showCropTool || !cropCanvasRef.current || !cropArea) {
      console.log('[MouseDown] Condições não atendidas:', {
        showCropTool,
        cropCanvasRef: !!cropCanvasRef.current,
        cropArea: !!cropArea
      })
      return
    }

    const canvas = cropCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    console.log('[MouseDown] Ponto clicado:', { x, y, scaleX, scaleY })

    const corner = getCornerAtPoint(x, y)

    console.log('[MouseDown] Canto detectado:', corner)

    if (corner) {
      setDraggingCorner(corner)
      setIsDragging(true)
      if (isMobile) vibrate(20)
      console.log('[MouseDown] Drag iniciado no canto:', corner)
    } else {
      console.log('[MouseDown] Nenhum canto encontrado no ponto')
    }
  }, [showCropTool, cropArea, getCornerAtPoint, isMobile, vibrate])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggingCorner || !cropCanvasRef.current || !cropArea) return

    const canvas = cropCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = Math.max(0, Math.min((e.clientX - rect.left) * scaleX, canvas.width))
    const y = Math.max(0, Math.min((e.clientY - rect.top) * scaleY, canvas.height))

    // Atualizar área baseado no canto sendo arrastado
    const newCropArea = { ...cropArea }

    switch (draggingCorner) {
      case 'topLeft':
        newCropArea.width = cropArea.x + cropArea.width - x
        newCropArea.height = cropArea.y + cropArea.height - y
        newCropArea.x = x
        newCropArea.y = y
        break
      case 'topRight':
        newCropArea.width = x - cropArea.x
        newCropArea.height = cropArea.y + cropArea.height - y
        newCropArea.y = y
        break
      case 'bottomRight':
        newCropArea.width = x - cropArea.x
        newCropArea.height = y - cropArea.y
        break
      case 'bottomLeft':
        newCropArea.width = cropArea.x + cropArea.width - x
        newCropArea.height = y - cropArea.y
        newCropArea.x = x
        break
    }

    // Validar dimensões mínimas
    if (newCropArea.width > 50 && newCropArea.height > 50) {
      setCropArea(newCropArea)
    }
  }, [isDragging, draggingCorner, cropArea])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggingCorner(null)
  }, [])

  /**
   * Manipuladores de crop (recorte) - Touch (móveis/tablets)
   */
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!showCropTool || !cropCanvasRef.current || !cropArea) {
      console.log('[TouchStart] Condições não atendidas:', {
        showCropTool,
        cropCanvasRef: !!cropCanvasRef.current,
        cropArea: !!cropArea
      })
      return
    }
    e.preventDefault()

    const canvas = cropCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const touch = e.touches[0]
    const x = (touch.clientX - rect.left) * scaleX
    const y = (touch.clientY - rect.top) * scaleY

    console.log('[TouchStart] Ponto tocado:', { x, y, scaleX, scaleY })

    const corner = getCornerAtPoint(x, y)

    console.log('[TouchStart] Canto detectado:', corner)

    if (corner) {
      setDraggingCorner(corner)
      setIsDragging(true)
      if (isMobile) vibrate(20)
      console.log('[TouchStart] Drag iniciado no canto:', corner)
    } else {
      console.log('[TouchStart] Nenhum canto encontrado no ponto')
    }
  }, [showCropTool, cropArea, getCornerAtPoint, isMobile, vibrate])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggingCorner || !cropCanvasRef.current || !cropArea) return
    e.preventDefault()

    const canvas = cropCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const touch = e.touches[0]
    const x = Math.max(0, Math.min((touch.clientX - rect.left) * scaleX, canvas.width))
    const y = Math.max(0, Math.min((touch.clientY - rect.top) * scaleY, canvas.height))

    // Atualizar área baseado no canto sendo arrastado
    const newCropArea = { ...cropArea }

    switch (draggingCorner) {
      case 'topLeft':
        newCropArea.width = cropArea.x + cropArea.width - x
        newCropArea.height = cropArea.y + cropArea.height - y
        newCropArea.x = x
        newCropArea.y = y
        break
      case 'topRight':
        newCropArea.width = x - cropArea.x
        newCropArea.height = cropArea.y + cropArea.height - y
        newCropArea.y = y
        break
      case 'bottomRight':
        newCropArea.width = x - cropArea.x
        newCropArea.height = y - cropArea.y
        break
      case 'bottomLeft':
        newCropArea.width = cropArea.x + cropArea.width - x
        newCropArea.height = y - cropArea.y
        newCropArea.x = x
        break
    }

    // Validar dimensões mínimas
    if (newCropArea.width > 50 && newCropArea.height > 50) {
      setCropArea(newCropArea)
    }
  }, [isDragging, draggingCorner, cropArea])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setDraggingCorner(null)
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
   * Desenha imagem no canvas de crop com área selecionada e handles
   */
  useEffect(() => {
    if (!capturedImage || !showCropTool || !cropCanvasRef.current) {
      console.log('[CropCanvas] Condições não atendidas:', {
        capturedImage: !!capturedImage,
        showCropTool,
        cropCanvasRef: !!cropCanvasRef.current
      })
      return
    }

    console.log('[CropCanvas] Renderizando canvas de crop com area:', cropArea)

    const img = new Image()
    img.onload = () => {
      const canvas = cropCanvasRef.current
      if (!canvas) return

      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Desenhar imagem
      ctx.drawImage(img, 0, 0)

      // Desenhar área de seleção se existir
      if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
        console.log('[CropCanvas] Desenhando area de crop:', cropArea)
        // Overlay escuro fora da área selecionada
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(0, 0, canvas.width, cropArea.y)
        ctx.fillRect(0, cropArea.y, cropArea.x, cropArea.height)
        ctx.fillRect(cropArea.x + cropArea.width, cropArea.y, canvas.width - cropArea.x - cropArea.width, cropArea.height)
        ctx.fillRect(0, cropArea.y + cropArea.height, canvas.width, canvas.height - cropArea.y - cropArea.height)

        // Borda da área selecionada
        ctx.strokeStyle = '#10b981' // Verde
        ctx.lineWidth = 3
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)

        // Desenhar cantos (handles) para ajuste
        const handleSize = 24
        const handles = [
          { x: cropArea.x, y: cropArea.y }, // Top-left
          { x: cropArea.x + cropArea.width, y: cropArea.y }, // Top-right
          { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height }, // Bottom-right
          { x: cropArea.x, y: cropArea.y + cropArea.height }, // Bottom-left
        ]

        handles.forEach(handle => {
          // Círculo branco com borda verde
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2)
          ctx.fill()

          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2)
          ctx.stroke()
        })

        // Grade (linhas de terço) para ajudar no enquadramento
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 1

        // Linhas verticais
        ctx.beginPath()
        ctx.moveTo(cropArea.x + cropArea.width / 3, cropArea.y)
        ctx.lineTo(cropArea.x + cropArea.width / 3, cropArea.y + cropArea.height)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(cropArea.x + (cropArea.width * 2) / 3, cropArea.y)
        ctx.lineTo(cropArea.x + (cropArea.width * 2) / 3, cropArea.y + cropArea.height)
        ctx.stroke()

        // Linhas horizontais
        ctx.beginPath()
        ctx.moveTo(cropArea.x, cropArea.y + cropArea.height / 3)
        ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + cropArea.height / 3)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(cropArea.x, cropArea.y + (cropArea.height * 2) / 3)
        ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + (cropArea.height * 2) / 3)
        ctx.stroke()
      }
    }
    img.src = capturedImage
  }, [capturedImage, showCropTool, cropArea])

  /**
   * Atualiza preview com modo de processamento
   */
  useEffect(() => {
    if (!capturedImage || !cropArea) return
    // Só atualiza preview quando NÃO está no modo de crop ativo
    if (editMode === 'crop' && showCropTool) return

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
  }, [capturedImage, cropArea, processingMode, applyProcessingMode, showCropTool, editMode])

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

  // Esconder menu inferior em mobile quando scanner está ativo
  useEffect(() => {
    if (isMobile) {
      // Adicionar classe ao body para esconder overflow e menu inferior
      document.body.style.overflow = 'hidden'

      // Esconder menu inferior especificamente
      const bottomNav = document.querySelector('nav[class*="bottom-0"]')
      if (bottomNav instanceof HTMLElement) {
        bottomNav.style.display = 'none'
      }

      return () => {
        // Restaurar ao desmontar
        document.body.style.overflow = ''
        if (bottomNav instanceof HTMLElement) {
          bottomNav.style.display = ''
        }
      }
    }
  }, [isMobile])

  // Ativar showCropTool automaticamente quando entrar no modo crop
  useEffect(() => {
    if (editMode === 'crop') {
      setShowCropTool(true)
    } else if (editMode === 'filters') {
      setShowCropTool(false)
    }
  }, [editMode])

  // Interface Mobile Full-Screen
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[60] bg-black">
        {/* Header Mobile */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between p-4">
            <div className="text-white">
              <h3 className="text-sm font-semibold">{documentName}</h3>
              <p className="text-xs text-gray-300">
                {!capturedImage ? 'Posicione o documento' : editMode ? 'Editar documento' : 'Revisar captura'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-white hover:bg-white/20 h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Área de Captura/Preview - Full Screen */}
        <div className="absolute inset-0">
          {!capturedImage ? (
            <>
              {/* Vídeo da Câmera */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: `scale(${zoom})`
                }}
              />

              {/* Overlay com Guia do Documento */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Área escura ao redor */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Moldura do Documento */}
                <div
                  className="relative z-10 border-4 border-white/90 rounded-lg"
                  style={{
                    width: '85%',
                    maxWidth: '500px',
                    aspectRatio: '1.5',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
                  }}
                >
                  {/* Cantos Decorativos */}
                  <div className="absolute -top-1 -left-1 w-10 h-10 border-t-[5px] border-l-[5px] border-green-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-10 h-10 border-t-[5px] border-r-[5px] border-green-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-[5px] border-l-[5px] border-green-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-[5px] border-r-[5px] border-green-400 rounded-br-lg" />

                  {/* Instrução Central */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
                      <p className="text-white text-sm font-medium text-center">
                        Alinhe o documento<br />dentro da moldura
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controles de Zoom */}
              <div className="absolute top-20 right-4 z-20 flex flex-col gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 w-12 p-0 bg-white/90 hover:bg-white rounded-full shadow-lg"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-6 w-6" />
                </Button>
                <div className="bg-white/90 rounded-full px-3 py-1 text-sm font-semibold text-center shadow-lg">
                  {zoom.toFixed(1)}x
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 w-12 p-0 bg-white/90 hover:bg-white rounded-full shadow-lg"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                >
                  <ZoomOut className="h-6 w-6" />
                </Button>
              </div>

              {/* Botão Alternar Câmera */}
              <div className="absolute top-20 left-4 z-20">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 w-12 p-0 bg-white/90 hover:bg-white rounded-full shadow-lg"
                  onClick={switchCamera}
                >
                  <RotateCw className="h-6 w-6" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Preview da Foto Capturada */}
              {!editMode ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <canvas
                    ref={previewCanvasRef}
                    className="max-w-full max-h-full object-contain"
                  />

                  {/* Indicador de Detecção Automática */}
                  {autoDetecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-sm font-medium text-gray-900">Detectando documento...</p>
                      </div>
                    </div>
                  )}

                  {/* Indicador de Sucesso da Detecção */}
                  {detectedCorners && !autoDetecting && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                      <Check className="h-4 w-4 text-white" />
                      <p className="text-sm font-medium text-white">
                        Documento detectado! ({Math.round(detectionConfidence)}% confiança)
                      </p>
                    </div>
                  )}
                </div>
              ) : editMode === 'crop' ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <canvas
                    ref={cropCanvasRef}
                    className="cursor-crosshair touch-none"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      display: 'block'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                  />

                  {/* Instrução de Recorte */}
                  <div className="absolute bottom-32 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-white text-sm text-center font-medium">
                      Arraste os círculos nos cantos para ajustar a área
                    </p>
                    <p className="text-white/70 text-xs text-center mt-1">
                      Use a grade como guia de enquadramento
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <canvas
                    ref={previewCanvasRef}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Erro */}
        {error && (
          <div className="absolute top-20 left-4 right-4 z-30">
            <div className="bg-red-500/95 backdrop-blur-sm rounded-lg p-4 flex items-start gap-3 text-white shadow-xl">
              <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Controles Inferiores */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pb-8 pt-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          {!capturedImage ? (
            /* Modo Captura */
            <div className="flex items-center justify-center">
              <Button
                size="lg"
                onClick={capturePhoto}
                disabled={processing || !isCameraReady}
                className="h-20 w-20 p-0 bg-white hover:bg-gray-200 rounded-full shadow-2xl"
              >
                <Camera className="h-10 w-10 text-black" />
              </Button>
            </div>
          ) : !editMode ? (
            /* Modo Preview - Ações Principais */
            <div className="px-4 space-y-3">
              {/* Botões de Ação Principal */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  disabled={processing}
                  className="flex-1 h-14 text-base bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <RotateCw className="h-5 w-5 mr-2" />
                  Tirar Novamente
                </Button>
                <Button
                  onClick={confirmPhoto}
                  disabled={processing}
                  className="flex-1 h-14 text-base bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
              </div>

              {/* Botão Redetectar */}
              <Button
                variant="outline"
                onClick={autoDetectDocument}
                disabled={processing || autoDetecting}
                className="w-full h-12 text-base bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                {autoDetecting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Detectando...
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 mr-2" />
                    Redetectar Documento
                  </>
                )}
              </Button>

              {/* Botão Editar */}
              <Button
                variant="outline"
                onClick={() => setEditMode('filters')}
                disabled={processing}
                className="w-full h-12 text-base bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Edit3 className="h-5 w-5 mr-2" />
                Editar (Filtros e Recorte)
              </Button>
            </div>
          ) : (
            /* Modo Edição */
            <div className="px-4 space-y-4">
              {/* Abas de Edição */}
              <div className="flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-1">
                <Button
                  variant={editMode === 'filters' ? 'default' : 'ghost'}
                  onClick={() => setEditMode('filters')}
                  className={cn(
                    'flex-1 h-12',
                    editMode === 'filters'
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'text-white hover:bg-white/20'
                  )}
                >
                  <Palette className="h-5 w-5 mr-2" />
                  Filtros
                </Button>
                <Button
                  variant={editMode === 'crop' ? 'default' : 'ghost'}
                  onClick={() => setEditMode('crop')}
                  className={cn(
                    'flex-1 h-12',
                    editMode === 'crop'
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'text-white hover:bg-white/20'
                  )}
                >
                  <Crop className="h-5 w-5 mr-2" />
                  Recorte
                </Button>
              </div>

              {/* Conteúdo da Aba Atual */}
              {editMode === 'filters' && (
                <div className="flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                  <Button
                    size="lg"
                    variant={processingMode === 'color' ? 'default' : 'outline'}
                    onClick={() => setProcessingMode('color')}
                    className={cn(
                      'flex-1 h-12',
                      processingMode === 'color'
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    )}
                  >
                    Colorido
                  </Button>
                  <Button
                    size="lg"
                    variant={processingMode === 'grayscale' ? 'default' : 'outline'}
                    onClick={() => setProcessingMode('grayscale')}
                    className={cn(
                      'flex-1 h-12',
                      processingMode === 'grayscale'
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    )}
                  >
                    Cinza
                  </Button>
                  <Button
                    size="lg"
                    variant={processingMode === 'blackwhite' ? 'default' : 'outline'}
                    onClick={() => setProcessingMode('blackwhite')}
                    className={cn(
                      'flex-1 h-12',
                      processingMode === 'blackwhite'
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    )}
                  >
                    P&B
                  </Button>
                </div>
              )}

              {editMode === 'crop' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetCrop}
                    className="w-full h-12 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    Resetar Área
                  </Button>
                </div>
              )}

              {/* Botão Concluir Edição */}
              <Button
                onClick={() => setEditMode(null)}
                className="w-full h-12 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-5 w-5 mr-2" />
                Concluir Edição
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Interface Desktop (Original)
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
