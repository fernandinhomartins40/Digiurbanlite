'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'EMISSAO_ALVARAS',
  name: 'Emissão de Alvarás',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/emissao-alvaras',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Emissão de Alvarás' },
  ],
}

export default function EmissaoAlvarasPage() {
  return <BaseModuleView config={config} />
}
