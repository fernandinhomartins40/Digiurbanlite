import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

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

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('🔌 WebSocket connected (useDepartmentStats)');
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected (useDepartmentStats)');
    });
  }

  return socketInstance;
}

export function useDepartmentStats(department: string) {
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/departments/${department}/stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
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

    const handleProtocolCreated = (data: any) => {
      console.log('📝 Protocol created, refreshing stats...');
      fetchStats();
    };

    const handleProtocolUpdated = (data: any) => {
      console.log('✏️ Protocol updated, refreshing stats...');
      fetchStats();
    };

    const handleServiceUpdated = (data: any) => {
      console.log('⚙️ Service updated, refreshing stats...');
      fetchStats();
    };

    socket.on('protocol.created', handleProtocolCreated);
    socket.on('protocol.updated', handleProtocolUpdated);
    socket.on('service.updated', handleServiceUpdated);

    return () => {
      socket.off('protocol.created', handleProtocolCreated);
      socket.off('protocol.updated', handleProtocolUpdated);
      socket.off('service.updated', handleServiceUpdated);
    };
  }, [department]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
