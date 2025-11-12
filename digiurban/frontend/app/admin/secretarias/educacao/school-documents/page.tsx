'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'SCHOOL_DOCUMENT',
  name: 'Documento Escolar',
  department: 'educacao',
  apiEndpoint: 'educacao/school-documents',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Educação', href: '/admin/secretarias/educacao' },
    { label: 'Documento Escolar' },
  ],
}

export default function SchoolDocumentsPage() {
  return <BaseModuleView config={config} />
}
