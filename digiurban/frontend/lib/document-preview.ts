import { ProtocolDocument } from '@/types/protocol-enhancements'

const imageExtPattern = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|heic|heif)$/i

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

export const resolvePreviewUrl = (
  doc: ProtocolDocument,
  getDownloadUrl: (d: ProtocolDocument) => string
) => {
  // data URL ou externa: usar direto
  if (doc.fileUrl?.startsWith('data:') || doc.fileUrl?.startsWith('http')) {
    return doc.fileUrl
  }
  // Demais casos (incluindo legados com caminho relativo): usar rota de download,
  // que centraliza a resoluÇõÇœo de caminho e CORS.
  return getDownloadUrl(doc)
}
