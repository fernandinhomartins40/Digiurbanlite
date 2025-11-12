'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'REGULARIZACAO_FUNDIARIA',
  name: 'Regularização Fundiária',
  department: 'habitacao',
  apiEndpoint: 'habitacao/regularizacao-fundiaria',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Habitação', href: '/admin/secretarias/habitacao' },
    { label: 'Regularização Fundiária' },
  ],
}

export default function RegularizacaoFundiariaPage() {
  return <BaseModuleView config={config} />
}
