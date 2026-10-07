'use client'

/**
 * Demandas do Gabinete (perfil Gabinete do Prefeito):
 *  - Nova demanda: cidadão atendido no gabinete → vira protocolo na secretaria;
 *  - Acompanhar: as demandas enviadas e a resposta das secretarias;
 *  - Ordem às secretarias: pedido interno do prefeito (sem cidadão) → vira
 *    processo interno (ofício/memorando) saindo do Gabinete, acompanhado na aba
 *    Gestão interna do Painel do Prefeito.
 * As secretarias recebem e respondem na Visão geral do seu espaço.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Megaphone, Send } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NovaDemanda } from '@/components/admin/gabinete/NovaDemanda'
import { DemandasEnviadas } from '@/components/admin/gabinete/DemandasEnviadas'

const TABS = ['nova', 'acompanhar', 'ordem']

function DemandasGabinete() {
  const { user } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = TABS.includes(searchParams.get('aba') || '') ? (searchParams.get('aba') as string) : 'nova'
  const hasGabinete = user?.role === 'SUPER_ADMIN' || user?.gabineteAccess === true

  const changeTab = (next: string) =>
    router.replace(next === 'nova' ? pathname : `${pathname}?aba=${next}`, { scroll: false })

  if (user && !hasGabinete) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-gray-600">Só quem tem o perfil Gabinete do Prefeito usa as Demandas do Gabinete.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
          <Megaphone className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mr-2 sm:mr-3" />
          Demandas do Gabinete
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Cidadão atendido no gabinete vira pedido na secretaria. Ordem do prefeito às secretarias vira processo interno.
        </p>
      </div>

      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="nova">Cidadão atendido</TabsTrigger>
          <TabsTrigger value="acompanhar">Acompanhar</TabsTrigger>
          <TabsTrigger value="ordem">Ordem às secretarias</TabsTrigger>
        </TabsList>
        <TabsContent value="nova" className="mt-6">
          <NovaDemanda onCreated={() => changeTab('acompanhar')} />
        </TabsContent>
        <TabsContent value="acompanhar" className="mt-6">
          <DemandasEnviadas />
        </TabsContent>
        <TabsContent value="ordem" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ordem às secretarias</CardTitle>
              <CardDescription>
                Para pedidos do prefeito que não são de um cidadão (ex.: &quot;verificar a iluminação da praça&quot;, &quot;relatório da merenda até sexta&quot;).
                Vira um ofício ou memorando saindo do Gabinete, com prazo, despachos e resposta — e aparece no Painel do Prefeito, aba Gestão interna.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/admin/processos-internos/novo?tipo=OFI"><Send className="mr-2 h-4 w-4" />Nova ordem (ofício)</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/processos-internos/novo?tipo=MEM">Memorando</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin/gabinete/painel-prefeito?aba=gestao">Acompanhar no painel</Link>
              </Button>
            </CardContent>
          </Card>
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
