/**
 * SISTEMA DE TIPOS CENTRALIZADO - GLOBALS
 * TODAS as declarações globais centralizadas
 *
 * IMPORTANTE: Este é o ÚNICO lugar para declarações globais
 * NUNCA crie declarações globais em outros arquivos
 */

import { PrismaClient } from '@prisma/client';
import { UserRole, TenantStatus } from '@prisma/client';
import { UserWithRelations, CitizenWithRelations } from './express.d';
import { UploadedFile, CacheState, RateLimitState } from './middleware';

// ============================================================================
// DECLARAÇÃO GLOBAL DO PRISMA
// ============================================================================

declare global {
  /**
   * Instância global do Prisma para desenvolvimento
   * Previne múltiplas instâncias durante hot reload
   */
  var __prisma: PrismaClient | undefined;
}

// ============================================================================
// EXTENSÃO DO EXPRESS
// ============================================================================

declare global {
  namespace Express {
    /**
     * Extensão da interface Request do Express
     * DEFINIÇÃO ÚNICA E CENTRALIZADA
     */
    interface Request {
      // ========== AUTENTICAÇÃO ==========
      /**
       * ID do usuário autenticado
       */
      userId?: string;

      /**
       * Dados completos do usuário autenticado
       */
      user?: UserWithRelations;

      /**
       * Role/função do usuário autenticado
       */
      userRole?: UserRole;

      // ========== MULTI-TENANCY ==========
      /**
       * ID do tenant atual
       */
      // Single tenant: tenantId e tenant removidos

      // ========== UPLOAD DE ARQUIVOS ==========
      /**
       * Arquivo único carregado via multer
       */
      uploadedFile?: UploadedFile;

      /**
       * Múltiplos arquivos carregados via multer
       */
      uploadedFiles?: UploadedFile[] | { [fieldname: string]: UploadedFile[] };

      // ========== CACHE ==========
      /**
       * Estado do cache para a requisição
       */
      cache?: CacheState;

      // ========== RATE LIMITING ==========
      /**
       * Estado do rate limiting para a requisição
       */
      rateLimit?: RateLimitState;

      // ========== LOGGING E TRACKING ==========
      /**
       * Timestamp de início da requisição para medição de performance
       */
      startTime?: number;

      /**
       * ID único da requisição para rastreamento
       */
      requestId?: string;

      // ========== VALIDAÇÃO ==========
      /**
       * Dados validados da requisição
       */
      validatedData?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };

      // ========== CONTEXTO ADICIONAL ==========
      /**
       * Informações de localização/idioma
       */
      locale?: {
        language: string;
        country: string;
        timezone: string;
      };

      /**
       * Informações do cliente
       */
      clientInfo?: {
        ip: string;
        userAgent: string;
        platform?: string;
        browser?: string;
        version?: string;
      };

      // ========== CIDADÃO (PORTAL) ==========
      /**
       * Dados do cidadão autenticado (portal)
       */
      citizen?: CitizenWithRelations;

      // ========== SESSÃO ==========
      /**
       * ID da sessão ativa
       */
      sessionId?: string;

      /**
       * Dados da sessão
       */
      sessionData?: Record<string, unknown>;

      // ========== PERMISSÕES ==========
      /**
       * Lista de permissões do usuário
       */
      permissions?: string[];

      /**
       * Grupos/papéis do usuário
       */
      groups?: string[];

      // ========== DEBUGGING ==========
      /**
       * Flag para modo debug
       */
      debugMode?: boolean;

      /**
       * Informações de profiling
       */
      profiler?: {
        startTime: number;
        markers: Array<{ name: string; time: number }>;
      };
    }

    /**
     * Extensão da interface Response do Express
     */
    interface Response {
      locals: {
        // ========== INFORMAÇÕES DE USO ==========
        /**
         * Informações de uso do tenant para resposta
         */
        usage?: {
          users: { current: number; limit: number };
          protocols: { current: number; limit: number };
          services: { current: number; limit: number };
          storage?: { current: number; limit: number };
        };

        // ========== CACHE ==========
        /**
         * Indica se a resposta veio do cache
         */
        cached?: boolean;

        /**
         * Chave do cache utilizada
         */
        cacheKey?: string;

        /**
         * TTL do cache em segundos
         */
        cacheTtl?: number;

        // ========== PERFORMANCE ==========
        /**
         * Tempo de resposta em millisegundos
         */
        responseTime?: number;

        /**
         * Uso de memória da requisição
         */
        memoryUsage?: number;

        /**
         * Número de queries executadas
         */
        queryCount?: number;

        // ========== TENANT INFO ==========
        /**
         * Informações do tenant para resposta
         */
        tenantInfo?: {
          plan: string;
          status: TenantStatus;
          trialDaysLeft?: number;
          features: string[];
        };

        // ========== RATE LIMITING ==========
        /**
         * Informações de rate limiting para headers
         */
        rateLimit?: {
          current: number;
          remaining: number;
          resetTime: Date;
          limit: number;
        };

        // ========== ANALYTICS ==========
        /**
         * Dados para analytics
         */
        analytics?: {
          event: string;
          category: string;
          action: string;
          label?: string;
          value?: number;
          customData?: Record<string, unknown>;
        };

        // ========== AUDITORIA ==========
        /**
         * Dados para auditoria
         */
        audit?: {
          action: string;
          resource: string;
          resourceId?: string;
          changes?: {
            before: unknown;
            after: unknown;
          };
        };

        // ========== NOTIFICAÇÕES ==========
        /**
         * Notificações para exibir ao usuário
         */
        notifications?: Array<{
          type: 'success' | 'error' | 'warning' | 'info';
          message: string;
          details?: string;
        }>;

        // ========== METADADOS ==========
        /**
         * Versão da API
         */
        apiVersion?: string;

        /**
         * ID da requisição para rastreamento
         */
        requestId?: string;

        /**
         * Timestamp da resposta
         */
        timestamp?: Date;

        // ========== DADOS PERSONALIZADOS ==========
        /**
         * Permite dados personalizados
         */
        [key: string]: unknown;
      };
    }
  }
}

