'use client'

/**
 * Mapa com um alfinete para a pessoa confirmar o local.
 *  - tocar no alfinete = confirma o ponto como está;
 *  - arrastar o alfinete = confirma o novo ponto.
 * O ponto confirmado é dado próprio (marcado por uma pessoa) e fica guardado
 * sem prazo. Google Maps quando ligado no Super-admin; senão OpenStreetMap.
 */

import { useEffect, useRef } from 'react'
import { PooledGoogleMap, usePooledMap as useMap } from './google-map-pool'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMapsConfig } from '@/hooks/useMapsConfig'

export interface PinPoint {
  latitude: number
  longitude: number
}

interface Props {
  point: PinPoint
  confirmed?: boolean
  /** moved = a pessoa arrastou o alfinete */
  onConfirm: (point: PinPoint, moved: boolean) => void
  height?: number
}

export default function PinConfirmMap({ point, confirmed = false, onConfirm, height = 260 }: Props) {
  const { config, loading } = useMapsConfig()
  if (loading) return <div className="w-full rounded-lg bg-gray-100" style={{ height }} />
  return (
    <div className="relative w-full overflow-hidden rounded-lg border" style={{ height }}>
      {config.provider === 'google' && config.browserKey ? (
        <PooledGoogleMap
          apiKey={config.browserKey}
          mapId={config.mapId}
          poolKey="alfinete"
          center={{ lat: point.latitude, lng: point.longitude }}
          zoom={18}
          options={{ gestureHandling: 'greedy', streetViewControl: false, mapTypeControl: false }}
          onAttach={(map, reused) => {
            // mapa reaproveitado: vai para o ponto desta tela
            if (reused) {
              map.setCenter({ lat: point.latitude, lng: point.longitude })
              map.setZoom(18)
            }
          }}
        >
          <GooglePin point={point} confirmed={confirmed} onConfirm={onConfirm} />
        </PooledGoogleMap>
      ) : (
        <OsmPin point={point} confirmed={confirmed} onConfirm={onConfirm} />
      )}
      <div className="pointer-events-none absolute left-2 right-2 top-2 z-[400] rounded-md bg-white/90 px-2 py-1 text-center text-xs text-gray-800 shadow">
        {confirmed ? 'Local confirmado. Arraste o alfinete se precisar corrigir.' : 'Toque no alfinete para confirmar, ou arraste até o lugar certo.'}
      </div>
    </div>
  )
}

function GooglePin({ point, confirmed, onConfirm }: Omit<Props, 'height'>) {
  const map = useMap()
  const markerRef = useRef<google.maps.Marker | null>(null)
  const onConfirmRef = useRef(onConfirm)
  onConfirmRef.current = onConfirm

  useEffect(() => {
    if (!map) return
    const marker = new google.maps.Marker({ map, draggable: true, position: { lat: point.latitude, lng: point.longitude } })
    marker.addListener('click', () => {
      const position = marker.getPosition()
      if (position) onConfirmRef.current({ latitude: position.lat(), longitude: position.lng() }, false)
    })
    marker.addListener('dragend', () => {
      const position = marker.getPosition()
      if (position) onConfirmRef.current({ latitude: position.lat(), longitude: position.lng() }, true)
    })
    markerRef.current = marker
    return () => marker.setMap(null)
  }, [map]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    marker.setPosition({ lat: point.latitude, lng: point.longitude })
    marker.setAnimation(confirmed ? null : google.maps.Animation.BOUNCE)
  }, [point.latitude, point.longitude, confirmed])

  return null
}

function pinIcon(confirmed = false) {
  const color = confirmed ? '#16a34a' : '#2563eb'
  return L.divIcon({
    className: '',
    html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 27 15 27s15-16 15-27C30 6.7 23.3 0 15 0z" fill="${color}"/><circle cx="15" cy="15" r="6" fill="white"/></svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  })
}

function OsmPin({ point, confirmed, onConfirm }: Omit<Props, 'height'>) {
  return (
    <MapContainer center={[point.latitude, point.longitude]} zoom={18} className="h-full w-full" scrollWheelZoom>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker
        position={[point.latitude, point.longitude]}
        draggable
        icon={pinIcon(confirmed)}
        eventHandlers={{
          click: (event) => {
            const position = (event.target as L.Marker).getLatLng()
            onConfirm({ latitude: position.lat, longitude: position.lng }, false)
          },
          dragend: (event) => {
            const position = (event.target as L.Marker).getLatLng()
            onConfirm({ latitude: position.lat, longitude: position.lng }, true)
          },
        }}
      />
    </MapContainer>
  )
}
