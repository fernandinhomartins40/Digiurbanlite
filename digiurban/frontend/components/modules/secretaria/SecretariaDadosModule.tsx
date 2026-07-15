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
  type EntityType,
  type FieldDefinition,
} from '@/services/registry.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Database, Search, LayoutGrid, Table2, Loader2, Inbox } from 'lucide-react';

interface Props {
  /** Código do departamento (Department.department string usada no EntityType). */
  departmentCode?: string;
  departmentName?: string;
}

type View = 'table' | 'panel';

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

/** Visão de um tipo: alterna entre Tabela e Painel. */
function EntityTypeView({ code, schema }: { code: string; schema: EntityType }) {
  const [view, setView] = useState<View>('table');

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
        <button onClick={() => setView('table')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md ${view === 'table' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'}`}>
          <Table2 className="h-4 w-4" /> Registros
        </button>
        <button onClick={() => setView('panel')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md ${view === 'panel' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'}`}>
          <LayoutGrid className="h-4 w-4" /> Painel
        </button>
      </div>

      {view === 'table' ? <RecordsTable code={code} schema={schema} /> : <DashboardPanel code={code} />}
    </div>
  );
}

/** Tabela de registros com busca, filtros e facets — tudo do FieldDefinition. */
function RecordsTable({ code, schema }: { code: string; schema: EntityType }) {
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
                  <tr key={r.id} className="border-b hover:bg-muted/20">
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
