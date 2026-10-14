'use client'

/**
 * Um item da lista de compras: uma linha simples (produto, quantidade, preço,
 * total) que abre o resultado com os preços para usar ou não. Código do
 * catálogo e unidade ficam escondidos em "Mais opções".
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, ChevronDown, ChevronUp, Loader2, Paperclip, RefreshCw, Settings2, Trash2 } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { CatalogPicker } from '@/components/admin/price-research/CatalogPicker'
import { PriceResult } from '@/components/admin/price-research/PriceResult'
import { PriceItem, PriceQuote, brl, unitName, unitPhrase } from '@/lib/price-research'

interface ListItemRowProps {
  item: PriceItem
  readOnly: boolean
  startOpen?: boolean
  onChanged: () => void
  onAttach: (item: PriceItem) => void
}

export function ListItemRow({ item, readOnly, startOpen, onChanged, onAttach }: ListItemRowProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(!!startOpen)
  const [more, setMore] = useState(false)
  const [picker, setPicker] = useState(false)
  const [quantity, setQuantity] = useState(String(item.quantity).replace('.', ','))
  const [justification, setJustification] = useState(item.justification || '')
  const [form, setForm] = useState(() => formOf(item))

  useEffect(() => setQuantity(String(item.quantity).replace('.', ',')), [item.quantity])
  useEffect(() => setJustification(item.justification || ''), [item.justification])
  useEffect(() => setForm(formOf(item)), [item])

  const s = item.summary
  const needsJustification = s.warnings.some((warning) => /justificativa/i.test(warning))
  const status =
    item.searchStatus === 'BUSCANDO'
      ? { label: 'Buscando preços...', className: 'text-blue-700' }
      : s.unitPrice === null
        ? { label: 'Sem preço — abra para conferir', className: 'text-amber-700' }
        : needsJustification
          ? { label: 'Precisa de justificativa', className: 'text-amber-700' }
          : { label: `${s.count} preço(s)`, className: 'text-gray-500' }

  const put = async (data: Record<string, unknown>, done?: string) => {
    try {
      await apiRequest(`/prices/items/${item.id}`, { method: 'PUT', body: JSON.stringify(data) })
      if (done) toast({ title: done })
      onChanged()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível salvar', description: error?.message })
    }
  }

  const decide = async (quote: PriceQuote, use: boolean, reason?: string) => {
    try {
      await apiRequest(`/prices/quotes/${quote.id}`, { method: 'PUT', body: JSON.stringify({ included: use, reason }) })
      onChanged()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível alterar', description: error?.message })
    }
  }

  const searchAgain = async () => {
    try {
      await apiRequest(`/prices/items/${item.id}/search`, { method: 'POST' })
      onChanged()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível buscar', description: error?.message })
    }
  }

  const remove = async () => {
    if (!window.confirm(`Tirar "${item.description}" da lista?`)) return
    try {
      await apiRequest(`/prices/items/${item.id}`, { method: 'DELETE' })
      onChanged()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível tirar', description: error?.message })
    }
  }

  const saveQuantity = () => {
    const value = Number(quantity.replace(',', '.'))
    if (value > 0 && value !== item.quantity) put({ quantity: value })
  }

  return (
    <li className="rounded-xl border bg-white">
      {/* a linha */}
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <button type="button" onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
          {open ? <ChevronUp className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" /> : <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />}
          <span className="min-w-0">
            <span className="block font-medium text-gray-900">{item.description}</span>
            <span className={cn('flex items-center gap-1 text-xs', status.className)}>
              {item.searchStatus === 'BUSCANDO' && <Loader2 className="h-3 w-3 animate-spin" />}
              {status.label !== `${s.count} preço(s)` && status.className.includes('amber') && <AlertTriangle className="h-3 w-3" />}
              {status.label}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-3 pl-7 sm:pl-0">
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            <Input
              aria-label="Quantidade"
              inputMode="decimal"
              value={quantity}
              disabled={readOnly}
              onChange={(e) => setQuantity(e.target.value)}
              onBlur={saveQuantity}
              onKeyDown={(e) => e.key === 'Enter' && saveQuantity()}
              className="h-9 w-20 text-right"
            />
            {unitName(item.unit, item.quantity !== 1)}
          </label>
          <div className="w-36 text-right">
            <p className="text-xs text-gray-500">{s.unitPrice !== null ? `${brl(s.unitPrice)} cada` : '—'}</p>
            <p className="font-semibold text-gray-900">{brl(s.total)}</p>
          </div>
        </div>
      </div>

      {/* aberto */}
      {open && (
        <div className="space-y-3 border-t bg-gray-50 p-3">
          <PriceResult item={item} mode="list" readOnly={readOnly} onDecide={decide} onRetry={searchAgain} />

          {needsJustification && (
            <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <Label htmlFor={`just-${item.id}`} className="text-amber-900">Justificativa (vai para o documento)</Label>
              <Textarea
                id={`just-${item.id}`}
                rows={2}
                maxLength={4000}
                value={justification}
                disabled={readOnly}
                placeholder="Ex.: produto pouco comprado por órgãos públicos; só encontramos 2 compras no último ano."
                onChange={(e) => setJustification(e.target.value)}
                onBlur={() => justification !== (item.justification || '') && put({ justification })}
                className="bg-white"
              />
            </div>
          )}
          {!needsJustification && item.justification && <p className="text-xs text-gray-600">Justificativa: {item.justification}</p>}

          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onAttach(item)}>
                <Paperclip className="mr-1 h-4 w-4" /> Anexar orçamento ou nota
              </Button>
              <Button size="sm" variant="outline" onClick={searchAgain} disabled={item.searchStatus === 'BUSCANDO'}>
                <RefreshCw className="mr-1 h-4 w-4" /> Buscar de novo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMore(!more)}>
                <Settings2 className="mr-1 h-4 w-4" /> Mais opções
              </Button>
              <Button size="sm" variant="ghost" className="text-red-700" onClick={remove}>
                <Trash2 className="mr-1 h-4 w-4" /> Tirar da lista
              </Button>
            </div>
          )}

          {more && !readOnly && (
            <div className="grid gap-3 rounded-xl border bg-white p-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`desc-${item.id}`}>Nome do produto (mudar busca de novo)</Label>
                <div className="flex gap-2">
                  <Input id={`desc-${item.id}`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  {form.description.trim() && form.description !== item.description && <Button onClick={() => put({ description: form.description.trim() })}>Salvar</Button>}
                </div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Produto exato no catálogo do governo (deixa a busca mais precisa)</Label>
                <div className="flex flex-col gap-2 rounded-md border bg-gray-50 p-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 text-gray-700">{item.catalogCode ? `${item.catalogName} (código ${item.catalogCode})` : 'Escolhido automaticamente pela descrição'}</span>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPicker(true)}>
                      <BookOpen className="mr-1 h-4 w-4" /> Escolher
                    </Button>
                    {item.catalogCode && <Button size="sm" variant="ghost" onClick={() => put({ catalogCode: null })}>Automático</Button>}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`unit-${item.id}`}>Como vai comprar</Label>
                <Input id={`unit-${item.id}`} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pacote, caixa, unidade..." />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`cap-${item.id}`}>{item.baseUnit ? `Quantas ${unitName(item.baseUnit, true)} em cada` : 'Quanto vem em cada'}</Label>
                <Input id={`cap-${item.id}`} inputMode="decimal" value={form.unitCapacity} onChange={(e) => setForm({ ...form, unitCapacity: e.target.value })} />
              </div>
              <p className="text-xs text-gray-500 sm:col-span-2">Hoje o preço é calculado por {unitPhrase(item)}.</p>
              <div className="flex items-center justify-between gap-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.kind === 'SERVICO'} onChange={(e) => setForm({ ...form, kind: e.target.checked ? 'SERVICO' : 'MATERIAL' })} /> É um serviço
                </label>
                <Button
                  size="sm"
                  onClick={() =>
                    put(
                      { unit: form.unit, unitCapacity: Number(form.unitCapacity.replace(',', '.')) || 1, kind: form.kind },
                      'Salvo'
                    )
                  }
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <CatalogPicker
        open={picker}
        initialText={item.description}
        kind={item.kind}
        onClose={() => setPicker(false)}
        onPick={(hit) => {
          setPicker(false)
          put({ kind: hit.kind, catalogCode: hit.code, catalogName: hit.name })
        }}
      />
    </li>
  )
}

function formOf(item: PriceItem) {
  return { description: item.description, unit: unitName(item.unit), unitCapacity: String(item.unitCapacity).replace('.', ','), kind: item.kind }
}
