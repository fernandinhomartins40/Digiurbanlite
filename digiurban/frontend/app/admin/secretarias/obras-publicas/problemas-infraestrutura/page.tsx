'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PROBLEMAS_INFRAESTRUTURA',
  name: 'Problemas de Infraestrutura',
  department: 'obras_publicas',
  apiEndpoint: 'obras-publicas/problemas-infraestrutura',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Obras Públicas', href: '/admin/secretarias/obras-publicas' },
    { label: 'Problemas de Infraestrutura' },
  ],
}

export default function ProblemasInfraestruturaPage() {
  return <BaseModuleView config={config} />
}
