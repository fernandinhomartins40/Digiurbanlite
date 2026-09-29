'use client'

/**
 * Apps — atalho para as mesas de trabalho especializadas a que o servidor tem
 * acesso (ARQUITETURA-DE-PRODUTO.md 5.1). Antes o único caminho era o card no
 * fim da página de cada secretaria.
 * A lista vem do Catálogo de Apps (`mine=true` aplica a mesma regra de acesso
 * do backend: equipe da secretaria + ADMIN).
 */

import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AppCard } from '@/components/admin/secretaria/SecretariaAppsTab'
import { getDepartmentConfig } from '@/lib/department-config'
import { CatalogApp, EXTRA_APP_SCREENS, departmentSlugFromCode } from '@/lib/app-catalog-client'

export default function AppsPage() {
  const { apiRequest } = useAdminAuth()
  const [apps, setApps] = useState<CatalogApp[] | null>(null)

  useEffect(() => {
    apiRequest('/api/app-catalog?mine=true')
      .then((res: any) => setApps(res?.data?.apps || []))
      .catch(() => setApps([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Agrupa por secretaria (um app compartilhado aparece em cada uma das donas)
  const groups = useMemo(() => {
    const byDept = new Map<string, CatalogApp[]>()
    for (const app of apps || []) {
      for (const code of app.departments) {
        if (!byDept.has(code)) byDept.set(code, [])
        byDept.get(code)!.push(app)
      }
    }
    return Array.from(byDept.entries())
      .map(([code, list]) => ({
        code,
        name: getDepartmentConfig(departmentSlugFromCode(code))?.name || code,
        apps: list,
        extras: EXTRA_APP_SCREENS[code] || [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [apps])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Apps</h1>
        <p className="text-gray-600 mt-1">
          Mesas de trabalho especializadas das suas secretarias. Os pedidos que chegam a um app continuam visíveis na Gestão de Protocolos.
        </p>
      </div>

      {apps === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <LayoutGrid className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Nenhum app disponível para você</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Os apps aparecem aqui para a equipe da secretaria dona de cada um. Os seus pedidos estão na Gestão de Protocolos.
            </p>
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <section key={group.code}>
            <h2 className="text-lg font-semibold mb-3">{group.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.apps.map((app) => (
                <AppCard key={app.code} name={app.name} description={app.description} route={app.route} />
              ))}
              {group.extras.map((screen) => (
                <AppCard key={screen.route} {...screen} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
