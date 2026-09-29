'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Endereço antigo das mensagens: o chat agora é o Assistente. */
export default function OldMessagesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cidadao/assistente');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Abrindo o assistente...</p>
      </div>
    </div>
  );
}
