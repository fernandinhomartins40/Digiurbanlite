'use client'

/**
 * Pesquisa de preços (IN 65/2021, Lei 14.133/2021 art. 23): lista das
 * pesquisas, situação das fontes oficiais e começo de uma nova. A pesquisa
 * ligada a um processo interno vira o documento "Pesquisa de preços e mapa
 * comparativo" da etapa.
 */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, Plus, Search, XCircle } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ResearchRow {
  id: string
  title: string
  status: 'RASCUNHO' | 'CONCLUIDA'
  processId: string | null
  createdByName: string
  updatedAt: string
  itemCount: number
}

interface Health {
  checkedAt: string
  sources: Array<{ name: string; ok: boolean; message: string }>
}

function PesquisaPrecos() {
  const router = useRouter()
  const params = useSearchParams()
  const processId = params.get('processo')
  const { user, apiRequest } = useAdminAuth()
  const [items, setItems] = useState<ResearchRow[]>([])
  const [health, setHealth] = useState<Health | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [firstItem, setFirstItem] = useState('')
  const [busy, setBusy] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    apiRequest('/prices/health').then((response: any) => setHealth(response?.data?.health || null)).catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    const query = new URLSearchParams()
    if (search.trim()) query.set('search', search.trim())
    if (processId) query.set('processId', processId)
    const timer = setTimeout(() => {
      apiRequest(`/prices/researches?${query.toString()}`)
        .then((response: any) => !cancelled && setItems(response?.data?.items || []))
        .catch((loadError: any) => !cancelled && setError(loadError?.message || 'Não foi possível carregar'))
        .finally(() => !cancelled && setLoading(false))
    }, search ? 300 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, search, processId])

  // veio do processo interno: abre a pesquisa dele ou já oferece criar
  useEffect(() => {
    if (processId && !loading && items.length === 0 && !error) setCreating(true)
  }, [processId, loading, items.length, error])

  const create = async () => {
    setCreateError(null)
    try {
      setBusy(true)
      const response = await apiRequest('/prices/researches', {
        method: 'POST',
        body: JSON.stringify({ title, processId: processId || undefined, items: firstItem.trim() ? [{ description: firstItem.trim() }] : [] }),
      })
      const id = response?.data?.research?.id
      if (id) router.push(`/admin/pesquisa-precos/${id}`)
    } catch (saveError: any) {
      setCreateError(saveError?.message || 'Não foi possível criar')
    } finally {
      setBusy(false)
    }
  }

  const failing = health?.sources.filter((source) => !source.ok) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesquisa de preços</h1>
          <p className="text-sm text-gray-600">Preços de compras públicas para estimar o valor da contratação (IN 65/2021).</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> Nova pesquisa
        </Button>
      </div>

      {health && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-white px-3 py-2 text-xs text-gray-600">
          <span className="font-medium text-gray-800">Fontes oficiais</span>
          {health.sources.map((source) => (
            <span key={source.name} className="inline-flex items-center gap-1" title={source.message}>
              {source.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
              {source.name}
            </span>
          ))}
          <span className="text-gray-400">conferido em {new Date(health.checkedAt).toLocaleString('pt-BR')}</span>
          {failing.length > 0 && <span className="w-full text-amber-700">Fora do ar na última conferência: {failing.map((source) => `${source.name} (${source.message})`).join('; ')}. A busca usa as demais.</span>}
        </div>
      )}

      {processId && (
        <p className="rounded-md bg-blue-50 p-2 text-sm text-blue-800">
          Pesquisas deste processo. <Link href={`/admin/processos-internos/${processId}`} className="underline">Voltar ao processo</Link>
        </p>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Procurar pelo nome" className="pl-9" />
      </div>

      {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-600">
          Nenhuma pesquisa ainda. Comece uma pelo botão &quot;Nova pesquisa&quot; ou pela etapa de pesquisa de preços de um processo interno.
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-white">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/admin/pesquisa-precos/${item.id}`} className="flex flex-col gap-1 p-4 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    {item.itemCount} item(ns) · {item.createdByName} · atualizada em {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
                    {item.processId ? ' · ligada a processo interno' : ''}
                  </p>
                </div>
                <span className={item.status === 'CONCLUIDA' ? 'text-xs font-medium text-green-700' : 'text-xs text-gray-500'}>
                  {item.status === 'CONCLUIDA' ? 'Documento gerado' : 'Em andamento'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova pesquisa de preços</DialogTitle>
            <DialogDescription>
              {processId ? 'Ligada ao processo interno: ao final, gera o documento da etapa.' : 'Pesquisa avulsa. Para virar documento, comece pela etapa do processo interno.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="research-title">Objeto da compra {processId && <span className="font-normal text-gray-500">(vazio = assunto do processo)</span>}</Label>
              <Input id="research-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Material de escritório para a Educação" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="research-item">Primeiro item (opcional)</Label>
              <Input id="research-item" value={firstItem} onChange={(e) => setFirstItem(e.target.value)} placeholder="Ex.: Papel sulfite A4 75g branco" />
            </div>
            {createError && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)} disabled={busy}>Cancelar</Button>
            <Button onClick={create} disabled={busy || (!title.trim() && !processId)}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Começar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PesquisaPrecosPage() {
  return (
    <Suspense fallback={null}>
      <PesquisaPrecos />
    </Suspense>
  )
}
