'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Endereço antigo do "Super App" (chat): o chat agora é o Assistente. */
export default function SuperAppRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cidadao/assistente');
  }, [router]);

  return null;
}
