'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface PlanejamentoUrbanoStats {
  permits: {
    total: number;
    thisMonth: number;
  };
  inAnalysis: {
    total: number;
  };
  approved: {
    total: number;
    thisMonth: number;
  };
  protocols: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

export function usePlanejamentoUrbanoStats() {
  const [stats, setStats] = useState<PlanejamentoUrbanoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar departamento de planejamento urbano
        const deptResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/departments`,
          { headers }
        );

        const planejamentoDept = deptResponse.data?.data?.find(
          (d: any) => d.code === 'PLANEJAMENTO_URBANO'
        );

        if (!planejamentoDept) {
          setStats({
            permits: { total: 0, thisMonth: 0 },
            inAnalysis: { total: 0 },
            approved: { total: 0, thisMonth: 0 },
            protocols: { total: 0, pending: 0, inProgress: 0, completed: 0 }
          });
          setLoading(false);
          return;
        }

        // Buscar protocolos
        const protocolsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/protocolos?department=planejamento_urbano`,
          { headers }
        );

        const protocols = protocolsRes.data?.data || [];

        // Buscar dados dos módulos
        const [alvarasRes, certidoesRes, numeracaoRes] = await Promise.all([
          axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/planejamento-urbano/alvaras`,
            { headers }
          ).catch(() => ({ data: { data: [] } })),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/planejamento-urbano/certidoes`,
            { headers }
          ).catch(() => ({ data: { data: [] } })),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/planejamento-urbano/numeracao`,
            { headers }
          ).catch(() => ({ data: { data: [] } })),
        ]);

        const alvaras = alvarasRes.data?.data || [];

        // Calcular estatísticas
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const alvarasThisMonth = alvaras.filter((a: any) =>
          new Date(a.createdAt) >= thisMonthStart
        ).length;

        const inAnalysis = alvaras.filter((a: any) =>
          a.status === 'PENDENTE' || a.status === 'PROGRESSO'
        ).length;

        const approvedThisMonth = alvaras.filter((a: any) =>
          a.status === 'APROVADO' && new Date(a.updatedAt) >= thisMonthStart
        ).length;

        setStats({
          permits: {
            total: alvaras.length,
            thisMonth: alvarasThisMonth
          },
          inAnalysis: {
            total: inAnalysis
          },
          approved: {
            total: alvaras.filter((a: any) => a.status === 'APROVADO').length,
            thisMonth: approvedThisMonth
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
        console.error('Error fetching planejamento urbano stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
