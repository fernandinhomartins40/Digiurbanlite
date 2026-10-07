'use client'

/**
 * Escolher a unidade de destino. Busca por nome/secretaria e mostra as
 * sugestões do servidor (pelo assunto, comparado às competências do organograma).
 */

import { useEffect, useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface UnitOption {
  id: string
  nome: string
  sigla?: string | null
  department?: string | null
}

interface UnitPickerProps {
  value: string
  onChange: (unitId: string, unit: UnitOption | null) => void
  /** texto para sugerir a unidade (assunto + descrição) */
  hintText?: string
  excludeIds?: string[]
}

export function UnitPicker({ value, onChange, hintText, excludeIds = [] }: UnitPickerProps) {
  const { apiRequest } = useAdminAuth()
  const [units, setUnits] = useState<UnitOption[]>([])
  const [suggested, setSuggested] = useState<Array<{ id: string; nome: string; matched: string[] }>>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiRequest('/internal-processes/units')
      .then((response: any) => setUnits(response?.data?.units || []))
      .catch(() => setUnits([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const text = (hintText || '').trim()
    if (text.length < 8) {
      setSuggested([])
      return
    }
    const timer = setTimeout(() => {
      apiRequest(`/internal-processes/units?text=${encodeURIComponent(text.slice(0, 400))}`)
        .then((response: any) => setSuggested(response?.data?.suggested || []))
        .catch(() => setSuggested([]))
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintText])

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase()
    return units
      .filter((unit) => !excludeIds.includes(unit.id))
      .filter((unit) => !term || `${unit.nome} ${unit.sigla || ''} ${unit.department || ''}`.toLowerCase().includes(term))
      .slice(0, 50)
  }, [units, query, excludeIds])

  const selected = units.find((unit) => unit.id === value) || null
  const pick = (id: string) => onChange(id, units.find((unit) => unit.id === id) || null)

  return (
    <div className="space-y-2">
      {suggested.filter((item) => !excludeIds.includes(item.id)).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 text-gray-500">
            <Sparkles className="h-4 w-4 text-amber-500" /> Sugestão:
          </span>
          {suggested
            .filter((item) => !excludeIds.includes(item.id))
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pick(item.id)}
                title={`Combina com: ${item.matched.join(', ')}`}
                className={cn('rounded-full border px-3 py-1', value === item.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'hover:bg-gray-50')}
              >
                {item.nome}
              </button>
            ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-8" placeholder="Buscar unidade ou secretaria" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="max-h-56 overflow-y-auto rounded-md border">
        {shown.length === 0 && <p className="p-3 text-sm text-gray-500">Nenhuma unidade encontrada.</p>}
        {shown.map((unit) => (
          <button
            key={unit.id}
            type="button"
            onClick={() => pick(unit.id)}
            className={cn('block w-full px-3 py-2 text-left text-sm hover:bg-gray-50', value === unit.id && 'bg-blue-50')}
          >
            <span className="font-medium text-gray-900">{unit.nome}</span>
            {unit.department && <span className="block text-xs text-gray-500">{unit.department}</span>}
          </button>
        ))}
      </div>
      {selected && <p className="text-sm text-gray-700">Destino: <strong>{selected.nome}</strong></p>}
    </div>
  )
}
