'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Brain,
  Settings,
  Save,
  TestTube,
  Play,
  Database,
  Target,
  Zap,
  AlertTriangle,
  Calendar,
  BarChart3
} from 'lucide-react'

interface ModelConfiguration {
  id?: string
  name: string
  description: string
  type: 'demand_forecast' | 'trend_analysis' | 'anomaly_detection' | 'recommendation'
  algorithm: 'linear_regression' | 'random_forest' | 'neural_network' | 'time_series' | 'clustering'
  dataSource: {
    tables: string[]
    fields: string[]
    dateRange: number // days
    filters: Array<{ field: string; operator: string; value: string }>
  }
  parameters: {
    learningRate?: number
    epochs?: number
    batchSize?: number
    testSplit?: number
    validationSplit?: number
    confidence?: number
    sensitivity?: number
  }
  schedule: {
    enabled: boolean
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
    time?: string
    autoRetrain: boolean
    retrainThreshold?: number
  }
  alerts: {
    accuracyThreshold: number
    confidenceThreshold: number
    anomalyThreshold: number
    recipients: string[]
  }
}

interface ModelConfigProps {
  modelConfig?: ModelConfiguration
  onSave?: (config: ModelConfiguration) => void
  onTest?: (config: ModelConfiguration) => void
  onCancel?: () => void
  className?: string
}

