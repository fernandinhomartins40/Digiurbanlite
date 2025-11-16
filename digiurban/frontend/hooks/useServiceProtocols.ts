// ============================================================
// USE SERVICE PROTOCOLS HOOK - Buscar protocolos de múltiplos serviços
// ============================================================
// Hook para buscar protocolos agregados de vários serviços SEM_DADOS
// Usado na view "Serviços Gerais" para mostrar todos os protocolos juntos

'use client';

import { useEffect, useState, useCallback } from 'react';

export interface ServiceProtocol {
  id: string;
  protocolNumber: string;
  status: string;
  customData: any;
  createdAt: string;
  updatedAt: string;
  citizenId: string;
  serviceId: string;
  citizen?: {
    id: string;
    name: string;
    cpf: string;
  };
  service: {
    id: string;
    name: string;
    moduleType: string;
    icon: string | null;
  };
}

interface UseServiceProtocolsResult {
  protocols: ServiceProtocol[];
  loading: boolean;
  error: string | null;
  refetch: (filters?: any) => Promise<void>;
  total: number;
}

export function useServiceProtocols(serviceIds: string[]): UseServiceProtocolsResult {
  const [protocols, setProtocols] = useState<ServiceProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProtocols = useCallback(async (filters?: any) => {
    if (serviceIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      // Build query params
      const params = new URLSearchParams({
        serviceIds: serviceIds.join(','),
        ...filters
      });

      const response = await fetch(
        `${backendUrl}/protocols?${params.toString()}`,
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

      if (data.success) {
        setProtocols(data.protocols || []);
        setTotal(data.total || 0);
      } else {
        throw new Error(data.error || 'Erro ao buscar protocolos');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao buscar protocolos dos serviços:', err);
    } finally {
      setLoading(false);
    }
  }, [serviceIds]);

  useEffect(() => {
    fetchProtocols();
  }, [fetchProtocols]);

  return {
    protocols,
    loading,
    error,
    refetch: fetchProtocols,
    total
  };
}
