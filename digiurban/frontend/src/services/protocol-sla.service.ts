/**
 * Serviço de API para SLA de Protocolos
 */

import {
  ProtocolSLA,
  CreateSLAData,
  SLAStats,
  ApiResponse,
} from '@/types/protocol-enhancements';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Cria um SLA para um protocolo
 */
export async function createSLA(
  protocolId: string,
  data: CreateSLAData,
  token: string
): Promise<ProtocolSLA> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/sla`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result: ApiResponse<ProtocolSLA> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar SLA');
  }

  return result.data!;
}

/**
 * Obtém o SLA de um protocolo
 */
export async function getProtocolSLA(
  protocolId: string,
  token: string
): Promise<ProtocolSLA | null> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/sla`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  const result: ApiResponse<ProtocolSLA> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao obter SLA');
  }

  return result.data || null;
}

/**
 * Pausa o SLA de um protocolo
 */
export async function pauseSLA(
  protocolId: string,
  reason: string,
  token: string
): Promise<ProtocolSLA> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/sla/pause`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    }
  );

  const result: ApiResponse<ProtocolSLA> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao pausar SLA');
  }

  return result.data!;
}

/**
 * Retoma o SLA de um protocolo
 */
export async function resumeSLA(
  protocolId: string,
  token: string
): Promise<ProtocolSLA> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/sla/resume`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolSLA> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao retomar SLA');
  }

  return result.data!;
}

/**
 * Finaliza o SLA de um protocolo
 */
export async function completeSLA(
  protocolId: string,
  token: string
): Promise<ProtocolSLA> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/sla/complete`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolSLA> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao finalizar SLA');
  }

  return result.data!;
}

/**
 * Atualiza o status de atraso do SLA
 */
export async function updateSLAStatus(
  protocolId: string,
  token: string
): Promise<ProtocolSLA | null> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/sla/update-status`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolSLA> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao atualizar status do SLA');
  }

  return result.data || null;
}

/**
 * Obtém todos os SLAs em atraso
 */
export async function getOverdueSLAs(
  token: string,
  tenantId?: string
): Promise<any[]> {
  const params = new URLSearchParams();
  if (tenantId) {
    params.append('tenantId', tenantId);
  }

  const response = await fetch(
    `${API_URL}/api/sla/overdue?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<any[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao obter SLAs em atraso');
  }

  return result.data!;
}

/**
 * Obtém SLAs próximos do vencimento
 */
export async function getSLAsNearDue(
  token: string,
  days: number = 3,
  tenantId?: string
): Promise<any[]> {
  const params = new URLSearchParams();
  params.append('days', days.toString());
  if (tenantId) {
    params.append('tenantId', tenantId);
  }

  const response = await fetch(
    `${API_URL}/api/sla/near-due?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<any[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao obter SLAs próximos do vencimento');
  }

  return result.data!;
}

/**
 * Obtém estatísticas de SLA para um tenant
 */
export async function getSLAStats(
  tenantId: string,
  token: string
): Promise<SLAStats> {
  const response = await fetch(`${API_URL}/api/sla/stats/${tenantId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result: ApiResponse<SLAStats> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao obter estatísticas de SLA');
  }

  return result.data!;
}

/**
 * Deleta o SLA de um protocolo (apenas administradores)
 */
export async function deleteSLA(
  protocolId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/protocols/${protocolId}/sla`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<any> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao deletar SLA');
  }
}

/**
 * Calcula o percentual de progresso do SLA
 */
export function calculateSLAProgress(sla: ProtocolSLA): number {
  const start = new Date(sla.startDate).getTime();
  const expected = new Date(sla.expectedEndDate).getTime();
  const now = Date.now();

  const total = expected - start;
  const elapsed = now - start;

  const progress = (elapsed / total) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Verifica se o SLA está próximo do vencimento (dentro de X dias)
 */
export function isSLANearDue(sla: ProtocolSLA, days: number = 3): boolean {
  if (sla.actualEndDate || sla.isPaused) return false;

  const expected = new Date(sla.expectedEndDate).getTime();
  const threshold = Date.now() + days * 24 * 60 * 60 * 1000;

  return expected <= threshold && expected > Date.now();
}

/**
 * Formata dias restantes do SLA
 */
export function formatSLADaysRemaining(sla: ProtocolSLA): string {
  if (sla.actualEndDate) return 'Concluído';
  if (sla.isPaused) return 'Pausado';

  const expected = new Date(sla.expectedEndDate).getTime();
  const now = Date.now();
  const diff = expected - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)} dias em atraso`;
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  return `${days} dias restantes`;
}
