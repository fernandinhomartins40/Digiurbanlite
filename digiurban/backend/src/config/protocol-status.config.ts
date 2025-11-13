/**
 * ============================================================================
 * PROTOCOL STATUS CONFIGURATION
 * ============================================================================
 *
 * Configuração centralizada para o sistema de status de protocolos.
 * Define matriz de transições, permissões e metadados de UI.
 */

import { ProtocolStatus, UserRole } from '@prisma/client';
import { ActorRole, StatusUIConfig } from '../types/protocol-status.types';

/**
 * ============================================================================
 * MATRIZ DE TRANSIÇÕES POR ATOR
 * ============================================================================
 *
 * Define quais transições de status são permitidas para cada tipo de ator.
 */
export const TRANSITION_MATRIX: Record<string, Record<string, ProtocolStatus[]>> = {
  /**
   * CIDADÃO - Pode criar protocolos, enviar documentos e cancelar
   */
  CITIZEN: {
    [ProtocolStatus.VINCULADO]: [ProtocolStatus.CANCELADO],
    [ProtocolStatus.PENDENCIA]: [ProtocolStatus.PROGRESSO, ProtocolStatus.CANCELADO],
    [ProtocolStatus.ATUALIZACAO]: [ProtocolStatus.PROGRESSO, ProtocolStatus.CANCELADO],
    [ProtocolStatus.PROGRESSO]: [ProtocolStatus.CANCELADO]
  },

  /**
   * USUÁRIO DE DEPARTAMENTO - Pode analisar, aprovar, rejeitar e executar
   */
  [UserRole.USER]: {
    [ProtocolStatus.VINCULADO]: [
      ProtocolStatus.PROGRESSO,
      ProtocolStatus.PENDENCIA,
      ProtocolStatus.ATUALIZACAO,
      ProtocolStatus.CONCLUIDO,
      ProtocolStatus.CANCELADO
    ],
    [ProtocolStatus.PENDENCIA]: [
      ProtocolStatus.PROGRESSO,
      ProtocolStatus.ATUALIZACAO,
      ProtocolStatus.CONCLUIDO,
      ProtocolStatus.CANCELADO
    ],
    [ProtocolStatus.PROGRESSO]: [
      ProtocolStatus.PENDENCIA,
      ProtocolStatus.ATUALIZACAO,
      ProtocolStatus.CONCLUIDO,
      ProtocolStatus.CANCELADO
    ],
    [ProtocolStatus.ATUALIZACAO]: [
      ProtocolStatus.PROGRESSO,
      ProtocolStatus.PENDENCIA,
      ProtocolStatus.CONCLUIDO,
      ProtocolStatus.CANCELADO
    ]
  },

  /**
   * ADMIN - Pode fazer qualquer transição (override)
   */
  [UserRole.ADMIN]: {
    '*': Object.values(ProtocolStatus)
  },

  /**
   * SUPER_ADMIN - Pode fazer qualquer transição
   */
  [UserRole.SUPER_ADMIN]: {
    '*': Object.values(ProtocolStatus)
  }
};

/**
 * ============================================================================
 * STATUS TERMINAIS
 * ============================================================================
 *
 * Status que não podem mais ser alterados (exceto por ADMIN)
 */
export const TERMINAL_STATUSES: ProtocolStatus[] = [
  ProtocolStatus.CONCLUIDO,
  ProtocolStatus.CANCELADO
];

/**
 * ============================================================================
 * MAPEAMENTO DE AÇÕES PARA HISTÓRICO
 * ============================================================================
 */
export const STATUS_TO_ACTION: Record<ProtocolStatus, string> = {
  [ProtocolStatus.VINCULADO]: 'CRIACAO',
  [ProtocolStatus.PROGRESSO]: 'INICIO_EXECUCAO',
  [ProtocolStatus.PENDENCIA]: 'PENDENCIA_IDENTIFICADA',
  [ProtocolStatus.ATUALIZACAO]: 'ATUALIZACAO_SOLICITADA',
  [ProtocolStatus.CONCLUIDO]: 'CONCLUSAO',
  [ProtocolStatus.CANCELADO]: 'CANCELAMENTO'
};

/**
 * ============================================================================
 * COMENTÁRIOS PADRÃO POR STATUS
 * ============================================================================
 */
