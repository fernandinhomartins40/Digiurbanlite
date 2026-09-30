'use client';

/**
 * Barra inferior do portal do cidadão (DigiUrban Glass).
 * Início · Serviços · Pedidos · Mais, e o Assistente no círculo ao lado.
 * O número em "Pedidos" é real: pedidos em que a prefeitura aguarda a pessoa
 * (antes havia um sino com bolinha vermelha fixa que não fazia nada).
 */

import { useEffect, useState } from 'react';
import { FileText, Folder, Home, Menu, Sparkles } from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { GlassTabBar } from '@/components/liquid-glass/GlassTabBar';

function useAwaitingCount() {
  const { citizen, apiRequest } = useCitizenAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!citizen) return;
    let active = true;
    apiRequest('/citizen/protocols?awaiting=true&limit=1')
      .then((data: any) => {
        if (active) setCount(Number(data?.summary?.awaitingCitizen) || 0);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citizen?.id]);

  return count;
}

export function BottomNavigation({ hideOnDesktop = false }: { hideOnDesktop?: boolean }) {
  const awaiting = useAwaitingCount();

  return (
    <GlassTabBar
      label="Seções do portal"
      className={hideOnDesktop ? 'lg:hidden' : undefined}
      tabs={[
        { key: 'inicio', label: 'Início', href: '/cidadao', icon: Home, exact: true },
        { key: 'servicos', label: 'Serviços', href: '/cidadao/servicos', icon: FileText },
        { key: 'pedidos', label: 'Pedidos', href: '/cidadao/protocolos', icon: Folder, badge: awaiting },
        {
          key: 'mais',
          label: 'Mais',
          href: '/cidadao/mais',
          icon: Menu,
          alsoActiveOn: ['/cidadao/perfil', '/cidadao/familia', '/cidadao/documentos', '/cidadao/biometria-facial'],
        },
      ]}
      trailing={{ label: 'Abrir o assistente', href: '/cidadao/assistente', icon: Sparkles }}
    />
  );
}
