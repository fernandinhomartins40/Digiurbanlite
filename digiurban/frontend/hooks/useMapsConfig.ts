'use client'

/**
 * Qual mapa as telas usam: Google (se o Super-admin ligou e colocou a chave)
 * ou OpenStreetMap. Se o Google recusar a chave no navegador, volta sozinho
 * para o OpenStreetMap — a tela nunca fica sem mapa.
 */

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

export interface MapsConfig {
  provider: 'google' | 'osm'
  browserKey: string | null
  mapId: string | null
}

const OSM: MapsConfig = { provider: 'osm', browserKey: null, mapId: null }
const AUTH_FAILED_EVENT = 'digiurban:google-maps-auth-failed'
let googleRefused = false

if (typeof window !== 'undefined') {
  // o Google chama esta função quando a chave é recusada (site não permitido, API desligada...)
  ;(window as any).gm_authFailure = () => {
    googleRefused = true
    window.dispatchEvent(new CustomEvent(AUTH_FAILED_EVENT))
  }
}

export function useMapsConfig(): { config: MapsConfig; loading: boolean } {
  const [refused, setRefused] = useState(googleRefused)
  useEffect(() => {
    const onFail = () => setRefused(true)
    window.addEventListener(AUTH_FAILED_EVENT, onFail)
    return () => window.removeEventListener(AUTH_FAILED_EVENT, onFail)
  }, [])

  const query = useQuery<MapsConfig>({
    queryKey: ['maps-config'],
    queryFn: async () => {
      const res = await fetch('/api/maps/config', { credentials: 'include' })
      if (!res.ok) return OSM
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const data = query.data || OSM
  const config = refused || data.provider !== 'google' || !data.browserKey ? OSM : data
  return { config, loading: query.isLoading }
}
