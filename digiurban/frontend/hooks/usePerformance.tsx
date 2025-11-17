import React, { useState, useEffect, useCallback, useRef } from 'react'

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte

  // Custom metrics
  loadTime: number
  renderTime: number
  apiResponseTime: Record<string, number>
  componentRenderTime: Record<string, number>
  memoryUsage?: any
  networkInfo?: any

  // User interaction metrics
  clickResponseTime: number[]
  scrollPerformance: number[]

  // Resource metrics
  resourceTiming: PerformanceResourceTiming[]
  navigationTiming: PerformanceNavigationTiming | null
}

interface PerformanceThresholds {
  lcp: { good: number; poor: number }
  fid: { good: number; poor: number }
  cls: { good: number; poor: number }
  loadTime: { good: number; poor: number }
  renderTime: { good: number; poor: number }
  apiResponseTime: { good: number; poor: number }
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'error'
  metric: string
  value: number
  threshold: number
  message: string
  timestamp: number
}

interface ComponentPerformance {
  name: string
  renderCount: number
  avgRenderTime: number
  maxRenderTime: number
  minRenderTime: number
  lastRenderTime: number
  timestamps: number[]
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  loadTime: { good: 3000, poor: 5000 },
  renderTime: { good: 16, poor: 33 }, // 60fps = 16ms, 30fps = 33ms
  apiResponseTime: { good: 500, poor: 1000 }
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics
  private thresholds: PerformanceThresholds
  private alerts: PerformanceAlert[] = []
  private componentMetrics = new Map<string, ComponentPerformance>()
  private observers: PerformanceObserver[] = []
  private startTime = Date.now()

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      apiResponseTime: {},
      componentRenderTime: {},
      clickResponseTime: [],
      scrollPerformance: [],
      resourceTiming: [],
      navigationTiming: null
    }

    this.initializeObservers()
    this.measureInitialLoad()
  }

  private initializeObservers() {
    // Web Vitals Observer
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // LCP Observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            this.metrics.lcp = lastEntry.startTime
            this.checkThreshold('lcp', lastEntry.startTime)
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)

        // FID Observer
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime
              this.metrics.fid = fid
              this.checkThreshold('fid', fid)
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)

        // CLS Observer
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.metrics.cls = clsValue
          this.checkThreshold('cls', clsValue)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)

        // Navigation Observer
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.metrics.navigationTiming = entry as PerformanceNavigationTiming
              this.calculateLoadMetrics()
            }
          })
        })
        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navigationObserver)

        // Resource Observer
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceResourceTiming[]
          this.metrics.resourceTiming.push(...entries)
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)

      } catch (error) {
        console.warn('Performance Observer not fully supported:', error)
      }
    }
  }

  private measureInitialLoad() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = Date.now() - this.startTime
        this.metrics.loadTime = loadTime
        this.checkThreshold('loadTime', loadTime)

        // Measure FCP
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime
        }

        // Measure TTFB
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigationEntry) {
          this.metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart
        }
      })
    }
  }

  private calculateLoadMetrics() {
    const nav = this.metrics.navigationTiming
    if (nav) {
      this.metrics.loadTime = nav.loadEventEnd - nav.fetchStart
      this.checkThreshold('loadTime', this.metrics.loadTime)
    }
  }

  private checkThreshold(metric: keyof PerformanceThresholds, value: number) {
    const threshold = this.thresholds[metric]
    if (!threshold) return

    let alertType: 'warning' | 'error' | null = null
    let thresholdValue = 0

    if (value > threshold.poor) {
      alertType = 'error'
      thresholdValue = threshold.poor
    } else if (value > threshold.good) {
      alertType = 'warning'
      thresholdValue = threshold.good
    }

    if (alertType) {
      this.addAlert({
        id: `${metric}-${Date.now()}`,
        type: alertType,
        metric,
        value,
        threshold: thresholdValue,
        message: `${metric.toUpperCase()} exceeded ${alertType} threshold: ${value.toFixed(2)}ms > ${thresholdValue}ms`,
        timestamp: Date.now()
      })
    }
  }

  private addAlert(alert: PerformanceAlert) {
    this.alerts.push(alert)
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50)
    }
  }

  measureComponentRender(componentName: string, renderTimeMs: number) {
    if (!this.componentMetrics.has(componentName)) {
      this.componentMetrics.set(componentName, {
        name: componentName,
        renderCount: 0,
        avgRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: Infinity,
        lastRenderTime: 0,
        timestamps: []
      })
    }

    const component = this.componentMetrics.get(componentName)!
    component.renderCount++
    component.lastRenderTime = renderTimeMs
    component.maxRenderTime = Math.max(component.maxRenderTime, renderTimeMs)
    component.minRenderTime = Math.min(component.minRenderTime, renderTimeMs)
    component.timestamps.push(Date.now())

    // Calculate moving average (last 10 renders)
    const recentTimestamps = component.timestamps.slice(-10)
    component.avgRenderTime = recentTimestamps.reduce((sum, time, index, arr) => {
      if (index === 0) return 0
      return sum + (time - arr[index - 1])
    }, 0) / Math.max(recentTimestamps.length - 1, 1)

    this.metrics.componentRenderTime[componentName] = renderTimeMs
    this.checkThreshold('renderTime', renderTimeMs)
  }

  measureApiCall(endpoint: string, responseTimeMs: number) {
    this.metrics.apiResponseTime[endpoint] = responseTimeMs
    this.checkThreshold('apiResponseTime', responseTimeMs)
  }

  measureInteraction(type: 'click' | 'scroll', responseTimeMs: number) {
    if (type === 'click') {
      this.metrics.clickResponseTime.push(responseTimeMs)
      // Keep only last 100 measurements
      if (this.metrics.clickResponseTime.length > 100) {
        this.metrics.clickResponseTime = this.metrics.clickResponseTime.slice(-100)
      }
    } else if (type === 'scroll') {
      this.metrics.scrollPerformance.push(responseTimeMs)
      if (this.metrics.scrollPerformance.length > 100) {
        this.metrics.scrollPerformance = this.metrics.scrollPerformance.slice(-100)
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    // Update memory usage if available
    if (typeof window !== 'undefined' && 'memory' in performance) {
      this.metrics.memoryUsage = (performance as any).memory
    }

    // Update network info if available
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      this.metrics.networkInfo = (navigator as any).connection
    }

    return { ...this.metrics }
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  getComponentMetrics(): ComponentPerformance[] {
    return Array.from(this.componentMetrics.values())
  }

  getScore(): number {
    let score = 100
    const metrics = this.getMetrics()

    // LCP scoring
    if (metrics.lcp) {
      if (metrics.lcp > this.thresholds.lcp.poor) score -= 20
      else if (metrics.lcp > this.thresholds.lcp.good) score -= 10
    }

    // FID scoring
    if (metrics.fid) {
      if (metrics.fid > this.thresholds.fid.poor) score -= 20
      else if (metrics.fid > this.thresholds.fid.good) score -= 10
    }

    // CLS scoring
    if (metrics.cls) {
      if (metrics.cls > this.thresholds.cls.poor) score -= 20
      else if (metrics.cls > this.thresholds.cls.good) score -= 10
    }

    // Load time scoring
    if (metrics.loadTime > this.thresholds.loadTime.poor) score -= 15
    else if (metrics.loadTime > this.thresholds.loadTime.good) score -= 8

    // API response time scoring
    const apiTimes = Object.values(metrics.apiResponseTime)
    const avgApiTime = apiTimes.length > 0 ? apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length : 0
    if (avgApiTime > this.thresholds.apiResponseTime.poor) score -= 15
    else if (avgApiTime > this.thresholds.apiResponseTime.good) score -= 8

    return Math.max(0, score)
  }

  clearAlerts() {
    this.alerts = []
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

export function usePerformance(thresholds?: Partial<PerformanceThresholds>) {
  const monitorRef = useRef<PerformanceMonitor | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [score, setScore] = useState<number>(100)
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    monitorRef.current = new PerformanceMonitor(thresholds || {})
    setIsMonitoring(true)

    const interval = setInterval(() => {
      if (monitorRef.current) {
        setMetrics(monitorRef.current.getMetrics())
        setAlerts(monitorRef.current.getAlerts())
        setScore(monitorRef.current.getScore())
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      if (monitorRef.current) {
        monitorRef.current.destroy()
      }
      setIsMonitoring(false)
    }
  }, [thresholds])

  const measureComponentRender = useCallback((componentName: string, renderTimeMs: number) => {
    monitorRef.current?.measureComponentRender(componentName, renderTimeMs)
  }, [])

  const measureApiCall = useCallback((endpoint: string, responseTimeMs: number) => {
    monitorRef.current?.measureApiCall(endpoint, responseTimeMs)
  }, [])

  const measureInteraction = useCallback((type: 'click' | 'scroll', responseTimeMs: number) => {
    monitorRef.current?.measureInteraction(type, responseTimeMs)
  }, [])

  const getComponentMetrics = useCallback(() => {
    return monitorRef.current?.getComponentMetrics() || []
  }, [])

  const clearAlerts = useCallback(() => {
    monitorRef.current?.clearAlerts()
    setAlerts([])
  }, [])

  return {
    metrics,
    alerts,
    score,
    isMonitoring,
    measureComponentRender,
    measureApiCall,
    measureInteraction,
    getComponentMetrics,
    clearAlerts
  }
}

// HOC for measuring component render performance
export function withPerformance<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return function PerformanceWrappedComponent(props: P) {
    const { measureComponentRender } = usePerformance()
    const startTime = useRef<number>(0)
    const name = componentName || Component.displayName || Component.name || 'Unknown'

    useEffect(() => {
      startTime.current = performance.now()

      return () => {
        if (startTime.current) {
          const renderTime = performance.now() - startTime.current
          measureComponentRender(name, renderTime)
        }
      }
    })

    return <Component {...props} />
  }
}

// Hook for measuring async operations
export function useAsyncPerformance() {
  const { measureApiCall } = usePerformance()

  const measure = useCallback(async <T,>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = performance.now()

    try {
      const result = await operation()
      const endTime = performance.now()
      measureApiCall(operationName, endTime - startTime)
      return result
    } catch (error) {
      const endTime = performance.now()
      measureApiCall(`${operationName}-error`, endTime - startTime)
      throw error
    }
  }, [measureApiCall])

  return { measure }
}

// Performance utilities
export const performanceUtils = {
  // Get current performance metrics
  getCurrentMetrics: (): Partial<PerformanceMetrics> => {
    if (typeof window === 'undefined') return {}

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,
      fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      memoryUsage: (performance as any).memory,
      networkInfo: (navigator as any).connection
    }
  },

  // Format performance values for display
  formatValue: (value: number, unit: string = 'ms'): string => {
    if (value < 1000) {
      return `${value.toFixed(1)}${unit}`
    } else {
      return `${(value / 1000).toFixed(2)}s`
    }
  },

  // Get performance grade based on score
  getGrade: (score: number): { grade: string; color: string } => {
    if (score >= 90) return { grade: 'A', color: 'text-green-600' }
    if (score >= 80) return { grade: 'B', color: 'text-blue-600' }
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600' }
    if (score >= 60) return { grade: 'D', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }
}