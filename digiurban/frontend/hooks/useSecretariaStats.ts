/**
 * ============================================================================
 * HOOK: useSecretariaStats
 * ============================================================================
 * Hook reutilizável para buscar estatísticas de qualquer secretaria
 *
 * @param departmentCode - Código da secretaria (ex: 'agricultura', 'saude')
 * @returns { stats, loading, error, refetch }
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface UseSecretariaStatsReturn {
  stats: any;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSecretariaStats(departmentCode: string): UseSecretariaStatsReturn {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!departmentCode) {
      setError('Código da secretaria não fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const path = `/admin/secretarias/${departmentCode.toLowerCase()}/stats`;
      console.log('[useSecretariaStats] Fetching:', apiClient.getUrl(path));

      const response = await apiClient.get(path);

      console.log('[useSecretariaStats] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useSecretariaStats] Error response:', errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useSecretariaStats] Data received:', data);

      if (!data.success) {
        throw new Error(data.message || 'Erro ao carregar estatísticas');
      }

      setStats(data.data || {});
      console.log('[useSecretariaStats] Stats loaded:', data.data);
    } catch (err: any) {
      console.error('[useSecretariaStats] Error:', err);
      setError(err.message || 'Erro ao carregar estatísticas');
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [departmentCode]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}
