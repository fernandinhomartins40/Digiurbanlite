'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ZONEAMENTO',
  name: 'Zoneamento',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/zoneamento',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Zoneamento' },
  ],
}

export default function ZoneamentoPage() {
  return <BaseModuleView config={config} />
}
