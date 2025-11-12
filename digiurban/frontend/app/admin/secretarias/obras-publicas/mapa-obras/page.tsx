'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'MAPA_OBRAS',
  name: 'Mapa de Obras',
  department: 'obras_publicas',
  apiEndpoint: 'obras-publicas/mapa-obras',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Obras Públicas', href: '/admin/secretarias/obras-publicas' },
    { label: 'Mapa de Obras' },
  ],
}

export default function MapaObrasPage() {
  return <BaseModuleView config={config} />
}
