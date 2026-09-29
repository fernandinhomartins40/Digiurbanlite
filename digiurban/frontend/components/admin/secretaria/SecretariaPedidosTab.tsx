'use client'

/**
 * Aba "Protocolos" do espaço da secretaria: a fila da secretaria resumida em
 * contadores (cada um abre a Gestão de Protocolos já filtrada) e o atalho para
 * os dados dos formulários de cada serviço. Não há outra lista de pedidos —
 * a Gestão de Protocolos é a página única (ARQUITETURA-DE-PRODUTO.md 10).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, ArrowRight, Clock, FileText, Inbox, Table2, UserCheck, UserX } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type QueueCounts = Record<'active' | 'mine' | 'unassigned' | 'overdue' | 'due_soon' | 'all', number>

interface ServiceOption {
  id: string
  name: string
  hasForm: boolean
  isActive: boolean
}

const VIEWS: { view: keyof QueueCounts; label: string; hint: string; icon: LucideIcon; tone?: string }[] = [
  { view: 'active', label: 'Em aberto', hint: 'pedidos em andamento', icon: Inbox },
  { view: 'overdue', label: 'Atrasados', hint: 'fora do prazo', icon: AlertTriangle, tone: 'text-red-600' },
  { view: 'due_soon', label: 'Vencendo', hint: 'prazo nos próximos dias', icon: Clock, tone: 'text-amber-600' },
  { view: 'unassigned', label: 'Sem responsável', hint: 'aguardando alguém assumir', icon: UserX },
  { view: 'mine', label: 'Comigo', hint: 'sob sua responsabilidade', icon: UserCheck },
]

export function SecretariaPedidosTab({ slug, code }: { slug: string; code: string }) {
  const { apiRequest } = useAdminAuth()
  const [counts, setCounts] = useState<QueueCounts | null>(null)
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const queueHref = `/admin/protocolos?departamento=${slug}`

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiRequest(`/api/protocols/queue-summary?departmentCode=${code}`),
      apiRequest(`/api/protocols/filter-options?departmentCode=${code}`),
    ]).then(([summary, options]) => {
      if (!active) return
      setCounts(summary.status === 'fulfilled' ? summary.value?.data ?? null : null)
      setServices(options.status === 'fulfilled' ? options.value?.data?.services ?? [] : [])
      setLoading(false)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const withForm = services.filter((s) => s.hasForm && s.isActive)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {VIEWS.map(({ view, label, hint, icon: Icon, tone }) => (
          <Link key={view} href={view === 'active' ? queueHref : `${queueHref}&view=${view}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${tone || 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className={`text-2xl font-bold ${counts && counts[view] > 0 && tone ? tone : ''}`}>
                    {counts ? counts[view] : '—'}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Gestão de Protocolos
          </CardTitle>
          <CardDescription>
            Fila, prazos, responsáveis e os dados dos formulários de todos os pedidos da secretaria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild>
            <Link href={queueHref} className="inline-flex items-center whitespace-nowrap">
              Abrir os pedidos da secretaria
              <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
            </Link>
          </Button>

          {withForm.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Dados dos formulários por serviço</p>
              <div className="flex flex-wrap gap-2">
                {withForm.map((service) => (
                  <Link
                    key={service.id}
                    href={`${queueHref}&servico=${service.id}&vista=dados`}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted"
                  >
                    <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {service.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
