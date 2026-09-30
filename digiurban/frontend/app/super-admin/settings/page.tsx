'use client';

import { DefaultTenantRedirect } from '@/components/super-admin/DefaultTenantRedirect';

// Tela antiga "Configurações › Sistema" (só o município padrão, tabela municipio_config).
// Plano, módulos, limites, dados e suspensão ficam na tela do município em "Municípios".
export default function LegacySettingsRedirect() {
  return <DefaultTenantRedirect tab="config" />;
}
