'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export interface ActivationStep {
  key: string
  titulo: string
  texto: string
  feito: boolean
  link: string | null
}

export interface Activation {
  steps: ActivationStep[]
  feitos: number
  total: number
  percentual: number
  completo: boolean
  dispensado: boolean
}

/** Primeiros passos do município (só ADMIN; `enabled` evita a chamada para os outros). */
export function useActivation(enabled = true) {
  const { apiRequest } = useAdminAuth()
  return useQuery<Activation>({
    queryKey: ['admin-activation'],
    queryFn: async () => (await apiRequest('/api/admin/activation')).data,
    enabled,
    staleTime: 60_000,
  })
}

/** Cartões do Início já dispensados por quem está logado. */
export function useDismissedCards() {
  const { apiRequest } = useAdminAuth()
  const queryClient = useQueryClient()
  const query = useQuery<string[]>({
    queryKey: ['admin-dismissed-cards'],
    queryFn: async () => (await apiRequest('/api/admin/activation/cards')).data?.dismissed || [],
    staleTime: Infinity,
  })
  const dismiss = async (card: 'activation' | 'welcome') => {
    // some na hora; a escolha é guardada em seguida
    queryClient.setQueryData<string[]>(['admin-dismissed-cards'], (old = []) => [...old, card])
    try {
      await apiRequest('/api/admin/activation/dismiss', { method: 'POST', body: JSON.stringify({ card }) })
    } finally {
      queryClient.invalidateQueries({ queryKey: ['admin-dismissed-cards'] })
    }
  }
  return { dismissed: query.data, loading: query.isLoading, dismiss }
}
