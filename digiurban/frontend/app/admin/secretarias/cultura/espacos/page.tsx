'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ESPACOS',
  name: 'Espaços',
  department: 'cultura',
  apiEndpoint: 'cultura/espacos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Cultura', href: '/admin/secretarias/cultura' },
    { label: 'Espaços' },
  ],
}

export default function EspacosPage() {
  return <BaseModuleView config={config} />
}
