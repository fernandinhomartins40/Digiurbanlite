'use client'

/**
 * Mapa dos pedidos com filtros simples (situação, secretaria, período) e os
 * números do que está no mapa. Usado pela página Mapa dos pedidos (todo
 * servidor, no escopo dele) e pela aba Território do Painel do Prefeito.
 */

import { lazy, Suspense, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { mapaDemandasService, type MapFilters, type MapProtocol } from '@/lib/services/gabinete.service'

const ProtocolMapEnhanced = lazy(() =>
  import('@/components/admin/gabinete/ProtocolMapEnhanced').then((module) => ({ default: module.ProtocolMapEnhanced }))
)

const STATUS_LABEL: Record<string, string> = {
  VINCULADO: 'Novos',
  PROGRESSO: 'Em andamento',
  ATUALIZACAO: 'Atualização',
  PENDENCIA: 'Pendência',
  CONCLUIDO: 'Concluídos',
  CANCELADO: 'Cancelados',
}

export function ProtocolsMapView({ defaultSituacao = 'abertos' }: { defaultSituacao?: MapFilters['situacao'] }) {
  const [filters, setFilters] = useState<MapFilters>({ situacao: defaultSituacao })
  const [protocols, setProtocols] = useState<MapProtocol[]>([])
  const [meta, setMeta] = useState<{ shown: number; limit: number; withoutLocation: number } | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [departments, setDepartments] = useState<Array<{ departmentId: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([mapaDemandasService.getProtocolsWithLocation(filters), mapaDemandasService.getStats(filters)])
      .then(([points, numbers]) => {
        if (cancelled) return
        setProtocols(points.data || [])
        setMeta(points.meta || null)
        setStats(numbers.data || null)
        // opções de secretaria: as que aparecem sem filtro de secretaria
        if (!filters.departmentId) setDepartments((numbers.data?.byDepartment || []).filter((item: any) => item.departmentId))
      })
      .catch((loadError) => !cancelled && setError(loadError?.message || 'Não foi possível carregar o mapa'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [filters])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[
            { id: 'abertos' as const, label: 'Em aberto' },
            { id: 'atrasados' as const, label: 'Atrasados' },
            { id: 'todos' as const, label: 'Todos' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilters((current) => ({ ...current, situacao: item.id }))}
              className={`rounded-md px-3 py-1 text-sm ${filters.situacao === item.id ? 'bg-white font-medium shadow-sm' : 'text-gray-600'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {departments.length > 1 && (
          <select
            value={filters.departmentId || ''}
            onChange={(e) => setFilters((current) => ({ ...current, departmentId: e.target.value || undefined }))}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            aria-label="Secretaria"
          >
            <option value="">Todas as secretarias</option>
            {departments.map((item) => (
              <option key={item.departmentId} value={item.departmentId}>{item.name}</option>
            ))}
          </select>
        )}
        <label className="text-xs text-gray-600">
          De
          <input type="date" value={filters.from || ''} onChange={(e) => setFilters((current) => ({ ...current, from: e.target.value || undefined }))} className="ml-1 h-9 rounded-md border px-2 text-sm" />
        </label>
        <label className="text-xs text-gray-600">
          até
          <input type="date" value={filters.to || ''} onChange={(e) => setFilters((current) => ({ ...current, to: e.target.value || undefined }))} className="ml-1 h-9 rounded-md border px-2 text-sm" />
        </label>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
      </div>

      {stats && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-800">{stats.totalWithLocation} no mapa</span>
          {(stats.byStatus || []).map((item: any) => (
            <span key={item.status} className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{STATUS_LABEL[item.status] || item.status}: {item.count}</span>
          ))}
          {meta && meta.withoutLocation > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800" title="O endereço é procurado sozinho a cada 15 minutos">
              {meta.withoutLocation} ainda sem localização
            </span>
          )}
          {meta && meta.shown >= meta.limit && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">mostrando os {meta.limit} mais recentes — use os filtros</span>}
        </div>
      )}

      {error ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : (
        <Suspense fallback={<Skeleton className="h-[400px] w-full md:h-[600px]" />}>
          <ProtocolMapEnhanced protocols={protocols as any} showClustering showHeatmap={false} height="mobile-responsive" />
        </Suspense>
      )}
    </div>
  )
}
