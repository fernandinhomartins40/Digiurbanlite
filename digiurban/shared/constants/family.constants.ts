/**
 * SHARED CONSTANTS: Family Composition System
 * Constantes compartilhadas entre backend e frontend
 */

import { FamilyRelationship } from '../types/family.types'

// ============================================================================
// RELACIONAMENTOS
// ============================================================================

export interface RelationshipConfig {
  value: FamilyRelationship
  label: string
  labelPlural: string
  emoji: string
  color: string
  description: string
  reverseRelationship?: FamilyRelationship
  typicalAgeRange?: { min: number; max: number }
}

export const FAMILY_RELATIONSHIPS: Record<FamilyRelationship, RelationshipConfig> = {
  [FamilyRelationship.SPOUSE]: {
    value: FamilyRelationship.SPOUSE,
    label: 'Cônjuge',
    labelPlural: 'Cônjuges',
    emoji: '💑',
    color: '#EC4899',
    description: 'Esposo(a), Companheiro(a)',
    reverseRelationship: FamilyRelationship.SPOUSE,
    typicalAgeRange: { min: 18, max: 100 }
  },
  [FamilyRelationship.SON]: {
    value: FamilyRelationship.SON,
    label: 'Filho',
    labelPlural: 'Filhos',
    emoji: '👦',
    color: '#3B82F6',
    description: 'Filho',
    reverseRelationship: FamilyRelationship.FATHER,
    typicalAgeRange: { min: 0, max: 80 }
  },
  [FamilyRelationship.DAUGHTER]: {
    value: FamilyRelationship.DAUGHTER,
    label: 'Filha',
    labelPlural: 'Filhas',
    emoji: '👧',
    color: '#EC4899',
    description: 'Filha',
    reverseRelationship: FamilyRelationship.MOTHER,
    typicalAgeRange: { min: 0, max: 80 }
  },
  [FamilyRelationship.FATHER]: {
    value: FamilyRelationship.FATHER,
    label: 'Pai',
    labelPlural: 'Pais',
    emoji: '👨',
    color: '#6366F1',
    description: 'Pai',
    reverseRelationship: FamilyRelationship.SON,
    typicalAgeRange: { min: 18, max: 100 }
  },
  [FamilyRelationship.MOTHER]: {
    value: FamilyRelationship.MOTHER,
    label: 'Mãe',
    labelPlural: 'Mães',
    emoji: '👩',
    color: '#8B5CF6',
    description: 'Mãe',
    reverseRelationship: FamilyRelationship.DAUGHTER,
    typicalAgeRange: { min: 18, max: 100 }
  },
  [FamilyRelationship.BROTHER]: {
    value: FamilyRelationship.BROTHER,
    label: 'Irmão',
    labelPlural: 'Irmãos',
    emoji: '👨‍🦱',
    color: '#14B8A6',
    description: 'Irmão',
    reverseRelationship: FamilyRelationship.BROTHER,
    typicalAgeRange: { min: 0, max: 100 }
  },
  [FamilyRelationship.SISTER]: {
    value: FamilyRelationship.SISTER,
    label: 'Irmã',
    labelPlural: 'Irmãs',
    emoji: '👩‍🦱',
    color: '#06B6D4',
    description: 'Irmã',
    reverseRelationship: FamilyRelationship.SISTER,
    typicalAgeRange: { min: 0, max: 100 }
  },
  [FamilyRelationship.GRANDFATHER]: {
    value: FamilyRelationship.GRANDFATHER,
    label: 'Avô',
    labelPlural: 'Avôs',
    emoji: '👴',
    color: '#F59E0B',
    description: 'Avô',
    reverseRelationship: FamilyRelationship.GRANDSON,
    typicalAgeRange: { min: 45, max: 100 }
  },
  [FamilyRelationship.GRANDMOTHER]: {
    value: FamilyRelationship.GRANDMOTHER,
    label: 'Avó',
    labelPlural: 'Avós',
    emoji: '👵',
    color: '#F97316',
    description: 'Avó',
    reverseRelationship: FamilyRelationship.GRANDDAUGHTER,
    typicalAgeRange: { min: 45, max: 100 }
  },
  [FamilyRelationship.GRANDSON]: {
    value: FamilyRelationship.GRANDSON,
    label: 'Neto',
    labelPlural: 'Netos',
    emoji: '👶',
    color: '#84CC16',
    description: 'Neto',
    reverseRelationship: FamilyRelationship.GRANDFATHER,
    typicalAgeRange: { min: 0, max: 50 }
  },
  [FamilyRelationship.GRANDDAUGHTER]: {
    value: FamilyRelationship.GRANDDAUGHTER,
    label: 'Neta',
    labelPlural: 'Netas',
    emoji: '👶',
    color: '#22C55E',
    description: 'Neta',
    reverseRelationship: FamilyRelationship.GRANDMOTHER,
    typicalAgeRange: { min: 0, max: 50 }
  },
  [FamilyRelationship.OTHER]: {
    value: FamilyRelationship.OTHER,
    label: 'Outro',
    labelPlural: 'Outros',
    emoji: '👤',
    color: '#6B7280',
    description: 'Outro tipo de relacionamento',
    typicalAgeRange: { min: 0, max: 100 }
  }
}

