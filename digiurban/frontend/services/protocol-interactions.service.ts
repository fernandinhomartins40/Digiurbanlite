/**
 * ============================================================================
 * PROTOCOL INTERACTIONS SERVICE
 * ============================================================================
 * Serviço para gerenciar interações/comunicações de protocolos
 */

import { getFullApiUrl } from '@/lib/api-config'
import {
  ProtocolInteraction,
  InteractionType,
  InteractionVisibility,
} from '@/types/protocol-enhancements'

export interface CreateInteractionData {
  protocolId: string
  message: string
  interactionType: InteractionType
  visibility: InteractionVisibility
  metadata?: any
}

/**
 * Buscar interações de um protocolo
 */
export async function getProtocolInteractions(
  protocolId: string
): Promise<ProtocolInteraction[]> {
  try {
    const apiUrl = getFullApiUrl(`/api/protocols/${protocolId}/interactions`)
    const response = await fetch(apiUrl, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar interações')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching protocol interactions:', error)
    throw error
  }
}

/**
 * Criar nova interação
 */
export async function createInteraction(
  data: CreateInteractionData
): Promise<ProtocolInteraction> {
  try {
    const apiUrl = getFullApiUrl(`/api/protocols/${data.protocolId}/interactions`)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Erro ao criar interação')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating interaction:', error)
    throw error
  }
}

/**
 * Marcar interação como lida
 */
export async function markInteractionAsRead(
  protocolId: string,
  interactionId: string
): Promise<void> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/interactions/${interactionId}/read`
    )
    const response = await fetch(apiUrl, {
      method: 'PUT',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Erro ao marcar interação como lida')
    }
  } catch (error) {
    console.error('Error marking interaction as read:', error)
    throw error
  }
}

/**
 * Marcar todas as interações como lidas
 */
export async function markAllInteractionsAsRead(
  protocolId: string
): Promise<void> {
  try {
    const apiUrl = getFullApiUrl(
      `/api/protocols/${protocolId}/interactions/read-all`
    )
    const response = await fetch(apiUrl, {
      method: 'PUT',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Erro ao marcar todas interações como lidas')
    }
  } catch (error) {
    console.error('Error marking all interactions as read:', error)
    throw error
  }
}
