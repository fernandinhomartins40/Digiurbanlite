'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'INSCRICOES_PROGRAMAS',
  name: 'Programas Sociais',
  department: 'assistencia-social',
  apiEndpoint: 'assistencia-social/inscricoes-programas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Assistência Social', href: '/admin/secretarias/assistencia-social' },
    { label: 'Programas Sociais' },
  ],
}

export default function InscricoesProgramasPage() {
  return <BaseModuleView config={config} />
}
