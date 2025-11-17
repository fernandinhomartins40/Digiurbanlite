import { useState, useEffect, useCallback, useRef } from 'react'

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size
  strategy?: 'lru' | 'fifo' | 'lfu' // Cache eviction strategy
  prefix?: string
  storageType?: 'memory' | 'sessionStorage' | 'localStorage'
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  accessCount: number
  lastAccessed: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  maxSize: number
  hitRate: number
}

class CacheManager<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private options: Required<CacheOptions>
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    maxSize: 0,
    hitRate: 0
  }

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      strategy: options.strategy || 'lru',
      prefix: options.prefix || 'cache',
      storageType: options.storageType || 'memory'
    }
    this.stats.maxSize = this.options.maxSize
    this.loadFromStorage()
  }

  private generateKey(key: string): string {
    return `${this.options.prefix}:${key}`
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.options.ttl
  }

  private evict(): void {
    if (this.cache.size <= this.options.maxSize) return

    let keyToEvict: string | undefined

    switch (this.options.strategy) {
      case 'lru':
        keyToEvict = this.findLRUKey()
        break
      case 'lfu':
        keyToEvict = this.findLFUKey()
        break
      case 'fifo':
        keyToEvict = this.findFIFOKey()
        break
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict)
      this.saveToStorage()
    }
  }

  private findLRUKey(): string | undefined {
    let oldestKey: string | undefined
    let oldestTime = Date.now()

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    return oldestKey
  }

  private findLFUKey(): string | undefined {
    let leastUsedKey: string | undefined
    let leastCount = Number.MAX_SAFE_INTEGER

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount
        leastUsedKey = key
      }
    }

    return leastUsedKey
  }

  private findFIFOKey(): string | undefined {
    let oldestKey: string | undefined
    let oldestTime = Date.now()

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  private loadFromStorage(): void {
    if (this.options.storageType === 'memory') return

    try {
      const storage = this.options.storageType === 'localStorage' ? localStorage : sessionStorage
      const data = storage.getItem(this.options.prefix)

      if (data) {
        const parsed = JSON.parse(data)
        this.cache = new Map(parsed.entries)
        this.stats = parsed.stats
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error)
    }
  }

  private saveToStorage(): void {
    if (this.options.storageType === 'memory') return

    try {
      const storage = this.options.storageType === 'localStorage' ? localStorage : sessionStorage
      const data = {
        entries: Array.from(this.cache.entries()),
        stats: this.stats
      }
      storage.setItem(this.options.prefix, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save cache to storage:', error)
    }
  }

  get(key: string): T | undefined {
    const fullKey = this.generateKey(key)
    const entry = this.cache.get(fullKey)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return undefined
    }

    if (this.isExpired(entry)) {
      this.cache.delete(fullKey)
      this.stats.misses++
      this.updateHitRate()
      this.saveToStorage()
      return undefined
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.stats.hits++
    this.updateHitRate()

    return entry.data
  }

  set(key: string, data: T): void {
    const fullKey = this.generateKey(key)
    const now = Date.now()

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now
    }

    this.cache.set(fullKey, entry)
    this.stats.size = this.cache.size
    this.evict()
    this.saveToStorage()
  }

  delete(key: string): boolean {
    const fullKey = this.generateKey(key)
    const deleted = this.cache.delete(fullKey)

    if (deleted) {
      this.stats.size = this.cache.size
      this.saveToStorage()
    }

    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize: this.options.maxSize,
      hitRate: 0
    }
    this.saveToStorage()
  }

  has(key: string): boolean {
    const fullKey = this.generateKey(key)
    const entry = this.cache.get(fullKey)

    if (!entry) return false
    if (this.isExpired(entry)) {
      this.cache.delete(fullKey)
      this.saveToStorage()
      return false
    }

    return true
  }

  getStats(): CacheStats {
    return { ...this.stats }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  // Clean expired entries
  cleanup(): void {
    const keysToDelete: string[] = []

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.size = this.cache.size
    this.saveToStorage()
  }
}

// Cache instances for different use cases
const defaultCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  strategy: 'lru',
  prefix: 'app-cache',
  storageType: 'memory'
})

