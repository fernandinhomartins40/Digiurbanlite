/**
 * ============================================================================
 * PROTOCOL PENDINGS SERVICE
 * ============================================================================
 * Serviço para gerenciar pendências de protocolos
 */

import { getFullApiUrl } from '@/lib/api-config'

export interface ProtocolPending {
  id: string
  protocolId: string
  stageId?: string
  type?: string
  title?: string
  pendingType: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'RESOLVED' | 'EXPIRED' | 'CANCELLED'
  priority: number
  dueDate?: string
  blocksProgress?: boolean
  requiresReview?: boolean
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
  sourceType?: string
  sourceEntityType?: string
  sourceEntityId?: string
  createdById: string
  createdBy?: {
    id: string
    name: string
    role: string
  }
  resolvedById?: string
  resolvedBy?: {
    id: string
    name: string
  }
  resolution?: string
  metadata?: any
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface CreatePendingData {
  type: string
  title: string
  description: string
  priority?: number
  dueDate?: string
  stageId?: string
  blocksProgress?: boolean
  requiresReview?: boolean
  sourceType?: string
  sourceEntityType?: string
  sourceEntityId?: string
  dedupeKey?: string
  metadata?: any
}

export interface ResolvePendingData {
  resolution: string
}

export interface ReopenPendingData {
  reason: string
}

/**
 * Buscar pendências de um protocolo
 */
export async function getProtocolPendings(
  protocolId: string
): Promise<ProtocolPending[]> {
  try {
    const apiUrl = getFullApiUrl(`/api/protocols/${protocolId}/pendings`)
    const response = await fetch(apiUrl, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar pendências')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching protocol pendings:', error)
    throw error
  }
}

/**
 * Criar nova pendência
 */
export async function createPending(
  protocolId: string,
  data: CreatePendingData
): Promise<ProtocolPending> {
  try {
    const apiUrl = getFullApiUrl(`/api/protocols/${protocolId}/pendings`)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao criar pendência')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating pending:', error)
    throw error
  }
}

/**
 * Resolver pendência
 */
export async function resolvePending(
  protocolId: string,
  pendingId: string,
  resolution: string
): Promise<ProtocolPending> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/pendings/${pendingId}/resolve`
    )
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ resolution }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao resolver pendência')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error resolving pending:', error)
    throw error
  }
}

/**
 * Cancelar pendência
 */
export async function cancelPending(
  protocolId: string,
  pendingId: string,
  reason?: string
): Promise<ProtocolPending> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/pendings/${pendingId}/cancel`
    )
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao cancelar pendência')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error cancelling pending:', error)
    throw error
  }
}

/**
 * Atualizar pendência
 */
export async function updatePending(
  protocolId: string,
  pendingId: string,
  updates: Partial<CreatePendingData>
): Promise<ProtocolPending> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/pendings/${pendingId}`
    )
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao atualizar pendência')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error updating pending:', error)
    throw error
  }
}

/**
 * Criar múltiplas pendências em lote
 */
export async function createPendingsBatch(
  protocolId: string,
  pendings: Omit<CreatePendingData, 'metadata'>[]
): Promise<ProtocolPending[]> {
  try {
    const createdPendings: ProtocolPending[] = []

    for (const pending of pendings) {
      const created = await createPending(protocolId, pending)
      createdPendings.push(created)
    }

    return createdPendings
  } catch (error) {
    console.error('Error creating pendings batch:', error)
    throw error
  }
}

export async function reopenPending(
  protocolId: string,
  pendingId: string,
  reason: string
): Promise<ProtocolPending> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/pendings/${pendingId}/reopen`
    )
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao reabrir pendência')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error reopening pending:', error)
    throw error
  }
}
