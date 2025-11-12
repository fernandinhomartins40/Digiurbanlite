'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PROJETOS_CULTURAIS',
  name: 'Projetos Culturais',
  department: 'cultura',
  apiEndpoint: 'cultura/projetos-culturais',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Cultura', href: '/admin/secretarias/cultura' },
    { label: 'Projetos Culturais' },
  ],
}

export default function ProjetosCulturaisPage() {
  return <BaseModuleView config={config} />
}
