'use client';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { WidgetProps } from './WidgetRegistry';
import type { FieldDefinition } from '@/services/registry.service';
import { useRecords } from './useRecords';
import { RecordDetailModal } from '../RecordDetailModal';

function fmt(f: FieldDefinition, v: unknown) {
  if (v == null || v === '') return '—';
  if (f.dataType === 'BOOL') return v ? 'Sim' : 'Não';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

/** TABLE — tabela rica: colunas de displayInTable, aplica filtros compartilhados. */
export function TableWidget({ code, schema, sharedFilters, reloadKey }: WidgetProps) {
  const cols = useMemo(() => {
    const c = (schema.fields ?? []).filter((f) => f.displayInTable);
    return c.length ? c : (schema.fields ?? []).slice(0, 6);
  }, [schema]);
  const { rows, total, loading, reload } = useRecords(code, schema, sharedFilters, reloadKey);
  const [detail, setDetail] = useState<{ id: string; data: Record<string, unknown> } | null>(null);

  const exportCsv = () => {
    const head = cols.map((c) => `"${c.label}"`).join(';');
    const lines = rows.map((r) => cols.map((c) => `"${String(fmt(c, r.data[c.key])).replace(/"/g, '""')}"`).join(';'));
    const csv = '﻿' + [head, ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = `${code.toLowerCase()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-medium">Registros <Badge variant="secondary" className="ml-1">{total}</Badge></span>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}><Download className="mr-1 h-4 w-4" /> Exportar</Button>
        </div>
        <div className="overflow-x-auto">
          {loading ? <div className="p-8 text-center text-muted-foreground">Carregando…</div>
            : rows.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum registro.</div>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                    {cols.map((c) => <th key={c.key} className="px-4 py-2 font-medium">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="cursor-pointer border-b hover:bg-muted/20" onClick={() => setDetail(r)}>
                      {cols.map((c) => <td key={c.key} className="px-4 py-2">{c.isPII ? <span className="text-muted-foreground">{fmt(c, r.data[c.key])}</span> : fmt(c, r.data[c.key])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </CardContent>
      <RecordDetailModal schema={schema} record={detail} onClose={() => setDetail(null)} onChanged={reload} />
    </Card>
  );
}
