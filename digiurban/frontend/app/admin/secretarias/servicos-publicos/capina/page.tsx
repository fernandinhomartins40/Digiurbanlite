'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CAPINA',
  name: 'Capina',
  department: 'servicos_publicos',
  apiEndpoint: 'servicos-publicos/capina',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos' },
    { label: 'Capina' },
  ],
}

export default function CapinaPage() {
  return <BaseModuleView config={config} />
}
