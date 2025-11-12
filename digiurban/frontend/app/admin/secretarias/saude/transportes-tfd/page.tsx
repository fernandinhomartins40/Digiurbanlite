'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'TRANSPORTES_TFD',
  name: 'Transportes TFD',
  department: 'saude',
  apiEndpoint: 'saude/transportes-tfd',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Transportes TFD' },
  ],
}

export default function TransportesTFDPage() {
  return <BaseModuleView config={config} />
}
