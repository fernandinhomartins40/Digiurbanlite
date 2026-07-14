'use client';

/**
 * ============================================================================
 * LEADS / FUNIL DE CAPTAÇÃO — painel super-admin
 * ============================================================================
 * Kanban simples de leads (NEW → CONTACTED → QUALIFIED → WON/LOST). Alimentado
 * pelo endpoint público POST /api/public/leads (landing/demo).
 * Consome /api/platform/leads (GET/PATCH).
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2, Mail, Phone, Building } from 'lucide-react';

interface Lead {
  id: string; name: string; email: string; phone: string | null;
  company: string | null; position: string | null; source: string;
  status: string; message: string | null; createdAt: string;
}

const STAGES = [
  { key: 'NEW', label: 'Novo', className: 'bg-blue-100 text-blue-800' },
  { key: 'CONTACTED', label: 'Contatado', className: 'bg-purple-100 text-purple-800' },
  { key: 'QUALIFIED', label: 'Qualificado', className: 'bg-amber-100 text-amber-800' },
  { key: 'WON', label: 'Convertido', className: 'bg-green-100 text-green-800' },
  { key: 'LOST', label: 'Perdido', className: 'bg-gray-200 text-gray-700' },
];

export default function LeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/platform/leads');
      if (res.ok) setLeads((await res.json()).leads || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const move = async (id: string, status: string) => {
    const res = await fetch(`/api/platform/leads/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (res.ok) { toast({ title: 'Lead atualizado' }); load(); }
  };

  const byStage = (key: string) => leads.filter((l) => (l.status || 'NEW') === key);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><UserPlus className="h-6 w-6" /> Leads</h1>
        <p className="text-muted-foreground text-sm">Funil de captação de novos municípios</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {STAGES.map((stage) => {
            const items = byStage(stage.key);
            return (
              <div key={stage.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={stage.className}>{stage.label}</Badge>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                {items.map((l) => (
                  <Card key={l.id}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{l.name}</CardTitle></CardHeader>
                    <CardContent className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {l.email}</div>
                      {l.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {l.phone}</div>}
                      {l.company && <div className="flex items-center gap-1"><Building className="h-3 w-3" /> {l.company}</div>}
                      {l.message && <p className="text-foreground/70 pt-1 line-clamp-2">{l.message}</p>}
                      <div className="pt-1"><Badge variant="outline" className="text-[10px]">{l.source}</Badge></div>
                      <div className="flex flex-wrap gap-1 pt-2">
                        {STAGES.filter((s) => s.key !== stage.key).map((s) => (
                          <Button key={s.key} size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => move(l.id, s.key)}>→ {s.label}</Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">—</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
