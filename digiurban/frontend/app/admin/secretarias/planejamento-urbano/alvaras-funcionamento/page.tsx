'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ALVARAS_FUNCIONAMENTO',
  name: 'Alvarás de Funcionamento',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/alvaras-funcionamento',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Alvarás de Funcionamento' },
  ],
}

export default function AlvarasFuncionamentoPage() {
  return <BaseModuleView config={config} />
}
