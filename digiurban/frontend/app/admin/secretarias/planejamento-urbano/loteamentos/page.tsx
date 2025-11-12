'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'LOTEAMENTOS',
  name: 'Loteamentos',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/loteamentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Loteamentos' },
  ],
}

export default function LoteamentosPage() {
  return <BaseModuleView config={config} />
}
