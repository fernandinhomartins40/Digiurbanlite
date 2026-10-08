'use client'

/**
 * Mapa do modo TV: fundo escuro, um ponto por pedido em aberto (vermelho =
 * atrasado, azul = novo, âmbar = em andamento). Pedidos que acabaram de
 * chegar ficam maiores e com contorno branco. Enquadra o município sozinho.
 */

import { useEffect, useRef } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

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
  if (point.status === 'VINCULADO') return '#38bdf8'
  if (point.status === 'PENDENCIA' || point.status === 'ATUALIZACAO') return '#a78bfa'
  return '#f59e0b'
}

function FitOnce({ points }: { points: TvPoint[] }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || points.length === 0) return
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
  }, [map, points])
  return null
}

export default function TvMap({ points, highlight }: { points: TvPoint[]; highlight: Set<string> }) {
  const center: [number, number] = points.length ? [points[0].latitude, points[0].longitude] : [-15.78, -47.93]
  return (
    <MapContainer center={center} zoom={points.length ? 13 : 4} className="h-full w-full rounded-2xl" zoomControl={false} attributionControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FitOnce points={points} />
      {points.map((point) => {
        const isNew = highlight.has(point.id)
        return (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={isNew ? 13 : point.overdue ? 8 : 6}
            pathOptions={{ color: isNew ? '#ffffff' : colorOf(point), weight: isNew ? 3 : 1, fillColor: colorOf(point), fillOpacity: 0.85 }}
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
