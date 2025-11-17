// ============================================================================
// UTILITÁRIOS MODERNOS PARA PRISMA - FASE 2 - 2024
// ============================================================================

import { PrismaClient, Prisma } from '@prisma/client';
import { ErrorResponse, SuccessResponse } from '../types';

// Tipos utilitários para Prisma
export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
export type PrismaTransactionCallback<T> = (tx: PrismaTransaction) => Promise<T>;

// Utilitário para lidar com erros únicos do Prisma
export function isPrismaUniqueConstraintError(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

// Utilitário para lidar com erros de registro não encontrado
export function isPrismaNotFoundError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

// Utilitário para lidar com erros de conexão
export function isPrismaConnectionError(
  error: unknown
): error is Prisma.PrismaClientInitializationError {
  return error instanceof Prisma.PrismaClientInitializationError;
}

// Helper para executar operações com tratamento de erro padronizado
export async function executePrismaOperation<T>(
  operation: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.error('Erro na operação Prisma:', error);

    if (isPrismaUniqueConstraintError(error)) {
      return {
        success: false,
        error: `Registro já existe. Campos: ${error.meta?.target || 'não especificado'}`
        };
    }

    if (isPrismaNotFoundError(error)) {
      return {
        success: false,
        error: 'Registro não encontrado'
        };
    }

    if (isPrismaConnectionError(error)) {
      return {
        success: false,
        error: 'Erro de conexão com o banco de dados'
        };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no banco de dados'
        };
  }
}

// Helper para construir queries de busca com filtros dinâmicos
export function buildDynamicWhere<T extends Record<string, unknown>>(
  filters: Partial<T>
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        // Para strings, usa busca case-insensitive
        where[key] = { contains: value, mode: 'insensitive' };
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        // Para boolean e number, usa valor exato
        where[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        // Para arrays, usa operador 'in'
        where[key] = { in: value };
      } else {
        // Para outros tipos, usa valor exato
        where[key] = value;
      }
    }
  });

  return where;
}

// Helper para paginação padronizada
export interface PaginationParams {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  skip: number;
  take: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export function buildPagination(params: PaginationParams): PaginationResult {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20)); // Max 100 itens por página

  const result: PaginationResult = {
    skip: (page - 1) * limit,
    take: limit
        };

  if (params.sortBy) {
    result.orderBy = {
      [params.sortBy]: params.sortOrder || 'asc'
        };
  }

  return result;
}

// Helper para criar metadados de paginação
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const pages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
        };
}

// Helper para transações com retry automático
export async function executeWithRetry<T>(
  prisma: PrismaClient,
  callback: PrismaTransactionCallback<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(callback);
    } catch (error) {
      lastError = error as Error;

      // Só faz retry em erros específicos (deadlock, timeout, etc.)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const retryableCodes = ['P2034', 'P2024', 'P1008', 'P1017'];
        if (!retryableCodes.includes(error.code)) {
          throw error;
        }
      }

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait exponencial antes de retry
      const delay = Math.pow(2, attempt) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Helper para busca com full-text search
export function buildFullTextSearch(searchTerm: string, fields: string[]): Record<string, unknown> {
  if (!searchTerm.trim()) {
    return {};
  }

  const conditions = fields.map(field => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive' as const
        }
        }));

  return conditions.length > 1 ? { OR: conditions } : conditions[0] || {};
}

// Helper para validar e sanitizar IDs
export function validateAndSanitizeId(id: unknown): string | null {
  if (typeof id !== 'string') {
    return null;
  }

  // Remove espaços e caracteres especiais
  const sanitized = id.trim().replace(/[^\w-]/g, '');

  // Valida se é um CUID válido (usado pelo Prisma)
  if (sanitized.length >= 20 && /^c[a-zA-Z0-9]+$/.test(sanitized)) {
    return sanitized;
  }

  return null;
}

// Helper para construir includes dinâmicos
export function buildDynamicInclude(
  includeFields?: string[]
): Record<string, boolean | object> | undefined {
  if (!includeFields || includeFields.length === 0) {
    return undefined;
  }

  const include: Record<string, boolean | object> = {};

  includeFields.forEach(field => {
    // Suporta includes aninhados com notação de ponto
    if (field.includes('.')) {
      const parts = field.split('.');
      let current = include;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;

        if (i === parts.length - 1) {
          current[part] = true;
        } else {
          if (!current[part]) {
            current[part] = { include: {} };
          }
          current = (current[part] as { include: Record<string, boolean | object> }).include;
        }
      }
    } else {
      include[field] = true;
    }
  });

  return include;
}

// Helper para criar responses padronizadas
export function createPrismaResponse<T>(
  result: { success: true; data: T } | { success: false; error: string }
): SuccessResponse<T> | ErrorResponse {
  if (result.success) {
    return {
      success: true,
      data: result.data
        };
  }

  if ('error' in result) {
    return {
      success: false,
      error: result.error,
      message: result.error
        };
  }

  // Fallback case (should not happen with proper typing)
  return {
    success: false,
    error: 'Erro desconhecido',
    message: 'Erro desconhecido'
        };
}

// Helper para operações batch com controle de lote
export async function executeBatchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
  }

  return results;
}

// Helper para soft delete padronizado
export function createSoftDeleteWhere(includeDeleted: boolean = false): Record<string, unknown> {
  return includeDeleted ? {} : { deletedAt: null };
}

// Helper para timestamps automáticos
export function addTimestamps<T extends Record<string, unknown>>(
  data: T,
  isUpdate: boolean = false
): T & { createdAt?: Date; updatedAt: Date } {
  const result = { ...data, updatedAt: new Date() };

  if (!isUpdate) {
    (result as T & { createdAt?: Date }).createdAt = new Date();
  }

  return result;
}
