'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

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

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar estatísticas da rota /stats
        const statsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/esportes/stats`,
          { headers }
        );

        const statsData = statsRes.data;

        if (statsData) {
          setStats({
            athletes: {
              total: statsData.athletes?.total || 0,
              active: statsData.athletes?.active || 0
            },
            teams: {
              total: 0,
              active: 0
            },
            schools: {
              total: statsData.schools?.total || 0,
              active: statsData.schools?.total || 0
            },
            infrastructures: {
              total: statsData.equipment?.total || 0,
              active: statsData.equipment?.available || 0
            },
            competitions: {
              total: statsData.championships?.total || 0,
              upcoming: statsData.championships?.active || 0
            },
            protocols: {
              total: 0,
              pending: 0,
              inProgress: 0,
              completed: 0
            }
          });
        } else {
          setStats({
            athletes: { total: 0, active: 0 },
            teams: { total: 0, active: 0 },
            schools: { total: 0, active: 0 },
            infrastructures: { total: 0, active: 0 },
            competitions: { total: 0, upcoming: 0 },
            protocols: { total: 0, pending: 0, inProgress: 0, completed: 0 }
          });
        }

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