const persistentCache = new CacheManager({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 50,
  strategy: 'lru',
  prefix: 'persistent-cache',
  storageType: 'localStorage'
})

const sessionCache = new CacheManager({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 75,
  strategy: 'lru',
  prefix: 'session-cache',
  storageType: 'sessionStorage'
})

export function useCache<T = any>(
  cacheKey: string,
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const cacheRef = useRef<CacheManager<T>>(
    new CacheManager<T>(options)
  )

  const get = useCallback((key?: string): T | undefined => {
    const actualKey = key || cacheKey
    return cacheRef.current.get(actualKey)
  }, [cacheKey])

  const set = useCallback((value: T, key?: string): void => {
    const actualKey = key || cacheKey
    cacheRef.current.set(actualKey, value)
    setData(value)
  }, [cacheKey])

  const remove = useCallback((key?: string): boolean => {
    const actualKey = key || cacheKey
    const deleted = cacheRef.current.delete(actualKey)
    if (deleted && actualKey === cacheKey) {
      setData(undefined)
    }
    return deleted
  }, [cacheKey])

  const clear = useCallback((): void => {
    cacheRef.current.clear()
    setData(undefined)
  }, [])

  const refresh = useCallback(async (fetchFn: () => Promise<T>): Promise<T> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchFn()
      set(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [set])

  const getOrFetch = useCallback(async (fetchFn: () => Promise<T>): Promise<T> => {
    const cachedData = get()

    if (cachedData !== undefined) {
      setData(cachedData)
      return cachedData
    }

    return refresh(fetchFn)
  }, [get, refresh])

  const getStats = useCallback(() => {
    return cacheRef.current.getStats()
  }, [])

  const cleanup = useCallback(() => {
    cacheRef.current.cleanup()
  }, [])

  // Load initial data from cache
  useEffect(() => {
    const cachedData = get()
    if (cachedData !== undefined) {
      setData(cachedData)
    }
  }, [get])

  return {
    data,
    isLoading,
    error,
    get,
    set,
    remove,
    clear,
    refresh,
    getOrFetch,
    getStats,
    cleanup
  }
}

// Specialized cache hooks
export function usePersistentCache<T = any>(key: string) {
  return {
    get: (cacheKey?: string) => persistentCache.get(cacheKey || key),
    set: (data: T, cacheKey?: string) => persistentCache.set(cacheKey || key, data),
    remove: (cacheKey?: string) => persistentCache.delete(cacheKey || key),
    clear: () => persistentCache.clear(),
    has: (cacheKey?: string) => persistentCache.has(cacheKey || key),
    getStats: () => persistentCache.getStats()
  }
}

export function useSessionCache<T = any>(key: string) {
  return {
    get: (cacheKey?: string) => sessionCache.get(cacheKey || key),
    set: (data: T, cacheKey?: string) => sessionCache.set(cacheKey || key, data),
    remove: (cacheKey?: string) => sessionCache.delete(cacheKey || key),
    clear: () => sessionCache.clear(),
    has: (cacheKey?: string) => sessionCache.has(cacheKey || key),
    getStats: () => sessionCache.getStats()
  }
}

export function useMemoryCache<T = any>(key: string) {
  return {
    get: (cacheKey?: string) => defaultCache.get(cacheKey || key),
    set: (data: T, cacheKey?: string) => defaultCache.set(cacheKey || key, data),
    remove: (cacheKey?: string) => defaultCache.delete(cacheKey || key),
    clear: () => defaultCache.clear(),
    has: (cacheKey?: string) => defaultCache.has(cacheKey || key),
    getStats: () => defaultCache.getStats()
  }
}

// Cache management utilities
export const cacheManager = {
  default: defaultCache,
  persistent: persistentCache,
  session: sessionCache,

  // Global cleanup
  cleanup: () => {
    defaultCache.cleanup()
    persistentCache.cleanup()
    sessionCache.cleanup()
  },

  // Global stats
  getAllStats: () => ({
    memory: defaultCache.getStats(),
    persistent: persistentCache.getStats(),
    session: sessionCache.getStats()
  })
}