import { prisma } from './prisma';
import * as crypto from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live em segundos (padrão: 300)
  storageType?: 'memory' | 'database'; // Tipo de armazenamento
}

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt: Date;
  createdAt: Date;
}

class MemoryCache {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();
  private maxSize = 1000;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpeza automática a cada 5 minutos
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    // Se cache está cheio, remove entradas expiradas primeiro
    if (this.cache.size >= this.maxSize) {
      this.cleanup();

      // Se ainda está cheio, remove as mais antigas
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value as string;
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
    }

    this.cache.set(key, { value, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  private cleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    let expired = 0;
    const now = Date.now();

    const values = Array.from(this.cache.values());
    for (const entry of values) {
      if (now > entry.expiresAt) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      active: this.cache.size - expired
        };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

class DatabaseCache {
  constructor() {}

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const jsonValue = JSON.stringify(value);

    await prisma.cacheEntry.upsert({
      where: { key },
      update: {
        value: jsonValue,
        expiresAt
        },
      create: {
        key,
        value: jsonValue,
        expiresAt
        }
        });
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = await prisma.cacheEntry.findUnique({
      where: { key }
        });

    if (!entry) {
      return null;
    }

    if (new Date() > entry.expiresAt) {
      // Remove entrada expirada
      await prisma.cacheEntry
        .delete({
          where: { key }
        })
        .catch(() => {}); // Ignora erro se já foi removida

      return null;
    }

    try {
      return JSON.parse(entry.value as string) as T;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await prisma.cacheEntry.delete({
        where: { key }
        });
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    await prisma.cacheEntry.deleteMany();
  }

  async cleanup(): Promise<number> {
    const result = await prisma.cacheEntry.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
        }
        });

    return result.count;
  }

  async getStats() {
    const [total, expired] = await Promise.all([
      prisma.cacheEntry.count(),
      prisma.cacheEntry.count({
        where: {
          expiresAt: { lt: new Date() }
        }
        }),
    ]);

    return {
      size: total,
      expired,
      active: total - expired
        };
  }
}

export class CacheService {
  private memoryCache = new MemoryCache();
  private databaseCache: DatabaseCache;
  private defaultTTL = 300; // 5 minutos

  constructor() {
    this.databaseCache = new DatabaseCache();

    // Limpeza automática do cache de banco a cada hora
    setInterval(
      () => {
        this.databaseCache.cleanup().catch(console.error);
      },
      60 * 60 * 1000
    );
  }

  /**
   * Define um valor no cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = this.defaultTTL, storageType = 'memory' } = options;
    const cacheKey = this.generateKey(key);

    if (storageType === 'memory') {
      this.memoryCache.set(cacheKey, value, ttl);
    } else {
      await this.databaseCache.set(cacheKey, value, ttl);
    }
  }

  /**
   * Obtém um valor do cache
   */
  async get<T>(key: string, storageType: 'memory' | 'database' = 'memory'): Promise<T | null> {
    const cacheKey = this.generateKey(key);

    if (storageType === 'memory') {
      return this.memoryCache.get<T>(cacheKey);
    } else {
      return await this.databaseCache.get<T>(cacheKey);
    }
  }

  /**
   * Remove um valor do cache
   */
  async delete(key: string, storageType: 'memory' | 'database' = 'memory'): Promise<boolean> {
    const cacheKey = this.generateKey(key);

    if (storageType === 'memory') {
      return this.memoryCache.delete(cacheKey);
    } else {
      return await this.databaseCache.delete(cacheKey);
    }
  }

  /**
   * Cache com fallback - tenta memory primeiro, depois database
   */
  async getWithFallback<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateKey(key);

    // Tenta memory cache primeiro
    let value = this.memoryCache.get<T>(cacheKey);
    if (value !== null) {
      return value;
    }

    // Fallback para database cache
    value = await this.databaseCache.get<T>(cacheKey);
    if (value !== null) {
      // Popula memory cache com o valor encontrado
      this.memoryCache.set<T>(cacheKey, value, this.defaultTTL);
    }

