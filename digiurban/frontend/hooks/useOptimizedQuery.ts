import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useCache } from './useCache'

export interface QueryOptions {
  enabled?: boolean
  retry?: number
  retryDelay?: number
  staleTime?: number
  cacheTime?: number
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
  dedupe?: boolean
  keepPreviousData?: boolean
  suspense?: boolean
  debounceMs?: number
  throttleMs?: number
}

export interface QueryResult<T> {
  data: T | undefined
  error: Error | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isFetching: boolean
  isStale: boolean
  refetch: () => Promise<void>
  invalidate: () => void
}

interface QueryState<T> {
  data: T | undefined
  error: Error | null
  isLoading: boolean
  isFetching: boolean
  lastFetch: number
  retryCount: number
}

class QueryManager {
  private queries = new Map<string, QueryState<any>>()
  private promises = new Map<string, Promise<any>>()
  private intervals = new Map<string, NodeJS.Timeout>()
  private retryTimeouts = new Map<string, NodeJS.Timeout>()

  getQuery<T>(key: string): QueryState<T> | undefined {
    return this.queries.get(key) as QueryState<T>
  }

  setQuery<T>(key: string, state: Partial<QueryState<T>>) {
    const current = this.queries.get(key) as QueryState<T> || {
      data: undefined,
      error: null,
      isLoading: false,
      isFetching: false,
      lastFetch: 0,
      retryCount: 0
    }

    this.queries.set(key, { ...current, ...state })
  }

  getPromise(key: string): Promise<any> | undefined {
    return this.promises.get(key)
  }

  setPromise(key: string, promise: Promise<any>) {
    this.promises.set(key, promise)
  }

  deletePromise(key: string) {
    this.promises.delete(key)
  }

  setInterval(key: string, interval: NodeJS.Timeout) {
    this.clearInterval(key)
    this.intervals.set(key, interval)
  }

  clearInterval(key: string) {
    const interval = this.intervals.get(key)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(key)
    }
  }

  setRetryTimeout(key: string, timeout: NodeJS.Timeout) {
    this.clearRetryTimeout(key)
    this.retryTimeouts.set(key, timeout)
  }

  clearRetryTimeout(key: string) {
    const timeout = this.retryTimeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(key)
    }
  }

  invalidate(key: string) {
    this.queries.delete(key)
    this.deletePromise(key)
    this.clearInterval(key)
    this.clearRetryTimeout(key)
  }

  clear() {
    this.queries.clear()
    this.promises.clear()
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
  }
}

const globalQueryManager = new QueryManager()

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttle utility
function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, delay - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return throttledValue
}

