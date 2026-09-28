'use client';

import { useState, useEffect } from 'react';
import { fetchSecretariaProtocolStats } from '@/lib/secretaria-protocol-stats';

interface EsportesStats {
  athletes: {
    total: number;
    active: number;
  };
  teams: {
    total: number;
    active: number;
  };
  schools: {
    total: number;
    active: number;
  };
  infrastructures: {
    total: number;
    active: number;
  };
  competitions: {
    total: number;
    upcoming: number;
  };
  protocols: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

export function useEsportesStats() {
  const [stats, setStats] = useState<EsportesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // Protocolos reais da secretaria (antes: endpoints inexistentes -> zeros).
        // Indicadores de dominio sem fonte de dados no backend seguem zerados.
        const protocols = await fetchSecretariaProtocolStats('esportes');

        setStats({
          athletes: { total: 0, active: 0 },
          teams: { total: 0, active: 0 },
          schools: { total: 0, active: 0 },
          infrastructures: { total: 0, active: 0 },
          competitions: { total: 0, upcoming: 0 },
          protocols
        });

        setError(null);
      } catch (err: any) {
        console.error('Error fetching esportes stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
        setStats({
          athletes: { total: 0, active: 0 },
          teams: { total: 0, active: 0 },
          schools: { total: 0, active: 0 },
          infrastructures: { total: 0, active: 0 },
          competitions: { total: 0, upcoming: 0 },
          protocols: { total: 0, pending: 0, inProgress: 0, completed: 0 }
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
