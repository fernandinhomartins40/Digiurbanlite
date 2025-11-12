'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'MEDICAMENTOS',
  name: 'Medicamentos',
  department: 'saude',
  apiEndpoint: 'saude/medicamentos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Medicamentos' },
  ],
}

export default function MedicamentosPage() {
  return <BaseModuleView config={config} />
}
