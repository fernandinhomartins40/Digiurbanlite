'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'NUMERACAO',
  name: 'Numeração',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/numeracao',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Numeração' },
  ],
}

export default function NumeracaoPage() {
  return <BaseModuleView config={config} />
}
