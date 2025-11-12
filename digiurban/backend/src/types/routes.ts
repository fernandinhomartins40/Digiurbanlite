/**
 * SISTEMA DE TIPOS CENTRALIZADO - ROUTES
 * Todos os tipos relacionados a rotas centralizados
 *
 * IMPORTANTE: Use sempre estes tipos, nunca crie definições locais
 */

import { Request, Response } from 'express';
import {
  User,
  UserRole,
  Citizen,
  ProtocolSimplified,
  ProtocolStatus,
  ServiceSimplified,
  Department,
  TenantStatus
        } from '@prisma/client';
import {
  SearchQuery,
  PaginatedResponse,
  ApiResponse
        } from './common';
import {
  AuthenticatedRequest,
  OptionalAuthRequest,
  CitizenAuthenticatedRequest
        } from './middleware';

// ============================================================================
// TIPOS BASE DE ROTAS
// ============================================================================

/**
 * Configuração de rota com middleware
 */
export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  middlewares: Function[];
  handler: Function;
  description?: string;
  requiresAuth?: boolean;
  requiredRole?: UserRole;
}

/**
 * Parâmetros comuns de rota
 */
export interface CommonRouteParams {
  id: string;
  tenantId?: string;
}

/**
 * Query parameters para listagem com filtros
 */
export interface ListingQuery extends SearchQuery {
  status?: string;
  department?: string;
  category?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  assignedTo?: string;
}

// ============================================================================
// TIPOS ADMINISTRATIVOS
// ============================================================================

/**
 * Parâmetros para rotas administrativas
 */
export interface AdminRouteParams extends CommonRouteParams {
  adminId?: string;
  departmentId?: string;
  serviceId?: string;
}

/**
 * Query parameters para dashboard administrativo
 */
export interface AdminDashboardQuery {
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
  departments?: string[];
  services?: string[];
  status?: ProtocolStatus[];
}

/**
 * Resposta de estatísticas administrativas
 */
export interface AdminStatsResponse {
  totalProtocols: number;
  pendingProtocols: number;
  resolvedProtocols: number;
  averageResolutionTime: number;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    count: number;
  }>;
  monthlyGrowth: Array<{
    month: string;
    count: number;
  }>;
  departmentStats: Array<{
    departmentId: string;
    departmentName: string;
    total: number;
    pending: number;
    resolved: number;
  }>;
}

/**
 * Request para criação/edição de usuário administrativo
 */
export interface AdminUserRequest {
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  permissions?: string[];
  isActive?: boolean;
}

// ============================================================================
// TIPOS DE PROTOCOLOS
// ============================================================================

/**
 * Parâmetros para rotas de protocolos
 */
export interface ProtocolRouteParams extends CommonRouteParams {
  protocolId: string;
  protocolNumber?: string;
}

/**
 * Query parameters para busca de protocolos
 */
export interface ProtocolSearchQuery extends ListingQuery {
  protocolNumber?: string;
  citizenName?: string;
  citizenCPF?: string;
  serviceId?: string;
  departmentId?: string;
  status?: ProtocolStatus;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedUserId?: string;
}

/**
 * Request para criação de protocolo
 */
export interface CreateProtocolRequest {
  serviceId: string;
  title: string;
  description: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  citizenId?: string;
  citizenName?: string;
  citizenEmail?: string;
  citizenPhone?: string;
  citizenCPF?: string;
  citizenAddress?: string;
  attachments?: string[];
  customFields?: Record<string, unknown>;
  isAnonymous?: boolean;
}

/**
 * Request para atualização de protocolo
 */
export interface UpdateProtocolRequest {
  status?: ProtocolStatus;
  assignedUserId?: string;
  response?: string;
  internalNotes?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  estimatedResolutionDate?: string;
  resolutionDate?: string;
  attachments?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * Resposta detalhada de protocolo
 */
export interface ProtocolDetailResponse {
  protocol: ProtocolSimplified & {
    service: ServiceSimplified;
    department: Department;
    assignedUser?: User;
    citizen?: Citizen;
    attachments: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      uploadedAt: Date;
    }>;
    history: Array<{
      id: string;
      action: string;
      description: string;
      performedBy: User;
      createdAt: Date;
    }>;
  };
  relatedProtocols?: ProtocolSimplified[];
}

// ============================================================================
// TIPOS DE SERVIÇOS
// ============================================================================

/**
 * Parâmetros para rotas de serviços
 */
export interface ServiceRouteParams extends CommonRouteParams {
  serviceId: string;
  departmentId?: string;
}