// Lista de relacionamentos para selects (ordenada)
export const RELATIONSHIP_OPTIONS = [
  FAMILY_RELATIONSHIPS[FamilyRelationship.SPOUSE],
  FAMILY_RELATIONSHIPS[FamilyRelationship.SON],
  FAMILY_RELATIONSHIPS[FamilyRelationship.DAUGHTER],
  FAMILY_RELATIONSHIPS[FamilyRelationship.FATHER],
  FAMILY_RELATIONSHIPS[FamilyRelationship.MOTHER],
  FAMILY_RELATIONSHIPS[FamilyRelationship.BROTHER],
  FAMILY_RELATIONSHIPS[FamilyRelationship.SISTER],
  FAMILY_RELATIONSHIPS[FamilyRelationship.GRANDFATHER],
  FAMILY_RELATIONSHIPS[FamilyRelationship.GRANDMOTHER],
  FAMILY_RELATIONSHIPS[FamilyRelationship.GRANDSON],
  FAMILY_RELATIONSHIPS[FamilyRelationship.GRANDDAUGHTER],
  FAMILY_RELATIONSHIPS[FamilyRelationship.OTHER]
]

// ============================================================================
// STATUS DE VÍNCULO
// ============================================================================

export const LINK_STATUS_CONFIG = {
  PENDING: {
    label: 'Pendente',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '⏳',
    description: 'Aguardando confirmação'
  },
  ACTIVE: {
    label: 'Ativo',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: '✓',
    description: 'Vínculo confirmado'
  },
  REJECTED: {
    label: 'Rejeitado',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: '✗',
    description: 'Vínculo rejeitado'
  }
}

// ============================================================================
// STATUS DE CONVITE
// ============================================================================

export const INVITE_STATUS_CONFIG = {
  PENDING: {
    label: 'Aguardando',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '📧',
    description: 'Convite enviado'
  },
  ACCEPTED: {
    label: 'Aceito',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: '✓',
    description: 'Convite aceito'
  },
  REJECTED: {
    label: 'Recusado',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: '✗',
    description: 'Convite recusado'
  },
  EXPIRED: {
    label: 'Expirado',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '⌛',
    description: 'Convite expirou'
  },
  CANCELLED: {
    label: 'Cancelado',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '🚫',
    description: 'Convite cancelado'
  }
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

export const FAMILY_VALIDATION_RULES = {
  // Idade mínima para ser responsável
  MIN_HEAD_AGE: 18,

  // Idade máxima para ser dependente
  MAX_DEPENDENT_AGE: 24,

  // Idade considerada criança
  CHILD_MAX_AGE: 12,

  // Idade considerada idoso
  ELDERLY_MIN_AGE: 60,

  // Diferença mínima de idade entre gerações (anos)
  MIN_AGE_GAP_PARENT_CHILD: 15,
  MIN_AGE_GAP_GRANDPARENT_GRANDCHILD: 40,

  // Duração do convite (dias)
  INVITE_EXPIRATION_DAYS: 7,

  // Limite de membros na família
  MAX_FAMILY_MEMBERS: 20
}

// ============================================================================
// MENSAGENS
// ============================================================================

export const FAMILY_MESSAGES = {
  SUCCESS: {
    MEMBER_ADDED: 'Membro adicionado à família com sucesso',
    MEMBER_UPDATED: 'Informações do membro atualizadas',
    MEMBER_REMOVED: 'Membro removido da família',
    INVITE_SENT: 'Convite enviado com sucesso',
    INVITE_ACCEPTED: 'Convite aceito! Vínculo familiar criado',
    INVITE_REJECTED: 'Convite recusado',
    INVITE_CANCELLED: 'Convite cancelado',
    LINK_CONFIRMED: 'Vínculo familiar confirmado'
  },
  ERROR: {
    MEMBER_NOT_FOUND: 'Cidadão não encontrado no sistema',
    MEMBER_ALREADY_EXISTS: 'Este membro já faz parte da composição familiar',
    CANNOT_ADD_SELF: 'Você não pode adicionar a si mesmo como membro da família',
    INVITE_NOT_FOUND: 'Convite não encontrado ou expirado',
    INVITE_EXPIRED: 'Este convite expirou',
    INVALID_TOKEN: 'Token de convite inválido',
    MAX_MEMBERS_REACHED: 'Limite máximo de membros atingido',
    INVALID_RELATIONSHIP: 'Relacionamento inválido',
    CITIZEN_NOT_REGISTERED: 'Cidadão não cadastrado. Solicite que ele se cadastre primeiro ou envie um convite.'
  },
  WARNING: {
    AGE_MISMATCH: (relationship: string) =>
      `A idade do cidadão pode não ser compatível com o relacionamento "${relationship}"`,
    YOUNG_HEAD: 'O responsável da família é muito jovem (menor de 18 anos)',
    PENDING_CONFIRMATION: 'Este vínculo está aguardando confirmação do membro',
    INVITE_WILL_EXPIRE: (days: number) =>
      `Este convite expirará em ${days} dia(s)`
  },
  INFO: {
    INVITE_INSTRUCTION: 'Envie um convite por email para que o familiar se cadastre e aceite o vínculo',
    MEMBER_WILL_BE_NOTIFIED: 'O membro será notificado sobre o vínculo e precisará confirmar',
    SEARCH_CITIZEN_HELP: 'Busque pelo nome, CPF ou email do cidadão já cadastrado no sistema'
  }
}

// ============================================================================
// HELPERS DE TEXTO
// ============================================================================

export const getRelationshipLabel = (relationship: FamilyRelationship): string => {
  return FAMILY_RELATIONSHIPS[relationship]?.label || relationship
}

export const getRelationshipEmoji = (relationship: FamilyRelationship): string => {
  return FAMILY_RELATIONSHIPS[relationship]?.emoji || '👤'
}

export const getRelationshipColor = (relationship: FamilyRelationship): string => {
  return FAMILY_RELATIONSHIPS[relationship]?.color || '#6B7280'
}
