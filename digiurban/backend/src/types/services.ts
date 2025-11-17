/**
 * SISTEMA DE TIPOS CENTRALIZADO - SERVICES
 * Todos os tipos relacionados a serviços centralizados
 *
 * IMPORTANTE: Use sempre estes tipos, nunca crie definições locais
 */

import { UserRole } from '@prisma/client';
// ============================================================================
// TIPOS BASE DE SERVIÇOS
// ============================================================================

/**
 * Configuração base para serviços
 */
export interface BaseServiceConfig {
  name: string;
  version: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}

/**
 * Resultado base de operação de serviço
 */
export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Contexto de execução do serviço
 */
export interface ServiceContext {

  userId?: string;
  userRole?: UserRole;
  requestId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// TIPOS DE CACHE SERVICE
// ============================================================================

/**
 * Configuração do cache service
 */
export interface CacheServiceConfig extends BaseServiceConfig {
  provider: 'memory' | 'redis' | 'memcached';
  ttl: number; // Time to live em segundos
  maxKeys: number;
  compression: boolean;
  serialization: 'json' | 'binary';
  keyPrefix: string;
  connection?: {
    host: string;
    port: number;
    password?: string;
    database?: number;
  };
}

/**
 * Opções para operações de cache
 */
export interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  namespace?: string;
  tags?: string[];
  skipCache?: boolean;
}

/**
 * Informações sobre entrada no cache
 */
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
  size: number;
  tags?: string[];
}

/**
 * Estatísticas do cache
 */
export interface CacheStats {
  totalKeys: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

/**
 * Interface do Cache Service
 */
export interface ICacheService {
  get<T>(key: string, options?: CacheOptions): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(namespace?: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  keys(pattern?: string): Promise<string[]>;
  getStats(): Promise<CacheStats>;
  invalidateByTags(tags: string[]): Promise<number>;
  flushExpired(): Promise<number>;
}

// ============================================================================
// TIPOS DE EMAIL SERVICE
// ============================================================================

/**
 * Configuração do email service
 */
export interface EmailServiceConfig extends BaseServiceConfig {
  provider: 'smtp' | 'ses' | 'sendgrid' | 'mailgun' | 'custom';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    tls?: {
      rejectUnauthorized?: boolean;
    };
  };
  apiKey?: string;
  apiSecret?: string;
  region?: string;
  // domain removido
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  templates: {
    basePath: string;
    engine: 'handlebars' | 'ejs' | 'pug';
  };
}

/**
 * Dados do email
 */
export interface EmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, unknown>;
  attachments?: EmailAttachment[];
  from?: string;
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Anexo de email
 */
export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  contentDisposition?: string;
  cid?: string; // Para imagens inline
}

/**
 * Resultado do envio de email
 */
export interface EmailSendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending?: string[];
  response?: string;
  envelope?: {
    from: string;
    to: string[];
  };
}

/**
 * Configuração de template de email
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'html' | 'text';
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    required: boolean;
    description: string;
    defaultValue?: unknown;
  }>;
  category?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Interface do Email Service
 */
export interface IEmailService {
  send(emailData: EmailData, context?: ServiceContext): Promise<EmailSendResult>;
  sendTemplate(
    templateId: string,
    to: string | string[],
    templateData: Record<string, unknown>,
    context?: ServiceContext
  ): Promise<EmailSendResult>;
  sendBatch(emails: EmailData[], context?: ServiceContext): Promise<EmailSendResult[]>;
  validateTemplate(template: EmailTemplate): Promise<boolean>;
  renderTemplate(
    templateId: string,
    data: Record<string, unknown>
  ): Promise<{ subject: string; body: string }>;
  getTemplates(): Promise<EmailTemplate[]>;
  getTemplate(templateId: string): Promise<EmailTemplate | null>;
}

// ============================================================================
// TIPOS DE NOTIFICATION SERVICE
// ============================================================================

/**
 * Configuração do notification service
 */
