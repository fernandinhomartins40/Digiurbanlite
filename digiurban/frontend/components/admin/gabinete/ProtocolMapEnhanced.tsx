'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para ícones do Leaflet no Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
  })
}

interface Protocol {
  id: string
  number: string
  title: string
  status: string
  latitude: number
  longitude: number
  address?: string
  createdAt: string
  service?: { name: string; category: string }
  department?: { name: string }
  citizen?: { name: string }
}

interface ProtocolMapEnhancedProps {
  protocols: Protocol[]
  showClustering?: boolean
  showHeatmap?: boolean
  height?: string
}

// Componente para ajustar bounds do mapa
function MapBounds({ protocols }: { protocols: Protocol[] }) {
  const map = useMap()

  useEffect(() => {
    if (protocols.length > 0) {
      const bounds = L.latLngBounds(
        protocols.map(p => [p.latitude, p.longitude] as [number, number])
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [protocols, map])

  return null
}

// Criar ícone customizado por status
function createCustomIcon(status: string) {
  const color = getMarkerColor(status)
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.374 12.5 28.125 12.5 28.125S25 21.874 25 12.5C25 5.596 19.404 0 12.5 0z" fill="${color}"/>
      <circle cx="12.5" cy="12.5" r="7" fill="white"/>
    </svg>
  `

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  })
}

function getMarkerColor(status: string): string {
  switch (status) {
    case 'CONCLUIDO':
      return '#10b981' // green-500
    case 'PROGRESSO':
      return '#3b82f6' // blue-500
    case 'PENDENCIA':
      return '#ef4444' // red-500
    case 'VINCULADO':
      return '#f59e0b' // amber-500
    case 'CANCELADO':
      return '#6b7280' // gray-500
    default:
      return '#9ca3af' // gray-400
  }
}

export function ProtocolMapEnhanced({
  protocols,
  showClustering = true,
  showHeatmap = false,
  height = '500px'
}: ProtocolMapEnhancedProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Evitar SSR do Leaflet
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <p className="text-gray-600">Carregando mapa...</p>
      </div>
    )
  }

  if (protocols.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <p className="text-gray-600">Nenhum protocolo com geolocalização encontrado</p>
      </div>
    )
  }

  // Centro padrão (Brasil) se não houver protocolos
  const defaultCenter: [number, number] = [-15.7942, -47.8822]
  const center: [number, number] = protocols.length > 0
    ? [protocols[0].latitude, protocols[0].longitude]
    : defaultCenter

  // Calcular dados para heatmap (densidade de demandas)
  const heatmapData = protocols.reduce((acc, protocol) => {
    const key = `${protocol.latitude.toFixed(4)},${protocol.longitude.toFixed(4)}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds protocols={protocols} />

        {/* Heatmap - Círculos de densidade */}
        {showHeatmap && Object.entries(heatmapData).map(([key, count]) => {
          const [lat, lng] = key.split(',').map(Number)
          const radius = Math.min(count * 100, 500) // Raio proporcional à quantidade

          return (
            <Circle
              key={key}
              center={[lat, lng]}
              radius={radius}
              pathOptions={{
                fillColor: count > 5 ? '#ef4444' : count > 2 ? '#f59e0b' : '#3b82f6',
                fillOpacity: 0.3,
                color: 'transparent'
              }}
            />
          )
        })}

        {/* Marcadores com ou sem clustering */}
        {showClustering ? (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={(cluster: any) => {
              const count = cluster.getChildCount()
              let size = 'small'
              let color = 'bg-blue-500'

              if (count > 50) {
                size = 'large'
                color = 'bg-red-500'
              } else if (count > 20) {
                size = 'medium'
                color = 'bg-orange-500'
              }

              return L.divIcon({
                html: `<div class="flex items-center justify-center w-10 h-10 rounded-full ${color} text-white font-bold shadow-lg">
                  ${count}
                </div>`,
                className: 'custom-cluster-icon',
                iconSize: L.point(40, 40, true)
              })
            }}
          >
            {protocols.map((protocol) => (
              <Marker
                key={protocol.id}
                position={[protocol.latitude, protocol.longitude]}
                icon={createCustomIcon(protocol.status)}
              >
                <Popup>
                  <div className="p-2 min-w-[250px]">
                    <p className="font-bold text-blue-600">#{protocol.number}</p>
                    <p className="font-medium text-sm mt-1">{protocol.title}</p>

                    <div className="mt-2 space-y-1 text-xs">
                      <p>
                        <strong>Status:</strong>{' '}
                        <span
                          className={`px-2 py-0.5 rounded text-white ${
                            protocol.status === 'CONCLUIDO'
                              ? 'bg-green-600'
                              : protocol.status === 'PROGRESSO'
                              ? 'bg-blue-600'
                              : protocol.status === 'PENDENCIA'
                              ? 'bg-red-600'
                              : protocol.status === 'VINCULADO'
                              ? 'bg-amber-600'
                              : 'bg-gray-600'
                          }`}
                        >
                          {protocol.status}
                        </span>
                      </p>

                      {protocol.service && (
                        <>
                          <p>
                            <strong>Serviço:</strong> {protocol.service.name}
                          </p>
                          {protocol.service.category && (
                            <p>
                              <strong>Categoria:</strong> {protocol.service.category}
                            </p>
                          )}
                        </>
                      )}

                      {protocol.department && (
                        <p>
                          <strong>Secretaria:</strong> {protocol.department.name}
                        </p>
                      )}

                      {protocol.citizen && (
                        <p>
                          <strong>Cidadão:</strong> {protocol.citizen.name}
                        </p>
                      )}

                      {protocol.address && (
                        <p>
                          <strong>Endereço:</strong> {protocol.address}
                        </p>
                      )}

                      <p className="text-gray-500">
                        <strong>Criado em:</strong>{' '}
                        {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <a
                      href={`/admin/protocolos?search=${protocol.number}`}
                      className="inline-block mt-2 text-blue-600 hover:underline text-xs font-medium"
                    >
                      Ver detalhes →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          <>
            {protocols.map((protocol) => (
              <Marker
                key={protocol.id}
                position={[protocol.latitude, protocol.longitude]}
                icon={createCustomIcon(protocol.status)}
              >
                <Popup>
                  <div className="p-2 min-w-[250px]">
                    <p className="font-bold text-blue-600">#{protocol.number}</p>
                    <p className="font-medium text-sm mt-1">{protocol.title}</p>

                    <div className="mt-2 space-y-1 text-xs">
                      <p>
                        <strong>Status:</strong>{' '}
                        <span
                          className={`px-2 py-0.5 rounded text-white ${
                            protocol.status === 'CONCLUIDO'
                              ? 'bg-green-600'
                              : protocol.status === 'PROGRESSO'
                              ? 'bg-blue-600'
                              : protocol.status === 'PENDENCIA'
                              ? 'bg-red-600'
                              : 'bg-gray-600'
                          }`}
                        >
                          {protocol.status}
                        </span>
                      </p>

                      {protocol.service && (
                        <p>
                          <strong>Serviço:</strong> {protocol.service.name}
                        </p>
                      )}

                      {protocol.department && (
                        <p>
                          <strong>Secretaria:</strong> {protocol.department.name}
                        </p>
                      )}

                      {protocol.address && (
                        <p>
                          <strong>Endereço:</strong> {protocol.address}
                        </p>
                      )}
                    </div>

                    <a
                      href={`/admin/protocolos?search=${protocol.number}`}
                      className="inline-block mt-2 text-blue-600 hover:underline text-xs"
                    >
                      Ver detalhes →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  )
}
