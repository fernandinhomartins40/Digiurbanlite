'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PONTOS_CRITICOS',
  name: 'Pontos Críticos',
  department: 'seguranca_publica',
  apiEndpoint: 'seguranca-publica/pontos-criticos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica' },
    { label: 'Pontos Críticos' },
  ],
}

export default function PontosCriticosPage() {
  return <BaseModuleView config={config} />
}
