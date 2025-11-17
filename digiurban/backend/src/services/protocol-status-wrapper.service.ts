/**
 * ============================================================================
 * PROTOCOL STATUS WRAPPER SERVICE
 * ============================================================================
 *
 * Wrapper que substitui as chamadas diretas de updateStatus nos serviços
 * legados, direcionando para o motor centralizado.
 *
 * Este arquivo facilita a migração gradual do sistema.
 */

import { UserRole } from '@prisma/client';
import { protocolStatusEngine } from './protocol-status.engine';
import { UpdateProtocolStatusInput } from './protocol-simplified.service';
import { ActorRole } from '../types/protocol-status.types';

/**
 * Atualizar status usando o motor centralizado
 *
 * Esta função substitui a implementação antiga de updateStatus
 */
export async function updateProtocolStatus(input: UpdateProtocolStatusInput) {
  const { protocolId, newStatus, comment, userId } = input;

  // Determinar role do ator
  const actorRole: ActorRole = userId ? UserRole.ADMIN : 'CITIZEN';

  // Usar motor centralizado
  const result = await protocolStatusEngine.updateStatus({
    protocolId,
    newStatus,
    actorId: userId || 'system',
    actorRole,
    comment,
    metadata: {
      source: 'protocol-status-wrapper'
    }
  });

  return result.protocol;
}

/**
 * Função auxiliar para aprovação de protocolos pelas secretarias
 */
export async function approveProtocol(
  protocolId: string,
  userId: string,
  comment?: string,
  metadata?: Record<string, any>
) {
  const result = await protocolStatusEngine.updateStatus({
    protocolId,
    newStatus: 'CONCLUIDO',
    actorId: userId,
    actorRole: UserRole.USER, // Usuário de departamento
    comment: comment || 'Protocolo aprovado pela secretaria',
    metadata: {
      action: 'approval',
      ...metadata
    }
  });

  return result.protocol;
}

/**
 * Função auxiliar para rejeição de protocolos pelas secretarias
 */
export async function rejectProtocol(
  protocolId: string,
  userId: string,
  reason: string,
  metadata?: Record<string, any>
) {
  const result = await protocolStatusEngine.updateStatus({
    protocolId,
    newStatus: 'PENDENCIA',
    actorId: userId,
    actorRole: UserRole.USER,
    comment: `Protocolo rejeitado: ${reason}`,
    reason,
    metadata: {
      action: 'rejection',
      ...metadata
    }
  });

  return result.protocol;
}

/**
 * Função auxiliar para cancelamento por cidadão
 */
export async function cancelProtocolByCitizen(
  protocolId: string,
  citizenId: string,
  reason?: string
) {
  const result = await protocolStatusEngine.updateStatus({
    protocolId,
    newStatus: 'CANCELADO',
    actorId: citizenId,
    actorRole: 'CITIZEN',
    comment: reason || 'Cancelado pelo cidadão',
    reason,
    metadata: {
      action: 'cancellation',
      source: 'citizen'
    }
  });

  return result.protocol;
}

/**
 * Função auxiliar para marcar protocolo em progresso
 */
export async function startProtocolProgress(
  protocolId: string,
  userId: string,
  comment?: string
) {
  const result = await protocolStatusEngine.updateStatus({
    protocolId,
    newStatus: 'PROGRESSO',
    actorId: userId,
    actorRole: UserRole.USER,
    comment: comment || 'Protocolo em andamento',
    metadata: {
      action: 'start_progress'
    }
  });

  return result.protocol;
}
