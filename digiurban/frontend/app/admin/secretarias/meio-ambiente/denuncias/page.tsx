'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'DENUNCIA_AMBIENTAL',
  name: 'Denúncias Ambientais',
  department: 'meio-ambiente',
  apiEndpoint: 'meio-ambiente/denuncias',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Meio Ambiente', href: '/admin/secretarias/meio-ambiente' },
    { label: 'Denúncias Ambientais' },
  ],
}

export default function DenunciasAmbientaisPage() {
  return <BaseModuleView config={config} />
}
