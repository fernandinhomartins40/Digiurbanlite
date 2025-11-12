'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTO_AMBIENTAL',
  name: 'Atendimentos Ambientais',
  department: 'meio-ambiente',
  apiEndpoint: 'meio-ambiente/atendimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Meio Ambiente', href: '/admin/secretarias/meio-ambiente' },
    { label: 'Atendimentos Ambientais' },
  ],
}

export default function AtendimentosAmbientaisPage() {
  return <BaseModuleView config={config} />
}
