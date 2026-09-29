'use client';

import { useParams } from 'next/navigation';
import { LegacyModuleRedirect } from '@/components/protocols/LegacyModuleRedirect';

/**
 * Antiga página de "módulo" por serviço. Os módulos deixaram de existir
 * (ARQUITETURA-DE-PRODUTO.md, seção 10): tudo o que ela mostrava — fila do
 * serviço e dados dos formulários — está na Gestão de Protocolos, filtrada
 * pelo serviço, na vista "Dados dos formulários".
 */
export default function LegacyModulePage() {
  const params = useParams();
  return (
    <LegacyModuleRedirect
      department={params.department as string}
      module={params.module as string}
    />
  );
}
