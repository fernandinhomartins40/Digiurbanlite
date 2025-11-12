'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Target, Users, DollarSign, BarChart3, Crown, Building2, Zap, Award } from 'lucide-react'
import { KPICard } from '../KPICard'
import { AnalyticsLineChart, AnalyticsBarChart, AnalyticsPieChart, AnalyticsAreaChart, GaugeChart, HeatMap } from '../Charts'
// LEGADO: import { useDashboards, useBenchmarks, useKPIs } from '@/hooks/api/analytics'

interface ExecutiveDashboardProps {
  executiveId?: string
  municipality?: string
}

export function ExecutiveDashboard({ executiveId, municipality }: ExecutiveDashboardProps) {
  const [dashboardLoading, setDashboardLoading] = useState(false);
  // LEGADO: const { calculateOverallScore } = useKPIs()
  const calculateOverallScore = (data: any) => 0; // TODO: Implementar
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
  }, [executiveId])

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

  const { metrics, cityPerformance, citizenMetrics, financialMetrics, strategicGoals } = dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel Executivo</h1>
          <p className="text-muted-foreground">
            Visão estratégica da administração municipal • {municipality}
          </p>
        </div>
        <Badge variant="default" className="h-6 bg-gradient-to-r from-purple-600 to-blue-600">
          <Crown className="h-4 w-4 mr-1" />
          Executivo
        </Badge>
      </div>

      {/* KPIs Executivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Índice de Satisfação"
          value={metrics?.citizenSatisfactionIndex || 0}
          unit="/10"
          target={8.0}
          warning={7.0}
          critical={6.0}
          status={metrics?.citizenSatisfactionIndex >= 8.0 ? 'good' :
                   metrics?.citizenSatisfactionIndex >= 7.0 ? 'warning' : 'critical'}
          trend={metrics?.satisfactionTrend}
          trendValue={metrics?.satisfactionChange}
          description="Índice geral de satisfação dos cidadãos"
          size="md"
        />

        <KPICard
          title="Eficiência Municipal"
          value={metrics?.municipalEfficiency || 0}
          unit="%"
          target={85}
          warning={75}
          critical={65}
          status={metrics?.municipalEfficiency >= 85 ? 'good' :
                   metrics?.municipalEfficiency >= 75 ? 'warning' : 'critical'}
          trend={metrics?.efficiencyTrend}
          trendValue={metrics?.efficiencyChange}
          description="Eficiência geral da administração"
          size="md"
        />

        <KPICard
          title="Transparência"
          value={metrics?.transparencyScore || 0}
          unit="/10"
          target={9.0}
          warning={8.0}
          critical={7.0}
          status={metrics?.transparencyScore >= 9.0 ? 'good' :
                   metrics?.transparencyScore >= 8.0 ? 'warning' : 'critical'}
          description="Índice de transparência pública"
          size="md"
        />

        <KPICard
          title="Cobertura Digital"
          value={metrics?.digitalCoverage || 0}
          unit="%"
          target={80}
          warning={65}
          critical={50}
          status={metrics?.digitalCoverage >= 80 ? 'good' :
                   metrics?.digitalCoverage >= 65 ? 'warning' : 'critical'}
          trend={metrics?.digitalTrend}
          trendValue={metrics?.digitalChange}
          description="Percentual de serviços digitalizados"
          size="md"
        />
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Resumo Executivo</TabsTrigger>
          <TabsTrigger value="citizens">Cidadãos</TabsTrigger>
          <TabsTrigger value="finances">Financeiro</TabsTrigger>
          <TabsTrigger value="strategic">Metas Estratégicas</TabsTrigger>
          <TabsTrigger value="governance">Governança</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {/* Scorecard Geral */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <CardTitle className="text-center text-sm flex items-center justify-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Cidadãos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.citizenScore || 0}
                  max={100}
                  unit=""
                  color="#3B82F6"
                  size={120}
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <CardTitle className="text-center text-sm flex items-center justify-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Financeiro</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.financialScore || 0}
                  max={100}
                  unit=""
                  color="#10B981"
                  size={120}
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <CardTitle className="text-center text-sm flex items-center justify-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Estratégico</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.strategicScore || 0}
                  max={100}
                  unit=""
                  color="#8B5CF6"
                  size={120}
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader>
                <CardTitle className="text-center text-sm flex items-center justify-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Inovação</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GaugeChart
                  value={metrics?.innovationScore || 0}
                  max={100}
                  unit=""
                  color="#F59E0B"
                  size={120}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance da Cidade */}
            <AnalyticsLineChart
              title="Performance Geral da Cidade"
              data={cityPerformance || []}
              xKey="month"
              yKey={["satisfaction", "efficiency", "transparency", "innovation"]}
              colors={["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"]}
              height={300}
            />

            {/* Distribuição de Recursos */}
            <AnalyticsPieChart
              title="Distribuição de Recursos por Área"
              data={dashboardData?.resourceDistribution || []}
              dataKey="budget"
              nameKey="area"
              height={300}
            />
          </div>

          {/* Principais Conquistas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span>Principais Conquistas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData?.achievements?.map((achievement: any, index: number) => (
                  <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-200 rounded-full">
                        <Award className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <p className="text-xs text-yellow-600 mt-1">{achievement.date}</p>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8 col-span-3">
                    Carregando conquistas...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="citizens" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Engajamento dos Cidadãos */}
            <AnalyticsAreaChart
              title="Engajamento dos Cidadãos"
              data={citizenMetrics || []}
              xKey="month"
              yKey={["activeUsers", "newRegistrations", "serviceUsage"]}
              colors={["#3B82F6", "#10B981", "#F59E0B"]}
              height={300}
            />

            {/* Canais de Atendimento */}
            <AnalyticsBarChart
              title="Uso dos Canais de Atendimento"
              data={dashboardData?.channelUsage || []}
              xKey="channel"
              yKey="usage"
              colors={["#8B5CF6"]}
              height={300}
            />
          </div>

          {/* Dados Demográficos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Demografia dos Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { age: '18-30', percentage: 35, count: dashboardData?.demographics?.young || 0 },
                    { age: '31-50', percentage: 40, count: dashboardData?.demographics?.adult || 0 },
                    { age: '51+', percentage: 25, count: dashboardData?.demographics?.senior || 0 }
                  ].map((demo, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{demo.age} anos</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${demo.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs">{demo.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Satisfação por Região</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.regionSatisfaction?.map((region: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{region.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant={region.score >= 4 ? 'default' :
                                      region.score >= 3 ? 'secondary' : 'destructive'}>
                          {region.score}/5
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-xs text-muted-foreground">Dados não disponíveis</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Serviços Mais Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData?.topServices?.map((service: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{service.name}</span>
                      <Badge variant="outline">{service.usage}</Badge>
                    </div>
                  )) || (
                    <p className="text-xs text-muted-foreground">Carregando...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback dos Cidadãos */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback dos Cidadãos - Últimas Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.recentFeedback?.map((feedback: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{feedback.service}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < feedback.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{feedback.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{feedback.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {feedback.region} • {feedback.citizen}
                    </p>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum feedback recente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Execução Orçamentária */}
            <AnalyticsLineChart
              title="Execução Orçamentária Anual"
              data={financialMetrics || []}
              xKey="month"
              yKey={["planned", "executed", "revenue"]}
              colors={["#94A3B8", "#3B82F6", "#10B981"]}
              height={300}
            />

            {/* ROI de Investimentos em Tecnologia */}
            <AnalyticsBarChart
              title="ROI - Investimentos em Tecnologia"
              data={dashboardData?.techROI || []}
              xKey="investment"
              yKey="roi"
              colors={["#8B5CF6"]}
              height={300}
            />
          </div>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100">
              <CardHeader>
                <CardTitle className="text-sm text-green-800">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-900">
                  R$ {(dashboardData?.financial?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{dashboardData?.financial?.revenueGrowth || 0}% vs ano anterior
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <CardTitle className="text-sm text-blue-800">Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-900">
                  R$ {(dashboardData?.financial?.totalExpenses || 0).toLocaleString()}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {dashboardData?.financial?.expenseChange || 0}% vs planejado
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <CardTitle className="text-sm text-purple-800">Economia Gerada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-900">
                  R$ {(dashboardData?.financial?.savings || 0).toLocaleString()}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  Via digitalização
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader>
                <CardTitle className="text-sm text-orange-800">Investimento Digital</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-900">
                  R$ {(dashboardData?.financial?.digitalInvestment || 0).toLocaleString()}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  ROI de {dashboardData?.financial?.digitalROI || 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Análise de Custos por Área */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnalyticsPieChart
              title="Distribuição de Custos por Secretaria"
              data={dashboardData?.costsByDepartment || []}
              dataKey="cost"
              nameKey="department"
              height={300}
            />

            <Card>
              <CardHeader>
                <CardTitle>Eficiência de Custos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.costEfficiency?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.metric}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {item.value.toLocaleString()}</p>
                        <Badge variant={item.trend === 'down' ? 'default' : 'destructive'}>
                          {item.trend === 'down' ? '↓' : '↑'} {item.change}%
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">
                      Análise em andamento...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Progresso das Metas Estratégicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Metas Estratégicas 2024</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategicGoals?.map((goal: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{goal.name}</span>
                        <Badge variant={goal.status === 'achieved' ? 'default' :
                                      goal.status === 'on-track' ? 'secondary' :
                                      goal.status === 'at-risk' ? 'destructive' : 'outline'}>
                          {Math.round((goal.current / goal.target) * 100)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            goal.status === 'achieved' ? 'bg-green-500' :
                            goal.status === 'on-track' ? 'bg-blue-500' :
                            goal.status === 'at-risk' ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{goal.current} de {goal.target} {goal.unit}</span>
                        <span>Prazo: {goal.deadline}</span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">
                      Carregando metas estratégicas...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Evolução das Metas */}
            <AnalyticsLineChart
              title="Evolução das Metas Estratégicas"
              data={dashboardData?.goalsProgress || []}
              xKey="month"
              yKey={["digitalTransformation", "citizenSatisfaction", "operationalEfficiency", "sustainability"]}
              colors={["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"]}
              height={300}
            />
          </div>

          {/* Projetos Estratégicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Projetos Estratégicos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData?.strategicProjects?.map((project: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{project.name}</h4>
                      <Badge variant={
                        project.status === 'completed' ? 'default' :
                        project.status === 'on-track' ? 'secondary' :
                        project.status === 'delayed' ? 'destructive' : 'outline'
                      }>
                        {project.statusLabel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso:</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Investimento: R$ {project.investment?.toLocaleString()}</span>
                        <span>Prazo: {project.deadline}</span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8 col-span-2">
                    Carregando projetos estratégicos...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Índices de Transparência */}
            <AnalyticsBarChart
              title="Índices de Governança"
              data={dashboardData?.governanceIndices || []}
              xKey="index"
              yKey="score"
              colors={["#10B981"]}
              height={300}
            />

            {/* Compliance e Conformidade */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance & Conformidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Lei de Acesso à Informação', score: 95, status: 'good' },
                    { name: 'LGPD - Lei Geral de Proteção de Dados', score: 88, status: 'good' },
                    { name: 'Transparência Ativa', score: 92, status: 'good' },
                    { name: 'Portal da Transparência', score: 85, status: 'good' },
                    { name: 'Participação Social', score: 78, status: 'warning' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <div className="w-48 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              item.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                      <Badge variant={item.status === 'good' ? 'default' : 'secondary'}>
                        {item.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Participação Cidadã */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Audiências Públicas</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {dashboardData?.governance?.publicHearings || 0}
                </p>
                <p className="text-sm text-muted-foreground">Este ano</p>
                <Badge variant="secondary" className="mt-2">
                  +{dashboardData?.governance?.hearingsGrowth || 0}% vs 2023
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Consultas Públicas</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {dashboardData?.governance?.publicConsultations || 0}
                </p>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <Badge variant="default" className="mt-2">
                  {dashboardData?.governance?.participationRate || 0}% participação
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conselhos Ativos</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {dashboardData?.governance?.activeCouncils || 0}
                </p>
                <p className="text-sm text-muted-foreground">Conselhos municipais</p>
                <Badge variant="outline" className="mt-2">
                  {dashboardData?.governance?.councilsEffectiveness || 0}% efetividade
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Relatórios de Governança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Relatórios Executivos Disponíveis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Relatório de Gestão Anual', description: 'Resumo executivo das ações e resultados do ano' },
                  { name: 'Balanço Social', description: 'Impacto social das políticas públicas implementadas' },
                  { name: 'Relatório de Transparência', description: 'Cumprimento dos indicadores de transparência' },
                  { name: 'Avaliação de Políticas Públicas', description: 'Efetividade das principais políticas implementadas' },
                  { name: 'Relatório de Satisfação Cidadã', description: 'Percepção dos cidadãos sobre os serviços públicos' },
                  { name: 'Dashboard de Indicadores', description: 'Painel interativo com os principais indicadores municipais' }
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