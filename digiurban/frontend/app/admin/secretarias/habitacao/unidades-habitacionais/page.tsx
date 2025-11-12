'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'UNIDADES_HABITACIONAIS',
  name: 'Unidades Habitacionais',
  department: 'habitacao',
  apiEndpoint: 'habitacao/unidades-habitacionais',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Habitação', href: '/admin/secretarias/habitacao' },
    { label: 'Unidades Habitacionais' },
  ],
}

export default function UnidadesHabitacionaisPage() {
  return <BaseModuleView config={config} />
}
