'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTOS_AGRICULTURA',
  name: 'Atendimentos Agricultura',
  department: 'agricultura',
  apiEndpoint: 'agricultura/atendimentos-agricultura',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Agricultura', href: '/admin/secretarias/agricultura' },
    { label: 'Atendimentos' },
  ],
}

export default function AtendimentosPage() {
  return <BaseModuleView config={config} />
}
