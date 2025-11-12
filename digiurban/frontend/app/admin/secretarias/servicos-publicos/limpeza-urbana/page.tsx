'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'LIMPEZA_URBANA',
  name: 'Limpeza Urbana',
  department: 'servicos_publicos',
  apiEndpoint: 'servicos-publicos/limpeza-urbana',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos' },
    { label: 'Limpeza Urbana' },
  ],
}

export default function LimpezaUrbanaPage() {
  return <BaseModuleView config={config} />
}
