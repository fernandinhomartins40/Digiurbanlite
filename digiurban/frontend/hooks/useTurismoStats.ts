'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface TurismoStats {
  establishments: {
    total: number;
    active: number;
  };
  guides: {
    total: number;
    active: number;
  };
  attractions: {
    total: number;
    visitors: number;
  };
  events: {
    total: number;
    upcoming: number;
  };
}

export function useTurismoStats() {
  const [stats, setStats] = useState<TurismoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const statsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/turismo/stats`,
          { headers }
        );

        const statsData = statsRes.data;

        if (statsData) {
          setStats({
            establishments: {
              total: statsData.establishments?.total || 0,
              active: statsData.establishments?.active || 0
            },
            guides: {
              total: statsData.guides?.total || 0,
              active: statsData.guides?.active || 0
            },
            attractions: {
              total: statsData.attractions?.total || 0,
              visitors: statsData.attractions?.visitors || 0
            },
            events: {
              total: statsData.events?.total || 0,
              upcoming: statsData.events?.upcoming || 0
            }
          });
        }

        setError(null);
      } catch (err: any) {
        console.error('Error fetching turismo stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
