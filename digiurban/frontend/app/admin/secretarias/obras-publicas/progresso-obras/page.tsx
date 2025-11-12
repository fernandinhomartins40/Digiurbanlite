'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PROGRESSO_OBRAS',
  name: 'Progresso de Obras',
  department: 'obras_publicas',
  apiEndpoint: 'obras-publicas/progresso-obras',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Obras Públicas', href: '/admin/secretarias/obras-publicas' },
    { label: 'Progresso de Obras' },
  ],
}

export default function ProgressoObrasPage() {
  return <BaseModuleView config={config} />
}
