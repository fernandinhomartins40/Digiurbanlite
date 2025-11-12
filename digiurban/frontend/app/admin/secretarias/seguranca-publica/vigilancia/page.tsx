'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'VIGILANCIA',
  name: 'Vigilância',
  department: 'seguranca_publica',
  apiEndpoint: 'seguranca-publica/vigilancia',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica' },
    { label: 'Vigilância' },
  ],
}

export default function VigilanciaPage() {
  return <BaseModuleView config={config} />
}
