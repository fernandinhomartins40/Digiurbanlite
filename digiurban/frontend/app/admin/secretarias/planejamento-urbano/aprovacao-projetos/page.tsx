'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'APROVACAO_PROJETOS',
  name: 'Aprovação de Projetos',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/aprovacao-projetos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Aprovação de Projetos' },
  ],
}

export default function AprovacaoProjetosPage() {
  return <BaseModuleView config={config} />
}
