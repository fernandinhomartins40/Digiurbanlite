'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'OCORRENCIAS',
  name: 'Ocorrências',
  department: 'seguranca_publica',
  apiEndpoint: 'seguranca-publica/ocorrencias',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica' },
    { label: 'Ocorrências' },
  ],
}

export default function OcorrenciasPage() {
  return <BaseModuleView config={config} />
}
