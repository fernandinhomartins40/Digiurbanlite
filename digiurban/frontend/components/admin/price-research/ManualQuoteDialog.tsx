'use client'

/**
 * Preço que o servidor traz de fora das fontes automáticas: cotação de
 * fornecedor (inciso IV, até 6 meses), nota fiscal (V, até 1 ano) ou site,
 * tabela ou mídia especializada (III, com o endereço consultado).
 */

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { type PriceItem, unitName } from '@/lib/price-research'

type Source = 'FORNECEDOR' | 'NOTA_FISCAL' | 'OUTRO'

const SOURCES: Array<{ id: Source; label: string; hint: string }> = [
  { id: 'FORNECEDOR', label: 'Orçamento de fornecedor', hint: 'Vale por até 6 meses. Se for usar só orçamentos, junte pelo menos 3 fornecedores.' },
  { id: 'NOTA_FISCAL', label: 'Nota fiscal', hint: 'De compra feita pela prefeitura ou outro órgão, emitida há até 1 ano.' },
  { id: 'OUTRO', label: 'Site, tabela ou mídia especializada', hint: 'Informe o endereço consultado; a data e a hora ficam registradas.' },
]

interface ManualQuoteDialogProps {
  item: PriceItem | null
  onClose: () => void
  onSaved: () => void
}

export function ManualQuoteDialog({ item, onClose, onSaved }: ManualQuoteDialogProps) {
  const { apiRequest } = useAdminAuth()
  const [source, setSource] = useState<Source>('FORNECEDOR')
  const [supplier, setSupplier] = useState('')
  const [supplierDoc, setSupplierDoc] = useState('')
  const [date, setDate] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [unitLabel, setUnitLabel] = useState('')
  const [capacity, setCapacity] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return
    setSource('FORNECEDOR')
    setSupplier('')
    setSupplierDoc('')
    setDate(new Date().toISOString().slice(0, 10))
    setUnitPrice('')
    setUnitLabel(unitName(item.unit))
    setCapacity(item.baseUnit && item.unitCapacity !== 1 ? String(item.unitCapacity) : '')
    setSourceUrl('')
    setFile(null)
    setError(null)
  }, [item])

  const save = async () => {
    if (!item) return
    setError(null)
    const form = new FormData()
    form.append('source', source)
    form.append('supplier', supplier)
    form.append('supplierDoc', supplierDoc)
    form.append('date', date)
    // "1.234,56" ou "25.50"
    form.append('unitPrice', unitPrice.includes(',') ? unitPrice.replace(/\./g, '').replace(',', '.') : unitPrice)
    form.append('unitLabel', unitLabel)
    if (capacity) {
      form.append('capacity', capacity.replace(',', '.'))
      form.append('measureUnit', item.baseUnit || '')
    }
    form.append('sourceUrl', sourceUrl)
    if (file) form.append('file', file)
    try {
      setBusy(true)
      await apiRequest(`/prices/items/${item.id}/quotes`, { method: 'POST', body: form })
      onSaved()
      onClose()
    } catch (saveError: any) {
      setError(saveError?.message || 'Não foi possível salvar')
    } finally {
      setBusy(false)
    }
  }

  const hint = SOURCES.find((option) => option.id === source)?.hint

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Anexar orçamento ou nota</DialogTitle>
          <DialogDescription>{item?.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="quote-source">De onde veio</Label>
            <select id="quote-source" value={source} onChange={(e) => setSource(e.target.value as Source)} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
              {SOURCES.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            {hint && <p className="text-xs text-gray-500">{hint}</p>}
          </div>
          {source !== 'OUTRO' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="quote-supplier">Fornecedor</Label>
                <Input id="quote-supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quote-doc">CNPJ (opcional)</Label>
                <Input id="quote-doc" inputMode="numeric" value={supplierDoc} onChange={(e) => setSupplierDoc(e.target.value)} />
              </div>
            </div>
          )}
          {source === 'OUTRO' && (
            <div className="space-y-1">
              <Label htmlFor="quote-url">Endereço consultado</Label>
              <Input id="quote-url" type="url" placeholder="https://" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="quote-date">{source === 'NOTA_FISCAL' ? 'Emissão' : 'Data'}</Label>
              <Input id="quote-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quote-price">Preço unitário (R$)</Label>
              <Input id="quote-price" inputMode="decimal" placeholder="0,00" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quote-unit">Por</Label>
              <Input id="quote-unit" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
            </div>
          </div>
          {item?.baseUnit && (
            <div className="space-y-1">
              <Label htmlFor="quote-capacity">Quantas {unitName(item.baseUnit, true)} vêm em cada (deixe vazio se for 1)</Label>
              <Input id="quote-capacity" inputMode="decimal" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="quote-file">Arquivo (PDF ou foto, até 10 MB)</Label>
            <Input id="quote-file" type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Anexar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
