'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'LICENCA_AMBIENTAL',
  name: 'Licenças Ambientais',
  department: 'meio-ambiente',
  apiEndpoint: 'meio-ambiente/licencas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Meio Ambiente', href: '/admin/secretarias/meio-ambiente' },
    { label: 'Licenças Ambientais' },
  ],
}

export default function LicencasAmbientaisPage() {
  return <BaseModuleView config={config} />
}
