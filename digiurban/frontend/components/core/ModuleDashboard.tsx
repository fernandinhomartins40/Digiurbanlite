'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ModuleDashboardProps {
  protocols: any[];
  service: any;
}

export function ModuleDashboard({ protocols, service }: ModuleDashboardProps) {
  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = protocols.length;
    const approved = protocols.filter((p) => p.status === 'CONCLUIDO').length;
    const pending = protocols.filter((p) => p.status === 'VINCULADO').length;
    const inProgress = protocols.filter((p) => p.status === 'PROGRESSO').length;
    const rejected = protocols.filter((p) => p.status === 'CANCELADO').length;
    const withPending = protocols.filter((p) => p.status === 'PENDENCIA').length;

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    // Evolução nos últimos 30 dias
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const count = protocols.filter((p) => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;

      return {
        date: format(date, 'dd/MM', { locale: ptBR }),
        count
      };
    });

    // Distribuição por status
    const statusDistribution = [
      { name: 'Pendentes', value: pending, color: '#fbbf24' },
      { name: 'Em Análise', value: inProgress, color: '#3b82f6' },
      { name: 'Concluídos', value: approved, color: '#10b981' },
      { name: 'Cancelados', value: rejected, color: '#6b7280' },
      { name: 'Com Pendência', value: withPending, color: '#ef4444' }
    ].filter((item) => item.value > 0);

    return {
      total,
      approved,
      pending,
      inProgress,
      rejected,
      withPending,
      approvalRate,
      last30Days,
      statusDistribution
    };
  }, [protocols]);

  // Exportar para CSV
  const exportToCSV = () => {
    try {
      const headers = ['Protocolo', 'Título', 'Status', 'Data de Criação', 'Solicitante'];

      const rows = protocols.map((p) => [
        p.number || p.protocolNumber,
        p.title,
        p.status,
        format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        p.citizen?.name || '-'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${service.name}_${format(new Date(), 'yyyyMMdd')}.csv`;
      link.click();

      toast.success('Arquivo CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar arquivo');
    }
  };

  // Exportar para Excel (JSON que pode ser aberto no Excel)
  const exportToExcel = () => {
    try {
      const data = protocols.map((p) => ({
        Protocolo: p.number || p.protocolNumber,
        Título: p.title,
        Status: p.status,
        'Data de Criação': format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        Solicitante: p.citizen?.name || '-',
        ...p.customData
      }));

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${service.name}_${format(new Date(), 'yyyyMMdd')}.json`;
      link.click();

      toast.success('Arquivo JSON exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar JSON:', error);
      toast.error('Erro ao exportar arquivo');
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Solicitações registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.approvalRate}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando análise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Aprovação
            </CardTitle>
            {stats.approvalRate >= 70 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.approvalRate >= 70 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stats.approvalRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.approved} de {stats.total} aprovados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de linha - Evolução */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução nos Últimos 30 Dias</CardTitle>
            <CardDescription>
              Quantidade de solicitações por dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.last30Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Solicitações"
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de pizza - Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>
              Proporção de solicitações por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) =>
                    `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas Detalhadas</CardTitle>
          <CardDescription>
            Informações adicionais sobre as solicitações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Em Análise</p>
              <p className="text-2xl font-semibold">{stats.inProgress}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cancelados</p>
              <p className="text-2xl font-semibold">{stats.rejected}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Com Pendência</p>
              <p className="text-2xl font-semibold">{stats.withPending}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exportação */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Dados</CardTitle>
          <CardDescription>
            Baixe os dados deste módulo em diferentes formatos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button onClick={exportToCSV} variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={exportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {stats.total} registro(s) serão exportados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
