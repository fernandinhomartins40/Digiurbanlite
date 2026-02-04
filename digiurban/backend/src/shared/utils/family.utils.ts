/**
 * FAMILY UTILS: Funções utilitárias para composição familiar
 */

import * as crypto from 'crypto';
import { FamilyRelationship } from '../types/family.types';
import {
  FAMILY_VALIDATION_RULES,
  REVERSE_RELATIONSHIPS,
} from '../constants/family.constants';

/**
 * Calcula a idade de uma pessoa a partir da data de nascimento
 */
export function calculateAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Valida se o relacionamento é apropriado baseado nas idades
 */
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

/**
 * Sugere relacionamentos baseado nas idades
 */
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

/**
 * Gera um token seguro para convites
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calcula a data de expiração de um convite
 */
export function calculateExpirationDate(days: number = FAMILY_VALIDATION_RULES.INVITE_EXPIRATION_DAYS): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Verifica se uma data já expirou
 */
export function isExpired(expirationDate: Date | null): boolean {
  if (!expirationDate) return true;
  return new Date() > new Date(expirationDate);
}

/**
 * Retorna o relacionamento reverso
 * Ex: Se A é PAI de B, então B é FILHO de A
 */
export function getReverseRelationship(relationship: FamilyRelationship): FamilyRelationship {
  return (REVERSE_RELATIONSHIPS[relationship] as FamilyRelationship) || 'OTHER';
}

/**
 * Formata um relacionamento para exibição
 */
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
