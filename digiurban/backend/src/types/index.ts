// ============================================================================
// FASE 1 - SISTEMA DE TIPOS REFATORADO - PADRÃO MODERNO 2024
// ============================================================================

/**
 * Sistema de Tipos Centralizado - DigiUrban Backend
 * Exporta todos os tipos, interfaces e type guards de forma unificada
 *
 * IMPORTANTE: Use sempre este arquivo para importar tipos
 * Nunca crie definições locais de interfaces já existentes aqui
 */

// Extensões Express.js - NOVO FASE 1 (declarações globais + tipos utilitários)
export type {
  TypedRequest,
  TypedResponse,
  UserWithRelations as ExpressUserWithRelations
} from './express.d';

// Handlers tipados - NOVO FASE 1 (exportação seletiva para evitar conflitos)
export type {
  BaseHandler,
  AuthHandler,
  RoleHandler,
  AdminHandler,
  ManagerHandler,
  MiddlewareHandler,
  createHandler,
  createAuthHandler
        } from './handlers';

// Interfaces de resposta padronizadas - NOVO FASE 1 (exportação seletiva)
export type {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  PaginatedResponse,
  MetaResponse,
  AuthErrorResponse,
  NotFoundResponse,
  ValidationErrorResponse,
  StandardResponse,
  PaginatedRouteResponse,
  ValidatedResponse,
  AuthenticatedResponse
        } from './responses';

// Functions de resposta (não são types!)
export {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createPaginatedResponse
        } from './responses';

// Type guards robustos - REMOVIDO para evitar circular
// Importe diretamente de '../utils/guards' se precisar

// Tipos e interfaces principais (importados seletivamente para evitar conflitos)
export type {
  AuthenticatedRequest,
  
  
  JWTPayload,
  AuthenticatedRequestHandler,
  OptionalAuthRequest,
  AdminAuthenticatedRequest,
  SuperAdminRequest,
  RoleAuthorizationConfig,
  ValidationErrorDetail,
  CitizenAuthenticatedRequest,
  TenantCitizenAuthenticatedRequest
        } from './middleware';
export type { UserWithRelations, WhereCondition } from './common';

// Extensões específicas do Prisma
export * from './prisma-extensions';

// Tipos específicos para leads e tenants
export * from './lead';
export * from './tenant';

// Tipos de middleware centralizados
export * from './middleware';

// Tipos de rotas centralizados
export * from './routes';

// Tipos de serviços centralizados
export * from './services';

// Tipos utilitários centralizados
export * from './utils';

// Declarações globais centralizadas
export * from './globals';

// Re-exports úteis do Prisma Client
export type {
  User,
  UserRole,
  Plan,
  Department,
  ServiceSimplified,
  ProtocolSimplified,
  ProtocolStatus,
  Citizen,
  EmailPlan,
  InvoiceStatus,
  LeadSource
        } from '@prisma/client';
/**
 * REGRAS DE IMPORTAÇÃO:
 *
 * ✅ CORRETO:
 * import { AuthenticatedRequest, UserWithRelations } from '../types';
 *
 * ❌ INCORRETO:
 * interface AuthenticatedRequest extends Request { ... } // Definição local
 */
