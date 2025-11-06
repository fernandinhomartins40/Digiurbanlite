'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Users, Target, DollarSign, BarChart3, AlertTriangle, Building, Calendar } from 'lucide-react'
import { KPICard } from '../KPICard'
import { AnalyticsLineChart, AnalyticsBarChart, AnalyticsPieChart, AnalyticsAreaChart, GaugeChart, HeatMap } from '../Charts'
// LEGADO: import { useDashboards, useBenchmarks } from '@/hooks/api/analytics'

interface ManagerDashboardProps {
  managerId?: string
  departments?: string[]
}

export function ManagerDashboard({ managerId, departments }: ManagerDashboardProps) {
  const [dashboardLoading, setDashboardLoading] = useState(false);
  // LEGADO: const { comparisons } = useBenchmarks()
  const comparisons: any[] = []; // TODO: Implementar
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
  }, [managerId])

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

  const { metrics, departmentPerformance, budgetData, strategicKpis, trendsData } = dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel Gerencial</h1>
          <p className="text-muted-foreground">
            Visão estratégica e gestão departamental • {departments?.join(', ')}
          </p>
        </div>
        <Badge variant="default" className="h-6 bg-purple-600">
          Gerente
        </Badge>
      </div>

      {/* KPIs Estratégicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Eficiência Geral"
          value={metrics?.overallEfficiency || 0}
          unit="%"
          target={90}
          warning={80}
          critical={70}
          status={metrics?.overallEfficiency >= 90 ? 'good' :
                   metrics?.overallEfficiency >= 80 ? 'warning' : 'critical'}
          trend={metrics?.efficiencyTrend}
          trendValue={metrics?.efficiencyChange}
          description="Performance geral dos departamentos"
        />

        <KPICard
          title="Custo por Protocolo"
          value={metrics?.costPerProtocol || 0}
          unit="R$"
          target={25}
          warning={35}
          critical={50}
          status={metrics?.costPerProtocol <= 25 ? 'good' :
                   metrics?.costPerProtocol <= 35 ? 'warning' : 'critical'}
          trend={metrics?.costTrend}
          trendValue={metrics?.costChange}
          description="Custo operacional por protocolo"
        />

        <KPICard
          title="Satisfação Geral"
          value={metrics?.overallSatisfaction || 0}
          unit="/5"
          target={4.2}
          warning={3.8}
          critical={3.5}
          status={metrics?.overallSatisfaction >= 4.2 ? 'good' :
                   metrics?.overallSatisfaction >= 3.8 ? 'warning' : 'critical'}
          description="Satisfação média dos cidadãos"
        />

        <KPICard
          title="ROI Digital"
          value={metrics?.digitalROI || 0}
          unit="%"
          target={150}
          warning={120}
          critical={100}
          status={metrics?.digitalROI >= 150 ? 'good' :
                   metrics?.digitalROI >= 120 ? 'warning' : 'critical'}
          trend={metrics?.roiTrend}
          trendValue={metrics?.roiChange}
          description="Retorno do investimento em digitalização"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="budget">Orçamento</TabsTrigger>
          <TabsTrigger value="strategic">Estratégico</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tendências Gerais */}
            <AnalyticsAreaChart
              title="Tendências Operacionais"
              data={trendsData || []}
              xKey="month"
              yKey={["protocolsReceived", "protocolsResolved", "backlog"]}
              colors={["#3B82F6", "#10B981", "#F59E0B"]}
              height={300}
              stacked={false}
            />

            {/* Performance por Departamento */}
            <AnalyticsBarChart
              title="Performance por Departamento"
              data={departmentPerformance || []}
              xKey="department"
              yKey="efficiency"
              colors={["#8B5CF6"]}
              height={300}
            />
          </div>

          {/* Indicadores de Saúde */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-sm">Operacional</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.operationalHealth || 0}
                  max={100}
                  unit="%"
                  color="#10B981"
                  size={120}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center text-sm">Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.financialHealth || 0}
                  max={100}
                  unit="%"
                  color="#3B82F6"
                  size={120}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center text-sm">Qualidade</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.qualityHealth || 0}
                  max={100}
                  unit="%"
                  color="#F59E0B"
                  size={120}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center text-sm">Estratégico</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.strategicHealth || 0}
                  max={100}
                  unit="%"
                  color="#8B5CF6"
                  size={120}
                />
              </CardContent>
            </Card>
          </div>

          {/* Alertas Críticos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Alertas Críticos</span>
                <Badge variant="destructive">{dashboardData?.criticalAlerts?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.criticalAlerts?.map((alert: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                    <div>
                      <p className="font-medium text-red-800">{alert.title}</p>
                      <p className="text-sm text-red-600">{alert.description}</p>
                      <p className="text-xs text-red-500 mt-1">{alert.department} • {alert.createdAt}</p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Ação Imediata
                    </Button>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum alerta crítico no momento
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Mapa de Calor de Performance */}
            <HeatMap
              title="Mapa de Performance por Departamento"
              data={dashboardData?.departmentHeatMap || []}
              xKey="department"
              yKey="metric"
              valueKey="value"
              colors={['#FEF3C7', '#F59E0B', '#DC2626']}
            />

            {/* Comparativo de Departamentos */}
            <AnalyticsBarChart
              title="Comparativo de Departamentos"
              data={dashboardData?.departmentComparison || []}
              xKey="department"
              yKey={["efficiency", "satisfaction", "cost"]}
              colors={["#10B981", "#3B82F6", "#EF4444"]}
              height={300}
            />
          </div>

          {/* Ranking de Departamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Ranking de Departamentos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.departmentRanking?.map((dept: any, index: number) => (
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
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">{dept.coordinator}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{dept.efficiency}% eficiência</Badge>
                        <Badge variant={dept.trend === 'up' ? 'default' : 'destructive'}>
                          {dept.trend === 'up' ? '↗' : '↘'} {dept.change}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dept.protocolsResolved} protocolos resolvidos
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Dados dos departamentos não disponíveis
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Execução Orçamentária */}
            <AnalyticsLineChart
              title="Execução Orçamentária"
              data={budgetData || []}
              xKey="month"
              yKey={["planned", "executed"]}
              colors={["#94A3B8", "#3B82F6"]}
              height={300}
            />

            {/* Custos por Categoria */}
            <AnalyticsPieChart
              title="Distribuição de Custos"
              data={dashboardData?.costDistribution || []}
              dataKey="amount"
              nameKey="category"
              height={300}
            />
          </div>

          {/* Análise de Custos Detalhada */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Custos Operacionais</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Pessoal</span>
                    <span className="font-medium">R$ {(dashboardData?.costs?.personnel || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tecnologia</span>
                    <span className="font-medium">R$ {(dashboardData?.costs?.technology || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Infraestrutura</span>
                    <span className="font-medium">R$ {(dashboardData?.costs?.infrastructure || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total</span>
                    <span>R$ {(dashboardData?.costs?.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eficiência de Custos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Custo/Protocolo</span>
                    <Badge variant="secondary">R$ {metrics?.costPerProtocol || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo/Cidadão</span>
                    <Badge variant="secondary">R$ {metrics?.costPerCitizen || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>ROI Digital</span>
                    <Badge variant="default">{metrics?.digitalROI || 0}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projeções</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Economia Esperada</span>
                    <span className="font-medium text-green-600">
                      R$ {(dashboardData?.projections?.savings || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Investimento Necessário</span>
                    <span className="font-medium">
                      R$ {(dashboardData?.projections?.investment || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payback</span>
                    <Badge variant="outline">{dashboardData?.projections?.payback || 0} meses</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* KPIs Estratégicos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>KPIs Estratégicos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategicKpis?.map((kpi: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{kpi.name}</span>
                        <Badge variant={kpi.status === 'good' ? 'default' :
                                      kpi.status === 'warning' ? 'secondary' : 'destructive'}>
                          {kpi.current}/{kpi.target}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            kpi.status === 'good' ? 'bg-green-500' :
                            kpi.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{kpi.description}</span>
                        <span>{Math.round((kpi.current / kpi.target) * 100)}%</span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">
                      KPIs estratégicos não definidos
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Evolução dos KPIs */}
            <AnalyticsLineChart
              title="Evolução dos KPIs Estratégicos"
              data={dashboardData?.strategicTrends || []}
              xKey="month"
              yKey={["digitalAdoption", "citizenSatisfaction", "operationalEfficiency"]}
              colors={["#3B82F6", "#10B981", "#8B5CF6"]}
              height={300}
            />
          </div>

          {/* Iniciativas Estratégicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Iniciativas Estratégicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.strategicInitiatives?.map((initiative: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{initiative.name}</h4>
                      <Badge variant={
                        initiative.status === 'completed' ? 'default' :
                        initiative.status === 'on-track' ? 'secondary' :
                        initiative.status === 'at-risk' ? 'destructive' : 'outline'
                      }>
                        {initiative.statusLabel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{initiative.description}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Progresso</span>
                      <span className="text-sm font-medium">{initiative.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${initiative.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>Prazo: {initiative.deadline}</span>
                      <span>Responsável: {initiative.responsible}</span>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma iniciativa estratégica em andamento
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Comparação com Outros Municípios */}
            <AnalyticsBarChart
              title="Comparação com Municípios Similares"
              data={dashboardData?.municipalComparison || []}
              xKey="metric"
              yKey={["myMunicipality", "average", "best"]}
              colors={["#3B82F6", "#94A3B8", "#10B981"]}
              height={300}
            />

            {/* Ranking Nacional */}
            <Card>
              <CardHeader>
                <CardTitle>Posição no Ranking Nacional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.nationalRanking?.map((rank: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{rank.metric}</p>
                        <p className="text-sm text-muted-foreground">{rank.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={rank.position <= 100 ? 'default' :
                                      rank.position <= 500 ? 'secondary' : 'outline'}>
                          {rank.position}º de {rank.total}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Percentil {rank.percentile}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">
                      Dados de benchmark não disponíveis
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Oportunidades de Melhoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Oportunidades de Melhoria</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData?.improvements?.map((improvement: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{improvement.area}</h4>
                      <Badge variant="outline">{improvement.impact}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{improvement.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Posição Atual:</span>
                        <span>{improvement.currentPosition}º</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Potencial:</span>
                        <span className="text-green-600">{improvement.potential}º</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Esforço:</span>
                        <Badge variant="secondary">{improvement.effort}</Badge>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8 col-span-2">
                    Análise de melhorias em andamento
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}