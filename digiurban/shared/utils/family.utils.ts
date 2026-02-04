/**
 * SHARED UTILS: Family Composition System
 * Utilitários compartilhados entre backend e frontend
 */

import * as crypto from 'crypto';
import { FamilyRelationship, RelationshipSuggestion } from '../types/family.types'
import { FAMILY_RELATIONSHIPS, FAMILY_VALIDATION_RULES, REVERSE_RELATIONSHIPS } from '../constants/family.constants'

// ============================================================================
// CÁLCULO DE IDADE
// ============================================================================

export function calculateAge(birthDate: Date | string | null | undefined): number | null {
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
// VALIDAÇÃO DE RELACIONAMENTO POR IDADE - Compatível com backend
// ============================================================================

export function validateRelationshipByAge(
  headAge: number | null,
  memberAge: number | null,
  relationship: FamilyRelationship
): { valid: boolean; warning?: string } {
  if (!headAge || !memberAge) {
    return { valid: true }; // Não podemos validar sem as idades
  }

  const ageDiff = Math.abs(headAge - memberAge);

  switch (relationship) {
    case 'SON':
    case 'DAUGHTER':
      // Responsável deve ser mais velho que o filho
      if (headAge < memberAge) {
        return {
          valid: false,
          warning: 'Responsável deve ser mais velho que o filho/filha',
        };
      }
      // Diferença mínima de idade
      if (headAge - memberAge < FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_PARENT_CHILD) {
        return {
          valid: true,
          warning: `Diferença de idade pequena entre pai/mãe e filho/filha (${headAge - memberAge} anos)`,
        };
      }
      break;

    case 'FATHER':
    case 'MOTHER':
      // Pai/mãe deve ser mais velho
      if (memberAge < headAge) {
        return {
          valid: false,
          warning: 'Pai/Mãe deve ser mais velho que o filho/filha',
        };
      }
      if (memberAge - headAge < FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_PARENT_CHILD) {
        return {
          valid: true,
          warning: `Diferença de idade pequena entre pai/mãe e filho/filha (${memberAge - headAge} anos)`,
        };
      }
      break;

    case 'SPOUSE':
      // Apenas aviso se diferença muito grande
      if (ageDiff > 30) {
        return {
          valid: true,
          warning: `Grande diferença de idade entre cônjuges (${ageDiff} anos)`,
        };
      }
      break;

    case 'BROTHER':
    case 'SISTER':
      if (ageDiff > FAMILY_VALIDATION_RULES.MAX_AGE_DIFFERENCE_SIBLINGS) {
        return {
          valid: true,
          warning: `Grande diferença de idade entre irmãos (${ageDiff} anos)`,
        };
      }
      break;

    case 'GRANDFATHER':
    case 'GRANDMOTHER':
      if (memberAge < headAge) {
        return {
          valid: false,
          warning: 'Avô/Avó deve ser mais velho que o neto/neta',
        };
      }
      if (memberAge - headAge < FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_GRANDPARENT) {
        return {
          valid: true,
          warning: `Diferença de idade pequena entre avô/avó e neto/neta (${memberAge - headAge} anos)`,
        };
      }
      break;

    case 'GRANDSON':
    case 'GRANDDAUGHTER':
      if (headAge < memberAge) {
        return {
          valid: false,
          warning: 'Avô/Avó deve ser mais velho que o neto/neta',
        };
      }
      if (headAge - memberAge < FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_GRANDPARENT) {
        return {
          valid: true,
          warning: `Diferença de idade pequena entre avô/avó e neto/neta (${headAge - memberAge} anos)`,
        };
      }
      break;
  }

  return { valid: true };
}

// ============================================================================
// SUGESTÃO DE RELACIONAMENTO POR IDADE
// ============================================================================

export function suggestRelationshipByAge(
  headAge: number | null,
  memberAge: number | null
): FamilyRelationship | null {
  if (!headAge || !memberAge) return null;

  const ageDiff = headAge - memberAge;

  // Responsável é mais velho
  if (ageDiff >= FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_GRANDPARENT) {
    return 'GRANDSON'; // ou GRANDDAUGHTER
  } else if (ageDiff >= FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_PARENT_CHILD) {
    return 'SON'; // ou DAUGHTER
  }

  // Membro é mais velho
  if (ageDiff <= -FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_GRANDPARENT) {
    return 'GRANDFATHER'; // ou GRANDMOTHER
  } else if (ageDiff <= -FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_PARENT_CHILD) {
    return 'FATHER'; // ou MOTHER
  }

  // Idades próximas
  if (Math.abs(ageDiff) < 10) {
    return 'BROTHER'; // ou SISTER
  }

  return null;
}

// Função alternativa que retorna lista de sugestões (para frontend)
export const suggestRelationshipsByAge = (
  memberAge: number | null,
  headAge: number | null
): RelationshipSuggestion[] => {
  if (memberAge === null || headAge === null) {
    return []
  }

  const suggestions: RelationshipSuggestion[] = []
  const ageDiff = headAge - memberAge

  // Filho/Filha
  if (ageDiff >= FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_PARENT_CHILD && ageDiff <= 50) {
    suggestions.push({
      relationship: 'SON',
      confidence: 0.8,
      reason: `Diferença de idade compatível com filho (${ageDiff} anos)`
    })
  }

  // Pai/Mãe
  if (ageDiff <= -FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_PARENT_CHILD && ageDiff >= -50) {
    suggestions.push({
      relationship: 'FATHER',
      confidence: 0.8,
      reason: `Diferença de idade compatível com pai (${Math.abs(ageDiff)} anos)`
    })
  }

  // Neto/Neta
  if (ageDiff >= FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_GRANDPARENT) {
    suggestions.push({
      relationship: 'GRANDSON',
      confidence: 0.7,
      reason: `Diferença de idade compatível com neto (${ageDiff} anos)`
    })
  }

  // Avô/Avó
  if (ageDiff <= -FAMILY_VALIDATION_RULES.MIN_AGE_DIFFERENCE_GRANDPARENT) {
    suggestions.push({
      relationship: 'GRANDFATHER',
      confidence: 0.7,
      reason: `Diferença de idade compatível com avô (${Math.abs(ageDiff)} anos)`
    })
  }

  // Cônjuge
  if (Math.abs(ageDiff) <= 15) {
    suggestions.push({
      relationship: 'SPOUSE',
      confidence: 0.6,
      reason: `Idades próximas, compatível com cônjuge`
    })
  }

  // Irmão/Irmã
  if (Math.abs(ageDiff) <= 20) {
    suggestions.push({
      relationship: 'BROTHER',
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
// GERAÇÃO DE TOKEN ÚNICO - Compatível com backend
// ============================================================================

export function generateInviteToken(): string {
  // Usar crypto se disponível (Node.js), senão usar fallback
  if (typeof crypto !== 'undefined' && crypto.randomBytes) {
    return crypto.randomBytes(32).toString('hex');
  }

  // Fallback para navegadores
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''

  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return token
}

// ============================================================================
// CÁLCULO DE EXPIRAÇÃO
// ============================================================================

export function calculateExpirationDate(days: number = FAMILY_VALIDATION_RULES.INVITE_EXPIRATION_DAYS): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

export function isExpired(expirationDate: Date | string | null): boolean {
  if (!expirationDate) return true;
  return new Date() > new Date(expirationDate);
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

export function getReverseRelationship(relationship: FamilyRelationship): FamilyRelationship {
  return (REVERSE_RELATIONSHIPS[relationship] as FamilyRelationship) || 'OTHER';
}

// ============================================================================
// FORMATAÇÃO DE RELACIONAMENTO
// ============================================================================

export function formatRelationship(relationship: FamilyRelationship): string {
  const labels: Record<FamilyRelationship, string> = {
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
  };
  return labels[relationship] || relationship;
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
