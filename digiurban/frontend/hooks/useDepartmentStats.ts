import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket-manager';

interface DepartmentStats {
  department: string;
  protocols: {
    total: number;
    pending: number;
    approved: number;
    inProgress: number;
  };
  services: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    serviceType: string;
    moduleType: string | null;
    hasScheduling: boolean;
    hasLocation: boolean;
    requiresDocuments: boolean;
    formSchema: any;
    stats: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      inProgress: number;
    };
  }>;
}

export function useDepartmentStats(department: string) {
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      // Busca o token do localStorage (admin) ou sessionStorage (citizen)
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('token') || sessionStorage.getItem('token')
        : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/departments/${department}/stats`, {
        credentials: 'include', // Envia cookies httpOnly automaticamente
        headers,
      });

      if (!res.ok) {
        throw new Error(`Erro ao buscar stats: ${res.status}`);
      }

      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Erro ao buscar stats do departamento:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!department) return;

    fetchStats();

    // ✅ WebSocket: atualiza stats quando protocolo muda
    const socket = getSocket();

    const handleProtocolUpdated = (data: any) => {
      console.log('📝 Protocol updated, refreshing stats...', data);
      fetchStats();
    };

    const handleServiceUpdated = (data: any) => {
      console.log('⚙️ Service updated, refreshing stats...', data);
      fetchStats();
    };

    // Escuta eventos genéricos (formato antigo - compatibilidade)
    socket.on('protocol.created', handleProtocolUpdated);
    socket.on('protocol.updated', handleProtocolUpdated);
    socket.on('service.updated', handleServiceUpdated);

    // Escuta eventos específicos do departamento (formato novo)
    const protocolEventName = `protocol:updated:${department}`;
    const serviceEventName = `service:updated:${department}`;

    socket.on(protocolEventName, handleProtocolUpdated);
    socket.on(serviceEventName, handleServiceUpdated);

    return () => {
      // Cleanup: remove todos os listeners
      socket.off('protocol.created', handleProtocolUpdated);
      socket.off('protocol.updated', handleProtocolUpdated);
      socket.off('service.updated', handleServiceUpdated);
      socket.off(protocolEventName, handleProtocolUpdated);
      socket.off(serviceEventName, handleServiceUpdated);
    };
  }, [department]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
