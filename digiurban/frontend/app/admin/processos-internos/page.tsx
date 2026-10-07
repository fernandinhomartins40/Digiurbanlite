'use client'

/**
 * Processos internos: memorandos, ofícios, requisições e pareceres entre as
 * unidades da prefeitura. Caixa de entrada da minha unidade, enviados e todos.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, FileText, Loader2, Plus, Search, Settings2 } from 'lucide-react'
import { InternalProcessDashboard } from '@/components/admin/internal-process/InternalProcessDashboard'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDate, PROCESS_STATUS } from '@/lib/internal-process'

type Box = 'entrada' | 'enviados' | 'todos'

interface ProcessItem {
  id: string
  number: string
  subject: string
  status: string
  priority: number
  confidential: boolean
  originUnitName: string
  currentUnitName: string
  currentUserName: string | null
  dueAt: string | null
  updatedAt: string
  unread: boolean
  overdue: boolean
  type: { name: string; prefix: string }
}

const BOXES: Array<{ id: Box; label: string }> = [
  { id: 'entrada', label: 'Caixa de entrada' },
  { id: 'enviados', label: 'Enviados' },
  { id: 'todos', label: 'Todos' },
]

export default function ProcessosInternosPage() {
  const { user, apiRequest } = useAdminAuth()
  const [box, setBox] = useState<Box>('entrada')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<ProcessItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      apiRequest(`/internal-processes?box=${box}${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''}`)
        .then((response: any) => {
          if (!cancelled) setItems(response?.data?.items || [])
        })
        .catch((loadError: any) => {
          if (!cancelled) setError(loadError?.message || 'Não foi possível carregar os processos')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, search ? 300 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, box, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos internos</h1>
          <p className="mt-1 text-sm text-gray-600">Memorandos, ofícios, requisições e pareceres entre as unidades da prefeitura.</p>
        </div>
        <div className="flex flex-wrap gap-2">
        {['ADMIN', 'SUPER_ADMIN'].includes(String(user?.role || '')) && (
          <Button variant="outline" asChild>
            <Link href="/admin/processos-internos/configurar">
              <Settings2 className="mr-2 h-4 w-4" />
              Fluxos e responsáveis
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/validar-documento" target="_blank">Conferir assinatura</Link>
        </Button>
        <Button asChild>
          <Link href="/admin/processos-internos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo processo
          </Link>
        </Button>
        </div>
      </div>


      {user && <InternalProcessDashboard />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {BOXES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setBox(item.id)}
              className={cn('rounded-lg px-3 py-1.5 text-sm', box === item.id ? 'bg-white font-medium shadow-sm' : 'text-gray-600')}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input className="pl-8" placeholder="Buscar por número ou assunto" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-900">{box === 'entrada' ? 'Nada esperando a sua unidade' : 'Nenhum processo aqui'}</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="divide-y rounded-xl border bg-white">
          {items.map((item) => {
            const status = PROCESS_STATUS[item.status] || PROCESS_STATUS.ABERTO
            return (
              <li key={item.id}>
                <Link href={`/admin/processos-internos/${item.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm">
                      {item.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Novo" />}
                      <span className="font-mono text-xs text-gray-500">{item.number}</span>
                      <span className="text-xs text-gray-500">{item.type.name}</span>
                      {item.priority === 1 && <span className="rounded bg-red-100 px-1.5 text-xs text-red-700">Urgente</span>}
                      {item.confidential && <span className="rounded bg-gray-200 px-1.5 text-xs text-gray-700">Sigiloso</span>}
                    </p>
                    <p className={cn('truncate text-gray-900', item.unread && 'font-semibold')}>{item.subject}</p>
                    <p className="truncate text-xs text-gray-500">
                      {item.originUnitName} → {item.currentUnitName}
                      {item.currentUserName ? ` · com ${item.currentUserName}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    {item.overdue && (
                      <span className="inline-flex items-center gap-1 text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Prazo vencido
                      </span>
                    )}
                    {!item.overdue && item.dueAt && ['ABERTO', 'EM_TRAMITE'].includes(item.status) && (
                      <span className="text-gray-500">Prazo {formatDate(item.dueAt)}</span>
                    )}
                    <span className={cn('rounded-full px-2.5 py-0.5', status.className)}>{status.label}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
