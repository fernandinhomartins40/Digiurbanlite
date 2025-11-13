'use client'

import { DynamicModuleView } from '@/components/core/DynamicModuleView'

export default function ProdutoresPage() {
  return <DynamicModuleView department="agricultura" module="cadastro-produtor" />
}
