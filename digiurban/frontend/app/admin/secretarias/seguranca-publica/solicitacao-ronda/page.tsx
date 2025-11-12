'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'SOLICITACAO_RONDA',
  name: 'Solicitação de Ronda',
  department: 'seguranca_publica',
  apiEndpoint: 'seguranca-publica/solicitacao-ronda',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica' },
    { label: 'Solicitação de Ronda' },
  ],
}

export default function SolicitacaoRondaPage() {
  return <BaseModuleView config={config} />
}
