'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

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

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar estatísticas da rota específica
        const statsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/seguranca-publica/stats`,
          { headers }
        );

        const statsData = statsRes.data;

        if (statsData) {
          setStats({
            modules: {
              attendances: 0,
              occurrences: statsData.occurrences?.total || 0,
              patrolRequests: 0,
              cameraRequests: 0,
              anonymousTips: 0,
              criticalPoints: 0,
              alerts: 0,
              patrols: statsData.patrols?.total || 0,
              guards: 0,
              surveillanceSystems: statsData.cameras?.total || 0
            },
            highlights: {
              openOccurrences: statsData.occurrences?.total - (statsData.occurrences?.resolved || 0),
              urgentOccurrences: statsData.occurrences?.thisMonth || 0,
              activePatrols: statsData.patrols?.active || 0,
              pendingPatrolRequests: 0,
              recentTips: 0,
              highRiskPoints: 0
            },
            protocols: {
              total: 0,
              pending: 0,
              inProgress: 0,
              completed: 0
            }
          });
        }

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
