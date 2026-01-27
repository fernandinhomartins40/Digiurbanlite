import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { getFullApiUrl } from '@/lib/api-config';
import { toast } from 'sonner';

// ============================================================================
// INTERFACES
// ============================================================================

interface NotificationEvent {
  type: string;
  data: any;
  timestamp: string;
}

interface NotificationStats {
  pendingSuggestions: number;
  pendingProtocols: number;
  pendingCitizens: number;
}

interface UseNotificationsResult {
  connected: boolean;
  stats: NotificationStats | null;
  reconnect: () => void;
  disconnect: () => void;
}

// ============================================================================
// HOOK: useNotifications
// ============================================================================

/**
 * Hook para receber notificações em tempo real via Server-Sent Events (SSE)
 */
export function useNotifications(): UseNotificationsResult {
  const { user } = useAdminAuth();
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 segundos

  // ========================================================================
  // FUNÇÃO: Conectar ao SSE
  // ========================================================================
  const connect = useCallback(() => {
    if (!user) {
      console.log('[SSE] Usuário não autenticado, pulando conexão');
      return;
    }

    if (eventSourceRef.current) {
      console.log('[SSE] Já existe uma conexão ativa');
      return;
    }

    try {
      const url = getFullApiUrl('/notifications/stream');
      console.log('[SSE] Conectando a:', url);

      const eventSource = new EventSource(url, {
        withCredentials: true, // Enviar cookies de autenticação
      });

      // Handler: Conexão aberta
      eventSource.onopen = () => {
        console.log('[SSE] ✅ Conexão estabelecida');
        setConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      // Handler: Mensagens
      eventSource.onmessage = (event) => {
        try {
          const notification: NotificationEvent = JSON.parse(event.data);
          console.log('[SSE] 📨 Notificação recebida:', notification);

          handleNotification(notification);
        } catch (error) {
          console.error('[SSE] Erro ao parsear notificação:', error);
        }
      };

      // Handler: Erros
      eventSource.onerror = (error) => {
        console.error('[SSE] ❌ Erro na conexão:', error);
        setConnected(false);

        // Fechar conexão atual
        eventSource.close();
        eventSourceRef.current = null;

        // Tentar reconectar
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(
            `[SSE] Tentando reconectar (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        } else {
          console.error('[SSE] Máximo de tentativas de reconexão atingido');
          toast.error('Conexão com servidor de notificações perdida');
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('[SSE] Erro ao criar EventSource:', error);
      setConnected(false);
    }
  }, [user]);

  // ========================================================================
  // FUNÇÃO: Processar notificação recebida
  // ========================================================================
  const handleNotification = (notification: NotificationEvent) => {
    switch (notification.type) {
      case 'CONNECTED':
        console.log('[SSE] Bem-vindo:', notification.data.message);
        break;

      case 'STATS_UPDATE':
        console.log('[SSE] Estatísticas atualizadas:', notification.data);
        setStats({
          pendingSuggestions: notification.data.pendingSuggestions,
          pendingProtocols: notification.data.pendingProtocols,
          pendingCitizens: notification.data.pendingCitizens,
        });
        break;

      case 'NEW_CATEGORY_SUGGESTION':
        console.log('[SSE] Nova sugestão de categoria:', notification.data);
        toast.info(notification.data.message, {
          description: `Confiança: ${notification.data.confidence}%`,
          action: {
            label: 'Ver',
            onClick: () => {
              window.location.href = '/admin/categorias/sugestoes';
            },
          },
        });
        break;

      case 'SUGGESTION_APPROVED':
        console.log('[SSE] Sugestão aprovada:', notification.data);
        toast.success(notification.data.message);
        break;

      case 'TEST':
        console.log('[SSE] Notificação de teste:', notification.data);
        toast.info('Notificação de teste recebida', {
          description: notification.data.message,
        });
        break;

      default:
        console.log('[SSE] Tipo de notificação desconhecido:', notification.type);
    }
  };

  // ========================================================================
  // FUNÇÃO: Desconectar
  // ========================================================================
  const disconnect = useCallback(() => {
    console.log('[SSE] Desconectando...');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnected(false);
  }, []);

  // ========================================================================
  // FUNÇÃO: Reconectar manualmente
  // ========================================================================
  const reconnect = useCallback(() => {
    console.log('[SSE] Reconectando manualmente...');
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(() => {
      connect();
    }, 500);
  }, [disconnect, connect]);

  // ========================================================================
  // EFFECT: Conectar ao montar e desconectar ao desmontar
  // ========================================================================
  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // ========================================================================
  // EFFECT: Cleanup em caso de mudança de usuário
  // ========================================================================
  useEffect(() => {
    if (!user && connected) {
      disconnect();
    }
  }, [user, connected, disconnect]);

  // ========================================================================
  // RETURN
  // ========================================================================
  return {
    connected,
    stats,
    reconnect,
    disconnect,
  };
}
