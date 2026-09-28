'use client';

import { useState, useEffect } from 'react';
import { fetchSecretariaProtocolStats } from '@/lib/secretaria-protocol-stats';

interface ObrasPublicasStats {
  projects: {
    total: number;
    inProgress: number;
  };
  repairs: {
    total: number;
    completed: number;
  };
  inspections: {
    total: number;
    pending: number;
  };
  protocols: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

export function useObrasPublicasStats() {
  const [stats, setStats] = useState<ObrasPublicasStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // Protocolos reais da secretaria (antes: endpoints inexistentes -> zeros).
        // Indicadores de dominio sem fonte de dados no backend seguem zerados.
        const protocols = await fetchSecretariaProtocolStats('obras-publicas');

        setStats({
          projects: { total: 0, inProgress: 0 },
          repairs: { total: 0, completed: 0 },
          inspections: { total: 0, pending: 0 },
          protocols
        } as any);

        setError(null);
      } catch (err: any) {
        console.error('Error fetching obras publicas stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
