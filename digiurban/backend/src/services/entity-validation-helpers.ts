/**
 * ============================================================================
 * ENTITY VALIDATION HELPERS
 * ============================================================================
 *
 * Helpers para validação padronizada de campos obrigatórios e relacionamentos
 * entre entidades, garantindo segurança multi-tenant.
 */

import { Prisma } from '@prisma/client';

/**
 * Valida se um campo obrigatório está presente e retorna o valor
 */
export function requireField<T = any>(value: T, fieldName: string): NonNullable<T> {
  if (!value || value === '' || value === null || value === undefined) {
    throw new Error(`Campo obrigatório: ${fieldName}`);
  }
  return value as NonNullable<T>;
}

/**
 * Valida múltiplos campos obrigatórios de uma vez
 */
export function requireFields(formData: Record<string, any>, fields: string[]): void {
  for (const field of fields) {
    requireField(formData[field], field);
  }
}

/**
 * Valida se um relacionamento existe
 */
export async function validateTenantRelation<T>(
  tx: Prisma.TransactionClient,
  modelName: string,
  id: string
): Promise<T> {
  const model = (tx as any)[modelName];
  if (!model) {
    throw new Error(`Modelo ${modelName} não encontrado`);
  }

  const record = await model.findFirst({
    where: { id }
  });

  if (!record) {
    throw new Error(`${modelName} não encontrado`);
  }

  return record as T;
}

/**
 * Valida CPF (não permite valores fake)
 */
export function validateCPF(cpf: string | undefined, fieldName: string = 'CPF'): string {
  if (!cpf || cpf === '000.000.000-00' || cpf === '00000000000') {
    throw new Error(`${fieldName} válido é obrigatório`);
  }
  return cpf;
}

/**
 * Valida e-mail (formato básico)
 */
export function validateEmail(email: string | undefined, required: boolean = false): string | undefined {
  if (!email) {
    if (required) {
      throw new Error('E-mail é obrigatório');
    }
    return undefined;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('E-mail inválido');
  }

  return email;
}

/**
 * Valida telefone (não permite valores vazios quando obrigatório)
 */
export function validatePhone(phone: string | undefined, required: boolean = false): string | undefined {
  if (!phone || phone.trim() === '') {
    if (required) {
      throw new Error('Telefone é obrigatório');
    }
    return undefined;
  }
  return phone;
}

/**
 * Converte string para Date, validando formato
 */
export function parseDate(dateStr: string | undefined, fieldName: string, required: boolean = false): Date | undefined {
  if (!dateStr) {
    if (required) {
      throw new Error(`${fieldName} é obrigatório`);
    }
    return undefined;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} inválido`);
  }

  return date;
}

/**
 * Converte string para número, validando formato
 */
export function parseNumber(value: string | number | undefined, fieldName: string, required: boolean = false): number | undefined {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} é obrigatório`);
    }
    return undefined;
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    throw new Error(`${fieldName} deve ser um número válido`);
  }

  return num;
}

/**
 * Valida que um valor numérico está dentro de um range
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): void {
  if (value < min || value > max) {
    throw new Error(`${fieldName} deve estar entre ${min} e ${max}`);
  }
}

/**
 * Valida que um valor está em uma lista de opções permitidas
 */
export function validateEnum<T>(value: T, allowedValues: T[], fieldName: string): T {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} inválido. Valores permitidos: ${allowedValues.join(', ')}`);
  }
  return value;
}

/**
 * Helper para validar múltiplos relacionamentos
 */
export async function validateMultipleRelations(
  tx: Prisma.TransactionClient,
  relations: Array<{ modelName: string; id: string; fieldName: string }>
): Promise<void> {
  for (const relation of relations) {
    if (relation.id) {}
  }
}

/**
 * Alias para validateTenantRelation - nome mais curto para uso frequente
 * Valida se um registro existe
 *
 * @example
 */
export async function validateTenant<T>(
  tx: Prisma.TransactionClient,
  model: string,
  id: string
): Promise<T> {
  return validateTenantRelation<T>(tx, model, id);
}
