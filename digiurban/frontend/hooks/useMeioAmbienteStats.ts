'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface MeioAmbienteStats {
  licencasAmbientais: {
    ativas: number;
    total: number;
  };
  fiscalizacoes: {
    mesAtual: number;
    total: number;
  };
  areasProtegidas: {
    hectares: number;
    quantidade: number;
  };
  protocolosPendentes: number;
}

export function useMeioAmbienteStats() {
  const [stats, setStats] = useState<MeioAmbienteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar estatísticas do meio ambiente
        const statsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/meio-ambiente/stats`,
          { headers }
        );

        const statsData = statsRes.data;

        if (statsData) {
          setStats({
            licencasAmbientais: {
              ativas: statsData.licenses?.approved || 0,
              total: statsData.licenses?.total || 0
            },
            fiscalizacoes: {
              mesAtual: 0,
              total: 0
            },
            areasProtegidas: {
              hectares: 0,
              quantidade: statsData.parks?.total || 0
            },
            protocolosPendentes: statsData.licenses?.pending || 0
          });
          setLoading(false);
          return;
        }

        // Buscar dados das rotas
        const [protocolsRes, licencasRes, denunciasRes] = await Promise.all([
          axios.get(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/protocolos?department=meio_ambiente`,
            { headers }
          ),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/secretarias/meio-ambiente/licencas`,
            { headers }
          ),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/secretarias/meio-ambiente/denuncias`,
            { headers }
          )
        ]);

        const protocols = protocolsRes.data?.data || [];
        const licencas = licencasRes.data?.data || [];
        const denuncias = denunciasRes.data?.data || [];

        // Calcular fiscalizações do mês atual
        const mesAtual = new Date().getMonth();
        const fiscalizacoesMesAtual = denuncias.filter((d: any) => {
          const createdAt = new Date(d.createdAt);
          return createdAt.getMonth() === mesAtual;
        }).length;

        setStats({
          licencasAmbientais: {
            ativas: licencas.filter((l: any) => l.status === 'ATIVA' || l.status === 'APROVADA').length,
            total: licencas.length
          },
          fiscalizacoes: {
            mesAtual: fiscalizacoesMesAtual,
            total: denuncias.length
          },
          areasProtegidas: {
            hectares: 0, // Será implementado quando houver dados reais
            quantidade: 0
          },
          protocolosPendentes: protocols.filter((p: any) => p.status === 'PENDENCIA').length
        });

        setError(null);
      } catch (err: any) {
        console.error('Error fetching meio ambiente stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
