'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ASSISTENCIA_TECNICA',
  name: 'Assistência Técnica',
  department: 'agricultura',
  apiEndpoint: 'agricultura/assistencia-tecnica',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Agricultura', href: '/admin/secretarias/agricultura' },
    { label: 'Assistência Técnica' },
  ],
}

export default function AssistenciaTecnicaPage() {
  return <BaseModuleView config={config} />
}
