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
import { Separator } from '@/components/ui/separator'
import {
  BarChart3,
  FileText,
  Settings,
  Plus,
  X,
  Play,
  Save,
  Calendar,
  Filter,
  Eye
} from 'lucide-react'
// LEGADO: import { useReports } from '@/hooks/api/analytics'

interface ReportField {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  table: string
  required?: boolean
}

interface ReportFilter {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in'
  value: string
  label: string
}

interface ReportVisualization {
  id: string
  type: 'table' | 'chart' | 'metric'
  title: string
  config: any
}

interface ReportBuilderState {
  name: string
  description: string
  type: 'operational' | 'managerial' | 'executive'
  category: string
  fields: ReportField[]
  filters: ReportFilter[]
  visualizations: ReportVisualization[]
  schedule?: {
    frequency: 'manual' | 'daily' | 'weekly' | 'monthly'
    time?: string
    recipients?: string[]
  }
}

interface ReportBuilderProps {
  onSave?: (report: ReportBuilderState) => void
  onPreview?: (report: ReportBuilderState) => void
  onExecute?: (report: ReportBuilderState) => void
  initialData?: Partial<ReportBuilderState>
  className?: string
}

export function ReportBuilder({
  onSave,
  onPreview,
  onExecute,
  initialData,
  className
}: ReportBuilderProps) {
  const [loading, setLoading] = useState(false);
  const createReport = async (report: any) => {
    // TODO: Implementar via API
    return null;
  };
  const [reportState, setReportState] = useState<ReportBuilderState>({
    name: '',
    description: '',
    type: 'operational',
    category: 'general',
    fields: [],
    filters: [],
    visualizations: [],
    ...initialData
  })

  // Available fields for reports
  const availableFields: ReportField[] = [
    { id: 'protocol_id', name: 'ID do Protocolo', type: 'string', table: 'protocols' },
    { id: 'protocol_title', name: 'Título do Protocolo', type: 'string', table: 'protocols' },
    { id: 'protocol_status', name: 'Status do Protocolo', type: 'string', table: 'protocols' },
    { id: 'protocol_created_at', name: 'Data de Criação', type: 'date', table: 'protocols' },
    { id: 'protocol_resolved_at', name: 'Data de Resolução', type: 'date', table: 'protocols' },
    { id: 'citizen_name', name: 'Nome do Cidadão', type: 'string', table: 'citizens' },
    { id: 'citizen_email', name: 'Email do Cidadão', type: 'string', table: 'citizens' },
    { id: 'department_name', name: 'Departamento', type: 'string', table: 'departments' },
    { id: 'employee_name', name: 'Funcionário Responsável', type: 'string', table: 'employees' },
    { id: 'satisfaction_score', name: 'Nota de Satisfação', type: 'number', table: 'evaluations' },
    { id: 'resolution_time', name: 'Tempo de Resolução', type: 'number', table: 'protocols' }
  ]

  const updateReportState = (updates: Partial<ReportBuilderState>) => {
    setReportState(prev => ({ ...prev, ...updates }))
  }

  const addField = (field: ReportField) => {
    if (!reportState.fields.find(f => f.id === field.id)) {
      updateReportState({
        fields: [...reportState.fields, field]
      })
    }
  }

  const removeField = (fieldId: string) => {
    updateReportState({
      fields: reportState.fields.filter(f => f.id !== fieldId)
    })
  }

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: Math.random().toString(36).substr(2, 9),
      field: '',
      operator: 'equals',
      value: '',
      label: `Filtro ${reportState.filters.length + 1}`
    }
    updateReportState({
      filters: [...reportState.filters, newFilter]
    })
  }

  const updateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    updateReportState({
      filters: reportState.filters.map(f =>
        f.id === filterId ? { ...f, ...updates } : f
      )
    })
  }

  const removeFilter = (filterId: string) => {
    updateReportState({
      filters: reportState.filters.filter(f => f.id !== filterId)
    })
  }

  const addVisualization = (type: 'table' | 'chart' | 'metric') => {
    const newVisualization: ReportVisualization = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: `${type === 'table' ? 'Tabela' : type === 'chart' ? 'Gráfico' : 'Métrica'} ${reportState.visualizations.length + 1}`,
      config: {
        fields: type === 'table' ? reportState.fields.slice(0, 5).map(f => f.id) : [],
        chartType: type === 'chart' ? 'bar' : undefined,
        aggregation: type === 'metric' ? 'count' : undefined
      }
    }
    updateReportState({
      visualizations: [...reportState.visualizations, newVisualization]
    })
  }

  const updateVisualization = (vizId: string, updates: Partial<ReportVisualization>) => {
    updateReportState({
      visualizations: reportState.visualizations.map(v =>
        v.id === vizId ? { ...v, ...updates } : v
      )
    })
  }

  const removeVisualization = (vizId: string) => {
    updateReportState({
      visualizations: reportState.visualizations.filter(v => v.id !== vizId)
    })
  }

  const handleSave = async () => {
    try {
      const reportData = {
        name: reportState.name,
        description: reportState.description,
        type: reportState.type,
        config: {
          fields: reportState.fields,
          filters: reportState.filters,
          visualizations: reportState.visualizations,
          schedule: reportState.schedule
        },
        isActive: true
      }

      if (onSave) {
        onSave(reportState)
      } else {
        await createReport(reportData)
      }
    } catch (error) {
      console.error('Failed to save report:', error)
    }
  }

  const handlePreview = () => {
    if (onPreview) {
      onPreview(reportState)
    }
  }

  const handleExecute = () => {
    if (onExecute) {
      onExecute(reportState)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Construtor de Relatórios</h2>
          <p className="text-muted-foreground">
            Crie relatórios personalizados para suas necessidades
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button variant="outline" onClick={handleExecute}>
            <Play className="h-4 w-4 mr-2" />
            Executar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="filters">Filtros</TabsTrigger>
          <TabsTrigger value="visualizations">Visualizações</TabsTrigger>
          <TabsTrigger value="schedule">Agendamento</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Nome do Relatório *</Label>
                  <Input
                    id="report-name"
                    placeholder="Ex: Relatório de Protocolos Mensais"
                    value={reportState.name}
                    onChange={(e) => updateReportState({ name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-category">Categoria</Label>
                  <Select
                    value={reportState.category}
                    onValueChange={(value) => updateReportState({ category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="protocols">Protocolos</SelectItem>
                      <SelectItem value="citizens">Cidadãos</SelectItem>
                      <SelectItem value="departments">Departamentos</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="satisfaction">Satisfação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-type">Tipo de Relatório</Label>
                <Select
                  value={reportState.type}
                  onValueChange={(value: any) => updateReportState({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operacional</SelectItem>
                    <SelectItem value="managerial">Gerencial</SelectItem>
                    <SelectItem value="executive">Executivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-description">Descrição</Label>
                <Textarea
                  id="report-description"
                  placeholder="Descreva o objetivo e conteúdo do relatório..."
                  value={reportState.description}
                  onChange={(e) => updateReportState({ description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Campos Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableFields.map(field => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-sm">{field.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {field.table} • {field.type}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addField(field)}
                        disabled={reportState.fields.some(f => f.id === field.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Campos Selecionados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportState.fields.length > 0 ? (
                    reportState.fields.map(field => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded"
                      >
                        <div>
                          <p className="font-medium text-sm">{field.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {field.table} • {field.type}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeField(field.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum campo selecionado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filtros do Relatório</span>
                </CardTitle>
                <Button onClick={addFilter}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Filtro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportState.filters.map(filter => (
                  <div key={filter.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Input
                        placeholder="Nome do filtro"
                        value={filter.label}
                        onChange={(e) => updateFilter(filter.id, { label: e.target.value })}
                        className="max-w-xs"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(filter.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Campo</Label>
                        <Select
                          value={filter.field}
                          onValueChange={(value) => updateFilter(filter.id, { field: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map(field => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Operador</Label>
                        <Select
                          value={filter.operator}
                          onValueChange={(value: any) => updateFilter(filter.id, { operator: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Igual a</SelectItem>
                            <SelectItem value="contains">Contém</SelectItem>
                            <SelectItem value="greater">Maior que</SelectItem>
                            <SelectItem value="less">Menor que</SelectItem>
                            <SelectItem value="between">Entre</SelectItem>
                            <SelectItem value="in">Dentro de</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Valor</Label>
                        <Input
                          placeholder="Valor do filtro"
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {reportState.filters.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum filtro configurado. Adicione filtros para refinar os dados do relatório.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualizations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Visualizações</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => addVisualization('table')}>
                    Tabela
                  </Button>
                  <Button variant="outline" onClick={() => addVisualization('chart')}>
                    Gráfico
                  </Button>
                  <Button variant="outline" onClick={() => addVisualization('metric')}>
                    Métrica
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportState.visualizations.map(viz => (
                  <div key={viz.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{viz.type}</Badge>
                        <Input
                          placeholder="Título da visualização"
                          value={viz.title}
                          onChange={(e) => updateVisualization(viz.id, { title: e.target.value })}
                          className="max-w-xs"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVisualization(viz.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {viz.type === 'chart' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Gráfico</Label>
                          <Select
                            value={viz.config.chartType}
                            onValueChange={(value) => updateVisualization(viz.id, {
                              config: { ...viz.config, chartType: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bar">Barras</SelectItem>
                              <SelectItem value="line">Linha</SelectItem>
                              <SelectItem value="pie">Pizza</SelectItem>
                              <SelectItem value="area">Área</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {viz.type === 'metric' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Agregação</Label>
                          <Select
                            value={viz.config.aggregation}
                            onValueChange={(value) => updateVisualization(viz.id, {
                              config: { ...viz.config, aggregation: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="count">Contagem</SelectItem>
                              <SelectItem value="sum">Soma</SelectItem>
                              <SelectItem value="avg">Média</SelectItem>
                              <SelectItem value="min">Mínimo</SelectItem>
                              <SelectItem value="max">Máximo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {reportState.visualizations.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma visualização configurada. Adicione tabelas, gráficos ou métricas para exibir os dados.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Agendamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Frequência de Execução</Label>
                <Select
                  value={reportState.schedule?.frequency || 'manual'}
                  onValueChange={(value: any) => updateReportState({
                    schedule: { ...reportState.schedule, frequency: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportState.schedule?.frequency !== 'manual' && (
                <>
                  <div className="space-y-2">
                    <Label>Horário de Execução</Label>
                    <Input
                      type="time"
                      value={reportState.schedule?.time || '09:00'}
                      onChange={(e) => updateReportState({
                        schedule: {
                          frequency: reportState.schedule?.frequency || 'manual',
                          ...reportState.schedule,
                          time: e.target.value
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Destinatários (emails separados por vírgula)</Label>
                    <Textarea
                      placeholder="admin@exemplo.com, gerente@exemplo.com"
                      value={reportState.schedule?.recipients?.join(', ') || ''}
                      onChange={(e) => updateReportState({
                        schedule: {
                          frequency: reportState.schedule?.frequency || 'manual',
                          ...reportState.schedule,
                          recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                        }
                      })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}