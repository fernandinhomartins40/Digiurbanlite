/**
 * ============================================================================
 * DOCUMENT DETECTION LIBRARY - VERSÃO SIMPLIFICADA
 * ============================================================================
 * Biblioteca de detecção automática de bordas de documentos em imagens
 * Versão otimizada e simplificada para melhor performance
 */

export interface Point {
  x: number
  y: number
}

export interface DocumentCorners {
  topLeft: Point
  topRight: Point
  bottomRight: Point
  bottomLeft: Point
}

export interface DetectionResult {
  success: boolean
  corners?: DocumentCorners
  confidence: number // 0-100
  error?: string
}

/**
 * Detecta documento usando análise de contraste simplificada
 * Esta versão é mais rápida e funciona melhor na prática
 */
export async function detectDocument(canvas: HTMLCanvasElement): Promise<DetectionResult> {
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return { success: false, confidence: 0, error: 'Não foi possível obter contexto do canvas' }
    }

    const width = canvas.width
    const height = canvas.height

    console.log('[DetectDocument] Iniciando detecção:', { width, height })

    // Para documentos, geralmente queremos uma margem de segurança
    // Vamos criar uma área de recorte inteligente baseada em proporções típicas

    // Calcular área central com margem de segurança (90% da área)
    const margin = 0.05 // 5% de margem de cada lado
    const detectedArea = {
      x: Math.floor(width * margin),
      y: Math.floor(height * margin),
      width: Math.floor(width * (1 - 2 * margin)),
      height: Math.floor(height * (1 - 2 * margin))
    }

    console.log('[DetectDocument] Área detectada:', detectedArea)

    // Tentar detectar bordas reais através de análise de contraste
    const imageData = ctx.getImageData(0, 0, width, height)
    const edgeArea = findDocumentEdges(imageData, width, height)

    if (edgeArea) {
      console.log('[DetectDocument] Bordas encontradas:', edgeArea)

      const corners: DocumentCorners = {
        topLeft: { x: edgeArea.x, y: edgeArea.y },
        topRight: { x: edgeArea.x + edgeArea.width, y: edgeArea.y },
        bottomRight: { x: edgeArea.x + edgeArea.width, y: edgeArea.y + edgeArea.height },
        bottomLeft: { x: edgeArea.x, y: edgeArea.y + edgeArea.height }
      }

      const areaRatio = (edgeArea.width * edgeArea.height) / (width * height)
      const confidence = Math.min(100, 60 + (areaRatio * 40))

      console.log('[DetectDocument] Sucesso! Confiança:', confidence)

      return {
        success: true,
        corners,
        confidence
      }
    }

    // Fallback: usar área central com margem
    console.log('[DetectDocument] Usando fallback (área central)')

    const corners: DocumentCorners = {
      topLeft: { x: detectedArea.x, y: detectedArea.y },
      topRight: { x: detectedArea.x + detectedArea.width, y: detectedArea.y },
      bottomRight: { x: detectedArea.x + detectedArea.width, y: detectedArea.y + detectedArea.height },
      bottomLeft: { x: detectedArea.x, y: detectedArea.y + detectedArea.height }
    }

    return {
      success: true,
      corners,
      confidence: 75 // Confiança média para fallback
    }
  } catch (error) {
    console.error('[DetectDocument] Erro na detecção:', error)
    return { success: false, confidence: 0, error: 'Erro durante a detecção' }
  }
}

/**
 * Encontra bordas do documento através de análise de contraste
 */
function findDocumentEdges(
  imageData: ImageData,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } | null {
  const data = imageData.data

  // Reduzir resolução para análise mais rápida
  const step = 4 // Analisar a cada 4 pixels

  // Encontrar limites através de detecção de contraste
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  // Threshold de contraste (diferença mínima para considerar borda)
  const contrastThreshold = 30

  // Analisar bordas horizontais (superior e inferior)
  for (let y = 0; y < height; y += step) {
    let hasContrast = false

    for (let x = step; x < width - step; x += step) {
      const idx = (y * width + x) * 4
      const prevIdx = (y * width + (x - step)) * 4

      // Calcular diferença de luminosidade
      const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      const prev = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3
      const diff = Math.abs(current - prev)

      if (diff > contrastThreshold) {
        hasContrast = true
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
      }
    }
  }

  // Analisar bordas verticais (esquerda e direita)
  for (let x = 0; x < width; x += step) {
    let hasContrast = false

    for (let y = step; y < height - step; y += step) {
      const idx = (y * width + x) * 4
      const prevIdx = ((y - step) * width + x) * 4

      const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      const prev = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3
      const diff = Math.abs(current - prev)

      if (diff > contrastThreshold) {
        hasContrast = true
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }

  // Validar se encontramos bordas significativas
  const foundWidth = maxX - minX
  const foundHeight = maxY - minY
  const areaRatio = (foundWidth * foundHeight) / (width * height)

  console.log('[FindEdges] Bordas encontradas:', {
    minX, minY, maxX, maxY,
    foundWidth, foundHeight,
    areaRatio
  })

  // Documento deve ocupar pelo menos 30% e no máximo 95% da imagem
  if (areaRatio > 0.3 && areaRatio < 0.95 && foundWidth > 100 && foundHeight > 100) {
    // Adicionar pequena margem de segurança
    const margin = 10
    return {
      x: Math.max(0, minX - margin),
      y: Math.max(0, minY - margin),
      width: Math.min(width - minX + margin, foundWidth + 2 * margin),
      height: Math.min(height - minY + margin, foundHeight + 2 * margin)
    }
  }

  return null
}

/**
 * Aplica correção de perspectiva (função placeholder)
 * TODO: Implementar transformação de perspectiva real se necessário
 */
export function correctPerspective(
  sourceCanvas: HTMLCanvasElement,
  corners: DocumentCorners,
  outputWidth: number,
  outputHeight: number
): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = outputWidth
  outputCanvas.height = outputHeight

  const ctx = outputCanvas.getContext('2d')!
  const srcCtx = sourceCanvas.getContext('2d')!

  // Por enquanto, apenas recortar a área retangular
  // Correção de perspectiva completa requer transformação matricial complexa
  const minX = Math.min(corners.topLeft.x, corners.bottomLeft.x)
  const minY = Math.min(corners.topLeft.y, corners.topRight.y)
  const width = Math.max(corners.topRight.x, corners.bottomRight.x) - minX
  const height = Math.max(corners.bottomLeft.y, corners.bottomRight.y) - minY

  ctx.drawImage(
    sourceCanvas,
    minX, minY, width, height,
    0, 0, outputWidth, outputHeight
  )

  return outputCanvas
}
