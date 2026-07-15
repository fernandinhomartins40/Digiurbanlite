'use client';
import { useEffect, useState } from 'react';
import { getDashboard } from '@/services/registry.service';
import { Card, CardContent } from '@/components/ui/card';
import type { WidgetProps } from './WidgetRegistry';

/** STATS — contadores/KPIs do tipo (total + métricas isMetric). */
export function StatsWidget({ code }: WidgetProps) {
  const [kpis, setKpis] = useState<Array<{ label: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard(code)
      .then((d) => setKpis((d.kpis as Array<{ label: string; value: number }>) || []))
      .catch(() => setKpis([]))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Card key={i}><CardContent className="h-20 p-4" /></Card>)}</div>;
  if (kpis.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {kpis.map((k, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold tabular-nums text-teal-700">{k.value.toLocaleString('pt-BR')}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