export function useOptimizedQuery<T>(
  queryKey: string | string[],
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    retry = 3,
    retryDelay = 1000,
    staleTime = 0,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    refetchInterval,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
    dedupe = true,
    keepPreviousData = false,
    debounceMs = 0,
    throttleMs = 0
  } = options

  const key = Array.isArray(queryKey) ? queryKey.join(':') : queryKey
  const { get: getCached, set: setCached, remove: removeCached } = useCache(key, {
    ttl: cacheTime,
    storageType: 'memory'
  })

  // Debounce and throttle the query key if specified
  const debouncedKey = useDebounce(key, debounceMs)
  const throttledKey = useThrottle(key, throttleMs)
  const finalKey = debounceMs > 0 ? debouncedKey : throttleMs > 0 ? throttledKey : key

  const [state, setState] = useState<QueryState<T>>(() => {
    const cached = getCached()
    return {
      data: cached,
      error: null,
      isLoading: enabled && !cached,
      isFetching: false,
      lastFetch: 0,
      retryCount: 0
    }
  })

  const isStale = useMemo(() => {
    if (!state.lastFetch || staleTime === 0) return true
    return Date.now() - state.lastFetch > staleTime
  }, [state.lastFetch, staleTime])

  const executeQuery = useCallback(async (isRetry = false) => {
    if (!enabled) return

    // Check for existing promise if deduplication is enabled
    if (dedupe && !isRetry) {
      const existingPromise = globalQueryManager.getPromise(finalKey)
      if (existingPromise) {
        try {
          const data = await existingPromise
          setState(prev => ({
            ...prev,
            data,
            error: null,
            isLoading: false,
            isFetching: false,
            lastFetch: Date.now(),
            retryCount: 0
          }))
          setCached(data)
          return
        } catch (error) {
          // Let it fall through to normal error handling
        }
      }
    }

    setState(prev => ({
      ...prev,
      isFetching: true,
      isLoading: prev.data === undefined,
      error: isRetry ? null : prev.error
    }))

    try {
      const promise = queryFn()

      if (dedupe) {
        globalQueryManager.setPromise(finalKey, promise)
      }

      const data = await promise

      setState(prev => ({
        ...prev,
        data,
        error: null,
        isLoading: false,
        isFetching: false,
        lastFetch: Date.now(),
        retryCount: 0
      }))

      setCached(data)
      globalQueryManager.deletePromise(finalKey)

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      setState(prev => {
        const newRetryCount = prev.retryCount + 1
        const shouldRetry = newRetryCount <= retry

        if (shouldRetry) {
          // Schedule retry
          const timeout = setTimeout(() => {
            executeQuery(true)
          }, retryDelay * Math.pow(2, newRetryCount - 1)) // Exponential backoff

          globalQueryManager.setRetryTimeout(finalKey, timeout)
        }

        return {
          ...prev,
          data: keepPreviousData ? prev.data : undefined,
          error: err,
          isLoading: false,
          isFetching: false,
          retryCount: newRetryCount
        }
      })

      globalQueryManager.deletePromise(finalKey)
    }
  }, [enabled, finalKey, queryFn, dedupe, retry, retryDelay, keepPreviousData, setCached])

  const refetch = useCallback(async () => {
    globalQueryManager.clearRetryTimeout(finalKey)
    setState(prev => ({ ...prev, retryCount: 0 }))
    await executeQuery()
  }, [executeQuery, finalKey])

  const invalidate = useCallback(() => {
    globalQueryManager.invalidate(finalKey)
    removeCached()
    setState({
      data: undefined,
      error: null,
      isLoading: enabled,
      isFetching: false,
      lastFetch: 0,
      retryCount: 0
    })
  }, [finalKey, removeCached, enabled])

  // Initial fetch
  useEffect(() => {
    if (!enabled) return

    const cached = getCached()
    if (cached && !isStale) {
      setState(prev => ({
        ...prev,
        data: cached,
        isLoading: false
      }))
      return
    }

    executeQuery()
  }, [enabled, finalKey, isStale, executeQuery, getCached])

  // Refetch interval
  useEffect(() => {
    if (!enabled || !refetchInterval) return

    const interval = setInterval(() => {
      if (!document.hidden) {
        executeQuery()
      }
    }, refetchInterval)

    globalQueryManager.setInterval(finalKey, interval)

    return () => {
      globalQueryManager.clearInterval(finalKey)
    }
  }, [enabled, refetchInterval, finalKey, executeQuery])

  // Refetch on window focus
  useEffect(() => {
    if (!enabled || !refetchOnWindowFocus) return

    const handleFocus = () => {
      if (isStale) {
        executeQuery()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [enabled, refetchOnWindowFocus, isStale, executeQuery])

  // Refetch on reconnect
  useEffect(() => {
    if (!enabled || !refetchOnReconnect) return

    const handleOnline = () => {
      executeQuery()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [enabled, refetchOnReconnect, executeQuery])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      globalQueryManager.clearInterval(finalKey)
      globalQueryManager.clearRetryTimeout(finalKey)
      if (!keepPreviousData) {
        globalQueryManager.deletePromise(finalKey)
      }
    }
  }, [finalKey, keepPreviousData])

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isError: !!state.error,
    isSuccess: !state.error && state.data !== undefined,
    isFetching: state.isFetching,
    isStale,
    refetch,
    invalidate
  }
}

// Mutation hook for optimistic updates
export function useOptimizedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: Error, variables: TVariables) => void
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void
  } = {}
) {
  const [state, setState] = useState<{
    data: TData | undefined
    error: Error | null
    isLoading: boolean
    isError: boolean
    isSuccess: boolean
  }>({
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false
  })

  const mutate = useCallback(async (variables: TVariables) => {
    setState({
      data: undefined,
      error: null,
      isLoading: true,
      isError: false,
      isSuccess: false
    })

    try {
      const data = await mutationFn(variables)

      setState({
        data,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true
      })

      options.onSuccess?.(data, variables)
      options.onSettled?.(data, null, variables)

      return data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      setState({
        data: undefined,
        error: err,
        isLoading: false,
        isError: true,
        isSuccess: false
      })

      options.onError?.(err, variables)
      options.onSettled?.(undefined, err, variables)

      throw err
    }
  }, [mutationFn, options])

  const reset = useCallback(() => {
    setState({
      data: undefined,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false
    })
  }, [])

  return {
    ...state,
    mutate,
    mutateAsync: mutate,
    reset
  }
}

