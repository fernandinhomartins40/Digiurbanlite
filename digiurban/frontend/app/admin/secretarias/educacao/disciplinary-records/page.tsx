'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'DISCIPLINARY_RECORD',
  name: 'Ocorrência Disciplinar',
  department: 'educacao',
  apiEndpoint: 'educacao/disciplinary-records',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Educação', href: '/admin/secretarias/educacao' },
    { label: 'Ocorrência Disciplinar' },
  ],
}

export default function DisciplinaryRecordsPage() {
  return <BaseModuleView config={config} />
}
