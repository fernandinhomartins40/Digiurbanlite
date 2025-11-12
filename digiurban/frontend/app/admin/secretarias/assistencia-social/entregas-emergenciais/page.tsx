'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ENTREGAS_EMERGENCIAIS',
  name: 'Entregas Emergenciais',
  department: 'assistencia-social',
  apiEndpoint: 'assistencia-social/entregas-emergenciais',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Assistência Social', href: '/admin/secretarias/assistencia-social' },
    { label: 'Entregas Emergenciais' },
  ],
}

export default function EntregasEmergenciaisPage() {
  return <BaseModuleView config={config} />
}
