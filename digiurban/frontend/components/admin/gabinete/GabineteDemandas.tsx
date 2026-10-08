'use client'

/**
 * Demandas do Gabinete — aba do Painel do Prefeito:
 *  - Cidadão atendido: o cidadão atendido no gabinete vira pedido na secretaria;
 *  - Acompanhar: as demandas enviadas e a resposta das secretarias;
 *  - Ordem às secretarias: pedido do prefeito sem cidadão → processo interno
 *    (ofício/memorando) saindo do Gabinete, acompanhado em Gestão interna.
 * As secretarias recebem e respondem na Visão geral do seu espaço.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NovaDemanda } from '@/components/admin/gabinete/NovaDemanda'
import { DemandasEnviadas } from '@/components/admin/gabinete/DemandasEnviadas'
import { cn } from '@/lib/utils'

type Section = 'nova' | 'acompanhar' | 'ordem'

export function GabineteDemandas({ initial = 'acompanhar', onOpenGestao }: { initial?: Section; onOpenGestao?: () => void }) {
  const [section, setSection] = useState<Section>(initial)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
        {[
          { id: 'acompanhar' as const, label: 'Acompanhar' },
          { id: 'nova' as const, label: 'Cidadão atendido no gabinete' },
          { id: 'ordem' as const, label: 'Ordem às secretarias' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={cn('flex-1 rounded-lg px-3 py-1.5 text-sm', section === item.id ? 'bg-white font-medium shadow-sm' : 'text-gray-600')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === 'acompanhar' && <DemandasEnviadas />}
      {section === 'nova' && <NovaDemanda onCreated={() => setSection('acompanhar')} />}
      {section === 'ordem' && (
        <Card>
          <CardHeader>
            <CardTitle>Ordem às secretarias</CardTitle>
            <CardDescription>
              Para pedidos do prefeito que não são de um cidadão (ex.: &quot;verificar a iluminação da praça&quot;, &quot;relatório da merenda até sexta&quot;).
              Vira um ofício ou memorando saindo do Gabinete, com prazo, despachos e resposta.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/admin/processos-internos/novo?tipo=OFI"><Send className="mr-2 h-4 w-4" />Nova ordem (ofício)</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/processos-internos/novo?tipo=MEM">Memorando</Link>
            </Button>
            {onOpenGestao && (
              <Button variant="ghost" onClick={onOpenGestao}>Acompanhar em Gestão interna</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
