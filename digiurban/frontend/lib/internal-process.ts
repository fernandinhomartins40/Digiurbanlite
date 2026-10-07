/** Textos do processo interno (situação e histórico) */

export const PROCESS_STATUS: Record<string, { label: string; className: string }> = {
  ABERTO: { label: 'Aberto', className: 'bg-blue-100 text-blue-800' },
  EM_TRAMITE: { label: 'Em trâmite', className: 'bg-amber-100 text-amber-800' },
  CONCLUIDO: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
  ARQUIVADO: { label: 'Arquivado', className: 'bg-gray-200 text-gray-700' },
  CANCELADO: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
};

export const MOVEMENT_LABEL: Record<string, string> = {
  CRIADO: 'Aberto',
  ENCAMINHADO: 'Encaminhado',
  DEVOLVIDO: 'Devolvido',
  ATRIBUIDO: 'Passado para',
  DESPACHO: 'Despacho',
  PARECER_PEDIDO: 'Parecer pedido',
  PARECER_RESPONDIDO: 'Parecer respondido',
  CONCLUIDO: 'Concluído',
  ARQUIVADO: 'Arquivado',
  CANCELADO: 'Cancelado',
  REABERTO: 'Reaberto',
};

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}
