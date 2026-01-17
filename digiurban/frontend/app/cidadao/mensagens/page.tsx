'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * PÁGINA ANTIGA DE MENSAGENS - REDIRECIONAMENTO
 *
 * Esta página foi substituída pelo Super App em /cidadao
 * Redireciona automaticamente para a nova interface
 */
export default function OldMessagesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para o Super App (nova página de chat)
    router.replace('/cidadao');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Redirecionando para o chat...</p>
      </div>
    </div>
  );
}
