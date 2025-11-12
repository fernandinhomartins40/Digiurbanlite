'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'DENUNCIAS_URBANAS',
  name: 'Denúncias Urbanas',
  department: 'planejamento_urbano',
  apiEndpoint: 'planejamento-urbano/denuncias-urbanas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
    { label: 'Denúncias Urbanas' },
  ],
}

export default function DenunciasUrbanasPage() {
  return <BaseModuleView config={config} />
}
