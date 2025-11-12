'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Clock, CheckCircle, AlertCircle, MessageSquare, Star } from 'lucide-react'
import { KPICard } from '../KPICard'
import { AnalyticsLineChart, AnalyticsBarChart, AnalyticsPieChart } from '../Charts'
// LEGADO: import { useAnalytics, useDashboards } from '@/hooks/api/analytics'

interface CitizenDashboardProps {
  citizenId?: string
}

export function CitizenDashboard({ citizenId }: CitizenDashboardProps) {
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      setDashboardLoading(true);
      // TODO: Implementar via API
      setDashboardData(null);
      setDashboardLoading(false);
    }
    loadDashboard()
  }, [citizenId])

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

  const { metrics, protocolHistory, satisfactionData, serviceUsage } = dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meu Painel</h1>
          <p className="text-muted-foreground">Acompanhe seus protocolos e serviços utilizados</p>
        </div>
        <Badge variant="secondary" className="h-6">
          Cidadão
        </Badge>
      </div>

      {/* KPIs Pessoais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Protocolos Ativos"
          value={metrics?.activeProtocols || 0}
          status={metrics?.activeProtocols > 5 ? 'warning' : 'normal'}
          description="Protocolos em andamento"
          size="sm"
        />

        <KPICard
          title="Tempo Médio"
          value={metrics?.averageResolutionTime || 0}
          unit="dias"
          target={7}
          warning={10}
          critical={15}
          status={metrics?.averageResolutionTime > 15 ? 'critical' :
                   metrics?.averageResolutionTime > 10 ? 'warning' : 'good'}
          description="Tempo médio de resolução"
          size="sm"
        />

        <KPICard
          title="Satisfação"
          value={metrics?.satisfactionScore || 0}
          unit="/5"
          target={4}
          warning={3}
          critical={2}
          trend={metrics?.satisfactionTrend}
          trendValue={metrics?.satisfactionChange}
          status={metrics?.satisfactionScore >= 4 ? 'good' :
                   metrics?.satisfactionScore >= 3 ? 'warning' : 'critical'}
          description="Sua avaliação média"
          size="sm"
        />

        <KPICard
          title="Protocolos Resolvidos"
          value={metrics?.resolvedProtocols || 0}
          trend={metrics?.resolvedTrend}
          trendValue={metrics?.resolvedChange}
          status="good"
          description="Total de protocolos concluídos"
          size="sm"
        />
      </div>

      <Tabs defaultValue="protocols" className="space-y-4">
        <TabsList>
          <TabsTrigger value="protocols">Meus Protocolos</TabsTrigger>
          <TabsTrigger value="services">Serviços Utilizados</TabsTrigger>
          <TabsTrigger value="satisfaction">Avaliações</TabsTrigger>
        </TabsList>

        <TabsContent value="protocols" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Histórico de Protocolos */}
            <AnalyticsLineChart
              title="Protocolos por Mês"
              data={protocolHistory || []}
              xKey="month"
              yKey={["created", "resolved"]}
              colors={["#3B82F6", "#10B981"]}
              height={300}
            />

            {/* Status dos Protocolos */}
            <AnalyticsPieChart
              title="Status dos Protocolos"
              data={[
                { name: 'Em Andamento', value: metrics?.activeProtocols || 0 },
                { name: 'Resolvidos', value: metrics?.resolvedProtocols || 0 },
                { name: 'Aguardando', value: metrics?.pendingProtocols || 0 }
              ]}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          </div>

          {/* Lista de Protocolos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Protocolos Recentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.recentProtocols?.map((protocol: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        protocol.status === 'resolved' ? 'bg-green-100' :
                        protocol.status === 'in_progress' ? 'bg-blue-100' : 'bg-yellow-100'
                      }`}>
                        {protocol.status === 'resolved' ?
                          <CheckCircle className="h-4 w-4 text-green-600" /> :
                          protocol.status === 'in_progress' ?
                          <Clock className="h-4 w-4 text-blue-600" /> :
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium">{protocol.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {protocol.department} • {protocol.createdAt}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      protocol.status === 'resolved' ? 'default' :
                      protocol.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {protocol.statusLabel}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum protocolo encontrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Serviços Mais Utilizados */}
            <AnalyticsBarChart
              title="Serviços Mais Utilizados"
              data={serviceUsage || []}
              xKey="service"
              yKey="usage"
              colors={["#8B5CF6"]}
              height={300}
            />

            {/* Histórico de Uso */}
            <AnalyticsLineChart
              title="Histórico de Uso de Serviços"
              data={dashboardData?.serviceHistory || []}
              xKey="month"
              yKey="services"
              colors={["#F59E0B"]}
              height={300}
            />
          </div>
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Histórico de Satisfação */}
            <AnalyticsLineChart
              title="Evolução da Satisfação"
              data={satisfactionData || []}
              xKey="month"
              yKey="score"
              colors={["#10B981"]}
              height={300}
            />

            {/* Distribuição de Notas */}
            <AnalyticsBarChart
              title="Distribuição das Avaliações"
              data={[
                { rating: '1 estrela', count: dashboardData?.ratings?.one || 0 },
                { rating: '2 estrelas', count: dashboardData?.ratings?.two || 0 },
                { rating: '3 estrelas', count: dashboardData?.ratings?.three || 0 },
                { rating: '4 estrelas', count: dashboardData?.ratings?.four || 0 },
                { rating: '5 estrelas', count: dashboardData?.ratings?.five || 0 }
              ]}
              xKey="rating"
              yKey="count"
              colors={["#EF4444"]}
              height={300}
            />
          </div>

          {/* Avaliar Serviços Pendentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Avalie Seus Protocolos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.pendingEvaluations?.map((protocol: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{protocol.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Resolvido em {protocol.resolvedAt}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Avaliar
                    </Button>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Todas as avaliações estão em dia
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