    return value;
  }

  /**
   * Wrapper para operações com cache automático
   */
  async wrap<T>(key: string, operation: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const { storageType = 'memory' } = options;

    // Tenta buscar no cache primeiro
    const cached = await this.get<T>(key, storageType);
    if (cached !== null) {
      return cached;
    }

    // Se não encontrou, executa operação
    try {
      const result = await operation();

      // Armazena resultado no cache
      await this.set(key, result, options);

      return result;
    } catch (error: unknown) {
      // Em caso de erro, tenta buscar valor antigo no cache
      const staleCached = await this.get<T>(key, storageType);
      if (staleCached !== null) {
        console.warn(`Operation failed for ${key}, returning stale cache:`, error);
        return staleCached;
      }

      throw error;
    }
  }

  /**
   * Cache com múltiplos níveis e fallback
   */
  async wrapWithFallback<T>(
    key: string,
    operation: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Tenta buscar com fallback
    const cached = await this.getWithFallback<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Se não encontrou, executa operação
    try {
      const result = await operation();

      // Armazena em ambos os caches
      await Promise.all([
        this.set(key, result, { ...options, storageType: 'memory' }),
        this.set(key, result, { ...options, storageType: 'database' }),
      ]);

      return result;
    } catch (error: unknown) {
      // Em caso de erro, tenta buscar valor antigo
      const staleCached = await this.getWithFallback<T>(key);
      if (staleCached !== null) {
        console.warn(`Operation failed for ${key}, returning stale cache:`, error);
        return staleCached;
      }

      throw error;
    }
  }

  /**
   * Invalidar cache por padrão
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // Para memory cache, limpar tudo (implementação simples)
    if (pattern === '*') {
      this.memoryCache.clear();
      await this.databaseCache.clear();
      return;
    }

    // Para database cache, usar LIKE pattern
    // Por simplicidade, implementar limpeza básica
    console.warn(`Pattern invalidation not fully implemented: ${pattern}`);
  }

  /**
   * Estatísticas do cache
   */
  async getStats() {
    const [memoryStats, dbStats] = await Promise.all([
      this.memoryCache.getStats(),
      this.databaseCache.getStats(),
    ]);

    return {
      memory: memoryStats,
      database: dbStats
        };
  }

  /**
   * Gera chave de cache com hash
   */
  private generateKey(key: string): string {
    if (key.length <= 100) {
      return key;
    }

    // Para chaves muito longas, usar hash
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Cleanup manual
   */
  async cleanup(): Promise<{ memory: number; database: number }> {
    // Cleanup manual não é necessário para memory cache (faz automático)
    const dbCleaned = await this.databaseCache.cleanup();

    return {
      memory: 0, // MemoryCache faz limpeza automatica
      database: dbCleaned
        };
  }

  /**
   * Destroy - limpa recursos
   */
  destroy(): void {
    this.memoryCache.destroy();
  }
}

// Singleton instance
let cacheServiceInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService();
  }

  return cacheServiceInstance;
}

// Utilities para cache de integrações específicas

export const IntegrationCache = {
  /**
   * Cache para consultas de CPF
   */
  cpf: {
    key: (cpf: string) => `integration:cpf:${cpf}`,
    ttl: 24 * 60 * 60, // 24 horas
  },

  /**
   * Cache para consultas de CNPJ
   */
  cnpj: {
    key: (cnpj: string) => `integration:cnpj:${cnpj}`,
    ttl: 24 * 60 * 60, // 24 horas
  },

  /**
   * Cache para consultas de CEP
   */
  cep: {
    key: (cep: string) => `integration:cep:${cep}`,
    ttl: 7 * 24 * 60 * 60, // 7 dias
  },

  /**
   * Cache para dados do IBGE
   */
  ibge: {
    key: (type: string, id: string) => `integration:ibge:${type}:${id}`,
    ttl: 30 * 24 * 60 * 60, // 30 dias
  }
        };

// Circuit Breaker para integrações externas
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private maxFailures = 5,
    private resetTimeout = 60000 // 1 minuto
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.failures = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();

      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailTime = Date.now();

      if (this.failures >= this.maxFailures) {
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailTime: this.lastFailTime
        };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailTime = 0;
  }
}
