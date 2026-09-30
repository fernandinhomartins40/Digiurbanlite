'use client';

import { DefaultTenantRedirect } from '@/components/super-admin/DefaultTenantRedirect';

// Tela antiga "Usuários" (só servidores do município padrão). Usuários de cada
// município ficam na aba "Administradores" da tela do município em "Municípios".
export default function LegacyUsersRedirect() {
  return <DefaultTenantRedirect tab="admins" />;
}
