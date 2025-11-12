'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTO_URBANO',
  name: 'Atendimentos Urbanos',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/atendimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Atendimentos' },
  ],
}

export default function AtendimentosUrbanosPage() {
  return <BaseModuleView config={config} />
}
