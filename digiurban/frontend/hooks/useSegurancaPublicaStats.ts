'use client';

import { useState, useEffect } from 'react';
import { fetchSecretariaProtocolStats } from '@/lib/secretaria-protocol-stats';

interface SegurancaPublicaStats {
  modules: {
    attendances: number;
    occurrences: number;
    patrolRequests: number;
    cameraRequests: number;
    anonymousTips: number;
    criticalPoints: number;
    alerts: number;
    patrols: number;
    guards: number;
    surveillanceSystems: number;
  };
  highlights: {
    openOccurrences: number;
    urgentOccurrences: number;
    activePatrols: number;
    pendingPatrolRequests: number;
    recentTips: number;
    highRiskPoints: number;
  };
  protocols: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

export function useSegurancaPublicaStats() {
  const [stats, setStats] = useState<SegurancaPublicaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // Protocolos reais da secretaria (antes: endpoints inexistentes -> zeros).
        // Indicadores de dominio sem fonte de dados no backend seguem zerados.
        const protocols = await fetchSecretariaProtocolStats('seguranca-publica');

        setStats({
          modules: {
            attendances: 0, occurrences: 0, patrolRequests: 0, cameraRequests: 0, anonymousTips: 0,
            criticalPoints: 0, alerts: 0, patrols: 0, guards: 0, surveillanceSystems: 0
          },
          highlights: {
            openOccurrences: 0, urgentOccurrences: 0, activePatrols: 0,
            pendingPatrolRequests: 0, recentTips: 0, highRiskPoints: 0
          },
          protocols
        });

        setError(null);
      } catch (err: any) {
        console.error('Error fetching seguranca publica stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
