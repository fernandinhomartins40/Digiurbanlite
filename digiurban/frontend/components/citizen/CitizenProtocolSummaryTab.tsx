'use client'

/**
 * Aba "Detalhes" do pedido (cidadão): o que foi pedido e o que a pessoa informou.
 * Número, serviço e situação já aparecem no topo da tela — não repete aqui.
 */

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CitizenProtocolSummaryTabProps {
  protocol: {
    number: string
    title: string
    description?: string | null
    status: string
    createdAt: string
    updatedAt: string
    service: {
      name: string
      description?: string | null
      estimatedDays?: number | null
    }
    department: {
      name: string
    }
    citizen: {
      name: string
      cpf?: string
    }
    customData?: Record<string, any>
  }
}

/** "pontoReferencia" / "ponto_referencia" → "Ponto referencia" */
const prettyLabel = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())

/** Valor legível; objetos/listas viram texto simples (nunca JSON cru na tela) */
function prettyValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (Array.isArray(value)) {
    const items = value.map(prettyValue).filter(Boolean)
    return items.length ? items.join(', ') : null
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, any>
    if (obj.address) return String(obj.address)
    if (obj.label) return String(obj.label)
    if (obj.name) return String(obj.name)
    if (typeof obj.latitude === 'number' && typeof obj.longitude === 'number') return 'Local marcado no mapa'
    return null
  }
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(text)) {
    const date = new Date(text)
    if (!Number.isNaN(date.getTime())) return format(date, 'dd/MM/yyyy', { locale: ptBR })
  }
  return text
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
      <dt className="text-sm text-gray-500 sm:w-44 sm:shrink-0">{label}</dt>
      <dd className="whitespace-pre-wrap break-words text-sm text-gray-900">{value}</dd>
    </div>
  )
}

export function CitizenProtocolSummaryTab({ protocol }: CitizenProtocolSummaryTabProps) {
  const informed = Object.entries(protocol.customData || {})
    .filter(([key]) => !key.startsWith('_') && !key.toLowerCase().startsWith('citizen_') && key !== 'programId')
    .map(([key, value]) => [prettyLabel(key), prettyValue(value)] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[1]))

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 sm:p-6">
        <h3 className="mb-1 text-base font-semibold text-gray-900">Sobre o pedido</h3>
        <dl className="divide-y">
          <Row label="Secretaria" value={protocol.department.name} />
          <Row label="Feito em" value={format(new Date(protocol.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
          <Row label="Última novidade" value={format(new Date(protocol.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
          {!!protocol.service.estimatedDays && <Row label="Prazo" value={`até ${protocol.service.estimatedDays} dias`} />}
        </dl>
      </section>

      {(protocol.description || informed.length > 0) && (
        <section className="rounded-2xl border bg-white p-4 sm:p-6">
          <h3 className="mb-1 text-base font-semibold text-gray-900">O que você informou</h3>
          <dl className="divide-y">
            {protocol.description && <Row label="Descrição" value={protocol.description} />}
            {informed.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </dl>
        </section>
      )}
    </div>
  )
}
