'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ESTABELECIMENTOS_TURISTICOS',
  name: 'Estabelecimentos Turísticos',
  department: 'turismo',
  apiEndpoint: 'turismo/estabelecimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Turismo', href: '/admin/secretarias/turismo' },
    { label: 'Estabelecimentos' },
  ],
}

export default function EstabelecimentosPage() {
  return <BaseModuleView config={config} />
}
