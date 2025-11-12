'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'AGENDAMENTOS_SOCIAIS',
  name: 'Agendamentos Sociais',
  department: 'assistencia-social',
  apiEndpoint: 'assistencia-social/agendamentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Assistência Social', href: '/admin/secretarias/assistencia-social' },
    { label: 'Agendamentos Sociais' },
  ],
}

export default function AgendamentosPage() {
  return <BaseModuleView config={config} />
}
