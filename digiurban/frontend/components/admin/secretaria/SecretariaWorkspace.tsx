'use client'

/**
 * Espaço da secretaria — um modelo, quatro abas, as mesmas em todas
 * (ARQUITETURA-DE-PRODUTO.md 5.2). Substitui as 21 páginas escritas à mão.
 *
 *  Visão geral  → indicadores reais, demandas do gabinete, atalhos
 *  Protocolos   → a Gestão de Protocolos já filtrada pela secretaria
 *  Apps         → mesas de trabalho da secretaria (catálogo de apps)
 *  Configurar   → serviços, sugestões de novos serviços, equipe (gestores)
 *
 * A aba ativa fica na URL (?aba=protocolos) para ser compartilhável.
 */

import { useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, FileText, LayoutGrid, Settings2, Store } from 'lucide-react'
import { useAdminPermissions } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DepartmentConfig } from '@/lib/department-config'
import { PendingTicketsSection } from '@/components/departments/PendingTicketsSection'
import { SecretariaKpiCards } from './SecretariaKpiCards'
import { SecretariaPedidosTab } from './SecretariaPedidosTab'
import { SecretariaAppsTab } from './SecretariaAppsTab'
import { SecretariaConfigurarTab } from './SecretariaConfigurarTab'

const TABS = ['visao-geral', 'protocolos', 'apps', 'configurar'] as const
type Tab = (typeof TABS)[number]

export function SecretariaWorkspace({ config }: { config: DepartmentConfig }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { hasPermission } = useAdminPermissions()

  const slug = config.slug
  const code = slug.toUpperCase().replace(/-/g, '_')
  const canConfigure = hasPermission('services:create')

  const requested = searchParams.get('aba') as Tab | null
  const tab: Tab =
    requested && TABS.includes(requested) && (requested !== 'configurar' || canConfigure) ? requested : 'visao-geral'

  const changeTab = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === 'visao-geral') params.delete('aba')
      else params.set('aba', next)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const Icon = config.icon

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center flex-wrap gap-3">
          <Icon className={`h-7 w-7 md:h-8 md:w-8 flex-shrink-0 ${config.color}`} />
          <span>{config.name}</span>
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">{config.description}</p>
      </div>

      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="protocolos">
            <FileText className="h-4 w-4 mr-1.5" />
            Protocolos
          </TabsTrigger>
          <TabsTrigger value="apps">
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Apps
          </TabsTrigger>
          {canConfigure && (
            <TabsTrigger value="configurar">
              <Settings2 className="h-4 w-4 mr-1.5" />
              Configurar
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6 mt-6">
          <SecretariaKpiCards slug={slug} />

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/admin/balcao" className="inline-flex items-center whitespace-nowrap">
                <Store className="h-4 w-4 mr-2" />
                Novo atendimento
              </Link>
            </Button>
            <Button variant="outline" onClick={() => changeTab('protocolos')}>
              <FileText className="h-4 w-4 mr-2" />
              Pedidos da secretaria
            </Button>
            <Button variant="outline" onClick={() => changeTab('apps')}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Apps da secretaria
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <PendingTicketsSection />
        </TabsContent>

        <TabsContent value="protocolos" className="mt-6">
          {tab === 'protocolos' && <SecretariaPedidosTab slug={slug} code={code} />}
        </TabsContent>

        <TabsContent value="apps" className="mt-6">
          {tab === 'apps' && <SecretariaAppsTab slug={slug} code={code} />}
        </TabsContent>

        {canConfigure && (
          <TabsContent value="configurar" className="mt-6">
            {tab === 'configurar' && <SecretariaConfigurarTab slug={slug} code={code} />}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
