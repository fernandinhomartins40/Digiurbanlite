'use client';

/**
 * Super-admin › Chaves de API — uma página só para cadastrar as chaves de cada
 * serviço de IA pelo painel (sem variável de ambiente).
 */

import { KeyRound } from 'lucide-react';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import { AiProviderKeys } from '@/components/super-admin/AiProviderKeys';

export default function AiKeysPage() {
  const { user } = useSuperAdminAuth();
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
          <KeyRound className="h-7 w-7 text-blue-600" />
          Chaves de API
        </h1>
        <p className="text-gray-600">Uma chave por serviço de inteligência artificial. Salve, teste e ative.</p>
      </div>
      <AiProviderKeys isAdmin={user?.role === 'PLATFORM_ADMIN'} />
    </div>
  );
}
