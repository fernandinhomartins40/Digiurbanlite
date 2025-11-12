'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ATENDIMENTO_SERVICOS',
  name: 'Atendimentos Gerais',
  department: 'servicos_publicos',
  apiEndpoint: 'servicos-publicos/atendimentos-gerais',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos' },
    { label: 'Atendimentos Gerais' },
  ],
}

export default function AtendimentosGeraisPage() {
  return <BaseModuleView config={config} />
}
