'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'REGISTRO_PROBLEMA',
  name: 'Registro de Problemas',
  department: 'servicos_publicos',
  apiEndpoint: 'servicos-publicos/registro-problema',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos' },
    { label: 'Registro de Problemas' },
  ],
}

export default function RegistroProblemaPage() {
  return <BaseModuleView config={config} />
}
