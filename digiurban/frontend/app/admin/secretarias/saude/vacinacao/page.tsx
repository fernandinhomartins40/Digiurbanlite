'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'VACINACAO',
  name: 'Vacinação',
  department: 'saude',
  apiEndpoint: 'saude/vacinacao',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Vacinação' },
  ],
}

export default function VacinacaoPage() {
  return <BaseModuleView config={config} />
}
