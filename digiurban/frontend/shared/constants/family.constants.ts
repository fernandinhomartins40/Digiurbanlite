/**
 * Constantes e helpers para composição familiar
 * Compartilhado entre frontend (admin e cidadão)
 */

export interface RelationshipOption {
  value: string
  label: string
  emoji: string
  color: string
  description?: string
}

// Configuração completa de relacionamentos
export const FAMILY_RELATIONSHIPS: Record<string, RelationshipOption> = {
  SPOUSE: {
    value: 'SPOUSE',
    label: 'Cônjuge',
    emoji: '💑',
    color: 'text-pink-600',
    description: 'Esposo(a), companheiro(a)'
  },
  SON: {
    value: 'SON',
    label: 'Filho',
    emoji: '👦',
    color: 'text-blue-600',
    description: 'Filho'
  },
  DAUGHTER: {
    value: 'DAUGHTER',
    label: 'Filha',
    emoji: '👧',
    color: 'text-pink-600',
    description: 'Filha'
  },
  FATHER: {
    value: 'FATHER',
    label: 'Pai',
    emoji: '👨',
    color: 'text-blue-700',
    description: 'Pai'
  },
  MOTHER: {
    value: 'MOTHER',
    label: 'Mãe',
    emoji: '👩',
    color: 'text-pink-700',
    description: 'Mãe'
  },
  BROTHER: {
    value: 'BROTHER',
    label: 'Irmão',
    emoji: '👦',
    color: 'text-indigo-600',
    description: 'Irmão'
  },
  SISTER: {
    value: 'SISTER',
    label: 'Irmã',
    emoji: '👧',
    color: 'text-purple-600',
    description: 'Irmã'
  },
  GRANDFATHER: {
    value: 'GRANDFATHER',
    label: 'Avô',
    emoji: '👴',
    color: 'text-gray-700',
    description: 'Avô'
  },
  GRANDMOTHER: {
    value: 'GRANDMOTHER',
    label: 'Avó',
    emoji: '👵',
    color: 'text-gray-700',
    description: 'Avó'
  },
  GRANDSON: {
    value: 'GRANDSON',
    label: 'Neto',
    emoji: '👶',
    color: 'text-blue-500',
    description: 'Neto'
  },
  GRANDDAUGHTER: {
    value: 'GRANDDAUGHTER',
    label: 'Neta',
    emoji: '👶',
    color: 'text-pink-500',
    description: 'Neta'
  },
  OTHER: {
    value: 'OTHER',
    label: 'Outro',
    emoji: '👤',
    color: 'text-gray-600',
    description: 'Outro relacionamento'
  }
}

// Array ordenado para selects
export const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  FAMILY_RELATIONSHIPS.SPOUSE,
  FAMILY_RELATIONSHIPS.SON,
  FAMILY_RELATIONSHIPS.DAUGHTER,
  FAMILY_RELATIONSHIPS.FATHER,
  FAMILY_RELATIONSHIPS.MOTHER,
  FAMILY_RELATIONSHIPS.BROTHER,
  FAMILY_RELATIONSHIPS.SISTER,
  FAMILY_RELATIONSHIPS.GRANDFATHER,
  FAMILY_RELATIONSHIPS.GRANDMOTHER,
  FAMILY_RELATIONSHIPS.GRANDSON,
  FAMILY_RELATIONSHIPS.GRANDDAUGHTER,
  FAMILY_RELATIONSHIPS.OTHER
]

// Status de vínculos
export const LINK_STATUS_CONFIG = {
  PENDING: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏱️',
    description: 'Aguardando confirmação'
  },
  ACTIVE: {
    label: 'Ativo',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
    description: 'Vínculo confirmado'
  },
  REJECTED: {
    label: 'Rejeitado',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    description: 'Vínculo rejeitado'
  }
}

// Status de convites
export const INVITE_STATUS_CONFIG = {
  PENDING: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏱️',
    description: 'Aguardando resposta'
  },
  ACCEPTED: {
    label: 'Aceito',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
    description: 'Convite aceito'
  },
  REJECTED: {
    label: 'Rejeitado',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    description: 'Convite rejeitado'
  },
  EXPIRED: {
    label: 'Expirado',
    color: 'bg-gray-200 text-gray-700',
    icon: '⏰',
    description: 'Convite expirado'
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-gray-200 text-gray-700',
    icon: '🚫',
    description: 'Convite cancelado'
  }
}

// Helper functions
export function getRelationshipLabel(relationship: string): string {
  return FAMILY_RELATIONSHIPS[relationship]?.label || relationship
}

export function getRelationshipEmoji(relationship: string): string {
  return FAMILY_RELATIONSHIPS[relationship]?.emoji || '👤'
}

export function getRelationshipColor(relationship: string): string {
  return FAMILY_RELATIONSHIPS[relationship]?.color || 'text-gray-600'
}

export function getRelationshipDescription(relationship: string): string {
  return FAMILY_RELATIONSHIPS[relationship]?.description || ''
}
