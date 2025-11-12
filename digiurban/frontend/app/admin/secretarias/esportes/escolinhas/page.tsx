'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ESCOLINHAS_ESPORTIVAS',
  name: 'Escolinhas Esportivas',
  department: 'esportes',
  apiEndpoint: 'esportes/escolinhas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Esportes', href: '/admin/secretarias/esportes' },
    { label: 'Escolinhas Esportivas' },
  ],
}

export default function EscolinhasPage() {
  return <BaseModuleView config={config} />
}
