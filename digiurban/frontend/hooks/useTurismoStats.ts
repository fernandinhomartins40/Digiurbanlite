'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface TurismoStats {
  department: {
    id: string;
    name: string;
    code: string;
  };
  modules: {
    touristAttractions: number;
    tourismEvents: number;
    tourismEstablishments: number;
  };
  protocolsByModule: Record<string, Record<string, number>>;
  totals: {
    totalProtocols: number;
    totalModuleRecords: number;
  };
}

interface DashboardStats {
  eventsThisMonth: number;
  totalAttractions: number;
  totalEstablishments: number;
  pendingProtocols: number;
}

export function useTurismoStats() {
  const [stats, setStats] = useState<TurismoStats | null>(null);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar todas as estatísticas em paralelo
        const [statsResponse, dashboardResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/turismo/stats`, { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/turismo/dashboard`, { headers })
        ]);

        if (statsResponse.data.success) {
          setStats(statsResponse.data.data);
        }

        if (dashboardResponse.data.success) {
          setDashboard(dashboardResponse.data.data);
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

  return { stats, dashboard, loading, error };
}
