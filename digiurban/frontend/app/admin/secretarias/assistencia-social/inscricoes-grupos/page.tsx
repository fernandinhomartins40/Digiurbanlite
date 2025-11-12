'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'INSCRICOES_GRUPOS',
  name: 'Grupos e Oficinas Sociais',
  department: 'assistencia-social',
  apiEndpoint: 'assistencia-social/inscricoes-grupos',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Assistência Social', href: '/admin/secretarias/assistencia-social' },
    { label: 'Grupos e Oficinas' },
  ],
}

export default function InscricoesGruposPage() {
  return <BaseModuleView config={config} />
}
