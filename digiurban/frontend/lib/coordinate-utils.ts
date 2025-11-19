/**
 * ============================================================================
 * COORDINATE TRANSFORMATION UTILITIES
 * ============================================================================
 * Utilitários para conversão de coordenadas entre diferentes canvas e viewports
 * Resolve problemas de desalinhamento em sistemas multi-canvas
 */

export interface Point {
  x: number
  y: number
}

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface DocumentCorners {
  topLeft: Point
  topRight: Point
  bottomRight: Point
  bottomLeft: Point
}

/**
 * Converte coordenadas de um canvas para outro
 * Útil para sincronizar diferentes canvas com dimensões diferentes
 */
export function scaleCoordinates(
  coords: CropArea,
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement
): CropArea {
  const scaleX = toCanvas.width / fromCanvas.width
  const scaleY = toCanvas.height / fromCanvas.height

  return {
    x: coords.x * scaleX,
    y: coords.y * scaleY,
    width: coords.width * scaleX,
    height: coords.height * scaleY
  }
}

/**
 * Converte coordenadas de ponto de um canvas para outro
 */
export function scalePoint(
  point: Point,
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement
): Point {
  const scaleX = toCanvas.width / fromCanvas.width
  const scaleY = toCanvas.height / fromCanvas.height

  return {
    x: point.x * scaleX,
    y: point.y * scaleY
  }
}

/**
 * Converte coordenadas de 4 cantos de um canvas para outro
 */
export function scaleCorners(
  corners: DocumentCorners,
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement
): DocumentCorners {
  const scaleX = toCanvas.width / fromCanvas.width
  const scaleY = toCanvas.height / fromCanvas.height

  return {
    topLeft: {
      x: corners.topLeft.x * scaleX,
      y: corners.topLeft.y * scaleY
    },
    topRight: {
      x: corners.topRight.x * scaleX,
      y: corners.topRight.y * scaleY
    },
    bottomRight: {
      x: corners.bottomRight.x * scaleX,
      y: corners.bottomRight.y * scaleY
    },
    bottomLeft: {
      x: corners.bottomLeft.x * scaleX,
      y: corners.bottomLeft.y * scaleY
    }
  }
}

/**
 * Converte coordenadas do canvas para coordenadas do DOM (viewport)
 * Essencial para eventos de mouse/touch que usam coordenadas de tela
 */
export function canvasToViewportCoords(
  canvasX: number,
  canvasY: number,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect()
  const scaleX = rect.width / canvas.width
  const scaleY = rect.height / canvas.height

  return {
    x: canvasX * scaleX,
    y: canvasY * scaleY
  }
}

/**
 * Converte coordenadas do DOM (viewport) para coordenadas do canvas
 * Essencial para processar eventos de mouse/touch
 */
export function viewportToCanvasCoords(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  }
}

/**
 * Calcula o fator de escala entre dois canvas
 */
export function getScaleFactor(
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement
): { scaleX: number; scaleY: number } {
  return {
    scaleX: toCanvas.width / fromCanvas.width,
    scaleY: toCanvas.height / fromCanvas.height
  }
}

/**
 * Calcula o fator de escala entre canvas e viewport
 */
export function getCanvasViewportScale(canvas: HTMLCanvasElement): { scaleX: number; scaleY: number } {
  const rect = canvas.getBoundingClientRect()
  return {
    scaleX: canvas.width / rect.width,
    scaleY: canvas.height / rect.height
  }
}

/**
 * Limita área de crop aos limites do canvas
 */
export function clampCropArea(cropArea: CropArea, canvasWidth: number, canvasHeight: number): CropArea {
  const x = Math.max(0, Math.min(cropArea.x, canvasWidth - 1))
  const y = Math.max(0, Math.min(cropArea.y, canvasHeight - 1))
  const width = Math.max(1, Math.min(cropArea.width, canvasWidth - x))
  const height = Math.max(1, Math.min(cropArea.height, canvasHeight - y))

  return { x, y, width, height }
}

