/**
 * Situação do pedido com as MESMAS palavras e cores em todo o portal do cidadão
 * (início, lista de pedidos e detalhe). Antes cada tela tinha a sua tabela, com
 * nomes e cores diferentes para a mesma situação.
 */

export interface CitizenStatusInfo {
  label: string;
  className: string;
}

const MAP: Record<string, CitizenStatusInfo> = {
  VINCULADO: { label: 'Recebido', className: 'bg-yellow-100 text-yellow-800' },
  PROGRESSO: { label: 'Em andamento', className: 'bg-blue-100 text-blue-800' },
  ATUALIZACAO: { label: 'Em andamento', className: 'bg-blue-100 text-blue-800' },
  EM_ANDAMENTO: { label: 'Em andamento', className: 'bg-blue-100 text-blue-800' },
  PENDENCIA: { label: 'Aguardando você', className: 'bg-orange-100 text-orange-800' },
  CONCLUIDO: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
  CANCELADO: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700' },
};

/** `openCitizenPendings` > 0 mostra "Aguardando você" mesmo que o status ainda seja outro */
export function citizenStatusInfo(status: string, openCitizenPendings = 0): CitizenStatusInfo {
  if (openCitizenPendings > 0 && status !== 'CONCLUIDO' && status !== 'CANCELADO') return MAP.PENDENCIA;
  return MAP[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
}
