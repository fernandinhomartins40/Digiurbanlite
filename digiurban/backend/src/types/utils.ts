/**
 * SISTEMA DE TIPOS CENTRALIZADO - UTILS
 * Todos os tipos relacionados a utilitários centralizados
 *
 * IMPORTANTE: Use sempre estes tipos, nunca crie definições locais
 */

// ============================================================================
// TIPOS DE VALIDAÇÃO
// ============================================================================

/**
 * Resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

/**
 * Erro de validação
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: unknown;
  type?: 'required' | 'format' | 'range' | 'custom';
}

/**
 * Aviso de validação
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code?: string;
  value?: unknown;
}

/**
 * Regras de validação para campo
 */
export interface FieldValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
  allowEmpty?: boolean;
}

/**
 * Schema de validação
 */
export interface ValidationSchema {
  [fieldName: string]: FieldValidationRule;
}

/**
 * Opções de validação
 */
export interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  allowUnknown?: boolean;
  context?: Record<string, unknown>;
}

// ============================================================================
// TIPOS DE FORMATAÇÃO
// ============================================================================

/**
 * Opções de formatação de data
 */
export interface DateFormatOptions {
  format?: 'short' | 'medium' | 'long' | 'full' | string;
  locale?: string;
  timezone?: string;
  includeTime?: boolean;
  relative?: boolean;
}

/**
 * Opções de formatação de número
 */
export interface NumberFormatOptions {
  locale?: string;
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

/**
 * Opções de formatação de texto
 */
export interface TextFormatOptions {
  case?: 'upper' | 'lower' | 'title' | 'sentence';
  trim?: boolean;
  removeExtraSpaces?: boolean;
  removeSpecialChars?: boolean;
  maxLength?: number;
  ellipsis?: boolean;
}

// ============================================================================
// TIPOS DE TRANSFORMAÇÃO
// ============================================================================

/**
 * Transformador genérico
 */
export interface Transformer<TInput, TOutput> {
  transform(input: TInput): TOutput;
  validate?(input: TInput): boolean;
}

/**
 * Pipeline de transformação
 */
export interface TransformPipeline<TInput, TOutput> {
  steps: Transformer<unknown, unknown>[];
  execute(input: TInput): TOutput;
  addStep<TStep>(transformer: Transformer<unknown, TStep>): TransformPipeline<TInput, TStep>;
}

/**
 * Opções de transformação
 */
export interface TransformOptions {
  strict?: boolean;
  skipErrors?: boolean;
  defaultValue?: unknown;
  context?: Record<string, unknown>;
}

// ============================================================================
// TIPOS DE PAGINAÇÃO
// ============================================================================

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Metadados de paginação
 */
export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage?: number;
  previousPage?: number;
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Opções de paginação
 */
export interface PaginationOptions {
  maxLimit?: number;
  defaultLimit?: number;
  defaultPage?: number;
  allowZeroResults?: boolean;
}

// ============================================================================
// TIPOS DE ORDENAÇÃO
// ============================================================================

/**
 * Direção da ordenação
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Campo de ordenação
 */
export interface SortField {
  field: string;
  direction: SortDirection;
}

/**
 * Parâmetros de ordenação
 */
export interface SortParams {
  sortBy?: string | string[];
  sortDir?: SortDirection | SortDirection[];
  sortFields?: SortField[];
}

/**
 * Opções de ordenação
 */
export interface SortOptions {
  allowedFields?: string[];
  defaultSort?: SortField[];
  caseSensitive?: boolean;
  nullsFirst?: boolean;
}

// ============================================================================
// TIPOS DE FILTROS
// ============================================================================

/**
 * Operadores de filtro
 */
export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'between'
  | 'exists'
  | 'regex';

/**
 * Filtro individual
 */
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: unknown;
  values?: unknown[];
}

/**
 * Grupo de filtros
 */
export interface FilterGroup {
  logic: 'AND' | 'OR';
  filters: (Filter | FilterGroup)[];
}

/**
 * Parâmetros de filtro
 */
export interface FilterParams {
  filters?: (Filter | FilterGroup)[];
  search?: string;
  searchFields?: string[];
}

/**
 * Opções de filtro
 */
