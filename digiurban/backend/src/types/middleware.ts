/**
 * SISTEMA DE TIPOS CENTRALIZADO - MIDDLEWARE
 * Todos os tipos relacionados a middlewares centralizados
 *
 * IMPORTANTE: Use sempre estes tipos, nunca crie definições locais
 */

import { Response, NextFunction } from 'express';
import { Request } from 'express'; // Usa nossa declaração global estendida
import { UserRole } from '@prisma/client'; // DIA 3: Removed Tenant import
import { Schema } from 'joi';
import { UserWithRelations } from './common';

// Single Tenant: Tenant completamente removido

// ============================================================================
// TIPOS BASE DE MIDDLEWARE
// ============================================================================

/**
 * Tipo base para middleware function
 */
export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Tipo para middleware factory que retorna middleware
 */
export type MiddlewareFactory<T = unknown> = (options?: T) => MiddlewareFunction;

// ============================================================================
// TIPOS DE AUTENTICAÇÃO
// ============================================================================

/**
 * Payload JWT padrão do sistema
 */
export interface JWTPayload {
  userId: string;
  citizenId?: string; // Para tokens de cidadão
  role: UserRole;
  type?: string; // ✅ SEGURANÇA: Tipo de token (admin, citizen, super_admin, user)
  iat?: number;
  exp?: number;
}

/**
 * Request autenticado com informações do usuário
 * Garante que as propriedades de autenticação estejam presentes
 */
export type AuthenticatedRequest = Request & {
  userId: string;
  user: UserWithRelations;
  userRole: UserRole;
};

/**
 * Type guard para verificar se request está autenticado
 */
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  const extReq = req as any;
  return !!(extReq.userId && extReq.user && extReq.userRole);
}

/**
 * Handler type para rotas autenticadas (compatível com Express)
 */
export type AuthenticatedRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Handler type para rotas com autenticação opcional
 */
export type OptionalAuthRequestHandler<P = unknown, ResBody = unknown, ReqBody = unknown, ReqQuery = unknown> = (
  req: OptionalAuthRequest,
  res: Response<ResBody>,
  next: NextFunction
) => void | Promise<void>;

/**
 * Utility function para garantir que um request está autenticado
 * Lança erro se propriedades obrigatórias não existem
 */
export function ensureAuthenticated(req: Request): asserts req is AuthenticatedRequest {
  const extReq = req as any;
  if (!extReq.userId || !extReq.user || !extReq.userRole) {
    throw new Error('Request não está devidamente autenticado');
  }
}

/**
 * Utility function para converter Request para AuthenticatedRequest de forma segura
 */
export function toAuthenticatedRequest(req: Request): AuthenticatedRequest {
  ensureAuthenticated(req);
  return req;
}

/**
 * Wrapper para tornar handlers autenticados compatíveis com Express Router
 */
export function createAuthenticatedHandler(
  handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>
): AuthenticatedRequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Garantir que está autenticado antes de chamar o handler
      ensureAuthenticated(req);
      await handler(req as AuthenticatedRequest, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Helper type para handlers autenticados compatíveis com Express
 */
export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Request com autenticação opcional
 */
export type OptionalAuthRequest = Request & {
  userId?: string;
  user?: UserWithRelations;
  userRole?: UserRole;
};

/**
 * Request autenticado para cidadãos
 * Atualizado para usar tipos seguros do express.d.ts
 */
export type CitizenAuthenticatedRequest = Request & {
  citizen?: import('./express.d').CitizenWithRelations;
  citizenId?: string;
};

/**
 * Request que passou por tenantMiddleware + citizenAuthMiddleware
 * Garante que tenant e citizen estão definidos
 */
export type TenantCitizenAuthenticatedRequest = Request & {
  citizen: import('./express.d').CitizenWithRelations;
  citizenId: string;
};

/**
 * Request autenticado para administradores
 */
export type AdminAuthenticatedRequest = AuthenticatedRequest & {
  // Herda todas as propriedades de AuthenticatedRequest
  // Pode ser estendido com propriedades específicas de admin se necessário
};

/**
 * Request autenticado para super administradores
 */
export type SuperAdminRequest = AuthenticatedRequest & {
  // Herda todas as propriedades de AuthenticatedRequest
  // Usuário deve ter role SUPER_ADMIN
};

/**
 * Configuração para middleware de autorização por role
 */
export interface RoleAuthorizationConfig {
  minRole: UserRole;
  allowSuperAdmin?: boolean;
  customRoles?: UserRole[];
}

/**
 * Hierarquia de roles do sistema
 */
export interface RoleHierarchy {
  GUEST: number;
  USER: number;
  COORDINATOR: number;
  MANAGER: number;
  ADMIN: number;
  SUPER_ADMIN: number;
}

// ============================================================================
// TIPOS DE TENANT
// ============================================================================

// REMOVIDO - Single Tenant

/**
 * Request com informações de tenant (deprecated - single tenant mode)
 */

/**
 * Request que passou por tenantMiddleware (deprecated - single tenant mode)
 * Garante que tenant está definido
 */

/**
 * Request autenticado com tenant (deprecated - single tenant mode)
 */

/**
 * Opções para middleware de tenant
 */

/**
 * Resultado da identificação de tenant
 */

/**
 * Configuração para validação de limites de plano
 */
export interface PlanLimitsConfig {
  enforceUserLimits?: boolean;
  enforceProtocolLimits?: boolean;
  enforceServiceLimits?: boolean;
  enforceStorageLimits?: boolean;
  customLimitRoutes?: {
    [key: string]: (req: Request) => boolean;
  };
}

// ============================================================================
// TIPOS DE VALIDAÇÃO
// ============================================================================

/**
 * Configuração para middleware de validação
 */
export interface ValidationConfig {
  abortEarly?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  customMessages?: Record<string, string>;
  context?: Record<string, unknown>;
}

/**
 * Detalhes de erro de validação padronizados
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
  type?: string;
}

/**
 * Resposta de erro de validação
 */
export interface ValidationErrorResponse {
  success: boolean;
  error: string;
  message: string;
  errors: ValidationErrorDetail[];
}

/**
 * Middleware de validação para diferentes partes da requisição
 */
export interface ValidationMiddlewares {
  body: (schema: Schema, config?: ValidationConfig) => MiddlewareFunction;
  query: (schema: Schema, config?: ValidationConfig) => MiddlewareFunction;
  params: (schema: Schema, config?: ValidationConfig) => MiddlewareFunction;
}

// ============================================================================
// TIPOS DE RATE LIMITING
// ============================================================================

/**
 * Configuração para rate limiting por tenant
 */
export interface TenantRateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  max: number; // Máximo de requests
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Configuração de rate limiting por plano
 */
export interface PlanBasedRateLimitConfig {
  STARTER: TenantRateLimitConfig;
  PROFESSIONAL: TenantRateLimitConfig;
  ENTERPRISE: TenantRateLimitConfig;
  CUSTOM?: TenantRateLimitConfig;
}

/**
 * Estado atual do rate limiting
 */
export interface RateLimitState {
  current: number;
  remaining: number;
  resetTime: Date;
  isBlocked: boolean;
}

// ============================================================================
// TIPOS DE UPLOAD
// ============================================================================

/**
 * Configuração para middleware de upload
 */
export interface UploadConfig {
  destination?: string;
  filename?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  maxFiles?: number;
  preservePath?: boolean;
}

/**
 * Informações do arquivo carregado
 */
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
}

