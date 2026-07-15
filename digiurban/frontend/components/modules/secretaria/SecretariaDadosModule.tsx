'use client';

/**
 * ============================================================================
 * MÓDULO DADOS (geral, por secretaria)
 * ============================================================================
 * Reforma de módulos por secretaria (PLANO-MODULOS-GERAIS-SECRETARIA.md).
 * UM ÚNICO módulo que concentra e trata TODOS os dados coletados da secretaria
 * (o customData dos serviços COM_DADOS), eliminando os módulos por-serviço.
 *
 * Dirigido por metadados do Registry:
 *   - seletor por TIPO de dado (EntityType) no topo;
 *   - tabela rica (colunas/busca/filtros/facets vêm do FieldDefinition);
 *   - painel (KPIs/gráficos) automático;
 *   - (mapa/cadastro/relações entram nas próximas fatias — UI-3/UI-4).
 *
 * Não toca tabelas dedicadas nem apps. Lê só o Registry.
 * ============================================================================
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  listEntityTypes,
  getEntityTypeSchema,
  queryRecords,
  getDashboard,
  listRecords,
  approveRecord,
  rejectRecord,
  type EntityType,
  type FieldDefinition,
} from '@/services/registry.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { RegistryRecordForm } from './RegistryRecordForm';
import { Database, Search, LayoutGrid, Table2, Loader2, Inbox, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Props {
  /** Código do departamento (Department.department string usada no EntityType). */
  departmentCode?: string;
  departmentName?: string;
}

type View = 'table' | 'approval' | 'panel';

type EntityTypeWithCount = EntityType & { _count?: { records: number; fields: number } };

interface KpiItem { label: string; value: number; format?: string }
interface ChartItem { type: 'pie' | 'bar'; title: string; data: Array<{ name: string; value: number }> }

export function SecretariaDadosModule({ departmentCode, departmentName }: Props) {
  const [types, setTypes] = useState<EntityTypeWithCount[]>([]);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [schema, setSchema] = useState<EntityType | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Carregar os tipos da secretaria
  useEffect(() => {
    (async () => {
      setLoadingTypes(true);
      try {
        const { entityTypes } = await listEntityTypes();
        const filtered = departmentCode
          ? entityTypes.filter((t) => !t.department || t.department === departmentCode)
          : entityTypes;
        setTypes(filtered);
        setActiveCode(filtered[0]?.code ?? null);
      } catch {
        setTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    })();
  }, [departmentCode]);

  // Carregar schema do tipo ativo
  useEffect(() => {
    if (!activeCode) { setSchema(null); return; }
    getEntityTypeSchema(activeCode).then(setSchema).catch(() => setSchema(null));
  }, [activeCode]);

  if (loadingTypes) {
    return <div className="flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando tipos de dados…</div>;
  }

  if (types.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          <Inbox className="h-8 w-8" />
          <p className="font-medium text-foreground">Nenhum dado coletado ainda</p>
          <p className="text-sm">Quando serviços com dados forem criados{departmentName ? ` na ${departmentName}` : ''}, os registros aparecem aqui automaticamente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-teal-600" />
        <h2 className="text-lg font-semibold">Dados coletados</h2>
      </div>

      {/* Seletor por tipo de dado */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {types.map((t) => (
          <button
            key={t.code}
            onClick={() => setActiveCode(t.code)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              activeCode === t.code ? 'bg-teal-600 text-white' : 'bg-muted/50 text-foreground hover:bg-muted'
            }`}
          >
            {t.name}
            {t._count?.records != null && (
              <span className={`ml-2 rounded-full px-1.5 text-xs ${activeCode === t.code ? 'bg-teal-500' : 'bg-background'}`}>
                {t._count.records}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeCode && schema && <EntityTypeView code={activeCode} schema={schema} />}
    </div>
  );
}

/** Visão de um tipo: Registros / Aprovação / Painel + cadastro. */
function EntityTypeView({ code, schema }: { code: string; schema: EntityType }) {
  const [view, setView] = useState<View>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; data: Record<string, unknown> } | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  const openNew = () => { setEditing(undefined); setFormOpen(true); };
  const openEdit = (rec: { id: string; data: Record<string, unknown> }) => { setEditing(rec); setFormOpen(true); };
  const afterSave = () => { setFormOpen(false); setReloadKey((k) => k + 1); };

  const tabBtn = (v: View, icon: React.ReactNode, label: string) => (
    <button onClick={() => setView(v)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md ${view === v ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'}`}>
      {icon} {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
          {tabBtn('table', <Table2 className="h-4 w-4" />, 'Registros')}
          {tabBtn('approval', <Clock className="h-4 w-4" />, 'Aprovação')}
          {tabBtn('panel', <LayoutGrid className="h-4 w-4" />, 'Painel')}
        </div>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Novo registro</Button>
      </div>

      {view === 'table' && <RecordsTable key={`t-${reloadKey}`} code={code} schema={schema} onEdit={openEdit} />}
      {view === 'approval' && <ApprovalQueue key={`a-${reloadKey}`} code={code} schema={schema} onChanged={() => setReloadKey((k) => k + 1)} />}
      {view === 'panel' && <DashboardPanel key={`p-${reloadKey}`} code={code} />}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar registro' : `Novo · ${schema.name}`}</DialogTitle>
          </DialogHeader>
          <RegistryRecordForm schema={schema} record={editing} onSaved={afterSave} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Fila de aprovação: registros PENDING, com aprovar/rejeitar (COORDINATOR+). */
function ApprovalQueue({ code, schema, onChanged }: { code: string; schema: EntityType; onChanged: () => void }) {
  const { user } = useAdminAuth();
  const canApprove = !!user && user.role !== 'USER';
  const [rows, setRows] = useState<Array<{ id: string; data: Record<string, unknown>; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const primary = (schema.fields ?? []).find((f) => f.displayInTable)?.key || (schema.fields ?? [])[0]?.key;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRecords(code, { status: 'PENDING', pageSize: 100 });
      setRows(res.records);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [code]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id);
    try {
      if (action === 'approve') await approveRecord(id); else await rejectRecord(id);
      await load();
      onChanged();
    } finally { setBusy(null); }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando fila…</div>;
  if (rows.length === 0) return <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum registro pendente de aprovação.</CardContent></Card>;

  return (
    <Card><CardContent className="p-0">
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{primary ? String(r.data[primary] ?? '—') : r.id}</div>
              <div className="text-xs text-muted-foreground">Enviado em {new Date(r.createdAt).toLocaleDateString('pt-BR')}</div>
            </div>
            {canApprove ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}>
                  <CheckCircle2 className="mr-1 h-4 w-4 text-green-600" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, 'reject')}>
                  <XCircle className="mr-1 h-4 w-4 text-red-600" /> Rejeitar
                </Button>
              </div>
            ) : (
              <Badge variant="secondary">Pendente</Badge>
            )}
          </li>
        ))}
      </ul>
    </CardContent></Card>
  );
}

