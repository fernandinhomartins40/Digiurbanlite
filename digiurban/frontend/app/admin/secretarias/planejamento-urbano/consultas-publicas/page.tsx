'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CONSULTAS_PUBLICAS',
  name: 'Consultas Públicas',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/consultas-publicas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Consultas Públicas' },
  ],
}

export default function ConsultasPublicasPage() {
  return <BaseModuleView config={config} />
}
