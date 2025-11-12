'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'EVENTOS_CULTURA',
  name: 'Eventos Culturais',
  department: 'cultura',
  apiEndpoint: 'cultura/eventos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Cultura', href: '/admin/secretarias/cultura' },
    { label: 'Eventos' },
  ],
}

export default function EventosPage() {
  return <BaseModuleView config={config} />
}
