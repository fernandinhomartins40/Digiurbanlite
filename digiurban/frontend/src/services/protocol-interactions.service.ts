/**
 * Serviço de API para Interações de Protocolos
 */

import {
  ProtocolInteraction,
  CreateInteractionData,
  ApiResponse,
} from '@/types/protocol-enhancements';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Cria uma nova interação em um protocolo
 */
export async function createInteraction(
  protocolId: string,
  data: CreateInteractionData,
  token: string
): Promise<ProtocolInteraction> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/interactions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result: ApiResponse<ProtocolInteraction> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar interação');
  }

  return result.data!;
}

/**
 * Lista todas as interações de um protocolo
 */
export async function getProtocolInteractions(
  protocolId: string,
  token: string,
  includeInternal: boolean = false
): Promise<ProtocolInteraction[]> {
  const params = new URLSearchParams();
  if (includeInternal) {
    params.append('includeInternal', 'true');
  }

  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/interactions?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolInteraction[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao listar interações');
  }

  return result.data!;
}

/**
 * Marca uma interação como lida
 */
export async function markInteractionAsRead(
  protocolId: string,
  interactionId: string,
  token: string
): Promise<ProtocolInteraction> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/interactions/${interactionId}/read`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolInteraction> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao marcar interação como lida');
  }

  return result.data!;
}

/**
 * Marca todas as interações de um protocolo como lidas
 */
export async function markAllInteractionsAsRead(
  protocolId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/interactions/read-all`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<any> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao marcar todas interações como lidas');
  }
}

/**
 * Conta interações não lidas de um protocolo
 */
export async function getUnreadCount(
  protocolId: string,
  token: string
): Promise<number> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/interactions/unread-count`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<{ count: number }> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao contar interações não lidas');
  }

  return result.data!.count;
}

/**
 * Deleta uma interação (apenas administradores)
 */
export async function deleteInteraction(
  protocolId: string,
  interactionId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/interactions/${interactionId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<any> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao deletar interação');
  }
}
