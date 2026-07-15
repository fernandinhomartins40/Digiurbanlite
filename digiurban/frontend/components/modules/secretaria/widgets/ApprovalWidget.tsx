'use client';
import { useEffect, useState, useCallback } from 'react';
import { listRecords, approveRecord, rejectRecord } from '@/services/registry.service';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { WidgetProps } from './WidgetRegistry';

/** APPROVAL — fila de registros PENDING com aprovar/rejeitar (COORDINATOR+). */
export function ApprovalWidget({ code, schema, onChanged }: WidgetProps) {
  const { user } = useAdminAuth();
  const canApprove = !!user && user.role !== 'USER';
  const primary = (schema.fields ?? []).find((f) => f.displayInTable)?.key || (schema.fields ?? [])[0]?.key;
  const [rows, setRows] = useState<Array<{ id: string; data: Record<string, unknown>; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await listRecords(code, { status: 'PENDING', pageSize: 100 }); setRows(res.records); }
    catch { setRows([]); } finally { setLoading(false); }
  }, [code]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id);
    try { if (action === 'approve') await approveRecord(id); else await rejectRecord(id); await load(); onChanged?.(); }
    finally { setBusy(null); }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Carregando fila…</div>;
  if (rows.length === 0) return <Card><CardContent className="p-6 text-center text-muted-foreground">Nada pendente de aprovação.</CardContent></Card>;

  return (
    <Card><CardContent className="p-0">
      <div className="border-b px-4 py-2 text-sm font-medium">Aprovação <Badge variant="secondary" className="ml-1">{rows.length}</Badge></div>
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{primary ? String(r.data[primary] ?? '—') : r.id}</div>
              <div className="text-xs text-muted-foreground">Enviado em {new Date(r.createdAt).toLocaleDateString('pt-BR')}</div>
            </div>
            {canApprove ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}><CheckCircle2 className="mr-1 h-4 w-4 text-green-600" /> Aprovar</Button>
                <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, 'reject')}><XCircle className="mr-1 h-4 w-4 text-red-600" /> Rejeitar</Button>
              </div>
            ) : <Badge variant="secondary">Pendente</Badge>}
          </li>
        ))}
      </ul>
    </CardContent></Card>
  );
}
