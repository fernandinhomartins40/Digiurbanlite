'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'GESTAO_ACS',
  name: 'Agentes Comunitários de Saúde',
  department: 'saude',
  apiEndpoint: 'saude/acs',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Agentes Comunitários de Saúde' },
  ],
}

export default function ACSPage() {
  return <BaseModuleView config={config} />
}
