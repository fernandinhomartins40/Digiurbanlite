'use client'

/**
 * Leva o resultado de uma busca para uma lista de compras: escolhe a lista
 * (ou cria uma na hora, só com o nome), a quantidade e se entra como item novo
 * ou junta os preços a um item que já está na lista.
 */

import { useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { PriceItem, ShoppingList } from '@/lib/price-research'

interface AddToListDialogProps {
  item: PriceItem | null
  quoteIds: string[]
  defaultListId?: string | null
  onClose: () => void
  onAdded: (result: { researchId: string; listName: string; added: number }) => void
}

export function AddToListDialog({ item, quoteIds, defaultListId, onClose, onAdded }: AddToListDialogProps) {
  const { apiRequest } = useAdminAuth()
  const [lists, setLists] = useState<ShoppingList[] | null>(null)
  const [listId, setListId] = useState<string>('')
  const [newName, setNewName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [items, setItems] = useState<Array<{ id: string; description: string }>>([])
  const [targetItemId, setTargetItemId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return
    setError(null)
    setQuantity('1')
    setTargetItemId('')
    setNewName('')
    apiRequest('/prices/researches')
      .then((response: any) => {
        const open = ((response?.data?.items || []) as ShoppingList[]).filter((list) => list.status !== 'CONCLUIDA')
        setLists(open)
        setListId(defaultListId && open.some((list) => list.id === defaultListId) ? defaultListId : open[0]?.id || 'new')
      })
      .catch(() => {
        setLists([])
        setListId('new')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item])

  useEffect(() => {
    setTargetItemId('')
    if (!listId || listId === 'new') return setItems([])
    apiRequest(`/prices/researches/${listId}`)
      .then((response: any) => setItems((response?.data?.research?.items || []).map((row: any) => ({ id: row.id, description: row.description }))))
      .catch(() => setItems([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId])

  const save = async () => {
    if (!item) return
    setError(null)
    if (listId === 'new' && !newName.trim()) return setError('Dê um nome para a nova lista.')
    try {
      setBusy(true)
      const response = await apiRequest(`/prices/items/${item.id}/add-to-list`, {
        method: 'POST',
        body: JSON.stringify({
          researchId: listId === 'new' ? undefined : listId,
          newListName: listId === 'new' ? newName.trim() : undefined,
          targetItemId: targetItemId || undefined,
          quoteIds,
          quantity: Number(quantity.replace(',', '.')) || 1,
        }),
      })
      const listName = listId === 'new' ? newName.trim() : lists?.find((list) => list.id === listId)?.title || 'lista'
      onAdded({ researchId: response?.data?.researchId, listName, added: response?.data?.added || 0 })
    } catch (saveError: any) {
      setError(saveError?.message || 'Não foi possível adicionar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar à lista de compras</DialogTitle>
          <DialogDescription>
            {item?.description} — {quoteIds.length ? `${quoteIds.length} preço(s) escolhido(s)` : 'todos os preços encontrados'}
          </DialogDescription>
        </DialogHeader>

        {lists === null ? (
          <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando suas listas...</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Em qual lista?</Label>
              <div className="max-h-56 space-y-1.5 overflow-y-auto">
                {lists.map((list) => (
                  <label key={list.id} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm', listId === list.id && 'border-blue-600 bg-blue-50')}>
                    <input type="radio" name="list" checked={listId === list.id} onChange={() => setListId(list.id)} />
                    <span className="min-w-0 flex-1 truncate">{list.title}</span>
                    <span className="shrink-0 text-xs text-gray-500">{list.itemCount} item(ns)</span>
                  </label>
                ))}
                <label className={cn('flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm', listId === 'new' && 'border-blue-600 bg-blue-50')}>
                  <input type="radio" name="list" checked={listId === 'new'} onChange={() => setListId('new')} />
                  <Plus className="h-4 w-4 text-gray-500" /> Nova lista
                </label>
              </div>
              {listId === 'new' && (
                <Input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da lista. Ex.: Material de escritório 2027" />
              )}
            </div>

            {listId !== 'new' && items.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="target-item">Como entra na lista?</Label>
                <select id="target-item" value={targetItemId} onChange={(e) => setTargetItemId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">Como item novo</option>
                  {items.map((row) => (
                    <option key={row.id} value={row.id}>Juntar os preços ao item: {row.description}</option>
                  ))}
                </select>
              </div>
            )}

            {!targetItemId && (
              <div className="space-y-1.5">
                <Label htmlFor="add-qty">Quantidade a comprar</Label>
                <Input id="add-qty" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="max-w-[10rem]" />
              </div>
            )}
            {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={save} disabled={busy || lists === null}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
