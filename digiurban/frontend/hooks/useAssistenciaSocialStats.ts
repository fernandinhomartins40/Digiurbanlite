'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface AssistenciaSocialStats {
  families: {
    total: number;
    vulnerable: number;
    active: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  attendances: {
    total: number;
    thisMonth: number;
    variation: number;
  };
  beneficiaries: {
    total: number;
    active: number;
  };
  units: {
    total: number;
    cras: number;
    creas: number;
  };
  protocols: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  benefits?: {
    total: number;
    pending: number;
    approved: number;
    denied: number;
  };
  deliveries?: {
    total: number;
    pending: number;
    inTransit: number;
    delivered: number;
  };
  visits?: {
    total: number;
    scheduled: number;
    completed: number;
    canceled: number;
  };
  programs?: {
    total: number;
    active: number;
  };
  moduleStats?: Record<string, {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }>;
}

export function useAssistenciaSocialStats() {
  const [stats, setStats] = useState<AssistenciaSocialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar estatísticas consolidadas
        const statsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/secretarias/assistencia-social/stats`,
          { headers }
        );

        if (statsResponse.data.success) {
          const data = statsResponse.data.data;

          // Consolidar dados
          const consolidatedStats: AssistenciaSocialStats = {
            families: data.families || {
              total: 0,
              vulnerable: 0,
              active: 0,
              highRisk: 0,
              mediumRisk: 0,
              lowRisk: 0
            },
            attendances: data.attendances || {
              total: 0,
              thisMonth: 0,
              variation: 0
            },
            beneficiaries: data.beneficiaries || {
              total: 0,
              active: 0
            },
            units: data.units || {
              total: 0,
              cras: 0,
              creas: 0
            },
            protocols: data.protocols || {
              total: 0,
              pending: 0,
              inProgress: 0,
              completed: 0
            },
            benefits: data.benefits,
            deliveries: data.deliveries,
            visits: data.visits,
            programs: data.programs,
            moduleStats: data.moduleStats
          };

          setStats(consolidatedStats);
        }

        setError(null);
      } catch (err: any) {
        console.error('Error fetching assistencia social stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
