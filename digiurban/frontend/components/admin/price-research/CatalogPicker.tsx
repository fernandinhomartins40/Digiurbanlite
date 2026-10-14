'use client'

/**
 * Escolher o código do catálogo (CATMAT/CATSER) pelo texto: busca as famílias
 * e serviços; ao abrir uma família, mostra os itens dela. O código é o que
 * permite buscar no Compras.gov.br, nas atas e no Banco de Preços em Saúde.
 */

import { useEffect, useState } from 'react'
import { ChevronLeft, Loader2, Search } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CatalogHit } from '@/lib/price-research'

interface CatalogPickerProps {
  open: boolean
  initialText: string
  kind: 'MATERIAL' | 'SERVICO'
  onClose: () => void
  onPick: (hit: { kind: 'MATERIAL' | 'SERVICO'; code: number; name: string }) => void
}

export function CatalogPicker({ open, initialText, kind, onClose, onPick }: CatalogPickerProps) {
  const { apiRequest } = useAdminAuth()
  const [text, setText] = useState(initialText)
  const [hits, setHits] = useState<CatalogHit[]>([])
  const [family, setFamily] = useState<CatalogHit | null>(null)
  const [familyItems, setFamilyItems] = useState<CatalogHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setText(initialText)
      setFamily(null)
      setError(null)
    }
  }, [open, initialText])

  useEffect(() => {
    if (!open || family) return
    const query = text.trim()
    if (query.length < 3) {
      setHits([])
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      setError(null)
      apiRequest(`/prices/catalog?q=${encodeURIComponent(query)}&kind=${kind}`)
        .then((response: any) => !cancelled && setHits(response?.data?.items || []))
        .catch((loadError: any) => !cancelled && setError(loadError?.message || 'Não foi possível buscar'))
        .finally(() => !cancelled && setLoading(false))
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, text, kind, family])

  const openFamily = async (hit: CatalogHit) => {
    setFamily(hit)
    setFamilyItems([])
    setLoading(true)
    setError(null)
    try {
      const response = await apiRequest(`/prices/catalog/families/${hit.code}/items?q=${encodeURIComponent(text)}`)
      setFamilyItems(response?.data?.items || [])
    } catch (loadError: any) {
      setError(loadError?.message || 'Não foi possível abrir a família')
    } finally {
      setLoading(false)
    }
  }

  const choose = (hit: CatalogHit) => {
    if (hit.kind === 'PDM') return openFamily(hit)
    onPick({ kind: hit.kind === 'SERVICO' ? 'SERVICO' : 'MATERIAL', code: hit.code, name: hit.name })
  }

  const list = family ? familyItems : hits

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Escolher no catálogo do governo</DialogTitle>
          <DialogDescription>
            {kind === 'SERVICO'
              ? 'Procure o serviço pelo nome. O código (CATSER) permite buscar preços no Compras.gov.br.'
              : 'Procure pelo nome e abra a família certa; depois escolha o item exato. O código (CATMAT) permite buscar no Compras.gov.br, nas atas e no Banco de Preços em Saúde.'}
          </DialogDescription>
        </DialogHeader>

        {family ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setFamily(null)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            <p className="text-sm font-medium text-gray-900">{family.name}</p>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: papel sulfite, caneta, limpeza predial" className="pl-9" />
          </div>
        )}

        {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        {loading && (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> {family ? 'Buscando os itens da família (pode levar alguns segundos)...' : 'Procurando...'}
          </p>
        )}
        {!loading && !error && list.length === 0 && (family || text.trim().length >= 3) && (
          <p className="text-sm text-gray-500">Nada encontrado. Tente outras palavras (o nome do produto, sem marca).</p>
        )}

        <ul className="divide-y rounded-md border">
          {list.map((hit) => (
            <li key={`${hit.kind}-${hit.code}`}>
              <button type="button" onClick={() => choose(hit)} className="flex w-full items-start justify-between gap-3 p-3 text-left hover:bg-gray-50">
                <span className="min-w-0">
                  <span className="block text-sm text-gray-900">{hit.name}</span>
                  <span className="block text-xs text-gray-500">
                    {hit.kind === 'PDM' ? 'Família de materiais — abrir para escolher o item' : hit.kind === 'SERVICO' ? `Serviço · CATSER ${hit.code}` : `Material · CATMAT ${hit.code}`}
                    {hit.className ? ` · ${hit.className}` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium text-blue-700">{hit.kind === 'PDM' ? 'Abrir' : 'Escolher'}</span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
