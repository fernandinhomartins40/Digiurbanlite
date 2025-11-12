'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CADASTRO_PACIENTE',
  name: 'Cadastro de Pacientes',
  department: 'saude',
  apiEndpoint: 'saude/pacientes',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Saúde', href: '/admin/secretarias/saude' },
    { label: 'Cadastro de Pacientes' },
  ],
}

export default function PacientesPage() {
  return <BaseModuleView config={config} />
}
