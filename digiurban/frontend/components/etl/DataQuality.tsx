'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCcw,
  Filter,
  Search,
  TrendingUp,
  BarChart3,
  FileText,
  Download,
  Plus
} from 'lucide-react'
import { KPICard } from '../analytics/KPICard'
import { AnalyticsLineChart, AnalyticsBarChart, AnalyticsPieChart } from '../analytics/Charts'

interface QualityMetric {
  id: string
  name: string
  description: string
  category: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'validity'
  score: number
  threshold: number
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  lastChecked: string
  issues: number
  recordsAffected: number
}

interface QualityIssue {
  id: string
  rule: string
  table: string
  field: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recordsAffected: number
  firstDetected: string
  lastDetected: string
  status: 'open' | 'resolved' | 'ignored'
  sampleData?: string[]
}

interface DataProfileStat {
  field: string
  type: string
  completeness: number
  uniqueness: number
  nullCount: number
  minValue?: string
  maxValue?: string
  avgLength?: number
  patterns?: Array<{ pattern: string; count: number }>
}

interface DataQualityProps {
  className?: string
}

export function DataQuality({ className }: DataQualityProps) {
  const [selectedTable, setSelectedTable] = useState<string>('protocols')

  // Mock data for quality metrics
  const qualityMetrics: QualityMetric[] = [
    {
      id: '1',
      name: 'Completude dos Dados',
      description: 'Percentual de campos obrigatórios preenchidos',
      category: 'completeness',
      score: 94.5,
      threshold: 95,
      status: 'warning',
      trend: 'down',
      lastChecked: '2024-01-15T10:30:00Z',
      issues: 12,
      recordsAffected: 2400
    },
    {
      id: '2',
      name: 'Precisão dos Dados',
      description: 'Dados que seguem formatos e regras corretas',
      category: 'accuracy',
      score: 98.2,
      threshold: 95,
      status: 'good',
      trend: 'up',
      lastChecked: '2024-01-15T10:30:00Z',
      issues: 3,
      recordsAffected: 180
    },
    {
      id: '3',
      name: 'Consistência',
      description: 'Dados consistentes entre diferentes tabelas',
      category: 'consistency',
      score: 91.8,
      threshold: 90,
      status: 'good',
      trend: 'stable',
      lastChecked: '2024-01-15T10:30:00Z',
      issues: 8,
      recordsAffected: 650
    },
    {
      id: '4',
      name: 'Pontualidade',
      description: 'Dados atualizados dentro do prazo esperado',
      category: 'timeliness',
      score: 87.3,
      threshold: 85,
      status: 'good',
      trend: 'up',
      lastChecked: '2024-01-15T10:30:00Z',
      issues: 5,
      recordsAffected: 890
    }
  ]

  const qualityIssues: QualityIssue[] = [
    {
      id: '1',
      rule: 'Email obrigatório',
      table: 'citizens',
      field: 'email',
      severity: 'high',
      description: 'Campo email está vazio para alguns cidadãos',
      recordsAffected: 1200,
      firstDetected: '2024-01-12T08:00:00Z',
      lastDetected: '2024-01-15T10:30:00Z',
      status: 'open',
      sampleData: ['Registro ID: 12345', 'Registro ID: 67890', 'Registro ID: 54321']
    },
    {
      id: '2',
      rule: 'Formato de CPF inválido',
      table: 'citizens',
      field: 'cpf',
      severity: 'critical',
      description: 'CPFs que não seguem o formato padrão brasileiro',
      recordsAffected: 450,
      firstDetected: '2024-01-14T14:20:00Z',
      lastDetected: '2024-01-15T10:30:00Z',
      status: 'open',
      sampleData: ['123.456.789-00', '111.111.111-11', '000.000.000-00']
    },
    {
      id: '3',
      rule: 'Data de nascimento futura',
      table: 'citizens',
      field: 'birth_date',
      severity: 'medium',
      description: 'Datas de nascimento posteriores à data atual',
      recordsAffected: 25,
      firstDetected: '2024-01-15T09:15:00Z',
      lastDetected: '2024-01-15T10:30:00Z',
      status: 'open',
      sampleData: ['2025-03-15', '2024-12-25', '2025-01-01']
    }
  ]

  const profileStats: DataProfileStat[] = [
    {
      field: 'id',
      type: 'integer',
      completeness: 100,
      uniqueness: 100,
      nullCount: 0,
      minValue: '1',
      maxValue: '125000'
    },
    {
      field: 'email',
      type: 'varchar',
      completeness: 92.5,
      uniqueness: 98.2,
      nullCount: 9450,
      avgLength: 24,
      patterns: [
        { pattern: '*@gmail.com', count: 35000 },
        { pattern: '*@yahoo.com', count: 18000 },
        { pattern: '*@hotmail.com', count: 15000 }
      ]
    },
    {
      field: 'cpf',
      type: 'varchar',
      completeness: 89.3,
      uniqueness: 99.1,
      nullCount: 13450,
      avgLength: 14,
      patterns: [
        { pattern: 'XXX.XXX.XXX-XX', count: 112000 },
        { pattern: 'XXXXXXXXXXX', count: 1200 },
        { pattern: 'Invalid format', count: 450 }
      ]
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'completeness':
        return 'Completude'
      case 'accuracy':
        return 'Precisão'
      case 'consistency':
        return 'Consistência'
      case 'timeliness':
        return 'Pontualidade'
      case 'validity':
        return 'Validade'
      default:
        return category
    }
  }

  const qualityTrendData = [
    { month: 'Jan', completeness: 92, accuracy: 95, consistency: 89 },
    { month: 'Fev', completeness: 94, accuracy: 96, consistency: 91 },
    { month: 'Mar', completeness: 93, accuracy: 97, consistency: 92 },
    { month: 'Abr', completeness: 95, accuracy: 98, consistency: 91 }
  ]

  const issuesByCategory = [
    { category: 'Completude', count: 45 },
    { category: 'Formato', count: 28 },
    { category: 'Consistência', count: 15 },
    { category: 'Duplicatas', count: 12 },
    { category: 'Integridade', count: 8 }
  ]

  const tableQualityScores = [
    { table: 'citizens', score: 94.5 },
    { table: 'protocols', score: 96.2 },
    { table: 'departments', score: 88.7 },
    { table: 'employees', score: 92.1 },
    { table: 'evaluations', score: 97.8 }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Qualidade dos Dados</h1>
          <p className="text-muted-foreground">
            Monitoramento e análise da qualidade dos dados no sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          <Button>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs de Qualidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {qualityMetrics.map(metric => (
          <KPICard
            key={metric.id}
            title={getCategoryLabel(metric.category)}
            value={metric.score}
            unit="%"
            target={metric.threshold}
            status={metric.status}
            trend={metric.trend}
            trendValue={metric.trend === 'up' ? 2.1 : metric.trend === 'down' ? -1.5 : 0}
            description={`${metric.issues} issues • ${metric.recordsAffected} registros`}
          />
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="issues">Problemas</TabsTrigger>
          <TabsTrigger value="profiling">Profiling</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tendência de Qualidade */}
            <AnalyticsLineChart
              title="Tendência de Qualidade - Últimos 4 Meses"
              data={qualityTrendData}
              xKey="month"
              yKey={["completeness", "accuracy", "consistency"]}
              colors={["#3B82F6", "#10B981", "#F59E0B"]}
              height={300}
            />

            {/* Issues por Categoria */}
            <AnalyticsPieChart
              title="Distribuição de Issues por Categoria"
              data={issuesByCategory}
              dataKey="count"
              nameKey="category"
              height={300}
            />
          </div>

          {/* Score por Tabela */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Score de Qualidade por Tabela</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tableQualityScores.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="font-medium">{item.table}</div>
                    <div className="flex items-center space-x-3">
                      <Progress value={item.score} className="w-32 h-2" />
                      <div className="w-12 text-sm font-medium text-right">
                        {item.score}%
                      </div>
                      {getStatusIcon(item.score >= 95 ? 'good' : item.score >= 90 ? 'warning' : 'critical')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumo de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Dados de Alta Qualidade</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">1.2M</div>
                <p className="text-sm text-muted-foreground">registros (87.5%)</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>Dados com Problemas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">142K</div>
                <p className="text-sm text-muted-foreground">registros (10.3%)</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Dados Críticos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">30K</div>
                <p className="text-sm text-muted-foreground">registros (2.2%)</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Problemas de Qualidade Detectados</CardTitle>
                <Badge variant="destructive">{qualityIssues.filter(i => i.status === 'open').length} abertos</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityIssues.map(issue => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{issue.rule}</h3>
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{issue.table}.{issue.field}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                        <Button variant="outline" size="sm">
                          Corrigir
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="text-sm">
                        <span className="font-medium">Registros Afetados:</span>
                        <div className="text-lg font-bold text-red-600">
                          {issue.recordsAffected.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Primeira Detecção:</span>
                        <div>{new Date(issue.firstDetected).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Última Detecção:</span>
                        <div>{new Date(issue.lastDetected).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>

                    {issue.sampleData && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Exemplos de dados problemáticos:</p>
                        <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                          {issue.sampleData.map((sample, index) => (
                            <div key={index} className="text-red-600">{sample}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiling" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Perfil dos Dados - Tabela: {selectedTable}</CardTitle>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="protocols">Protocolos</option>
                  <option value="citizens">Cidadãos</option>
                  <option value="departments">Departamentos</option>
                  <option value="employees">Funcionários</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Campo</th>
                      <th className="text-left p-3">Tipo</th>
                      <th className="text-left p-3">Completude</th>
                      <th className="text-left p-3">Unicidade</th>
                      <th className="text-left p-3">Nulos</th>
                      <th className="text-left p-3">Min/Max</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileStats.map((stat, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{stat.field}</td>
                        <td className="p-3">
                          <Badge variant="outline">{stat.type}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Progress value={stat.completeness} className="w-16 h-2" />
                            <span className="text-xs">{stat.completeness}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Progress value={stat.uniqueness} className="w-16 h-2" />
                            <span className="text-xs">{stat.uniqueness}%</span>
                          </div>
                        </td>
                        <td className="p-3">{stat.nullCount.toLocaleString()}</td>
                        <td className="p-3 text-xs">
                          {stat.minValue && stat.maxValue ? (
                            <div>
                              <div>Min: {stat.minValue}</div>
                              <div>Max: {stat.maxValue}</div>
                            </div>
                          ) : (
                            stat.avgLength && `Média: ${stat.avgLength} chars`
                          )}
                        </td>
                        <td className="p-3">
                          {getStatusIcon(stat.completeness >= 95 ? 'good' :
                                       stat.completeness >= 85 ? 'warning' : 'critical')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Padrões de Dados */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Padrões Detectados (Campo: email)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {profileStats[1].patterns?.map((pattern, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-mono text-sm text-blue-600">{pattern.pattern}</div>
                      <div className="text-lg font-bold">{pattern.count.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">ocorrências</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Regras de Qualidade</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'Email obrigatório',
                    description: 'Campo email não pode estar vazio',
                    table: 'citizens',
                    field: 'email',
                    type: 'not_null',
                    active: true
                  },
                  {
                    name: 'Formato de CPF',
                    description: 'CPF deve seguir o padrão brasileiro',
                    table: 'citizens',
                    field: 'cpf',
                    type: 'regex',
                    active: true
                  },
                  {
                    name: 'Data de nascimento válida',
                    description: 'Data não pode ser futura',
                    table: 'citizens',
                    field: 'birth_date',
                    type: 'date_range',
                    active: true
                  },
                  {
                    name: 'Status válido',
                    description: 'Status deve ser um valor da lista',
                    table: 'protocols',
                    field: 'status',
                    type: 'enum',
                    active: false
                  }
                ].map((rule, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant="outline">{rule.table}.{rule.field}</Badge>
                        <Badge variant={rule.active ? 'default' : 'secondary'}>
                          {rule.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <p className="text-xs text-muted-foreground">Tipo: {rule.type}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        {rule.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}