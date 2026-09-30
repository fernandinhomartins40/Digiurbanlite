'use client'

/**
 * Abas de uma seção do painel (ex.: Documentos, Análises, Serviços): várias
 * páginas que eram itens soltos no menu viram abas de um único item.
 * Cada aba respeita a mesma regra de acesso que tinha no menu, e a barra só
 * aparece nas páginas principais da seção (não em editores/sub-telas).
 * Visual: controle segmentado do DigiUrban Glass (SegmentLinks).
 */

import { usePathname } from 'next/navigation'
import { useAdminPermissions } from '@/contexts/AdminAuthContext'
import { SegmentLinks } from '@/components/liquid-glass/SegmentLinks'
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

  return (
    <SegmentLinks
      label={label}
      items={visible.map((tab) => ({ href: tab.href, label: tab.label }))}
      className={className}
    />
  )
}