/**
 * Request para criação/edição de serviço
 */
export interface ServiceRequest {
  name: string;
  description: string;
  departmentId: string;
  category?: string;
  isActive?: boolean;
  requiresDocument?: boolean;
  maxFiles?: number;
  allowedFileTypes?: string[];
  estimatedDays?: number;
  instructions?: string;
  customFields?: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
    required: boolean;
    options?: string[];
    placeholder?: string;
    validation?: string;
  }>;
}

/**
 * Query para busca de serviços
 */
export interface ServiceSearchQuery extends SearchQuery {
  departmentId?: string;
  category?: string;
  isActive?: boolean;
  requiresDocument?: boolean;
}

// ============================================================================
// TIPOS DE CIDADÃO
// ============================================================================

/**
 * Parâmetros para rotas de cidadão
 */
export interface CitizenRouteParams extends CommonRouteParams {
  citizenId: string;
  cpf?: string;
}

/**
 * Request para autenticação de cidadão
 */
export interface CitizenAuthRequest {
  cpf: string;
  password?: string;
  phone?: string;
  email?: string;
  verificationCode?: string;
}

/**
 * Request para registro de cidadão
 */
// ✅ PADRONIZADO: Interface alinhada com nomenclatura do banco
export interface CitizenRegisterRequest {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate?: string;
  address?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    pontoReferencia?: string;
  };
  acceptsTerms: boolean;
  acceptsNewsletter?: boolean;
}

/**
 * Query para busca de cidadãos
 */
export interface CitizenSearchQuery extends SearchQuery {
  cpf?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  registeredAfter?: string;
  registeredBefore?: string;
}

// ============================================================================
// TIPOS DE ANALYTICS
// ============================================================================

/**
 * Query para analytics
 */
export interface AnalyticsQuery {
  metric: 'protocols' | 'users' | 'services' | 'satisfaction' | 'resolution_time';
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
  departments?: string[];
  services?: string[];
  groupBy?: 'day' | 'week' | 'month' | 'department' | 'service' | 'status';
}

/**
 * Resposta de analytics
 */
export interface AnalyticsResponse {
  metric: string;
  period: string;
  total: number;
  data: Array<{
    label: string;
    value: number;
    date?: string;
    metadata?: Record<string, unknown>;
  }>;
  comparison?: {
    previousPeriod: number;
    growth: number;
    percentage: number;
  };
}

// ============================================================================
// TIPOS DE INTEGRAÇÃO
// ============================================================================

/**
 * Parâmetros para rotas de integração
 */
export interface IntegrationRouteParams extends CommonRouteParams {
  integrationId: string;
  provider?: string;
}

/**
 * Request para configuração de integração
 */
export interface IntegrationConfigRequest {
  provider: 'whatsapp' | 'email' | 'sms' | 'webhook' | 'api';
  name: string;
  isActive: boolean;
  config: {
    apiKey?: string;
    webhook?: string;
    baseUrl?: string;
    credentials?: Record<string, string>;
    settings?: Record<string, unknown>;
  };
  events?: string[];
  filters?: Record<string, unknown>;
}

/**
 * Resposta de status de integração
 */
export interface IntegrationStatusResponse {
  id: string;
  provider: string;
  name: string;
  isActive: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: Date;
  errorMessage?: string;
  stats?: {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    lastEvent?: Date;
  };
}

// ============================================================================
// TIPOS DE ALERTAS E NOTIFICAÇÕES
// ============================================================================

/**
 * Request para criação de alerta
 */
export interface AlertRequest {
  type: 'system' | 'protocol' | 'user' | 'service' | 'integration';
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  targetUsers?: string[];
  targetDepartments?: string[];
  targetRoles?: UserRole[];
  scheduledFor?: Date;
  expiresAt?: Date;
  actions?: Array<{
    label: string;
    action: string;
    params?: Record<string, unknown>;
  }>;
}

/**
 * Query para busca de alertas
 */
export interface AlertSearchQuery extends ListingQuery {
  type?: string;
  priority?: string;
  isRead?: boolean;
  targetUserId?: string;
  scheduledBefore?: string;
  scheduledAfter?: string;
}

// ============================================================================
// TIPOS DE LEADS
// ============================================================================

/**
 * Parâmetros para rotas de leads
 */
export interface LeadRouteParams extends CommonRouteParams {
  leadId: string;
}

/**
 * Request para criação de lead
 */
