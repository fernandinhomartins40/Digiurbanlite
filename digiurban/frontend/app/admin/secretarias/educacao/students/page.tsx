'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'STUDENT',
  name: 'Matrícula de Alunos',
  department: 'educacao',
  apiEndpoint: 'educacao/students',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Educação', href: '/admin/secretarias/educacao' },
    { label: 'Matrícula de Alunos' },
  ],
}

export default function StudentsPage() {
  return <BaseModuleView config={config} />
}
