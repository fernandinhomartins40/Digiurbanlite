'use client'

/**
 * Uma pesquisa de preços: itens, busca nas fontes oficiais, decisões sobre
 * cada preço, critério (mediana/média/menor), correção pelo IPCA e o
 * documento do processo interno.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileCheck2, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getFullApiUrl } from '@/lib/api-config'
import { PriceItemCard } from '@/components/admin/price-research/PriceItemCard'
import { ManualQuoteDialog } from '@/components/admin/price-research/ManualQuoteDialog'
import { METHOD_LABEL, PriceItem, PriceMethod, PriceResearch, UFS, brl } from '@/lib/price-research'

export default function PesquisaPrecosDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [research, setResearch] = useState<PriceResearch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [newItem, setNewItem] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [quoteFor, setQuoteFor] = useState<PriceItem | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await apiRequest(`/prices/researches/${id}`)
      const data = response?.data?.research as PriceResearch
      setResearch(data)
      setTitle((current) => current || data.title)
      setError(null)
    } catch (loadError: any) {
      setError(loadError?.message || 'Não foi possível carregar a pesquisa')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (user) load()
  }, [user?.id, load]) // eslint-disable-line react-hooks/exhaustive-deps

  // enquanto algum item busca nas fontes, atualiza sozinho
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
    if (!newItem.trim()) return
    try {
      setBusy('item')
      await apiRequest(`/prices/researches/${id}/items`, { method: 'POST', body: JSON.stringify({ description: newItem.trim() }) })
      setNewItem('')
      await load()
    } catch (saveError: any) {
      toast({ variant: 'destructive', title: 'Não foi possível incluir', description: saveError?.message })
    } finally {
      setBusy(null)
    }
  }

  const generate = async () => {
    try {
      setBusy('document')
      const response = await apiRequest(`/prices/researches/${id}/document`, { method: 'POST' })
      toast({ title: 'Documento gerado', description: `Valor estimado: ${brl(response?.data?.total)}. Revise e assine no processo.` })
      const documentId = response?.data?.document?.id
      if (documentId && research?.processId) router.push(`/admin/processos-internos/${research.processId}/documentos/${documentId}`)
      else await load()
    } catch (saveError: any) {
      toast({ variant: 'destructive', title: 'Não foi possível gerar', description: saveError?.message })
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    if (!window.confirm('Apagar esta pesquisa e todos os preços dela?')) return
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
  const methodLabel = METHOD_LABEL[research.method]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href={research.processId ? `/admin/pesquisa-precos?processo=${research.processId}` : '/admin/pesquisa-precos'} className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Pesquisas
        </Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            {readOnly ? (
              <h1 className="text-2xl font-bold text-gray-900">{research.title}</h1>
            ) : (
              <Input
                aria-label="Objeto da compra"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title.trim() && title !== research.title && update({ title })}
                className="h-auto border-0 px-0 text-2xl font-bold text-gray-900 shadow-none focus-visible:ring-0"
              />
            )}
            {research.process ? (
              <p className="text-sm text-gray-600">
                Processo <Link href={`/admin/processos-internos/${research.process.id}`} className="text-blue-700 hover:underline">{research.process.number}</Link> — {research.process.subject}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Pesquisa avulsa (sem processo interno ligado).</p>
            )}
          </div>
          <div className="shrink-0 rounded-xl border bg-white p-3 text-right">
            <p className="text-xs text-gray-500">Valor estimado</p>
            <p className="text-2xl font-bold text-gray-900">{brl(research.total)}</p>
          </div>
        </div>
      </div>

      {/* como calcular e onde procurar */}
      <div className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="method">Preço adotado</Label>
          <select id="method" value={research.method} disabled={readOnly} onChange={(e) => update({ method: e.target.value as PriceMethod })} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
            {(Object.keys(METHOD_LABEL) as PriceMethod[]).map((method) => (
              <option key={method} value={method}>{METHOD_LABEL[method]}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500">A mediana é a menos afetada por preços muito altos ou muito baixos.</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="region">PNCP: compras de onde</Label>
          <select
            id="region"
            value={research.nationwide ? 'BR' : research.uf || ''}
            disabled={readOnly}
            onChange={(e) => (e.target.value === 'BR' ? update({ nationwide: true }) : update({ nationwide: false, uf: e.target.value }))}
            className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            {!research.uf && <option value="">Escolha o estado</option>}
            {UFS.map((uf) => (
              <option key={uf} value={uf}>{uf}{uf === research.uf ? ' (do município)' : ''}</option>
            ))}
            <option value="BR">Brasil todo</option>
          </select>
          <p className="text-xs text-gray-500">Vale para a busca no PNCP; o Compras.gov.br traz o país todo.</p>
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4" checked={research.applyIpca} disabled={readOnly} onChange={(e) => update({ applyIpca: e.target.checked })} />
            Corrigir pelo IPCA até hoje
          </Label>
          <p className="text-xs text-gray-500">
            {research.applyIpca && !research.ipcaAvailable ? 'IPCA indisponível agora: os preços estão sem correção.' : 'Atualiza cada preço do mês da compra até o último índice publicado (IN 65, art. 5º, II).'}
          </p>
        </div>
      </div>

      {readOnly && (
        <div className="flex flex-col gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 sm:flex-row sm:items-center sm:justify-between">
          <span>Documento gerado no processo. Para mudar algo, reabra a pesquisa e gere uma nova versão.</span>
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

      <div className="space-y-4">
        {research.items.map((item) => (
          <PriceItemCard key={item.id} item={item} readOnly={readOnly} methodLabel={methodLabel} onChanged={load} onAddQuote={setQuoteFor} />
        ))}
        {research.items.length === 0 && <p className="rounded-xl border bg-white p-4 text-sm text-gray-600">Inclua os itens que serão comprados.</p>}
      </div>

      {!readOnly && (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-white p-4 sm:flex-row">
          <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder="Novo item: ex. Caneta esferográfica azul" />
          <Button onClick={addItem} disabled={busy === 'item' || !newItem.trim()}>
            {busy === 'item' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}Incluir item
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t pt-4">
        {!readOnly && research.processId && (
          <Button onClick={generate} disabled={!!busy || !!searching || research.items.length === 0}>
            {busy === 'document' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-1 h-4 w-4" />}
            Gerar documento no processo
          </Button>
        )}
        <Button variant="outline" asChild>
          <a href={getFullApiUrl(`/prices/researches/${id}/export.csv`)}>
            <Download className="mr-1 h-4 w-4" /> Baixar planilha
          </a>
        </Button>
        {!readOnly && (
          <Button variant="ghost" onClick={remove}>
            <Trash2 className="mr-1 h-4 w-4" /> Apagar pesquisa
          </Button>
        )}
      </div>
      {!research.processId && !readOnly && (
        <p className="text-xs text-gray-500">Para gerar o documento oficial, comece a pesquisa pela etapa &quot;Pesquisa de preços&quot; do processo interno.</p>
      )}

      <ManualQuoteDialog item={quoteFor} onClose={() => setQuoteFor(null)} onSaved={load} />
    </div>
  )
}
