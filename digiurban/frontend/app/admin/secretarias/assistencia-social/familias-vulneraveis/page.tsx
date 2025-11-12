'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'FAMILIAS_VULNERAVEIS',
  name: 'Cadastro Único - Famílias Vulneráveis',
  department: 'assistencia-social',
  apiEndpoint: 'assistencia-social/familias-vulneraveis',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Assistência Social', href: '/admin/secretarias/assistencia-social' },
    { label: 'Famílias Vulneráveis' },
  ],
}

export default function FamiliasVulneraveisPage() {
  return <BaseModuleView config={config} />
}
