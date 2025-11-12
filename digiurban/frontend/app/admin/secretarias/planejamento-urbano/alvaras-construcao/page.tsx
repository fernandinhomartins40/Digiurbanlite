'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ALVARAS_CONSTRUCAO',
  name: 'Alvarás de Construção',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/alvaras-construcao',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Alvarás de Construção' },
  ],
}

export default function AlvarasConstrucaoPage() {
  return <BaseModuleView config={config} />
}
