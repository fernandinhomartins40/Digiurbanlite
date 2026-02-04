'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página legada removida.
 * Toda a vinculação agora é feita via wizard unificado em /vinculos.
 */
export default function VincularRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/apps/saude/cadastros/vinculos');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Redirecionando...</p>
    </div>
  );
}
