/**
 * ============================================================================
 * PROTOCOL DOCUMENTS SERVICE
 * ============================================================================
 * Serviço para gerenciar documentos de protocolos
 */

import { getFullApiUrl } from '@/lib/api-config'

export interface ProtocolDocument {
  id: string
  protocolId: string
  documentType: string
  fileName: string
  fileUrl: string
  filePath: string
  fileSize: number
  mimeType: string
  status: 'PENDING' | 'VALIDATED' | 'REJECTED'
  uploadedById: string
  uploadedBy?: {
    id: string
    name: string
    role: string
  }
  validatedById?: string
  validatedBy?: {
    id: string
    name: string
  }
  rejectionReason?: string
  metadata?: any
  createdAt: string
  updatedAt: string
  validatedAt?: string
}

export interface CreateDocumentData {
  documentType: string
  metadata?: any
}

/**
 * Buscar documentos de um protocolo
 */
export async function getProtocolDocuments(
  protocolId: string
): Promise<ProtocolDocument[]> {
  try {
    const apiUrl = getFullApiUrl(`/api/protocols/${protocolId}/documents`)
    const response = await fetch(apiUrl, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar documentos')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching protocol documents:', error)
    throw error
  }
}

/**
 * Fazer upload de documento
 */
export async function uploadDocument(
  protocolId: string,
  file: File,
  documentType: string,
  metadata?: any
): Promise<ProtocolDocument> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    const apiUrl = getFullApiUrl(`/api/protocols/${protocolId}/documents/upload`)
    const response = await fetch(apiUrl, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao fazer upload do documento')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error uploading document:', error)
    throw error
  }
}

/**
 * Validar documento
 */
export async function validateDocument(
  protocolId: string,
  documentId: string
): Promise<ProtocolDocument> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/documents/${documentId}/validate`
    )
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Erro ao validar documento')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error validating document:', error)
    throw error
  }
}

/**
 * Rejeitar documento
 */
export async function rejectDocument(
  protocolId: string,
  documentId: string,
  reason: string
): Promise<ProtocolDocument> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/documents/${documentId}/reject`
    )
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      throw new Error('Erro ao rejeitar documento')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error rejecting document:', error)
    throw error
  }
}

/**
 * Deletar documento
 */
export async function deleteDocument(
  protocolId: string,
  documentId: string
): Promise<void> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/documents/${documentId}`
    )
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Erro ao deletar documento')
    }
  } catch (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}

/**
 * Baixar documento
 */
export function getDocumentDownloadUrl(
  protocolId: string,
  documentId: string
): string {
  return getFullApiUrl(`/api/protocols/${protocolId}/documents/${documentId}/download`)
}