/**
 * Request com arquivos carregados
 */
export interface UploadRequest extends Omit<Request, 'file' | 'files'> {
  file?: UploadedFile;
  files?: UploadedFile[] | { [fieldname: string]: UploadedFile[] };
}

// ============================================================================
// TIPOS DE CORS
// ============================================================================

/**
 * Configuração CORS por tenant
 */
export interface TenantCorsConfig {
  origin: string[] | string | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// ============================================================================
// TIPOS DE SEGURANÇA
// ============================================================================

/**
 * Configuração de headers de segurança
 */
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean | object;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean | string;
  dnsPrefetchControl?: boolean;
  frameguard?: boolean | object;
  hidePoweredBy?: boolean;
  hsts?: boolean | object;
  ieNoOpen?: boolean;
  noSniff?: boolean;
  originAgentCluster?: boolean;
  permittedCrossDomainPolicies?: boolean | string;
  referrerPolicy?: boolean | string | string[];
  xssFilter?: boolean;
}

// ============================================================================
// TIPOS DE LOGGING
// ============================================================================

/**
 * Configuração para middleware de logging
 */
export interface LoggingConfig {
  format?: 'combined' | 'common' | 'dev' | 'short' | 'tiny' | string;
  skip?: (req: Request, res: Response) => boolean;
  stream?: NodeJS.WritableStream;
  immediate?: boolean;
}

/**
 * Informações de log de request
 */
export interface RequestLogInfo {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
  ip: string;
  userId?: string;
  timestamp: Date;
}

// ============================================================================
// TIPOS DE CACHE
// ============================================================================

/**
 * Configuração para middleware de cache
 */
export interface CacheConfig {
  ttl?: number; // Time to live em segundos
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  customHeaders?: Record<string, string>;
}

/**
 * Estado do cache
 */
export interface CacheState {
  hit: boolean;
  key: string;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
}

// ============================================================================
// TIPOS UTILITÁRIOS PARA MIDDLEWARE
// ============================================================================

/**
 * Resposta padrão de erro do middleware
 */
export interface MiddlewareErrorResponse {
  error: string;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  timestamp?: Date;
  path?: string;
}

/**
 * Configuração global de middleware
 */
export interface GlobalMiddlewareConfig {
  enableCors?: boolean;
  enableRateLimit?: boolean;
  enableSecurity?: boolean;
  enableLogging?: boolean;
  enableValidation?: boolean;
  enableCache?: boolean;
  customMiddlewares?: MiddlewareFunction[];
}

/**
 * Estatísticas de uso de middleware
 */
export interface MiddlewareStats {
  totalRequests: number;
  authenticatedRequests: number;
  blockedRequests: number;
  errorRate: number;
  averageResponseTime: number;
  topErrors: { error: string; count: number }[];
}

// ============================================================================
// DECLARAÇÕES GLOBAIS MOVIDAS PARA src/types/globals.ts
// ============================================================================

// Todas as declarações globais foram centralizadas em src/types/globals.ts
// Este arquivo agora contém apenas tipos específicos para middleware
