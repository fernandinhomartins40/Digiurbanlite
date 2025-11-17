// ============================================================================
// UTILITÁRIOS MODERNOS PARA EXPRESS - FASE 2 - 2024
// ============================================================================

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import {
  AuthenticatedRequest,
  SuccessResponse,
  ErrorResponse,
  ValidationErrorResponse,
  PaginatedResponse
        } from '../types';

// Tipos utilitários
export type AsyncRequestHandler<TRequest extends Request = Request, TResponse = unknown> = (
  req: TRequest,
  res: Response,
  next: NextFunction
) => Promise<TResponse | void>;

export type ValidatedRequestHandler<TBody = unknown, TQuery = unknown> = (
  req: Request & { body: TBody; query: TQuery },
  res: Response,
  next: NextFunction
) => Promise<void>;

// Helper para wrapper de async handlers
export function asyncHandler<TReq extends Request = Request>(
  handler: AsyncRequestHandler<TReq>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req as TReq, res, next)).catch(next);
  };
}

// Helper para validação com Zod
export function validateRequest<TBody = unknown, TQuery = unknown, TParams = unknown>(
  bodySchema?: ZodSchema<TBody>,
  querySchema?: ZodSchema<TQuery>,
  paramsSchema?: ZodSchema<TParams>
): RequestHandler {
  return asyncHandler(async (req, res, next) => {
    try {
      if (bodySchema) {
        req.body = await bodySchema.parseAsync(req.body);
      }

      if (querySchema) {
        const validatedQuery = await querySchema.parseAsync(req.query);
        (req as any).query = validatedQuery;
      }

      if (paramsSchema) {
        const validatedParams = await paramsSchema.parseAsync(req.params);
        (req as any).params = validatedParams;
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationResponse: ValidationErrorResponse = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Os dados fornecidos não são válidos',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }))
        };
        return res.status(400).json(validationResponse);
      }

      return next(error);
    }
  });
}

// Helper para responses de sucesso padronizadas
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message })
        };

  res.status(statusCode).json(response);
}

// Helper para responses de erro padronizadas
export function sendError(
  res: Response,
  error: string,
  message?: string,
  statusCode: number = 400
): void {
  const response: ErrorResponse = {
    success: false,
    error,
    message: message || error
        };

  res.status(statusCode).json(response);
}

// Helper para responses paginadas
export function sendPaginatedResponse<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  message?: string
): void {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination,
    ...(message && { message })
        };

  res.status(200).json(response);
}

// Helper para extrair parâmetros de paginação da query
export function extractPaginationParams(query: Record<string, unknown>): {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} {
  const pageValue = typeof query.page === 'string' ? query.page : '1';
  const limitValue = typeof query.limit === 'string' ? query.limit : '20';
  const sortByValue = typeof query.sortBy === 'string' ? query.sortBy : undefined;
  const sortOrderValue = query.sortOrder === 'desc' ? 'desc' : 'asc';

  const page = Math.max(1, parseInt(pageValue, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitValue, 10) || 20));

  return {
    page,
    limit,
    ...(sortByValue && { sortBy: sortByValue, sortOrder: sortOrderValue })
        };
}

// Helper para extrair filtros da query (remove parâmetros de paginação)
export function extractFilters<T extends Record<string, unknown>>(
  query: Record<string, unknown>,
  excludeKeys: string[] = ['page', 'limit', 'sortBy', 'sortOrder']
): Partial<T> {
  const filters: Record<string, unknown> = {};

  Object.keys(query).forEach(key => {
    if (!excludeKeys.includes(key) && query[key] !== undefined) {
      filters[key] = query[key];
    }
  });

  return filters as Partial<T>;
}

// Helper para logging estruturado de requests
export function logRequest(req: Request, level: 'info' | 'warn' | 'error' = 'info'): void {
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: (req as AuthenticatedRequest).userId || null
        };

  console[level]('Request:', logData);
}

