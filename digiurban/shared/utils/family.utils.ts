/**
 * SHARED UTILS: Family Composition System
 * Utilitários compartilhados entre backend e frontend
 */

import { FamilyRelationship, ValidationWarning, RelationshipSuggestion } from '../types/family.types'
import { FAMILY_RELATIONSHIPS, FAMILY_VALIDATION_RULES } from '../constants/family.constants'

// ============================================================================
// CÁLCULO DE IDADE
// ============================================================================

export const calculateAge = (birthDate: Date | string | null | undefined): number | null => {
  if (!birthDate) return null

  const birth = new Date(birthDate)
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export const formatAge = (birthDate: Date | string | null | undefined): string => {
  const age = calculateAge(birthDate)
  if (age === null) return '-'
  if (age === 0) return 'Menos de 1 ano'
  if (age === 1) return '1 ano'
  return `${age} anos`
}

// ============================================================================
// CLASSIFICAÇÃO POR IDADE
// ============================================================================

export const isChild = (birthDate: Date | string | null | undefined): boolean => {
  const age = calculateAge(birthDate)
  return age !== null && age <= FAMILY_VALIDATION_RULES.CHILD_MAX_AGE
}

export const isElderly = (birthDate: Date | string | null | undefined): boolean => {
  const age = calculateAge(birthDate)
  return age !== null && age >= FAMILY_VALIDATION_RULES.ELDERLY_MIN_AGE
}

export const canBeDependent = (birthDate: Date | string | null | undefined): boolean => {
  const age = calculateAge(birthDate)
  return age !== null && age <= FAMILY_VALIDATION_RULES.MAX_DEPENDENT_AGE
}

export const canBeHead = (birthDate: Date | string | null | undefined): boolean => {
  const age = calculateAge(birthDate)
  return age !== null && age >= FAMILY_VALIDATION_RULES.MIN_HEAD_AGE
}

// ============================================================================
// VALIDAÇÃO DE RELACIONAMENTO POR IDADE
// ============================================================================

export const validateRelationshipByAge = (
  relationship: FamilyRelationship,
  memberBirthDate: Date | string | null | undefined,
  headBirthDate?: Date | string | null | undefined
): ValidationWarning[] => {
  const warnings: ValidationWarning[] = []
  const memberAge = calculateAge(memberBirthDate)
  const headAge = headBirthDate ? calculateAge(headBirthDate) : null

  if (memberAge === null) {
    return warnings
  }

  const relationshipConfig = FAMILY_RELATIONSHIPS[relationship]
  const { typicalAgeRange } = relationshipConfig

  // Validar faixa etária típica
  if (typicalAgeRange) {
    if (memberAge < typicalAgeRange.min) {
      warnings.push({
        field: 'relationship',
        message: `Idade muito baixa para o relacionamento "${relationshipConfig.label}". Esperado: mínimo ${typicalAgeRange.min} anos.`,
        severity: 'warning'
      })
    }
    if (memberAge > typicalAgeRange.max) {
      warnings.push({
        field: 'relationship',
        message: `Idade muito alta para o relacionamento "${relationshipConfig.label}". Esperado: máximo ${typicalAgeRange.max} anos.`,
        severity: 'warning'
      })
    }
  }

  // Validações específicas com diferença de idade
  if (headAge !== null) {
    const ageDiff = headAge - memberAge

    switch (relationship) {
      case FamilyRelationship.SON:
      case FamilyRelationship.DAUGHTER:
        if (ageDiff < FAMILY_VALIDATION_RULES.MIN_AGE_GAP_PARENT_CHILD) {
          warnings.push({
            field: 'relationship',
            message: `Diferença de idade muito pequena entre responsável e filho(a). Mínimo recomendado: ${FAMILY_VALIDATION_RULES.MIN_AGE_GAP_PARENT_CHILD} anos.`,
            severity: 'warning'
          })
        }
        if (ageDiff < 0) {
          warnings.push({
            field: 'relationship',
            message: 'Filho(a) não pode ser mais velho(a) que o responsável.',
            severity: 'error'
          })
        }
        break

      case FamilyRelationship.FATHER:
      case FamilyRelationship.MOTHER:
        if (ageDiff > -FAMILY_VALIDATION_RULES.MIN_AGE_GAP_PARENT_CHILD) {
          warnings.push({
            field: 'relationship',
            message: `Diferença de idade muito pequena. Pai/Mãe geralmente é mais velho(a) que o filho(a).`,
            severity: 'warning'
          })
        }
        if (ageDiff > 0) {
          warnings.push({
            field: 'relationship',
            message: 'Pai/Mãe não pode ser mais jovem que o filho(a).',
            severity: 'error'
          })
        }
        break

      case FamilyRelationship.GRANDSON:
      case FamilyRelationship.GRANDDAUGHTER:
        if (ageDiff < FAMILY_VALIDATION_RULES.MIN_AGE_GAP_GRANDPARENT_GRANDCHILD) {
          warnings.push({
            field: 'relationship',
            message: `Diferença de idade muito pequena para neto(a). Mínimo recomendado: ${FAMILY_VALIDATION_RULES.MIN_AGE_GAP_GRANDPARENT_GRANDCHILD} anos.`,
            severity: 'warning'
          })
        }
        break

      case FamilyRelationship.GRANDFATHER:
      case FamilyRelationship.GRANDMOTHER:
        if (ageDiff > -FAMILY_VALIDATION_RULES.MIN_AGE_GAP_GRANDPARENT_GRANDCHILD) {
          warnings.push({
            field: 'relationship',
            message: `Diferença de idade muito pequena para avô/avó. Mínimo recomendado: ${FAMILY_VALIDATION_RULES.MIN_AGE_GAP_GRANDPARENT_GRANDCHILD} anos.`,
            severity: 'warning'
          })
        }
        break

      case FamilyRelationship.SPOUSE:
        const absDiff = Math.abs(ageDiff)
        if (absDiff > 30) {
          warnings.push({
            field: 'relationship',
            message: `Diferença de idade significativa entre cônjuges (${absDiff} anos).`,
            severity: 'warning'
          })
        }
        break
    }
  }

  return warnings
}

// ============================================================================
// SUGESTÃO DE RELACIONAMENTO POR IDADE
// ============================================================================

export const suggestRelationshipByAge = (
  memberAge: number | null,
  headAge: number | null
): RelationshipSuggestion[] => {
  if (memberAge === null || headAge === null) {
    return []
  }

  const suggestions: RelationshipSuggestion[] = []
  const ageDiff = headAge - memberAge

  // Filho/Filha
  if (ageDiff >= FAMILY_VALIDATION_RULES.MIN_AGE_GAP_PARENT_CHILD && ageDiff <= 50) {
    suggestions.push({
      relationship: FamilyRelationship.SON,
      confidence: 0.8,
      reason: `Diferença de idade compatível com filho (${ageDiff} anos)`
    })
  }

  // Pai/Mãe
  if (ageDiff <= -FAMILY_VALIDATION_RULES.MIN_AGE_GAP_PARENT_CHILD && ageDiff >= -50) {
    suggestions.push({
      relationship: FamilyRelationship.FATHER,
      confidence: 0.8,
      reason: `Diferença de idade compatível com pai (${Math.abs(ageDiff)} anos)`
    })
  }

  // Neto/Neta
  if (ageDiff >= FAMILY_VALIDATION_RULES.MIN_AGE_GAP_GRANDPARENT_GRANDCHILD) {
    suggestions.push({
      relationship: FamilyRelationship.GRANDSON,
      confidence: 0.7,
      reason: `Diferença de idade compatível com neto (${ageDiff} anos)`
    })
  }

  // Avô/Avó
  if (ageDiff <= -FAMILY_VALIDATION_RULES.MIN_AGE_GAP_GRANDPARENT_GRANDCHILD) {
    suggestions.push({
      relationship: FamilyRelationship.GRANDFATHER,
      confidence: 0.7,
      reason: `Diferença de idade compatível com avô (${Math.abs(ageDiff)} anos)`
    })
  }

  // Cônjuge
  if (Math.abs(ageDiff) <= 15) {
    suggestions.push({
      relationship: FamilyRelationship.SPOUSE,
      confidence: 0.6,
      reason: `Idades próximas, compatível com cônjuge`
    })
  }

  // Irmão/Irmã
  if (Math.abs(ageDiff) <= 20) {
    suggestions.push({
      relationship: FamilyRelationship.BROTHER,
      confidence: 0.5,
      reason: `Idades próximas, compatível com irmão`
    })
  }

  // Ordenar por confiança
  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

// ============================================================================
// FORMATAÇÃO DE CPF
// ============================================================================

export const formatCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return '-'

  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) return cpf

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export const unformatCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '')
}

