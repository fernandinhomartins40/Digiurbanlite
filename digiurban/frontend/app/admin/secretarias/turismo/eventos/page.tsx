'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'EVENTOS_TURISMO',
  name: 'Eventos de Turismo',
  department: 'turismo',
  apiEndpoint: 'turismo/eventos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Turismo', href: '/admin/secretarias/turismo' },
    { label: 'Eventos' },
  ],
}

export default function EventosPage() {
  return <BaseModuleView config={config} />
}
