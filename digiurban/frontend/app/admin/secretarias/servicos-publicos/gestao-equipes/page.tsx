'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'GESTAO_EQUIPES',
  name: 'Gestão de Equipes',
  department: 'servicos_publicos',
  apiEndpoint: 'servicos-publicos/gestao-equipes',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos' },
    { label: 'Gestão de Equipes' },
  ],
}

export default function GestaoEquipesPage() {
  return <BaseModuleView config={config} />
}
