'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Clock, MapPin } from 'lucide-react'

interface Anomaly {
  id: string
  type: 'traffic' | 'energy' | 'service' | 'citizen_behavior' | 'infrastructure'
  location: string
  coordinates: { lat: number; lng: number }
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  detectedAt: string
  expectedValue: number
  actualValue: number
  deviation: number
  description: string
  category: string
  affectedUsers: number
  estimatedImpact: string
  status: 'new' | 'investigating' | 'resolved' | 'false_positive'
  assignedTo?: string
  resolution?: string
  resolvedAt?: string
}

interface AnomalyPattern {
  id: string
  name: string
  description: string
  frequency: number
  avgSeverity: number
  commonLocations: string[]
  timePattern: string
  trend: 'increasing' | 'decreasing' | 'stable'
}

interface AnomalyMetrics {
  totalAnomalies: number
  criticalAnomalies: number
  avgResolutionTime: number
  falsePositiveRate: number
  detectionAccuracy: number
  trendChange: number
}

export function AnomalyDetection() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [patterns, setPatterns] = useState<AnomalyPattern[]>([])
  const [metrics, setMetrics] = useState<AnomalyMetrics>({
    totalAnomalies: 0,
    criticalAnomalies: 0,
    avgResolutionTime: 0,
    falsePositiveRate: 0,
    detectionAccuracy: 0,
    trendChange: 0
  })
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnomalies()
    loadPatterns()
    loadMetrics()
  }, [selectedTimeframe, selectedType, selectedSeverity])

  const loadAnomalies = async () => {
    // Simulação de dados
    const mockAnomalies: Anomaly[] = [
      {
        id: '1',
        type: 'traffic',
        location: 'Av. Paulista, 1000',
        coordinates: { lat: -23.5505, lng: -46.6333 },
        severity: 'high',
        confidence: 0.92,
        detectedAt: '2024-01-15T14:30:00Z',
        expectedValue: 150,
        actualValue: 380,
        deviation: 153.33,
        description: 'Congestionamento anômalo detectado fora do horário de pico',
        category: 'Fluxo de Tráfego',
        affectedUsers: 1200,
        estimatedImpact: 'Atraso médio de 25 minutos',
        status: 'investigating',
        assignedTo: 'João Silva'
      },
      {
        id: '2',
        type: 'energy',
        location: 'Zona Industrial Norte',
        coordinates: { lat: -23.5200, lng: -46.6400 },
        severity: 'critical',
        confidence: 0.88,
        detectedAt: '2024-01-15T13:15:00Z',
        expectedValue: 2500,
        actualValue: 4200,
        deviation: 68,
        description: 'Consumo energético 68% acima do esperado',
        category: 'Consumo de Energia',
        affectedUsers: 850,
        estimatedImpact: 'Possível sobrecarga da rede elétrica',
        status: 'new'
      },
      {
        id: '3',
        type: 'service',
        location: 'UBS Centro',
        coordinates: { lat: -23.5400, lng: -46.6300 },
        severity: 'medium',
        confidence: 0.76,
        detectedAt: '2024-01-15T12:00:00Z',
        expectedValue: 80,
        actualValue: 45,
        deviation: -43.75,
        description: 'Queda significativa no atendimento médico',
        category: 'Serviços de Saúde',
        affectedUsers: 320,
        estimatedImpact: 'Redução de 35 atendimentos/dia',
        status: 'resolved',
        resolution: 'Sistema de agendamento foi corrigido',
        resolvedAt: '2024-01-15T16:30:00Z'
      }
    ]

    setAnomalies(mockAnomalies)
    setIsLoading(false)
  }

  const loadPatterns = async () => {
    const mockPatterns: AnomalyPattern[] = [
      {
        id: '1',
        name: 'Congestionamento Sazonal',
        description: 'Picos de tráfego em eventos esportivos',
        frequency: 0.15,
        avgSeverity: 2.8,
        commonLocations: ['Av. Paulista', 'Centro Histórico', 'Vila Madalena'],
        timePattern: 'Fins de semana, 19h-22h',
        trend: 'increasing'
      },
      {
        id: '2',
        name: 'Sobrecarga Energética Industrial',
        description: 'Consumo excessivo em horários não-padrão',
        frequency: 0.08,
        avgSeverity: 3.2,
        commonLocations: ['Zona Industrial Norte', 'Distrito ABC'],
        timePattern: 'Madrugada, 02h-05h',
        trend: 'stable'
      }
    ]

    setPatterns(mockPatterns)
  }

  const loadMetrics = async () => {
    const mockMetrics: AnomalyMetrics = {
      totalAnomalies: 127,
      criticalAnomalies: 23,
      avgResolutionTime: 4.2,
      falsePositiveRate: 0.12,
      detectionAccuracy: 0.94,
      trendChange: 0.08
    }

    setMetrics(mockMetrics)
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-purple-100 text-purple-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      false_positive: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      traffic: '🚗',
      energy: '⚡',
      service: '🏥',
      citizen_behavior: '👥',
      infrastructure: '🏗️'
    }
    return icons[type as keyof typeof icons] || '📊'
  }

  const filteredAnomalies = anomalies.filter(anomaly => {
    const typeMatch = selectedType === 'all' || anomaly.type === selectedType
    const severityMatch = selectedSeverity === 'all' || anomaly.severity === selectedSeverity
    return typeMatch && severityMatch
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detecção de Anomalias</h1>
          <p className="text-gray-600 mt-1">Monitoramento e análise de padrões anômalos em tempo real</p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Última Hora</option>
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Tipos</option>
            <option value="traffic">Tráfego</option>
            <option value="energy">Energia</option>
            <option value="service">Serviços</option>
            <option value="citizen_behavior">Comportamento</option>
            <option value="infrastructure">Infraestrutura</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas Severidades</option>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Anomalias</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalAnomalies}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">+{(metrics.trendChange * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Críticas</p>
              <p className="text-2xl font-bold text-red-600">{metrics.criticalAnomalies}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {((metrics.criticalAnomalies / metrics.totalAnomalies) * 100).toFixed(1)}% do total
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Resolução</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.avgResolutionTime}h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Média</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Acurácia</p>
              <p className="text-2xl font-bold text-green-600">{(metrics.detectionAccuracy * 100).toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Detecção</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Falsos Positivos</p>
              <p className="text-2xl font-bold text-orange-600">{(metrics.falsePositiveRate * 100).toFixed(1)}%</p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Taxa</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Localizações</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(anomalies.map(a => a.location)).size}</p>
            </div>
            <MapPin className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Únicas</span>
          </div>
        </div>
      </div>

      {/* Lista de Anomalias */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Anomalias Detectadas ({filteredAnomalies.length})
          </h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {filteredAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getTypeIcon(anomaly.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{anomaly.description}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(anomaly.status)}`}>
                          {anomaly.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Local:</span> {anomaly.location}
                        </div>
                        <div>
                          <span className="font-medium">Categoria:</span> {anomaly.category}
                        </div>
                        <div>
                          <span className="font-medium">Confiança:</span> {(anomaly.confidence * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Esperado:</span> {anomaly.expectedValue}
                        </div>
                        <div>
                          <span className="font-medium">Real:</span> {anomaly.actualValue}
                        </div>
                        <div>
                          <span className="font-medium">Desvio:</span>
                          <span className={`ml-1 ${anomaly.deviation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Impacto:</span>
                          <p className="text-gray-600">{anomaly.estimatedImpact}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Usuários Afetados:</span>
                          <p className="text-gray-600">{anomaly.affectedUsers.toLocaleString()}</p>
                        </div>
                      </div>

                      {anomaly.assignedTo && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-gray-700">Responsável:</span>
                          <span className="text-gray-600 ml-1">{anomaly.assignedTo}</span>
                        </div>
                      )}

                      {anomaly.resolution && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium text-green-800">Resolução:</span>
                          <p className="text-green-700 mt-1">{anomaly.resolution}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <p>{new Date(anomaly.detectedAt).toLocaleDateString('pt-BR')}</p>
                    <p>{new Date(anomaly.detectedAt).toLocaleTimeString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Padrões Identificados */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Padrões Identificados</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{pattern.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    pattern.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                    pattern.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {pattern.trend === 'increasing' ? 'Aumentando' :
                     pattern.trend === 'decreasing' ? 'Diminuindo' : 'Estável'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3">{pattern.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frequência:</span>
                    <span className="font-medium">{(pattern.frequency * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Severidade Média:</span>
                    <span className="font-medium">{pattern.avgSeverity.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Padrão Temporal:</span>
                    <span className="font-medium">{pattern.timePattern}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-sm font-medium text-gray-700">Locais Comuns:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {pattern.commonLocations.map((location, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}