/**
 * Situação do pedido com as MESMAS palavras e cores em todo o portal do cidadão
 * (início, lista de pedidos e detalhe). Vem da tabela de sentidos (lib/senses.ts).
 */
import { protocolSense } from './senses';

export interface CitizenStatusInfo {
  label: string;
  className: string;
}

/** `openCitizenPendings` > 0 mostra "Aguardando você" mesmo que o status ainda seja outro */
export function citizenStatusInfo(status: string, openCitizenPendings = 0): CitizenStatusInfo {
  return protocolSense(status, 'citizen', openCitizenPendings > 0);
}
