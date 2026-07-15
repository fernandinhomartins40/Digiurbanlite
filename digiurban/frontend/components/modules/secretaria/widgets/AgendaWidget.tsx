'use client';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import type { WidgetProps } from './WidgetRegistry';
import { useRecords } from './useRecords';

/**
 * AGENDA — registros com data, agrupados por dia (próximos primeiro). Para
 * agendamentos, reservas, eventos, vistorias. Uma agenda operacional simples.
 */
export function AgendaWidget({ code, schema, sharedFilters, reloadKey }: WidgetProps) {
  const dateField = useMemo(() => (schema.fields ?? []).find((f) => f.dataType === 'DATE'), [schema]);
  const nameField = useMemo(() => (schema.fields ?? []).find((f) => f.displayInTable)?.key || (schema.fields ?? [])[0]?.key, [schema]);
  const { rows, loading } = useRecords(code, schema, sharedFilters, reloadKey);

  if (!dateField) return <Card><CardContent className="p-8 text-center text-muted-foreground">Sem campo de data para a agenda.</CardContent></Card>;
  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando agenda…</div>;

  // Agrupa por dia
  const byDay = new Map<string, Array<{ id: string; label: string; date: Date }>>();
  for (const r of rows) {
    const d = new Date(String(r.data[dateField.key] ?? ''));
    if (isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push({ id: r.id, label: nameField ? String(r.data[nameField] ?? '') : r.id, date: d });
  }
  const days = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));

  if (days.length === 0) return <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum registro com data.</CardContent></Card>;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card><CardContent className="p-0">
      <div className="flex items-center gap-2 border-b px-4 py-2 text-sm font-medium"><Calendar className="h-4 w-4" /> Agenda</div>
      <ul className="divide-y">
        {days.map(([day, items]) => (
          <li key={day} className="px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-sm font-medium">{new Date(day + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
              {day === today && <Badge className="bg-teal-600">Hoje</Badge>}
              <span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
            </div>
            <ul className="space-y-1 pl-1">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-2 text-sm">
                  <span className="text-xs tabular-nums text-muted-foreground">{it.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="truncate">{it.label}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </CardContent></Card>
  );
}
