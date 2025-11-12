'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PROJETOS_URBANOS',
  name: 'Projetos Urbanos',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/projetos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Projetos' },
  ],
}

export default function ProjetosPage() {
  return <BaseModuleView config={config} />
}
