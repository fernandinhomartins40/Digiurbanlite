'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTOS_CULTURA',
  name: 'Atendimentos Culturais',
  department: 'cultura',
  apiEndpoint: 'cultura/atendimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Cultura', href: '/admin/secretarias/cultura' },
    { label: 'Atendimentos' },
  ],
}

export default function AtendimentosCulturaPage() {
  return <BaseModuleView config={config} />
}
