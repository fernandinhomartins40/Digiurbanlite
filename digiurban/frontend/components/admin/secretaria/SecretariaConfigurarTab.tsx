'use client'

/**
 * Aba "Configurar" do espaço da secretaria (gestores): serviços oferecidos e
 * para onde cada pedido vai, sugestões de novos serviços e equipe.
 * Antes, as sugestões ficavam misturadas à operação no meio da página.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Calendar, FileCheck, Pencil, Plus, Sparkles, Users } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSecretariaServices } from '@/hooks/useSecretariaServices'
import { useServiceSuggestions } from '@/hooks/useServiceSuggestions'
import { buildServiceCreationUrl } from '@/utils/service-prefill'
import type { CatalogApp } from '@/lib/app-catalog-client'

export function SecretariaConfigurarTab({ slug, code }: { slug: string; code: string }) {
  const { apiRequest } = useAdminAuth()
  const { services, loading } = useSecretariaServices(slug)
  const { displayedSuggestions, totalAvailable, isLoading: suggestionsLoading } = useServiceSuggestions(slug)
  const [apps, setApps] = useState<CatalogApp[]>([])

  useEffect(() => {
    apiRequest(`/api/app-catalog?departmentCode=${code}&withActions=true`)
      .then((res: any) => setApps(res?.data?.apps || []))
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const appNameByAction = useMemo(() => {
    const map: Record<string, string> = {}
    for (const app of apps) for (const action of app.actions) map[action.code] = app.name
    return map
  }, [apps])

  const sorted = [...services].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-lg">Serviços oferecidos</CardTitle>
            <CardDescription>O que o cidadão pode pedir a esta secretaria e o que acontece depois do pedido.</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href={`/admin/servicos/novo?departmentCode=${code}`}>
              <Plus className="h-4 w-4 mr-1" />
              Criar serviço
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum serviço criado ainda. Comece por uma das sugestões abaixo.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {sorted.map((service: any) => (
                <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className={`font-medium ${service.isActive ? '' : 'text-muted-foreground'}`}>
                      {service.name}
                      {!service.isActive && <span className="ml-2 text-xs font-normal">(desativado)</span>}
                    </p>
                    <div className="mt-1">
                      {service.destination === 'APP' ? (
                        <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                          Depois do pedido: {appNameByAction[service.appAction || ''] || 'app da secretaria'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Analisado no protocolo</Badge>
                      )}
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="self-start sm:self-auto">
                    <Link href={`/admin/servicos/${service.id}/editar`}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Sugestões de novos serviços
            </CardTitle>
            <CardDescription>Serviços comuns nesta área, já com formulário pronto para ajustar.</CardDescription>
          </div>
          {totalAvailable > displayedSuggestions.length && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/secretarias/${slug}/sugestoes`}>Ver todas ({totalAvailable})</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {suggestionsLoading ? (
            <Skeleton className="h-32" />
          ) : displayedSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todas as sugestões desta secretaria já viraram serviços.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="rounded-lg border p-4 space-y-3">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-primary shrink-0" />
                      {suggestion.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {suggestion.estimatedDays} dias
                    </span>
                    <span>{suggestion.suggestedFields.length} campos</span>
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link href={buildServiceCreationUrl(slug, suggestion)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Criar este serviço
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Equipe
            </CardTitle>
            <CardDescription>Quem atende nesta secretaria e tem acesso aos apps dela.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/servidores">Gerenciar equipe</Link>
          </Button>
        </CardHeader>
      </Card>
    </div>
  )
}
