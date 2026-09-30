'use client'

/**
 * Demandas do Gabinete — um lugar para o gabinete pedir e acompanhar
 * (ARQUITETURA-DE-PRODUTO.md 7). Antes: "Criar Chamado" (/admin/chamados) e
 * "Meus Chamados" (/admin/chamados/lista) eram páginas separadas.
 * As secretarias recebem e respondem na Visão geral do seu espaço.
 */

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Megaphone } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NovaDemanda } from '@/components/admin/gabinete/NovaDemanda'
import { DemandasEnviadas } from '@/components/admin/gabinete/DemandasEnviadas'

function DemandasGabinete() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('aba') === 'acompanhar' ? 'acompanhar' : 'nova'

  const changeTab = (next: string) =>
    router.replace(next === 'nova' ? pathname : `${pathname}?aba=${next}`, { scroll: false })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
          <Megaphone className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mr-2 sm:mr-3" />
          Demandas do Gabinete
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Envie demandas às secretarias e acompanhe o andamento de cada uma.
        </p>
      </div>

      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList>
          <TabsTrigger value="nova">Nova demanda</TabsTrigger>
          <TabsTrigger value="acompanhar">Acompanhar</TabsTrigger>
        </TabsList>
        <TabsContent value="nova" className="mt-6">
          <NovaDemanda onCreated={() => changeTab('acompanhar')} />
        </TabsContent>
        <TabsContent value="acompanhar" className="mt-6">
          <DemandasEnviadas />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function DemandasGabinetePage() {
  return (
    <Suspense fallback={null}>
      <DemandasGabinete />
    </Suspense>
  )
}
