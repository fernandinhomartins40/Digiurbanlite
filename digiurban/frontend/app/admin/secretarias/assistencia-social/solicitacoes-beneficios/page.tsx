'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'SOLICITACOES_BENEFICIOS',
  name: 'Solicitação de Benefícios',
  department: 'assistencia-social',
  apiEndpoint: 'assistencia-social/solicitacoes-beneficios',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Assistência Social', href: '/admin/secretarias/assistencia-social' },
    { label: 'Solicitação de Benefícios' },
  ],
}

export default function SolicitacoesBeneficiosPage() {
  return <BaseModuleView config={config} />
}
