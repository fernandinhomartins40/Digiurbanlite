'use client';

import { useParams } from 'next/navigation';
import { LegacyModuleRedirect } from '@/components/protocols/LegacyModuleRedirect';

/**
 * Antiga página "Serviços Gerais" (serviços sem formulário). Os pedidos desses
 * serviços estão na Gestão de Protocolos, filtrada pela secretaria.
 */
export default function LegacyServicosGeraisPage() {
  const params = useParams();
  return <LegacyModuleRedirect department={params.department as string} />;
}
