'use client';

import { useState, useEffect } from 'react';
import { fetchSecretariaProtocolStats } from '@/lib/secretaria-protocol-stats';

interface ServicosPublicosStats {
  publicServiceAttendances: { total: number };
  streetLighting: { total: number };
  urbanCleanings: { total: number };
  specialCollections: { total: number };
  weedingRequests: { total: number };
  drainageRequests: { total: number };
  treePruningRequests: { total: number };
  serviceTeams: { total: number };
  publicServiceRequests: { total: number };
  cleaningSchedules: { total: number };
  teamSchedules: { total: number };
  protocols: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  moduleStats: Record<string, {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }>;
}

export function useServicosPublicosStats() {
  const [stats, setStats] = useState<ServicosPublicosStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // Protocolos reais da secretaria (antes: endpoints inexistentes -> zeros).
        // Indicadores de dominio sem fonte de dados no backend seguem zerados.
        const protocols = await fetchSecretariaProtocolStats('servicos-publicos');

        const zero = { total: 0 };
        setStats({
          publicServiceAttendances: zero,
          streetLighting: zero,
          urbanCleanings: zero,
          specialCollections: zero,
          weedingRequests: zero,
          drainageRequests: zero,
          treePruningRequests: zero,
          serviceTeams: zero,
          publicServiceRequests: zero,
          cleaningSchedules: zero,
          teamSchedules: zero,
          protocols,
          moduleStats: {}
        });

        setError(null);
      } catch (err: any) {
        console.error('Error fetching servicos publicos stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
