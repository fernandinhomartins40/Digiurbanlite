/**
 * Hook para gerenciar conversas no painel admin
 * Integração completa com sistema de handover bot→humano
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const MESSAGES_API_URL = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001';

export interface Conversation {
  id: string;
  participant1Id: string;
  participant1Type: string;
  participant2Id: string;
  participant2Type: string;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  totalMessages: number;
  unreadCount1: number;
  unreadCount2: number;
  status: string;
  isBotConversation: boolean;
  protocolId: string | null;
  departmentId: string | null;
  metadata: any;
  activeFlowExecution?: {
    id: string;
    isPaused: boolean;
    pausedAt: Date | null;
    pausedBy: string | null;
    pauseReason: string | null;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  content: string;
  contentType: string;
  sentAt: Date;
  readAt: Date | null;
  metadata: any;
  isBotMessage?: boolean;
  botInteractionType?: string;
}

export interface HandoverQueueItem {
  conversationId: string;
  citizenId: string;
  citizenName: string;
  citizenEmail?: string;
  citizenPhone?: string;
  lastMessage: string | null;
  pausedAt: Date | null;
  pausedBy: string | null;
  pauseReason: string | null;
  waitTime: number; // segundos
  departmentId: string | null;
  protocolId: string | null;
}

export function useAdminConversations(userId: string, departmentId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [handoverQueue, setHandoverQueue] = useState<HandoverQueueItem[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar áudio de notificação
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Conectar ao Messages Server WebSocket
  useEffect(() => {
    // Buscar token admin
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('digiurban_admin_token='))
      ?.split('=')[1];

    if (!token) {
      console.error('[useAdminConversations] Token admin não encontrado');
      return;
    }

    const socket = io(MESSAGES_API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[useAdminConversations] Conectado ao Messages Server');
      setConnected(true);

      // Entrar na sala do usuário
      socket.emit('join:conversation', { userId, userType: 'SERVER' });
    });

    socket.on('disconnect', () => {
      console.log('[useAdminConversations] Desconectado do Messages Server');
      setConnected(false);
    });

    // ✅ NOVO: Escutar evento de nova conversa na fila
    socket.on('handover:new', (data: any) => {
      console.log('[useAdminConversations] Nova conversa na fila:', data);

      // Tocar som de notificação
      audioRef.current?.play().catch((err) => console.warn('Erro ao tocar som:', err));

      // Mostrar toast
      toast.info(`Nova conversa aguardando atendimento`, {
        description: `${data.citizenName} - ${data.lastMessage}`,
        duration: 10000,
        action: {
          label: 'Atender',
          onClick: async () => {
            await takeoverConversation(data.conversationId);
          },
        },
      });

      // Atualizar fila
      fetchHandoverQueue();
    });

    // ✅ NOVO: Escutar takeover de outras pessoas
    socket.on('handover:takeover', (data: any) => {
      console.log('[useAdminConversations] Conversa assumida:', data);

      // Remover da fila
      setHandoverQueue((prev) => prev.filter((item) => item.conversationId !== data.conversationId));
    });

    // Escutar novas mensagens
    socket.on('message:new', (data: any) => {
      console.log('[useAdminConversations] Nova mensagem:', data);

      if (data.conversationId) {
        setMessages((prev) => ({
          ...prev,
          [data.conversationId]: [...(prev[data.conversationId] || []), data.message],
        }));

        // Atualizar preview da conversa
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === data.conversationId
              ? {
                  ...conv,
                  lastMessageAt: data.message.sentAt,
                  lastMessagePreview: data.message.content,
                  totalMessages: conv.totalMessages + 1,
                }
              : conv
          )
        );
      }
    });

    // Escutar typing
    socket.on('typing:start', (data: any) => {
      console.log('[useAdminConversations] Typing:', data);
      // TODO: Implementar indicador visual
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // Buscar conversas do servidor
  const fetchConversations = useCallback(async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('digiurban_admin_token='))
        ?.split('=')[1];

      const response = await fetch(`${MESSAGES_API_URL}/api/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar conversas');

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('[useAdminConversations] Erro ao buscar conversas:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar fila de handover
  const fetchHandoverQueue = useCallback(async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('digiurban_admin_token='))
        ?.split('=')[1];

      const url = departmentId
        ? `${MESSAGES_API_URL}/api/handover/queue?departmentId=${departmentId}`
        : `${MESSAGES_API_URL}/api/handover/queue`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar fila de handover');

      const data = await response.json();
      setHandoverQueue(data.queue || []);
    } catch (error) {
      console.error('[useAdminConversations] Erro ao buscar fila:', error);
    }
  }, [departmentId]);

  // Buscar mensagens de uma conversa
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('digiurban_admin_token='))
        ?.split('=')[1];

      const response = await fetch(`${MESSAGES_API_URL}/api/conversations/${conversationId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar mensagens');

      const data = await response.json();
      setMessages((prev) => ({
        ...prev,
        [conversationId]: data.messages || [],
      }));
    } catch (error) {
      console.error('[useAdminConversations] Erro ao buscar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    }
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('digiurban_admin_token='))
        ?.split('=')[1];

      const response = await fetch(`${MESSAGES_API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          content,
          contentType: 'TEXT',
        }),
      });

      if (!response.ok) throw new Error('Erro ao enviar mensagem');

      const data = await response.json();

      // Adicionar mensagem localmente (otimista)
      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), data.message],
      }));

      return data.message;
    } catch (error) {
      console.error('[useAdminConversations] Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      throw error;
    }
  }, []);

  // ✅ NOVO: Assumir conversa (takeover)
  const takeoverConversation = useCallback(async (conversationId: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('digiurban_admin_token='))
        ?.split('=')[1];

      const response = await fetch(`${MESSAGES_API_URL}/api/handover/takeover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) throw new Error('Erro ao assumir conversa');

      const data = await response.json();

      toast.success('Conversa assumida com sucesso!');

      // Remover da fila
      setHandoverQueue((prev) => prev.filter((item) => item.conversationId !== conversationId));

      // Atualizar lista de conversas
      fetchConversations();

      return data;
    } catch (error) {
      console.error('[useAdminConversations] Erro ao assumir conversa:', error);
      toast.error('Erro ao assumir conversa');
      throw error;
    }
  }, [fetchConversations]);

  // ✅ NOVO: Pausar bot
  const pauseBot = useCallback(async (conversationId: string, reason?: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('digiurban_admin_token='))
        ?.split('=')[1];

      const response = await fetch(`${MESSAGES_API_URL}/api/bot-flow/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) throw new Error('Erro ao pausar bot');

      toast.success('Bot pausado');

      // Atualizar conversa
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                metadata: {
                  ...conv.metadata,
                  botStatus: 'HUMAN_TAKEOVER',
                },
              }
            : conv
        )
      );
    } catch (error) {
      console.error('[useAdminConversations] Erro ao pausar bot:', error);
      toast.error('Erro ao pausar bot');
      throw error;
    }
  }, []);

  // ✅ NOVO: Retomar bot
  const resumeBot = useCallback(async (conversationId: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('digiurban_admin_token='))
        ?.split('=')[1];

      const response = await fetch(`${MESSAGES_API_URL}/api/bot-flow/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) throw new Error('Erro ao retomar bot');

      toast.success('Bot retomado');

      // Atualizar conversa
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                metadata: {
                  ...conv.metadata,
                  botStatus: 'ACTIVE',
                },
              }
            : conv
        )
      );
    } catch (error) {
      console.error('[useAdminConversations] Erro ao retomar bot:', error);
      toast.error('Erro ao retomar bot');
      throw error;
    }
  }, []);

  // Auto-refresh da fila a cada 30s
  useEffect(() => {
    fetchConversations();
    fetchHandoverQueue();

    const interval = setInterval(() => {
      fetchHandoverQueue();
    }, 30000); // 30s

    return () => clearInterval(interval);
  }, [fetchConversations, fetchHandoverQueue]);

  return {
    conversations,
    handoverQueue,
    messages,
    loading,
    connected,
    fetchConversations,
    fetchHandoverQueue,
    fetchMessages,
    sendMessage,
    takeoverConversation,
    pauseBot,
    resumeBot,
  };
}
