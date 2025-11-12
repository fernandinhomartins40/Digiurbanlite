'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATRATIVOS_TURISTICOS',
  name: 'Atrativos Turísticos',
  department: 'turismo',
  apiEndpoint: 'turismo/atrativos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Turismo', href: '/admin/secretarias/turismo' },
    { label: 'Atrativos' },
  ],
}

export default function AtrativosPage() {
  return <BaseModuleView config={config} />
}
