'use client';
import { useEffect, useState, useCallback } from 'react';
import { queryRecords, type EntityType } from '@/services/registry.service';

/** Converte sharedFilters ({field: value, __search}) em input do Registry query. */
export function buildQuery(code: string, schema: EntityType, shared?: Record<string, unknown>, pageSize = 50) {
  const filters: Array<{ field: string; op: string; value: unknown }> = [];
  let search: string | undefined;
  const keys = new Set((schema.fields ?? []).map((f) => f.key));
  for (const [k, v] of Object.entries(shared || {})) {
    if (k === '__search') { search = String(v || '') || undefined; continue; }
    if (keys.has(k) && v != null && v !== '') filters.push({ field: k, op: 'eq', value: v });
  }
  return { entityType: code, filters, search, pageSize };
}

/** Hook: registros do tipo aplicando os filtros compartilhados do workspace. */
export function useRecords(code: string, schema: EntityType, shared?: Record<string, unknown>, reloadKey?: number) {
  const [rows, setRows] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await queryRecords(buildQuery(code, schema, shared));
      setRows(res.records as Array<{ id: string; data: Record<string, unknown> }>);
      setTotal(res.total);
    } catch { setRows([]); setTotal(0); } finally { setLoading(false); }
  }, [code, schema, JSON.stringify(shared)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load, reloadKey]);

  return { rows, total, loading, reload: load };
}
