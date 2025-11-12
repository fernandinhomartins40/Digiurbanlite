'use client'

import { BaseModuleView } from '@/components/modules/BaseModuleView'

const config = {
  code: 'DENUNCIAS_ANONIMAS',
  name: 'Denúncias Anônimas',
  department: 'seguranca_publica',
  apiEndpoint: 'seguranca-publica/denuncias-anonimas',
  tabs: {
    list: true,
    approval: true,
    dashboard: true,
    management: true,
  },
  breadcrumb: [
    { label: 'Secretarias', href: '/admin' },
    { label: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica' },
    { label: 'Denúncias Anônimas' },
  ],
}

export default function DenunciasAnonimasPage() {
  return <BaseModuleView config={config} />
}
