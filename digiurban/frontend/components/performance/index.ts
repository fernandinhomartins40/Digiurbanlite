// Performance Components - Sistema de Performance e Caching

export { PerformanceDashboard } from './PerformanceDashboard'

// Re-export performance hooks for convenience
export { usePerformance, useAsyncPerformance, withPerformance, performanceUtils } from '@/hooks/usePerformance'
export { useCache, usePersistentCache, useSessionCache, useMemoryCache, cacheManager } from '@/hooks/useCache'
import { cacheManager } from '@/hooks/useCache'
export { useOptimizedQuery, useOptimizedMutation, useInfiniteQuery, queryUtils } from '@/hooks/useOptimizedQuery'

// Performance types and interfaces
export interface PerformanceConfig {
  // Monitoring settings
  monitoring: {
    enabled: boolean
    sampleRate: number
    thresholds: {
      lcp: { good: number; poor: number }
      fid: { good: number; poor: number }
      cls: { good: number; poor: number }
      loadTime: { good: number; poor: number }
      renderTime: { good: number; poor: number }
      apiResponseTime: { good: number; poor: number }
    }
    alerts: {
      enabled: boolean
      maxAlerts: number
      notificationChannels: string[]
    }
  }

  // Caching settings
  caching: {
    strategies: {
      memory: {
        enabled: boolean
        maxSize: number
        ttl: number
        strategy: 'lru' | 'fifo' | 'lfu'
      }
      persistent: {
        enabled: boolean
        maxSize: number
        ttl: number
        storage: 'localStorage' | 'indexedDB'
      }
      session: {
        enabled: boolean
        maxSize: number
        ttl: number
      }
    }
    preloading: {
      enabled: boolean
      routes: string[]
      priority: 'high' | 'low'
    }
  }

  // Query optimization settings
  queries: {
    defaultOptions: {
      staleTime: number
      cacheTime: number
      retry: number
      retryDelay: number
      dedupe: boolean
      keepPreviousData: boolean
    }
    backgroundRefetch: {
      enabled: boolean
      interval: number
      onWindowFocus: boolean
      onReconnect: boolean
    }
    batching: {
      enabled: boolean
      maxBatchSize: number
      batchWindow: number
    }
  }

  // Resource optimization settings
  resources: {
    compression: {
      enabled: boolean
      level: number
      types: string[]
    }
    bundling: {
      enabled: boolean
      splitChunks: boolean
      maxSize: number
    }
    images: {
      lazyLoading: boolean
      formats: string[]
      quality: number
    }
  }
}

export interface OptimizationStrategy {
  id: string
  name: string
  description: string
  category: 'caching' | 'query' | 'render' | 'network' | 'memory'
  impact: 'low' | 'medium' | 'high'
  difficulty: 'easy' | 'medium' | 'hard'
  enabled: boolean
  config: Record<string, any>
  metrics: {
    beforeScore: number
    afterScore: number
    improvement: number
  }
}

export interface PerformanceBudget {
  id: string
  name: string
  metrics: {
    loadTime: number
    fcp: number
    lcp: number
    fid: number
    cls: number
    bundleSize: number
    imageSize: number
  }
  alerts: {
    threshold: number
    channels: string[]
  }
  status: 'within_budget' | 'over_budget' | 'critical'
}

export interface CacheStrategy {
  name: string
  description: string
  pattern: string
  ttl: number
  storage: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB'
  maxSize?: number
  priority: number
  conditions?: {
    userAgent?: string[]
    routes?: string[]
    timeOfDay?: { start: string; end: string }
  }
}

// Default configuration
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  monitoring: {
    enabled: true,
    sampleRate: 1.0,
    thresholds: {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      loadTime: { good: 3000, poor: 5000 },
      renderTime: { good: 16, poor: 33 },
      apiResponseTime: { good: 500, poor: 1000 }
    },
    alerts: {
      enabled: true,
      maxAlerts: 50,
      notificationChannels: ['console', 'toast']
    }
  },
  caching: {
    strategies: {
      memory: {
        enabled: true,
        maxSize: 100,
        ttl: 5 * 60 * 1000,
        strategy: 'lru'
      },
      persistent: {
        enabled: true,
        maxSize: 50,
        ttl: 30 * 60 * 1000,
        storage: 'localStorage'
      },
      session: {
        enabled: true,
        maxSize: 75,
        ttl: 15 * 60 * 1000
      }
    },
    preloading: {
      enabled: true,
      routes: ['/dashboard', '/analytics', '/reports'],
      priority: 'low'
    }
  },
  queries: {
    defaultOptions: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: 1000,
      dedupe: true,
      keepPreviousData: true
    },
    backgroundRefetch: {
      enabled: true,
      interval: 30 * 1000,
      onWindowFocus: true,
      onReconnect: true
    },
    batching: {
      enabled: true,
      maxBatchSize: 10,
      batchWindow: 100
    }
  },
  resources: {
    compression: {
      enabled: true,
      level: 6,
      types: ['text/html', 'text/css', 'application/javascript', 'application/json']
    },
    bundling: {
      enabled: true,
      splitChunks: true,
      maxSize: 250 * 1024
    },
    images: {
      lazyLoading: true,
      formats: ['webp', 'avif', 'png', 'jpg'],
      quality: 85
    }
  }
}

