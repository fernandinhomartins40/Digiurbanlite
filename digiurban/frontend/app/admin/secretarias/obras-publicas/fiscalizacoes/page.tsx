'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'FISCALIZACAO_OBRAS',
  name: 'Fiscalização de Obras',
  department: 'obras_publicas',
  apiEndpoint: 'obras-publicas/fiscalizacoes',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Obras Públicas', href: '/admin/secretarias/obras-publicas' },
    { label: 'Fiscalização de Obras' },
  ],
}

export default function FiscalizacoesPage() {
  return <BaseModuleView config={config} />
}
