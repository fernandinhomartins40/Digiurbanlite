'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CONSULTA_PROGRAMAS',
  name: 'Consulta de Programas',
  department: 'habitacao',
  apiEndpoint: 'habitacao/consulta-programas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Habitação', href: '/admin/secretarias/habitacao' },
    { label: 'Consulta de Programas' },
  ],
}

export default function ConsultaProgramasPage() {
  return <BaseModuleView config={config} />
}
