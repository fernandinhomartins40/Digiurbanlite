'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'CADASTRO_PRODUTOR',
  name: 'Cadastro de Produtores Rurais',
  department: 'agricultura',
  apiEndpoint: 'agricultura/cadastro-produtor',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Agricultura', href: '/admin/secretarias/agricultura' },
    { label: 'Cadastro de Produtores' },
  ],
}

export default function CadastroProdutor() {
  return <BaseModuleView config={config} />
}
