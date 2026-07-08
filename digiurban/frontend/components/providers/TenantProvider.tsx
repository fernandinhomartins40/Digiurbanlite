'use client'

/**
 * ============================================================================
 * TENANT PROVIDER (Fase 7 Multi-Tenant — white-label runtime)
 * ============================================================================
 * Recebe a config do tenant já resolvida server-side (via layout raiz) e a
 * disponibiliza para toda a árvore. Injeta as CSS variables de branding no
 * :root para que o tema do município valha em runtime, sem rebuild.
 *
 * Uso:
 *   const { config } = useTenant()
 *   const canSaude = useTenantFeature('saude')
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { TenantConfig, DEFAULT_TENANT_CONFIG, brandingToCssVars } from '@/lib/tenant'

interface TenantContextValue {
  config: TenantConfig
  isFeatureEnabled: (feature: string) => boolean
}

const TenantContext = createContext<TenantContextValue>({
  config: DEFAULT_TENANT_CONFIG,
  isFeatureEnabled: () => true,
})

export function TenantProvider({
  config,
  children,
}: {
  config: TenantConfig
  children: ReactNode
}) {
  // Injeta/atualiza as CSS vars de branding no :root (client-side, para cobrir
  // navegação SPA; o SSR já entrega o style inline no layout).
  useEffect(() => {
    const vars = brandingToCssVars(config)
    const root = document.documentElement
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value)
    }
  }, [config])

  const isFeatureEnabled = (feature: string): boolean => {
    // Sem mapa de features definido → tudo habilitado (compat single-tenant).
    if (!config.features) return true
    const value = config.features[feature]
    // Ausente = habilitado por padrão; só desabilita com `false` explícito.
    return value !== false
  }

  return (
    <TenantContext.Provider value={{ config, isFeatureEnabled }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant(): TenantContextValue {
  return useContext(TenantContext)
}

/** Conveniência: `const canSaude = useTenantFeature('saude')`. */
export function useTenantFeature(feature: string): boolean {
  return useContext(TenantContext).isFeatureEnabled(feature)
}
