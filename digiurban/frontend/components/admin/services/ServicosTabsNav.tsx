'use client'

/**
 * Abas de Serviços: Catálogo (/admin/servicos) · Desempenho (/admin/gerenciamento-servicos).
 * Antes eram dois itens de menu com nomes confusos ("Catálogo de Serviços" e
 * "Gestão de Serviços", cuja página se chamava "Estatísticas").
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin/servicos', label: 'Catálogo' },
  { href: '/admin/gerenciamento-servicos', label: 'Desempenho' },
]

export function ServicosTabsNav() {
  const pathname = usePathname()
  return (
    <nav role="tablist" aria-label="Serviços" className="inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground">
      {TABS.map((tab) => {
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
