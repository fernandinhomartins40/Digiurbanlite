'use client'

/**
 * Mapa do modo TV (Google Maps se ligado no Super-admin; senão OpenStreetMap): um ponto
 * por pedido em aberto (vermelho = atrasado, azul = novo, âmbar = em
 * andamento). Pedidos que acabaram de chegar ou mudar ficam maiores e com
 * contorno escuro. Enquadra o município sozinho.
 */

import { useEffect, useRef } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import GoogleMarkersMap from '@/components/maps/GoogleMarkersMap'
import { useMapsConfig } from '@/hooks/useMapsConfig'

export interface TvPoint {
  id: string
  number: string
  title: string
  status: string
  latitude: number
  longitude: number
  overdue?: boolean
  service?: { name: string } | null
  department?: { name: string } | null
}

function colorOf(point: TvPoint) {
  if (point.overdue) return '#ef4444'
  if (point.status === 'VINCULADO') return '#3b82f6'
  if (point.status === 'PENDENCIA' || point.status === 'ATUALIZACAO') return '#a78bfa'
  return '#f59e0b'
}

function FitOnce({ points, center }: { points: TvPoint[]; center?: { lat: number; lng: number } | null }) {
  const map = useMap()
  const done = useRef(false)
  const centered = useRef(false)
  useEffect(() => {
    // sem pedidos no mapa: abre no município
    if (points.length === 0) {
      if (center && !centered.current) {
        map.setView([center.lat, center.lng], 13)
        centered.current = true
      }
      return
    }
    if (done.current) return
    const lats = points.map((point) => point.latitude)
    const lngs = points.map((point) => point.longitude)
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [40, 40], maxZoom: 15 }
    )
    done.current = true
  }, [map, points, center])
  return null
}

type TvMapProps = { points: TvPoint[]; highlight: Set<string>; center?: { lat: number; lng: number } | null }

export default function TvMap(props: TvMapProps) {
  const { config, loading } = useMapsConfig()
  if (loading) return <div className="h-full w-full bg-gray-100" />
  if (config.provider === 'google' && config.browserKey) {
    const points = props.points.map((point) => {
      const isNew = props.highlight.has(point.id)
      return {
        id: point.id,
        lat: point.latitude,
        lng: point.longitude,
        color: colorOf(point),
        size: isNew ? 13 : point.overdue ? 8 : 6,
        strokeColor: isNew ? '#1d1d1f' : '#ffffff',
        strokeWeight: isNew ? 3 : 1,
        title: `#${point.number} ${point.service?.name || point.title}${point.department?.name ? ` · ${point.department.name}` : ''}`,
      }
    })
    return <GoogleMarkersMap poolKey="tv" apiKey={config.browserKey} mapId={config.mapId} points={points} center={props.center} fit="once" showControls={false} />
  }
  return <OsmTvMap {...props} />
}

function OsmTvMap({ points, highlight, center }: TvMapProps) {
  const start: [number, number] = points.length ? [points[0].latitude, points[0].longitude] : center ? [center.lat, center.lng] : [-15.78, -47.93]
  return (
    <MapContainer center={start} zoom={points.length || center ? 13 : 4} className="h-full w-full" zoomControl={false} attributionControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitOnce points={points} center={center} />
      {points.map((point) => {
        const isNew = highlight.has(point.id)
        return (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={isNew ? 13 : point.overdue ? 8 : 6}
            pathOptions={{ color: isNew ? '#1d1d1f' : colorOf(point), weight: isNew ? 3 : 1, fillColor: colorOf(point), fillOpacity: 0.85 }}
          >
            <Tooltip direction="top">
              <strong>#{point.number}</strong> {point.title}
              <br />
              {point.service?.name}
              {point.department?.name ? ` · ${point.department.name}` : ''}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
