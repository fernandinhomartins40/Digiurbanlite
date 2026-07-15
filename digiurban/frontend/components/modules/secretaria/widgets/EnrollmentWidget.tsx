'use client';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WidgetProps } from './WidgetRegistry';
import { useRecords } from './useRecords';

/**
 * ENROLLMENT — lista de inscritos/cadastros temporários (cursos, eventos,
 * programas). Destaca período e status; separa ativos de encerrados.
 */
export function EnrollmentWidget({ code, schema, sharedFilters, reloadKey }: WidgetProps) {
  const dateField = useMemo(() => (schema.fields ?? []).find((f) => f.dataType === 'DATE'), [schema]);
  const nameField = useMemo(() => (schema.fields ?? []).find((f) => f.displayInTable)?.key || (schema.fields ?? [])[0]?.key, [schema]);
  const { rows, total, loading } = useRecords(code, schema, sharedFilters, reloadKey);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando inscritos…</div>;

  const now = Date.now();
  const withDate = rows.map((r) => {
    const d = dateField ? new Date(String(r.data[dateField.key] ?? '')) : null;
    const ended = d && !isNaN(d.getTime()) ? d.getTime() < now : false;
    return { ...r, date: d, ended };
  });
  const ativos = withDate.filter((r) => !r.ended);
  const encerrados = withDate.filter((r) => r.ended);

  const line = (r: typeof withDate[number]) => (
    <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{nameField ? String(r.data[nameField] ?? '—') : r.id}</div>
        {r.date && !isNaN(r.date.getTime()) && (
          <div className="text-xs text-muted-foreground">{dateField?.label}: {r.date.toLocaleDateString('pt-BR')}</div>
        )}
      </div>
      <Badge variant={r.ended ? 'secondary' : 'default'} className={r.ended ? '' : 'bg-green-600'}>{r.ended ? 'Encerrado' : 'Ativo'}</Badge>
    </li>
  );

  return (
    <Card><CardContent className="p-0">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Inscritos <Badge variant="secondary" className="ml-1">{total}</Badge></span>
        <span className="text-xs text-muted-foreground">{ativos.length} ativos · {encerrados.length} encerrados</span>
      </div>
      {withDate.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum inscrito.</div> : (
        <ul className="divide-y">{[...ativos, ...encerrados].map(line)}</ul>
      )}
    </CardContent></Card>
  );
}
