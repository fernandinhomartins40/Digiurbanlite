'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
  name: 'Atendimentos de Assistência Social',
  department: 'assistencia-social',
  apiEndpoint: 'assistencia-social/atendimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Assistência Social', href: '/admin/secretarias/assistencia-social' },
    { label: 'Atendimentos' },
  ],
}

export default function AtendimentosAssistenciaSocialPage() {
  return <BaseModuleView config={config} />
}
