'use client'

/**
 * Pesquisa de preços (IN 65/2021), pensada para quem não é da área:
 *  1. "O que você quer comprar?" → a busca começa sozinha;
 *  2. o resultado mostra o preço de referência e os preços encontrados;
 *  3. "Adicionar à lista de compras" leva tudo (ou os preços marcados) para
 *     uma lista com nome, criada pelo próprio servidor.
 * As listas viram o documento da etapa "Pesquisa de preços" do processo interno.
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClipboardList, History, Loader2, Plus, Search, ShoppingCart } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { PriceResult } from '@/components/admin/price-research/PriceResult'
import { AddToListDialog } from '@/components/admin/price-research/AddToListDialog'
import { PriceItem, PriceQuote, RecentSearch, ShoppingList, brl } from '@/lib/price-research'

function PesquisaPrecos() {
  const router = useRouter()
  const params = useSearchParams()
  const processId = params.get('processo')
  const { user, apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [text, setText] = useState('')
  const [isService, setIsService] = useState(false)
  const [current, setCurrent] = useState<PriceItem | null>(null)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [recent, setRecent] = useState<RecentSearch[]>([])
  const [lists, setLists] = useState<ShoppingList[] | null>(null)
  const [newList, setNewList] = useState(false)
  const [listName, setListName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLists = useCallback(() => {
    apiRequest(`/prices/researches${processId ? `?processId=${processId}` : ''}`)
      .then((response: any) => setLists(response?.data?.items || []))
      .catch(() => setLists([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processId])

  useEffect(() => {
    if (!user) return
    loadLists()
    apiRequest('/prices/search/recent').then((response: any) => setRecent(response?.data?.items || [])).catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loadLists])

  const openSearch = useCallback(
    async (id: string) => {
      const response = await apiRequest(`/prices/items/${id}`)
      setCurrent(response?.data?.item || null)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // enquanto busca, pergunta o andamento
  useEffect(() => {
    if (!current || current.searchStatus !== 'BUSCANDO') return
    const id = current.id
    const timer = setInterval(() => openSearch(id).catch(() => undefined), 4000)
    return () => clearInterval(timer)
  }, [current, openSearch])

  const search = async (value = text) => {
    if (value.trim().length < 3) return setError('Escreva o que você quer comprar (ex.: papel sulfite A4).')
    setError(null)
    setSelected(new Set())
    try {
      setSearching(true)
      const response = await apiRequest('/prices/search', { method: 'POST', body: JSON.stringify({ text: value.trim(), kind: isService ? 'SERVICO' : 'MATERIAL' }) })
      await openSearch(response?.data?.item?.id)
      apiRequest('/prices/search/recent').then((r: any) => setRecent(r?.data?.items || [])).catch(() => undefined)
    } catch (searchError: any) {
      setError(searchError?.message || 'Não foi possível buscar')
    } finally {
      setSearching(false)
    }
  }

  const toggle = (quote: PriceQuote) => {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(quote.id)) next.delete(quote.id)
      else next.add(quote.id)
      return next
    })
  }

  const createList = async () => {
    if (!listName.trim() && !processId) return
    try {
      setBusy(true)
      const response = await apiRequest('/prices/researches', { method: 'POST', body: JSON.stringify({ title: listName.trim(), processId: processId || undefined }) })
      router.push(`/admin/pesquisa-precos/${response?.data?.research?.id}`)
    } catch (saveError: any) {
      toast({ variant: 'destructive', title: 'Não foi possível criar', description: saveError?.message })
    } finally {
      setBusy(false)
    }
  }

  const usable = current ? current.quotes.filter((quote) => quote.included).length : 0

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* 1. a pergunta */}
      <section className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesquisa de preços</h1>
          <p className="text-sm text-gray-600">Veja quanto outras prefeituras e órgãos públicos pagaram e monte sua lista de compras.</p>
        </div>
        {processId && (
          <p className="rounded-md bg-blue-50 p-2 text-sm text-blue-800">
            Você veio de um processo interno. A lista deste processo fica logo abaixo. <Link href={`/admin/processos-internos/${processId}`} className="underline">Voltar ao processo</Link>
          </p>
        )}
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            search()
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="O que você quer comprar? Ex.: papel sulfite A4" className="h-12 pl-10 text-base" />
          </div>
          <Button type="submit" className="h-12 px-6 text-base" disabled={searching}>
            {searching ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}Buscar preços
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-gray-600">
            <input type="checkbox" checked={isService} onChange={(e) => setIsService(e.target.checked)} /> É um serviço (ex.: limpeza, manutenção)
          </label>
          {recent.length > 0 && (
            <span className="flex flex-wrap items-center gap-1.5 text-gray-500">
              <History className="h-4 w-4" />
              {recent.slice(0, 5).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    setText(row.description)
                    setSelected(new Set())
                    openSearch(row.id).catch(() => undefined)
                  }}
                  className="rounded-full border bg-white px-2.5 py-0.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  {row.description}
                </button>
              ))}
            </span>
          )}
        </div>
        {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      </section>

      {/* 2. o resultado */}
      {current && (
        <section className="space-y-3">
          <PriceResult item={current} mode="search" selected={selected} onToggle={toggle} onRetry={() => search(current.description)} />
          {current.searchStatus !== 'BUSCANDO' && current.quotes.length > 0 && (
            <div className="sticky bottom-20 z-10 flex flex-col gap-2 rounded-xl border bg-white p-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-700">
                {selected.size
                  ? `${selected.size} preço(s) marcado(s)`
                  : usable
                    ? `Leva os ${usable} preços encontrados — ou marque só os que quiser`
                    : 'Marque os preços que servem'}
              </p>
              <Button onClick={() => setAdding(true)} disabled={!selected.size && !usable}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Adicionar à lista de compras
              </Button>
            </div>
          )}
        </section>
      )}

      {/* 3. as listas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">{processId ? 'Listas deste processo' : 'Minhas listas de compras'}</h2>
          <Button variant="outline" onClick={() => { setListName(''); setNewList(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Nova lista
          </Button>
        </div>
        {lists === null ? (
          <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</p>
        ) : lists.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-600">
            <ClipboardList className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            Nenhuma lista ainda. Busque um produto acima e clique em &quot;Adicionar à lista de compras&quot;.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {lists.map((list) => (
              <li key={list.id}>
                <Link href={`/admin/pesquisa-precos/${list.id}`} className="block rounded-xl border bg-white p-4 hover:border-blue-300 hover:shadow-sm">
                  <p className="truncate font-medium text-gray-900">{list.title}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{brl(list.total)}</p>
                  <p className="text-xs text-gray-500">
                    {list.itemCount} {list.itemCount === 1 ? 'item' : 'itens'} · atualizada em {new Date(list.updatedAt).toLocaleDateString('pt-BR')}
                    {list.status === 'CONCLUIDA' ? ' · documento gerado' : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddToListDialog
        item={adding ? current : null}
        quoteIds={Array.from(selected)}
        defaultListId={processId ? lists?.[0]?.id : null}
        onClose={() => setAdding(false)}
        onAdded={({ researchId, listName: name, added }) => {
          setAdding(false)
          setSelected(new Set())
          loadLists()
          toast({ title: `Adicionado à lista "${name}"`, description: added ? `${added} preço(s) levados para a lista.` : 'Esses preços já estavam na lista.' })
          if (researchId && processId) router.push(`/admin/pesquisa-precos/${researchId}`)
        }}
      />

      <Dialog open={newList} onOpenChange={setNewList}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova lista de compras</DialogTitle>
            <DialogDescription>{processId ? 'Ligada ao processo interno: no fim, vira o documento da etapa.' : 'Dê um nome; depois é só ir adicionando os produtos.'}</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createList()}
            placeholder={processId ? 'Vazio = assunto do processo' : 'Ex.: Material de limpeza das escolas'}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewList(false)} disabled={busy}>Cancelar</Button>
            <Button onClick={createList} disabled={busy || (!listName.trim() && !processId)}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar lista
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
