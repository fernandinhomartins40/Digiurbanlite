'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'GUARDA_MUNICIPAL',
  name: 'Guarda Municipal',
  department: 'seguranca_publica',
  apiEndpoint: 'seguranca-publica/guarda-municipal',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica' },
    { label: 'Guarda Municipal' },
  ],
}

export default function GuardaMunicipalPage() {
  return <BaseModuleView config={config} />
}
