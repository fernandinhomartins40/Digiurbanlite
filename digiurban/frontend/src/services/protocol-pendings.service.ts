/**
 * Serviço de API para Pendências de Protocolos
 */

import {
  ProtocolPending,
  CreatePendingData,
  ResolvePendingData,
  CancelPendingData,
  PendingStatus,
  PendingCountByStatus,
  ApiResponse,
} from '@/types/protocol-enhancements';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Cria uma nova pendência
 */
export async function createPending(
  protocolId: string,
  data: CreatePendingData,
  token: string
): Promise<ProtocolPending> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result: ApiResponse<ProtocolPending> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar pendência');
  }

  return result.data!;
}

/**
 * Lista todas as pendências de um protocolo
 */
export async function getProtocolPendings(
  protocolId: string,
  token: string,
  status?: PendingStatus
): Promise<ProtocolPending[]> {
  const params = new URLSearchParams();
  if (status) {
    params.append('status', status);
  }

  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolPending[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao listar pendências');
  }

  return result.data!;
}

/**
 * Obtém uma pendência específica
 */
export async function getPending(
  protocolId: string,
  pendingId: string,
  token: string
): Promise<ProtocolPending> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings/${pendingId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolPending> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao obter pendência');
  }

  return result.data!;
}

/**
 * Atualiza uma pendência
 */
export async function updatePending(
  protocolId: string,
  pendingId: string,
  data: Partial<ProtocolPending>,
  token: string
): Promise<ProtocolPending> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings/${pendingId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result: ApiResponse<ProtocolPending> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao atualizar pendência');
  }

  return result.data!;
}

/**
 * Marca pendência como em progresso
 */
export async function startPending(
  protocolId: string,
  pendingId: string,
  token: string
): Promise<ProtocolPending> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings/${pendingId}/start`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolPending> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao iniciar pendência');
  }

  return result.data!;
}

/**
 * Resolve uma pendência
 */
export async function resolvePending(
  protocolId: string,
  pendingId: string,
  data: ResolvePendingData,
  token: string
): Promise<ProtocolPending> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings/${pendingId}/resolve`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result: ApiResponse<ProtocolPending> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao resolver pendência');
  }

  return result.data!;
}

/**
 * Cancela uma pendência
 */
export async function cancelPending(
  protocolId: string,
  pendingId: string,
  data: CancelPendingData,
  token: string
): Promise<ProtocolPending> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings/${pendingId}/cancel`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result: ApiResponse<ProtocolPending> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao cancelar pendência');
  }

  return result.data!;
}

/**
 * Verifica se há pendências bloqueantes
 */
export async function hasBlockingPendings(
  protocolId: string,
  token: string
): Promise<boolean> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings/check-blocking`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<{ hasBlocking: boolean }> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao verificar pendências bloqueantes');
  }

  return result.data!.hasBlocking;
}

/**
 * Conta pendências por status
 */
export async function countPendingsByStatus(
  protocolId: string,
  token: string
): Promise<PendingCountByStatus> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings/count-by-status`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<PendingCountByStatus> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao contar pendências por status');
  }

  return result.data!;
}

/**
 * Verifica e marca pendências expiradas
 */
export async function checkExpiredPendings(
  protocolId: string,
  token: string
): Promise<{ count: number; expired: ProtocolPending[] }> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings/check-expired`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<{ count: number; expired: ProtocolPending[] }> =
    await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao verificar pendências expiradas');
  }

  return result.data!;
}

/**
 * Deleta uma pendência
 */
export async function deletePending(
  protocolId: string,
  pendingId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/pendings/${pendingId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<any> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao deletar pendência');
  }
}
