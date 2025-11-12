'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'TORNEIOS_ESPORTIVOS',
  name: 'Torneios Esportivos',
  department: 'esportes',
  apiEndpoint: 'esportes/torneios',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Esportes', href: '/admin/secretarias/esportes' },
    { label: 'Torneios Esportivos' },
  ],
}

export default function TorneiosPage() {
  return <BaseModuleView config={config} />
}
