'use client'

/**
 * Lista de compras: o nome, os itens (cada um com seus preços), o total e,
 * quando ligada a um processo interno, "Gerar documento". Critério de cálculo,
 * região do PNCP e correção pelo IPCA ficam em "Ajustes da pesquisa".
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp, Download, FileCheck2, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getFullApiUrl } from '@/lib/api-config'
import { ListItemRow } from '@/components/admin/price-research/ListItemRow'
import { ManualQuoteDialog } from '@/components/admin/price-research/ManualQuoteDialog'
import { METHOD_LABEL, PriceItem, PriceMethod, PriceResearch, UFS, brl } from '@/lib/price-research'

export default function ListaDeComprasPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [research, setResearch] = useState<PriceResearch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [newItem, setNewItem] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [busy, setBusy] = useState<string | null>(null)
  const [attachFor, setAttachFor] = useState<PriceItem | null>(null)
  const [settings, setSettings] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await apiRequest(`/prices/researches/${id}`)
      const data = response?.data?.research as PriceResearch
      setResearch(data)
      setTitle((current) => current || data.title)
      setError(null)
    } catch (loadError: any) {
      setError(loadError?.message || 'Não foi possível abrir a lista')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (user) load()
  }, [user?.id, load]) // eslint-disable-line react-hooks/exhaustive-deps

  const searching = research?.items.some((item) => item.searchStatus === 'BUSCANDO')
  useEffect(() => {
    if (!searching) return
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [searching, load])

  const update = async (data: Record<string, unknown>) => {
    try {
      await apiRequest(`/prices/researches/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      await load()
    } catch (saveError: any) {
      toast({ variant: 'destructive', title: 'Não foi possível salvar', description: saveError?.message })
    }
  }

  const addItem = async () => {
    if (newItem.trim().length < 3) return
    try {
      setBusy('item')
      const response = await apiRequest(`/prices/researches/${id}/items`, {
        method: 'POST',
        body: JSON.stringify({ description: newItem.trim(), quantity: Number(newQty.replace(',', '.')) || 1 }),
      })
      setLastAdded(response?.data?.item?.id || null)
      setNewItem('')
      setNewQty('1')
      await load()
    } catch (saveError: any) {
      toast({ variant: 'destructive', title: 'Não foi possível adicionar', description: saveError?.message })
    } finally {
      setBusy(null)
    }
  }

  const generate = async () => {
    try {
      setBusy('document')
      const response = await apiRequest(`/prices/researches/${id}/document`, { method: 'POST' })
      toast({ title: 'Documento gerado', description: `Valor estimado: ${brl(response?.data?.total)}. Confira e assine no processo.` })
      const documentId = response?.data?.document?.id
      if (documentId && research?.processId) router.push(`/admin/processos-internos/${research.processId}/documentos/${documentId}`)
      else await load()
    } catch (saveError: any) {
      toast({ variant: 'destructive', title: 'Ainda não dá para gerar', description: saveError?.message })
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    if (!window.confirm('Apagar esta lista e todos os preços dela?')) return
    try {
      await apiRequest(`/prices/researches/${id}`, { method: 'DELETE' })
      router.push('/admin/pesquisa-precos')
    } catch (saveError: any) {
      toast({ variant: 'destructive', title: 'Não foi possível apagar', description: saveError?.message })
    }
  }

  if (error) return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
  if (!research) return <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</p>

  const readOnly = research.status === 'CONCLUIDA'

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={research.processId ? `/admin/pesquisa-precos?processo=${research.processId}` : '/admin/pesquisa-precos'} className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Pesquisa de preços
      </Link>

      {/* nome e total */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">Lista de compras</p>
          {readOnly ? (
            <h1 className="text-2xl font-bold text-gray-900">{research.title}</h1>
          ) : (
            <Input
              aria-label="Nome da lista"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== research.title && update({ title })}
              className="h-auto border-0 bg-transparent px-0 text-2xl font-bold text-gray-900 shadow-none focus-visible:ring-0"
            />
          )}
          {research.process && (
            <p className="text-sm text-gray-600">
              Processo <Link href={`/admin/processos-internos/${research.process.id}`} className="text-blue-700 hover:underline">{research.process.number}</Link> — {research.process.subject}
            </p>
          )}
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-gray-500">Valor estimado da lista</p>
          <p className="text-3xl font-bold text-gray-900">{brl(research.total)}</p>
        </div>
      </div>

      {readOnly && (
        <div className="flex flex-col gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-800 sm:flex-row sm:items-center sm:justify-between">
          <span>Documento gerado no processo. Para mudar algo, reabra a lista.</span>
          <div className="flex gap-2">
            {research.documentId && research.processId && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/processos-internos/${research.processId}/documentos/${research.documentId}`}>Ver documento</Link>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => update({ status: 'RASCUNHO' })}>
              <RotateCcw className="mr-1 h-4 w-4" /> Reabrir
            </Button>
          </div>
        </div>
      )}

      {/* itens */}
      <ul className="space-y-2">
        {research.items.map((item) => (
          <ListItemRow key={item.id} item={item} readOnly={readOnly} startOpen={item.id === lastAdded} onChanged={load} onAttach={setAttachFor} />
        ))}
      </ul>
      {research.items.length === 0 && (
        <p className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-600">Lista vazia. Escreva abaixo o que vai comprar.</p>
      )}

      {!readOnly && (
        <form
          className="flex flex-col gap-2 rounded-xl border bg-white p-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            addItem()
          }}
        >
          <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Adicionar produto: ex. caneta esferográfica azul" className="flex-1" />
          <Input aria-label="Quantidade" inputMode="decimal" value={newQty} onChange={(e) => setNewQty(e.target.value)} className="sm:w-24" />
          <Button type="submit" disabled={busy === 'item' || newItem.trim().length < 3}>
            {busy === 'item' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}Adicionar e buscar preço
          </Button>
        </form>
      )}

      {/* ações */}
      <div className="flex flex-wrap gap-2 border-t pt-4">
        {research.processId && !readOnly && (
          <Button onClick={generate} disabled={!!busy || !!searching || research.items.length === 0}>
            {busy === 'document' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-1 h-4 w-4" />}Gerar documento no processo
          </Button>
        )}
        <Button variant="outline" asChild>
          <a href={getFullApiUrl(`/prices/researches/${id}/export.csv`)}>
            <Download className="mr-1 h-4 w-4" /> Baixar planilha
          </a>
        </Button>
        <Button variant="ghost" onClick={() => setSettings(!settings)}>
          {settings ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}Ajustes da pesquisa
        </Button>
        {!readOnly && (
          <Button variant="ghost" className="text-red-700" onClick={remove}>
            <Trash2 className="mr-1 h-4 w-4" /> Apagar lista
          </Button>
        )}
      </div>
      {!research.processId && (
        <p className="text-xs text-gray-500">Para virar documento oficial, a lista precisa nascer da etapa &quot;Pesquisa de preços&quot; de um processo interno.</p>
      )}

      {settings && (
        <div className="grid gap-4 rounded-xl border bg-white p-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="method">Preço de referência pela</Label>
            <select id="method" value={research.method} disabled={readOnly} onChange={(e) => update({ method: e.target.value as PriceMethod })} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
              {(Object.keys(METHOD_LABEL) as PriceMethod[]).map((method) => (
                <option key={method} value={method}>{METHOD_LABEL[method]}{method === 'MEDIANA' ? ' (recomendado)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="region">Compras de prefeituras de</Label>
            <select
              id="region"
              value={research.nationwide ? 'BR' : research.uf || ''}
              disabled={readOnly}
              onChange={(e) => (e.target.value === 'BR' ? update({ nationwide: true }) : update({ nationwide: false, uf: e.target.value }))}
              className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {!research.uf && <option value="">Escolha o estado</option>}
              {UFS.map((uf) => (
                <option key={uf} value={uf}>{uf}{uf === research.uf ? ' (nosso estado)' : ''}</option>
              ))}
              <option value="BR">Brasil todo</option>
            </select>
          </div>
          <label className="flex items-start gap-2 pt-6 text-sm text-gray-700">
            <input type="checkbox" className="mt-0.5" checked={research.applyIpca} disabled={readOnly} onChange={(e) => update({ applyIpca: e.target.checked })} />
            Atualizar os preços pela inflação (IPCA) até hoje
          </label>
        </div>
      )}

      <ManualQuoteDialog item={attachFor} onClose={() => setAttachFor(null)} onSaved={load} />
    </div>
  )
}
