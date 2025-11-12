'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'AGENDAMENTOS_SAUDE',
  name: 'Agendamentos de Consultas',
  department: 'saude',
  apiEndpoint: 'saude/agendamentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Agendamentos de Consultas' },
  ],
}

export default function AgendamentosPage() {
  return <BaseModuleView config={config} />
}
