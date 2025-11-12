'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ESPACOS_CULTURAIS',
  name: 'Espaços Culturais',
  department: 'cultura',
  apiEndpoint: 'cultura/espacos-culturais',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Cultura', href: '/admin/secretarias/cultura' },
    { label: 'Espaços Culturais' },
  ],
}

export default function EspacosCulturaisPage() {
  return <BaseModuleView config={config} />
}
