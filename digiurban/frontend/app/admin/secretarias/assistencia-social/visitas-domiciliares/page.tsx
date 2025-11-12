'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'VISITAS_DOMICILIARES',
  name: 'Visitas Domiciliares',
  department: 'assistencia-social',
  apiEndpoint: 'assistencia-social/visitas-domiciliares',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Assistência Social', href: '/admin/secretarias/assistencia-social' },
    { label: 'Visitas Domiciliares' },
  ],
}

export default function VisitasDomiciliaresPage() {
  return <BaseModuleView config={config} />
}
