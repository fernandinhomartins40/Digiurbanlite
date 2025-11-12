'use client'

import React, { useState, useEffect } from 'react'
import { Lightbulb, TrendingUp, Users, MapPin, Clock, Star, ChevronDown, ChevronRight, Target, Zap, Award } from 'lucide-react'

interface Recommendation {
  id: string
  title: string
  description: string
  category: 'efficiency' | 'sustainability' | 'citizen_satisfaction' | 'cost_reduction' | 'service_quality'
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  impact: number
  effort: number
  timeframe: string
  department: string
  affectedCitizens: number
  estimatedSavings: number
  implementationSteps: string[]
  requiredResources: string[]
  metrics: string[]
  relatedData: string[]
  status: 'new' | 'under_review' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  createdAt: string
  aiReasoning: string
}

interface RecommendationMetrics {
  totalRecommendations: number
  implementedRecommendations: number
  avgConfidence: number
  totalSavings: number
  avgImpact: number
  byCategory: Record<string, number>
  byPriority: Record<string, number>
}

interface AIInsight {
  id: string
  type: 'trend' | 'correlation' | 'prediction' | 'optimization'
  title: string
  description: string
  confidence: number
  dataPoints: string[]
  visualization?: {
    type: 'chart' | 'heatmap' | 'graph'
    data: any
  }
}

