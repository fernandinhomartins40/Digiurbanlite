/**
 * ============================================================================
 * HOOK: useSecretariaServices
 * ============================================================================
 * Hook reutilizável para buscar serviços de qualquer secretaria
 *
 * @param departmentCode - Código da secretaria (ex: 'agricultura', 'saude')
 * @returns { services, loading, error, refetch }
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  moduleType?: string | null;
  moduleEntity?: string | null;
  serviceType: string;
  requiresDocuments: boolean;
  requiredDocuments?: string | null;
  customForm?: any;
  estimatedDays?: number | null;
  priority: number;
  icon?: string | null;
  color?: string | null;
  isActive: boolean;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseSecretariaServicesReturn {
  services: Service[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSecretariaServices(departmentCode: string): UseSecretariaServicesReturn {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!departmentCode) {
      setError('Código da secretaria não fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const path = `/services?departmentCode=${departmentCode.toLowerCase()}`;
      console.log('[useSecretariaServices] Fetching:', apiClient.getUrl(path));

      const response = await apiClient.get(path);

      console.log('[useSecretariaServices] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useSecretariaServices] Error response:', errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useSecretariaServices] Data received:', data);

      if (!data.success) {
        throw new Error(data.message || 'Erro ao carregar serviços');
      }

      setServices(data.data || []);
      console.log('[useSecretariaServices] Services loaded:', data.data?.length || 0);
    } catch (err: any) {
      console.error('[useSecretariaServices] Error:', err);
      setError(err.message || 'Erro ao carregar serviços');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [departmentCode]);

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
