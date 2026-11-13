'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { CITIZEN_SUB_SCREENS } from '@/components/admin/navigation/admin-nav-config'

/** Abas de "Cidadãos": as cinco telas que antes eram cinco itens do menu */
export function CitizensTabs() {
  const pathname = usePathname() || ''
  const { stats } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()
  const tabs = CITIZEN_SUB_SCREENS.filter((t) => !t.permissions || t.permissions.some((p) => hasPermission(p)))
  // só nas telas de lista; ficha do cidadão e cadastro novo ficam sem as abas
  if (!tabs.some((t) => t.href === pathname)) return null
  return (
    <nav aria-label="Cidadãos" className="lg-glass lg-bar mb-5 flex w-full gap-1 overflow-x-auto rounded-full p-1 sm:w-fit">
      {tabs.map((t) => {
        const on = t.href === pathname
        const pending = t.href.endsWith('/pendentes') ? stats?.pendingCitizens || 0 : 0
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={`lg-tab ${on ? 'lg-tab-on' : ''} flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium`}
          >
            {t.title}
            {pending > 0 && <span className="sense sense-waiting">{pending}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
