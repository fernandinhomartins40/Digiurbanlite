'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTO_OBRAS',
  name: 'Atendimentos de Obras Públicas',
  department: 'obras_publicas',
  apiEndpoint: 'obras-publicas/atendimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Obras Públicas', href: '/admin/secretarias/obras-publicas' },
    { label: 'Atendimentos' },
  ],
}

export default function AtendimentosObrasPage() {
  return <BaseModuleView config={config} />
}