export interface FilterOptions {
  allowedFields?: string[];
  allowedOperators?: FilterOperator[];
  searchable?: boolean;
  caseSensitive?: boolean;
}

// ============================================================================
// TIPOS DE CACHE HELPER
// ============================================================================

/**
 * Chave de cache composta
 */
export interface CacheKey {
  prefix: string;
  identifier: string | number;
  suffix?: string;
  version?: string;
}

/**
 * Estratégia de cache
 */
export type CacheStrategy =
  | 'cache-first' // Cache primeiro, fallback para fonte
  | 'source-first' // Fonte primeiro, cache como backup
  | 'cache-only' // Apenas cache, não vai para fonte
  | 'source-only' // Apenas fonte, não usa cache
  | 'refresh'; // Força refresh do cache

/**
 * Opções de cache helper
 */
export interface CacheHelperOptions {
  strategy?: CacheStrategy;
  ttl?: number;
  namespace?: string;
  tags?: string[];
  serialize?: boolean;
  compress?: boolean;
}

// ============================================================================
// TIPOS DE RATE LIMITING
// ============================================================================

/**
 * Configuração de rate limit
 */
export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requests na janela
  keyGenerator?: (context: unknown) => string;
  skipSuccessful?: boolean;
  skipFailed?: boolean;
  message?: string;
  statusCode?: number;
}

/**
 * Status do rate limit
 */
export interface RateLimitStatus {
  current: number;
  remaining: number;
  resetTime: Date;
  blocked: boolean;
}

// ============================================================================
// TIPOS DE RETRY
// ============================================================================

/**
 * Configuração de retry
 */
export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff?: 'fixed' | 'exponential' | 'linear';
  backoffMultiplier?: number;
  maxDelay?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Resultado de retry
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: unknown;
  attempts: number;
  totalTime: number;
}

// ============================================================================
// TIPOS DE PERFORMANCE
// ============================================================================

/**
 * Métrica de performance
 */
export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memory?: {
    used: number;
    total: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Profiler de performance
 */
export interface PerformanceProfiler {
  start(name: string): void;
  end(name: string): PerformanceMetric;
  measure(name: string, fn: () => unknown): Promise<{ result: unknown; metric: PerformanceMetric }>;
  getMetrics(): PerformanceMetric[];
  reset(): void;
  summary(): {
    total: number;
    average: number;
    min: number;
    max: number;
    count: number;
  };
}

// ============================================================================
// TIPOS DE HEALTH CHECK
// ============================================================================

/**
 * Status de health check
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Resultado de health check
 */
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Configuração de health check
 */
export interface HealthCheckConfig {
  name: string;
  timeout: number;
  interval?: number;
  enabled?: boolean;
  critical?: boolean;
  check: () => Promise<HealthCheckResult>;
}

/**
 * Resumo geral de saúde
 */
export interface HealthSummary {
  status: HealthStatus;
  checks: HealthCheckResult[];
  uptime: number;
  timestamp: Date;
  version?: string;
  environment?: string;
}

// ============================================================================
// TIPOS DE LOGGING
// ============================================================================

/**
 * Nível de log
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Entrada de log estruturado
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  tenantId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Configuração de logger
 */
export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'text';
  includeTimestamp: boolean;
  includeLevel: boolean;
  colors?: boolean;
  destination?: 'console' | 'file' | 'both';
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

// ============================================================================
// TIPOS DE CRIPTOGRAFIA
// ============================================================================

/**
 * Configuração de hash
 */
export interface HashConfig {
  algorithm: 'bcrypt' | 'argon2' | 'scrypt';
  saltRounds?: number;
  memory?: number;
  time?: number;
  parallelism?: number;
}

/**
 * Configuração de criptografia
 */
export interface EncryptionConfig {
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
  keyLength: number;
  ivLength: number;
}

/**
 * Resultado da criptografia
 */
export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag?: string;
  algorithm: string;
}

// ============================================================================
// TIPOS DE UTILITIES GERAIS
// ============================================================================

/**
 * Função de comparação genérica
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * Função de predicate
 */
export type Predicate<T> = (item: T) => boolean;

/**
 * Função de mapeamento
 */
export type Mapper<T, R> = (item: T, index?: number) => R;

/**
 * Função de redução
 */
export type Reducer<T, R> = (accumulator: R, current: T, index?: number) => R;

