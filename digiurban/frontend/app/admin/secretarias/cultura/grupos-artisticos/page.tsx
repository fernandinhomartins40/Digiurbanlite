'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'GRUPOS_ARTISTICOS',
  name: 'Grupos Artísticos',
  department: 'cultura',
  apiEndpoint: 'cultura/grupos-artisticos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Cultura', href: '/admin/secretarias/cultura' },
    { label: 'Grupos Artísticos' },
  ],
}

export default function GruposArtisticosPage() {
  return <BaseModuleView config={config} />
}
