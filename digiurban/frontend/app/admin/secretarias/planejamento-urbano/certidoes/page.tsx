'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CERTIDOES',
  name: 'Certidões',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/certidoes',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Certidões' },
  ],
}

export default function CertidoesPage() {
  return <BaseModuleView config={config} />
}