/**
 * Opções de debounce/throttle
 */
export interface DebounceOptions {
  delay: number;
  immediate?: boolean;
  maxWait?: number;
}

/**
 * Função debounced
 */
export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
  pending(): boolean;
}

/**
 * Opções de deep merge
 */
export interface DeepMergeOptions {
  arrays?: 'replace' | 'merge' | 'concat';
  clone?: boolean;
  customMerge?: (key: string, target: unknown, source: unknown) => unknown;
}

/**
 * Opções de deep clone
 */
export interface DeepCloneOptions {
  includeNonEnumerable?: boolean;
  includeSymbols?: boolean;
  customClone?: (value: unknown, key?: string) => unknown;
}

/**
 * Utilitários de string
 */
export interface StringUtils {
  camelCase(str: string): string;
  kebabCase(str: string): string;
  snakeCase(str: string): string;
  pascalCase(str: string): string;
  capitalize(str: string): string;
  slugify(str: string): string;
  truncate(str: string, length: number, suffix?: string): string;
  stripHtml(str: string): string;
  escapeHtml(str: string): string;
  unescapeHtml(str: string): string;
}

/**
 * Utilitários de array
 */
export interface ArrayUtils {
  chunk<T>(array: T[], size: number): T[][];
  unique<T>(array: T[]): T[];
  uniqueBy<T>(array: T[], key: keyof T | ((item: T) => unknown)): T[];
  groupBy<T>(array: T[], key: keyof T | ((item: T) => unknown)): Record<string, T[]>;
  sortBy<T>(array: T[], key: keyof T | ((item: T) => unknown), direction?: SortDirection): T[];
  shuffle<T>(array: T[]): T[];
  sample<T>(array: T[], count?: number): T | T[];
  difference<T>(array1: T[], array2: T[]): T[];
  intersection<T>(array1: T[], array2: T[]): T[];
  union<T>(array1: T[], array2: T[]): T[];
}

/**
 * Utilitários de objeto
 */
export interface ObjectUtils {
  pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
  omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
  get(obj: Record<string, unknown>, path: string, defaultValue?: unknown): unknown;
  set(obj: Record<string, unknown>, path: string, value: unknown): void;
  has(obj: Record<string, unknown>, path: string): boolean;
  flatten(obj: Record<string, unknown>, prefix?: string): Record<string, unknown>;
  unflatten(obj: Record<string, unknown>): Record<string, unknown>;
  deepMerge(target: Record<string, unknown>, ...sources: Record<string, unknown>[]): Record<string, unknown>;
  deepClone<T>(obj: T): T;
  isEmpty(obj: unknown): boolean;
  isEqual(obj1: unknown, obj2: unknown): boolean;
}

// ============================================================================
// INTERFACES GERAIS DE UTILITIES
// ============================================================================

/**
 * Validator service interface
 */
export interface IValidatorService {
  validate(data: Record<string, unknown>, schema: ValidationSchema, options?: ValidationOptions): ValidationResult;
  validateField(value: unknown, rules: FieldValidationRule): ValidationResult;
  addCustomRule(name: string, rule: (value: unknown, ...args: unknown[]) => boolean | string): void;
  getSchema(name: string): ValidationSchema | null;
  registerSchema(name: string, schema: ValidationSchema): void;
}

/**
 * Formatter service interface
 */
export interface IFormatterService {
  formatDate(date: Date | string, options?: DateFormatOptions): string;
  formatNumber(number: number, options?: NumberFormatOptions): string;
  formatText(text: string, options?: TextFormatOptions): string;
  formatCurrency(amount: number, currency?: string, locale?: string): string;
  formatPercentage(value: number, locale?: string): string;
  formatFileSize(bytes: number, precision?: number): string;
  formatDuration(milliseconds: number): string;
}

/**
 * Crypto service interface
 */
export interface ICryptoService {
  hash(data: string, config?: HashConfig): Promise<string>;
  verify(data: string, hash: string): Promise<boolean>;
  encrypt(data: string, key?: string, config?: EncryptionConfig): EncryptionResult;
  decrypt(encrypted: EncryptionResult, key?: string): string;
  generateKey(length?: number): string;
  generateSalt(length?: number): string;
  randomBytes(length: number): Buffer;
  uuid(): string;
}
