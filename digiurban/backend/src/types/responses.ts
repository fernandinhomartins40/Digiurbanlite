// ============================================================================
// FASE 1 - INTERFACES DE RESPOSTA PADRONIZADAS - PADRÃO MODERNO 2024
// ============================================================================

// Interface base para todas as respostas da API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  requestId?: string;
}

// Resposta de sucesso
export interface SuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Resposta de erro
export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
  message: string;
  code?: string | number;
  details?: unknown;
}

// Resposta paginada
export interface PaginatedResponse<T = unknown> extends SuccessResponse<T[]> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Resposta com metadados
export interface MetaResponse<T = unknown> extends SuccessResponse<T> {
  meta: {
    version: string;
    timestamp: string;
    requestId: string;
    executionTime?: number;
  };
}

// Resposta de validação
export interface ValidationErrorResponse extends ErrorResponse {
  success: false;
  error: 'VALIDATION_ERROR';
  message: string;
  details: {
    field: string;
    message: string;
    value?: unknown;
  }[];
}

// Resposta de autenticação
export interface AuthErrorResponse extends ErrorResponse {
  success: false;
  error: 'AUTH_ERROR';
  message: string;
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID';
}

// Resposta de não encontrado
export interface NotFoundResponse extends ErrorResponse {
  success: false;
  error: 'NOT_FOUND';
  message: string;
  resource?: string;
  id?: string;
}

// Helper functions para criar respostas consistentes
export const createSuccessResponse = <T>(data: T, message?: string): SuccessResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
        });

export const createErrorResponse = (
  error: string,
  message: string,
  code?: string | number,
  details?: unknown
): ErrorResponse => ({
  success: false,
  error,
  message,
  code,
  details,
  timestamp: new Date().toISOString()
        });

export const createPaginatedResponse = <T>(
  data: T[],
  pagination: PaginatedResponse<T>['pagination'],
  message?: string
): PaginatedResponse<T> => ({
  success: true,
  data,
  ...(message && { message }),
  pagination,
  timestamp: new Date().toISOString()
        });

export const createValidationErrorResponse = (
  details: ValidationErrorResponse['details'],
  message = 'Dados inválidos'
): ValidationErrorResponse => ({
  success: false,
  error: 'VALIDATION_ERROR',
  message,
  details,
  timestamp: new Date().toISOString()
        });

export const createAuthErrorResponse = (
  code: AuthErrorResponse['code'],
  message?: string
): AuthErrorResponse => {
  const messages = {
    UNAUTHORIZED: 'Acesso não autorizado',
    FORBIDDEN: 'Acesso negado',
    TOKEN_EXPIRED: 'Token expirado',
    TOKEN_INVALID: 'Token inválido'
        };

  return {
    success: false,
    error: 'AUTH_ERROR',
    message: message || messages[code],
    code,
    timestamp: new Date().toISOString()
        };
};

export const createNotFoundResponse = (
  resource?: string,
  id?: string,
  message?: string
): NotFoundResponse => ({
  success: false,
  error: 'NOT_FOUND',
  message: message || `${resource || 'Recurso'} não encontrado${id ? ` (ID: ${id})` : ''}`,
  ...(resource && { resource }),
  ...(id && { id }),
  timestamp: new Date().toISOString()
        });

// Tipos de união para responses comuns
export type StandardResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
export type PaginatedRouteResponse<T = unknown> = PaginatedResponse<T> | ErrorResponse;
export type ValidatedResponse<T = unknown> = SuccessResponse<T> | ValidationErrorResponse;
export type AuthenticatedResponse<T = unknown> = SuccessResponse<T> | AuthErrorResponse;
