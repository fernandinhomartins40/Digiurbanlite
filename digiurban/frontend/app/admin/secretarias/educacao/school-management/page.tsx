'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'SCHOOL_MANAGEMENT',
  name: 'Gestão Escolar',
  department: 'educacao',
  apiEndpoint: 'educacao/school-management',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Educação', href: '/admin/secretarias/educacao' },
    { label: 'Gestão Escolar' },
  ],
}

export default function SchoolManagementPage() {
  return <BaseModuleView config={config} />
}
