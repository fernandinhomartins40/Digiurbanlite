'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface HabitacaoStats {
  families: {
    total: number;
    active: number;
  };
  units: {
    total: number;
    available: number;
  };
  programs: {
    total: number;
    active: number;
  };
  protocols: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

export function useHabitacaoStats() {
  const [stats, setStats] = useState<HabitacaoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar estatísticas da rota /stats
        const statsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/secretarias/habitacao/stats`,
          { headers }
        );

        const statsData = statsRes.data?.data;

        if (statsData) {
          setStats({
            families: {
              total: statsData.families?.total || 0,
              active: statsData.families?.active || 0
            },
            units: {
              total: statsData.units?.total || 0,
              available: statsData.units?.available || 0
            },
            programs: {
              total: statsData.programs?.total || 0,
              active: statsData.programs?.active || 0
            },
            protocols: {
              total: statsData.protocols?.total || 0,
              pending: statsData.protocols?.pending || 0,
              inProgress: statsData.protocols?.inProgress || 0,
              completed: statsData.protocols?.completed || 0
            }
          });
        } else {
          setStats({
            families: { total: 0, active: 0 },
            units: { total: 0, available: 0 },
            programs: { total: 0, active: 0 },
            protocols: { total: 0, pending: 0, inProgress: 0, completed: 0 }
          });
        }

        setError(null);
      } catch (err: any) {
        console.error('Error fetching habitacao stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
        setStats({
          families: { total: 0, active: 0 },
          units: { total: 0, available: 0 },
          programs: { total: 0, active: 0 },
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
