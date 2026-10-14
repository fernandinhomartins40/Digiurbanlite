'use client'

/**
 * Um item da pesquisa: o que vai ser comprado, o código do catálogo, a busca
 * nas fontes, o cálculo (IN 65/2021) e a lista de preços. O sistema propõe
 * (marcas automáticas); o servidor decide incluir ou tirar, com motivo.
 */

import { useEffect, useMemo, useState } from 'react'
import { getFullApiUrl } from '@/lib/api-config'
import { AlertTriangle, BookOpen, ExternalLink, FileText, Loader2, Paperclip, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { CatalogPicker } from '@/components/admin/price-research/CatalogPicker'
import { FLAG_LABEL, PriceItem, PriceQuote, SOURCE_LABEL, SPHERE_LABEL, brl, dateBr } from '@/lib/price-research'

const REASONS = ['Não é o mesmo item', 'Preço inexequível (muito baixo)', 'Preço excessivo (muito alto)', 'Unidade ou embalagem diferente', 'Quantidade muito diferente da nossa']
const PAGE = 40

type Filter = 'in' | 'out' | 'all'

interface PriceItemCardProps {
  item: PriceItem
  readOnly: boolean
  methodLabel: string
  onChanged: () => void
  onAddQuote: (item: PriceItem) => void
}

export function PriceItemCard({ item, readOnly, methodLabel, onChanged, onAddQuote }: PriceItemCardProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [form, setForm] = useState(() => formOf(item))
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState(false)
  const [filter, setFilter] = useState<Filter>('in')
  const [shown, setShown] = useState(PAGE)
  const [excluding, setExcluding] = useState<PriceQuote | null>(null)
  const [reason, setReason] = useState('')
  const [justification, setJustification] = useState(item.justification || '')
  const [busyQuote, setBusyQuote] = useState<string | null>(null)

  useEffect(() => setForm(formOf(item)), [item])
  useEffect(() => setJustification(item.justification || ''), [item.justification])

  const dirty = JSON.stringify(form) !== JSON.stringify(formOf(item))
  const searching = item.searchStatus === 'BUSCANDO'
  const s = item.summary

  const counts = useMemo(() => ({ in: item.quotes.filter((q) => q.included).length, out: item.quotes.filter((q) => !q.included).length, all: item.quotes.length }), [item.quotes])
  const list = item.quotes.filter((quote) => (filter === 'in' ? quote.included : filter === 'out' ? !quote.included : true))

  const call = async (path: string, init: RequestInit, done?: string) => {
    await apiRequest(path, init)
    if (done) toast({ title: done })
    onChanged()
  }

  const save = async (extra: Record<string, unknown> = {}) => {
    try {
      setSaving(true)
      await call(`/prices/items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: form.description,
          kind: form.kind,
          unit: form.unit,
          quantity: Number(form.quantity.replace(',', '.')) || 1,
          baseUnit: form.baseUnit,
          unitCapacity: Number(form.unitCapacity.replace(',', '.')) || 1,
          ...extra,
        }),
      })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível salvar', description: error?.message })
    } finally {
      setSaving(false)
    }
  }

  const search = async () => {
    try {
      if (dirty) await save()
      await call(`/prices/items/${item.id}/search`, { method: 'POST' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível buscar', description: error?.message })
    }
  }

  const remove = async () => {
    if (!window.confirm('Tirar este item da pesquisa?')) return
    try {
      await call(`/prices/items/${item.id}`, { method: 'DELETE' }, 'Item removido')
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível remover', description: error?.message })
    }
  }

  const decide = async (quote: PriceQuote, included: boolean, why?: string) => {
    try {
      setBusyQuote(quote.id)
      await call(`/prices/quotes/${quote.id}`, { method: 'PUT', body: JSON.stringify({ included, reason: why }) })
      setExcluding(null)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível alterar', description: error?.message })
    } finally {
      setBusyQuote(null)
    }
  }

  const deleteQuote = async (quote: PriceQuote) => {
    if (!window.confirm('Apagar este preço anexado?')) return
    try {
      await call(`/prices/quotes/${quote.id}`, { method: 'DELETE' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível apagar', description: error?.message })
    }
  }

  const saveJustification = async () => {
    if ((item.justification || '') === justification) return
    await save({ justification })
  }

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      {/* o que vai ser comprado */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">Item {item.position}</p>
        {!readOnly && (
          <Button size="sm" variant="ghost" onClick={remove} aria-label="Remover item">
            <Trash2 className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-6">
        <div className="space-y-1 md:col-span-4">
          <Label htmlFor={`desc-${item.id}`}>Descrição</Label>
          <Input id={`desc-${item.id}`} value={form.description} disabled={readOnly} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor={`kind-${item.id}`}>Tipo</Label>
          <select
            id={`kind-${item.id}`}
            value={form.kind}
            disabled={readOnly}
            onChange={(e) => setForm({ ...form, kind: e.target.value as 'MATERIAL' | 'SERVICO' })}
            className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="MATERIAL">Material</option>
            <option value="SERVICO">Serviço</option>
          </select>
        </div>
        <div className="space-y-1 md:col-span-6">
          <Label>Código do catálogo do governo</Label>
          <div className="flex flex-col gap-2 rounded-md border bg-gray-50 p-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-gray-700">
              {item.catalogCode ? (
                <>
                  <strong>{item.kind === 'SERVICO' ? 'CATSER' : 'CATMAT'} {item.catalogCode}</strong> — {item.catalogName}
                </>
              ) : (
                <span className="text-amber-700">Sem código: só o PNCP é consultado. Escolha o código para buscar no Compras.gov.br{item.kind === 'MATERIAL' ? ', nas atas e no BPS' : ''}.</span>
              )}
            </p>
            {!readOnly && (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => setPicker(true)}>
                  <BookOpen className="mr-1 h-4 w-4" /> {item.catalogCode ? 'Trocar' : 'Escolher'}
                </Button>
                {item.catalogCode && (
                  <Button size="sm" variant="ghost" onClick={() => save({ catalogCode: null })}>Tirar</Button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor={`unit-${item.id}`}>Unidade de compra</Label>
          <Input id={`unit-${item.id}`} value={form.unit} disabled={readOnly} placeholder="UN, PCT, CX..." onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </div>
        <div className="space-y-1 md:col-span-1">
          <Label htmlFor={`qty-${item.id}`}>Quantidade</Label>
          <Input id={`qty-${item.id}`} inputMode="decimal" value={form.quantity} disabled={readOnly} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        </div>
        <div className="space-y-1 md:col-span-1">
          <Label htmlFor={`base-${item.id}`}>Comparar por</Label>
          <Input id={`base-${item.id}`} value={form.baseUnit} disabled={readOnly} placeholder="FL, KG..." onChange={(e) => setForm({ ...form, baseUnit: e.target.value })} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor={`cap-${item.id}`}>{form.baseUnit ? `Quantos ${form.baseUnit} em cada ${form.unit || 'unidade'}` : 'Quanto vem em cada unidade'}</Label>
          <Input id={`cap-${item.id}`} inputMode="decimal" value={form.unitCapacity} disabled={readOnly} onChange={(e) => setForm({ ...form, unitCapacity: e.target.value })} />
        </div>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          {dirty && (
            <Button size="sm" variant="outline" onClick={() => save()} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Salvar alterações
            </Button>
          )}
          <Button size="sm" onClick={search} disabled={searching || saving}>
            {searching ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : item.searchedAt ? <RefreshCw className="mr-1 h-4 w-4" /> : <Search className="mr-1 h-4 w-4" />}
            {searching ? 'Buscando nas fontes...' : item.searchedAt ? 'Buscar de novo' : 'Buscar preços'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAddQuote(item)}>
            <Paperclip className="mr-1 h-4 w-4" /> Anexar cotação ou nota
          </Button>
        </div>
      )}
      {searching && <p className="text-xs text-gray-500">As fontes do governo levam alguns segundos por consulta; a lista aparece sozinha ao terminar (cerca de 1 minuto).</p>}
      {item.searchMessage && !searching && (
        <p className={cn('rounded-md p-2 text-xs', item.searchStatus === 'ERRO' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600')}>
          {item.searchMessage} {item.searchedAt && <>· {new Date(item.searchedAt).toLocaleString('pt-BR')}</>}
        </p>
      )}

      {/* cálculo */}
      {item.quotes.length > 0 && (
        <div className="grid gap-3 rounded-lg border bg-gray-50 p-3 md:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              {s.count} preço(s) no cálculo{s.baseUnit ? `, comparados por ${s.baseUnit}` : ''}
            </p>
            {s.stats && (
              <p className="text-gray-700">
                Menor {brl(s.stats.min, true)} · Mediana {brl(s.stats.median, true)} · Média {brl(s.stats.mean, true)} · Maior {brl(s.stats.max, true)}
              </p>
            )}
          </div>
          <div className="text-sm md:text-right">
            <p className="text-gray-600">Preço adotado ({methodLabel.toLowerCase()})</p>
            <p className="text-lg font-semibold text-gray-900">
              {brl(s.unitPrice)} <span className="text-sm font-normal text-gray-600">por {item.unit}</span>
            </p>
            <p className="text-gray-700">Total do item: <strong>{brl(s.total)}</strong></p>
          </div>
          {s.warnings.length > 0 && (
            <ul className="space-y-1 md:col-span-2">
              {s.warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {warning}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {(s.warnings.length > 0 || item.justification) && (
        <div className="space-y-1">
          <Label htmlFor={`just-${item.id}`}>Justificativa (vai para o documento)</Label>
          <Textarea
            id={`just-${item.id}`}
            rows={2}
            maxLength={4000}
            value={justification}
            disabled={readOnly}
            placeholder="Ex.: item exclusivo; só 2 fornecedores na região; preço de 14 meses atrás por falta de compras recentes."
            onChange={(e) => setJustification(e.target.value)}
            onBlur={saveJustification}
          />
        </div>
      )}

      {/* preços */}
      {item.quotes.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {(['in', 'out', 'all'] as Filter[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => { setFilter(option); setShown(PAGE) }}
                className={cn('rounded-full border px-3 py-1 text-xs', filter === option ? 'border-blue-600 bg-blue-600 text-white' : 'text-gray-600')}
              >
                {option === 'in' ? 'No cálculo' : option === 'out' ? 'Fora do cálculo' : 'Todos'} ({counts[option]})
              </button>
            ))}
          </div>
          {filter === 'out' && counts.out > 0 && (
            <p className="text-xs text-gray-500">Confira os marcados &quot;Confirmar&quot;: vieram pelo texto (PNCP) ou sem a quantidade por embalagem (atas). Se for o mesmo item, marque para entrar no cálculo.</p>
          )}
          <ul className="divide-y rounded-md border">
            {list.slice(0, shown).map((quote) => (
              <li key={quote.id} className={cn('flex gap-3 p-3 text-sm', !quote.included && 'bg-gray-50')}>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0"
                  checked={quote.included}
                  disabled={readOnly || busyQuote === quote.id}
                  aria-label={quote.included ? 'Tirar do cálculo' : 'Incluir no cálculo'}
                  onChange={() => (quote.included ? (setExcluding(quote), setReason('')) : decide(quote, true))}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-gray-900">{SOURCE_LABEL[quote.source]}</span>
                    {quote.autoFlag && (
                      <span className={cn('rounded px-1.5 py-0.5 text-[11px]', FLAG_LABEL[quote.autoFlag].className)}>{FLAG_LABEL[quote.autoFlag].label}</span>
                    )}
                    {quote.sphere && <span className="text-xs text-gray-500">{SPHERE_LABEL[quote.sphere]}</span>}
                    <span className="text-xs text-gray-500">· {dateBr(quote.date)}</span>
                  </div>
                  <p className="truncate text-xs text-gray-600" title={quote.description}>{quote.description}</p>
                  <p className="text-xs text-gray-500">
                    {[quote.buyer, [quote.buyerCity, quote.buyerUf].filter(Boolean).join('/'), quote.supplier && `Fornecedor: ${quote.supplier}`, quote.brand && `Marca: ${quote.brand}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {!quote.included && quote.excludedReason && <p className="text-xs text-amber-800">{quote.excludedReason}{quote.decidedByName ? ` — ${quote.decidedByName}` : ''}</p>}
                </div>
                <div className="shrink-0 space-y-0.5 text-right">
                  <p className="font-medium text-gray-900">{brl(quote.unitPrice, true)}</p>
                  <p className="text-xs text-gray-500">
                    por {quote.unitLabel || '—'}
                    {quote.capacity ? ` (${quote.capacity} ${quote.measureUnit || ''})` : ''}
                  </p>
                  {quote.baseUnit && quote.basePrice !== null && quote.baseUnit !== quote.unitLabel && (
                    <p className="text-xs text-gray-500">{brl(quote.basePrice, true)}/{quote.baseUnit}</p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    {quote.sourceUrl && (
                      <a href={quote.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-700" aria-label="Abrir na fonte">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {quote.hasAttachment && (
                      <a href={getFullApiUrl(`/prices/quotes/${quote.id}/file`)} target="_blank" rel="noreferrer" className="text-blue-700" aria-label="Ver arquivo">
                        <FileText className="h-4 w-4" />
                      </a>
                    )}
                    {quote.manual && !readOnly && (
                      <button type="button" onClick={() => deleteQuote(quote)} aria-label="Apagar" className="text-gray-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
            {list.length === 0 && <li className="p-3 text-sm text-gray-500">Nenhum preço aqui.</li>}
          </ul>
          {list.length > shown && (
            <Button size="sm" variant="ghost" onClick={() => setShown(shown + PAGE)}>Mostrar mais ({list.length - shown})</Button>
          )}
        </div>
      )}

      <CatalogPicker
        open={picker}
        initialText={form.description}
        kind={form.kind}
        onClose={() => setPicker(false)}
        onPick={(hit) => {
          setPicker(false)
          save({ kind: hit.kind, catalogCode: hit.code, catalogName: hit.name })
        }}
      />

      <Dialog open={!!excluding} onOpenChange={(open) => !open && setExcluding(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tirar do cálculo</DialogTitle>
            <DialogDescription>O motivo vai para o documento da pesquisa (IN 65/2021, art. 6º).</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((option) => (
              <button key={option} type="button" onClick={() => setReason(option)} className={cn('rounded-full border px-3 py-1 text-xs', reason === option ? 'border-blue-600 bg-blue-50 text-blue-800' : 'text-gray-600')}>
                {option}
              </button>
            ))}
          </div>
          <Textarea rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ou escreva o motivo" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcluding(null)}>Cancelar</Button>
            <Button onClick={() => excluding && decide(excluding, false, reason)} disabled={!reason.trim() || !!busyQuote}>
              {busyQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Tirar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formOf(item: PriceItem) {
  return {
    description: item.description,
    kind: item.kind,
    unit: item.unit,
    quantity: String(item.quantity).replace('.', ','),
    baseUnit: item.baseUnit || '',
    unitCapacity: String(item.unitCapacity).replace('.', ','),
  }
}
