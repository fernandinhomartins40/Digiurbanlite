'use client'

/**
 * Aba "Apps" do espaço da secretaria: as mesas de trabalho especializadas
 * (catálogo de apps + telas de apoio). Antes eram cards soltos no fim de cada
 * uma das 21 páginas, escritos à mão.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LayoutGrid } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CatalogApp, EXTRA_APP_SCREENS } from '@/lib/app-catalog-client'

export function AppCard({ name, description, route, entries }: { name: string; description: string; route: string; entries?: number }) {
  return (
    <Link href={route} className="group">
      <Card className="h-full transition-all hover:border-primary hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between gap-2 group-hover:text-primary">
            {name}
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {!!entries && (
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Recebe pedidos de {entries} {entries === 1 ? 'tipo de serviço' : 'tipos de serviço'}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}

export function SecretariaAppsTab({ code }: { slug: string; code: string }) {
  const { apiRequest } = useAdminAuth()
  const [apps, setApps] = useState<CatalogApp[] | null>(null)

  useEffect(() => {
    let active = true
    apiRequest(`/api/app-catalog?departmentCode=${code}`)
      .then((res: any) => active && setApps(res?.data?.apps || []))
      .catch(() => active && setApps([]))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const extras = EXTRA_APP_SCREENS[code] || []

  if (apps === null) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (apps.length === 0 && extras.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <LayoutGrid className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">Esta secretaria ainda não tem apps</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Todos os pedidos dela são analisados e concluídos na aba Protocolos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <AppCard key={app.code} name={app.name} description={app.description} route={app.route} entries={app.actions.length} />
        ))}
      </div>
      {extras.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Outras telas de trabalho</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extras.map((screen) => (
              <AppCard key={screen.route} {...screen} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
