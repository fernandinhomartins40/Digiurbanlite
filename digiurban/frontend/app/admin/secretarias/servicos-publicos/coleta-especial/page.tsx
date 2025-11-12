'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'COLETA_ESPECIAL',
  name: 'Coleta Especial',
  department: 'servicos_publicos',
  apiEndpoint: 'servicos-publicos/coleta-especial',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos' },
    { label: 'Coleta Especial' },
  ],
}

export default function ColetaEspecialPage() {
  return <BaseModuleView config={config} />
}