export interface CreateLeadRequest {
  municipalityName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  position?: string;
  population?: number;
  currentSystem?: string;
  interests?: string[];
  budget?: string;
  timeline?: string;
  notes?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Query para busca de leads
 */
export interface LeadSearchQuery extends SearchQuery {
  status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'CLOSED_WON' | 'CLOSED_LOST';
  source?: string;
  assignedTo?: string;
  population?: {
    min?: number;
    max?: number;
  };
  createdAfter?: string;
  createdBefore?: string;
}

// ============================================================================
// TIPOS DE SUPER ADMIN
// ============================================================================

/**
 * Request para configurações de super admin
 */
export interface SuperAdminConfigRequest {
  systemSettings?: Record<string, unknown>;
  emailSettings?: {
    provider: string;
    credentials: Record<string, string>;
    templates: Record<string, string>;
  };
  integrationSettings?: Record<string, unknown>;
  securitySettings?: {
    passwordPolicy: Record<string, unknown>;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
}

/**
 * Resposta de estatísticas do sistema
 */
export interface SystemStatsResponse {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    adminUsers: number;
    regularUsers: number;
  };
  protocols: {
    total: number;
    thisMonth: number;
    resolved: number;
    pending: number;
    averageResolutionTime: number;
  };
  system: {
    version: string;
    uptime: number;
    lastBackup: Date;
    diskUsage: number;
    memoryUsage: number;
  };
}

// ============================================================================
// TIPOS DE TENANT MANAGEMENT
// ============================================================================

/**
 * Request para criação/edição de tenant
 */
export interface Create{
  name: string;
  // domain removido
  cnpj: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  planId?: string;
  status?: TenantStatus;
  limits?: {
    users: number;
    protocols: number;
    services: number;
    storage: number;
    customFields: number;
  };
  customSettings?: Record<string, unknown>;
}

/**
 * Query para busca de tenants
 */
export interface TenantSearchQuery extends SearchQuery {
  status?: TenantStatus;
  planId?: string;
  cnpj?: string;
  // domain removido
  createdAfter?: string;
  createdBefore?: string;
}

// ============================================================================
// TIPOS DE AGRICULTURA
// ============================================================================

/**
 * Request para propriedade rural
 */
export interface RuralPropertyRequest {
  producerName: string;
  producerDocument: string;
  producerEmail?: string;
  producerPhone?: string;
  propertyName: string;
  propertyAddress: string;
  totalArea: number;
  plantedArea?: number;
  cropType?: string;
  productionCapacity?: number;
  irrigationType?: string;
  certifications?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Query para busca de propriedades rurais
 */
export interface AgricultureSearchQuery extends SearchQuery {
  producerDocument?: string;
  cropType?: string;
  minArea?: number;
  maxArea?: number;
  hasCertification?: boolean;
  irrigationType?: string;
}

// ============================================================================
// UTILITÁRIOS PARA RESPOSTAS
// ============================================================================

/**
 * Factory para respostas paginadas
 */
export interface PaginatedRouteResponse<T> extends PaginatedResponse<T> {
  success: boolean;
  message?: string;
  filters?: Record<string, unknown>;
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

/**
 * Resposta padrão de sucesso
 */
export interface SuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Resposta padrão de erro
 */
export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Utilitários para padronizar respostas de rotas
 */
export const createSuccessResponse = <T>(data: T, message?: string): SuccessResponse<T> => ({
  success: true,
  data,
  ...(message && { message })
        });

export const createErrorResponse = (
  error: string,
  message: string,
  statusCode?: number,
  details?: Record<string, unknown>
): ErrorResponse => ({
  success: false,
  error,
  message,
  ...(statusCode && { statusCode }),
  ...(details && { details })
        });

/**
 * Resposta de validação para rotas
 */
export interface RouteValidationErrorResponse extends ErrorResponse {
  errors: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

// ============================================================================
// TIPOS DE MIDDLEWARE PARA ROTAS
// ============================================================================

/**
 * Context para middleware de rota
 */
export interface RouteContext {

  userId?: string;
  userRole?: UserRole;
  permissions?: string[];
  request: Request;
  response: Response;
}

/**
 * Configuração de autorização para rota
 */
export interface RouteAuthConfig {
  requiresAuth: boolean;
  requiredRole?: UserRole;
  requiredPermissions?: string[];
  allowSelfAccess?: boolean;
  customValidation?: (context: RouteContext) => boolean;
}

/**
 * Metadados de rota para documentação
 */
export interface RouteMetadata {
  summary: string;
  description?: string;
  tags: string[];
  deprecated?: boolean;
  version?: string;
  examples?: Record<string, unknown>;
}
