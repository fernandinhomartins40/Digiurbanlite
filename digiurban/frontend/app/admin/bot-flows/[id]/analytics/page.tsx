'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FlowAnalytics {
  flowId: string;
  flowName: string;
  totalExecutions: number;
  completedExecutions: number;
  cancelledExecutions: number;
  activeExecutions: number;
  completionRate: number;
  avgCompletionTime: number;
  mostCommonExitPoint: string;
  executionsByDay: Array<{ date: string; count: number }>;
  nodeStatistics: Array<{
    nodeId: string;
    nodeName: string;
    visits: number;
    errors: number;
    avgTimeSpent: number;
    errorRate: number;
  }>;
  dropOffPoints: Array<{
    nodeId: string;
    nodeName: string;
    dropOffRate: number;
  }>;
}

const STATUS_COLORS = {
  completed: '#22c55e',
  active: '#3b82f6',
  cancelled: '#ef4444',
};

export default function FlowAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const flowId = params.id as string;
  const [analytics, setAnalytics] = useState<FlowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [flowId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/flows/${flowId}/analytics`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => router.push('/admin/bot-flows')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="mt-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          <p className="font-bold">Erro ao carregar analytics</p>
          <p className="text-sm">{error || 'Dados não encontrados'}</p>
        </div>
      </div>
    );
  }

  const statusData = [
    { name: 'Concluídas', value: analytics.completedExecutions, color: STATUS_COLORS.completed },
    { name: 'Em Andamento', value: analytics.activeExecutions, color: STATUS_COLORS.active },
    { name: 'Canceladas', value: analytics.cancelledExecutions, color: STATUS_COLORS.cancelled },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push('/admin/bot-flows')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{analytics.flowName}</h1>
            <p className="text-muted-foreground">Analytics do Fluxo</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadAnalytics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total de Execuções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalExecutions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.completionRate.toFixed(1)}%
            </div>
            <Progress value={analytics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(analytics.avgCompletionTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo de conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Execuções Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.activeExecutions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Executions by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Execuções nos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.executionsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name="Execuções"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Node Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas por Nodo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nodo</TableHead>
                <TableHead className="text-center">Visitas</TableHead>
                <TableHead className="text-center">Erros</TableHead>
                <TableHead className="text-center">Tempo Médio</TableHead>
                <TableHead className="text-center">Taxa de Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.nodeStatistics.map((node) => (
                <TableRow key={node.nodeId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{node.nodeName}</div>
                      <div className="text-sm text-muted-foreground">{node.nodeId}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{node.visits}</TableCell>
                  <TableCell className="text-center">
                    {node.errors > 0 ? (
                      <span className="text-red-600 font-semibold">{node.errors}</span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{formatTime(node.avgTimeSpent)}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={node.errorRate > 10 ? 'destructive' : 'outline'}
                      className={node.errorRate > 10 ? '' : 'bg-green-50 text-green-700'}
                    >
                      {node.errorRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {analytics.nodeStatistics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drop-off Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Pontos de Abandono
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nodo</TableHead>
                <TableHead className="text-center">Taxa de Abandono</TableHead>
                <TableHead className="text-center">Indicador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.dropOffPoints.map((point) => (
                <TableRow key={point.nodeId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{point.nodeName}</div>
                      <div className="text-sm text-muted-foreground">{point.nodeId}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`font-semibold ${
                        point.dropOffRate > 30
                          ? 'text-red-600'
                          : point.dropOffRate > 15
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {point.dropOffRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={point.dropOffRate} className="w-24" />
                      {point.dropOffRate > 30 && (
                        <Badge variant="destructive">Alto</Badge>
                      )}
                      {point.dropOffRate > 15 && point.dropOffRate <= 30 && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          Médio
                        </Badge>
                      )}
                      {point.dropOffRate <= 15 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Baixo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {analytics.dropOffPoints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Nenhum ponto de abandono identificado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Most Common Exit Point */}
      {analytics.mostCommonExitPoint && (
        <Card>
          <CardHeader>
            <CardTitle>Ponto de Saída Mais Comum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">
              <Badge variant="outline" className="text-base px-4 py-2">
                {analytics.mostCommonExitPoint}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
