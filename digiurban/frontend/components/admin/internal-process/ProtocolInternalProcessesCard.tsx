'use client'

/**
 * No protocolo do cidadão: pedir parecer de outra unidade (processo interno
 * ligado) e ver os que já foram pedidos. O cidadão não vê nada disso.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PROCESS_STATUS } from '@/lib/internal-process'

export function ProtocolInternalProcessesCard({ protocolId, protocolNumber }: { protocolId: string; protocolNumber?: string }) {
  const { apiRequest } = useAdminAuth()
  const [items, setItems] = useState<Array<{ id: string; number: string; currentUnitName: string; status: string }>>([])

  useEffect(() => {
    apiRequest(`/internal-processes?protocolId=${encodeURIComponent(protocolId)}`)
      .then((response: any) => setItems(response?.data?.items || []))
      .catch(() => setItems([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolId])

  const href = `/admin/processos-internos/novo?protocolId=${encodeURIComponent(protocolId)}&tipo=PAR${protocolNumber ? `&numero=${encodeURIComponent(protocolNumber)}` : ''}`

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium text-gray-900">Pareceres internos</p>
        {items.length === 0 ? (
          <p className="text-xs text-gray-500">Precisa da análise de outra unidade? Peça um parecer; a resposta volta como nota interna aqui.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {items.map((item) => {
              const status = PROCESS_STATUS[item.status] || PROCESS_STATUS.ABERTO
              return (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <Link href={`/admin/processos-internos/${item.id}`} className="min-w-0 truncate text-blue-700 hover:underline">
                    {item.number} · {item.currentUnitName}
                  </Link>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs', status.className)}>{status.label}</span>
                </li>
              )
            })}
          </ul>
        )}
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href={href}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Pedir parecer de outra unidade
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
