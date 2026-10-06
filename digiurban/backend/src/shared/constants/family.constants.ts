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
  // Regras de idade para relacionamentos
  MIN_AGE_PARENT: 15, // Idade mínima para ser pai/mãe
  MIN_AGE_SPOUSE: 16, // Idade mínima para cônjuge
  MIN_AGE_GRANDPARENT: 35, // Idade mínima para ser avô/avó
  MIN_AGE_DIFFERENCE_PARENT_CHILD: 15, // Diferença mínima entre pai/mãe e filho/filha
  MAX_AGE_DIFFERENCE_SIBLINGS: 30, // Diferença máxima entre irmãos (aviso)
  MIN_AGE_DIFFERENCE_GRANDPARENT: 35, // Diferença mínima entre avô/avó e neto/neta

  // Faixas etárias
  CHILD_MAX_AGE: 18, // Idade máxima para ser considerado criança
  ELDERLY_MIN_AGE: 60, // Idade mínima para ser considerado idoso

  // Limites do sistema
  MAX_FAMILY_MEMBERS: 50,
  INVITE_EXPIRATION_DAYS: 30,
  MAX_PENDING_INVITES: 10,

  // Aliases para compatibilidade com código antigo
  MIN_HEAD_AGE: 18,
  MAX_DEPENDENT_AGE: 24,
  MIN_AGE_GAP_PARENT_CHILD: 15,
  MIN_AGE_GAP_GRANDPARENT_GRANDCHILD: 40,
}

// ============================================================================
// MENSAGENS - Estrutura FLAT para compatibilidade com backend
// ============================================================================

export const FAMILY_MESSAGES = {
  // Mensagens de sucesso
  SUCCESS_MEMBER_ADDED: 'Membro adicionado à composição familiar com sucesso',
  SUCCESS_MEMBER_UPDATED: 'Membro da família atualizado com sucesso',
  SUCCESS_MEMBER_REMOVED: 'Membro removido da composição familiar',
  SUCCESS_INVITE_SENT: 'Convite enviado com sucesso',
  SUCCESS_INVITE_ACCEPTED: 'Convite aceito com sucesso',
  SUCCESS_INVITE_REJECTED: 'Convite rejeitado',
  SUCCESS: 'Operação realizada com sucesso',

  // Mensagens de erro
  ERROR_CITIZEN_NOT_FOUND: 'Cidadão não encontrado',
  ERROR_MEMBER_NOT_FOUND: 'Membro não encontrado',
  ERROR_INVALID_RELATIONSHIP: 'Relacionamento inválido',
  ERROR_DUPLICATE_MEMBER: 'Este cidadão já está na composição familiar',
  ERROR_SELF_REFERENCE: 'Não é possível adicionar a si mesmo como membro',
  ERROR_MAX_MEMBERS_REACHED: 'Número máximo de membros atingido',
  ERROR_INVITE_EXPIRED: 'Convite expirado',
  ERROR_INVITE_NOT_FOUND: 'Convite não encontrado',
  ERROR_INVALID_TOKEN: 'Token de convite inválido',
  ERROR_CITIZEN_NOT_REGISTERED: 'Cidadão não cadastrado no sistema',
  ERROR_CANNOT_ADD_SELF: 'Não é possível adicionar a si mesmo',
  ERROR_MEMBER_ALREADY_EXISTS: 'Membro já existe na composição familiar',
  ERROR_INVITE_ACCEPTED: 'Convite já foi aceito',
  ERROR_INVITE_REJECTED: 'Convite já foi rejeitado',
  ERROR: 'Erro ao processar a operação',

  // Mensagens de aviso
  WARNING_AGE_MISMATCH: 'A idade não condiz com o relacionamento declarado',
  WARNING_YOUNG_PARENT: 'Idade muito jovem para ser pai/mãe',
  WARNING_AGE_DIFFERENCE_SIBLINGS: 'Diferença de idade significativa entre irmãos',
  WARNING_RELATIONSHIP_SUGGESTION: 'Sugestão: o relacionamento poderia ser {suggestion} baseado na idade',
}

export const RELATIONSHIP_LABELS: Record<string, string> = {
  SPOUSE: 'Cônjuge',
  SON: 'Filho',
  DAUGHTER: 'Filha',
  FATHER: 'Pai',
  MOTHER: 'Mãe',
  BROTHER: 'Irmão',
  SISTER: 'Irmã',
  GRANDFATHER: 'Avô',
  GRANDMOTHER: 'Avó',
  GRANDSON: 'Neto',
  GRANDDAUGHTER: 'Neta',
  OTHER: 'Outro',
}

// Mapa de relacionamentos reversos
export const REVERSE_RELATIONSHIPS: Record<string, string> = {
  SPOUSE: 'SPOUSE',
  SON: 'FATHER',
  DAUGHTER: 'FATHER',
  FATHER: 'SON',
  MOTHER: 'SON',
  BROTHER: 'BROTHER',
  SISTER: 'SISTER',
  GRANDFATHER: 'GRANDSON',
  GRANDMOTHER: 'GRANDSON',
  GRANDSON: 'GRANDFATHER',
  GRANDDAUGHTER: 'GRANDFATHER',
  OTHER: 'OTHER',
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
