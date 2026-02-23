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
  geocodingPrecision?: 'exact' | 'geocoded' | 'house' | 'street' | 'neighborhood' | 'city' | 'unknown'
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
  if (!category) {
    return SERVICE_CATEGORIES['default']
  }

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

// Determinar se localização é precisa (GPS/manual) ou aproximada (geocodificada de endereço)
function isExactLocation(protocol: Protocol): boolean {
  if (protocol.locationType === 'GPS' || protocol.locationType === 'MANUAL_PIN') return true
  if (protocol.geocodingPrecision === 'exact') return true
  return false
}

function getPrecisionLabel(protocol: Protocol): { label: string; color: string; icon: string } {
  if (protocol.locationType === 'GPS') return { label: 'GPS (preciso)', color: '#16a34a', icon: '📍' }
  if (protocol.locationType === 'MANUAL_PIN') return { label: 'Pin manual (preciso)', color: '#16a34a', icon: '📌' }
  if (protocol.geocodingPrecision === 'exact') return { label: 'Coordenadas exatas', color: '#16a34a', icon: '📍' }
  if (protocol.geocodingPrecision === 'house') return { label: 'Endereço (casa)', color: '#22c55e', icon: '🏠' }
  if (protocol.geocodingPrecision === 'street') return { label: 'Endereço (rua)', color: '#f59e0b', icon: '🛣️' }
  if (protocol.geocodingPrecision === 'neighborhood') return { label: 'Endereço (bairro)', color: '#f97316', icon: '🏘️' }
  if (protocol.geocodingPrecision === 'city') return { label: 'Endereço (cidade)', color: '#ef4444', icon: '🏙️' }
  if (protocol.locationType === 'GEOCODED_ADDRESS') return { label: 'Geocodificado', color: '#f59e0b', icon: '📫' }
  if (protocol.locationType === 'CITIZEN_ADDRESS') return { label: 'End. cidadão', color: '#f59e0b', icon: '📫' }
  return { label: 'Coordenadas', color: '#6b7280', icon: '📍' }
}

