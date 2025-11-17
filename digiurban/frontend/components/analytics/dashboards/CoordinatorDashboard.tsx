'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, TrendingUp, AlertTriangle, Target, Activity, BarChart3, Clock } from 'lucide-react'
import { KPICard } from '../KPICard'
import { AnalyticsLineChart, AnalyticsBarChart, AnalyticsPieChart, AnalyticsAreaChart, GaugeChart } from '../Charts'
// LEGADO: import { useDashboards } from '@/hooks/api/analytics'

interface CoordinatorDashboardProps {
  coordinatorId?: string
  department?: string
}

export function CoordinatorDashboard({ coordinatorId, department }: CoordinatorDashboardProps) {
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      setDashboardLoading(true);
      // TODO: Implementar via API
      const data = null;
      setDashboardLoading(false);
      setDashboardData(data)
    }
    loadDashboard()
  }, [coordinatorId])

  if (dashboardLoading || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    )
  }

  const { metrics, teamPerformance, workloadDistribution, alertsData, trendsData } = dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel de Coordenação</h1>
          <p className="text-muted-foreground">
            Gestão de equipe e supervisão operacional • {department}
          </p>
        </div>
        <Badge variant="default" className="h-6">
          Coordenador
        </Badge>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Equipe Ativa"
          value={metrics?.activeEmployees || 0}
          description="Funcionários sob sua coordenação"
          status="good"
        />

        <KPICard
          title="Eficiência da Equipe"
          value={metrics?.teamEfficiency || 0}
          unit="%"
          target={85}
          warning={70}
          critical={60}
          status={metrics?.teamEfficiency >= 85 ? 'good' :
                   metrics?.teamEfficiency >= 70 ? 'warning' : 'critical'}
          trend={metrics?.efficiencyTrend}
          trendValue={metrics?.efficiencyChange}
          description="Performance geral da equipe"
        />

        <KPICard
          title="SLA Cumprimento"
          value={metrics?.slaCompliance || 0}
          unit="%"
          target={90}
          warning={80}
          critical={70}
          status={metrics?.slaCompliance >= 90 ? 'good' :
                   metrics?.slaCompliance >= 80 ? 'warning' : 'critical'}
          description="Protocolos resolvidos no prazo"
        />

        <KPICard
          title="Alertas Ativos"
          value={metrics?.activeAlerts || 0}
          status={metrics?.activeAlerts === 0 ? 'good' :
                   metrics?.activeAlerts <= 3 ? 'warning' : 'critical'}
          trend={metrics?.alertsTrend}
          trendValue={metrics?.alertsChange}
          description="Alertas que requerem atenção"
        />
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="workload">Carga de Trabalho</TabsTrigger>
          <TabsTrigger value="quality">Qualidade</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance da Equipe */}
            <AnalyticsBarChart
              title="Performance por Funcionário"
              data={teamPerformance || []}
              xKey="employee"
              yKey="performance"
              colors={["#3B82F6"]}
              height={300}
            />

            {/* Distribuição de Protocolos */}
            <AnalyticsPieChart
              title="Distribuição de Protocolos"
              data={dashboardData?.protocolDistribution || []}
              dataKey="count"
              nameKey="employee"
              height={300}
            />
          </div>

          {/* Ranking da Equipe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Ranking da Equipe</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.teamRanking?.map((employee: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{employee.score} pts</p>
                      <p className="text-sm text-muted-foreground">{employee.resolved} resolvidos</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Dados da equipe não disponíveis
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Carga de Trabalho por Período */}
            <AnalyticsAreaChart
              title="Carga de Trabalho - Últimos 30 Dias"
              data={workloadDistribution || []}
              xKey="date"
              yKey={["assigned", "completed", "pending"]}
              colors={["#3B82F6", "#10B981", "#F59E0B"]}
              height={300}
              stacked
            />

            {/* Capacidade vs Demanda */}
            <AnalyticsLineChart
              title="Capacidade vs Demanda"
              data={dashboardData?.capacityData || []}
              xKey="week"
              yKey={["capacity", "demand"]}
              colors={["#10B981", "#EF4444"]}
              height={300}
            />
          </div>

          {/* Métricas de Produtividade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Produtividade Geral</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.productivity || 0}
                  max={100}
                  unit="%"
                  color="#10B981"
                  size={160}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Eficiência Temporal</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.timeEfficiency || 0}
                  max={100}
                  unit="%"
                  color="#3B82F6"
                  size={160}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Qualidade</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.qualityScore || 0}
                  max={100}
                  unit="%"
                  color="#8B5CF6"
                  size={160}
                />
              </CardContent>
            </Card>
          </div>

          {/* Gargalos Identificados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Gargalos Identificados</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.bottlenecks?.map((bottleneck: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">{bottleneck.area}</p>
                      <p className="text-sm text-muted-foreground">{bottleneck.description}</p>
                    </div>
                    <Badge variant="secondary">
                      {bottleneck.impact}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum gargalo identificado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Evolução da Qualidade */}
            <AnalyticsLineChart
              title="Evolução da Qualidade"
              data={dashboardData?.qualityTrend || []}
              xKey="month"
              yKey={["satisfaction", "firstTimeResolution", "slaCompliance"]}
              colors={["#10B981", "#3B82F6", "#8B5CF6"]}
              height={300}
            />

            {/* Indicadores de Qualidade */}
            <AnalyticsBarChart
              title="Indicadores de Qualidade por Funcionário"
              data={dashboardData?.qualityByEmployee || []}
              xKey="employee"
              yKey="qualityScore"
              colors={["#F59E0B"]}
              height={300}
            />
          </div>

          {/* Metas de Qualidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Metas de Qualidade</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboardData?.qualityGoals?.map((goal: any, index: number) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{goal.name}</span>
                      <Badge variant={goal.status === 'achieved' ? 'default' :
                                    goal.status === 'on-track' ? 'secondary' : 'destructive'}>
                        {goal.current}/{goal.target}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          goal.status === 'achieved' ? 'bg-green-500' :
                          goal.status === 'on-track' ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8 col-span-2">
                    Nenhuma meta de qualidade definida
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Alertas por Categoria */}
            <AnalyticsPieChart
              title="Alertas por Categoria"
              data={alertsData || []}
              dataKey="count"
              nameKey="category"
              height={300}
            />

            {/* Tendência de Alertas */}
            <AnalyticsLineChart
              title="Tendência de Alertas"
              data={dashboardData?.alertsTrend || []}
              xKey="date"
              yKey={["created", "resolved"]}
              colors={["#EF4444", "#10B981"]}
              height={300}
            />
          </div>

          {/* Alertas Ativos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Alertas Ativos</span>
                <Badge variant="destructive">{dashboardData?.activeAlerts?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.activeAlerts?.map((alert: any, index: number) => (
                  <div key={index} className={`p-3 border-l-4 rounded-r-lg ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    'border-yellow-500 bg-yellow-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline">{alert.category}</Badge>
                          <span className="text-xs text-muted-foreground">{alert.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'high' ? 'default' : 'secondary'
                        }>
                          {alert.severity}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Resolver
                        </Button>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum alerta ativo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tendências Operacionais */}
            <AnalyticsAreaChart
              title="Tendências Operacionais"
              data={trendsData || []}
              xKey="month"
              yKey={["protocolsReceived", "protocolsResolved", "avgResolutionTime"]}
              colors={["#3B82F6", "#10B981", "#F59E0B"]}
              height={300}
            />

            {/* Comparativo Mensal */}
            <AnalyticsBarChart
              title="Comparativo Mensal"
              data={dashboardData?.monthlyComparison || []}
              xKey="metric"
              yKey={["thisMonth", "lastMonth"]}
              colors={["#3B82F6", "#94A3B8"]}
              height={300}
            />
          </div>

          {/* Relatórios Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Relatórios Disponíveis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Relatório de Performance da Equipe', description: 'Análise detalhada do desempenho individual e coletivo' },
                  { name: 'Relatório de SLA', description: 'Cumprimento de prazos e metas de atendimento' },
                  { name: 'Relatório de Qualidade', description: 'Métricas de satisfação e qualidade do atendimento' },
                  { name: 'Relatório de Capacidade', description: 'Análise de capacidade vs demanda da equipe' },
                  { name: 'Relatório de Gargalos', description: 'Identificação e análise de pontos de melhoria' },
                  { name: 'Relatório Executivo', description: 'Resumo executivo para apresentação à gestão' }
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Gerar
                    </Button>
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