'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'FILA_HABITACAO',
  name: 'Fila de Habitação',
  department: 'habitacao',
  apiEndpoint: 'habitacao/fila-habitacao',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Habitação', href: '/admin/secretarias/habitacao' },
    { label: 'Fila de Habitação' },
  ],
}

export default function FilaHabitacaoPage() {
  return <BaseModuleView config={config} />
}
