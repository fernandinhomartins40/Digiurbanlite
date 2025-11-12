'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CADASTRO_PROPRIEDADE_RURAL',
  name: 'Propriedades Rurais',
  department: 'agricultura',
  apiEndpoint: 'agricultura/cadastro-propriedade-rural',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Agricultura', href: '/admin/secretarias/agricultura' },
    { label: 'Propriedades' },
  ],
}

export default function PropriedadesPage() {
  return <BaseModuleView config={config} />
}
