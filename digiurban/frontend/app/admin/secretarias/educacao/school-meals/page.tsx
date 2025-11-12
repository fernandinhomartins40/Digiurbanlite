'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'SCHOOL_MEAL',
  name: 'Merenda Escolar',
  department: 'educacao',
  apiEndpoint: 'educacao/school-meals',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Educação', href: '/admin/secretarias/educacao' },
    { label: 'Merenda Escolar' },
  ],
}

export default function SchoolMealsPage() {
  return <BaseModuleView config={config} />
}
