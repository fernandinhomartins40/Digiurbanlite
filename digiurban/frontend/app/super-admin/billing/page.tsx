'use client';

/**
 * ============================================================================
 * FATURAMENTO DA PLATAFORMA — painel super-admin
 * ============================================================================
 * Visão consolidada das faturas de todos os municípios (MRR, pendências,
 * inadimplência). Consome /api/super-admin/invoices.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface Invoice {
  id: string; tenantId: string | null; number: string; amount: number;
  plan: string; period: string; status: string; dueDate: string;
  paidAt: string | null; description: string | null;
}

const BADGE: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800', PENDING: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-orange-100 text-orange-800', CANCELLED: 'bg-gray-200 text-gray-700',
  FAILED: 'bg-red-100 text-red-800',
};
const FILTERS = ['all', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];

export default function BillingPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async (status: string) => {
    setLoading(true);
    try {
      const qs = status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`/api/super-admin/invoices${qs}`);
      if (res.ok) setInvoices((await res.json()).invoices || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(filter); }, [filter]);

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/super-admin/invoices/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (res.ok) { toast({ title: 'Fatura atualizada' }); load(filter); }
  };

  const paid = invoices.filter((i) => i.status === 'PAID');
  const pending = invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
  const mrr = paid.reduce((s, i) => s + i.amount, 0);
  const pendingTotal = pending.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6" /> Faturamento</h1>
        <p className="text-muted-foreground text-sm">Faturas de assinatura de todos os municípios</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="py-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUp className="h-4 w-4" /> Recebido (período filtrado)</div>
          <div className="text-2xl font-bold mt-1 text-green-700">R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><AlertCircle className="h-4 w-4" /> Pendente/vencido</div>
          <div className="text-2xl font-bold mt-1 text-orange-600">R$ {pendingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><CheckCircle className="h-4 w-4" /> Faturas</div>
          <div className="text-2xl font-bold mt-1">{invoices.length}</div>
        </CardContent></Card>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todas' : f}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Faturas</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhuma fatura.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                  <div>
                    <div className="font-medium">{inv.number} · {inv.plan} · {inv.period}</div>
                    <div className="text-xs text-muted-foreground">{inv.description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <Badge className={BADGE[inv.status] || 'bg-gray-100'}>{inv.status}</Badge>
                    {inv.status === 'PENDING' && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(inv.id, 'PAID')}>Marcar paga</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
