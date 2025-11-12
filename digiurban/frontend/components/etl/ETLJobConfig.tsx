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
import { Separator } from '@/components/ui/separator'
import {
  Database,
  Settings,
  Play,
  Save,
  TestTube,
  Calendar,
  Filter,
  ArrowRight,
  Plus,
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface DataSource {
  id: string
  name: string
  type: 'database' | 'api' | 'file' | 'csv' | 'json'
  connectionString?: string
  endpoint?: string
  path?: string
  tables?: string[]
  fields?: string[]
}

interface DataTransformation {
  id: string
  type: 'filter' | 'map' | 'aggregate' | 'join' | 'clean' | 'validate'
  name: string
  config: any
  enabled: boolean
}

interface ETLJobConfig {
  id?: string
  name: string
  description: string
  source: DataSource
  destination: DataSource
  transformations: DataTransformation[]
  schedule: {
    frequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly'
    time?: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  enabled: boolean
  retryPolicy: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
  notifications: {
    onSuccess: boolean
    onFailure: boolean
    recipients: string[]
  }
}

interface ETLJobConfigProps {
  jobConfig?: ETLJobConfig
  onSave?: (config: ETLJobConfig) => void
  onTest?: (config: ETLJobConfig) => void
  onCancel?: () => void
  className?: string
}

export function ETLJobConfig({
  jobConfig,
  onSave,
  onTest,
  onCancel,
  className
}: ETLJobConfigProps) {
  const [config, setConfig] = useState<ETLJobConfig>(jobConfig || {
    name: '',
    description: '',
    source: {
      id: '',
      name: '',
      type: 'database'
    },
    destination: {
      id: '',
      name: '',
      type: 'database'
    },
    transformations: [],
    schedule: {
      frequency: 'manual'
    },
    enabled: true,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 5,
      backoffMultiplier: 2
    },
    notifications: {
      onSuccess: false,
      onFailure: true,
      recipients: []
    }
  })

  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    recordCount?: number
  } | null>(null)
  const [isTestLoading, setIsTestLoading] = useState(false)

  // Available data sources
  const availableSources: DataSource[] = [
    {
      id: 'protocols_db',
      name: 'Base de Protocolos',
      type: 'database',
      connectionString: 'postgresql://localhost:5432/protocols',
      tables: ['protocols', 'protocol_history', 'protocol_attachments']
    },
    {
      id: 'citizens_db',
      name: 'Base de Cidadãos',
      type: 'database',
      connectionString: 'postgresql://localhost:5432/citizens',
      tables: ['citizens', 'evaluations', 'feedback']
    },
    {
      id: 'departments_api',
      name: 'API Departamentos',
      type: 'api',
      endpoint: 'https://api.digiurban.com/departments'
    },
    {
      id: 'external_csv',
      name: 'Arquivo CSV Externo',
      type: 'csv',
      path: '/data/imports/'
    }
  ]

  const updateConfig = (updates: Partial<ETLJobConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const updateSource = (updates: Partial<DataSource>) => {
    setConfig(prev => ({
      ...prev,
      source: { ...prev.source, ...updates }
    }))
  }

  const updateDestination = (updates: Partial<DataSource>) => {
    setConfig(prev => ({
      ...prev,
      destination: { ...prev.destination, ...updates }
    }))
  }

  const updateSchedule = (updates: Partial<ETLJobConfig['schedule']>) => {
    setConfig(prev => ({
      ...prev,
      schedule: { ...prev.schedule, ...updates }
    }))
  }

  const addTransformation = (type: DataTransformation['type']) => {
    const newTransformation: DataTransformation = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${config.transformations.length + 1}`,
      config: {},
      enabled: true
    }

    setConfig(prev => ({
      ...prev,
      transformations: [...prev.transformations, newTransformation]
    }))
  }

  const updateTransformation = (id: string, updates: Partial<DataTransformation>) => {
    setConfig(prev => ({
      ...prev,
      transformations: prev.transformations.map(t =>
        t.id === id ? { ...t, ...updates } : t
      )
    }))
  }

  const removeTransformation = (id: string) => {
    setConfig(prev => ({
      ...prev,
      transformations: prev.transformations.filter(t => t.id !== id)
    }))
  }

  const handleTest = async () => {
    setIsTestLoading(true)
    try {
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000))

      setTestResult({
        success: true,
        message: 'Conexão estabelecida com sucesso',
        recordCount: 1250
      })

      if (onTest) {
        onTest(config)
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Falha na conexão: Timeout de conexão com a fonte de dados'
      })
    } finally {
      setIsTestLoading(false)
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(config)
    }
  }

  const getTransformationIcon = (type: string) => {
    switch (type) {
      case 'filter':
        return <Filter className="h-4 w-4" />
      case 'map':
        return <ArrowRight className="h-4 w-4" />
      case 'aggregate':
        return <Database className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const getTransformationLabel = (type: string) => {
    switch (type) {
      case 'filter':
        return 'Filtro'
      case 'map':
        return 'Mapeamento'
      case 'aggregate':
        return 'Agregação'
      case 'join':
        return 'Junção'
      case 'clean':
        return 'Limpeza'
      case 'validate':
        return 'Validação'
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
            {config.id ? 'Editar Job ETL' : 'Novo Job ETL'}
          </h2>
          <p className="text-muted-foreground">
            Configure a extração, transformação e carga de dados
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
            {isTestLoading ? 'Testando...' : 'Testar'}
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
          <TabsTrigger value="source">Fonte de Dados</TabsTrigger>
          <TabsTrigger value="transformations">Transformações</TabsTrigger>
          <TabsTrigger value="destination">Destino</TabsTrigger>
          <TabsTrigger value="schedule">Agendamento</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-name">Nome do Job *</Label>
                <Input
                  id="job-name"
                  placeholder="Ex: Sincronização Protocolos Diária"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-description">Descrição</Label>
                <Textarea
                  id="job-description"
                  placeholder="Descreva o que este job faz..."
                  value={config.description}
                  onChange={(e) => updateConfig({ description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="job-enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                />
                <Label htmlFor="job-enabled">Job ativo</Label>
              </div>
            </CardContent>
          </Card>

          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span>Resultado do Teste</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`p-3 rounded-lg ${
                  testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <p>{testResult.message}</p>
                  {testResult.recordCount && (
                    <p className="text-sm mt-1">
                      Registros disponíveis: {testResult.recordCount.toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="source" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração da Fonte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fonte de Dados</Label>
                <Select
                  value={config.source.id}
                  onValueChange={(value) => {
                    const source = availableSources.find(s => s.id === value)
                    if (source) {
                      updateSource(source)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSources.map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        <div className="flex items-center space-x-2">
                          <Database className="h-4 w-4" />
                          <span>{source.name}</span>
                          <Badge variant="secondary">{source.type}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {config.source.type === 'database' && config.source.tables && (
                <div className="space-y-2">
                  <Label>Tabelas Disponíveis</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {config.source.tables.map(table => (
                      <div key={table} className="flex items-center space-x-2 p-2 border rounded">
                        <input type="checkbox" id={table} />
                        <label htmlFor={table} className="text-sm">{table}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {config.source.type === 'api' && (
                <div className="space-y-2">
                  <Label>Configurações da API</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Endpoint da API"
                      value={config.source.endpoint || ''}
                      onChange={(e) => updateSource({ endpoint: e.target.value })}
                    />
                    <Input
                      placeholder="Chave de API (opcional)"
                      type="password"
                    />
                  </div>
                </div>
              )}

              {(config.source.type === 'csv' || config.source.type === 'file') && (
                <div className="space-y-2">
                  <Label>Caminho do Arquivo</Label>
                  <Input
                    placeholder="/caminho/para/arquivo.csv"
                    value={config.source.path || ''}
                    onChange={(e) => updateSource({ path: e.target.value })}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transformations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transformações de Dados</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => addTransformation('filter')}>
                    Filtro
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addTransformation('map')}>
                    Mapeamento
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addTransformation('aggregate')}>
                    Agregação
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addTransformation('clean')}>
                    Limpeza
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.transformations.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma transformação configurada
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Adicione transformações para processar os dados durante a extração.
                    </p>
                  </div>
                ) : (
                  config.transformations.map((transformation, index) => (
                    <div key={transformation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            {index + 1}
                          </div>
                          {getTransformationIcon(transformation.type)}
                          <div>
                            <Badge variant="secondary">
                              {getTransformationLabel(transformation.type)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={transformation.enabled}
                            onCheckedChange={(checked) =>
                              updateTransformation(transformation.id, { enabled: checked })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTransformation(transformation.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Input
                          placeholder="Nome da transformação"
                          value={transformation.name}
                          onChange={(e) =>
                            updateTransformation(transformation.id, { name: e.target.value })
                          }
                        />

                        {transformation.type === 'filter' && (
                          <div className="grid grid-cols-3 gap-2">
                            <Input placeholder="Campo" />
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Operador" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Igual</SelectItem>
                                <SelectItem value="contains">Contém</SelectItem>
                                <SelectItem value="greater">Maior que</SelectItem>
                                <SelectItem value="less">Menor que</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input placeholder="Valor" />
                          </div>
                        )}

                        {transformation.type === 'map' && (
                          <div className="space-y-2">
                            <Label>Mapeamento de Campos</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input placeholder="Campo origem" />
                              <Input placeholder="Campo destino" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="destination" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Destino</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Destino dos Dados</Label>
                <Select
                  value={config.destination.id}
                  onValueChange={(value) => {
                    const destination = availableSources.find(s => s.id === value)
                    if (destination) {
                      updateDestination(destination)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSources.filter(s => s.type === 'database').map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        <div className="flex items-center space-x-2">
                          <Database className="h-4 w-4" />
                          <span>{source.name}</span>
                          <Badge variant="secondary">{source.type}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tabela de Destino</Label>
                <Input
                  placeholder="Nome da tabela"
                  value={config.destination.name}
                  onChange={(e) => updateDestination({ name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Estratégia de Inserção</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a estratégia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insert">Inserir novos registros</SelectItem>
                    <SelectItem value="upsert">Inserir ou atualizar</SelectItem>
                    <SelectItem value="replace">Substituir todos</SelectItem>
                    <SelectItem value="merge">Mesclar dados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Configuração de Agendamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Frequência de Execução</Label>
                <Select
                  value={config.schedule.frequency}
                  onValueChange={(value: any) => updateSchedule({ frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="hourly">De hora em hora</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.schedule.frequency !== 'manual' && (
                <>
                  <div className="space-y-2">
                    <Label>Horário de Execução</Label>
                    <Input
                      type="time"
                      value={config.schedule.time || '09:00'}
                      onChange={(e) => updateSchedule({ time: e.target.value })}
                    />
                  </div>

                  {config.schedule.frequency === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Dia da Semana</Label>
                      <Select
                        value={config.schedule.dayOfWeek?.toString() || '1'}
                        onValueChange={(value) => updateSchedule({ dayOfWeek: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Segunda-feira</SelectItem>
                          <SelectItem value="2">Terça-feira</SelectItem>
                          <SelectItem value="3">Quarta-feira</SelectItem>
                          <SelectItem value="4">Quinta-feira</SelectItem>
                          <SelectItem value="5">Sexta-feira</SelectItem>
                          <SelectItem value="6">Sábado</SelectItem>
                          <SelectItem value="0">Domingo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {config.schedule.frequency === 'monthly' && (
                    <div className="space-y-2">
                      <Label>Dia do Mês</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={config.schedule.dayOfMonth || 1}
                        onChange={(e) => updateSchedule({ dayOfMonth: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Política de Retry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Máximo de Tentativas</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={config.retryPolicy.maxRetries}
                    onChange={(e) => updateConfig({
                      retryPolicy: {
                        ...config.retryPolicy,
                        maxRetries: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delay entre Tentativas (min)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={config.retryPolicy.retryDelay}
                    onChange={(e) => updateConfig({
                      retryPolicy: {
                        ...config.retryPolicy,
                        retryDelay: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Multiplicador de Backoff</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.1"
                    value={config.retryPolicy.backoffMultiplier}
                    onChange={(e) => updateConfig({
                      retryPolicy: {
                        ...config.retryPolicy,
                        backoffMultiplier: parseFloat(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify-success"
                    checked={config.notifications.onSuccess}
                    onCheckedChange={(checked) => updateConfig({
                      notifications: {
                        ...config.notifications,
                        onSuccess: checked
                      }
                    })}
                  />
                  <Label htmlFor="notify-success">Notificar em caso de sucesso</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify-failure"
                    checked={config.notifications.onFailure}
                    onCheckedChange={(checked) => updateConfig({
                      notifications: {
                        ...config.notifications,
                        onFailure: checked
                      }
                    })}
                  />
                  <Label htmlFor="notify-failure">Notificar em caso de falha</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Destinatários (emails separados por vírgula)</Label>
                <Textarea
                  placeholder="admin@exemplo.com, devops@exemplo.com"
                  value={config.notifications.recipients.join(', ')}
                  onChange={(e) => updateConfig({
                    notifications: {
                      ...config.notifications,
                      recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}