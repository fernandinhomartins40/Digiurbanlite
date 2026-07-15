'use client';
import { useEffect, useState } from 'react';
import { getDashboard } from '@/services/registry.service';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { WidgetProps } from './WidgetRegistry';

/** TIMELINE — evolução (novos registros por mês). */
export function TimelineWidget({ code }: WidgetProps) {
  const [data, setData] = useState<Array<{ name: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard(code)
      .then((d) => setData((d.trends as Array<{ name: string; value: number }>) || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando evolução…</div>;
  if (data.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 text-sm font-medium">Novos registros por mês</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#1F7A8C" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
