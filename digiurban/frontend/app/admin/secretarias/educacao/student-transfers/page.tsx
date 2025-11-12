'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'STUDENT_TRANSFER',
  name: 'Transferência de Aluno',
  department: 'educacao',
  apiEndpoint: 'educacao/student-transfers',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Educação', href: '/admin/secretarias/educacao' },
    { label: 'Transferência de Aluno' },
  ],
}

export default function StudentTransfersPage() {
  return <BaseModuleView config={config} />
}
