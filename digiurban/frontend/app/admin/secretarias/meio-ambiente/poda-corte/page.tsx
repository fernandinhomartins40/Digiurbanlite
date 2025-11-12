'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'AUTORIZACAO_PODA_CORTE',
  name: 'Autorizações de Poda e Corte',
  department: 'meio-ambiente',
  apiEndpoint: 'meio-ambiente/poda-corte',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Meio Ambiente', href: '/admin/secretarias/meio-ambiente' },
    { label: 'Autorizações de Poda e Corte' },
  ],
}

export default function PodaCortePage() {
  return <BaseModuleView config={config} />
}
