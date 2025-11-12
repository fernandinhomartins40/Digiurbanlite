'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'COMPETICOES_ESPORTIVAS',
  name: 'Competições Esportivas',
  department: 'esportes',
  apiEndpoint: 'esportes/competicoes',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Esportes', href: '/admin/secretarias/esportes' },
    { label: 'Competições Esportivas' },
  ],
}

export default function CompeticoesPage() {
  return <BaseModuleView config={config} />
}