// Infinite query hook
export function useInfiniteQuery<T>(
  queryKey: string | string[],
  queryFn: ({ pageParam }: { pageParam: unknown }) => Promise<T>,
  options: QueryOptions & {
    getNextPageParam?: (lastPage: T, pages: T[]) => unknown
    getPreviousPageParam?: (firstPage: T, pages: T[]) => unknown
  } = {}
) {
  const [pages, setPages] = useState<T[]>([])
  const [pageParams, setPageParams] = useState<unknown[]>([undefined])
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [isFetchingPreviousPage, setIsFetchingPreviousPage] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)

  const { getNextPageParam, getPreviousPageParam } = options

  const baseQuery = useOptimizedQuery(
    Array.isArray(queryKey) ? [...queryKey, JSON.stringify(pageParams)] : [queryKey, JSON.stringify(pageParams)],
    () => queryFn({ pageParam: pageParams[pageParams.length - 1] }),
    options
  )

  useEffect(() => {
    if (baseQuery.data && !baseQuery.isLoading) {
      setPages(prev => {
        const newPages = [...prev]
        newPages[pageParams.length - 1] = baseQuery.data!
        return newPages
      })

      if (getNextPageParam) {
        const nextParam = getNextPageParam(baseQuery.data, pages)
        setHasNextPage(nextParam !== undefined)
      }

      if (getPreviousPageParam) {
        const prevParam = getPreviousPageParam(baseQuery.data, pages)
        setHasPreviousPage(prevParam !== undefined)
      }
    }
  }, [baseQuery.data, baseQuery.isLoading, getNextPageParam, getPreviousPageParam, pages, pageParams])

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return

    const nextParam = getNextPageParam?.(pages[pages.length - 1], pages)
    if (nextParam === undefined) return

    setIsFetchingNextPage(true)
    try {
      const data = await queryFn({ pageParam: nextParam })
      setPages(prev => [...prev, data])
      setPageParams(prev => [...prev, nextParam])
    } finally {
      setIsFetchingNextPage(false)
    }
  }, [hasNextPage, isFetchingNextPage, getNextPageParam, pages, queryFn])

  const fetchPreviousPage = useCallback(async () => {
    if (!hasPreviousPage || isFetchingPreviousPage) return

    const prevParam = getPreviousPageParam?.(pages[0], pages)
    if (prevParam === undefined) return

    setIsFetchingPreviousPage(true)
    try {
      const data = await queryFn({ pageParam: prevParam })
      setPages(prev => [data, ...prev])
      setPageParams(prev => [prevParam, ...prev])
    } finally {
      setIsFetchingPreviousPage(false)
    }
  }, [hasPreviousPage, isFetchingPreviousPage, getPreviousPageParam, pages, queryFn])

  return {
    ...baseQuery,
    data: { pages, pageParams },
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage
  }
}

// Query utilities
export const queryUtils = {
  // Invalidate all queries with matching key pattern
  invalidateQueries: (pattern: string) => {
    // Implementation would depend on a global query client
    globalQueryManager.clear()
  },

  // Prefetch a query
  prefetchQuery: async <T>(
    queryKey: string | string[],
    queryFn: () => Promise<T>,
    options: QueryOptions = {}
  ) => {
    const key = Array.isArray(queryKey) ? queryKey.join(':') : queryKey
    try {
      const data = await queryFn()
      // Store in cache for future use
      // This would integrate with the cache system
      return data
    } catch (error) {
      console.warn('Failed to prefetch query:', key, error)
    }
  },

  // Get cached data without triggering a fetch
  getQueryData: <T>(queryKey: string | string[]) => {
    const key = Array.isArray(queryKey) ? queryKey.join(':') : queryKey
    const query = globalQueryManager.getQuery<T>(key)
    return query?.data
  },

  // Set query data manually
  setQueryData: <T>(queryKey: string | string[], data: T) => {
    const key = Array.isArray(queryKey) ? queryKey.join(':') : queryKey
    globalQueryManager.setQuery(key, { data, lastFetch: Date.now() })
  }
}