// ============================================================================
// DECLARAÇÕES GLOBAIS DE NODE.JS
// ============================================================================

declare global {
  namespace NodeJS {
    /**
     * Extensão das variáveis de ambiente
     */
    interface ProcessEnv {
      // ========== BÁSICAS ==========
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      HOST?: string;

      // ========== DATABASE ==========
      DATABASE_URL: string;
      DIRECT_URL?: string;

      // ========== SEGURANÇA ==========
      JWT_SECRET: string;
      ENCRYPTION_KEY?: string;
      SESSION_SECRET?: string;

      // ========== MULTI-TENANCY ==========
      DEFAULT_TENANT?: string;

      // ========== EMAIL ==========
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      SMTP_FROM?: string;

      // ========== STORAGE ==========
      STORAGE_TYPE?: 'local' | 's3' | 'gcs' | 'azure';
      AWS_ACCESS_KEY_ID?: string;
      AWS_SECRET_ACCESS_KEY?: string;
      AWS_REGION?: string;
      AWS_S3_BUCKET?: string;

      // ========== CACHE ==========
      REDIS_URL?: string;
      REDIS_HOST?: string;
      REDIS_PORT?: string;
      REDIS_PASSWORD?: string;

      // ========== INTEGRATIONS ==========
      WHATSAPP_API_KEY?: string;
      SMS_API_KEY?: string;
      WEBHOOK_SECRET?: string;

      // ========== MONITORING ==========
      SENTRY_DSN?: string;
      NEW_RELIC_LICENSE_KEY?: string;

      // ========== ANALYTICS ==========
      GOOGLE_ANALYTICS_ID?: string;
      MIXPANEL_TOKEN?: string;

      // ========== RATE LIMITING ==========
      RATE_LIMIT_WINDOW_MS?: string;
      RATE_LIMIT_MAX_REQUESTS?: string;

      // ========== CUSTOMIZAÇÃO ==========
      CUSTOM_DOMAIN?: string;
      BRAND_NAME?: string;
      SUPPORT_EMAIL?: string;

      // ========== DEBUG ==========
      DEBUG?: string;
      LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    }

    /**
     * Extensão do objeto global
     */
    interface Global {
      /**
       * Cache global para desenvolvimento
       */
      __cache?: Map<string, { value: unknown; expires: number }>;

      /**
       * Contadores globais para debugging
       */
      __counters?: Record<string, number>;

      /**
       * Configurações carregadas
       */
      __config?: Record<string, unknown>;
    }
  }
}

