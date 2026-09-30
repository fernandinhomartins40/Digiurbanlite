'use client';

/**
 * Telas antigas do super-admin que só enxergavam o município padrão
 * ("Configurações › Sistema", "Usuários"). Tudo o que faziam existe, para
 * qualquer município, na tela do município em "Municípios". Redireciona para
 * a do município padrão (slug "default"), na aba indicada.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function DefaultTenantRedirect({ tab }: { tab?: string }) {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/platform/tenants', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        const tenant = (body?.tenants || []).find((t: any) => t.slug === 'default');
        router.replace(tenant ? `/super-admin/tenants/${tenant.id}${tab ? `?aba=${tab}` : ''}` : '/super-admin/tenants');
      })
      .catch(() => router.replace('/super-admin/tenants'));
  }, [router, tab]);

  return (
    <div className="flex items-center justify-center py-24 text-gray-600">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Abrindo o município em &quot;Municípios&quot;...
    </div>
  );
}
