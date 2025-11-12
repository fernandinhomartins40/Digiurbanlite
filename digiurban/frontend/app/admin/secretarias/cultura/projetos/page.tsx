'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PROJETOS',
  name: 'Projetos',
  department: 'cultura',
  apiEndpoint: 'cultura/projetos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Cultura', href: '/admin/secretarias/cultura' },
    { label: 'Projetos' },
  ],
}

export default function ProjetosPage() {
  return <BaseModuleView config={config} />
}
