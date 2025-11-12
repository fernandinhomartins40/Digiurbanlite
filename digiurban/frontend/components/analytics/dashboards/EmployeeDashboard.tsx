'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Clock, CheckCircle, TrendingUp, FileText, AlertTriangle, Target } from 'lucide-react'
import { KPICard } from '../KPICard'
import { AnalyticsLineChart, AnalyticsBarChart, AnalyticsPieChart, AnalyticsAreaChart } from '../Charts'
// LEGADO: import { useDashboards } from '@/hooks/api/analytics'

interface EmployeeDashboardProps {
  employeeId?: string
  department?: string
}

export function EmployeeDashboard({ employeeId, department }: EmployeeDashboardProps) {
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
  }, [employeeId])

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

  const { metrics, workloadData, performanceData, protocolsByType, satisfactionTrend } = dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel do Funcionário</h1>
          <p className="text-muted-foreground">
            Acompanhe seu desempenho e produtividade • {department}
          </p>
        </div>
        <Badge variant="secondary" className="h-6">
          Funcionário
        </Badge>
      </div>

      {/* KPIs Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Protocolos Atribuídos"
          value={metrics?.assignedProtocols || 0}
          trend={metrics?.assignedTrend}
          trendValue={metrics?.assignedChange}
          status={metrics?.assignedProtocols > 20 ? 'warning' : 'normal'}
          description="Protocolos sob sua responsabilidade"
        />

        <KPICard
          title="Taxa de Resolução"
          value={metrics?.resolutionRate || 0}
          unit="%"
          target={85}
          warning={70}
          critical={50}
          status={metrics?.resolutionRate >= 85 ? 'good' :
                   metrics?.resolutionRate >= 70 ? 'warning' : 'critical'}
          trend={metrics?.resolutionTrend}
          trendValue={metrics?.resolutionChange}
          description="Percentual de protocolos resolvidos"
        />

        <KPICard
          title="Tempo Médio"
          value={metrics?.avgResolutionTime || 0}
          unit="h"
          target={24}
          warning={48}
          critical={72}
          status={metrics?.avgResolutionTime <= 24 ? 'good' :
                   metrics?.avgResolutionTime <= 48 ? 'warning' : 'critical'}
          description="Tempo médio de resolução"
        />

        <KPICard
          title="Satisfação Média"
          value={metrics?.avgSatisfaction || 0}
          unit="/5"
          target={4.0}
          warning={3.5}
          critical={3.0}
          status={metrics?.avgSatisfaction >= 4.0 ? 'good' :
                   metrics?.avgSatisfaction >= 3.5 ? 'warning' : 'critical'}
          trend={metrics?.satisfactionTrend}
          trendValue={metrics?.satisfactionChange}
          description="Avaliação média dos cidadãos"
        />
      </div>

      <Tabs defaultValue="workload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workload">Carga de Trabalho</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quality">Qualidade</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="workload" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Evolução da Carga de Trabalho */}
            <AnalyticsAreaChart
              title="Carga de Trabalho - Últimos 30 Dias"
              data={workloadData || []}
              xKey="date"
              yKey={["assigned", "completed", "pending"]}
              colors={["#3B82F6", "#10B981", "#F59E0B"]}
              height={300}
              stacked
            />

            {/* Distribuição por Tipo de Protocolo */}
            <AnalyticsPieChart
              title="Protocolos por Tipo"
              data={protocolsByType || []}
              dataKey="count"
              nameKey="type"
              height={300}
            />
          </div>

          {/* Tabela de Protocolos Ativos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Protocolos Ativos</span>
                <Badge variant="secondary">{dashboardData?.activeProtocols?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.activeProtocols?.map((protocol: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        protocol.priority === 'high' ? 'bg-red-100' :
                        protocol.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        {protocol.priority === 'high' ?
                          <AlertTriangle className="h-4 w-4 text-red-600" /> :
                          <Clock className="h-4 w-4 text-yellow-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium">{protocol.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {protocol.citizen} • {protocol.timeOpen}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        protocol.priority === 'high' ? 'destructive' :
                        protocol.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {protocol.priority}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum protocolo ativo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance Mensal */}
            <AnalyticsLineChart
              title="Performance Mensal"
              data={performanceData || []}
              xKey="month"
              yKey={["resolved", "onTime", "firstTime"]}
              colors={["#10B981", "#3B82F6", "#8B5CF6"]}
              height={300}
            />

            {/* Comparação com Média do Departamento */}
            <AnalyticsBarChart
              title="vs. Média do Departamento"
              data={dashboardData?.departmentComparison || []}
              xKey="metric"
              yKey={["employee", "department"]}
              colors={["#3B82F6", "#94A3B8"]}
              height={300}
            />
          </div>

          {/* Estatísticas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Resolvidos</span>
                    <span className="font-medium">{metrics?.weeklyResolved || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">No Prazo</span>
                    <span className="font-medium">{metrics?.weeklyOnTime || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Primeira Tentativa</span>
                    <span className="font-medium">{metrics?.weeklyFirstTime || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Resolvidos</span>
                    <span className="font-medium">{metrics?.monthlyResolved || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">No Prazo</span>
                    <span className="font-medium">{metrics?.monthlyOnTime || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Primeira Tentativa</span>
                    <span className="font-medium">{metrics?.monthlyFirstTime || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Departamento</span>
                    <Badge variant="secondary">{metrics?.departmentRank || '-'}º</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Geral</span>
                    <Badge variant="secondary">{metrics?.generalRank || '-'}º</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Satisfação</span>
                    <Badge variant="secondary">{metrics?.satisfactionRank || '-'}º</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Evolução da Satisfação */}
            <AnalyticsLineChart
              title="Evolução da Satisfação"
              data={satisfactionTrend || []}
              xKey="date"
              yKey="satisfaction"
              colors={["#10B981"]}
              height={300}
            />

            {/* Distribuição de Avaliações */}
            <AnalyticsBarChart
              title="Distribuição de Avaliações"
              data={[
                { stars: '5 ⭐', count: dashboardData?.reviews?.five || 0 },
                { stars: '4 ⭐', count: dashboardData?.reviews?.four || 0 },
                { stars: '3 ⭐', count: dashboardData?.reviews?.three || 0 },
                { stars: '2 ⭐', count: dashboardData?.reviews?.two || 0 },
                { stars: '1 ⭐', count: dashboardData?.reviews?.one || 0 }
              ]}
              xKey="stars"
              yKey="count"
              colors={["#F59E0B"]}
              height={300}
            />
          </div>

          {/* Feedback Recente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Feedback dos Cidadãos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentFeedback?.map((feedback: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{feedback.citizen}</span>
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
                      Protocolo: {feedback.protocolId}
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

        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Progresso das Metas Mensais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Metas do Mês</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData?.monthlyGoals?.map((goal: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{goal.name}</span>
                      <Badge variant={goal.progress >= 100 ? 'default' :
                                    goal.progress >= 80 ? 'secondary' : 'outline'}>
                        {goal.progress}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{goal.current} de {goal.target}</span>
                      <span>{goal.remaining} restantes</span>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma meta definida
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Histórico de Cumprimento de Metas */}
            <AnalyticsLineChart
              title="Cumprimento de Metas"
              data={dashboardData?.goalsHistory || []}
              xKey="month"
              yKey={["achieved", "target"]}
              colors={["#10B981", "#94A3B8"]}
              height={300}
            />
          </div>

          {/* Conquistas e Reconhecimentos */}
          <Card>
            <CardHeader>
              <CardTitle>Conquistas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData?.achievements?.map((achievement: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="p-2 bg-green-200 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{achievement.name}</p>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      <p className="text-xs text-muted-foreground">{achievement.date}</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8 col-span-2">
                    Nenhuma conquista recente
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