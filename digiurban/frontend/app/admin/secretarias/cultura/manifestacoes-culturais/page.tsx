'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'MANIFESTACOES_CULTURAIS',
  name: 'Manifestações Culturais',
  department: 'cultura',
  apiEndpoint: 'cultura/manifestacoes-culturais',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Cultura', href: '/admin/secretarias/cultura' },
    { label: 'Manifestações Culturais' },
  ],
}

export default function ManifestacoesCulturaisPage() {
  return <BaseModuleView config={config} />
}
