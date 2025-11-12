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
