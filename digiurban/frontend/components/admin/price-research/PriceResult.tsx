'use client'

/**
 * Resultado de uma busca de preço, do jeito que o servidor leigo entende:
 * o preço de referência em destaque e os preços em três grupos — usados,
 * parecidos (confira) e descartados (com o motivo). Na busca, os preços são
 * marcados para levar à lista de compras; dentro da lista, cada preço tem
 * "Usar" / "Não usar".
 */

import { useState } from 'react'
import { AlertTriangle, Check, ChevronDown, ChevronUp, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { PriceItem, PriceQuote, SOURCE_LABEL, brl, dateBr, discardReason, priceForItem, quoteGroup, unitName, unitPhrase } from '@/lib/price-research'

const REASONS = ['Não é o mesmo produto', 'Preço baixo demais', 'Preço alto demais', 'Embalagem ou quantidade diferente']
const PAGE = 8

interface PriceResultProps {
  item: PriceItem
  mode: 'search' | 'list'
  readOnly?: boolean
  /** busca: preços marcados para levar à lista */
  selected?: Set<string>
  onToggle?: (quote: PriceQuote) => void
  /** lista: usar / não usar (com motivo) */
  onDecide?: (quote: PriceQuote, use: boolean, reason?: string) => Promise<void>
  onRetry?: () => void
}

export function PriceResult({ item, mode, readOnly, selected, onToggle, onDecide, onRetry }: PriceResultProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({ used: true })
  const [shown, setShown] = useState<Record<string, number>>({})
  const [removing, setRemoving] = useState<PriceQuote | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  if (item.searchStatus === 'BUSCANDO') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border bg-white p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="font-medium text-gray-900">Procurando preços de &quot;{item.description}&quot;</p>
        <p className="max-w-md text-sm text-gray-600">Estamos consultando compras de prefeituras, estados e órgãos federais dos últimos 12 meses. Leva cerca de 1 minuto — pode continuar usando o sistema.</p>
      </div>
    )
  }

  if (item.searchStatus === 'ERRO' && item.quotes.length === 0) {
    return (
      <div className="space-y-3 rounded-xl border bg-white p-6 text-center">
        <p className="text-sm text-gray-700">{item.searchMessage || 'Não foi possível buscar agora.'}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-1 h-4 w-4" /> Tentar de novo
          </Button>
        )}
      </div>
    )
  }

  const s = item.summary
  const groups = { used: [] as PriceQuote[], check: [] as PriceQuote[], discarded: [] as PriceQuote[] }
  for (const quote of item.quotes) groups[quoteGroup(quote)].push(quote)
  const cap = item.baseUnit ? item.unitCapacity || 1 : 1
  const phrase = unitPhrase(item)

  const decide = async (quote: PriceQuote, use: boolean, why?: string) => {
    if (!onDecide) return
    setBusy(quote.id)
    try {
      await onDecide(quote, use, why)
      setRemoving(null)
    } finally {
      setBusy(null)
    }
  }

  const row = (quote: PriceQuote, group: 'used' | 'check' | 'discarded') => {
    const price = priceForItem(quote, item)
    const paidDifferent = Math.abs(price - quote.unitPrice) > 0.005
    const who = [quote.buyer || quote.supplier, [quote.buyerCity, quote.buyerUf].filter(Boolean).join('/')].filter(Boolean).join(' · ')
    const isSelected = selected?.has(quote.id) ?? false
    return (
      <li key={quote.id} className={cn('flex items-start gap-3 px-3 py-2.5', isSelected && 'bg-blue-50')}>
        {mode === 'search' && (
          <input type="checkbox" className="mt-1.5 h-4 w-4 shrink-0" checked={isSelected} onChange={() => onToggle?.(quote)} aria-label="Marcar para levar à lista" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-900">
            <span className="font-semibold">{brl(price)}</span>
            <span className="text-gray-500"> · {who || SOURCE_LABEL[quote.source]}</span>
          </p>
          <p className="truncate text-xs text-gray-500" title={quote.description}>
            {dateBr(quote.date)} · {SOURCE_LABEL[quote.source]}
            {paidDifferent && <> · pagou {brl(quote.unitPrice, true)} por {quote.capacity ? `${unitName(quote.unitLabel)} com ${quote.capacity} ${unitName(quote.measureUnit, true)}` : unitName(quote.unitLabel)}</>}
          </p>
          <p className="truncate text-xs text-gray-400" title={quote.description}>{quote.description}</p>
          {group === 'discarded' && <p className="text-xs text-amber-700">{discardReason(quote)}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {quote.sourceUrl && (
            <a href={quote.sourceUrl} target="_blank" rel="noreferrer" className="p-1 text-gray-400 hover:text-blue-700" aria-label="Ver a compra" title="Ver a compra">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {mode === 'list' && !readOnly && (
            group === 'used' ? (
              <Button size="sm" variant="ghost" className="text-gray-600" disabled={busy === quote.id} onClick={() => { setRemoving(quote); setReason('') }}>
                <X className="mr-1 h-4 w-4" /> Não usar
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled={busy === quote.id} onClick={() => decide(quote, true)}>
                {busy === quote.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Usar
              </Button>
            )
          )}
        </div>
      </li>
    )
  }

  const section = (key: 'used' | 'check' | 'discarded', title: string, hint?: string) => {
    const list = groups[key]
    if (!list.length) return null
    const isOpen = !!open[key]
    const limit = shown[key] || PAGE
    return (
      <div className="rounded-xl border bg-white">
        <button type="button" onClick={() => setOpen({ ...open, [key]: !isOpen })} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left">
          <span>
            <span className="text-sm font-medium text-gray-900">{title} ({list.length})</span>
            {hint && <span className="block text-xs text-gray-500">{hint}</span>}
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
        </button>
        {isOpen && (
          <>
            {mode === 'search' && onToggle && (
              <div className="flex gap-3 border-t px-3 py-1.5 text-xs">
                <button type="button" className="text-blue-700 hover:underline" onClick={() => list.filter((q) => !selected?.has(q.id)).forEach((q) => onToggle(q))}>Marcar todos</button>
                <button type="button" className="text-gray-500 hover:underline" onClick={() => list.filter((q) => selected?.has(q.id)).forEach((q) => onToggle(q))}>Desmarcar</button>
              </div>
            )}
            <ul className="divide-y border-t">{list.slice(0, limit).map((quote) => row(quote, key))}</ul>
            {list.length > limit && (
              <button type="button" className="w-full border-t px-3 py-2 text-sm text-blue-700 hover:bg-gray-50" onClick={() => setShown({ ...shown, [key]: limit + 20 })}>
                Ver mais {Math.min(20, list.length - limit)} de {list.length - limit}
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* o resultado */}
      <div className="rounded-xl border bg-white p-4">
        {s.unitPrice !== null && s.stats ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-gray-600">Preço de referência</p>
              <p className="text-3xl font-bold text-gray-900">{brl(s.unitPrice)}</p>
              <p className="text-sm text-gray-600">por {phrase}</p>
            </div>
            <div className="text-sm text-gray-600 sm:text-right">
              <p>Com base em <strong>{s.count}</strong> {s.count === 1 ? 'compra pública' : 'compras públicas'} dos últimos 12 meses</p>
              <p className="text-xs text-gray-500">
                Mais barato {brl(s.stats.min * cap)} · mais caro {brl(s.stats.max * cap)}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-medium text-gray-900">Ainda sem preço de referência</p>
            <p className="text-sm text-gray-600">
              {item.quotes.length
                ? mode === 'search'
                  ? 'Encontramos preços parecidos: abra "Parecidos" e marque os que são o mesmo produto.'
                  : 'Confira os preços parecidos abaixo e clique em "Usar" nos que forem o mesmo produto.'
                : 'Não encontramos compras deste produto. Tente outras palavras (o nome do produto, sem marca) ou anexe orçamentos.'}
            </p>
          </div>
        )}
        {s.warnings.length > 0 && s.unitPrice !== null && (
          <ul className="mt-3 space-y-1 border-t pt-3">
            {s.warnings.map((warning) => (
              <li key={warning} className="flex items-start gap-2 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {warning}
              </li>
            ))}
          </ul>
        )}
      </div>

      {section('used', mode === 'search' ? 'Preços encontrados' : 'Preços usados no cálculo')}
      {section('check', 'Parecidos — confira se é o mesmo produto', mode === 'search' ? 'Marque os que servem para levar à lista' : 'Clique em "Usar" nos que forem o mesmo produto')}
      {section('discarded', 'Não usados', 'Preços fora do padrão, antigos ou de outra embalagem')}

      <Dialog open={!!removing} onOpenChange={(value) => !value && setRemoving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Por que não usar este preço?</DialogTitle>
            <DialogDescription>O motivo fica registrado no documento da pesquisa.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((option) => (
              <button key={option} type="button" onClick={() => setReason(option)} className={cn('rounded-full border px-3 py-1.5 text-sm', reason === option ? 'border-blue-600 bg-blue-50 text-blue-800' : 'text-gray-700')}>
                {option}
              </button>
            ))}
          </div>
          <Textarea rows={2} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ou escreva o motivo" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>Cancelar</Button>
            <Button onClick={() => removing && decide(removing, false, reason)} disabled={!reason.trim() || !!busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Não usar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
