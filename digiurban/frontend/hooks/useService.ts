// ============================================================
// USE SERVICE HOOK - Sistema Híbrido (Runtime + Cache + WebSocket)
// ============================================================
// Hook para buscar definições de serviços dinamicamente com cache e atualizações em tempo real

'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================
export interface ServiceDefinition {
  id: string;
  name: string;
  description: string | null;
  moduleType: string;
  icon: string | null;
  formSchema: any;
  hasScheduling: boolean;
  hasLocation: boolean;
  requiresDocuments: boolean;
  requiresApproval: boolean;
  requiresInspection: boolean;
  allowsCancellation: boolean;
  isActive: boolean;
  department: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
}

interface UseServiceResult {
  service: ServiceDefinition | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  socket: Socket | null;
}

// ============================================================
// HOOK
// ============================================================
export function useService(department: string, module: string): UseServiceResult {
  const [service, setService] = useState<ServiceDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch service from API
  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(
        `${backendUrl}/api/services/${department}/${module}`,
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

      if (!data.success || !data.service) {
        throw new Error(data.error || 'Serviço não encontrado');
      }

      setService(data.service);

      // Log cache status
      if (data.cached) {
        console.log(`✅ Service carregado do cache: ${department}/${module}`);
      } else {
        console.log(`💾 Service carregado do banco: ${department}/${module}`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao buscar service:', err);
    } finally {
      setLoading(false);
    }
  }, [department, module]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Fetch initial data
    fetchService();

    // Setup WebSocket for real-time updates
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    const socketInstance = io(backendUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    // Connection handlers
    socketInstance.on('connect', () => {
      console.log('✅ WebSocket conectado');
      // Join module-specific room
      socketInstance.emit('join:module', { department, module });
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️  Erro ao conectar WebSocket (não crítico):', err.message);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
    });

    // Listen for service updates
    const eventName = `service:updated:${department}:${module}`;

    socketInstance.on(eventName, (data: any) => {
      console.log('🔥 Service atualizado via WebSocket:', data);

      if (data.service) {
        setService(data.service);

        // Show toast notification
        toast.success('Módulo atualizado!', {
          description: 'Novos campos e funcionalidades disponíveis.',
          duration: 5000
        });
      }
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.emit('leave:module', { department, module });
      socketInstance.disconnect();
    };
  }, [department, module, fetchService]);

  return {
    service,
    loading,
    error,
    refetch: fetchService,
    socket
  };
}
