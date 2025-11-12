'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'EXAMES_SAUDE',
  name: 'Exames',
  department: 'saude',
  apiEndpoint: 'saude/exames',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Exames' },
  ],
}

export default function ExamesPage() {
  return <BaseModuleView config={config} />
}
