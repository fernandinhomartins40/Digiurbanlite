'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CADASTRO_ATLETAS',
  name: 'Cadastro de Atletas',
  department: 'esportes',
  apiEndpoint: 'esportes/atletas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Esportes', href: '/admin/secretarias/esportes' },
    { label: 'Cadastro de Atletas' },
  ],
}

export default function AtletasPage() {
  return <BaseModuleView config={config} />
}