// Criar ícone customizado por categoria de serviço
function createServiceIcon(category?: string, protocol?: Protocol) {
  const config = getCategoryConfig(category)
  const isExact = protocol ? isExactLocation(protocol) : true
  const size = config.isAlert ? 35 : 28
  const iconSize = config.isAlert ? 20 : 16

  // Cor do indicador de precisão: verde = exato, laranja = endereço
  const precisionColor = isExact ? '#16a34a' : '#f59e0b'
  // Borda do pin tracejada para endereço geocodificado
  const pinStroke = !isExact ? `stroke="${precisionColor}" stroke-width="2" stroke-dasharray="3,2"` : ''

  const svgIcon = `
    <svg width="${size + 8}" height="${size + 20}" viewBox="-4 -4 ${size + 8} ${size + 20}" xmlns="http://www.w3.org/2000/svg">
      <!-- Pin de localização -->
      <path d="M${size/2} 0C${size/4} 0 0 ${size/4} 0 ${size/2}c0 ${size*0.6} ${size/2} ${size + 15 - size/2} ${size/2} ${size + 15 - size/2}S${size} ${size*1.1} ${size} ${size/2}C${size} ${size/4} ${size*0.75} 0 ${size/2} 0z"
            fill="${config.color}"
            ${config.isAlert ? 'stroke="#ffffff" stroke-width="2"' : pinStroke}
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

      <!-- Indicador de precisão (bolinha no canto superior direito) -->
      <circle cx="${size - 2}" cy="4" r="4" fill="${precisionColor}" stroke="white" stroke-width="1.5"/>

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
    iconSize: [size + 8, size + 20],
    iconAnchor: [(size + 8) / 2, size + 15],
    popupAnchor: [0, -(size + 15)]
  })
}

export function ProtocolMapEnhanced({
  protocols,
  showClustering: initialClustering = true,
  showHeatmap: initialHeatmap = false,
  height = '500px'
}: ProtocolMapEnhancedProps) {
  // Altura responsiva
  const mapHeight = height === 'mobile-responsive'
    ? 'h-[400px] md:h-[600px]'
    : `h-[${height}]`
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
      // CORREÇÃO: selectedCategory agora filtra por department.name (secretaria)
      if (selectedCategory && p.department?.name !== selectedCategory) return false
      return true
    })
  }, [protocols, selectedStatus, selectedDepartment, selectedCategory])

  // Aplicar jitter (pequeno deslocamento) para protocolos na mesma coordenada
  // Isso evita que marcadores fiquem empilhados no mapa
  const protocolsWithJitter = useMemo(() => {
    // Agrupar por coordenadas
    const coordsMap = new Map<string, Protocol[]>()

    filteredProtocols.forEach(p => {
      const key = `${p.latitude},${p.longitude}`
      if (!coordsMap.has(key)) {
        coordsMap.set(key, [])
      }
      coordsMap.get(key)!.push(p)
    })

    // Aplicar jitter apenas para coordenadas duplicadas e não-GPS
    const result: Protocol[] = []

    coordsMap.forEach((protocolList, coords) => {
      if (protocolList.length === 1) {
        // Coordenada única - não precisa de jitter
        result.push(protocolList[0])
      } else {
        // Múltiplos protocolos na mesma coordenada
        protocolList.forEach((protocol, index) => {
          // Aplicar jitter se NÃO for localização exata (GPS/manual pin)
          const isRealGPS = isExactLocation(protocol)

          if (!isRealGPS && index > 0) {
            // Gerar deslocamento aleatório em círculo
            // ±0.0005 graus ≈ 50 metros
            const angle = (index / protocolList.length) * 2 * Math.PI
            const radius = 0.0003 + (Math.random() * 0.0002) // 30-50m

            result.push({
              ...protocol,
              latitude: protocol.latitude + (Math.cos(angle) * radius),
              longitude: protocol.longitude + (Math.sin(angle) * radius)
            })
          } else {
            // Primeiro protocolo ou GPS real - manter coordenada original
            result.push(protocol)
          }
        })
      }
    })

    return result
  }, [filteredProtocols])

  // Estatísticas (usar filteredProtocols para estatísticas reais, não as coordenadas com jitter)
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
      // CORREÇÃO: Usar department.name ao invés de service.category para categorizar por secretaria
      const category = p.department?.name || 'Outros'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const exactCount = filteredProtocols.filter(p => isExactLocation(p)).length

    const geocodedCount = filteredProtocols.filter(p =>
      !isExactLocation(p) && (p.locationType === 'GEOCODED_ADDRESS' || p.locationType === 'CITIZEN_ADDRESS' || p.geocodingPrecision === 'geocoded')
    ).length

    const alertCount = filteredProtocols.filter(p =>
      p.department?.name === 'Segurança Pública'
    ).length

    return {
      total: filteredProtocols.length,
      byStatus,
      byDepartment,
      byService,
      byCategory,
      exactCount,
      geocodedCount,
      alertCount,
      exactPercentage: filteredProtocols.length > 0 ? ((exactCount / filteredProtocols.length) * 100).toFixed(1) : '0'
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
  const center: [number, number] = protocolsWithJitter.length > 0
    ? [protocolsWithJitter[0].latitude, protocolsWithJitter[0].longitude]
    : defaultCenter

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Controles */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="space-y-3 md:space-y-4">
            {/* Alerta de Segurança */}
            {stats.alertCount > 0 && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-2 md:p-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0" />
                  <span className="font-bold text-sm md:text-base text-red-900">
                    🚨 {stats.alertCount} ALERTA{stats.alertCount > 1 ? 'S' : ''} DE SEGURANÇA ATIVO{stats.alertCount > 1 ? 'S' : ''}
                  </span>
                </div>
                <p className="text-xs text-red-700 mt-1 ml-6 md:ml-7">
                  Pedidos de ajuda prioritários - Ação imediata necessária
                </p>
              </div>
            )}

            {/* Controles de Visualização */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs md:text-sm font-medium text-gray-700 w-full md:w-auto mb-1 md:mb-0">Visualização:</span>
              <Button
                variant={showClustering ? "default" : "outline"}
                size="sm"
                onClick={() => setShowClustering(!showClustering)}
                className="text-xs md:text-sm flex-1 md:flex-none"
              >
                <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{showClustering ? 'Clustering Ativo' : 'Clustering Desativado'}</span>
                <span className="sm:hidden">Cluster</span>
              </Button>
              <Button
                variant={showServiceCircles ? "default" : "outline"}
                size="sm"
                onClick={() => setShowServiceCircles(!showServiceCircles)}
                className="text-xs md:text-sm flex-1 md:flex-none"
              >
                <Flame className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{showServiceCircles ? 'Áreas de Serviço Ativas' : 'Áreas de Serviço'}</span>
                <span className="sm:hidden">Áreas</span>
              </Button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:items-center">
              <span className="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-1">
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                Filtros:
              </span>

              {/* Filtro por Categoria */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="text-xs md:text-sm border rounded px-2 py-1.5 md:py-1 font-medium w-full md:w-auto"
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
                className="text-xs md:text-sm border rounded px-2 py-1.5 md:py-1 w-full md:w-auto"
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
                className="text-xs md:text-sm border rounded px-2 py-1.5 md:py-1 w-full md:w-auto"
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
                  className="text-xs md:text-sm w-full md:w-auto"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Legenda de Categorias */}
            <div className="border-t pt-2 md:pt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Legenda de Categorias:</p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {Object.entries(stats.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const config = getCategoryConfig(category)
                    return (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="cursor-pointer hover:opacity-80 text-xs"
                        style={{
                          backgroundColor: config.color + '20',
                          color: config.color,
                          borderColor: config.color,
                          borderWidth: '1px'
                        }}
                        onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                      >
                        <span className="mr-1">{config.icon}</span>
                        <span className="hidden sm:inline">{config.label}: {count}</span>
                        <span className="sm:hidden">{count}</span>
                      </Badge>
                    )
                  })}
              </div>
            </div>

            {/* Legenda de Precisão */}
            <div className="border-t pt-2 md:pt-3">
              <p className="text-xs font-medium text-gray-700 mb-1.5">Precisão da localização:</p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 border border-white shadow-sm" />
                  Coordenadas exatas (GPS/pin)
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-sm" />
                  Aproximado (endereço geocodificado)
                </span>
              </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 border-t pt-2 md:pt-3">
              <Badge variant="secondary" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {stats.total} protocolos
              </Badge>
              <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border border-green-200">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
                {stats.exactCount} precisos ({stats.exactPercentage}%)
              </Badge>
              {stats.geocodedCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />
                  {stats.geocodedCount} por endereço
                </Badge>
              )}
              {stats.alertCount > 0 && (
                <Badge variant="destructive" className="animate-pulse text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  {stats.alertCount} Alertas de Segurança
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa */}
      <div className={`rounded-lg overflow-hidden border border-gray-200 ${height === 'mobile-responsive' ? 'h-[400px] md:h-[600px]' : ''}`} style={height !== 'mobile-responsive' ? { height } : {}}>
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

          <MapBounds protocols={protocolsWithJitter} />

          {/* Círculos de Abrangência de Serviço */}
          {showServiceCircles && protocolsWithJitter.map((protocol) => {
            // CORREÇÃO: Usar department.name para categorização por secretaria
            const config = getCategoryConfig(protocol.department?.name)
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
              {protocolsWithJitter.map((protocol) => {
                const config = getCategoryConfig(protocol.department?.name)
                const precision = getPrecisionLabel(protocol)

                return (
                  <Marker
                    key={protocol.id}
                    position={[protocol.latitude, protocol.longitude]}
                    icon={createServiceIcon(protocol.department?.name, protocol)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[240px] sm:min-w-[280px] max-w-[90vw]">
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
                            <span style={{ color: precision.color }} className="font-medium">
                              {precision.icon} {precision.label}
                            </span>
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
              {protocolsWithJitter.map((protocol) => {
                const config = getCategoryConfig(protocol.department?.name)
                const precision = getPrecisionLabel(protocol)

                return (
                  <Marker
                    key={protocol.id}
                    position={[protocol.latitude, protocol.longitude]}
                    icon={createServiceIcon(protocol.department?.name, protocol)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[240px] sm:min-w-[280px] max-w-[90vw]">
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
                            <span style={{ color: precision.color }} className="font-medium">
                              {precision.icon} {precision.label}
                            </span>
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
        <CardContent className="p-3 md:p-4">
          <h3 className="font-semibold text-base md:text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            Análise por Região e Categoria
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {/* Categorias Mais Solicitadas */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Categorias Mais Solicitadas</h4>
              <div className="space-y-1.5">
                {Object.entries(stats.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([category, count]) => {
                    const config = getCategoryConfig(category)
                    return (
                      <div key={category} className="flex justify-between items-center text-xs">
                        <span className="truncate flex-1 flex items-center gap-1">
                          <span>{config.icon}</span>
                          <span className="truncate">{config.label}</span>
                        </span>
                        <Badge
                          variant="secondary"
                          className="ml-2 shrink-0"
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
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Secretarias com Mais Demandas</h4>
              <div className="space-y-1.5">
                {Object.entries(stats.byDepartment)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([dept, count]) => (
                    <div key={dept} className="flex justify-between text-xs">
                      <span className="truncate flex-1">{dept}</span>
                      <Badge variant="secondary" className="ml-2 shrink-0">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* Precisão e Alertas */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Precisão e Alertas</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    Coordenadas precisas
                  </span>
                  <Badge variant="default" className="shrink-0 bg-green-600">{stats.exactCount} ({stats.exactPercentage}%)</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                    Via endereço
                  </span>
                  <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-800">
                    {stats.geocodedCount}
                  </Badge>
                </div>
                {stats.total - stats.exactCount - stats.geocodedCount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                      Outros
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {stats.total - stats.exactCount - stats.geocodedCount}
                    </Badge>
                  </div>
                )}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${stats.exactPercentage}%` }}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${stats.total > 0 ? ((stats.geocodedCount / stats.total) * 100).toFixed(1) : 0}%` }}
                  />
                </div>
                {stats.alertCount > 0 && (
                  <div className="flex justify-between text-xs mt-3 p-2 bg-red-50 rounded border border-red-200">
                    <span className="font-medium text-red-900 truncate">🚨 Alertas Ativos</span>
                    <Badge variant="destructive" className="shrink-0 ml-2">{stats.alertCount}</Badge>
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
