'use client'

/**
 * Apps que o servidor logado pode abrir (catálogo `mine=true` + telas de apoio
 * das secretarias dele), cada um UMA vez, com ícone e cor.
 * Usado pela tela Apps e pelos atalhos da barra inferior — um pedido só para os dois.
 */

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { appVisual, type AppVisual } from '@/lib/app-icons'
import { CatalogApp, EXTRA_APP_SCREENS } from '@/lib/app-catalog-client'

export interface MyApp extends AppVisual {
  name: string
  description: string
  route: string
  /** secretarias donas (códigos) */
  departments: string[]
}

let cache: Promise<MyApp[]> | null = null
let cachedAt = 0
const TTL_MS = 5 * 60_000 // outra pessoa pode entrar na mesma aba; não guardar para sempre

function load(): Promise<MyApp[]> {
  if (!cache || Date.now() - cachedAt > TTL_MS) {
    cachedAt = Date.now()
    cache = apiRequest('/app-catalog?mine=true')
      .then((res: any) => {
        const apps: CatalogApp[] = res?.data?.apps || []
        // secretarias da pessoa (null = todas, ADMIN): app de várias secretarias aparece só nas dela
        const meus: string[] | null = Array.isArray(res?.data?.myDepartments) ? res.data.myDepartments : null
        const dela = (codes: string[]) => (meus ? codes.filter((code) => meus.includes(code)) : codes)
        const byRoute = new Map<string, MyApp>()
        const add = (name: string, description: string, route: string, departments: string[]) => {
          const atual = byRoute.get(route)
          if (atual) atual.departments = Array.from(new Set([...atual.departments, ...departments]))
          else byRoute.set(route, { name, description, route, departments: [...departments], ...appVisual(route) })
        }
        for (const app of apps) add(app.name, app.description, app.route, dela(app.departments))
        // telas de apoio só das secretarias da pessoa
        const minhas = meus || Array.from(new Set(apps.flatMap((app) => app.departments)))
        for (const code of minhas) for (const screen of EXTRA_APP_SCREENS[code] || []) add(screen.name, screen.description, screen.route, [code])
        return Array.from(byRoute.values())
      })
      .catch(() => {
        cache = null // tenta de novo na próxima tela
        return []
      })
  }
  return cache
}

/** null = carregando */
export function useMyApps(): MyApp[] | null {
  const [apps, setApps] = useState<MyApp[] | null>(null)
  useEffect(() => {
    let alive = true
    load().then((list) => alive && setApps(list))
    return () => {
      alive = false
    }
  }, [])
  return apps
}
