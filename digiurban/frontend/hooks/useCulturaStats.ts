'use client';

import { useState, useEffect } from 'react';
import { fetchSecretariaProtocolStats } from '@/lib/secretaria-protocol-stats';

interface CulturaStats {
  events: {
    total: number;
    thisMonth: number;
    monthly: number;
    upcoming: number;
    participants: number;
  };
  culturalSpaces: {
    total: number;
    active: number;
  };
  artists: {
    total: number;
    registered: number;
  };
  protocols: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  spaces: {
    total: number;
    reservations: number;
  };
  workshops: {
    active: number;
    students: number;
  };
  groups: {
    active: number;
    performances: number;
  };
}

export function useCulturaStats() {
  const [stats, setStats] = useState<CulturaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // Protocolos reais da secretaria (antes: endpoints inexistentes -> zeros).
        // Indicadores de dominio sem fonte de dados no backend seguem zerados.
        const protocols = await fetchSecretariaProtocolStats('cultura');

        setStats({
          events: { total: 0, thisMonth: 0, monthly: 0, upcoming: 0, participants: 0 },
          culturalSpaces: { total: 0, active: 0 },
          artists: { total: 0, registered: 0 },
          protocols,
          spaces: { total: 0, reservations: 0 },
          workshops: { active: 0, students: 0 },
          groups: { active: 0, performances: 0 }
        });

        setError(null);
      } catch (err: any) {
        console.error('Error fetching cultura stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');

        // Fallback para dados vazios em caso de erro
        setStats({
          events: { total: 0, thisMonth: 0, monthly: 0, upcoming: 0, participants: 0 },
          culturalSpaces: { total: 0, active: 0 },
          artists: { total: 0, registered: 0 },
          protocols: { total: 0, pending: 0, inProgress: 0, completed: 0 },
          spaces: { total: 0, reservations: 0 },
          workshops: { active: 0, students: 0 },
          groups: { active: 0, performances: 0 }
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
