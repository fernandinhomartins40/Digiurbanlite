/**
 * ============================================================================
 * PROTOCOL STAGES SERVICE
 * ============================================================================
 * Serviço para gerenciar etapas de workflow de protocolos
 */

import { getFullApiUrl } from '@/lib/api-config'

export interface ProtocolStage {
  id: string
  protocolId: string
  stageName: string
  stageOrder: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
  startedAt?: string
  completedAt?: string
  completedById?: string
  completedBy?: {
    id: string
    name: string
    role: string
  }
  notes?: string
  metadata?: any
  createdAt: string
  updatedAt: string
}

export interface CompleteStageData {
  notes?: string
  metadata?: any
}

export interface FailStageData {
  reason: string
  metadata?: any
}

/**
 * Buscar etapas de um protocolo
 */
export async function getProtocolStages(
  protocolId: string
): Promise<ProtocolStage[]> {
  try {
    const apiUrl = getFullApiUrl(`/api/protocols/${protocolId}/stages`)
    const response = await fetch(apiUrl, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar etapas')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching protocol stages:', error)
    throw error
  }
}

/**
 * Iniciar etapa
 */
export async function startStage(
  protocolId: string,
  stageId: string
): Promise<ProtocolStage> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/stages/${stageId}/start`
    )
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao iniciar etapa')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error starting stage:', error)
    throw error
  }
}

/**
 * Completar etapa
 */
export async function completeStage(
  protocolId: string,
  stageId: string,
  data?: CompleteStageData
): Promise<ProtocolStage> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/stages/${stageId}/complete`
    )
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data || {}),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao completar etapa')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error completing stage:', error)
    throw error
  }
}

/**
 * Falhar etapa
 */
export async function failStage(
  protocolId: string,
  stageId: string,
  reason: string,
  metadata?: any
): Promise<ProtocolStage> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/stages/${stageId}/fail`
    )
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reason, metadata }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao falhar etapa')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error failing stage:', error)
    throw error
  }
}

/**
 * Pular etapa
 */
export async function skipStage(
  protocolId: string,
  stageId: string,
  reason?: string
): Promise<ProtocolStage> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/stages/${stageId}/skip`
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
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao pular etapa')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error skipping stage:', error)
    throw error
  }
}

/**
 * Atualizar notas da etapa
 */
export async function updateStageNotes(
  protocolId: string,
  stageId: string,
  notes: string
): Promise<ProtocolStage> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/stages/${stageId}`
    )
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ notes }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao atualizar notas da etapa')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error updating stage notes:', error)
    throw error
  }
}
