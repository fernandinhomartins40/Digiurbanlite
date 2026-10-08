'use client'

/**
 * Mapa do Google com bolinhas coloridas (uma por pedido), agrupamento opcional,
 * círculos de abrangência e janela de detalhes ao clicar. Usado no lugar do
 * OpenStreetMap quando o Super-admin liga o Google Maps (useMapsConfig).
 *
 * A imagem do mapa vem sempre do Google (não pode ser guardada); os endereços
 * já vêm com coordenadas do backend (arquivo de endereços), então esta tela não
 * faz nenhuma busca de endereço no Google.
 */

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { PooledGoogleMap, usePooledMap as useMap } from './google-map-pool'

export interface GoogleMapPoint {
  id: string
  lat: number
  lng: number
  color: string
  /** raio da bolinha em px */
  size?: number
  strokeColor?: string
  strokeWeight?: number
  /** texto ao passar o mouse */
  title?: string
  /** círculo de abrangência em metros */
  circleRadius?: number
  circleOpacity?: number
}

interface Props {
  apiKey: string
  mapId?: string | null
  points: GoogleMapPoint[]
  center?: { lat: number; lng: number } | null
  cluster?: boolean
  showCircles?: boolean
  /** enquadra os pontos só na primeira vez (TV) ou sempre que mudam */
  fit?: 'once' | 'always'
  renderInfo?: (id: string) => ReactNode
  showControls?: boolean
  /** telas com a mesma chave reaproveitam o mesmo mapa (não conta nova abertura) */
  poolKey?: string
}

const BRASIL = { lat: -15.78, lng: -47.93 }

export default function GoogleMarkersMap({ apiKey, mapId, points, center, cluster = false, showCircles = false, fit = 'always', renderInfo, showControls = true, poolKey = 'pontos' }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const start = points.length ? { lat: points[0].lat, lng: points[0].lng } : center || BRASIL
  const selectedPoint = useMemo(() => points.find((point) => point.id === selected) || null, [points, selected])

  return (
    <PooledGoogleMap
      apiKey={apiKey}
      mapId={mapId}
      poolKey={poolKey}
      center={start}
      zoom={points.length || center ? 13 : 4}
      options={{ gestureHandling: 'greedy', disableDefaultUI: !showControls }}
    >
      <Markers points={points} cluster={cluster} onSelect={renderInfo ? setSelected : undefined} />
      {showCircles && <Circles points={points} />}
      <Fit points={points} center={center} mode={fit} />
      {selectedPoint && renderInfo && (
        <Info point={selectedPoint} onClose={() => setSelected(null)}>
          {renderInfo(selectedPoint.id)}
        </Info>
      )}
    </PooledGoogleMap>
  )
}

/** Janela de detalhes do Google com conteúdo React */
function Info({ point, onClose, children }: { point: GoogleMapPoint; onClose: () => void; children: ReactNode }) {
  const map = useMap()
  const [content] = useState(() => document.createElement('div'))
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    if (!map) return
    const info = new google.maps.InfoWindow({
      content,
      position: { lat: point.lat, lng: point.lng },
      pixelOffset: new google.maps.Size(0, -(point.size || 7)),
    })
    info.addListener('closeclick', () => onCloseRef.current())
    info.open({ map })
    return () => info.close()
  }, [map, point.id, point.lat, point.lng, point.size, content])
  return createPortal(children, content)
}

function Markers({ points, cluster, onSelect }: { points: GoogleMapPoint[]; cluster: boolean; onSelect?: (id: string) => void }) {
  const map = useMap()
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!map) return
    markersRef.current.forEach((marker) => marker.setMap(null))
    clustererRef.current?.clearMarkers()

    const markers = points.map((point) => {
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        title: point.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: point.size || 7,
          fillColor: point.color,
          fillOpacity: 0.9,
          strokeColor: point.strokeColor || '#ffffff',
          strokeWeight: point.strokeWeight ?? 1.5,
        },
        zIndex: point.size || 7,
      })
      marker.addListener('click', () => onSelectRef.current?.(point.id))
      return marker
    })
    markersRef.current = markers

    if (cluster) {
      if (!clustererRef.current) clustererRef.current = new MarkerClusterer({ map })
      clustererRef.current.addMarkers(markers)
    } else {
      markers.forEach((marker) => marker.setMap(map))
    }
  }, [map, points, cluster])

  useEffect(
    () => () => {
      markersRef.current.forEach((marker) => marker.setMap(null))
      clustererRef.current?.clearMarkers()
      clustererRef.current?.setMap(null)
    },
    []
  )
  return null
}

function Circles({ points }: { points: GoogleMapPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const circles = points
      .filter((point) => point.circleRadius)
      .map(
        (point) =>
          new google.maps.Circle({
            map,
            center: { lat: point.lat, lng: point.lng },
            radius: point.circleRadius,
            fillColor: point.color,
            fillOpacity: point.circleOpacity ?? 0.15,
            strokeColor: point.color,
            strokeOpacity: 0.5,
            strokeWeight: 1,
            clickable: false,
          })
      )
    return () => circles.forEach((circle) => circle.setMap(null))
  }, [map, points])
  return null
}

function Fit({ points, center, mode }: { points: GoogleMapPoint[]; center?: { lat: number; lng: number } | null; mode: 'once' | 'always' }) {
  const map = useMap()
  const done = useRef(false)
  const centered = useRef(false)
  useEffect(() => {
    if (!map) return
    if (points.length === 0) {
      if (center && !centered.current) {
        map.setCenter(center)
        map.setZoom(13)
        centered.current = true
      }
      return
    }
    if (mode === 'once' && done.current) return
    const bounds = new google.maps.LatLngBounds()
    points.forEach((point) => bounds.extend({ lat: point.lat, lng: point.lng }))
    map.fitBounds(bounds, 40)
    google.maps.event.addListenerOnce(map, 'idle', () => {
      if ((map.getZoom() || 0) > 15) map.setZoom(15)
    })
    done.current = true
  }, [map, points, center, mode])
  return null
}
