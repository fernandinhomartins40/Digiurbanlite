'use client'

import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, MapPin, Filter, Eye, EyeOff, TrendingUp, Shield } from 'lucide-react'

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
  locationType?: string
}

interface ProtocolMapEnhancedProps {
  protocols: Protocol[]
  showClustering?: boolean
  showHeatmap?: boolean
  height?: string
}

// ============================================
// CONFIGURAÇÃO DE CATEGORIAS DE SERVIÇOS
// ============================================

interface ServiceCategoryConfig {
  color: string
  icon: string
  label: string
  circleRadius: number
  isAlert?: boolean
}

const SERVICE_CATEGORIES: Record<string, ServiceCategoryConfig> = {
  // 🚨 SEGURANÇA PÚBLICA - ALERTA CRÍTICO
  'Segurança Pública': {
    color: '#dc2626', // red-600
    icon: '🚨',
    label: 'Segurança',
    circleRadius: 150,
    isAlert: true
  },

  // 🏗️ INFRAESTRUTURA E OBRAS
  'Obras Públicas': {
    color: '#f97316', // orange-500
    icon: '🏗️',
    label: 'Obras',
    circleRadius: 100
  },
  'Pavimentação': {
    color: '#ea580c', // orange-600
    icon: '🛣️',
    label: 'Pavimentação',
    circleRadius: 80
  },

  // 🌳 MEIO AMBIENTE
  'Meio Ambiente': {
    color: '#16a34a', // green-600
    icon: '🌳',
    label: 'Meio Ambiente',
    circleRadius: 100
  },
  'Poda': {
    color: '#15803d', // green-700
    icon: '✂️',
    label: 'Poda',
    circleRadius: 60
  },
  'Limpeza': {
    color: '#22c55e', // green-500
    icon: '🧹',
    label: 'Limpeza',
    circleRadius: 80
  },

  // 💡 SERVIÇOS PÚBLICOS
  'Iluminação': {
    color: '#eab308', // yellow-500
    icon: '💡',
    label: 'Iluminação',
    circleRadius: 50
  },
  'Serviços Públicos': {
    color: '#f59e0b', // amber-500
    icon: '🔧',
    label: 'Serviços',
    circleRadius: 80
  },

  // 🏥 SAÚDE
  'Saúde': {
    color: '#ef4444', // red-500
    icon: '🏥',
    label: 'Saúde',
    circleRadius: 120
  },

  // 🎓 EDUCAÇÃO
  'Educação': {
    color: '#3b82f6', // blue-500
    icon: '🎓',
    label: 'Educação',
    circleRadius: 100
  },

  // 🌾 AGRICULTURA
  'Agricultura': {
    color: '#84cc16', // lime-500
    icon: '🌾',
    label: 'Agricultura',
    circleRadius: 150
  },

  // 🎨 CULTURA
  'Cultura': {
    color: '#a855f7', // purple-500
    icon: '🎨',
    label: 'Cultura',
    circleRadius: 100
  },

  // 🏃 ESPORTES
  'Esportes': {
    color: '#06b6d4', // cyan-500
    icon: '🏃',
    label: 'Esportes',
    circleRadius: 100
  },

  // 🏛️ PLANEJAMENTO URBANO
  'Planejamento Urbano': {
    color: '#6366f1', // indigo-500
    icon: '🏛️',
    label: 'Planejamento',
    circleRadius: 120
  },

  // 🏘️ ASSISTÊNCIA SOCIAL
  'Assistência Social': {
    color: '#ec4899', // pink-500
    icon: '🏘️',
    label: 'Assistência',
    circleRadius: 100
  },

  // DEFAULT
  'default': {
    color: '#6b7280', // gray-500
    icon: '📍',
    label: 'Outros',
    circleRadius: 80
  }
}

function getCategoryConfig(category?: string): ServiceCategoryConfig {
  if (!category) return SERVICE_CATEGORIES['default']

  // Buscar correspondência exata
  if (SERVICE_CATEGORIES[category]) {
    return SERVICE_CATEGORIES[category]
  }

  // Buscar correspondência parcial (case insensitive)
  const categoryLower = category.toLowerCase()
  for (const [key, config] of Object.entries(SERVICE_CATEGORIES)) {
    if (key.toLowerCase().includes(categoryLower) || categoryLower.includes(key.toLowerCase())) {
      return config
    }
  }

  return SERVICE_CATEGORIES['default']
}

// ============================================
// COMPONENTES DO MAPA
// ============================================

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

