import { protocolSense, senseClass } from './senses';
/**
 * Configuração e helpers para prioridades de protocolos
 * Backend usa INT (1-5), aqui mapeamos para labels e cores
 */

export const PRIORITY_CONFIG = {
  1: {
    label: 'Muito Baixa',
    color: 'gray',
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: '⬇️'
  },
  2: {
    label: 'Baixa',
    color: 'blue',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '📘'
  },
  3: {
    label: 'Normal',
    color: 'yellow',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '📙'
  },
  4: {
    label: 'Alta',
    color: 'orange',
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '⚠️'
  },
  5: {
    label: 'Crítica',
    color: 'red',
    badge: 'bg-red-100 text-red-800 border-red-300',
    icon: '🔥'
  },
} as const;

export function getPriorityConfig(priority: number) {
  return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[3];
}

export function getPriorityLabel(priority: number): string {
  return getPriorityConfig(priority).label;
}

export function getPriorityBadgeClass(priority: number): string {
  return getPriorityConfig(priority).badge;
}

export function getPriorityIcon(priority: number): string {
  return getPriorityConfig(priority).icon;
}

export function getPriorityColor(priority: number): string {
  return getPriorityConfig(priority).color;
}

/**
 * Status de protocolo (enum ProtocolStatus do backend) — rótulos para servidores
 */
// Palavras e cores vêm da tabela de sentidos (lib/senses.ts): uma só no produto inteiro
const STATUSES = ['VINCULADO', 'PROGRESSO', 'ATUALIZACAO', 'PENDENCIA', 'CONCLUIDO', 'CANCELADO'];
export const PROTOCOL_STATUS_LABELS: Record<string, string> = Object.fromEntries(STATUSES.map((st) => [st, protocolSense(st).label]));
export const PROTOCOL_STATUS_COLORS: Record<string, string> = Object.fromEntries(STATUSES.map((st) => [st, protocolSense(st).className]));

export function getProtocolStatusLabel(status: string): string {
  return PROTOCOL_STATUS_LABELS[status] || status;
}

export function getProtocolStatusClass(status: string): string {
  return PROTOCOL_STATUS_COLORS[status] || senseClass('off');
}

export interface ProtocolSlaSnapshot {
  expectedEndDate?: string | null;
  actualEndDate?: string | null;
  isPaused?: boolean;
}

export type SlaTone = 'overdue' | 'due_soon' | 'ok' | 'paused';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Situação do prazo para exibir na fila sem abrir o protocolo.
 * Retorna null para protocolos encerrados ou sem SLA.
 */
export function getSlaInfo(
  sla: ProtocolSlaSnapshot | null | undefined,
  status: string,
  now: Date = new Date()
): { tone: SlaTone; label: string; className: string } | null {
  if (!sla?.expectedEndDate || sla.actualEndDate) return null;
  if (status === 'CONCLUIDO' || status === 'CANCELADO') return null;

  if (sla.isPaused) {
    return { tone: 'paused', label: 'Prazo pausado', className: senseClass('off') };
  }

  const due = new Date(sla.expectedEndDate);
  const diff = due.getTime() - now.getTime();

  if (diff < 0) {
    const days = Math.max(1, Math.ceil(-diff / DAY_MS));
    return {
      tone: 'overdue',
      label: `Atrasado há ${days} dia${days > 1 ? 's' : ''}`,
      className: senseClass('late'),
    };
  }

  if (diff <= 2 * DAY_MS) {
    // Dias de calendário (não blocos de 24h) para "hoje/amanhã" serem literais
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOf(due) - startOf(now)) / DAY_MS);
    const label = days === 0 ? 'Vence hoje' : days === 1 ? 'Vence amanhã' : `Vence em ${days} dias`;
    return { tone: 'due_soon', label, className: senseClass('soon') };
  }

  return {
    tone: 'ok',
    label: `Prazo ${due.toLocaleDateString('pt-BR')}`,
    className: senseClass('off'),
  };
}
