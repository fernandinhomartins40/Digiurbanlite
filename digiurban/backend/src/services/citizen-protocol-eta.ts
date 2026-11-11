/**
 * "Para quando é" do pedido, do jeito que o cidadão vê (portal: lista, Início e
 * tela do pedido). Mesma regra de atraso do prazo (protocol-sla.service:
 * atrasado = não pausado e passou da data prevista), sem depender da rotina
 * que grava `isOverdue`.
 */

const CLOSED = new Set(['CONCLUIDO', 'CANCELADO']);

export interface CitizenProtocolEta {
  /** data prevista (ProtocolSLA.expectedEndDate); null quando encerrado ou sem prazo */
  expectedEndDate: Date | null;
  /** passou da data prevista e o pedido não está esperando o cidadão */
  isLate: boolean;
  /** prazo parado esperando o cidadão (pendência) */
  slaPaused: boolean;
}

export function citizenProtocolEta(
  status: string,
  sla: { expectedEndDate: Date; isPaused?: boolean | null } | null | undefined,
  now: Date = new Date()
): CitizenProtocolEta {
  if (!sla || CLOSED.has(status)) return { expectedEndDate: null, isLate: false, slaPaused: false };
  const slaPaused = !!sla.isPaused;
  const expectedEndDate = new Date(sla.expectedEndDate);
  return { expectedEndDate, isLate: !slaPaused && now > expectedEndDate, slaPaused };
}
