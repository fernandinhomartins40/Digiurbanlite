'use client';

/**
 * ============================================================================
 * WidgetEditor — o servidor cria seu próprio widget (W5, SAVED_QUERY)
 * ============================================================================
 * Monta um widget escolhendo: título, visualização (tabela/gráfico/contador/
 * mapa/agenda), filtros por campo, e escopo (pessoal ou da secretaria).
 * Salva via createWidget. Ver PLANO-MODULO-GESTAO-DADOS-WIDGETS.md (W5).
 * ============================================================================
 */

import { useState } from 'react';
import { createWidget, type EntityType, type WidgetType } from '@/services/registry.service';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const VIEWS: Array<{ value: WidgetType; label: string; hint: string }> = [
  { value: 'TABLE', label: 'Tabela', hint: 'lista de registros' },
  { value: 'CARDS', label: 'Cartões', hint: 'visão em cartão' },
  { value: 'CHART', label: 'Gráfico', hint: 'distribuição' },
  { value: 'STATS', label: 'Contador', hint: 'total/indicadores' },
  { value: 'MAP', label: 'Mapa', hint: 'quando há localização' },
  { value: 'AGENDA', label: 'Agenda', hint: 'quando há data' },
];

interface Filter { field: string; value: string }

interface Props {
  schema: EntityType;
  entityTypeId: string;
  onSaved: () => void;
  onCancel: () => void;
}

export function WidgetEditor({ schema, entityTypeId, onSaved, onCancel }: Props) {
  const { user } = useAdminAuth();
  const canShared = !!user && user.role !== 'USER';
  const filterableFields = (schema.fields ?? []).filter((f) => f.filterable || f.facetable);

  const [title, setTitle] = useState('');
  const [view, setView] = useState<WidgetType>('TABLE');
  const [scope, setScope] = useState<'PERSONAL' | 'SHARED'>('PERSONAL');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFilter = () => setFilters((f) => [...f, { field: filterableFields[0]?.key || '', value: '' }]);
  const setFilter = (i: number, patch: Partial<Filter>) => setFilters((f) => f.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const removeFilter = (i: number) => setFilters((f) => f.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!title.trim()) { setError('Dê um nome ao widget'); return; }
    setSaving(true); setError(null);
    try {
      const filterObj: Record<string, unknown> = {};
      for (const f of filters) if (f.field && f.value !== '') filterObj[f.field] = f.value;
      await createWidget({
        entityTypeId,
        scope,
        type: 'SAVED_QUERY',
        title: title.trim(),
        config: { view, filters: filterObj },
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Nome do widget</label>
        <Input placeholder="Ex.: Produtores orgânicos do Centro" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Como mostrar</label>
        <div className="grid grid-cols-3 gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              onClick={() => setView(v.value)}
              className={`rounded-md border p-2 text-left text-sm ${view === v.value ? 'border-teal-600 bg-teal-50' : 'hover:bg-muted'}`}
            >
              <div className="font-medium">{v.label}</div>
              <div className="text-xs text-muted-foreground">{v.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">Filtros (opcional)</label>
          <Button size="sm" variant="outline" onClick={addFilter} disabled={filterableFields.length === 0}>
            <Plus className="mr-1 h-3 w-3" /> filtro
          </Button>
        </div>
        {filters.length === 0 && <p className="text-xs text-muted-foreground">Sem filtro: mostra todos os registros.</p>}
        <div className="space-y-2">
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <select className="h-9 rounded-md border bg-background px-2 text-sm" value={f.field} onChange={(e) => setFilter(i, { field: e.target.value })}>
                {filterableFields.map((ff) => <option key={ff.key} value={ff.key}>{ff.label}</option>)}
              </select>
              <span className="text-sm text-muted-foreground">=</span>
              <Input className="h-9 flex-1" placeholder="valor" value={f.value} onChange={(e) => setFilter(i, { value: e.target.value })} />
              <button onClick={() => removeFilter(i)} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {canShared && (
        <div>
          <label className="mb-1 block text-sm font-medium">Visível para</label>
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
            <button onClick={() => setScope('PERSONAL')} className={`px-3 py-1.5 text-sm rounded-md ${scope === 'PERSONAL' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'}`}>Só eu</button>
            <button onClick={() => setScope('SHARED')} className={`px-3 py-1.5 text-sm rounded-md ${scope === 'SHARED' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'}`}>Toda a secretaria</button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar widget
        </Button>
      </div>
    </div>
  );
}