/**
 * Limita ponto aos limites do canvas
 */
export function clampPoint(point: Point, canvasWidth: number, canvasHeight: number): Point {
  return {
    x: Math.max(0, Math.min(point.x, canvasWidth - 1)),
    y: Math.max(0, Math.min(point.y, canvasHeight - 1))
  }
}

/**
 * Converte DocumentCorners para CropArea (bounding box)
 * NOTA: Perde informação de perspectiva - use apenas para preview
 */
export function cornersToCropArea(corners: DocumentCorners): CropArea {
  const minX = Math.min(
    corners.topLeft.x,
    corners.topRight.x,
    corners.bottomLeft.x,
    corners.bottomRight.x
  )
  const maxX = Math.max(
    corners.topLeft.x,
    corners.topRight.x,
    corners.bottomLeft.x,
    corners.bottomRight.x
  )
  const minY = Math.min(
    corners.topLeft.y,
    corners.topRight.y,
    corners.bottomLeft.y,
    corners.bottomRight.y
  )
  const maxY = Math.max(
    corners.topLeft.y,
    corners.topRight.y,
    corners.bottomLeft.y,
    corners.bottomRight.y
  )

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Calcula dimensões ideais para canvas considerando viewport em mobile
 */
export function calculateOptimalCanvasSize(
  imageWidth: number,
  imageHeight: number,
  maxViewportWidth: number,
  maxViewportHeight: number,
  isMobile: boolean = false
): { width: number; height: number } {
  // Em mobile, limitar a 95% da viewport para evitar overflow
  const maxWidth = isMobile ? maxViewportWidth * 0.95 : maxViewportWidth
  const maxHeight = isMobile ? maxViewportHeight * 0.95 : maxViewportHeight

  // Manter aspect ratio
  const aspectRatio = imageWidth / imageHeight

  let width = imageWidth
  let height = imageHeight

  // Redimensionar se necessário
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return {
    width: Math.floor(width),
    height: Math.floor(height)
  }
}

/**
 * Calcula tamanho de handle baseado em device (mobile = maior)
 */
export function getHandleSize(isMobile: boolean = false): {
  radius: number
  touchRadius: number
  visualRadius: number
} {
  if (isMobile) {
    return {
      radius: 48, // Área de toque (acessibilidade)
      touchRadius: 48,
      visualRadius: 32 // Tamanho visual do círculo
    }
  }

  return {
    radius: 30,
    touchRadius: 30,
    visualRadius: 24
  }
}

/**
 * Verifica se um ponto está dentro de um círculo (handle)
 */
export function isPointInCircle(
  pointX: number,
  pointY: number,
  circleX: number,
  circleY: number,
  radius: number
): boolean {
  const distance = Math.sqrt(
    Math.pow(pointX - circleX, 2) + Math.pow(pointY - circleY, 2)
  )
  return distance <= radius
}

/**
 * Calcula distância entre dois pontos
 */
export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/**
 * Detecta qual canto está mais próximo de um ponto
 */
export function getClosestCorner(
  point: Point,
  corners: DocumentCorners,
  maxDistance: number = Infinity
): 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft' | null {
  const distances = {
    topLeft: getDistance(point, corners.topLeft),
    topRight: getDistance(point, corners.topRight),
    bottomRight: getDistance(point, corners.bottomRight),
    bottomLeft: getDistance(point, corners.bottomLeft)
  }

  let closestCorner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft' | null = null
  let minDistance = maxDistance

  for (const [corner, distance] of Object.entries(distances)) {
    if (distance < minDistance) {
      minDistance = distance
      closestCorner = corner as 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'
    }
  }

  return closestCorner
}

/**
 * Cria função debounced para otimização de performance
 * FASE 3.3: Performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function para limitar chamadas durante drag
 * FASE 3.3: Performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