// ============================================================================
// FORMATAÇÃO DE TELEFONE
// ============================================================================

export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '-'

  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return phone
}

// ============================================================================
// FORMATAÇÃO DE MOEDA
// ============================================================================

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// ============================================================================
// GERAÇÃO DE TOKEN ÚNICO
// ============================================================================

export const generateInviteToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''

  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return token
}

// ============================================================================
// CÁLCULO DE EXPIRAÇÃO
// ============================================================================

export const calculateExpirationDate = (days: number = FAMILY_VALIDATION_RULES.INVITE_EXPIRATION_DAYS): Date => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

export const isExpired = (expiresAt: Date | string): boolean => {
  const expiration = new Date(expiresAt)
  return expiration < new Date()
}

export const getDaysUntilExpiration = (expiresAt: Date | string): number => {
  const expiration = new Date(expiresAt)
  const now = new Date()
  const diff = expiration.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ============================================================================
// RELACIONAMENTO REVERSO
// ============================================================================

export const getReverseRelationship = (relationship: FamilyRelationship): FamilyRelationship | null => {
  return FAMILY_RELATIONSHIPS[relationship]?.reverseRelationship || null
}

// ============================================================================
// VALIDAÇÃO DE EMAIL
// ============================================================================

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

export const calculateIncomePerCapita = (totalIncome: number, totalMembers: number): number => {
  if (totalMembers === 0) return 0
  return totalIncome / totalMembers
}
