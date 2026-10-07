'use client'

/**
 * Central do servidor no topo dos processos internos: não lidos, assinaturas
 * esperando por mim, assinaturas que eu pedi e prazos a vencer.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, EyeOff, PenLine, Send } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { cn } from '@/lib/utils'
import { formatDate, MOVEMENT_LABEL } from '@/lib/internal-process'

interface DashboardData {
  unread: { count: number; items: Array<{ id: string; number: string; subject: string; action: string; from: string; at: string }> }
  toSign: Array<{ id: string; processId: string; documentId: string; number: string; title: string; by: string; at: string }>
  asked: Array<{ id: string; processId: string; documentId: string; number: string; title: string; to: string; at: string }>
  deadlines: Array<{ id: string; number: string; subject: string; due: string; stageName: string | null; overdue: boolean }>
}

function Card({ title, count, icon: Icon, empty, children }: { title: string; count: number; icon: any; empty: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[150px] flex-col rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs', count ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500')}>
          <Icon className="h-3.5 w-3.5" />{count}
        </span>
      </div>
      {count === 0 ? <p className="my-auto text-center text-xs text-gray-500">{empty}</p> : <ul className="space-y-1.5 text-sm">{children}</ul>}
    </div>
  )
}

export function InternalProcessDashboard() {
  const { apiRequest } = useAdminAuth()
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    apiRequest('/internal-processes/dashboard')
      .then((response: any) => setData(response?.data || null))
      .catch(() => setData(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!data) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card title="Não lidos" count={data.unread.count} icon={EyeOff} empty="Tudo lido.">
        {data.unread.items.slice(0, 4).map((item) => (
          <li key={item.id}>
            <Link href={`/admin/processos-internos/${item.id}`} className="block rounded-md bg-blue-50 px-2 py-1 hover:bg-blue-100">
              <span className="block font-mono text-xs text-gray-500">{item.number} · {MOVEMENT_LABEL[item.action] || item.action}</span>
              <span className="block truncate text-gray-900">{item.subject}</span>
            </Link>
          </li>
        ))}
      </Card>

      <Card title="Esperando a sua assinatura" count={data.toSign.length} icon={PenLine} empty="Nada para assinar.">
        {data.toSign.slice(0, 4).map((item) => (
          <li key={item.id}>
            <Link href={`/admin/processos-internos/${item.processId}/documentos/${item.documentId}`} className="block rounded-md bg-amber-50 px-2 py-1 hover:bg-amber-100">
              <span className="block truncate text-gray-900">{item.title}</span>
              <span className="block truncate text-xs text-gray-500">{item.number} · pedido por {item.by}</span>
            </Link>
          </li>
        ))}
      </Card>

      <Card title="Assinaturas que você pediu" count={data.asked.length} icon={Send} empty="Nenhum pedido em aberto.">
        {data.asked.slice(0, 4).map((item) => (
          <li key={item.id}>
            <Link href={`/admin/processos-internos/${item.processId}/documentos/${item.documentId}`} className="block rounded-md bg-gray-50 px-2 py-1 hover:bg-gray-100">
              <span className="block truncate text-gray-900">{item.title}</span>
              <span className="block truncate text-xs text-gray-500">{item.number} · esperando {item.to}</span>
            </Link>
          </li>
        ))}
      </Card>

      <Card title="Prazos a vencer" count={data.deadlines.length} icon={CalendarClock} empty="Sem prazos nos próximos 5 dias úteis.">
        {data.deadlines.slice(0, 4).map((item) => (
          <li key={item.id}>
            <Link href={`/admin/processos-internos/${item.id}`} className={cn('block rounded-md px-2 py-1', item.overdue ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100')}>
              <span className="block truncate text-gray-900">{item.subject}</span>
              <span className={cn('block truncate text-xs', item.overdue ? 'text-red-700' : 'text-gray-500')}>
                {item.number}{item.stageName ? ` · ${item.stageName}` : ''} · {item.overdue ? 'venceu' : 'vence'} {formatDate(item.due)}
              </span>
            </Link>
          </li>
        ))}
      </Card>
    </div>
  )
}
