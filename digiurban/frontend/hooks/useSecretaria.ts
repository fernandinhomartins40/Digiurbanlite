import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export interface UseSecretariaOptions {
  endpoint?: string
  autoFetch?: boolean
  dependencies?: any[]
}

export interface UseSecretariaReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: (newData: T) => void
}

/**
 * Hook customizado para páginas de secretarias
 * Usa AdminAuthContext internamente para garantir autenticação
 *
 * @example
 * const { data, loading, error, refetch } = useSecretaria<AgricultureStats>({
 *   endpoint: '/api/secretarias/agriculture/stats',
 *   autoFetch: true
 * })
 */
export function useSecretaria<T = any>(
  options: UseSecretariaOptions = {}
): UseSecretariaReturn<T> {
  const { endpoint, autoFetch = true, dependencies = [] } = options
  const { user, apiRequest } = useAdminAuth()

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!endpoint) {
      console.warn('[useSecretaria] Nenhum endpoint fornecido')
      return
    }

    if (!user) {
      console.log('[useSecretaria] Aguardando autenticação... user:', user)
      return
    }

    console.log('[useSecretaria] ========== INICIANDO FETCH ==========')
    console.log('[useSecretaria] Endpoint:', endpoint)
    console.log('[useSecretaria] User:', user?.email)
    console.log('[useSecretaria] apiRequest disponível:', typeof apiRequest)

    setLoading(true)
    setError(null)

    try {
      console.log('[useSecretaria] Chamando apiRequest...')
      const response = await apiRequest(endpoint, {
        method: 'GET'
      })

      console.log('[useSecretaria] ✅ Dados recebidos com sucesso:', endpoint)
      console.log('[useSecretaria] Response:', response)
      setData(response)
      setError(null)
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao carregar dados'
      console.error('[useSecretaria] ❌ Erro ao fazer request:', errorMsg)
      console.error('[useSecretaria] Erro completo:', err)
      setError(errorMsg)
      setData(null)
    } finally {
      setLoading(false)
      console.log('[useSecretaria] ========== FIM DO FETCH ==========')
    }
  }, [endpoint, user, apiRequest])

  // Auto-fetch on mount or when dependencies change
  useEffect(() => {
    if (autoFetch && user) {
      fetchData()
    }
  }, [autoFetch, user, ...dependencies])

  // Mutate data locally without refetch
  const mutate = useCallback((newData: T) => {
    console.log('[useSecretaria] Mutando dados localmente')
    setData(newData)
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate
  }
}

/**
 * Hook para fazer POST/PUT/DELETE usando apiRequest
 */
export function useSecretariaMutation<TRequest = any, TResponse = any>() {
  const { apiRequest } = useAdminAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    body?: TRequest
  ): Promise<TResponse | null> => {
    console.log(`[useSecretariaMutation] ${method} ${endpoint}`)
    setLoading(true)
    setError(null)

    try {
      const response = await apiRequest(endpoint, {
        method,
        body: body ? JSON.stringify(body) : undefined
      })

      console.log(`[useSecretariaMutation] ${method} sucesso:`, endpoint)
      setError(null)
      return response
    } catch (err: any) {
      const errorMsg = err.message || 'Erro na operação'
      console.error(`[useSecretariaMutation] Erro ${method}:`, errorMsg, err)
      setError(errorMsg)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiRequest])

  return {
    mutate,
    loading,
    error
  }
}
