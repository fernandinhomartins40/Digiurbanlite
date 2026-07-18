/**
 * ============================================================================
 * AÇÕES CANÔNICAS DO HISTÓRICO DE PROTOCOLO
 * ============================================================================
 *
 * Fonte única para os valores de ProtocolHistorySimplified.action.
 * Antes conviviam 'CRIADO', 'CREATED', 'Protocolo criado' e 'CRIACAO' para o
 * MESMO evento — qualquer filtro/analytics por action quebrava.
 *
 * As transições de status usam STATUS_TO_ACTION (protocol-status.config.ts),
 * que já emite CRIACAO/INICIO_EXECUCAO/PENDENCIA_IDENTIFICADA/
 * ATUALIZACAO_SOLICITADA/CONCLUSAO/CANCELAMENTO.
 */
export const PROTOCOL_HISTORY_ACTIONS = {
  /** Criação do protocolo (todos os canais) */
  CREATED: 'CRIACAO',
  /** Comentário avulso de servidor */
  COMMENT: 'COMENTARIO',
  /** Atribuição a servidor */
  ASSIGNED: 'ATRIBUIDO',
  /** Cobrança de agilidade */
  REQUEST_UPDATE: 'REQUEST_UPDATE',
  /** Envio de documento */
  DOCUMENT_UPLOADED: 'DOCUMENTO_ENVIADO',
  /** Informações de pagamento registradas */
  PAYMENT_INFO_SENT: 'PAYMENT_INFO_SENT',
  /** Dados da entidade virtual atualizados */
  ENTITY_UPDATED: 'ENTITY_UPDATED',
} as const;

export type ProtocolHistoryAction =
  (typeof PROTOCOL_HISTORY_ACTIONS)[keyof typeof PROTOCOL_HISTORY_ACTIONS];
