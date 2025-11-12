'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PATRULHAS',
  name: 'Patrulhas',
  department: 'seguranca_publica',
  apiEndpoint: 'seguranca-publica/patrulhas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica' },
    { label: 'Patrulhas' },
  ],
}

export default function PatrulhasPage() {
  return <BaseModuleView config={config} />
}
