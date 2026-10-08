'use client'

/**
 * Reaproveita o mapa do Google entre telas e abas.
 *
 * O Google cobra cada vez que um mapa é CRIADO na tela (não por tempo, zoom ou
 * pontos). Aqui cada "lugar" (pedidos, tv, alfinete...) cria o mapa UMA vez por
 * sessão do navegador: ao sair da tela o mapa é guardado escondido na memória
 * e, ao voltar, a mesma instância é recolocada — sem nova cobrança. Não guarda
 * a imagem do mapa em lugar nenhum (isso a regra do Google proíbe); só mantém
 * o mapa vivo enquanto a página do sistema estiver aberta.
 */

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps'

interface PoolEntry {
  div: HTMLDivElement
  map: google.maps.Map
}

const pool = new Map<string, PoolEntry>()
const MapContext = createContext<google.maps.Map | null>(null)

/** O mapa do Google desta tela (null enquanto carrega) */
export function usePooledMap() {
  return useContext(MapContext)
}

interface Props {
  apiKey: string
  mapId?: string | null
  /** lugar do mapa: telas com a mesma chave reaproveitam o mesmo mapa */
  poolKey: string
  center: google.maps.LatLngLiteral
  zoom: number
  options?: google.maps.MapOptions
  /** chamado quando o mapa é recolocado na tela (novo ou reaproveitado) */
  onAttach?: (map: google.maps.Map, reused: boolean) => void
  children?: ReactNode
}

export function PooledGoogleMap(props: Props) {
  return (
    <APIProvider apiKey={props.apiKey} language="pt-BR" region="BR">
      <Inner {...props} />
    </APIProvider>
  )
}

function Inner({ mapId, poolKey, center, zoom, options, onAttach, children }: Props) {
  const mapsLibrary = useMapsLibrary('maps')
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const onAttachRef = useRef(onAttach)
  onAttachRef.current = onAttach

  useEffect(() => {
    const container = containerRef.current
    if (!mapsLibrary || !container) return
    const key = `${poolKey}|${mapId || ''}`
    let entry = pool.get(key)
    let reused = Boolean(entry)
    // o mesmo lugar aberto duas vezes ao mesmo tempo: o segundo ganha um mapa próprio
    const busy = entry ? entry.div.isConnected : false
    if (!entry || busy) {
      const div = document.createElement('div')
      div.style.width = '100%'
      div.style.height = '100%'
      const created = new mapsLibrary.Map(div, { center, zoom, mapId: mapId || undefined, clickableIcons: false, ...options })
      entry = { div, map: created }
      reused = false
      if (!busy) pool.set(key, entry)
    } else if (options) {
      entry.map.setOptions(options)
    }
    container.appendChild(entry.div)
    setMap(entry.map)
    onAttachRef.current?.(entry.map, reused)
    const current = entry
    return () => {
      // sai da tela mas continua vivo na memória para a próxima vez
      current.div.remove()
      setMap(null)
    }
  }, [mapsLibrary, poolKey, mapId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <MapContext.Provider value={map}>{children}</MapContext.Provider>
    </div>
  )
}
