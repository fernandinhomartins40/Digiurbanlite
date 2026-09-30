'use client'

/**
 * Abas de Serviços: Catálogo (/admin/servicos) · Desempenho (/admin/gerenciamento-servicos).
 * Antes eram dois itens de menu com nomes confusos ("Catálogo de Serviços" e
 * "Gestão de Serviços", cuja página se chamava "Estatísticas").
 */

import { SectionTabs } from '@/components/admin/navigation/SectionTabs'

export function ServicosTabsNav() {
  return (
    <SectionTabs
      label="Serviços"
      tabs={[
        { href: '/admin/servicos', label: 'Catálogo', permissions: ['services:create', 'services:update', 'services:read'] },
        { href: '/admin/gerenciamento-servicos', label: 'Desempenho', permissions: ['services:create', 'services:update', 'services:read'] },
      ]}
    />
  )
}
