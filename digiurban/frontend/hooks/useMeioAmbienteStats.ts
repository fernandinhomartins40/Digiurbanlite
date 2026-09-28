'use client';

import { useState, useEffect } from 'react';
import { fetchSecretariaProtocolStats } from '@/lib/secretaria-protocol-stats';

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

        // Protocolos reais da secretaria (antes: endpoints inexistentes -> zeros).
        // Indicadores de dominio sem fonte de dados no backend seguem zerados.
        const protocols = await fetchSecretariaProtocolStats('meio-ambiente');

        setStats({
          licencasAmbientais: { ativas: 0, total: 0 },
          fiscalizacoes: { mesAtual: 0, total: 0 },
          areasProtegidas: { hectares: 0, quantidade: 0 },
          protocolosPendentes: protocols.pending
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