export function RecommendationEngine() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [metrics, setMetrics] = useState<RecommendationMetrics>({
    totalRecommendations: 0,
    implementedRecommendations: 0,
    avgConfidence: 0,
    totalSavings: 0,
    avgImpact: 0,
    byCategory: {},
    byPriority: {}
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('confidence')
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRecommendations()
    loadInsights()
    loadMetrics()
  }, [selectedCategory, selectedPriority, selectedStatus, sortBy])

  const loadRecommendations = async () => {
    // Simulação de dados
    const mockRecommendations: Recommendation[] = [
      {
        id: '1',
        title: 'Implementar Semáforos Inteligentes na Av. Paulista',
        description: 'Sistema de semáforos adaptativos baseado em fluxo de tráfego em tempo real para reduzir congestionamentos.',
        category: 'efficiency',
        priority: 'high',
        confidence: 0.92,
        impact: 8.5,
        effort: 6,
        timeframe: '6-12 meses',
        department: 'Departamento de Trânsito',
        affectedCitizens: 50000,
        estimatedSavings: 2500000,
        implementationSteps: [
          'Análise de viabilidade técnica',
          'Aquisição de sensores IoT',
          'Instalação da infraestrutura',
          'Configuração do sistema IA',
          'Testes piloto',
          'Implementação completa'
        ],
        requiredResources: [
          '50 sensores de tráfego IoT',
          'Sistema central de IA',
          '10 engenheiros especializados',
          'R$ 3.2M em investimento inicial'
        ],
        metrics: [
          'Redução de tempo de viagem em 35%',
          'Diminuição de emissões de CO2 em 25%',
          'Economia de combustível de R$ 1.2M/ano'
        ],
        relatedData: [
          'Dados históricos de tráfego',
          'Padrões de mobilidade urbana',
          'Análise de poluição do ar'
        ],
        status: 'new',
        createdAt: '2024-01-15T10:30:00Z',
        aiReasoning: 'Baseado na análise de 2 anos de dados de tráfego, identificamos padrões de congestionamento recorrentes. A implementação de semáforos inteligentes pode otimizar o fluxo em até 35%, considerando os picos de 7h-9h e 17h-19h.'
      },
      {
        id: '2',
        title: 'Otimizar Coleta de Lixo com Rotas Dinâmicas',
        description: 'Algoritmo de otimização de rotas baseado em dados de enchimento de lixeiras e padrões de geração de resíduos.',
        category: 'cost_reduction',
        priority: 'medium',
        confidence: 0.87,
        impact: 7.2,
        effort: 4,
        timeframe: '3-6 meses',
        department: 'Limpeza Urbana',
        affectedCitizens: 120000,
        estimatedSavings: 1800000,
        implementationSteps: [
          'Instalação de sensores nas lixeiras',
          'Desenvolvimento do algoritmo de otimização',
          'Integração com sistema de GPS dos caminhões',
          'Treinamento das equipes',
          'Implementação gradual por região'
        ],
        requiredResources: [
          '500 sensores de nível IoT',
          'Plataforma de otimização de rotas',
          '5 analistas de dados',
          'R$ 800K em investimento inicial'
        ],
        metrics: [
          'Redução de 30% no combustível',
          'Economia de 25% no tempo de coleta',
          'Redução de 40% nas reclamações'
        ],
        relatedData: [
          'Histórico de coleta de lixo',
          'Dados de densidade populacional',
          'Padrões de geração de resíduos'
        ],
        status: 'under_review',
        createdAt: '2024-01-14T14:20:00Z',
        aiReasoning: 'Análise de eficiência operacional mostra que 35% das coletas são realizadas em lixeiras com menos de 60% da capacidade. Otimização pode reduzir custos operacionais em R$ 1.8M anuais.'
      },
      {
        id: '3',
        title: 'Previsão de Demanda para Postos de Saúde',
        description: 'Sistema preditivo para antecipação de demanda em UBS baseado em dados históricos, sazonalidade e eventos.',
        category: 'service_quality',
        priority: 'critical',
        confidence: 0.94,
        impact: 9.1,
        effort: 5,
        timeframe: '4-8 meses',
        department: 'Secretaria de Saúde',
        affectedCitizens: 80000,
        estimatedSavings: 3200000,
        implementationSteps: [
          'Coleta e estruturação de dados históricos',
          'Desenvolvimento do modelo preditivo',
          'Criação do dashboard de gestão',
          'Piloto em 5 UBS',
          'Expansão para toda a rede'
        ],
        requiredResources: [
          'Cientistas de dados especializados',
          'Sistema de BI avançado',
          'Integração com sistemas existentes',
          'R$ 1.5M em desenvolvimento'
        ],
        metrics: [
          'Redução de 50% no tempo de espera',
          'Aumento de 30% na satisfação',
          'Otimização de 40% dos recursos'
        ],
        relatedData: [
          'Histórico de atendimentos',
          'Dados epidemiológicos',
          'Padrões sazonais de doenças'
        ],
        status: 'approved',
        createdAt: '2024-01-13T09:15:00Z',
        aiReasoning: 'Correlação forte entre fatores climáticos, eventos locais e demanda por atendimento. Modelo de ML com 94% de acurácia pode prever picos de demanda com 2 semanas de antecedência.'
      }
    ]

    setRecommendations(mockRecommendations)
    setIsLoading(false)
  }

  const loadInsights = async () => {
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'trend',
        title: 'Crescimento de 15% na Demanda por Transporte Público',
        description: 'Análise temporal indica tendência crescente no uso de transporte público, especialmente nas rotas Centro-Zona Sul.',
        confidence: 0.89,
        dataPoints: ['Dados de bilhetagem', 'GPS dos ônibus', 'Pesquisa de satisfação']
      },
      {
        id: '2',
        type: 'correlation',
        title: 'Correlação Entre Qualidade do Ar e Consultas Médicas',
        description: 'Identificada correlação de 0.78 entre índices de poluição e aumento de consultas respiratórias.',
        confidence: 0.91,
        dataPoints: ['Monitor de qualidade do ar', 'Registros médicos', 'Dados meteorológicos']
      },
      {
        id: '3',
        type: 'optimization',
        title: 'Oportunidade de Economia Energética em 23%',
        description: 'Prédios públicos apresentam potencial de redução no consumo através de automação inteligente.',
        confidence: 0.85,
        dataPoints: ['Consumo energético histórico', 'Padrões de ocupação', 'Dados de sensores']
      }
    ]

    setInsights(mockInsights)
  }

  const loadMetrics = async () => {
    const mockMetrics: RecommendationMetrics = {
      totalRecommendations: 47,
      implementedRecommendations: 23,
      avgConfidence: 0.88,
      totalSavings: 12500000,
      avgImpact: 7.8,
      byCategory: {
        efficiency: 15,
        sustainability: 12,
        citizen_satisfaction: 8,
        cost_reduction: 7,
        service_quality: 5
      },
      byPriority: {
        critical: 8,
        high: 15,
        medium: 18,
        low: 6
      }
    }

    setMetrics(mockMetrics)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      efficiency: 'bg-blue-100 text-blue-800 border-blue-200',
      sustainability: 'bg-green-100 text-green-800 border-green-200',
      citizen_satisfaction: 'bg-purple-100 text-purple-800 border-purple-200',
      cost_reduction: 'bg-orange-100 text-orange-800 border-orange-200',
      service_quality: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      efficiency: 'Eficiência',
      sustainability: 'Sustentabilidade',
      citizen_satisfaction: 'Satisfação do Cidadão',
      cost_reduction: 'Redução de Custos',
      service_quality: 'Qualidade do Serviço'
    }
    return labels[category as keyof typeof labels] || category
  }

  const filteredRecommendations = recommendations
    .filter(rec => {
      const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory
      const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority
      const statusMatch = selectedStatus === 'all' || rec.status === selectedStatus
      return categoryMatch && priorityMatch && statusMatch
    })
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence
      if (sortBy === 'impact') return b.impact - a.impact
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Recomendações</h1>
          <p className="text-gray-600 mt-1">Sugestões inteligentes para otimização municipal baseadas em IA</p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas Categorias</option>
            <option value="efficiency">Eficiência</option>
            <option value="sustainability">Sustentabilidade</option>
            <option value="citizen_satisfaction">Satisfação do Cidadão</option>
            <option value="cost_reduction">Redução de Custos</option>
            <option value="service_quality">Qualidade do Serviço</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas Prioridades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="confidence">Confiança</option>
            <option value="impact">Impacto</option>
            <option value="priority">Prioridade</option>
            <option value="date">Data</option>
          </select>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Recomendações</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalRecommendations}</p>
            </div>
            <Lightbulb className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">{filteredRecommendations.length} filtradas</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Implementadas</p>
              <p className="text-2xl font-bold text-green-600">{metrics.implementedRecommendations}</p>
            </div>
            <Award className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">
              {((metrics.implementedRecommendations / metrics.totalRecommendations) * 100).toFixed(1)}% taxa de sucesso
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confiança Média</p>
              <p className="text-2xl font-bold text-purple-600">{(metrics.avgConfidence * 100).toFixed(1)}%</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Alta precisão</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Economia Estimada</p>
              <p className="text-2xl font-bold text-orange-600">R$ {(metrics.totalSavings / 1000000).toFixed(1)}M</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Por ano</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Impacto Médio</p>
              <p className="text-2xl font-bold text-indigo-600">{metrics.avgImpact.toFixed(1)}/10</p>
            </div>
            <Zap className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Potencial</span>
          </div>
        </div>
      </div>

      {/* Insights da IA */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Insights da IA</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight) => (
              <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${
                    insight.type === 'trend' ? 'bg-blue-500' :
                    insight.type === 'correlation' ? 'bg-green-500' :
                    insight.type === 'prediction' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-500 capitalize">{insight.type}</span>
                  <span className="text-sm text-gray-400">({(insight.confidence * 100).toFixed(0)}%)</span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{insight.description}</p>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-500">Fontes de Dados:</span>
                  {insight.dataPoints.map((point, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Recomendações */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recomendações ({filteredRecommendations.length})
          </h2>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {filteredRecommendations.map((recommendation) => (
              <div key={recommendation.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{recommendation.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryColor(recommendation.category)}`}>
                        {getCategoryLabel(recommendation.category)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(recommendation.priority)}`}>
                        {recommendation.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(recommendation.status)}`}>
                        {recommendation.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{recommendation.description}</p>
                  </div>

                  <button
                    onClick={() => setExpandedRecommendation(
                      expandedRecommendation === recommendation.id ? null : recommendation.id
                    )}
                    className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedRecommendation === recommendation.id ? <ChevronDown /> : <ChevronRight />}
                  </button>
                </div>

                {/* Métricas Principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Confiança</p>
                    <p className="text-lg font-semibold text-blue-600">{(recommendation.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Impacto</p>
                    <p className="text-lg font-semibold text-green-600">{recommendation.impact.toFixed(1)}/10</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Cidadãos</p>
                    <p className="text-lg font-semibold text-purple-600">{recommendation.affectedCitizens.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Economia</p>
                    <p className="text-lg font-semibold text-orange-600">R$ {(recommendation.estimatedSavings / 1000000).toFixed(1)}M</p>
                  </div>
                </div>

                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Departamento:</span>
                    <p className="text-gray-600">{recommendation.department}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Prazo:</span>
                    <p className="text-gray-600">{recommendation.timeframe}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Esforço:</span>
                    <div className="flex items-center">
                      <div className="flex space-x-1 mr-2">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < recommendation.effort ? 'bg-orange-500' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-600">{recommendation.effort}/10</span>
                    </div>
                  </div>
                </div>

                {/* Detalhes Expandidos */}
                {expandedRecommendation === recommendation.id && (
                  <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
                    {/* Raciocínio da IA */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Análise da IA
                      </h4>
                      <p className="text-blue-800 text-sm">{recommendation.aiReasoning}</p>
                    </div>

                    {/* Passos de Implementação */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Passos de Implementação:</h4>
                      <div className="space-y-2">
                        {recommendation.implementationSteps.map((step, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                              {index + 1}
                            </div>
                            <span className="text-gray-700">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recursos Necessários */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Recursos Necessários:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {recommendation.requiredResources.map((resource, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                            {resource}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Métricas de Sucesso */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Métricas de Sucesso:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recommendation.metrics.map((metric, index) => (
                          <div key={index} className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                            <Star className="w-4 h-4 text-green-600 mb-1" />
                            <p className="text-green-800">{metric}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dados Relacionados */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Dados Utilizados:</h4>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.relatedData.map((data, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {data}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}