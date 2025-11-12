'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'DISTRIBUICAO_SEMENTES',
  name: 'Distribuição de Sementes',
  department: 'agricultura',
  apiEndpoint: 'agricultura/distribuicao-sementes',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Agricultura', href: '/admin/secretarias/agricultura' },
    { label: 'Distribuição de Sementes' },
  ],
}

export default function DistribuicaoSementesPage() {
  return <BaseModuleView config={config} />
}
