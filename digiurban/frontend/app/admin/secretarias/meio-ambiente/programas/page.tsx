'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'PROGRAMA_AMBIENTAL',
  name: 'Programas Ambientais',
  department: 'meio-ambiente',
  apiEndpoint: 'meio-ambiente/programas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Meio Ambiente', href: '/admin/secretarias/meio-ambiente' },
    { label: 'Programas Ambientais' },
  ],
}

export default function ProgramasAmbientaisPage() {
  return <BaseModuleView config={config} />
}
