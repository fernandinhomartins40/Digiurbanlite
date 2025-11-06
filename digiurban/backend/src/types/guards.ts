// Type Guards e Helpers para validação de tipos
import { Request } from 'express';
import { UserWithRelations, AuthenticatedRequest } from '../types';

// Tipos para agregações Prisma
type PrismaCountResult = {
  _count: { _all: number };
};

type PrismaAggregateCount = {
  _count: number;
};

type PrismaAggregateSum<T> = {
  _sum: Record<string, T>;
};

/**
 * Type Guards para autenticação
 */
export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}

export function ensureAuthenticated(req: Request): asserts req is AuthenticatedRequest {
  if (!req.user) {
    throw new Error('Usuário não autenticado');
  }
}

// REMOVED: ensureTenant - Single-tenant mode doesn't need tenant validation

export function ensureUser(req: Request): asserts req is Request & { user: UserWithRelations } {
  if (!req.user) {
    throw new Error('Usuário não encontrado na requisição');
  }
}

/**
 * Type Guards para agregações Prisma
 */
export function hasSumResult<T extends Record<string, unknown>>(
  result: T | null | undefined,
  field: keyof T
): result is T & { [K in keyof T]: NonNullable<T[K]> } {
  return (
    result !== null && result !== undefined && result[field] !== undefined && result[field] !== null
  );
}

export function hasCountResult(result: unknown): result is PrismaCountResult {
  return (
    result !== null &&
    result !== undefined &&
    typeof result === 'object' &&
    '_count' in result &&
    typeof (result as PrismaCountResult)._count === 'object' &&
    '_all' in (result as PrismaCountResult)._count &&
    typeof (result as PrismaCountResult)._count._all === 'number'
  );
}

export function extractSumValue<T>(
  result: { _sum: T } | null | undefined,
  defaultValue: NonNullable<T>
): NonNullable<T> {
  if (!result?._sum || result._sum === null || result._sum === undefined) {
    return defaultValue;
  }
  return result._sum as NonNullable<T>;
}

export function extractCountValue(
  result: { _count?: { _all?: number } | boolean } | null | undefined,
  defaultValue: number = 0
): number {
  if (!result?._count) {
    return defaultValue;
  }

  if (typeof result._count === 'boolean') {
    return defaultValue;
  }

  return result._count._all ?? defaultValue;
}

/**
 * Helper para validação de propriedades nullable/undefined
 */
export function ensureValue<T>(
  value: T | null | undefined,
  errorMessage: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(errorMessage);
  }
}

export function getValueOrDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}

/**
 * Type Guards para validação de objetos
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isNotEmpty<T>(value: T[] | undefined | null): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

export function isValidString(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidNumber(value: number | undefined | null): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Helpers para conversão segura de tipos
 */
export function safeParseInt(
  value: string | number | undefined | null,
  defaultValue: number = 0
): number {
  if (typeof value === 'number') {
    return isValidNumber(value) ? value : defaultValue;
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isValidNumber(parsed) ? parsed : defaultValue;
  }

  return defaultValue;
}

export function safeParseFloat(
  value: string | number | undefined | null,
  defaultValue: number = 0
): number {
  if (typeof value === 'number') {
    return isValidNumber(value) ? value : defaultValue;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isValidNumber(parsed) ? parsed : defaultValue;
  }

  return defaultValue;
}

/**
 * Type Guards específicos para modelos Prisma
 */
export function hasAggregateCount(result: unknown): result is PrismaAggregateCount {
  return (
    result !== null &&
    result !== undefined &&
    typeof result === 'object' &&
    '_count' in result &&
    typeof (result as PrismaAggregateCount)._count === 'number'
  );
}

export function hasAggregateSum<T>(
  result: unknown,
  field: string
): result is PrismaAggregateSum<T> {
  return (
    result !== null &&
    result !== undefined &&
    typeof result === 'object' &&
    '_sum' in result &&
    typeof (result as PrismaAggregateSum<T>)._sum === 'object' &&
    (result as PrismaAggregateSum<T>)._sum[field] !== undefined &&
    (result as PrismaAggregateSum<T>)._sum[field] !== null
  );
}

/**
 * Assertion functions para Request properties
 */
export function assertUserId(req: Request): asserts req is Request & { userId: string } {
  if (!req.userId) {
    throw new Error('User ID não encontrado na requisição');
  }
}

// REMOVED: assertTenantId - Single-tenant mode doesn't use tenantId

export function assertUserRole(req: Request): asserts req is Request & { userRole: string } {
  if (!req.userRole) {
    throw new Error('User Role não encontrado na requisição');
  }
}