/** Tabela de registros com busca, filtros e facets — tudo do FieldDefinition. */
function RecordsTable({ code, schema, onEdit }: { code: string; schema: EntityType; onEdit: (rec: { id: string; data: Record<string, unknown> }) => void }) {
  const fields = schema.fields ?? [];
  const tableCols = useMemo(() => {
    const cols = fields.filter((f) => f.displayInTable);
    return cols.length ? cols : fields.slice(0, 5);
  }, [fields]);
  const filterFields = useMemo(() => fields.filter((f) => f.filterable), [fields]);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters = Object.entries(filters)
        .filter(([, v]) => v && v !== 'all')
        .map(([field, value]) => ({ field, op: 'eq', value }));
      const res = await queryRecords({
        entityType: code,
        search: search.trim() || undefined,
        filters: activeFilters,
        pageSize: 50,
      });
      setRows(res.records as Array<{ id: string; data: Record<string, unknown> }>);
      setTotal(res.total);
    } catch {
      setRows([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [code, search, filters]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const fmt = (f: FieldDefinition, v: unknown) => {
    if (v == null || v === '') return '—';
    if (f.dataType === 'BOOL') return v ? 'Sim' : 'Não';
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  };

  return (
    <div className="space-y-3">
      {/* Busca + filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {filterFields.map((f) => (
          <select
            key={f.key}
            value={filters[f.key] ?? 'all'}
            onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">{f.label}: todos</option>
            {f.dataType === 'BOOL' && (<><option value="true">Sim</option><option value="false">Não</option></>)}
          </select>
        ))}
        <Badge variant="secondary">{total}</Badge>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum registro.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                  {tableCols.map((c) => (<th key={c.key} className="px-4 py-2 font-medium">{c.label}</th>))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b cursor-pointer hover:bg-muted/20" onClick={() => onEdit(r)}>
                    {tableCols.map((c) => (
                      <td key={c.key} className="px-4 py-2">
                        {c.isPII ? <span className="text-muted-foreground">{fmt(c, r.data[c.key])}</span> : fmt(c, r.data[c.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Painel automático (KPIs + gráficos) do tipo. */
function DashboardPanel({ code }: { code: string }) {
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboard(code)
      .then((d) => { setKpis((d.kpis as KpiItem[]) || []); setCharts((d.charts as ChartItem[]) || []); })
      .catch(() => { setKpis([]); setCharts([]); })
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando painel…</div>;

  return (
    <div className="space-y-4">
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((k, i) => (
            <Card key={i}><CardContent className="p-4">
              <div className="text-2xl font-semibold tabular-nums text-teal-700">{k.value.toLocaleString('pt-BR')}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.label}</div>
            </CardContent></Card>
          ))}
        </div>
      )}
      {charts.map((c, i) => (
        <Card key={i}><CardContent className="p-4">
          <div className="mb-3 text-sm font-medium">{c.title}</div>
          <ul className="space-y-1.5">
            {c.data.slice(0, 8).map((d, j) => {
              const max = Math.max(...c.data.map((x) => x.value), 1);
              return (
                <li key={j} className="flex items-center gap-2 text-sm">
                  <span className="w-32 shrink-0 truncate">{d.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${(d.value / max) * 100}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">{d.value}</span>
                </li>
              );
            })}
          </ul>
        </CardContent></Card>
      ))}
      {kpis.length === 0 && charts.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          Sem indicadores configurados. Marque campos como métrica ou facet no tipo de dado.
        </div>
      )}
    </div>
  );
}
