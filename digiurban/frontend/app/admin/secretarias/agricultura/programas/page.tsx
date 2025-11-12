'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PROGRAMAS_RURAIS',
  name: 'Programas Rurais',
  department: 'agricultura',
  apiEndpoint: 'agricultura/programas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Agricultura', href: '/admin/secretarias/agricultura' },
    { label: 'Programas' },
  ],
}

export default function ProgramasPage() {
  return <BaseModuleView config={config} />
}
