'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PROGRAMAS_SAUDE',
  name: 'Programas de Saúde',
  department: 'saude',
  apiEndpoint: 'saude/programas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Programas de Saúde' },
  ],
}

export default function ProgramasPage() {
  return <BaseModuleView config={config} />
}
