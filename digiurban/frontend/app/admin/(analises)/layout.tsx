'use client'

/**
 * Análises — Painel · Relatórios · IA (ARQUITETURA-DE-PRODUTO.md 7).
 * Eram três itens soltos no menu; agora são abas de um item só.
 * O grupo "(analises)" não altera os endereços.
 */

import { SectionTabs } from '@/components/admin/navigation/SectionTabs'

export default function AnalisesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionTabs
        label="Análises"
        className="mb-4"
        tabs={[
          { href: '/admin/analytics', label: 'Painel', minRole: 'COORDINATOR' },
          { href: '/admin/relatorios', label: 'Relatórios', permissions: ['reports:department', 'reports:full'] },
          { href: '/admin/ia', label: 'Assistente de IA', minRole: 'ADMIN' },
        ]}
      />
      {children}
    </>
  )
}
