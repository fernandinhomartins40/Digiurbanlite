'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'MAPA_URBANO',
  name: 'Mapa Urbano',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/mapa-urbano',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Mapa Urbano' },
  ],
}

export default function MapaUrbanoPage() {
  return <BaseModuleView config={config} />
}
