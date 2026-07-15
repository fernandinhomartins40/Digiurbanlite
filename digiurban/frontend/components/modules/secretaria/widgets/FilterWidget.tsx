'use client';
import { useEffect, useMemo, useState } from 'react';
import { queryRecords } from '@/services/registry.service';
import { Card, CardContent } from '@/components/ui/card';
import type { WidgetProps } from './WidgetRegistry';

/**
 * FILTER — filtros rápidos (facets) + busca. Alimenta os outros widgets via
 * onFiltersChange (filtros compartilhados no workspace).
 */
export function FilterWidget({ code, schema, sharedFilters, onFiltersChange }: WidgetProps) {
  const facetFields = useMemo(() => (schema.fields ?? []).filter((f) => f.facetable && f.indexable), [schema]);
  const [facetValues, setFacetValues] = useState<Record<string, Array<{ value: string; count: number }>>>({});
  const [search, setSearch] = useState((sharedFilters?.__search as string) || '');

  useEffect(() => {
    if (facetFields.length === 0) return;
    queryRecords({ entityType: code, facets: facetFields.map((f) => f.key), pageSize: 1 })
      .then((res) => setFacetValues(res.facets || {}))
      .catch(() => setFacetValues({}));
  }, [code, facetFields]);

  const active = (sharedFilters || {}) as Record<string, unknown>;
  const setFilter = (key: string, value: unknown) => {
    const next = { ...active };
    if (value == null || value === '') delete next[key]; else next[key] = value;
    onFiltersChange?.(next);
  };

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-2 p-3">
        <input
          className="h-9 min-w-[200px] flex-1 rounded-md border bg-background px-3 text-sm"
          placeholder="Buscar…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
          onKeyDown={(e) => { if (e.key === 'Enter') setFilter('__search', search); }}
          onBlur={() => setFilter('__search', search)}
        />
        {facetFields.map((f) => (
          <div key={f.key} className="flex items-center gap-1">
            {(facetValues[f.key] || []).slice(0, 4).map((opt) => {
              const isActive = active[f.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilter(f.key, isActive ? null : opt.value)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${isActive ? 'border-teal-600 bg-teal-600 text-white' : 'hover:bg-muted'}`}
                  title={f.label}
                >
                  {opt.value} <span className="opacity-70">({opt.count})</span>
                </button>
              );
            })}
          </div>
        ))}
        {Object.keys(active).length > 0 && (
          <button onClick={() => onFiltersChange?.({})} className="text-xs text-muted-foreground underline">limpar</button>
        )}
      </CardContent>
    </Card>
  );
}
