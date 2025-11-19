'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

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

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const statsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/servicos-publicos/stats`,
          { headers }
        );

        const statsData = statsResponse.data;

        if (statsData) {
          setStats({
            publicServiceAttendances: { total: 0 },
            streetLighting: { total: 0 },
            urbanCleanings: { total: 0 },
            specialCollections: { total: statsData.collectionRoutes?.total || 0 },
            weedingRequests: { total: 0 },
            drainageRequests: { total: 0 },
            treePruningRequests: { total: statsData.pruningRequests?.total || 0 },
            serviceTeams: { total: 0 },
            publicServiceRequests: { total: statsData.maintenanceRequests?.total || 0 },
            cleaningSchedules: { total: 0 },
            teamSchedules: { total: 0 },
            protocols: { total: 0, pending: 0, inProgress: 0, completed: 0 },
            moduleStats: {}
          });
        }

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