export interface NotificationServiceConfig extends BaseServiceConfig {
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
    inApp: boolean;
  };
  providers: {
    sms?: {
      provider: 'twilio' | 'aws-sns' | 'custom';
      credentials: Record<string, string>;
    };
    push?: {
      provider: 'firebase' | 'apns' | 'custom';
      credentials: Record<string, string>;
    };
  };
  templates: {
    basePath: string;
    defaultLanguage: string;
    supportedLanguages: string[];
  };
}

/**
 * Dados da notificação
 */
export interface NotificationData {
  type: 'protocol_created' | 'protocol_updated' | 'user_mentioned' | 'system_alert' | 'custom';
  title: string;
  message: string;
  recipient: {
    userId?: string;
    email?: string;
    phone?: string;
    deviceToken?: string;
  };
  channels: ('email' | 'sms' | 'push' | 'webhook' | 'inApp')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  expiresAt?: Date;
  data?: Record<string, unknown>;
  actions?: Array<{
    id: string;
    label: string;
    action: string;
    params?: Record<string, unknown>;
  }>;
}

/**
 * Resultado da notificação
 */
export interface NotificationResult {
  id: string;
  status: 'sent' | 'failed' | 'pending' | 'scheduled';
  channels: Array<{
    channel: string;
    status: 'sent' | 'failed' | 'pending';
    messageId?: string;
    error?: string;
  }>;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

/**
 * Interface do Notification Service
 */
export interface INotificationService {
  send(notification: NotificationData, context?: ServiceContext): Promise<NotificationResult>;
  sendBatch(
    notifications: NotificationData[],
    context?: ServiceContext
  ): Promise<NotificationResult[]>;
  schedule(
    notification: NotificationData,
    scheduledFor: Date,
    context?: ServiceContext
  ): Promise<string>;
  cancel(notificationId: string): Promise<boolean>;
  getStatus(notificationId: string): Promise<NotificationResult | null>;
  markAsRead(notificationId: string, userId: string): Promise<boolean>;
  getNotifications(
    userId: string,
    filters?: { type?: string; read?: boolean; limit?: number }
  ): Promise<NotificationResult[]>;
}

// ============================================================================
// TIPOS DE INTEGRATION SERVICE
// ============================================================================

/**
 * Configuração do integration service
 */
export interface IntegrationServiceConfig extends BaseServiceConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  rateLimit: {
    requests: number;
    window: number; // em segundos
  };
  authentication: {
    type: 'api_key' | 'oauth2' | 'basic' | 'bearer' | 'custom';
    config: Record<string, unknown>;
  };
  endpoints: Record<string, string>;
}

/**
 * Dados para integração externa
 */
export interface IntegrationRequest<T = unknown> {
  service: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  data?: T;
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  authentication?: {
    type: string;
    credentials: Record<string, unknown>;
  };
}

/**
 * Resposta de integração
 */
export interface IntegrationResponse<T = unknown> extends ServiceResult<T> {
  statusCode: number;
  headers?: Record<string, string>;
  duration: number;
  retries: number;
  cached: boolean;
}

/**
 * Log de integração
 */
export interface IntegrationLog {
  id: string;
  service: string;
  method: string;
  endpoint: string;
  requestData?: unknown;
  responseData?: unknown;
  statusCode?: number;
  duration: number;
  success: boolean;
  error?: string;
  retries: number;
  timestamp: Date;

  userId?: string;
}

/**
 * Interface do Integration Service
 */
export interface IIntegrationService {
  request<T = unknown, R = unknown>(
    request: IntegrationRequest<T>,
    context?: ServiceContext
  ): Promise<IntegrationResponse<R>>;
  get<T = unknown>(
    service: string,
    endpoint: string,
    query?: Record<string, unknown>,
    context?: ServiceContext
  ): Promise<IntegrationResponse<T>>;
  post<T = unknown, R = unknown>(
    service: string,
    endpoint: string,
    data: T,
    context?: ServiceContext
  ): Promise<IntegrationResponse<R>>;
  put<T = unknown, R = unknown>(
    service: string,
    endpoint: string,
    data: T,
    context?: ServiceContext
  ): Promise<IntegrationResponse<R>>;
  delete<T = unknown>(
    service: string,
    endpoint: string,
    context?: ServiceContext
  ): Promise<IntegrationResponse<T>>;
  getLogs(filters?: {
    service?: string;
    success?: boolean;
    limit?: number;
  }): Promise<IntegrationLog[]>;
  getServices(): Promise<string[]>;
  testConnection(service: string): Promise<boolean>;
}