// Common optimization strategies
export const OPTIMIZATION_STRATEGIES: OptimizationStrategy[] = [
  {
    id: 'enable-memory-cache',
    name: 'Enable Memory Caching',
    description: 'Cache frequently accessed data in memory for faster retrieval',
    category: 'caching',
    impact: 'high',
    difficulty: 'easy',
    enabled: true,
    config: { maxSize: 100, ttl: 300000 },
    metrics: { beforeScore: 70, afterScore: 85, improvement: 15 }
  },
  {
    id: 'optimize-api-queries',
    name: 'Optimize API Queries',
    description: 'Implement query deduplication and caching for API calls',
    category: 'query',
    impact: 'high',
    difficulty: 'medium',
    enabled: true,
    config: { dedupe: true, cache: true, staleTime: 300000 },
    metrics: { beforeScore: 75, afterScore: 88, improvement: 13 }
  },
  {
    id: 'lazy-load-components',
    name: 'Lazy Load Components',
    description: 'Load components only when needed to reduce initial bundle size',
    category: 'render',
    impact: 'medium',
    difficulty: 'medium',
    enabled: true,
    config: { threshold: 0.1, rootMargin: '50px' },
    metrics: { beforeScore: 80, afterScore: 87, improvement: 7 }
  },
  {
    id: 'enable-service-worker',
    name: 'Enable Service Worker',
    description: 'Cache resources and API responses using service worker',
    category: 'network',
    impact: 'high',
    difficulty: 'hard',
    enabled: false,
    config: { cacheName: 'app-cache', strategies: ['cacheFirst', 'networkFirst'] },
    metrics: { beforeScore: 82, afterScore: 92, improvement: 10 }
  },
  {
    id: 'optimize-images',
    name: 'Optimize Images',
    description: 'Use modern image formats and lazy loading',
    category: 'network',
    impact: 'medium',
    difficulty: 'easy',
    enabled: true,
    config: { formats: ['webp', 'avif'], quality: 85, lazyLoad: true },
    metrics: { beforeScore: 78, afterScore: 84, improvement: 6 }
  },
  {
    id: 'reduce-memory-usage',
    name: 'Reduce Memory Usage',
    description: 'Implement memory management and garbage collection strategies',
    category: 'memory',
    impact: 'medium',
    difficulty: 'medium',
    enabled: true,
    config: { gcThreshold: 100, cleanupInterval: 60000 },
    metrics: { beforeScore: 83, afterScore: 88, improvement: 5 }
  }
]

// Common cache strategies
export const CACHE_STRATEGIES: CacheStrategy[] = [
  {
    name: 'API Response Cache',
    description: 'Cache API responses for faster subsequent requests',
    pattern: '/api/**',
    ttl: 5 * 60 * 1000,
    storage: 'memory',
    maxSize: 50,
    priority: 1
  },
  {
    name: 'Static Asset Cache',
    description: 'Long-term cache for static assets',
    pattern: '/static/**',
    ttl: 24 * 60 * 60 * 1000,
    storage: 'localStorage',
    priority: 2
  },
  {
    name: 'User Session Cache',
    description: 'Cache user session data during browser session',
    pattern: '/user/**',
    ttl: 30 * 60 * 1000,
    storage: 'sessionStorage',
    priority: 3
  },
  {
    name: 'Dashboard Data Cache',
    description: 'Cache dashboard metrics and analytics',
    pattern: '/dashboard/**',
    ttl: 2 * 60 * 1000,
    storage: 'memory',
    maxSize: 25,
    priority: 1,
    conditions: {
      routes: ['/dashboard', '/analytics', '/reports']
    }
  },
  {
    name: 'Report Cache',
    description: 'Cache generated reports for reuse',
    pattern: '/reports/**',
    ttl: 15 * 60 * 1000,
    storage: 'localStorage',
    maxSize: 10,
    priority: 2
  }
]

