/**
 * Tabela de sentidos: cada situação tem UMA cor e UMA palavra no produto inteiro.
 * As cores ficam em app/liquid-glass.css (.sense-*). Vermelho = atrasado; nada mais.
 */
export type Sense = 'late' | 'soon' | 'waiting' | 'progress' | 'done' | 'off';

export const senseClass = (sense: Sense, plain = false) => `sense sense-${sense}${plain ? ' sense-text' : ''}`;

export interface SenseInfo { sense: Sense; label: string; className: string }

const info = (sense: Sense, label: string): SenseInfo => ({ sense, label, className: senseClass(sense) });

/** Situação do protocolo/pedido. `citizen` troca as palavras ("Aguardando você", "Pronto") */
export function protocolSense(status: string, audience: 'server' | 'citizen' = 'server', waitingCitizen = false): SenseInfo {
  const citizen = audience === 'citizen';
  if (status === 'CONCLUIDO') return info('done', citizen ? 'Pronto' : 'Concluído');
  if (status === 'CANCELADO') return info('off', 'Cancelado');
  if (waitingCitizen || status === 'PENDENCIA') return info('waiting', citizen ? 'Aguardando você' : 'Aguardando cidadão');
  if (status === 'VINCULADO') return info('progress', citizen ? 'Recebido' : 'Novo');
  return info('progress', 'Em andamento');
}