export const DEFAULT_COMMENTS: Record<ProtocolStatus, string> = {
  [ProtocolStatus.VINCULADO]: 'Protocolo criado e vinculado ao departamento',
  [ProtocolStatus.PROGRESSO]: 'Protocolo em andamento',
  [ProtocolStatus.PENDENCIA]: 'Protocolo com pendências',
  [ProtocolStatus.ATUALIZACAO]: 'Aguardando atualização',
  [ProtocolStatus.CONCLUIDO]: 'Protocolo concluído com sucesso',
  [ProtocolStatus.CANCELADO]: 'Protocolo cancelado'
};

/**
 * ============================================================================
 * CONFIGURAÇÃO DE UI POR STATUS
 * ============================================================================
 */
export const STATUS_UI_CONFIG: Record<ProtocolStatus, StatusUIConfig> = {
  [ProtocolStatus.VINCULADO]: {
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: 'Link',
    label: 'Vinculado',
    description: 'Protocolo vinculado ao departamento'
  },
  [ProtocolStatus.PROGRESSO]: {
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: 'Clock',
    label: 'Em Andamento',
    description: 'Protocolo em execução'
  },
  [ProtocolStatus.PENDENCIA]: {
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: 'AlertCircle',
    label: 'Com Pendência',
    description: 'Aguardando resolução de pendências'
  },
  [ProtocolStatus.ATUALIZACAO]: {
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    icon: 'RefreshCw',
    label: 'Atualização Necessária',
    description: 'Requer atualização de informações'
  },
  [ProtocolStatus.CONCLUIDO]: {
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: 'CheckCircle',
    label: 'Concluído',
    description: 'Protocolo finalizado com sucesso'
  },
  [ProtocolStatus.CANCELADO]: {
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: 'XCircle',
    label: 'Cancelado',
    description: 'Protocolo cancelado'
  }
};

/**
 * ============================================================================
 * VALIDAÇÕES ESPECIAIS POR TIPO DE SERVIÇO
 * ============================================================================
 */
export const SERVICE_TYPE_VALIDATIONS = {
  /**
   * Serviços COM_DADOS devem seguir fluxo de aprovação
   */
  COM_DADOS: {
    requiresApproval: true,
    approvalStatuses: [ProtocolStatus.PROGRESSO, ProtocolStatus.CONCLUIDO],
    rejectionStatus: ProtocolStatus.PENDENCIA
  },

  /**
   * Serviços SEM_DADOS podem ir direto para execução
   */
  SEM_DADOS: {
    requiresApproval: false,
    approvalStatuses: [],
    rejectionStatus: ProtocolStatus.CANCELADO
  }
};

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Verifica se uma transição é permitida para um ator
 */
export function isTransitionAllowed(
  currentStatus: ProtocolStatus,
  newStatus: ProtocolStatus,
  actorRole: ActorRole
): boolean {
  // Admin pode tudo
  if (actorRole === UserRole.ADMIN || actorRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Buscar transições permitidas
  const matrix = TRANSITION_MATRIX[actorRole];
  if (!matrix) {
    return false;
  }

  // Suporte para wildcard '*'
  if (matrix['*']) {
    return matrix['*'].includes(newStatus);
  }

  // Verificar transição específica
  const allowedTransitions = matrix[currentStatus];
  if (!allowedTransitions) {
    return false;
  }

  return allowedTransitions.includes(newStatus);
}

/**
 * Verifica se status é terminal
 */
export function isTerminalStatus(status: ProtocolStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Obtém ação para histórico baseada no status
 */
export function getActionForStatus(status: ProtocolStatus): string {
  return STATUS_TO_ACTION[status] || 'MUDANCA_STATUS';
}

/**
 * Obtém comentário padrão para status
 */
export function getDefaultComment(status: ProtocolStatus): string {
  return DEFAULT_COMMENTS[status] || `Status alterado para ${status}`;
}

/**
 * Obtém configuração de UI para status
 */
export function getStatusUIConfig(status: ProtocolStatus): StatusUIConfig {
  return STATUS_UI_CONFIG[status] || STATUS_UI_CONFIG[ProtocolStatus.VINCULADO];
}
