// ============================================================================
// UTILITÁRIOS PARA OPERAÇÕES ASSÍNCRONAS - FASE 2 - 2024
// ============================================================================

// Helper para retry com backoff exponencial
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 10000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);

      await sleep(delay);
    }
  }

  throw lastError!;
}

// Helper para sleep
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper para timeout de promises
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
  ]);
}

// Helper para executar promises em paralelo com limite
export async function parallelLimit<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = operation(item).then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

// Helper para debounce assíncrono
export function asyncDebounce<T extends unknown[], R>(
  func: (...args: T) => Promise<R>,
  delay: number
): (...args: T) => Promise<R> {
  let timeoutId: NodeJS.Timeout;
  let latestResolve: (value: R) => void;
  let latestReject: (error: unknown) => void;

  return (...args: T): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      latestResolve = resolve;
      latestReject = reject;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          latestResolve(result);
        } catch (error: unknown) {
          latestReject(error);
        }
      }, delay);
    });
  };
}

// Helper para throttle assíncrono
export function asyncThrottle<T extends unknown[], R>(
  func: (...args: T) => Promise<R>,
  delay: number
): (...args: T) => Promise<R | null> {
  let isThrottled = false;
  let lastResult: R | null = null;

  return async (...args: T): Promise<R | null> => {
    if (isThrottled) {
      return lastResult;
    }

    isThrottled = true;

    try {
      const result = await func(...args);
      lastResult = result;
      return result;
    } finally {
      setTimeout(() => {
        isThrottled = false;
      }, delay);
    }
  };
}

// Helper para cache com TTL
export class AsyncCache<K, V> {
  private cache = new Map<K, { value: V; expires: number }>();
  private readonly ttlMs: number;

  constructor(ttlMs: number = 300000) {
    // 5 minutos default
    this.ttlMs = ttlMs;
  }

  async get(key: K, factory: () => Promise<V>): Promise<V> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now < cached.expires) {
      return cached.value;
    }

    const value = await factory();
    this.cache.set(key, {
      value,
      expires: now + this.ttlMs
        });

    return value;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Limpa entradas expiradas
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((entry, key) => {
      if (now >= entry.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    return cleaned;
  }
}

// Helper para queue com processamento assíncrono
export class AsyncQueue<T> {
  private queue: T[] = [];
  private processing = false;
  private readonly processor: (item: T) => Promise<void>;
  private readonly concurrency: number;

  constructor(processor: (item: T) => Promise<void>, concurrency: number = 1) {
    this.processor = processor;
    this.concurrency = concurrency;
  }

  async add(item: T): Promise<void> {
    this.queue.push(item);

    if (!this.processing) {
      await this.process();
    }
  }

  async addMany(items: T[]): Promise<void> {
    this.queue.push(...items);

    if (!this.processing) {
      await this.process();
    }
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.concurrency);
        await Promise.all(batch.map(item => this.processor(item)));
      }
    } finally {
      this.processing = false;
    }
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

// Helper para circuit breaker pattern
export class CircuitBreaker<T extends unknown[], R> {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private operation: (...args: T) => Promise<R>,
    private failureThreshold: number = 5,
    private recoveryTimeMs: number = 60000, // 1 minuto
    private timeoutMs: number = 30000 // 30 segundos
  ) {}

  async execute(...args: T): Promise<R> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await withTimeout(
        this.operation(...args),
        this.timeoutMs,
        'Circuit breaker timeout'
      );

      // Sucesso - reset do circuit breaker
      this.failures = 0;
      this.state = 'CLOSED';
      return result;
    } catch (error: unknown) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

// Helper para memoização assíncrona
export function memoizeAsync<T extends unknown[], R>(
  func: (...args: T) => Promise<R>,
  keyGenerator?: (...args: T) => string,
  ttlMs: number = 300000 // 5 minutos
): (...args: T) => Promise<R> {
  const cache = new Map<string, { value: Promise<R>; expires: number }>();

  const defaultKeyGenerator = (...args: T): string => {
    return JSON.stringify(args);
  };

  const generateKey = keyGenerator || defaultKeyGenerator;

  return async (...args: T): Promise<R> => {
    const key = generateKey(...args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now < cached.expires) {
      return cached.value;
    }

    const promise = func(...args);
    cache.set(key, {
      value: promise,
      expires: now + ttlMs
        });

    try {
      const result = await promise;
      return result;
    } catch (error: unknown) {
      // Remove do cache em caso de erro
      cache.delete(key);
      throw error;
    }
  };
}

// Helper para executar operações com semáforo (limite de concorrência)
export class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    return new Promise(resolve => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waiting.push(resolve);
      }
    });
  }

  release(): void {
    this.permits++;
    const nextResolve = this.waiting.shift();
    if (nextResolve) {
      this.permits--;
      nextResolve();
    }
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await operation();
    } finally {
      this.release();
    }
  }

  getAvailablePermits(): number {
    return this.permits;
  }

  getWaitingCount(): number {
    return this.waiting.length;
  }
}

// Helper para agrupar operações assíncronas (batching)
export class AsyncBatcher<T, R> {
  private batch: T[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly processor: (batch: T[]) => Promise<R[]>;
  private readonly batchSize: number;
  private readonly batchTimeoutMs: number;

  constructor(
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 10,
    batchTimeoutMs: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.batchTimeoutMs = batchTimeoutMs;
  }

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.batch.push(item);

      const index = this.batch.length - 1;

      // Schedule processing
      if (this.batch.length >= this.batchSize) {
        this.processBatch()
          .then(results => {
            const result = results[index];
            if (result !== undefined) {
              resolve(result);
            } else {
              reject(new Error('Resultado não encontrado no batch'));
            }
          })
          .catch(reject);
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch()
            .then(results => {
              const result = results[index];
              if (result !== undefined) {
                resolve(result);
              } else {
                reject(new Error('Resultado não encontrado no batch'));
              }
            })
            .catch(reject);
        }, this.batchTimeoutMs);
      }
    });
  }

  private async processBatch(): Promise<R[]> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      return await this.processor(currentBatch);
    } catch (error: unknown) {
      console.error('Error processing batch:', error);
      throw error;
    }
  }
}
