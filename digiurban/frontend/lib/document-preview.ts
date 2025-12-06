import { ProtocolDocument } from '@/types/protocol-enhancements'

const imageExtPattern = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|heic|heif)$/i
const absoluteUrlPattern = /^https?:\/\//i

// Normaliza caminhos legados salvos como caminhos absolutos do contêiner (/app/backend/uploads/...)
const normalizeLegacyPath = (rawUrl: string) => {
  const legacyMatch = rawUrl.match(/(?:^|\/)(?:app\/)?backend\/uploads(\/.*)$/i)
  if (legacyMatch?.[1]) {
    return `/uploads${legacyMatch[1]}`
  }
  return rawUrl
}

export const isImageDoc = (doc?: ProtocolDocument | null) => {
  if (!doc) return false
  const mime = doc.mimeType?.toLowerCase() || ''
  if (mime.startsWith('image/')) return true
  const fileName = doc.fileName?.toLowerCase() || ''
  const url = doc.fileUrl?.toLowerCase() || ''
  return imageExtPattern.test(fileName) || imageExtPattern.test(url)
}

export const isPdfDoc = (doc?: ProtocolDocument | null) => {
  if (!doc) return false
  const mime = doc.mimeType?.toLowerCase() || ''
  if (mime === 'application/pdf' || mime === 'application/x-pdf') return true
  const fileName = doc.fileName?.toLowerCase() || ''
  const url = doc.fileUrl?.toLowerCase() || ''
  return fileName.endsWith('.pdf') || url.endsWith('.pdf')
}

export const buildAbsoluteFromRelative = (relativePath: string) => {
  if (typeof window === 'undefined') return relativePath
  const clean = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return `${window.location.origin}/${clean}`
}

// Garante que caminhos relativos tenham a barra inicial
const withLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`)

export const resolvePreviewUrl = (
  doc: ProtocolDocument,
  getDownloadUrl: (d: ProtocolDocument) => string
) => {
  const rawUrl = doc.fileUrl || ''
  const normalizedUrl = normalizeLegacyPath(rawUrl)

  if (!rawUrl) {
    return getDownloadUrl(doc)
  }

  // data URL ou externa: usar direto
  if (normalizedUrl.startsWith('data:')) {
    return normalizedUrl
  }

  if (absoluteUrlPattern.test(normalizedUrl)) {
    return normalizedUrl
  }

  // Caminhos de upload expostos diretamente pelo backend
  if (normalizedUrl.startsWith('/uploads') || normalizedUrl.startsWith('uploads/')) {
    return buildAbsoluteFromRelative(withLeadingSlash(normalizedUrl))
  }

  // Demais casos (incluindo legados com caminho relativo diferente): usar rota de download,
  // que centraliza a resoluÇõÇœo de caminho e CORS.
  return getDownloadUrl(doc)
}
