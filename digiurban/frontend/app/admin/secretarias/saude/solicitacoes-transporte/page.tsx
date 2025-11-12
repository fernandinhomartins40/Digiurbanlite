'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'SOLICITACOES_TRANSPORTE',
  name: 'Solicitações de Transporte',
  department: 'saude',
  apiEndpoint: 'saude/solicitacoes-transporte',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Solicitações de Transporte' },
  ],
}

export default function SolicitacoesTransportePage() {
  return <BaseModuleView config={config} />
}
