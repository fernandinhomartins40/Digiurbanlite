'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'EQUIPES_ESPORTIVAS',
  name: 'Equipes Esportivas',
  department: 'esportes',
  apiEndpoint: 'esportes/equipes',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Esportes', href: '/admin/secretarias/esportes' },
    { label: 'Equipes Esportivas' },
  ],
}

export default function EquipesPage() {
  return <BaseModuleView config={config} />
}
