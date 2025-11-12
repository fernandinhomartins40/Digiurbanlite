'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PROGRAMAS_TURISMO',
  name: 'Programas de Turismo',
  department: 'turismo',
  apiEndpoint: 'turismo/programas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Turismo', href: '/admin/secretarias/turismo' },
    { label: 'Programas' },
  ],
}

export default function ProgramasPage() {
  return <BaseModuleView config={config} />
}