// Performance utilities
export const performanceConfig = {
  // Get current configuration
  getConfig: (): PerformanceConfig => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('performance-config')
      if (stored) {
        return { ...DEFAULT_PERFORMANCE_CONFIG, ...JSON.parse(stored) }
      }
    }
    return DEFAULT_PERFORMANCE_CONFIG
  },

  // Update configuration
  updateConfig: (updates: Partial<PerformanceConfig>) => {
    const current = performanceConfig.getConfig()
    const newConfig = { ...current, ...updates }

    if (typeof window !== 'undefined') {
      localStorage.setItem('performance-config', JSON.stringify(newConfig))
    }

    return newConfig
  },

  // Reset to defaults
  reset: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('performance-config')
    }
    return DEFAULT_PERFORMANCE_CONFIG
  },

  // Validate configuration
  validate: (config: PerformanceConfig): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Validate monitoring thresholds
    Object.entries(config.monitoring.thresholds).forEach(([key, threshold]) => {
      if (threshold.good >= threshold.poor) {
        errors.push(`${key}: good threshold must be less than poor threshold`)
      }
    })

    // Validate cache sizes
    Object.entries(config.caching.strategies).forEach(([key, strategy]) => {
      if (strategy.maxSize && strategy.maxSize <= 0) {
        errors.push(`${key}: maxSize must be greater than 0`)
      }
      if (strategy.ttl <= 0) {
        errors.push(`${key}: ttl must be greater than 0`)
      }
    })

    // Validate query options
    if (config.queries.defaultOptions.staleTime < 0) {
      errors.push('staleTime must be non-negative')
    }
    if (config.queries.defaultOptions.retry < 0) {
      errors.push('retry must be non-negative')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Performance monitoring utilities
export const performanceMonitor = {
  // Start monitoring session
  startSession: () => {
    const sessionId = `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('performance-session-id', sessionId)
      sessionStorage.setItem('performance-session-start', Date.now().toString())
    }

    return sessionId
  },

  // End monitoring session
  endSession: () => {
    if (typeof window !== 'undefined') {
      const sessionId = sessionStorage.getItem('performance-session-id')
      const startTime = sessionStorage.getItem('performance-session-start')

      if (sessionId && startTime) {
        const duration = Date.now() - parseInt(startTime, 10)

        // Clean up session storage
        sessionStorage.removeItem('performance-session-id')
        sessionStorage.removeItem('performance-session-start')

        return {
          sessionId,
          duration
        }
      }
    }

    return null
  },

  // Get current session info
  getSession: () => {
    if (typeof window !== 'undefined') {
      const sessionId = sessionStorage.getItem('performance-session-id')
      const startTime = sessionStorage.getItem('performance-session-start')

      if (sessionId && startTime) {
        return {
          sessionId,
          startTime: parseInt(startTime, 10),
          duration: Date.now() - parseInt(startTime, 10)
        }
      }
    }

    return null
  }
}

// Cache management utilities
export const cacheUtils = {
  // Get cache usage statistics
  getUsageStats: () => {
    return cacheManager.getAllStats()
  },

  // Clear all caches
  clearAll: () => {
    cacheManager.default.clear()
    cacheManager.persistent.clear()
    cacheManager.session.clear()
  },

  // Cleanup expired entries
  cleanup: () => {
    cacheManager.cleanup()
  },

  // Get cache efficiency metrics
  getEfficiency: () => {
    const stats = cacheManager.getAllStats()

    return {
      overall: {
        totalHits: Object.values(stats).reduce((sum, stat) => sum + stat.hits, 0),
        totalMisses: Object.values(stats).reduce((sum, stat) => sum + stat.misses, 0),
        averageHitRate: Object.values(stats).reduce((sum, stat) => sum + stat.hitRate, 0) / Object.keys(stats).length,
        totalSize: Object.values(stats).reduce((sum, stat) => sum + stat.size, 0),
        totalCapacity: Object.values(stats).reduce((sum, stat) => sum + stat.maxSize, 0)
      },
      byCache: stats
    }
  }
}

// Performance constants
export const PERFORMANCE_CONSTANTS = {
  THRESHOLDS: {
    EXCELLENT: 90,
    GOOD: 80,
    FAIR: 60,
    POOR: 40
  },
  WEB_VITALS: {
    LCP_GOOD: 2500,
    LCP_POOR: 4000,
    FID_GOOD: 100,
    FID_POOR: 300,
    CLS_GOOD: 0.1,
    CLS_POOR: 0.25
  },
  CACHE_SIZES: {
    SMALL: 25,
    MEDIUM: 50,
    LARGE: 100,
    XLARGE: 200
  },
  TTL_PRESETS: {
    SHORT: 1 * 60 * 1000,      // 1 minute
    MEDIUM: 5 * 60 * 1000,     // 5 minutes
    LONG: 30 * 60 * 1000,      // 30 minutes
    EXTENDED: 24 * 60 * 60 * 1000  // 24 hours
  }
} as const