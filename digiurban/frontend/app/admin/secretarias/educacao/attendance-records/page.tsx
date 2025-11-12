'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATTENDANCE_RECORD',
  name: 'Registro de Frequência',
  department: 'educacao',
  apiEndpoint: 'educacao/attendance-records',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Educação', href: '/admin/secretarias/educacao' },
    { label: 'Registro de Frequência' },
  ],
}

export default function AttendanceRecordsPage() {
  return <BaseModuleView config={config} />
}
