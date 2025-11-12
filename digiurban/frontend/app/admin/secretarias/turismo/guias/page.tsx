'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'GUIAS_TURISMO',
  name: 'Guias de Turismo',
  department: 'turismo',
  apiEndpoint: 'turismo/guias',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Turismo', href: '/admin/secretarias/turismo' },
    { label: 'Guias' },
  ],
}

export default function GuiasPage() {
  return <BaseModuleView config={config} />
}
