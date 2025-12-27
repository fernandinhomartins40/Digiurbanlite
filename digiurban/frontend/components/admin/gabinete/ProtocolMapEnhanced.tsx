'use client'

import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, MapPin, Filter, Eye, EyeOff, TrendingUp } from 'lucide-react'

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
  locationType?: string // GPS, CITIZEN_ADDRESS, SPECIFIC_LOCATION
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

// Componente para mapa de calor usando leaflet.heat
function HeatmapLayer({ protocols, intensity }: { protocols: Protocol[], intensity: number }) {
  const map = useMap()

  useEffect(() => {
    // Importação dinâmica do leaflet.heat
    import('leaflet.heat').then((module) => {
      // @ts-ignore
      const heat = L.heatLayer || module.default

      if (!heat) {
        console.warn('leaflet.heat não carregado')
        return
      }

      // Preparar dados: [lat, lng, intensity]
      const points = protocols.map(p => [p.latitude, p.longitude, 1] as [number, number, number])

      // Criar camada de calor
      const heatLayer = heat(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: intensity,
        gradient: {
          0.0: '#0000ff',  // Azul (baixa densidade)
          0.4: '#00ff00',  // Verde
          0.6: '#ffff00',  // Amarelo
          0.8: '#ff9900',  // Laranja
          1.0: '#ff0000'   // Vermelho (alta densidade)
        }
      })

      heatLayer.addTo(map)

      return () => {
        map.removeLayer(heatLayer)
      }
    })
  }, [map, protocols, intensity])

  return null
}

