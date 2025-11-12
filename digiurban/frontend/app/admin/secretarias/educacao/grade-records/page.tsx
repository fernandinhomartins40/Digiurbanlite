'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'GRADE_RECORD',
  name: 'Registro de Nota',
  department: 'educacao',
  apiEndpoint: 'educacao/grade-records',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Educação', href: '/admin/secretarias/educacao' },
    { label: 'Registro de Nota' },
  ],
}

export default function GradeRecordsPage() {
  return <BaseModuleView config={config} />
}
