'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'AREA_PROTEGIDA',
  name: 'Áreas Protegidas',
  department: 'meio-ambiente',
  apiEndpoint: 'meio-ambiente/areas-protegidas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Meio Ambiente', href: '/admin/secretarias/meio-ambiente' },
    { label: 'Áreas Protegidas' },
  ],
}

export default function AreasProtegidasPage() {
  return <BaseModuleView config={config} />
}
