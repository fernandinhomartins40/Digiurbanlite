'use client';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { WidgetProps } from './WidgetRegistry';
import { useRecords } from './useRecords';

/** CARDS — visão em cartão (campos displayInCard). */
export function CardsWidget({ code, schema, sharedFilters, reloadKey }: WidgetProps) {
  const cardFields = useMemo(() => (schema.fields ?? []).filter((f) => f.displayInCard), [schema]);
  const primary = useMemo(() => (schema.fields ?? []).find((f) => f.displayInTable)?.key || (schema.fields ?? [])[0]?.key, [schema]);
  const { rows, loading } = useRecords(code, schema, sharedFilters, reloadKey);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando…</div>;
  if (rows.length === 0) return <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum registro.</CardContent></Card>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4">
            <div className="mb-2 font-medium">{primary ? String(r.data[primary] ?? '—') : r.id}</div>
            <dl className="space-y-1 text-sm">
              {(cardFields.length ? cardFields : (schema.fields ?? []).slice(0, 4)).map((f) => (
                <div key={f.key} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{f.label}</dt>
                  <dd className="truncate text-right">{f.isPII ? '•••' : String(r.data[f.key] ?? '—')}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