// ============================================================================
// TIPOS DE ANALYTICS SERVICE
// ============================================================================

/**
 * Configuração do analytics service
 */
export interface AnalyticsServiceConfig extends BaseServiceConfig {
  dataRetention: {
    raw: number; // dias
    aggregated: number; // dias
  };
  aggregation: {
    intervals: ('hour' | 'day' | 'week' | 'month')[];
    metrics: string[];
  };
  export: {
    formats: ('json' | 'csv' | 'pdf' | 'xlsx')[];
    maxRows: number;
  };
}

/**
 * Evento para analytics
 */
export interface AnalyticsEvent {
  type: string;
  action: string;
  category: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: Date;
}

/**
 * Query para analytics de serviços
 */
export interface ServiceAnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: Record<string, unknown>;
  dateRange: {
    start: Date;
    end: Date;
  };
  groupBy?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
  limit?: number;
}

/**
 * Resultado de analytics
 */
export interface AnalyticsResult {
  query: ServiceAnalyticsQuery;
  data: Array<{
    dimensions: Record<string, unknown>;
    metrics: Record<string, number>;
    timestamp?: Date;
  }>;
  total: number;
  aggregations?: Record<string, number>;
  metadata?: {
    executionTime: number;
    cacheHit: boolean;
    dataSource: string;
  };
}

/**
 * Interface do Analytics Service
 */
export interface IAnalyticsService {
  track(event: AnalyticsEvent, context?: ServiceContext): Promise<void>;
  trackBatch(events: AnalyticsEvent[], context?: ServiceContext): Promise<void>;
  query(query: ServiceAnalyticsQuery, context?: ServiceContext): Promise<AnalyticsResult>;
  getMetrics(context?: ServiceContext): Promise<string[]>;
  getDimensions(context?: ServiceContext): Promise<string[]>;
  export(
    query: ServiceAnalyticsQuery,
    format: 'json' | 'csv' | 'pdf' | 'xlsx',
    context?: ServiceContext
  ): Promise<Buffer>;
}

// ============================================================================
// TIPOS DE FILE STORAGE SERVICE
// ============================================================================

/**
 * Configuração do storage service
 */
export interface StorageServiceConfig extends BaseServiceConfig {
  provider: 'local' | 's3' | 'gcs' | 'azure';
  basePath: string;
  maxFileSize: number;
  allowedTypes: string[];
  encryption: boolean;
  compression: boolean;
  cdn?: {
    enabled: boolean;
    baseUrl: string;
    cacheTtl: number;
  };
  credentials?: Record<string, string>;
}

/**
 * Informações do arquivo
 */
