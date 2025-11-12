'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'OFICINAS_CURSOS',
  name: 'Oficinas e Cursos',
  department: 'cultura',
  apiEndpoint: 'cultura/oficinas-cursos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Cultura', href: '/admin/secretarias/cultura' },
    { label: 'Oficinas e Cursos' },
  ],
}

export default function OficinasCursosPage() {
  return <BaseModuleView config={config} />
}
