'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CAMERAS_SEGURANCA',
  name: 'Câmeras de Segurança',
  department: 'seguranca_publica',
  apiEndpoint: 'seguranca-publica/cameras',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica' },
    { label: 'Câmeras' },
  ],
}

export default function CamerasPage() {
  return <BaseModuleView config={config} />
}
