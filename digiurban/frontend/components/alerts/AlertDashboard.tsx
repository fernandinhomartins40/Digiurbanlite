'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Bell, Shield, TrendingUp, Settings, Plus } from 'lucide-react'
import { AlertList } from './AlertList'
import { AlertCard } from './AlertCard'
import { KPICard } from '../analytics/KPICard'
import { AnalyticsLineChart, AnalyticsBarChart, AnalyticsPieChart } from '../analytics/Charts'
import type { Alert as AlertType } from './index'

type Alert = AlertType & {
  message: string;
  timestamp: string;
}

interface AlertDashboardProps {
  className?: string
}

export function AlertDashboard({ className }: AlertDashboardProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null)

  const fetchAlerts = async () => {
    // TODO: Implementar busca de alertas via API
    setLoading(true);
    // Mock data
    setAlerts([]);
    setDashboardData(null);
    setLoading(false);
  }

  useEffect(() => {
    fetchAlerts();
  }, [])

  // Calculate metrics from current alerts
  const metrics = {
    total: alerts.length,
    active: alerts.filter(alert => alert.status === 'active').length,
    critical: alerts.filter(alert => alert.severity === 'critical').length,
    resolved: alerts.filter(alert => alert.status === 'resolved').length
  }

  const recentCriticalAlerts = alerts
    .filter(alert => alert.severity === 'critical' && alert.status === 'active')
    .slice(0, 5)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Alertas</h1>
          <p className="text-muted-foreground">
            Monitoramento e gestão de alertas do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Alerta
          </Button>
        </div>
      </div>

      {/* KPIs de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Alertas"
          value={metrics.total}
          description="Todos os alertas no sistema"
          status="normal"
        />

        <KPICard
          title="Alertas Ativos"
          value={metrics.active}
          status={metrics.active === 0 ? 'good' : metrics.active > 10 ? 'critical' : 'warning'}
          trend={dashboardData?.trends?.active}
          trendValue={dashboardData?.trends?.activeChange}
          description="Alertas que requerem atenção"
        />

        <KPICard
          title="Alertas Críticos"
          value={metrics.critical}
          status={metrics.critical === 0 ? 'good' : metrics.critical > 5 ? 'critical' : 'warning'}
          trend={dashboardData?.trends?.critical}
          trendValue={dashboardData?.trends?.criticalChange}
          description="Alertas de severidade crítica"
        />

        <KPICard
          title="Taxa de Resolução"
          value={metrics.total > 0 ? Math.round((metrics.resolved / metrics.total) * 100) : 0}
          unit="%"
          target={95}
          warning={85}
          critical={75}
          status={metrics.total > 0 ?
            (metrics.resolved / metrics.total) * 100 >= 95 ? 'good' :
            (metrics.resolved / metrics.total) * 100 >= 85 ? 'warning' : 'critical'
            : 'normal'
          }
          description="Percentual de alertas resolvidos"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="active">Alertas Ativos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alertas Críticos Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Alertas Críticos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {recentCriticalAlerts.length > 0 ? (
                  recentCriticalAlerts.map(alert => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      compact
                      onAcknowledge={() => fetchAlerts()}
                      onResolve={() => fetchAlerts()}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-green-600 font-medium">
                      Nenhum alerta crítico ativo
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sistema operando dentro dos parâmetros normais
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribuição por Tipo */}
            <AnalyticsPieChart
              title="Distribuição por Tipo"
              data={dashboardData?.alertsByType || [
                { name: 'Sistema', value: metrics.total > 0 ? Math.floor(Math.random() * 10) : 0 },
                { name: 'Performance', value: metrics.total > 0 ? Math.floor(Math.random() * 8) : 0 },
                { name: 'Segurança', value: metrics.total > 0 ? Math.floor(Math.random() * 5) : 0 },
                { name: 'Negócio', value: metrics.total > 0 ? Math.floor(Math.random() * 6) : 0 }
              ]}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          </div>

          {/* Resumo por Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-red-500" />
                  <span>Alertas Ativos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.active}</div>
                <p className="text-sm text-muted-foreground">Requerem atenção imediata</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-yellow-500" />
                  <span>Reconhecidos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {alerts.filter(alert => alert.status === 'acknowledged').length}
                </div>
                <p className="text-sm text-muted-foreground">Em processo de resolução</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-green-500" />
                  <span>Resolvidos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.resolved}</div>
                <p className="text-sm text-muted-foreground">Concluídos com sucesso</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active">
          <AlertList
            title="Alertas Ativos"
            defaultFilter="active"
            showTabs={false}
            autoRefresh={true}
            refreshInterval={15000}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tendência de Alertas */}
            <AnalyticsLineChart
              title="Tendência de Alertas - Últimos 30 Dias"
              data={dashboardData?.alertsTrend || []}
              xKey="date"
              yKey={["created", "resolved"]}
              colors={["#EF4444", "#10B981"]}
              height={300}
            />

            {/* Alertas por Severidade */}
            <AnalyticsBarChart
              title="Alertas por Severidade"
              data={[
                { severity: 'Crítica', count: alerts.filter(a => a.severity === 'critical').length },
                { severity: 'Aviso', count: alerts.filter(a => a.severity === 'warning').length },
                { severity: 'Info', count: alerts.filter(a => a.severity === 'info').length }
              ]}
              xKey="severity"
              yKey="count"
              colors={["#EF4444"]}
              height={300}
            />
          </div>

          {/* Tempo Médio de Resolução */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tempo Médio de Resolução</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData?.avgResolutionTime || '2.5'}h
                </div>
                <p className="text-sm text-muted-foreground">Todas as severidades</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">MTTR - Alertas Críticos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {dashboardData?.mttrCritical || '1.2'}h
                </div>
                <p className="text-sm text-muted-foreground">Mean Time to Recovery</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taxa de Falsos Positivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {dashboardData?.falsePositiveRate || '5.2'}%
                </div>
                <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas por Origem */}
          <AnalyticsBarChart
            title="Alertas por Sistema/Componente"
            data={dashboardData?.alertsBySource || []}
            xKey="source"
            yKey="count"
            colors={["#8B5CF6"]}
            height={300}
          />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações de Notificação */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-muted-foreground">
                      Receber alertas críticos por email
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações Push</p>
                    <p className="text-sm text-muted-foreground">
                      Notificações instantâneas no navegador
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Integração Slack</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar alertas para canal do Slack
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Webhooks</p>
                    <p className="text-sm text-muted-foreground">
                      Integração com sistemas externos
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Regras de Alerta */}
            <Card>
              <CardHeader>
                <CardTitle>Regras de Alerta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    {
                      name: 'CPU > 90%',
                      description: 'Alerta quando CPU excede 90%',
                      status: 'Ativo',
                      severity: 'critical'
                    },
                    {
                      name: 'Memória > 85%',
                      description: 'Alerta quando memória excede 85%',
                      status: 'Ativo',
                      severity: 'warning'
                    },
                    {
                      name: 'Disco > 95%',
                      description: 'Alerta quando espaço em disco < 5%',
                      status: 'Ativo',
                      severity: 'critical'
                    },
                    {
                      name: 'Falhas de Login',
                      description: 'Múltiplas tentativas de login falharam',
                      status: 'Ativo',
                      severity: 'warning'
                    }
                  ].map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          rule.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <span className="text-sm text-green-600">{rule.status}</span>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}