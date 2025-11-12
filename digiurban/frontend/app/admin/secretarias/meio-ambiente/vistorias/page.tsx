'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'VISTORIA_AMBIENTAL',
  name: 'Vistorias Ambientais',
  department: 'meio-ambiente',
  apiEndpoint: 'meio-ambiente/vistorias',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Meio Ambiente', href: '/admin/secretarias/meio-ambiente' },
    { label: 'Vistorias Ambientais' },
  ],
}

export default function VistoriasAmbientaisPage() {
  return <BaseModuleView config={config} />
}
