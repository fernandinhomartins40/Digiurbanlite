'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'ILUMINACAO_PUBLICA',
  name: 'Iluminação Pública',
  department: 'servicos_publicos',
  apiEndpoint: 'servicos-publicos/iluminacao-publica',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos' },
    { label: 'Iluminação Pública' },
  ],
}

export default function IluminacaoPublicaPage() {
  return <BaseModuleView config={config} />
}
