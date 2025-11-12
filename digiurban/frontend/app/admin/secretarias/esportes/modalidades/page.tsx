'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'MODALIDADES_ESPORTIVAS',
  name: 'Modalidades Esportivas',
  department: 'esportes',
  apiEndpoint: 'esportes/modalidades',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Esportes', href: '/admin/secretarias/esportes' },
    { label: 'Modalidades Esportivas' },
  ],
}

export default function ModalidadesPage() {
  return <BaseModuleView config={config} />
}