// Helper para CORS personalizado por tenant
export function createCorsHandler(allowedOrigins?: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('Origin');

    if (!origin) {
      return next();
    }

    if (!allowedOrigins || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-Tenant-ID'
      );
    }

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  };
}

// Helper para rate limiting por tenant
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function createRateLimiter(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${(req as AuthenticatedRequest).userId || 'anonymous'}`;
    const now = Date.now();

    const current = rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
        });
      return next();
    }

    if (current.count >= maxRequests) {
      return sendError(res, 'Rate limit exceeded', 'Muitas requisições', 429);
    }

    current.count++;
    next();
  };
}

// Helper para middleware de cache simples
const cacheMap = new Map<string, { data: unknown; expires: number }>();

export function createCacheMiddleware(ttlSeconds: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.url}:${(req as AuthenticatedRequest).userId || 'public'}`;
    const cached = cacheMap.get(key);

    if (cached && Date.now() < cached.expires) {
      return res.json(cached.data);
    }

    // Intercepta res.json para cachear o resultado
    const originalJson = res.json.bind(res);
    res.json = function (data: unknown) {
      if (res.statusCode === 200) {
        cacheMap.set(key, {
          data,
          expires: Date.now() + ttlSeconds * 1000
        });
      }
      return originalJson(data);
    };

    next();
  };
}

// Helper para sanitização de dados de entrada
export function sanitizeInput(data: unknown): unknown {
  if (typeof data === 'string') {
    return data.trim().replace(/[<>]/g, ''); // Remove HTML básico
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }

  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    Object.keys(data).forEach(key => {
      sanitized[key] = sanitizeInput((data as Record<string, unknown>)[key]);
    });
    return sanitized;
  }

  return data;
}

// Helper para middleware de sanitização automática
export function sanitizeMiddleware() {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = sanitizeInput(req.body);
    (req as any).query = sanitizeInput(req.query);
    (req as any).params = sanitizeInput(req.params);
    next();
  };
}

// Helper para timeout de requisições
export function createTimeoutMiddleware(timeoutMs: number = 30000) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        sendError(res, 'Request timeout', 'Requisição expirou', 408);
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    next();
  };
}

// Helper para extrair informações do user-agent
export function parseUserAgent(userAgent?: string): {
  browser?: string;
  os?: string;
  device?: string;
} {
  if (!userAgent) return {};

  return {
    browser: userAgent.includes('Chrome')
      ? 'Chrome'
      : userAgent.includes('Firefox')
        ? 'Firefox'
        : userAgent.includes('Safari')
          ? 'Safari'
          : 'Unknown',
    os: userAgent.includes('Windows')
      ? 'Windows'
      : userAgent.includes('Mac')
        ? 'macOS'
        : userAgent.includes('Linux')
          ? 'Linux'
          : 'Unknown',
    device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
        };
}

// Helper para headers de segurança
export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    );
    next();
  };
}

// REMOVED: validateTenantAccess - Single-tenant mode doesn't need tenant validation

// Helper para transformar queries string em tipos apropriados
export function parseQueryTypes<T extends Record<string, unknown>>(
  query: Record<string, unknown>,
  schema: Record<keyof T, 'string' | 'number' | 'boolean' | 'array'>
): Partial<T> {
  const result: Record<string, unknown> = {};

  Object.entries(schema).forEach(([key, type]) => {
    const value = query[key];
    if (value === undefined) return;

    switch (type) {
      case 'number': {
        const stringValue = String(value);
        const num = parseFloat(stringValue);
        if (!isNaN(num)) {
          result[key] = num;
        }
        break;
      }
      case 'boolean':
        result[key] = value === 'true' || value === '1';
        break;
      case 'array':
        result[key] = Array.isArray(value) ? value : [value];
        break;
      default:
        result[key] = String(value);
    }
  });

  return result as Partial<T>;
}
