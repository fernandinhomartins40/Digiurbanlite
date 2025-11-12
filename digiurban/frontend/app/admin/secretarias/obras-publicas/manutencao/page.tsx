'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'MANUTENCAO_OBRAS',
  name: 'Manutenção de Obras',
  department: 'obras_publicas',
  apiEndpoint: 'obras-publicas/manutencao',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Obras Públicas', href: '/admin/secretarias/obras-publicas' },
    { label: 'Manutenção de Obras' },
  ],
}

export default function ManutencaoPage() {
  return <BaseModuleView config={config} />
}
