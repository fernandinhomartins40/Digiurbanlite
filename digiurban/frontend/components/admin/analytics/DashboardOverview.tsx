'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Activity, CheckCircle, Clock, AlertTriangle, Users } from 'lucide-react';

interface DashboardData {
  overview: {
    totalProtocols: number;
    newProtocols: number;
    closedProtocols: number;
    cancelledProtocols: number;
    overdueProtocols: number;
    avgCompletionTime: number | null;
    avgFirstResponse: number | null;
    satisfactionScore: number | null;
    slaComplianceRate: number | null;
    avgSlaDeviation: number | null;
  };
  departments: any[];
  topServers: any[];
  bottlenecks: any[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
}

function MetricCard({ title, value, subtitle, trend, trendValue, icon }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trend && trendValue && (
          <div className={`flex items-center text-xs ${trendColor} mt-1`}>
            <TrendIcon className="mr-1 h-3 w-3" />
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    loadDashboard();
  }, [periodType]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/protocol-analytics/dashboard?periodType=${periodType}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao carregar dashboard');

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  const formatTime = (hours: number | null) => {
    if (hours === null) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)} dias`;
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  const formatScore = (value: number | null) => {
    if (value === null) return 'N/A';
    return value.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Analytics</h2>
          <p className="text-muted-foreground">
            Visão geral do desempenho dos protocolos e serviços
          </p>
        </div>
        <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DAILY">Diário</SelectItem>
            <SelectItem value="WEEKLY">Semanal</SelectItem>
            <SelectItem value="MONTHLY">Mensal</SelectItem>
            <SelectItem value="YEARLY">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Protocolos"
          value={data.overview.totalProtocols}
          subtitle={`${data.overview.newProtocols} novos`}
          icon={<Activity />}
        />
        <MetricCard
          title="Protocolos Concluídos"
          value={data.overview.closedProtocols}
          subtitle={formatPercentage((data.overview.closedProtocols / data.overview.totalProtocols) * 100)}
          icon={<CheckCircle />}
        />
        <MetricCard
          title="Tempo Médio de Conclusão"
          value={formatTime(data.overview.avgCompletionTime)}
          subtitle="Tempo total até finalização"
          icon={<Clock />}
        />
        <MetricCard
          title="Protocolos Atrasados"
          value={data.overview.overdueProtocols}
          subtitle={formatPercentage((data.overview.overdueProtocols / data.overview.totalProtocols) * 100)}
          icon={<AlertTriangle />}
        />
      </div>

      {/* Métricas de qualidade */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Cumprimento de SLA"
          value={formatPercentage(data.overview.slaComplianceRate)}
          subtitle="Taxa de cumprimento de prazos"
          trend={
            data.overview.slaComplianceRate && data.overview.slaComplianceRate >= 90
              ? 'up'
              : data.overview.slaComplianceRate && data.overview.slaComplianceRate < 70
              ? 'down'
              : 'neutral'
          }
        />
        <MetricCard
          title="Satisfação do Cidadão"
          value={formatScore(data.overview.satisfactionScore)}
          subtitle="Nota média (0-5)"
          trend={
            data.overview.satisfactionScore && data.overview.satisfactionScore >= 4
              ? 'up'
              : data.overview.satisfactionScore && data.overview.satisfactionScore < 3
              ? 'down'
              : 'neutral'
          }
        />
        <MetricCard
          title="Tempo Médio de Resposta"
          value={formatTime(data.overview.avgFirstResponse)}
          subtitle="Até primeira interação"
        />
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="bottlenecks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bottlenecks">Gargalos</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="servers">Top Servidores</TabsTrigger>
        </TabsList>

        <TabsContent value="bottlenecks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Principais Gargalos</CardTitle>
              <CardDescription>
                Processos e etapas que mais impactam o tempo de conclusão
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.bottlenecks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum gargalo identificado no período
                </p>
              ) : (
                <div className="space-y-4">
                  {data.bottlenecks.map((bottleneck: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{bottleneck.entityName}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              bottleneck.priority === 'CRITICAL'
                                ? 'bg-red-100 text-red-800'
                                : bottleneck.priority === 'HIGH'
                                ? 'bg-orange-100 text-orange-800'
                                : bottleneck.priority === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {bottleneck.priority}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {bottleneck.affectedProtocols} protocolos afetados • Tempo médio:{' '}
                          {formatTime(bottleneck.avgStuckTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">
                          {bottleneck.impactScore.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Impacto</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Departamento</CardTitle>
              <CardDescription>Comparação de métricas entre departamentos</CardDescription>
            </CardHeader>
            <CardContent>
              {data.departments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum dado de departamento disponível
                </p>
              ) : (
                <div className="space-y-4">
                  {data.departments.map((dept: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Departamento #{dept.departmentId.slice(0, 8)}</h4>
                        <span className="text-sm text-muted-foreground">
                          {dept.totalProtocols} protocolos
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Ativos</p>
                          <p className="font-medium">{dept.activeProtocols}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Concluídos</p>
                          <p className="font-medium">{dept.completedProtocols}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">SLA</p>
                          <p className="font-medium">{formatPercentage(dept.slaComplianceRate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Servidores</CardTitle>
              <CardDescription>Servidores com melhor desempenho no período</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topServers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum dado de servidor disponível
                </p>
              ) : (
                <div className="space-y-4">
                  {data.topServers.map((server: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">Servidor #{server.userId.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {server.protocolsCompleted} protocolos concluídos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatPercentage(
                            (server.protocolsOnTime / server.protocolsCompleted) * 100
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">No prazo</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
