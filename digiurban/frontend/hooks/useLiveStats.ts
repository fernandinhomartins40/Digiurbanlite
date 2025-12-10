import useSWR from 'swr'

interface StatsData {
  totalActive: number
  totalProtocols: number
  totalCompleted: number
  completionRate: number
  avgResponseTime: number
  citizenSatisfaction: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Erro ao buscar dados')
  }
  const data = await response.json()
  return data
}

export function useLiveStats() {
  const { data, error, mutate, isLoading, isValidating } = useSWR<{ success: boolean; data: StatsData }>(
    '/api/admin/gabinete/painel-prefeito/stats',
    fetcher,
    {
      refreshInterval: 60000,      // ⚡ Aumentado para 60s (menos requests)
      revalidateOnFocus: false,    // ⚡ Desabilitar refresh ao focar (evita requests desnecessários)
      revalidateOnReconnect: true, // Recarregar ao reconectar
      dedupingInterval: 30000,     // ⚡ Evitar múltiplas chamadas em 30s
      revalidateIfStale: false,    // ⚡ Não revalidar automaticamente se já tem dados
      keepPreviousData: true       // ⚡ Manter dados anteriores durante revalidação
    }
  )

  return {
    stats: data?.data ?? null,
    isLoading: isLoading || isValidating,
    isError: error,
    refresh: mutate,
    lastUpdate: data ? new Date() : null
  }
}
