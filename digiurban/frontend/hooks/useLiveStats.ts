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
  const { data, error, mutate, isLoading } = useSWR<{ success: boolean; data: StatsData }>(
    '/api/admin/gabinete/painel-prefeito/stats',
    fetcher,
    {
      refreshInterval: 30000,      // Auto-refresh a cada 30 segundos
      revalidateOnFocus: true,     // Recarregar ao focar janela
      revalidateOnReconnect: true  // Recarregar ao reconectar
    }
  )

  return {
    stats: data?.data ?? null,
    isLoading,
    isError: error,
    refresh: mutate,
    lastUpdate: data ? new Date() : null
  }
}