export interface FileInfo {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  cdnUrl?: string;
  checksum: string;
  uploadedAt: Date;
  uploadedBy?: string;

  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Opções de upload
 */
export interface UploadOptions {
  fileName?: string;
  folder?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  compress?: boolean;
  encrypt?: boolean;
  generateThumbnail?: boolean;
  thumbnailSizes?: Array<{ width: number; height: number; name?: string }>;
}

/**
 * Resultado do upload
 */
export interface UploadResult extends FileInfo {
  thumbnails?: Array<{
    size: string;
    url: string;
    width: number;
    height: number;
  }>;
}

/**
 * Interface do Storage Service
 */
export interface IStorageService {
  upload(
    file: Buffer | string,
    options: UploadOptions,
    context?: ServiceContext
  ): Promise<UploadResult>;
  uploadMultiple(
    files: Array<{ file: Buffer | string; options: UploadOptions }>,
    context?: ServiceContext
  ): Promise<UploadResult[]>;
  download(fileId: string, context?: ServiceContext): Promise<Buffer>;
  delete(fileId: string, context?: ServiceContext): Promise<boolean>;
  getFileInfo(fileId: string, context?: ServiceContext): Promise<FileInfo | null>;
  listFiles(
    filters?: { folder?: string; tags?: string[]; limit?: number },
    context?: ServiceContext
  ): Promise<FileInfo[]>;
  generateSignedUrl(fileId: string, expiresIn: number, context?: ServiceContext): Promise<string>;
  move(fileId: string, newPath: string, context?: ServiceContext): Promise<FileInfo>;
  copy(fileId: string, newPath: string, context?: ServiceContext): Promise<FileInfo>;
}

// ============================================================================
// TIPOS DE AUDIT SERVICE
// ============================================================================

/**
 * Configuração do audit service
 */
export interface AuditServiceConfig extends BaseServiceConfig {
  retention: number; // dias
  sensitiveFields: string[];
  includedActions: string[];
  excludedActions: string[];
  anonymizeUser: boolean;
}

/**
 * Entrada de auditoria
 */
export interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId?: string;
  userRole?: UserRole;

  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Query para auditoria
 */
export interface AuditQuery {
  action?: string;
  resource?: string;
  resourceId?: string;
  userId?: string;
  userRole?: UserRole;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

/**
 * Interface do Audit Service
 */
export interface IAuditService {
  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>, context?: ServiceContext): Promise<void>;
  query(
    query: AuditQuery,
    context?: ServiceContext
  ): Promise<{ entries: AuditEntry[]; total: number }>;
  export(query: AuditQuery, format: 'json' | 'csv', context?: ServiceContext): Promise<Buffer>;
  cleanup(olderThan: Date): Promise<number>;
}

// ============================================================================
// TIPOS DE QUEUE SERVICE
// ============================================================================

/**
 * Configuração do queue service
 */
export interface QueueServiceConfig extends BaseServiceConfig {
  provider: 'memory' | 'redis' | 'sqs' | 'rabbitmq';
  connection?: Record<string, unknown>;
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
    delay?: number;
    ttl: number;
  };
}

/**
 * Job para a fila
 */
export interface QueueJob<T = unknown> {
  id: string;
  name: string;
  data: T;
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  ttl?: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

/**
 * Resultado do processamento do job
 */
export interface JobResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  retries: number;
}

/**
 * Interface do Queue Service
 */
export interface IQueueService {
  add<T>(name: string, data: T, options?: Partial<QueueJob>): Promise<string>;
  process<T, R>(name: string, processor: (job: QueueJob<T>) => Promise<JobResult<R>>): void;
  getJob(jobId: string): Promise<QueueJob | null>;
  getJobs(
    status?: 'waiting' | 'active' | 'completed' | 'failed',
    limit?: number
  ): Promise<QueueJob[]>;
  removeJob(jobId: string): Promise<boolean>;
  retryJob(jobId: string): Promise<boolean>;
  getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  clean(olderThan: Date, status?: 'completed' | 'failed'): Promise<number>;
}

// ============================================================================
// TIPOS DE SERVICE REGISTRY
// ============================================================================

/**
 * Registro de serviços
 */
export interface ServiceRegistry {
  cache: ICacheService;
  email: IEmailService;
  notification: INotificationService;
  integration: IIntegrationService;
  analytics: IAnalyticsService;
  storage: IStorageService;
  audit: IAuditService;
  queue: IQueueService;
}

/**
 * Factory para serviços
 */
export interface ServiceFactory {
  createCacheService(config: CacheServiceConfig): ICacheService;
  createEmailService(config: EmailServiceConfig): IEmailService;
  createNotificationService(config: NotificationServiceConfig): INotificationService;
  createIntegrationService(config: IntegrationServiceConfig): IIntegrationService;
  createAnalyticsService(config: AnalyticsServiceConfig): IAnalyticsService;
  createStorageService(config: StorageServiceConfig): IStorageService;
  createAuditService(config: AuditServiceConfig): IAuditService;
  createQueueService(config: QueueServiceConfig): IQueueService;
}

/**
 * Gerenciador de serviços
 */
export interface ServiceManager {
  register<T>(name: string, service: T): void;
  get<T>(name: string): T;
  has(name: string): boolean;
  unregister(name: string): boolean;
  list(): string[];
  health(): Promise<Record<string, boolean>>;
  shutdown(): Promise<void>;
}
