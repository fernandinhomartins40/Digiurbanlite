'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PROGRAMAS_HABITACIONAIS',
  name: 'Programas Habitacionais',
  department: 'habitacao',
  apiEndpoint: 'habitacao/programas-habitacionais',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Habitação', href: '/admin/secretarias/habitacao' },
    { label: 'Programas Habitacionais' },
  ],
}

export default function ProgramasHabitacionaisPage() {
  return <BaseModuleView config={config} />
}
