'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'EQUIPAMENTOS_SOCIAIS',
  name: 'Equipamentos Sociais (CRAS/CREAS)',
  department: 'assistencia-social',
  apiEndpoint: 'assistencia-social/equipamentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Assistência Social', href: '/admin/secretarias/assistencia-social' },
    { label: 'Equipamentos Sociais' },
  ],
}

export default function EquipamentosPage() {
  return <BaseModuleView config={config} />
}
