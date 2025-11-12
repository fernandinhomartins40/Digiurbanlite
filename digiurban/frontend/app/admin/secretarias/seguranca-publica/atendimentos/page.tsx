'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTO_SEGURANCA',
  name: 'Atendimentos de Segurança',
  department: 'seguranca_publica',
  apiEndpoint: 'seguranca-publica/atendimentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica' },
    { label: 'Atendimentos' },
  ],
}

export default function AtendimentosPage() {
  return <BaseModuleView config={config} />
}