export function ModelConfig({
  modelConfig,
  onSave,
  onTest,
  onCancel,
  className
}: ModelConfigProps) {
  const [config, setConfig] = useState<ModelConfiguration>(modelConfig || {
    name: '',
    description: '',
    type: 'demand_forecast',
    algorithm: 'linear_regression',
    dataSource: {
      tables: [],
      fields: [],
      dateRange: 90,
      filters: []
    },
    parameters: {
      learningRate: 0.01,
      epochs: 100,
      batchSize: 32,
      testSplit: 0.2,
      validationSplit: 0.1,
      confidence: 0.8,
      sensitivity: 0.5
    },
    schedule: {
      enabled: false,
      frequency: 'daily',
      autoRetrain: true,
      retrainThreshold: 0.8
    },
    alerts: {
      accuracyThreshold: 80,
      confidenceThreshold: 75,
      anomalyThreshold: 90,
      recipients: []
    }
  })

  const [testResults, setTestResults] = useState<any>(null)
  const [isTestLoading, setIsTestLoading] = useState(false)

  // Available data sources
  const availableTables = [
    'protocols',
    'citizens',
    'departments',
    'employees',
    'evaluations',
    'protocol_history',
    'feedback'
  ]

  const availableFields = {
    protocols: ['id', 'title', 'status', 'department_id', 'created_at', 'resolved_at', 'priority'],
    citizens: ['id', 'name', 'email', 'created_at', 'last_login'],
    departments: ['id', 'name', 'employee_count', 'avg_resolution_time'],
    employees: ['id', 'name', 'department_id', 'role', 'performance_score'],
    evaluations: ['id', 'protocol_id', 'score', 'comment', 'created_at']
  }

  const algorithmOptions = {
    demand_forecast: [
      { value: 'linear_regression', label: 'Regressão Linear' },
      { value: 'random_forest', label: 'Random Forest' },
      { value: 'time_series', label: 'Séries Temporais' },
      { value: 'neural_network', label: 'Rede Neural' }
    ],
    trend_analysis: [
      { value: 'linear_regression', label: 'Regressão Linear' },
      { value: 'time_series', label: 'Séries Temporais' },
      { value: 'neural_network', label: 'Rede Neural' }
    ],
    anomaly_detection: [
      { value: 'clustering', label: 'Clustering' },
      { value: 'neural_network', label: 'Autoencoder' },
      { value: 'random_forest', label: 'Isolation Forest' }
    ],
    recommendation: [
      { value: 'random_forest', label: 'Random Forest' },
      { value: 'neural_network', label: 'Rede Neural' },
      { value: 'clustering', label: 'Clustering' }
    ]
  }

  const updateConfig = (updates: Partial<ModelConfiguration>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const updateDataSource = (updates: Partial<ModelConfiguration['dataSource']>) => {
    setConfig(prev => ({
      ...prev,
      dataSource: { ...prev.dataSource, ...updates }
    }))
  }

  const updateParameters = (updates: Partial<ModelConfiguration['parameters']>) => {
    setConfig(prev => ({
      ...prev,
      parameters: { ...prev.parameters, ...updates }
    }))
  }

  const updateSchedule = (updates: Partial<ModelConfiguration['schedule']>) => {
    setConfig(prev => ({
      ...prev,
      schedule: { ...prev.schedule, ...updates }
    }))
  }

  const updateAlerts = (updates: Partial<ModelConfiguration['alerts']>) => {
    setConfig(prev => ({
      ...prev,
      alerts: { ...prev.alerts, ...updates }
    }))
  }

  const addFilter = () => {
    updateDataSource({
      filters: [
        ...config.dataSource.filters,
        { field: '', operator: 'equals', value: '' }
      ]
    })
  }

  const removeFilter = (index: number) => {
    updateDataSource({
      filters: config.dataSource.filters.filter((_, i) => i !== index)
    })
  }

  const updateFilter = (index: number, updates: Partial<{ field: string; operator: string; value: string }>) => {
    updateDataSource({
      filters: config.dataSource.filters.map((filter, i) =>
        i === index ? { ...filter, ...updates } : filter
      )
    })
  }

  const handleTest = async () => {
    setIsTestLoading(true)
    try {
      // Simulate model testing
      await new Promise(resolve => setTimeout(resolve, 3000))

      setTestResults({
        accuracy: 85.2 + Math.random() * 10,
        confidence: 78.5 + Math.random() * 15,
        processingTime: 1.2 + Math.random() * 2,
        dataPoints: Math.floor(10000 + Math.random() * 50000),
        predictions: Math.floor(50 + Math.random() * 200)
      })

      if (onTest) {
        onTest(config)
      }
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsTestLoading(false)
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(config)
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
        return 'Sistema de Recomendação'
      default:
        return type
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {config.id ? 'Editar Modelo ML' : 'Novo Modelo ML'}
          </h2>
          <p className="text-muted-foreground">
            Configure algoritmos de machine learning para análises preditivas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button variant="outline" onClick={handleTest} disabled={isTestLoading}>
            <TestTube className="h-4 w-4 mr-2" />
            {isTestLoading ? 'Testando...' : 'Testar Modelo'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Configuração Básica</TabsTrigger>
          <TabsTrigger value="data">Fonte de Dados</TabsTrigger>
          <TabsTrigger value="algorithm">Algoritmo</TabsTrigger>
          <TabsTrigger value="schedule">Agendamento</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Nome do Modelo *</Label>
                  <Input
                    id="model-name"
                    placeholder="Ex: Previsão de Demanda Mensal"
                    value={config.name}
                    onChange={(e) => updateConfig({ name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-type">Tipo de Modelo</Label>
                  <Select
                    value={config.type}
                    onValueChange={(value: any) => updateConfig({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demand_forecast">Previsão de Demanda</SelectItem>
                      <SelectItem value="trend_analysis">Análise de Tendência</SelectItem>
                      <SelectItem value="anomaly_detection">Detecção de Anomalias</SelectItem>
                      <SelectItem value="recommendation">Sistema de Recomendação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-description">Descrição</Label>
                <Textarea
                  id="model-description"
                  placeholder="Descreva o objetivo e funcionamento do modelo..."
                  value={config.description}
                  onChange={(e) => updateConfig({ description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="algorithm">Algoritmo</Label>
                <Select
                  value={config.algorithm}
                  onValueChange={(value: any) => updateConfig({ algorithm: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {algorithmOptions[config.type]?.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span>Resultados do Teste</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{testResults.accuracy.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Precisão</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{testResults.confidence.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Confiança</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{testResults.processingTime.toFixed(1)}s</div>
                    <div className="text-sm text-muted-foreground">Tempo Proc.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{testResults.dataPoints.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Dados Treino</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{testResults.predictions}</div>
                    <div className="text-sm text-muted-foreground">Previsões</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Configuração da Fonte de Dados</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tabelas de Origem</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableTables.map(table => (
                    <div key={table} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={table}
                        checked={config.dataSource.tables.includes(table)}
                        onChange={(e) => {
                          const tables = e.target.checked
                            ? [...config.dataSource.tables, table]
                            : config.dataSource.tables.filter(t => t !== table)
                          updateDataSource({ tables })
                        }}
                      />
                      <label htmlFor={table} className="text-sm">{table}</label>
                    </div>
                  ))}
                </div>
              </div>

              {config.dataSource.tables.length > 0 && (
                <div className="space-y-2">
                  <Label>Campos Selecionados</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {config.dataSource.tables.flatMap(table =>
                      (availableFields[table as keyof typeof availableFields] || []).map(field => (
                        <div key={`${table}.${field}`} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${table}.${field}`}
                            checked={config.dataSource.fields.includes(`${table}.${field}`)}
                            onChange={(e) => {
                              const fullField = `${table}.${field}`
                              const fields = e.target.checked
                                ? [...config.dataSource.fields, fullField]
                                : config.dataSource.fields.filter(f => f !== fullField)
                              updateDataSource({ fields })
                            }}
                          />
                          <label htmlFor={`${table}.${field}`} className="text-xs">
                            {table}.{field}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Período dos Dados (dias)</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[config.dataSource.dateRange]}
                    onValueChange={([value]) => updateDataSource({ dateRange: value })}
                    min={7}
                    max={365}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16">{config.dataSource.dateRange} dias</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Filtros de Dados</Label>
                  <Button variant="outline" size="sm" onClick={addFilter}>
                    Adicionar Filtro
                  </Button>
                </div>

                {config.dataSource.filters.map((filter, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs">Campo</Label>
                      <Input
                        placeholder="Campo"
                        value={filter.field}
                        onChange={(e) => updateFilter(index, { field: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Operador</Label>
                      <Select
                        value={filter.operator}
                        onValueChange={(value) => updateFilter(index, { operator: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Igual</SelectItem>
                          <SelectItem value="not_equals">Diferente</SelectItem>
                          <SelectItem value="greater">Maior que</SelectItem>
                          <SelectItem value="less">Menor que</SelectItem>
                          <SelectItem value="contains">Contém</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Valor</Label>
                      <Input
                        placeholder="Valor"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFilter(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="algorithm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Parâmetros do Algoritmo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Common Parameters */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Divisão dos Dados para Teste (%)</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[config.parameters.testSplit! * 100]}
                      onValueChange={([value]) => updateParameters({ testSplit: value / 100 })}
                      min={10}
                      max={40}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{(config.parameters.testSplit! * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Divisão dos Dados para Validação (%)</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[config.parameters.validationSplit! * 100]}
                      onValueChange={([value]) => updateParameters({ validationSplit: value / 100 })}
                      min={5}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{(config.parameters.validationSplit! * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Limiar de Confiança (%)</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[config.parameters.confidence! * 100]}
                      onValueChange={([value]) => updateParameters({ confidence: value / 100 })}
                      min={50}
                      max={95}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{(config.parameters.confidence! * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Algorithm-specific parameters */}
              {(config.algorithm === 'neural_network') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Parâmetros de Rede Neural</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Taxa de Aprendizado</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={config.parameters.learningRate}
                        onChange={(e) => updateParameters({ learningRate: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Épocas</Label>
                      <Input
                        type="number"
                        value={config.parameters.epochs}
                        onChange={(e) => updateParameters({ epochs: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tamanho do Batch</Label>
                      <Input
                        type="number"
                        value={config.parameters.batchSize}
                        onChange={(e) => updateParameters({ batchSize: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {config.type === 'anomaly_detection' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Parâmetros de Detecção de Anomalias</h3>

                  <div className="space-y-2">
                    <Label>Sensibilidade</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        value={[config.parameters.sensitivity! * 100]}
                        onValueChange={([value]) => updateParameters({ sensitivity: value / 100 })}
                        min={10}
                        max={90}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">{(config.parameters.sensitivity! * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maior sensibilidade detecta mais anomalias, mas pode gerar falsos positivos
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Agendamento e Retreinamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="schedule-enabled"
                  checked={config.schedule.enabled}
                  onCheckedChange={(checked) => updateSchedule({ enabled: checked })}
                />
                <Label htmlFor="schedule-enabled">Execução automática habilitada</Label>
              </div>

              {config.schedule.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select
                        value={config.schedule.frequency}
                        onValueChange={(value: any) => updateSchedule({ frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">De hora em hora</SelectItem>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Input
                        type="time"
                        value={config.schedule.time || '09:00'}
                        onChange={(e) => updateSchedule({ time: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-retrain"
                        checked={config.schedule.autoRetrain}
                        onCheckedChange={(checked) => updateSchedule({ autoRetrain: checked })}
                      />
                      <Label htmlFor="auto-retrain">Retreinamento automático</Label>
                    </div>

                    {config.schedule.autoRetrain && (
                      <div className="space-y-2">
                        <Label>Limiar para Retreinamento (% precisão)</Label>
                        <div className="flex items-center space-x-4">
                          <Slider
                            value={[config.schedule.retrainThreshold! * 100]}
                            onValueChange={([value]) => updateSchedule({ retrainThreshold: value / 100 })}
                            min={60}
                            max={90}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12">{(config.schedule.retrainThreshold! * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          O modelo será retreinado automaticamente se a precisão cair abaixo deste valor
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Configuração de Alertas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Limiar de Precisão para Alerta (%)</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[config.alerts.accuracyThreshold]}
                      onValueChange={([value]) => updateAlerts({ accuracyThreshold: value })}
                      min={50}
                      max={95}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{config.alerts.accuracyThreshold}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Limiar de Confiança para Alerta (%)</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[config.alerts.confidenceThreshold]}
                      onValueChange={([value]) => updateAlerts({ confidenceThreshold: value })}
                      min={50}
                      max={95}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{config.alerts.confidenceThreshold}%</span>
                  </div>
                </div>

                {config.type === 'anomaly_detection' && (
                  <div className="space-y-2">
                    <Label>Limiar de Anomalia para Alerta (%)</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        value={[config.alerts.anomalyThreshold]}
                        onValueChange={([value]) => updateAlerts({ anomalyThreshold: value })}
                        min={70}
                        max={99}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">{config.alerts.anomalyThreshold}%</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Destinatários de Alertas</Label>
                  <Textarea
                    placeholder="admin@exemplo.com, ml-team@exemplo.com"
                    value={config.alerts.recipients.join(', ')}
                    onChange={(e) => updateAlerts({
                      recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                    })}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}