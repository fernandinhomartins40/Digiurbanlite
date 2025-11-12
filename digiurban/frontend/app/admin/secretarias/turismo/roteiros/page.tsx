'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ROTEIROS_TURISTICOS',
  name: 'Roteiros Turísticos',
  department: 'turismo',
  apiEndpoint: 'turismo/roteiros',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Turismo', href: '/admin/secretarias/turismo' },
    { label: 'Roteiros' },
  ],
}

export default function RoteirosPage() {
  return <BaseModuleView config={config} />
}
