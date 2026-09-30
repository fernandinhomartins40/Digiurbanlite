'use client'

/**
 * Documentos — Meus documentos · Assinaturas · Modelos · Certificados
 * (ARQUITETURA-DE-PRODUTO.md 7). Eram quatro itens soltos no menu; agora são
 * abas de um item só. O grupo "(documentos)" não altera os endereços.
 */

import { SectionTabs } from '@/components/admin/navigation/SectionTabs'

export default function DocumentosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionTabs
        label="Documentos"
        className="mb-4"
        tabs={[
          { href: '/admin/meus-documentos', label: 'Meus documentos', minRole: 'USER' },
          { href: '/admin/assinaturas-digitais', label: 'Assinaturas', minRole: 'COORDINATOR' },
          { href: '/admin/templates-documentos', label: 'Modelos', minRole: 'ADMIN' },
          { href: '/admin/certificados-digitais', label: 'Certificados', minRole: 'ADMIN' },
        ]}
      />
      {children}
    </>
  )
}
