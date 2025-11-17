'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Database,
  RefreshCcw,
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Settings,
  Download
} from 'lucide-react'
import { KPICard } from '../analytics/KPICard'
import { AnalyticsLineChart, AnalyticsBarChart, AnalyticsPieChart } from '../analytics/Charts'

interface ETLJob {
  id: string
  name: string
  description: string
  source: string
  destination: string
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'stopped'
  progress: number
  recordsProcessed: number
  totalRecords: number
  duration: number
  startTime: string
  endTime?: string
  lastRun: string
  nextRun?: string
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly'
  error?: string
}

interface ETLMetrics {
  totalJobs: number
  activeJobs: number
  successRate: number
  failedJobs: number
  totalRecordsProcessed: number
  avgDuration: number
}

interface ETLDashboardProps {
  className?: string
}

export function ETLDashboard({ className }: ETLDashboardProps) {
  const [metrics, setMetrics] = useState<ETLMetrics>({
    totalJobs: 12,
    activeJobs: 3,
    successRate: 94.5,
    failedJobs: 1,
    totalRecordsProcessed: 2450000,
    avgDuration: 45
  })

  const [etlJobs, setETLJobs] = useState<ETLJob[]>([
    {
      id: '1',
      name: 'Sincronização Protocolos',
      description: 'Extração e transformação dos dados de protocolos',
      source: 'sistema_protocolos',
      destination: 'data_warehouse',
      status: 'running',
      progress: 65,
      recordsProcessed: 65000,
      totalRecords: 100000,
      duration: 25,
      startTime: '2024-01-15T08:00:00Z',
      lastRun: '2024-01-15T08:00:00Z',
      nextRun: '2024-01-16T08:00:00Z',
      frequency: 'daily'
    },
    {
      id: '2',
      name: 'Agregação Métricas Cidadãos',
      description: 'Consolidação de dados de cidadãos e satisfação',
      source: 'sistema_cidadaos',
      destination: 'data_warehouse',
      status: 'completed',
      progress: 100,
      recordsProcessed: 45000,
      totalRecords: 45000,
      duration: 12,
      startTime: '2024-01-15T07:30:00Z',
      endTime: '2024-01-15T07:42:00Z',
      lastRun: '2024-01-15T07:30:00Z',
      nextRun: '2024-01-15T19:30:00Z',
      frequency: 'daily'
    },
    {
      id: '3',
      name: 'Limpeza Dados Departamentos',
      description: 'Validação e limpeza dos dados departamentais',
      source: 'sistema_departamentos',
      destination: 'data_warehouse',
      status: 'failed',
      progress: 0,
      recordsProcessed: 0,
      totalRecords: 15000,
      duration: 0,
      startTime: '2024-01-15T06:00:00Z',
      lastRun: '2024-01-15T06:00:00Z',
      nextRun: '2024-01-16T06:00:00Z',
      frequency: 'daily',
      error: 'Conexão com fonte de dados perdida'
    }
  ])

  const [loading, setLoading] = useState(false)

  const handleJobAction = (jobId: string, action: 'start' | 'pause' | 'stop') => {
    setETLJobs(prev => prev.map(job =>
      job.id === jobId
        ? {
            ...job,
            status: action === 'start' ? 'running' :
                   action === 'pause' ? 'scheduled' : 'stopped'
          }
        : job
    ))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'stopped':
        return <Square className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'stopped':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return 'Executando'
      case 'completed':
        return 'Concluído'
      case 'failed':
        return 'Falhou'
      case 'scheduled':
        return 'Agendado'
      case 'stopped':
        return 'Parado'
      default:
        return status
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'manual':
        return 'Manual'
      case 'hourly':
        return 'De hora em hora'
      case 'daily':
        return 'Diário'
      case 'weekly':
        return 'Semanal'
      default:
        return frequency
    }
  }

  // Mock data for charts
  const performanceData = [
    { time: '00:00', duration: 45, records: 50000, success: 95 },
    { time: '06:00', duration: 52, records: 65000, success: 94 },
    { time: '12:00', duration: 48, records: 70000, success: 96 },
    { time: '18:00', duration: 41, records: 55000, success: 98 },
  ]

  const sourceDistribution = [
    { name: 'Sistema Protocolos', value: 45 },
    { name: 'Sistema Cidadãos', value: 30 },
    { name: 'Sistema Departamentos', value: 15 },
    { name: 'Sistemas Externos', value: 10 }
  ]

  const jobStatusData = [
    { status: 'Concluído', count: etlJobs.filter(j => j.status === 'completed').length },
    { status: 'Executando', count: etlJobs.filter(j => j.status === 'running').length },
    { status: 'Falhou', count: etlJobs.filter(j => j.status === 'failed').length },
    { status: 'Agendado', count: etlJobs.filter(j => j.status === 'scheduled').length }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ETL & Data Warehouse</h1>
          <p className="text-muted-foreground">
            Monitoramento e gestão de processos de ETL
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Jobs"
          value={metrics.totalJobs}
          description="Processos ETL configurados"
          status="normal"
        />

        <KPICard
          title="Jobs Ativos"
          value={metrics.activeJobs}
          status={metrics.activeJobs > 5 ? 'warning' : 'good'}
          description="Processos em execução"
        />

        <KPICard
          title="Taxa de Sucesso"
          value={metrics.successRate}
          unit="%"
          target={95}
          warning={90}
          critical={85}
          status={metrics.successRate >= 95 ? 'good' :
                   metrics.successRate >= 90 ? 'warning' : 'critical'}
          description="Taxa de execuções bem-sucedidas"
        />

        <KPICard
          title="Registros Processados"
          value={metrics.totalRecordsProcessed}
          description="Total de registros hoje"
          status="good"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ETL</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance dos Jobs */}
            <AnalyticsLineChart
              title="Performance dos Jobs - Últimas 24h"
              data={performanceData}
              xKey="time"
              yKey={["duration", "success"]}
              colors={["#3B82F6", "#10B981"]}
              height={300}
            />

            {/* Distribuição por Fonte */}
            <AnalyticsPieChart
              title="Distribuição por Fonte de Dados"
              data={sourceDistribution}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          </div>

          {/* Status dos Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Status dos Jobs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {jobStatusData.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{item.count}</div>
                    <div className="text-sm text-muted-foreground">{item.status}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jobs ETL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {etlJobs.map(job => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{job.name}</h3>
                          <Badge className={getStatusColor(job.status)}>
                            {getStatusLabel(job.status)}
                          </Badge>
                          <Badge variant="outline">
                            {getFrequencyLabel(job.frequency)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{job.description}</p>
                        <div className="text-xs text-muted-foreground">
                          {job.source} → {job.destination}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {job.status === 'running' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleJobAction(job.id, 'pause')}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {(job.status === 'scheduled' || job.status === 'stopped') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleJobAction(job.id, 'start')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJobAction(job.id, 'stop')}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {job.status === 'running' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progresso: {job.recordsProcessed.toLocaleString()} / {job.totalRecords.toLocaleString()}</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          Executando há {job.duration} minutos
                        </div>
                      </div>
                    )}

                    {job.status === 'failed' && job.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <strong>Erro:</strong> {job.error}
                      </div>
                    )}

                    {job.status === 'completed' && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div>Processados: {job.recordsProcessed.toLocaleString()} registros</div>
                        <div>Duração: {job.duration} minutos</div>
                        <div>Concluído em: {new Date(job.endTime!).toLocaleString('pt-BR')}</div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <div>
                        <span>Última execução: {new Date(job.lastRun).toLocaleString('pt-BR')}</span>
                      </div>
                      {job.nextRun && (
                        <div>
                          <span>Próxima execução: {new Date(job.nextRun).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Desempenho por Job */}
            <AnalyticsBarChart
              title="Duração Média por Job (min)"
              data={[
                { job: 'Protocolos', duration: 45 },
                { job: 'Cidadãos', duration: 12 },
                { job: 'Departamentos', duration: 8 },
                { job: 'Métricas', duration: 25 }
              ]}
              xKey="job"
              yKey="duration"
              colors={["#8B5CF6"]}
              height={300}
            />

            {/* Volume de Dados */}
            <AnalyticsLineChart
              title="Volume de Dados Processados (Mil registros)"
              data={[
                { day: 'Seg', volume: 450 },
                { day: 'Ter', volume: 520 },
                { day: 'Qua', volume: 380 },
                { day: 'Qui', volume: 490 },
                { day: 'Sex', volume: 610 },
                { day: 'Sáb', volume: 320 },
                { day: 'Dom', volume: 280 }
              ]}
              xKey="day"
              yKey="volume"
              colors={["#F59E0B"]}
              height={300}
            />
          </div>

          {/* Métricas de Qualidade */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Qualidade dos Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <div className="text-sm text-muted-foreground">Integridade dos Dados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">2.1%</div>
                  <div className="text-sm text-muted-foreground">Taxa de Duplicação</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">0.8%</div>
                  <div className="text-sm text-muted-foreground">Dados Inconsistentes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {/* Alertas do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>Alertas do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <p className="font-medium text-red-800">Job "Departamentos" falhando consistentemente</p>
                    <p className="text-sm text-red-600">Última falha há 2 horas - Conexão perdida</p>
                  </div>
                  <Badge variant="destructive">Crítico</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-medium text-yellow-800">Performance do job "Protocolos" degradada</p>
                    <p className="text-sm text-yellow-600">Duração média aumentou 35% nas últimas 24h</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Log de Atividades */}
          <Card>
            <CardHeader>
              <CardTitle>Log de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto text-sm font-mono">
                <div className="text-green-600">[08:42:15] Job "Cidadãos" concluído com sucesso - 45.000 registros</div>
                <div className="text-blue-600">[08:30:00] Iniciado job "Protocolos" - Processando 100.000 registros</div>
                <div className="text-red-600">[08:15:20] ERRO: Job "Departamentos" falhou - Timeout de conexão</div>
                <div className="text-green-600">[07:45:32] Job "Métricas" concluído com sucesso - 15.000 registros</div>
                <div className="text-yellow-600">[07:30:00] AVISO: Alta latência detectada na fonte "sistema_protocolos"</div>
                <div className="text-blue-600">[07:00:00] Iniciado backup automático do data warehouse</div>
                <div className="text-green-600">[06:58:45] Backup concluído com sucesso - 2.4TB</div>
              </div>
            </CardContent>
          </Card>

          {/* Recursos do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memória</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Armazenamento</span>
                    <span>32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Rede</span>
                    <span>23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}