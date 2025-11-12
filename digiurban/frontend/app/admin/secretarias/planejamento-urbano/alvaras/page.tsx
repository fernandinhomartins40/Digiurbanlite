'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ALVARAS',
  name: 'Alvarás',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/alvaras',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Alvarás' },
  ],
}

export default function AlvarasPage() {
  return <BaseModuleView config={config} />
}
