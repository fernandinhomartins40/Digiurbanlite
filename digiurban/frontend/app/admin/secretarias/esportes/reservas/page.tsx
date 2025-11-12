'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'RESERVAS_ESPACOS_ESPORTIVOS',
  name: 'Reservas de Espaços Esportivos',
  department: 'esportes',
  apiEndpoint: 'esportes/reservas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Esportes', href: '/admin/secretarias/esportes' },
    { label: 'Reservas de Espaços Esportivos' },
  ],
}

export default function ReservasPage() {
  return <BaseModuleView config={config} />
}
