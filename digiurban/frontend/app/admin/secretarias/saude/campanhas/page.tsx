'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CAMPANHAS_SAUDE',
  name: 'Campanhas de Saúde',
  department: 'saude',
  apiEndpoint: 'saude/campanhas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Campanhas de Saúde' },
  ],
}

export default function CampanhasPage() {
  return <BaseModuleView config={config} />
}
