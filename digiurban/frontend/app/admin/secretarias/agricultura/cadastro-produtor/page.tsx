// ============================================================
// CADASTRO DE PRODUTORES RURAIS - Sistema Dinâmico Híbrido
// ============================================================
// ✅ MIGRADO para DynamicModuleView (Sistema Híbrido)
// 📅 Data: 2025-11-13
//
// CÓDIGO ANTIGO (backup):
// import { BaseModuleView } from '@/components/modules/BaseModuleView'
// const config = {
//   code: 'CADASTRO_PRODUTOR',
//   name: 'Cadastro de Produtores Rurais',
//   department: 'agricultura',
//   apiEndpoint: 'agricultura/cadastro-produtor',
//   tabs: { list: true, approval: true, dashboard: true, management: true }
// }
// return <BaseModuleView config={config} />
// ============================================================

'use client';

import { DynamicModuleView } from '@/components/core/DynamicModuleView';

export default function CadastroProdutor() {
  return (
    <DynamicModuleView
      department="agricultura"
      module="cadastro-produtor"
    />
  );
}
