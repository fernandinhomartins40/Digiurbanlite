'use client';

/**
 * ============================================================================
 * DataWorkspace — grade de widgets de um EntityType (módulo Gestão de Dados)
 * ============================================================================
 * Renderiza o layout de widgets vindo de /workspace (salvo ou sugerido).
 * Filtros compartilhados (FilterWidget) alimentam os demais. Barra de
 * ferramentas: Novo registro, Adicionar/Remover widget, Adotar layout (W5).
 * Ver PLANO-MODULO-GESTAO-DADOS-WIDGETS.md.
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getWorkspace, getEntityTypeSchema, adoptLayout, createWidget, deleteWidget,
  type EntityType, type DataWidget, type WidgetType,
} from '@/services/registry.service';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Settings2, X, Save, Loader2 } from 'lucide-react';
import { renderWidget, widgetSpan, WidgetSkeleton } from './widgets/WidgetRegistry';
import { RegistryRecordForm } from './RegistryRecordForm';

const WIDGET_LABELS: Record<string, string> = {
  STATS: 'Visão geral', FILTER: 'Filtros', TABLE: 'Tabela', CARDS: 'Cartões',
  CHART: 'Gráficos', TIMELINE: 'Evolução', MAP: 'Mapa', AGENDA: 'Agenda',
  ENROLLMENT: 'Inscritos', APPROVAL: 'Aprovação', RELATIONS: 'Relações',
};
const ADDABLE: WidgetType[] = ['STATS', 'FILTER', 'TABLE', 'CARDS', 'CHART', 'TIMELINE', 'MAP', 'AGENDA', 'ENROLLMENT', 'APPROVAL'];

export function DataWorkspace({ code }: { code: string }) {
  const { user } = useAdminAuth();
  const canManage = !!user && user.role !== 'USER';

  const [schema, setSchema] = useState<EntityType | null>(null);
  const [widgets, setWidgets] = useState<DataWidget[]>([]);
  const [source, setSource] = useState<'saved' | 'suggested'>('suggested');
  const [entityTypeId, setEntityTypeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [sharedFilters, setSharedFilters] = useState<Record<string, unknown>>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sc, ws] = await Promise.all([getEntityTypeSchema(code), getWorkspace(code)]);
      setSchema(sc);
      setWidgets(ws.widgets);
      setSource(ws.source);
      // entityTypeId vem de widgets salvos; se sugestão, buscamos via schema (não expõe id) → só necessário p/ criar widget
      const saved = ws.widgets.find((w) => w.entityTypeId);
      setEntityTypeId(saved?.entityTypeId || '');
    } catch { setWidgets([]); } finally { setLoading(false); }
  }, [code]);

  useEffect(() => { load(); }, [load]);

  const afterRecordSave = () => { setFormOpen(false); setReloadKey((k) => k + 1); };

  const doAdopt = async () => {
    setBusy(true);
    try { await adoptLayout(code); await load(); } finally { setBusy(false); }
  };

  const addWidget = async (type: WidgetType) => {
    if (!entityTypeId) { // precisa materializar o layout primeiro
      await doAdopt();
    }
    const etId = entityTypeId || (await getWorkspace(code)).widgets.find((w) => w.entityTypeId)?.entityTypeId || '';
    if (!etId) return;
    setBusy(true);
    try {
      await createWidget({ entityTypeId: etId, scope: 'SHARED', type, title: WIDGET_LABELS[type] || type, order: widgets.length });
      setAddOpen(false);
      await load();
    } finally { setBusy(false); }
  };

  const removeWidget = async (id?: string) => {
    if (!id) return;
    setBusy(true);
    try { await deleteWidget(id); await load(); } finally { setBusy(false); }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>;
  if (!schema) return <div className="p-8 text-center text-muted-foreground">Tipo de dado indisponível.</div>;

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {source === 'suggested' ? 'Layout sugerido automaticamente' : 'Layout da secretaria'}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="mr-1 h-4 w-4" /> Novo registro</Button>
          {canManage && (
            <>
              {source === 'suggested' && (
                <Button size="sm" variant="outline" onClick={doAdopt} disabled={busy}>
                  {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Salvar este layout
                </Button>
              )}
              <Button size="sm" variant={editMode ? 'default' : 'outline'} onClick={() => setEditMode((v) => !v)}>
                <Settings2 className="mr-1 h-4 w-4" /> {editMode ? 'Concluir' : 'Personalizar'}
              </Button>
              {editMode && <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="mr-1 h-4 w-4" /> Widget</Button>}
            </>
          )}
        </div>
      </div>

      {/* Grade de widgets (12 colunas) */}
      <div className="grid grid-cols-12 gap-4">
        {widgets.map((w, i) => {
          const span = widgetSpan(w.type);
          return (
            <div key={w.id || `${w.type}-${i}`} className={`col-span-12 ${span <= 6 ? 'md:col-span-6' : span <= 8 ? 'md:col-span-8' : ''} relative`}>
              {editMode && w.id && (
                <button onClick={() => removeWidget(w.id)} className="absolute -right-2 -top-2 z-10 rounded-full bg-red-600 p-1 text-white shadow" title="Remover widget">
                  <X className="h-3 w-3" />
                </button>
              )}
              {renderWidget(w.type, {
                code, schema, config: w.config,
                sharedFilters, onFiltersChange: setSharedFilters,
                reloadKey, onChanged: () => setReloadKey((k) => k + 1),
              }) || <WidgetSkeleton label={WIDGET_LABELS[w.type] || w.type} />}
            </div>
          );
        })}
      </div>

      {/* Modal: novo registro */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo · {schema.name}</DialogTitle></DialogHeader>
          <RegistryRecordForm schema={schema} onSaved={afterRecordSave} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal: adicionar widget */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar widget</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {ADDABLE.map((t) => (
              <Button key={t} variant="outline" disabled={busy} onClick={() => addWidget(t)} className="justify-start">
                <Plus className="mr-2 h-4 w-4" /> {WIDGET_LABELS[t] || t}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