// Criar ícone customizado por status
function createCustomIcon(status: string, isGPS: boolean = false) {
  const color = getMarkerColor(status)
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.374 12.5 28.125 12.5 28.125S25 21.874 25 12.5C25 5.596 19.404 0 12.5 0z" fill="${color}"/>
      <circle cx="12.5" cy="12.5" r="7" fill="white"/>
      ${isGPS ? '<circle cx="12.5" cy="12.5" r="3" fill="' + color + '"/>' : ''}
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
  showClustering: initialClustering = true,
  showHeatmap: initialHeatmap = false,
  height = '500px'
}: ProtocolMapEnhancedProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [showClustering, setShowClustering] = useState(initialClustering)
  const [showHeatmap, setShowHeatmap] = useState(initialHeatmap)
  const [heatmapIntensity, setHeatmapIntensity] = useState(1.0)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)

  // Evitar SSR do Leaflet
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filtrar protocolos
  const filteredProtocols = useMemo(() => {
    return protocols.filter(p => {
      if (selectedStatus && p.status !== selectedStatus) return false
      if (selectedDepartment && p.department?.name !== selectedDepartment) return false
      return true
    })
  }, [protocols, selectedStatus, selectedDepartment])

  // Estatísticas
  const stats = useMemo(() => {
    const byStatus = filteredProtocols.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byDepartment = filteredProtocols.reduce((acc, p) => {
      const dept = p.department?.name || 'Sem Secretaria'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byService = filteredProtocols.reduce((acc, p) => {
      const service = p.service?.name || 'Sem Serviço'
      acc[service] = (acc[service] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const gpsCount = filteredProtocols.filter(p =>
      p.locationType === 'GPS' || p.locationType === 'MANUAL_PIN'
    ).length

    return {
      total: filteredProtocols.length,
      byStatus,
      byDepartment,
      byService,
      gpsCount,
      gpsPercentage: ((gpsCount / filteredProtocols.length) * 100).toFixed(1)
    }
  }, [filteredProtocols])

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
  const center: [number, number] = filteredProtocols.length > 0
    ? [filteredProtocols[0].latitude, filteredProtocols[0].longitude]
    : defaultCenter

  return (
    <div className="space-y-4">
      {/* Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Controles de Visualização */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">Visualização:</span>
              <Button
                variant={showClustering ? "default" : "outline"}
                size="sm"
                onClick={() => setShowClustering(!showClustering)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {showClustering ? 'Clustering Ativo' : 'Clustering Desativado'}
              </Button>
              <Button
                variant={showHeatmap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <Flame className="h-4 w-4 mr-2" />
                {showHeatmap ? 'Mapa de Calor Ativo' : 'Mapa de Calor'}
              </Button>
            </div>

            {/* Controle de Intensidade do Heatmap */}
            {showHeatmap && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Intensidade:</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={heatmapIntensity}
                  onChange={(e) => setHeatmapIntensity(parseFloat(e.target.value))}
                  className="flex-1 max-w-xs"
                />
                <span className="text-sm font-medium text-gray-700">{heatmapIntensity}x</span>
              </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filtros:
              </span>

              {/* Filtro por Status */}
              <select
                value={selectedStatus || ''}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="">Todos os Status</option>
                {Object.keys(stats.byStatus).map(status => (
                  <option key={status} value={status}>
                    {status} ({stats.byStatus[status]})
                  </option>
                ))}
              </select>

              {/* Filtro por Secretaria */}
              <select
                value={selectedDepartment || ''}
                onChange={(e) => setSelectedDepartment(e.target.value || null)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="">Todas as Secretarias</option>
                {Object.keys(stats.byDepartment).map(dept => (
                  <option key={dept} value={dept}>
                    {dept} ({stats.byDepartment[dept]})
                  </option>
                ))}
              </select>

              {/* Limpar Filtros */}
              {(selectedStatus || selectedDepartment) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedStatus(null)
                    setSelectedDepartment(null)
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Estatísticas Rápidas */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <MapPin className="h-3 w-3 mr-1" />
                {stats.total} protocolos
              </Badge>
              <Badge variant="secondary">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.gpsCount} com GPS ({stats.gpsPercentage}%)
              </Badge>
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <Badge
                  key={status}
                  style={{ backgroundColor: getMarkerColor(status), color: 'white' }}
                >
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa */}
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

          <MapBounds protocols={filteredProtocols} />

          {/* Mapa de Calor */}
          {showHeatmap && (
            <HeatmapLayer protocols={filteredProtocols} intensity={heatmapIntensity} />
          )}

          {/* Marcadores com ou sem clustering */}
          {!showHeatmap && showClustering ? (
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
              {filteredProtocols.map((protocol) => {
                const isGPS = protocol.locationType === 'GPS' || protocol.locationType === 'MANUAL_PIN'
                return (
                  <Marker
                    key={protocol.id}
                    position={[protocol.latitude, protocol.longitude]}
                    icon={createCustomIcon(protocol.status, isGPS)}
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

                          {/* CORREÇÃO: Exibir coordenadas GPS em vez de endereço geocodificado */}
                          <p>
                            <strong>Localização:</strong>{' '}
                            {isGPS && <span className="text-green-600 font-medium">📍 GPS</span>}
                            <br />
                            <span className="font-mono text-xs">
                              {protocol.latitude.toFixed(6)}, {protocol.longitude.toFixed(6)}
                            </span>
                          </p>

                          {protocol.address && (
                            <p className="text-gray-600">
                              <strong>Referência:</strong> {protocol.address}
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
                )
              })}
            </MarkerClusterGroup>
          ) : !showHeatmap ? (
            <>
              {filteredProtocols.map((protocol) => {
                const isGPS = protocol.locationType === 'GPS' || protocol.locationType === 'MANUAL_PIN'
                return (
                  <Marker
                    key={protocol.id}
                    position={[protocol.latitude, protocol.longitude]}
                    icon={createCustomIcon(protocol.status, isGPS)}
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

                          {/* CORREÇÃO: Exibir coordenadas GPS */}
                          <p>
                            <strong>Localização:</strong>{' '}
                            {isGPS && <span className="text-green-600 font-medium">📍 GPS</span>}
                            <br />
                            <span className="font-mono text-xs">
                              {protocol.latitude.toFixed(6)}, {protocol.longitude.toFixed(6)}
                            </span>
                          </p>

                          {protocol.address && (
                            <p className="text-gray-600">
                              <strong>Referência:</strong> {protocol.address}
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
                )
              })}
            </>
          ) : null}
        </MapContainer>
      </div>

      {/* Análise Estatística por Região */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Análise por Região
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Serviços Mais Solicitados */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Serviços Mais Solicitados</h4>
              <div className="space-y-1">
                {Object.entries(stats.byService)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([service, count]) => (
                    <div key={service} className="flex justify-between text-xs">
                      <span className="truncate flex-1">{service}</span>
                      <Badge variant="secondary" className="ml-2">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* Secretarias com Mais Demandas */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Secretarias com Mais Demandas</h4>
              <div className="space-y-1">
                {Object.entries(stats.byDepartment)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([dept, count]) => (
                    <div key={dept} className="flex justify-between text-xs">
                      <span className="truncate flex-1">{dept}</span>
                      <Badge variant="secondary" className="ml-2">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* Precisão de Localização */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Precisão de Localização</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Com GPS</span>
                  <Badge variant="default">{stats.gpsCount} ({stats.gpsPercentage}%)</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Sem GPS</span>
                  <Badge variant="secondary">
                    {stats.total - stats.gpsCount} ({(100 - parseFloat(stats.gpsPercentage)).toFixed(1)}%)
                  </Badge>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${stats.gpsPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
