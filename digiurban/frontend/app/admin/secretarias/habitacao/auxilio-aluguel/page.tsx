'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'AUXILIO_ALUGUEL',
  name: 'Auxílio Aluguel',
  department: 'habitacao',
  apiEndpoint: 'habitacao/auxilio-aluguel',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Habitação', href: '/admin/secretarias/habitacao' },
    { label: 'Auxílio Aluguel' },
  ],
}

export default function AuxilioAluguelPage() {
  return <BaseModuleView config={config} />
}