// ============================================================================
// DECLARAÇÕES GLOBAIS DE BIBLIOTECAS EXTERNAS
// ============================================================================

// Removido: declare module '*.json' - não necessário com resolveJsonModule: true
// Removido: declare module '*.env' - causava conflitos de módulo

// ============================================================================
// TIPOS GLOBAIS PERSONALIZADOS
// ============================================================================

declare global {
  /**
   * Utility type para tornar todas as propriedades opcionais recursivamente
   */
  type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };

  /**
   * Utility type para tornar algumas propriedades obrigatórias
   */
  type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

  /**
   * Utility type para criar um tipo com propriedades opcionais exceto algumas
   */
  type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

  /**
   * Utility type para extrair tipos de arrays
   */
  type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

  /**
   * Utility type para criar union de valores de objeto
   */
  type ValueOf<T> = T[keyof T];

  /**
   * Utility type para criar um tipo apenas com as chaves de string
   */
  type StringKeys<T> = Extract<keyof T, string>;

  /**
   * Utility type para criar um tipo com propriedades não-null
   */
  type NonNull<T> = {
    [P in keyof T]: NonNullable<T[P]>;
  };

  /**
   * Utility type para criar timestamp ISO
   */
  type ISOString = string;

  /**
   * Utility type para IDs
   */
  type UUID = string;

  /**
   * Utility type para emails
   */
  type Email = string;

  /**
   * Utility type para URLs como string
   */
  type URLString = string;

  /**
   * Função genérica para logging global
   */
  function __log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: unknown): void;

  /**
   * Função para debugging global
   */
  function __debug(namespace: string, message: string, data?: unknown): void;

  /**
   * Função para medir performance
   */
  function __measure(name: string, fn: () => unknown): unknown;
}

// ============================================================================
// EXTENSÕES DE TIPOS NATIVOS
// ============================================================================

declare global {
  interface String {
    /**
     * Converte string para camelCase
     */
    toCamelCase(): string;

    /**
     * Converte string para kebab-case
     */
    toKebabCase(): string;

    /**
     * Converte string para snake_case
     */
    toSnakeCase(): string;

    /**
     * Trunca string com ellipsis
     */
    truncate(length: number, suffix?: string): string;

    /**
     * Remove HTML tags
     */
    stripHtml(): string;

    /**
     * Escapa HTML
     */
    escapeHtml(): string;
  }

  interface Array<T> {
    /**
     * Agrupa elementos por chave
     */
    groupBy<K extends keyof T>(key: K): Record<string, T[]>;
    groupBy<K>(fn: (item: T) => K): Record<string, T[]>;

    /**
     * Remove duplicatas
     */
    unique(): T[];
    uniqueBy<K extends keyof T>(key: K): T[];
    uniqueBy<K>(fn: (item: T) => K): T[];

    /**
     * Divide array em chunks
     */
    chunk(size: number): T[][];

    /**
     * Embaralha array
     */
    shuffle(): T[];

    /**
     * Pega amostra aleatória
     */
    sample(count?: number): T | T[];

    /**
     * Último elemento
     */
    last(): T | undefined;

    /**
     * Primeiro elemento
     */
    first(): T | undefined;
  }

  interface Date {
    /**
     * Formatar data para ISO string local
     */
    toLocalISOString(): string;

    /**
     * Adicionar dias
     */
    addDays(days: number): Date;

    /**
     * Adicionar horas
     */
    addHours(hours: number): Date;

    /**
     * Início do dia
     */
    startOfDay(): Date;

    /**
     * Fim do dia
     */
    endOfDay(): Date;

    /**
     * É hoje?
     */
    isToday(): boolean;

    /**
     * Diferença em dias
     */
    diffInDays(other: Date): number;
  }

  interface Number {
    /**
     * Formatar como moeda
     */
    toCurrency(currency?: string, locale?: string): string;

    /**
     * Formatar como percentual
     */
    toPercentage(decimals?: number, locale?: string): string;

    /**
     * Formatar tamanho de arquivo
     */
    toFileSize(precision?: number): string;

    /**
     * Limitar entre min e max
     */
    clamp(min: number, max: number): number;
  }
}

// ============================================================================
// EXPORT PARA DISPONIBILIZAR TIPOS
// ============================================================================

export {}; // Torna este arquivo um módulo