// Criar ícone customizado por categoria de serviço
function createServiceIcon(category?: string, isGPS: boolean = false) {
  const config = getCategoryConfig(category)
  const size = config.isAlert ? 35 : 28
  const iconSize = config.isAlert ? 20 : 16

  const svgIcon = `
    <svg width="${size}" height="${size + 15}" viewBox="0 0 ${size} ${size + 15}" xmlns="http://www.w3.org/2000/svg">
      <!-- Pin de localização -->
      <path d="M${size/2} 0C${size/4} 0 0 ${size/4} 0 ${size/2}c0 ${size*0.6} ${size/2} ${size + 15 - size/2} ${size/2} ${size + 15 - size/2}S${size} ${size*1.1} ${size} ${size/2}C${size} ${size/4} ${size*0.75} 0 ${size/2} 0z"
            fill="${config.color}"
            ${config.isAlert ? 'stroke="#ffffff" stroke-width="2"' : ''}
            ${config.isAlert ? 'filter="drop-shadow(0 0 8px ' + config.color + ')"' : ''}
      />

      <!-- Círculo branco interno -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/3.5}" fill="white"/>

      <!-- Texto emoji -->
      <text x="${size/2}" y="${size/2 + 4}"
            text-anchor="middle"
            font-size="${iconSize}"
            fill="${config.color}">
        ${config.icon}
      </text>

      ${isGPS ? `<circle cx="${size/2}" cy="${size/2}" r="3" fill="${config.color}"/>` : ''}

      ${config.isAlert ? `
        <!-- Animação de pulso para alertas -->
        <circle cx="${size/2}" cy="${size/2}" r="${size/2.5}" fill="none" stroke="${config.color}" stroke-width="2" opacity="0.6">
          <animate attributeName="r" from="${size/2.5}" to="${size/1.5}" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
    </svg>
  `

  return L.divIcon({
    html: svgIcon,
    className: config.isAlert ? 'custom-marker alert-marker' : 'custom-marker',
    iconSize: [size, size + 15],
    iconAnchor: [size / 2, size + 15],
    popupAnchor: [0, -(size + 15)]
  })
}

export function ProtocolMapEnhanced({
  protocols,
  showClustering: initialClustering = true,
  showHeatmap: initialHeatmap = false,
  height = '500px'
}: ProtocolMapEnhancedProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [showClustering, setShowClustering] = useState(initialClustering)
  const [showServiceCircles, setShowServiceCircles] = useState(true) // Novo: círculos de serviço
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filtrar protocolos
  const filteredProtocols = useMemo(() => {
    return protocols.filter(p => {
      if (selectedStatus && p.status !== selectedStatus) return false
      if (selectedDepartment && p.department?.name !== selectedDepartment) return false
      if (selectedCategory && p.service?.category !== selectedCategory) return false
      return true
    })
  }, [protocols, selectedStatus, selectedDepartment, selectedCategory])

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

    const byCategory = filteredProtocols.reduce((acc, p) => {
      const category = p.service?.category || 'Outros'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const gpsCount = filteredProtocols.filter(p =>
      p.locationType === 'GPS' || p.locationType === 'MANUAL_PIN'
    ).length

    const alertCount = filteredProtocols.filter(p =>
      p.service?.category === 'Segurança Pública'
    ).length

    return {
      total: filteredProtocols.length,
      byStatus,
      byDepartment,
      byService,
      byCategory,
      gpsCount,
      alertCount,
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
            {/* Alerta de Segurança */}
            {stats.alertCount > 0 && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span className="font-bold text-red-900">
                    🚨 {stats.alertCount} ALERTA{stats.alertCount > 1 ? 'S' : ''} DE SEGURANÇA ATIVO{stats.alertCount > 1 ? 'S' : ''}
                  </span>
                </div>
                <p className="text-xs text-red-700 mt-1 ml-7">
                  Pedidos de ajuda prioritários - Ação imediata necessária
                </p>
              </div>
            )}

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
                variant={showServiceCircles ? "default" : "outline"}
                size="sm"
                onClick={() => setShowServiceCircles(!showServiceCircles)}
              >
                <Flame className="h-4 w-4 mr-2" />
                {showServiceCircles ? 'Áreas de Serviço Ativas' : 'Áreas de Serviço'}
              </Button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filtros:
              </span>

              {/* Filtro por Categoria */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="text-sm border rounded px-2 py-1 font-medium"
              >
                <option value="">Todas as Categorias</option>
                {Object.entries(stats.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const config = getCategoryConfig(category)
                    return (
                      <option key={category} value={category}>
                        {config.icon} {category} ({count})
                      </option>
                    )
                  })}
              </select>

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
              {(selectedStatus || selectedDepartment || selectedCategory) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedStatus(null)
                    setSelectedDepartment(null)
                    setSelectedCategory(null)
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Legenda de Categorias */}
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Legenda de Categorias:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const config = getCategoryConfig(category)
                    return (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="cursor-pointer hover:opacity-80"
                        style={{
                          backgroundColor: config.color + '20',
                          color: config.color,
                          borderColor: config.color,
                          borderWidth: '1px'
                        }}
                        onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                      >
                        <span className="mr-1">{config.icon}</span>
                        {config.label}: {count}
                      </Badge>
                    )
                  })}
              </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Badge variant="secondary">
                <MapPin className="h-3 w-3 mr-1" />
                {stats.total} protocolos
              </Badge>
              <Badge variant="secondary">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.gpsCount} com GPS ({stats.gpsPercentage}%)
              </Badge>
              {stats.alertCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <Shield className="h-3 w-3 mr-1" />
                  {stats.alertCount} Alertas de Segurança
                </Badge>
              )}
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBounds protocols={filteredProtocols} />

          {/* Círculos de Abrangência de Serviço */}
          {showServiceCircles && filteredProtocols.map((protocol) => {
            const config = getCategoryConfig(protocol.service?.category)
            return (
              <Circle
                key={`circle-${protocol.id}`}
                center={[protocol.latitude, protocol.longitude]}
                radius={config.circleRadius}
                pathOptions={{
                  fillColor: config.color,
                  fillOpacity: config.isAlert ? 0.3 : 0.15,
                  color: config.color,
                  weight: config.isAlert ? 3 : 1,
                  opacity: config.isAlert ? 0.8 : 0.5
                }}
              />
            )
          })}

          {/* Marcadores */}
          {showClustering ? (
            <MarkerClusterGroup
              chunkedLoading
              iconCreateFunction={(cluster: any) => {
                const count = cluster.getChildCount()
                let color = 'bg-blue-500'

                if (count > 50) {
                  color = 'bg-red-500'
                } else if (count > 20) {
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
                const config = getCategoryConfig(protocol.service?.category)

                return (
                  <Marker
                    key={protocol.id}
                    position={[protocol.latitude, protocol.longitude]}
                    icon={createServiceIcon(protocol.service?.category, isGPS)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[280px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <p className="font-bold text-blue-600">#{protocol.number}</p>
                            {config.isAlert && (
                              <Badge variant="destructive" className="text-xs">
                                🚨 ALERTA DE SEGURANÇA
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="font-medium text-sm mt-1">{protocol.title}</p>

                        <div className="mt-2 space-y-1 text-xs">
                          <p>
                            <strong>Categoria:</strong>{' '}
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: config.color + '20', color: config.color }}
                            >
                              {config.icon} {config.label}
                            </Badge>
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
          ) : (
            <>
              {filteredProtocols.map((protocol) => {
                const isGPS = protocol.locationType === 'GPS' || protocol.locationType === 'MANUAL_PIN'
                const config = getCategoryConfig(protocol.service?.category)

                return (
                  <Marker
                    key={protocol.id}
                    position={[protocol.latitude, protocol.longitude]}
                    icon={createServiceIcon(protocol.service?.category, isGPS)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[280px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <p className="font-bold text-blue-600">#{protocol.number}</p>
                            {config.isAlert && (
                              <Badge variant="destructive" className="text-xs">
                                🚨 ALERTA
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="font-medium text-sm">{protocol.title}</p>

                        <div className="mt-2 space-y-1 text-xs">
                          <p>
                            <strong>Categoria:</strong>{' '}
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: config.color + '20', color: config.color }}
                            >
                              {config.icon} {config.label}
                            </Badge>
                          </p>

                          {protocol.service && (
                            <p><strong>Serviço:</strong> {protocol.service.name}</p>
                          )}

                          {protocol.department && (
                            <p><strong>Secretaria:</strong> {protocol.department.name}</p>
                          )}

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
          )}
        </MapContainer>
      </div>

      {/* Análise Estatística */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Análise por Região e Categoria
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Categorias Mais Solicitadas */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Categorias Mais Solicitadas</h4>
              <div className="space-y-1">
                {Object.entries(stats.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([category, count]) => {
                    const config = getCategoryConfig(category)
                    return (
                      <div key={category} className="flex justify-between items-center text-xs">
                        <span className="truncate flex-1 flex items-center gap-1">
                          <span>{config.icon}</span>
                          <span>{config.label}</span>
                        </span>
                        <Badge
                          variant="secondary"
                          className="ml-2"
                          style={{ backgroundColor: config.color + '20', color: config.color }}
                        >
                          {count}
                        </Badge>
                      </div>
                    )
                  })}
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

            {/* Precisão e Alertas */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Qualidade e Alertas</h4>
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
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${stats.gpsPercentage}%` }}
                  />
                </div>
                {stats.alertCount > 0 && (
                  <div className="flex justify-between text-xs mt-3 p-2 bg-red-50 rounded border border-red-200">
                    <span className="font-medium text-red-900">🚨 Alertas Ativos</span>
                    <Badge variant="destructive">{stats.alertCount}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSS para animação de alerta */}
      <style jsx global>{`
        .alert-marker {
          animation: pulse-alert 2s infinite;
        }

        @keyframes pulse-alert {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  )
}
