'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'EDUCATION_ATTENDANCE',
  name: 'Atendimento Educacional',
  department: 'educacao',
  apiEndpoint: 'educacao/education-attendances',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Educação', href: '/admin/secretarias/educacao' },
    { label: 'Atendimento Educacional' },
  ],
}

export default function EducationAttendancesPage() {
  return <BaseModuleView config={config} />
}
