'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

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

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar estatísticas de obras públicas
        const statsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/obras-publicas/stats`,
          { headers }
        );

        const statsData = statsRes.data;

        if (statsData) {
          setStats({
            projects: {
              total: statsData.projects?.total || 0,
              inProgress: statsData.projects?.ongoing || 0
            },
            repairs: {
              total: statsData.requests?.total || 0,
              completed: 0
            },
            inspections: {
              total: 0,
              pending: statsData.requests?.pending || 0
            },
            protocols: { total: 0, pending: 0, inProgress: 0, completed: 0 }
          });
          setLoading(false);
          return;
        }

        // Buscar protocolos
        const protocolsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/protocolos?department=obras_publicas`,
          { headers }
        );

        const protocols = protocolsRes.data?.data || [];

        setStats({
          projects: {
            total: 0,
            inProgress: 0
          },
          repairs: {
            total: 0,
            completed: 0
          },
          inspections: {
            total: 0,
            pending: 0
          },
          protocols: {
            total: protocols.length,
            pending: protocols.filter((p: any) => p.status === 'PENDENCIA').length,
            inProgress: protocols.filter((p: any) => p.status === 'PROGRESSO').length,
            completed: protocols.filter((p: any) => p.status === 'CONCLUIDO').length
          }
        });

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
