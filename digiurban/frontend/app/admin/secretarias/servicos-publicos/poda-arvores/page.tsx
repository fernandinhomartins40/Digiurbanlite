'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PODA_ARVORES',
  name: 'Poda de Árvores',
  department: 'servicos_publicos',
  apiEndpoint: 'servicos-publicos/poda-arvores',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos' },
    { label: 'Poda de Árvores' },
  ],
}

export default function PodaArvoresPage() {
  return <BaseModuleView config={config} />
}
