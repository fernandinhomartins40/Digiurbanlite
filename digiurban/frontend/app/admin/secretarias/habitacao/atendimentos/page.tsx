'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTO_HABITACAO',
  name: 'Atendimentos de Habitação',
  department: 'habitacao',
  apiEndpoint: 'habitacao/atendimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Habitação', href: '/admin/secretarias/habitacao' },
    { label: 'Atendimentos de Habitação' },
  ],
}

export default function AtendimentosPage() {
  return <BaseModuleView config={config} />
}
