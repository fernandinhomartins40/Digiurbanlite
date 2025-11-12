'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTOS_ESPORTES',
  name: 'Atendimentos Esportivos',
  department: 'esportes',
  apiEndpoint: 'esportes/atendimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Esportes', href: '/admin/secretarias/esportes' },
    { label: 'Atendimentos Esportivos' },
  ],
}

export default function AtendimentosEsportesPage() {
  return <BaseModuleView config={config} />
}
