// ============================================================
// USE NO DATA SERVICES HOOK - Buscar serviços SEM_DADOS
// ============================================================
// Hook para buscar todos os serviços que não capturam dados estruturados (SEM_DADOS)
// Usado na view de "Serviços Gerais" que agrupa múltiplos serviços simples

'use client';

import { useEffect, useState, useCallback } from 'react';

export interface NoDataService {
  id: string;
  name: string;
  description: string | null;
  moduleType: string;
  icon: string | null;
  isActive: boolean;
  department: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
}

interface UseNoDataServicesResult {
  services: NoDataService[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNoDataServices(departmentSlug: string): UseNoDataServicesResult {
  const [services, setServices] = useState<NoDataService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(
        `${backendUrl}/api/citizen/services/departments/${departmentSlug}/no-data`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar serviços');
      }

      setServices(data.services || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao buscar serviços SEM_DADOS:', err);
    } finally {
      setLoading(false);
    }
  }, [departmentSlug]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    refetch: fetchServices
  };
}
