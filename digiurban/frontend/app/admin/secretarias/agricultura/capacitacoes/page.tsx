'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CAPACITACOES_RURAIS',
  name: 'Capacitações Rurais',
  department: 'agricultura',
  apiEndpoint: 'agricultura/capacitacoes',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Agricultura', href: '/admin/secretarias/agricultura' },
    { label: 'Capacitações' },
  ],
}

export default function CapacitacoesPage() {
  return <BaseModuleView config={config} />
}
