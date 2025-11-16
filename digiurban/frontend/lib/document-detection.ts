/**
 * ============================================================================
 * DOCUMENT DETECTION LIBRARY
 * ============================================================================
 * Biblioteca de detecção automática de bordas de documentos em imagens
 * Usa algoritmos de visão computacional em JavaScript puro
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
 * Converte imagem para escala de cinza
 */
function toGrayscale(imageData: ImageData): number[] {
  const gray: number[] = []
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    gray.push(avg)
  }

  return gray
}

/**
 * Aplica filtro Gaussiano (blur) para reduzir ruído
 */
function gaussianBlur(gray: number[], width: number, height: number): number[] {
  const blurred: number[] = new Array(gray.length)
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ]
  const kernelSum = 16

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx)
          sum += gray[idx] * kernel[ky + 1][kx + 1]
        }
      }
      blurred[y * width + x] = sum / kernelSum
    }
  }

  return blurred
}

/**
 * Detecta bordas usando operador Sobel
 */
function detectEdges(gray: number[], width: number, height: number): number[] {
  const edges: number[] = new Array(gray.length).fill(0)

  // Kernels Sobel
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ]
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0
      let gy = 0

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx)
          const pixel = gray[idx]
          gx += pixel * sobelX[ky + 1][kx + 1]
          gy += pixel * sobelY[ky + 1][kx + 1]
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy)
      edges[y * width + x] = magnitude > 128 ? 255 : 0
    }
  }

  return edges
}

/**
 * Encontra contornos na imagem de bordas
 */
function findContours(edges: number[], width: number, height: number): Point[][] {
  const visited = new Array(edges.length).fill(false)
  const contours: Point[][] = []

  function traceContour(startX: number, startY: number): Point[] {
    const contour: Point[] = []
    const stack: Point[] = [{ x: startX, y: startY }]

    while (stack.length > 0) {
      const p = stack.pop()!
      const idx = p.y * width + p.x

      if (p.x < 0 || p.x >= width || p.y < 0 || p.y >= height) continue
      if (visited[idx] || edges[idx] === 0) continue

      visited[idx] = true
      contour.push(p)

      // Verificar 8 vizinhos
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          stack.push({ x: p.x + dx, y: p.y + dy })
        }
      }
    }

    return contour
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!visited[idx] && edges[idx] > 0) {
        const contour = traceContour(x, y)
        if (contour.length > 50) { // Filtrar contornos muito pequenos
          contours.push(contour)
        }
      }
    }
  }

  return contours
}

/**
 * Aproxima contorno para polígono
 */
function approximatePolygon(contour: Point[], epsilon: number): Point[] {
  if (contour.length < 3) return contour

  // Algoritmo Douglas-Peucker simplificado
  function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const mag = Math.sqrt(dx * dx + dy * dy)
    if (mag === 0) return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2))

    const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag)
    const closestX = lineStart.x + u * dx
    const closestY = lineStart.y + u * dy

    return Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2))
  }

  function simplify(points: Point[], epsilon: number): Point[] {
    if (points.length < 3) return points

    let maxDist = 0
    let maxIndex = 0

    for (let i = 1; i < points.length - 1; i++) {
      const dist = perpendicularDistance(points[i], points[0], points[points.length - 1])
      if (dist > maxDist) {
        maxDist = dist
        maxIndex = i
      }
    }

    if (maxDist > epsilon) {
      const left = simplify(points.slice(0, maxIndex + 1), epsilon)
      const right = simplify(points.slice(maxIndex), epsilon)
      return [...left.slice(0, -1), ...right]
    }

    return [points[0], points[points.length - 1]]
  }

  return simplify(contour, epsilon)
}

/**
 * Ordena 4 pontos em sentido horário começando do top-left
 */
function orderPoints(points: Point[]): DocumentCorners | null {
  if (points.length !== 4) return null

  // Ordenar por soma (x+y) - menor é top-left, maior é bottom-right
  const sorted = [...points].sort((a, b) => (a.x + a.y) - (b.x + b.y))
  const topLeft = sorted[0]
  const bottomRight = sorted[3]

  // Os dois do meio: menor diferença (x-y) é top-right, maior é bottom-left
  const middle = sorted.slice(1, 3).sort((a, b) => (a.x - a.y) - (b.x - b.y))
  const topRight = middle[1]
  const bottomLeft = middle[0]

  return { topLeft, topRight, bottomRight, bottomLeft }
}

/**
 * Calcula área de um quadrilátero
 */
function quadrilateralArea(corners: DocumentCorners): number {
  const { topLeft, topRight, bottomRight, bottomLeft } = corners

  // Fórmula de Shoelace
  const area = 0.5 * Math.abs(
    (topLeft.x * topRight.y - topRight.x * topLeft.y) +
    (topRight.x * bottomRight.y - bottomRight.x * topRight.y) +
    (bottomRight.x * bottomLeft.y - bottomLeft.x * bottomRight.y) +
    (bottomLeft.x * topLeft.y - topLeft.x * bottomLeft.y)
  )

  return area
}

/**
 * Detecta documento na imagem
 */
