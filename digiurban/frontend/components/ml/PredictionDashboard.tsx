'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Activity,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCcw,
  Eye,
  Download
} from 'lucide-react'
import { KPICard } from '../analytics/KPICard'
import { AnalyticsLineChart, AnalyticsBarChart, AnalyticsPieChart, AnalyticsAreaChart } from '../analytics/Charts'

interface PredictionModel {
  id: string
  name: string
  description: string
  type: 'demand_forecast' | 'trend_analysis' | 'anomaly_detection' | 'recommendation'
  status: 'active' | 'training' | 'inactive' | 'error'
  accuracy: number
  confidence: number
  lastTrained: string
  nextUpdate: string
  dataPoints: number
  predictions: number
}

interface Prediction {
  id: string
  modelId: string
  type: 'demand' | 'trend' | 'anomaly' | 'recommendation'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  timeframe: string
  predictedValue: number
  currentValue?: number
  accuracy?: number
  status: 'pending' | 'validated' | 'dismissed'
  createdAt: string
  targetDate: string
}

interface MLMetrics {
  totalModels: number
  activeModels: number
  averageAccuracy: number
  totalPredictions: number
  validatedPredictions: number
  anomaliesDetected: number
}

export function PredictionDashboard({ className }: { className?: string }) {
  const [metrics, setMetrics] = useState<MLMetrics>({
    totalModels: 8,
    activeModels: 6,
    averageAccuracy: 87.3,
    totalPredictions: 245,
    validatedPredictions: 189,
    anomaliesDetected: 12
  })

  const [models, setModels] = useState<PredictionModel[]>([
    {
      id: '1',
      name: 'Previsão de Demanda de Protocolos',
      description: 'Prevê o volume de protocolos para os próximos 30 dias',
      type: 'demand_forecast',
      status: 'active',
      accuracy: 89.2,
      confidence: 85.4,
      lastTrained: '2024-01-15T08:00:00Z',
      nextUpdate: '2024-01-22T08:00:00Z',
      dataPoints: 125000,
      predictions: 30
    },
    {
      id: '2',
      name: 'Análise de Tendência de Satisfação',
      description: 'Identifica padrões de satisfação dos cidadãos',
      type: 'trend_analysis',
      status: 'active',
      accuracy: 82.7,
      confidence: 78.9,
      lastTrained: '2024-01-14T10:00:00Z',
      nextUpdate: '2024-01-21T10:00:00Z',
      dataPoints: 89000,
      predictions: 15
    },
    {
      id: '3',
      name: 'Detecção de Anomalias Operacionais',
      description: 'Detecta comportamentos anômalos no sistema',
      type: 'anomaly_detection',
      status: 'training',
      accuracy: 94.1,
      confidence: 91.2,
      lastTrained: '2024-01-13T06:00:00Z',
      nextUpdate: '2024-01-16T06:00:00Z',
      dataPoints: 250000,
      predictions: 8
    },
    {
      id: '4',
      name: 'Recomendações de Melhoria',
      description: 'Sugere melhorias baseadas em dados históricos',
      type: 'recommendation',
      status: 'active',
      accuracy: 76.8,
      confidence: 72.3,
      lastTrained: '2024-01-12T12:00:00Z',
      nextUpdate: '2024-01-19T12:00:00Z',
      dataPoints: 156000,
      predictions: 22
    }
  ])

  const [predictions, setPredictions] = useState<Prediction[]>([
    {
      id: '1',
      modelId: '1',
      type: 'demand',
      title: 'Aumento de 35% na demanda de protocolos',
      description: 'Previsto aumento significativo nos próximos 7 dias devido ao início do mês',
      confidence: 89.2,
      impact: 'high',
      timeframe: 'Próximos 7 dias',
      predictedValue: 1350,
      currentValue: 1000,
      status: 'pending',
      createdAt: '2024-01-15T10:00:00Z',
      targetDate: '2024-01-22T00:00:00Z'
    },
    {
      id: '2',
      modelId: '3',
      type: 'anomaly',
      title: 'Pico incomum de protocolos às 14h',
      description: 'Detectado padrão anômalo de criação de protocolos no período vespertino',
      confidence: 94.1,
      impact: 'medium',
      timeframe: 'Últimas 3 horas',
      predictedValue: 0,
      status: 'validated',
      createdAt: '2024-01-15T14:30:00Z',
      targetDate: '2024-01-15T17:00:00Z'
    },
    {
      id: '3',
      modelId: '4',
      type: 'recommendation',
      title: 'Otimizar equipe do Departamento de Obras',
      description: 'Realocação de 2 funcionários pode reduzir tempo médio de resolução em 15%',
      confidence: 76.8,
      impact: 'medium',
      timeframe: 'Implementação imediata',
      predictedValue: 0,
      status: 'pending',
      createdAt: '2024-01-15T09:15:00Z',
      targetDate: '2024-01-16T00:00:00Z'
    }
  ])

  const [loading, setLoading] = useState(false)

  const getModelStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="h-4 w-4 text-green-600" />
      case 'training':
        return <RefreshCcw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'inactive':
        return <Pause className="h-4 w-4 text-gray-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Brain className="h-4 w-4 text-gray-600" />
    }
  }

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'training':
        return 'bg-blue-100 text-blue-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'demand':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'trend':
        return <BarChart3 className="h-4 w-4 text-green-600" />
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'recommendation':
        return <Target className="h-4 w-4 text-purple-600" />
      default:
        return <Brain className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'demand_forecast':
        return 'Previsão de Demanda'
      case 'trend_analysis':
        return 'Análise de Tendência'
      case 'anomaly_detection':
        return 'Detecção de Anomalias'
      case 'recommendation':
        return 'Recomendações'
      default:
        return type
    }
  }

  // Mock data para gráficos
  const accuracyTrend = [
    { month: 'Set', accuracy: 82.5, predictions: 45 },
    { month: 'Out', accuracy: 85.1, predictions: 52 },
    { month: 'Nov', accuracy: 87.8, predictions: 61 },
    { month: 'Dez', accuracy: 89.2, predictions: 58 },
    { month: 'Jan', accuracy: 87.3, predictions: 69 }
  ]

  const modelDistribution = [
    { name: 'Demanda', value: 35 },
    { name: 'Tendências', value: 25 },
    { name: 'Anomalias', value: 20 },
    { name: 'Recomendações', value: 20 }
  ]

  const predictionAccuracy = [
    { model: 'Demanda', accuracy: 89.2, predictions: 245 },
    { model: 'Tendências', accuracy: 82.7, predictions: 189 },
    { model: 'Anomalias', accuracy: 94.1, predictions: 156 },
    { model: 'Recomendações', accuracy: 76.8, predictions: 203 }
  ]

  const handleModelAction = (modelId: string, action: 'start' | 'pause' | 'retrain') => {
    setModels(prev => prev.map(model =>
      model.id === modelId
        ? { ...model, status: action === 'start' ? 'active' : action === 'pause' ? 'inactive' : 'training' }
        : model
    ))
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sistema de Previsões e ML</h1>
          <p className="text-muted-foreground">
            Machine Learning e análises preditivas para tomada de decisão
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar Modelos
          </Button>
        </div>
      </div>

      {/* KPIs de ML */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Modelos Ativos"
          value={metrics.activeModels}
          description={`de ${metrics.totalModels} modelos total`}
          status="good"
        />

        <KPICard
          title="Precisão Média"
          value={metrics.averageAccuracy}
          unit="%"
          target={85}
          warning={80}
          critical={75}
          status={metrics.averageAccuracy >= 85 ? 'good' :
                   metrics.averageAccuracy >= 80 ? 'warning' : 'critical'}
          trend="up"
          trendValue={2.1}
          description="Precisão dos modelos ativos"
        />

        <KPICard
          title="Previsões Validadas"
          value={metrics.validatedPredictions}
          description={`de ${metrics.totalPredictions} previsões`}
          status="good"
        />

        <KPICard
          title="Anomalias Detectadas"
          value={metrics.anomaliesDetected}
          status={metrics.anomaliesDetected === 0 ? 'good' :
                   metrics.anomaliesDetected <= 5 ? 'warning' : 'critical'}
          trend="down"
          trendValue={-15.3}
          description="Últimos 7 dias"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="models">Modelos ML</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="analytics">Analytics ML</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Evolução da Precisão */}
            <AnalyticsLineChart
              title="Evolução da Precisão dos Modelos"
              data={accuracyTrend}
              xKey="month"
              yKey={["accuracy"]}
              colors={["#10B981"]}
              height={300}
            />

            {/* Distribuição por Tipo */}
            <AnalyticsPieChart
              title="Distribuição de Modelos por Tipo"
              data={modelDistribution}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          </div>

          {/* Previsões Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <span>Previsões Mais Recentes</span>
                <Badge variant="secondary">{predictions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions.slice(0, 3).map(prediction => (
                  <div key={prediction.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      {getTypeIcon(prediction.type)}
                      <div>
                        <h3 className="font-medium">{prediction.title}</h3>
                        <p className="text-sm text-muted-foreground">{prediction.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getImpactColor(prediction.impact)}>
                            {prediction.impact.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Confiança: {prediction.confidence}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {prediction.timeframe}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {prediction.status === 'pending' && (
                        <Button size="sm">
                          Validar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status dos Modelos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['active', 'training', 'inactive', 'error'].map((status, index) => {
              const count = models.filter(m => m.status === status).length
              return (
                <Card key={status} className="text-center">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-center space-x-2">
                      {getModelStatusIcon(status)}
                      <span className="capitalize">{status === 'active' ? 'Ativos' :
                                                    status === 'training' ? 'Treinando' :
                                                    status === 'inactive' ? 'Inativos' : 'Com Erro'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-sm text-muted-foreground">modelos</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modelos de Machine Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map(model => (
                  <div key={model.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{model.name}</h3>
                          <Badge className={getModelStatusColor(model.status)}>
                            {model.status === 'active' ? 'Ativo' :
                             model.status === 'training' ? 'Treinando' :
                             model.status === 'inactive' ? 'Inativo' : 'Erro'}
                          </Badge>
                          <Badge variant="outline">{getTypeLabel(model.type)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{model.description}</p>
                      </div>

                      <div className="flex items-center space-x-1">
                        {model.status === 'inactive' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModelAction(model.id, 'start')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {model.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModelAction(model.id, 'pause')}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModelAction(model.id, 'retrain')}
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{model.accuracy}%</div>
                        <div className="text-sm text-muted-foreground">Precisão</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{model.confidence}%</div>
                        <div className="text-sm text-muted-foreground">Confiança</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{model.dataPoints.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Dados Treino</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{model.predictions}</div>
                        <div className="text-sm text-muted-foreground">Previsões</div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
                      <span>Último treino: {new Date(model.lastTrained).toLocaleString('pt-BR')}</span>
                      <span>Próxima atualização: {new Date(model.nextUpdate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Previsões e Recomendações</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{predictions.filter(p => p.status === 'pending').length} pendentes</Badge>
                  <Badge variant="secondary">{predictions.filter(p => p.status === 'validated').length} validadas</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map(prediction => (
                  <div key={prediction.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        {getTypeIcon(prediction.type)}
                        <div className="space-y-1">
                          <h3 className="font-medium">{prediction.title}</h3>
                          <p className="text-sm text-muted-foreground">{prediction.description}</p>
                          <div className="flex items-center space-x-2">
                            <Badge className={getImpactColor(prediction.impact)}>
                              Impacto {prediction.impact.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {prediction.timeframe}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm">
                          <span className="font-medium">Confiança:</span>
                          <div className="text-lg font-bold text-blue-600">{prediction.confidence}%</div>
                        </div>
                      </div>
                    </div>

                    {prediction.type === 'demand' && prediction.currentValue && (
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-bold">{prediction.currentValue}</div>
                          <div className="text-sm text-muted-foreground">Valor Atual</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-600">{prediction.predictedValue}</div>
                          <div className="text-sm text-muted-foreground">Valor Previsto</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Criado em {new Date(prediction.createdAt).toLocaleString('pt-BR')} •
                        Alvo: {new Date(prediction.targetDate).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center space-x-2">
                        {prediction.status === 'pending' && (
                          <>
                            <Button variant="outline" size="sm">
                              Descartar
                            </Button>
                            <Button size="sm">
                              Validar
                            </Button>
                          </>
                        )}
                        {prediction.status === 'validated' && (
                          <Badge variant="default">Validada</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Precisão por Modelo */}
            <AnalyticsBarChart
              title="Precisão dos Modelos"
              data={predictionAccuracy}
              xKey="model"
              yKey="accuracy"
              colors={["#8B5CF6"]}
              height={300}
            />

            {/* Volume de Previsões */}
            <AnalyticsAreaChart
              title="Volume de Previsões Mensais"
              data={[
                { month: 'Set', volume: 145 },
                { month: 'Out', volume: 189 },
                { month: 'Nov', volume: 156 },
                { month: 'Dez', volume: 203 },
                { month: 'Jan', volume: 245 }
              ]}
              xKey="month"
              yKey="volume"
              colors={["#F59E0B"]}
              height={300}
            />
          </div>

          {/* Métricas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taxa de Acerto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">77.2%</div>
                <p className="text-sm text-muted-foreground">
                  Previsões validadas vs realizadas
                </p>
                <div className="mt-2">
                  <Progress value={77.2} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tempo Médio de Processamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">2.4s</div>
                <p className="text-sm text-muted-foreground">
                  Por previsão gerada
                </p>
                <Badge variant="secondary" className="mt-2">
                  -15% vs mês anterior
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Economia Gerada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">R$ 45.7K</div>
                <p className="text-sm text-muted-foreground">
                  Via otimizações sugeridas
                </p>
                <Badge variant="default" className="mt-2">
                  +23% vs trimestre anterior
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Log de Atividades ML */}
          <Card>
            <CardHeader>
              <CardTitle>Log de Atividades ML</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto text-sm font-mono">
                <div className="text-green-600">[10:45:32] Modelo "Demanda" executado - 30 previsões geradas</div>
                <div className="text-blue-600">[10:30:15] Iniciado retreinamento modelo "Anomalias"</div>
                <div className="text-purple-600">[10:15:20] Recomendação validada: Otimizar equipe Obras</div>
                <div className="text-red-600">[09:58:45] ALERTA: Anomalia detectada - Pico de protocolos</div>
                <div className="text-green-600">[09:30:00] Modelo "Tendências" atualizado com sucesso</div>
                <div className="text-yellow-600">[09:00:12] AVISO: Confiança do modelo "Recomendações" abaixo de 75%</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}