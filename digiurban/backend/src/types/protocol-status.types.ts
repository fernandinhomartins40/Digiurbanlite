/**
 * ============================================================================
 * PROTOCOL STATUS TYPES
 * ============================================================================
 *
 * Tipos e interfaces para o sistema centralizado de gerenciamento de status
 * de protocolos.
 */

import { ProtocolStatus, UserRole } from '@prisma/client';

/**
 * Tipo de ator que pode alterar status
 */
export type ActorRole = UserRole | 'CITIZEN';

/**
 * Input para atualização de status
 */
export interface UpdateStatusInput {
  protocolId: string;
  newStatus: ProtocolStatus;

  // Contexto do ator que está fazendo a mudança
  actorId: string;
  actorRole: ActorRole;

  // Metadados opcionais
  comment?: string;
  reason?: string; // Obrigatório para rejeições/cancelamentos
  metadata?: Record<string, any>;
}

/**
 * Resultado de uma transição de status
 */
export interface StatusTransitionResult {
  protocol: any;
  previousStatus: ProtocolStatus;
  newStatus: ProtocolStatus;
  transitionedAt: Date;
  historyId: string;
}

/**
 * Contexto de validação de transição
 */
export interface TransitionValidationContext {
  currentStatus: ProtocolStatus;
  newStatus: ProtocolStatus;
  actorRole: ActorRole;
  protocolType: string;
  protocol: any;
}

/**
 * Configuração de hook de status
 */
export interface StatusHook {
  status: ProtocolStatus;
  moduleType?: string;
  handler: (protocol: any, context: any) => Promise<void>;
}

/**
 * Ação registrada no histórico
 */
export enum HistoryAction {
  CRIACAO = 'CRIACAO',
  MUDANCA_STATUS = 'MUDANCA_STATUS',
  APROVACAO = 'APROVACAO',
  REPROVACAO = 'REPROVACAO',
  CANCELAMENTO_CIDADAO = 'CANCELAMENTO_CIDADAO',
  CANCELAMENTO_SECRETARIA = 'CANCELAMENTO_SECRETARIA',
  CONCLUSAO = 'CONCLUSAO',
  COMENTARIO = 'COMENTARIO',
  ATRIBUICAO = 'ATRIBUICAO'
}

/**
 * Erro de transição inválida
 */
export class InvalidTransitionError extends Error {
  constructor(
    message: string,
    public currentStatus: ProtocolStatus,
    public attemptedStatus: ProtocolStatus,
    public actorRole: ActorRole
  ) {
    super(message);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Erro de permissão
 */
export class PermissionDeniedError extends Error {
  constructor(
    message: string,
    public actorRole: ActorRole,
    public requiredRole?: ActorRole
  ) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Mapeamento de status para cores (UI)
 */
export interface StatusUIConfig {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
  description: string;
}