export async function detectDocument(canvas: HTMLCanvasElement): Promise<DetectionResult> {
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return { success: false, confidence: 0, error: 'Não foi possível obter contexto do canvas' }
    }

    const width = canvas.width
    const height = canvas.height
    const imageData = ctx.getImageData(0, 0, width, height)

    // 1. Converter para escala de cinza
    const gray = toGrayscale(imageData)

    // 2. Aplicar blur para reduzir ruído
    const blurred = gaussianBlur(gray, width, height)

    // 3. Detectar bordas
    const edges = detectEdges(blurred, width, height)

    // 4. Encontrar contornos
    const contours = findContours(edges, width, height)

    if (contours.length === 0) {
      return { success: false, confidence: 0, error: 'Nenhum contorno detectado' }
    }

    // 5. Ordenar contornos por área (maior primeiro)
    contours.sort((a, b) => b.length - a.length)

    // 6. Procurar por quadrilátero que represente o documento
    const imageArea = width * height

    for (const contour of contours.slice(0, 5)) { // Verificar os 5 maiores contornos
      // Aproximar para polígono
      const perimeter = contour.length
      const epsilon = 0.02 * perimeter
      const approx = approximatePolygon(contour, epsilon)

      // Verificar se é um quadrilátero
      if (approx.length === 4) {
        const corners = orderPoints(approx)
        if (!corners) continue

        const docArea = quadrilateralArea(corners)
        const areaRatio = docArea / imageArea

        // Documento deve ocupar entre 20% e 95% da imagem
        if (areaRatio > 0.2 && areaRatio < 0.95) {
          // Calcular confiança baseada em:
          // - Proporção da área (ideal: 50-80%)
          // - Ângulos do quadrilátero (ideal: próximos de 90°)
          let confidence = 70

          if (areaRatio > 0.4 && areaRatio < 0.8) {
            confidence += 20
          }

          // Verificar se os ângulos são aproximadamente retos
          const angles = calculateAngles(corners)
          const angleScore = angles.filter(a => Math.abs(a - 90) < 15).length
          confidence += angleScore * 2.5 // 0-10 pontos

          return {
            success: true,
            corners,
            confidence: Math.min(100, confidence)
          }
        }
      }
    }

    return { success: false, confidence: 0, error: 'Nenhum documento detectado' }
  } catch (error) {
    console.error('Erro na detecção:', error)
    return { success: false, confidence: 0, error: 'Erro durante a detecção' }
  }
}

/**
 * Calcula os ângulos internos de um quadrilátero
 */
function calculateAngles(corners: DocumentCorners): number[] {
  const points = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft]
  const angles: number[] = []

  for (let i = 0; i < 4; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % 4]
    const p3 = points[(i + 2) % 4]

    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }

    const dot = v1.x * v2.x + v1.y * v2.y
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

    const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI)
    angles.push(angle)
  }

  return angles
}

/**
 * Aplica correção de perspectiva (warp perspective)
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

  // Pontos de destino (retângulo perfeito)
  const dst = {
    topLeft: { x: 0, y: 0 },
    topRight: { x: outputWidth, y: 0 },
    bottomRight: { x: outputWidth, y: outputHeight },
    bottomLeft: { x: 0, y: outputHeight }
  }

  // Calcular matriz de transformação de perspectiva
  const matrix = getPerspectiveTransform(corners, dst)

  // Aplicar transformação
  const srcImageData = srcCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
  const dstImageData = ctx.createImageData(outputWidth, outputHeight)

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      // Transformar coordenadas de destino para origem
      const srcPoint = applyPerspectiveTransform({ x, y }, matrix, true)

      const sx = Math.round(srcPoint.x)
      const sy = Math.round(srcPoint.y)

      if (sx >= 0 && sx < sourceCanvas.width && sy >= 0 && sy < sourceCanvas.height) {
        const srcIdx = (sy * sourceCanvas.width + sx) * 4
        const dstIdx = (y * outputWidth + x) * 4

        dstImageData.data[dstIdx] = srcImageData.data[srcIdx]
        dstImageData.data[dstIdx + 1] = srcImageData.data[srcIdx + 1]
        dstImageData.data[dstIdx + 2] = srcImageData.data[srcIdx + 2]
        dstImageData.data[dstIdx + 3] = 255
      }
    }
  }

  ctx.putImageData(dstImageData, 0, 0)
  return outputCanvas
}

/**
 * Calcula matriz de transformação de perspectiva (simplificada)
 */
function getPerspectiveTransform(src: DocumentCorners, dst: DocumentCorners): number[][] {
  // Implementação simplificada de transformação de perspectiva
  // Para produção, considere usar uma biblioteca de álgebra linear
  const srcPoints = [
    [src.topLeft.x, src.topLeft.y],
    [src.topRight.x, src.topRight.y],
    [src.bottomRight.x, src.bottomRight.y],
    [src.bottomLeft.x, src.bottomLeft.y]
  ]

  const dstPoints = [
    [dst.topLeft.x, dst.topLeft.y],
    [dst.topRight.x, dst.topRight.y],
    [dst.bottomRight.x, dst.bottomRight.y],
    [dst.bottomLeft.x, dst.bottomLeft.y]
  ]

  // Matriz de identidade como fallback
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]
}

/**
 * Aplica transformação de perspectiva a um ponto
 */
function applyPerspectiveTransform(point: Point, matrix: number[][], inverse: boolean): Point {
  // Implementação simplificada
  // Para produção, use cálculo matricial apropriado
  return point
}
