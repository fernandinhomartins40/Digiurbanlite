'use client';
import { useEffect, useState } from 'react';
import { getDashboard } from '@/services/registry.service';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { WidgetProps } from './WidgetRegistry';

interface Chart { type: 'pie' | 'bar'; title: string; data: Array<{ name: string; value: number }> }

const COLORS = ['#1F7A8C', '#2E7D4F', '#B8860B', '#B23A48', '#5B7DB1', '#8C6BAE', '#3FA8BC', '#C77D3A'];

/** CHART — gráficos de verdade (Recharts) das distribuições facetable. */
export function ChartWidget({ code, config }: WidgetProps) {
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard(code)
      .then((d) => setCharts((d.charts as Chart[]) || []))
      .catch(() => setCharts([]))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando indicadores…</div>;
  if (charts.length === 0) return null;

  // config.chartIndex permite fixar um gráfico específico (widget salvo).
  const list = typeof config?.chartIndex === 'number' ? charts.slice(config.chartIndex as number, (config.chartIndex as number) + 1) : charts;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {list.map((c, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="mb-3 text-sm font-medium">{c.title}</div>
            <ResponsiveContainer width="100%" height={220}>
              {c.type === 'pie' ? (
                <PieChart>
                  <Pie data={c.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {c.data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <BarChart data={c.data}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1F7A8C" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
