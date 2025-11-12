'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTOS_SAUDE',
  name: 'Atendimentos',
  department: 'saude',
  apiEndpoint: 'saude/atendimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Atendimentos' },
  ],
}

export default function AtendimentosPage() {
  return <BaseModuleView config={config} />
}
