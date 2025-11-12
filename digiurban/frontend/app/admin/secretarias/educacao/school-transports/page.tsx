'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'SCHOOL_TRANSPORT',
  name: 'Transporte Escolar',
  department: 'educacao',
  apiEndpoint: 'educacao/school-transports',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Educação', href: '/admin/secretarias/educacao' },
    { label: 'Transporte Escolar' },
  ],
}

export default function SchoolTransportsPage() {
  return <BaseModuleView config={config} />
}
