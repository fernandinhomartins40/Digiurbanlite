'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
  period: string;
  metrics: {
    totalProtocols: number;
    closedProtocols: number;
    avgCompletionTime: number | null;
    satisfactionScore: number | null;
    slaComplianceRate: number | null;
  } | null;
}

export default function TrendsChart() {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
  const [months, setMonths] = useState('6');
  const [chartType, setChartType] = useState<'volume' | 'performance' | 'satisfaction'>('volume');

  useEffect(() => {
    loadTrends();
  }, [periodType, months]);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/protocol-analytics/trends?periodType=${periodType}&months=${months}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Erro ao carregar tendências');

      const trendsData: TrendData[] = await response.json();
      setData(trendsData);
    } catch (error) {
      console.error('Erro ao carregar tendências:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendências ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data
    .filter(d => d.metrics !== null)
    .map(d => ({
      period: d.period,
      total: d.metrics!.totalProtocols,
      concluidos: d.metrics!.closedProtocols,
      tempo: d.metrics!.avgCompletionTime !== null ? d.metrics!.avgCompletionTime / 24 : 0,
      satisfacao: d.metrics!.satisfactionScore || 0,
      sla: d.metrics!.slaComplianceRate || 0
    }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tendências ao Longo do Tempo</CardTitle>
            <CardDescription>Evolução das métricas ao longo dos períodos</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="satisfaction">Satisfação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
            <p className="text-xs text-muted-foreground">Os dados aparecerão à medida que protocolos forem criados e processados</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'volume' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8884d8" name="Total de Protocolos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="concluidos" fill="#82ca9d" name="Concluídos" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartType === 'performance' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" label={{ value: 'Dias', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: '%', angle: 90, position: 'insideRight', style: { fontSize: 11 } }} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="tempo"
                  stroke="#8884d8"
                  name="Tempo Médio (dias)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sla"
                  stroke="#82ca9d"
                  name="SLA (%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} label={{ value: 'Nota', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="satisfacao"
                  stroke="#ffc658"
                  name="Satisfação (0-5)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
