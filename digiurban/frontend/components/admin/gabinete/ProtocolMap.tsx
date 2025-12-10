'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

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

interface ProtocolMapProps {
  protocols: Protocol[]
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

export function ProtocolMap({ protocols }: ProtocolMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Evitar SSR do Leaflet
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Carregando mapa...</p>
      </div>
    )
  }

  if (protocols.length === 0) {
    return (
      <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Nenhum protocolo com geolocalização encontrado</p>
      </div>
    )
  }

  // Centro padrão (Brasil) se não houver protocolos
  const defaultCenter: [number, number] = [-15.7942, -47.8822]
  const center: [number, number] = protocols.length > 0
    ? [protocols[0].latitude, protocols[0].longitude]
    : defaultCenter

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDO':
        return 'green'
      case 'PROGRESSO':
        return 'blue'
      case 'PENDENCIA':
        return 'red'
      case 'VINCULADO':
        return 'orange'
      default:
        return 'gray'
    }
  }

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200">
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

        {protocols.map((protocol) => (
          <Marker
            key={protocol.id}
            position={[protocol.latitude, protocol.longitude]}
          >
            <Popup>
              <div className="p-2">
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
                  className="inline-block mt-2 text-blue-600 hover:underline text-xs"
                >
                  Ver detalhes →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
