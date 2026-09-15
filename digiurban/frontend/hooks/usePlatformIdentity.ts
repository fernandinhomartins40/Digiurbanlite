'use client'

import { useEffect, useState } from 'react'

/**
 * Identidade de PLATAFORMA do usuário atual (achado A6 da auditoria multi-tenant).
 *
 * Existem DUAS identidades no sistema, e confundi-las foi a origem do bug de
 * papel no painel:
 *
 *   - `User` + role SUPER_ADMIN  → gestor DO PRÓPRIO município (tem tenantId)
 *   - `PlatformUser`             → operador da plataforma (sem tenantId por design)
 *
 * Só a segunda autoriza gerir municípios, billing e planos. O backend já separa
 * as duas (cookie `digiurban_platform_token` + `platformAuthMiddleware`); este
 * hook leva a mesma distinção para a interface, para que o menu municipal pare
 * de exibir atalhos de plataforma com base no role de `User`.
 *
 * 401 aqui é resposta ESPERADA (o usuário simplesmente não é operador), então
 * não logamos como erro nem propagamos exceção.
 */
export function usePlatformIdentity() {
  const [isPlatformOperator, setIsPlatformOperator] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const { getFullApiUrl } = await import('@/lib/api-config')
        const response = await fetch(getFullApiUrl('/platform/auth/me'), {
          credentials: 'include', // cookie httpOnly digiurban_platform_token
        })
        if (cancelled) return
        if (!response.ok) {
          setIsPlatformOperator(false)
          return
        }
        const data = await response.json()
        setIsPlatformOperator(Boolean(data?.platformUser?.id))
      } catch {
        // Rede indisponível ou resposta inválida: tratar como "não é operador".
        // Fail-closed — na dúvida, NÃO exibir atalhos de plataforma.
        if (!cancelled) setIsPlatformOperator(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  return { isPlatformOperator, loading }
}
