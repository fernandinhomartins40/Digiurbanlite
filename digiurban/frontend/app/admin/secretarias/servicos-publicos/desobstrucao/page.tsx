'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'DESOBSTRUCAO',
  name: 'Desobstrução',
  department: 'servicos_publicos',
  apiEndpoint: 'servicos-publicos/desobstrucao',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos' },
    { label: 'Desobstrução' },
  ],
}

export default function DesobstrucaoPage() {
  return <BaseModuleView config={config} />
}
