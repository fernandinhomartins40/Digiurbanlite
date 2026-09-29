'use client'

/**
 * Redireciona as antigas páginas de "módulo" (por serviço e "Serviços Gerais")
 * para a Gestão de Protocolos já filtrada. Links salvos continuam funcionando.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function LegacyModuleRedirect({ department, module }: { department: string; module?: string }) {
  const router = useRouter()

  useEffect(() => {
    let active = true
    const base = `/admin/protocolos?departamento=${encodeURIComponent(department)}`

    if (!module) {
      router.replace(base)
      return
    }

    const code = department.toUpperCase().replace(/-/g, '_')
    fetch(`/api/protocols/filter-options?departmentCode=${code}&moduleType=${encodeURIComponent(module)}`, {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((body) => {
        if (!active) return
        const serviceId = body?.data?.resolvedServiceId
        router.replace(serviceId ? `${base}&servico=${serviceId}&vista=dados` : base)
      })
      .catch(() => active && router.replace(base))

    return () => {
      active = false
    }
  }, [department, module, router])

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Abrindo a Gestão de Protocolos…</p>
      </div>
    </div>
  )
}
