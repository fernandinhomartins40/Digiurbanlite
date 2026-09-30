'use client'

/**
 * Abas de uma seção do painel (ex.: Documentos, Análises, Serviços): várias
 * páginas que eram itens soltos no menu viram abas de um único item.
 * Cada aba respeita a mesma regra de acesso que tinha no menu, e a barra só
 * aparece nas páginas principais da seção (não em editores/sub-telas).
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminPermissions } from '@/contexts/AdminAuthContext'
import { cn } from '@/lib/utils'
import type { AdminRole } from './admin-nav-config'

export interface SectionTab {
  href: string
  label: string
  minRole?: AdminRole
  permissions?: string[]
}

export function SectionTabs({ label, tabs, className }: { label: string; tabs: SectionTab[]; className?: string }) {
  const pathname = usePathname()
  const { hasMinRole, hasPermission } = useAdminPermissions()

  if (!tabs.some((tab) => tab.href === pathname)) return null

  const visible = tabs.filter(
    (tab) =>
      (!tab.minRole || hasMinRole(tab.minRole as any)) &&
      (!tab.permissions || tab.permissions.some((p) => hasPermission(p)))
  )
  if (visible.length < 2) return null

  return (
    <nav
      role="tablist"
      aria-label={label}
      className={cn('inline-flex h-10 max-w-full items-center overflow-x-auto rounded-md bg-muted p-1 text-muted-foreground', className)}
    >
      {visible.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              'inline-flex items-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
              active && 'bg-background text-foreground shadow-sm'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
