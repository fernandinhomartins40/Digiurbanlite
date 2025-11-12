'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'OBRAS_INTERVENCOES',
  name: 'Obras e Intervenções',
  department: 'obras_publicas',
  apiEndpoint: 'obras-publicas/obras-intervencoes',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Obras Públicas', href: '/admin/secretarias/obras-publicas' },
    { label: 'Obras e Intervenções' },
  ],
}

export default function ObrasIntervencoesPage() {
  return <BaseModuleView config={config} />
}
