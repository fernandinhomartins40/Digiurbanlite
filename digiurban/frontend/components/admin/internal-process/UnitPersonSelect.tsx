'use client'

/**
 * Escolher a unidade e, se quiser, o servidor que recebe. Os servidores vêm
 * da lotação da unidade no organograma; "Qualquer pessoa da unidade" deixa a
 * unidade toda receber.
 */

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export interface UnitPersonValue {
  unitId: string
  userId: string
}

interface UnitPersonSelectProps {
  units: Array<{ id: string; nome: string; department?: string | null }>
  value: UnitPersonValue
  onChange: (value: UnitPersonValue) => void
  disabled?: boolean
  emptyLabel?: string
  /** nome do servidor já salvo (aparece mesmo se não estiver mais lotado na unidade) */
  userName?: string | null
}

export function UnitPersonSelect({ units, value, onChange, disabled, emptyLabel = '— ninguém definido —', userName }: UnitPersonSelectProps) {
  const { apiRequest } = useAdminAuth()
  const [people, setPeople] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (!value.unitId) {
      setPeople([])
      return
    }
    let cancelled = false
    apiRequest(`/internal-processes/units/${value.unitId}/people`)
      .then((response: any) => !cancelled && setPeople(response?.data?.people || []))
      .catch(() => !cancelled && setPeople([]))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.unitId])

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      <select
        value={value.unitId}
        disabled={disabled}
        onChange={(e) => onChange({ unitId: e.target.value, userId: '' })}
        className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
        aria-label="Unidade"
      >
        <option value="">{emptyLabel}</option>
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>{unit.nome}{unit.department ? ` · ${unit.department}` : ''}</option>
        ))}
      </select>
      <select
        value={value.userId}
        disabled={disabled || !value.unitId}
        onChange={(e) => onChange({ ...value, userId: e.target.value })}
        className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60"
        aria-label="Servidor"
      >
        <option value="">{value.unitId ? (people.length ? 'Qualquer pessoa da unidade' : 'Ninguém lotado — a unidade recebe') : 'Servidor (escolha a unidade)'}</option>
        {value.userId && userName && !people.some((person) => person.id === value.userId) && <option value={value.userId}>{userName}</option>}
        {people.map((person) => (
          <option key={person.id} value={person.id}>{person.name}</option>
        ))}
      </select>
    </div>
  )
}
