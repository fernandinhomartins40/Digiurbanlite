'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'DENUNCIAS_RECLAMACOES',
  name: 'Denúncias e Reclamações',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/denuncias-reclamacoes',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Denúncias e Reclamações' },
  ],
}

export default function DenunciasReclamacoesPage() {
  return <BaseModuleView config={config} />
}
