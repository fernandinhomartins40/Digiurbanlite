'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ALERTAS_SEGURANCA',
  name: 'Alertas de Segurança',
  department: 'seguranca_publica',
  apiEndpoint: 'seguranca-publica/alertas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica' },
    { label: 'Alertas' },
  ],
}

export default function AlertasPage() {
  return <BaseModuleView config={config} />
}
