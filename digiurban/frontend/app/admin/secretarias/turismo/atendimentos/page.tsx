'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTO_TURISMO',
  name: 'Atendimentos de Turismo',
  department: 'turismo',
  apiEndpoint: 'turismo/atendimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Turismo', href: '/admin/secretarias/turismo' },
    { label: 'Atendimentos' },
  ],
}

export default function AtendimentosPage() {
  return <BaseModuleView config={config} />
}
