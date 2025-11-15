/**
 * Serviço de API para Etapas de Protocolos (Workflow)
 */

import {
  ProtocolStage,
  CreateStageData,
  StageStatus,
  ApiResponse,
} from '@/types/protocol-enhancements';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Cria uma nova etapa em um protocolo
 */
export async function createStage(
  protocolId: string,
  data: CreateStageData,
  token: string
): Promise<ProtocolStage> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result: ApiResponse<ProtocolStage> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar etapa');
  }

  return result.data!;
}

/**
 * Lista todas as etapas de um protocolo
 */
export async function getProtocolStages(
  protocolId: string,
  token: string
): Promise<ProtocolStage[]> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolStage[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao listar etapas');
  }

  return result.data!;
}

/**
 * Obtém a etapa atual do protocolo
 */
export async function getCurrentStage(
  protocolId: string,
  token: string
): Promise<ProtocolStage | null> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages/current`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolStage> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao obter etapa atual');
  }

  return result.data || null;
}

/**
 * Obtém uma etapa específica por ID
 */
export async function getStageById(
  protocolId: string,
  stageId: string,
  token: string
): Promise<ProtocolStage> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages/${stageId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolStage> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao obter etapa');
  }

  return result.data!;
}

/**
 * Atualiza uma etapa
 */
export async function updateStage(
  protocolId: string,
  stageId: string,
  data: Partial<ProtocolStage>,
  token: string
): Promise<ProtocolStage> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages/${stageId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result: ApiResponse<ProtocolStage> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao atualizar etapa');
  }

  return result.data!;
}

/**
 * Inicia uma etapa
 */
export async function startStage(
  protocolId: string,
  stageId: string,
  token: string
): Promise<ProtocolStage> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages/${stageId}/start`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolStage> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao iniciar etapa');
  }

  return result.data!;
}

/**
 * Completa uma etapa
 */
export async function completeStage(
  protocolId: string,
  stageId: string,
  result: string,
  notes?: string,
  token?: string
): Promise<ProtocolStage> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages/${stageId}/complete`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ result, notes }),
    }
  );

  const apiResponse: ApiResponse<ProtocolStage> = await response.json();

  if (!response.ok || !apiResponse.success) {
    throw new Error(apiResponse.error || 'Erro ao completar etapa');
  }

  return apiResponse.data!;
}

/**
 * Pula uma etapa
 */
export async function skipStage(
  protocolId: string,
  stageId: string,
  reason?: string,
  token?: string
): Promise<ProtocolStage> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages/${stageId}/skip`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    }
  );

  const apiResponse: ApiResponse<ProtocolStage> = await response.json();

  if (!response.ok || !apiResponse.success) {
    throw new Error(apiResponse.error || 'Erro ao pular etapa');
  }

  return apiResponse.data!;
}

/**
 * Marca uma etapa como falha
 */
export async function failStage(
  protocolId: string,
  stageId: string,
  reason: string,
  token: string
): Promise<ProtocolStage> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages/${stageId}/fail`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    }
  );

  const result: ApiResponse<ProtocolStage> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao marcar etapa como falha');
  }

  return result.data!;
}

/**
 * Verifica se todas as etapas foram completadas
 */
export async function checkAllStagesCompleted(
  protocolId: string,
  token: string
): Promise<boolean> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages/check-completion`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<{ allCompleted: boolean }> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao verificar completude das etapas');
  }

  return result.data!.allCompleted;
}

/**
 * Conta etapas por status
 */
export async function countStagesByStatus(
  protocolId: string,
  token: string
): Promise<Record<StageStatus, number>> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages/count-by-status`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<Record<StageStatus, number>> =
    await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao contar etapas por status');
  }

  return result.data!;
}

/**
 * Deleta uma etapa (apenas administradores)
 */
export async function deleteStage(
  protocolId: string,
  stageId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/stages/${stageId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<any> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao deletar etapa');
  }
}
