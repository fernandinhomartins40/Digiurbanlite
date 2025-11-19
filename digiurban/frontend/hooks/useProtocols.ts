// ============================================================
// USE PROTOCOLS HOOK - Buscar protocolos de um serviço
// ============================================================

'use client';

import { useEffect, useState, useCallback } from 'react';

export interface Protocol {
  id: string;
  protocolNumber: string;
  number?: string;
  title?: string;
  status: string;
  customData: any;
  createdAt: string;
  updatedAt: string;
  citizenId: string;
  serviceId: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  department?: string;
  documents?: any[];
  citizen?: {
    id: string;
    name: string;
    cpf: string;
  };
}

interface UseProtocolsResult {
  protocols: Protocol[];
  loading: boolean;
  error: string | null;
  refetch: (filters?: any) => Promise<void>;
  total: number;
}

export function useProtocols(serviceId?: string): UseProtocolsResult {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProtocols = useCallback(async (filters?: any) => {
    if (!serviceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      // Build query params
      const params = new URLSearchParams({
        serviceId,
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
      console.error('❌ Erro ao buscar protocols:', err);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

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
