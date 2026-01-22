'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

// Tipos
export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1Type: 'CITIZEN' | 'SERVER' | 'SYSTEM';
  participant2Type: 'CITIZEN' | 'SERVER' | 'SYSTEM';
  type?: 'DIRECT' | 'GROUP' | 'SUPPORT';
  status?: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount1?: number;
  unreadCount2?: number;
  totalMessages?: number;
  isBotConversation?: boolean;
  metadata?: {
    botStatus?: 'ACTIVE' | 'PAUSED' | 'HUMAN_TAKEOVER';
    assignedTo?: string;
    citizenName?: string;
    serverName?: string;
    avatar?: string;
  };
  // Campos enriquecidos pelo frontend
  title?: string;
  citizenName?: string;
  serverName?: string;
  unreadCount?: number;
  conversationStatus?: 'bot' | 'human' | 'closed';
  avatar?: string;
  isPinned?: boolean;
  isBot?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'CITIZEN' | 'SERVER' | 'BOT' | 'SYSTEM';
  content: string;
  contentType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'AUDIO';
  attachments?: any[];
  status: 'SENT' | 'DELIVERED' | 'READ';
  sentAt: string;
  readAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
  senderName?: string;
  metadata?: any; // Para suportar dados do bot (options, quickReplies, etc)
}

interface UseConversationsOptions {
  userId: string;
  userType: 'CITIZEN' | 'SERVER';
  apiUrl?: string;
  wsUrl?: string;
  onNewConversation?: (conversation: Conversation) => void;
  onNewMessage?: (message: Message, conversationId: string) => void;
}

/**
 * Hook compartilhado para gerenciar conversas e mensagens
 * Unifica a lógica entre painel cidadão e admin
 */
export function useConversations({
  userId,
  userType,
  apiUrl,
  wsUrl,
  onNewConversation,
  onNewMessage,
}: UseConversationsOptions) {
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Estabilizar URLs usando useMemo
  const MESSAGES_API_URL = useMemo(() =>
    apiUrl || process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api',
    [apiUrl]
  );

  const MESSAGES_WS_URL = useMemo(() =>
    wsUrl || process.env.NEXT_PUBLIC_MESSAGES_WS_URL || 'http://localhost:9001',
    [wsUrl]
  );

  const DIGIURBAN_API_URL = useMemo(() =>
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    []
  );

  /**
   * Enriquecer conversa com informações do participante
   */
  const enrichConversation = useCallback(async (conv: Conversation): Promise<Conversation> => {
    try {
      // Identificar o outro participante (não o usuário atual)
      const isParticipant1 = conv.participant1Id === userId && conv.participant1Type === userType;
      const otherParticipantId = isParticipant1 ? conv.participant2Id : conv.participant1Id;
      const otherParticipantType = isParticipant1 ? conv.participant2Type : conv.participant1Type;

      // Se é bot/sistema
      if (otherParticipantType === 'SYSTEM' || conv.isBotConversation) {
        return {
          ...conv,
          title: 'DigiBot',
          citizenName: 'DigiBot',
          isBot: true,
          isPinned: true,
          avatar: '/bot-avatar.png',
          conversationStatus: conv.metadata?.botStatus === 'PAUSED' || conv.metadata?.botStatus === 'HUMAN_TAKEOVER'
            ? 'human'
            : 'bot',
          unreadCount: isParticipant1 ? (conv.unreadCount1 || 0) : (conv.unreadCount2 || 0),
        };
      }

      // Para outras conversas, usar ID do participante como nome temporário
      // O backend deve retornar os nomes já enriquecidos via metadata
      const participantName = conv.metadata?.citizenName ||
                             conv.metadata?.serverName ||
                             `${otherParticipantType === 'CITIZEN' ? 'Cidadão' : 'Servidor'} ${otherParticipantId.substring(0, 8)}`;

      return {
        ...conv,
        title: participantName,
        citizenName: participantName,
        serverName: participantName,
        avatar: conv.metadata?.avatar,
        isBot: false,
        isPinned: false,
        conversationStatus: conv.status === 'CLOSED' ? 'closed' : 'human',
        unreadCount: isParticipant1 ? (conv.unreadCount1 || 0) : (conv.unreadCount2 || 0),
      };
    } catch (error) {
      console.error('Erro ao enriquecer conversa:', error);
      return {
        ...conv,
        title: 'Conversa',
        unreadCount: 0,
      };
    }
  }, [userId, userType]);

  /**
   * Carregar conversas do backend
   */
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${MESSAGES_API_URL}/conversations`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar conversas');
      }

      const data = await response.json();

      // Enriquecer TODAS as conversas (incluindo bot)
      const enriched = await Promise.all(data.map(enrichConversation));

      // Ordenar: Bot sempre no topo, depois por última mensagem
      const sorted = enriched.sort((a, b) => {
        if (a.isBotConversation && !b.isBotConversation) return -1;
        if (!a.isBotConversation && b.isBotConversation) return 1;

        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

        return dateB - dateA;
      });

      setConversations(sorted);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
      setError('Não foi possível carregar as conversas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [MESSAGES_API_URL, enrichConversation]);

  /**
   * Conectar ao WebSocket
   */
  useEffect(() => {
    if (!userId) return;

    // Prevenir múltiplas conexões
    if (socketRef.current?.connected) {
      console.log('[useConversations] Socket já conectado, reutilizando...');
      return;
    }

    // Limpar socket anterior se existir
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.close();
    }

    const newSocket = io(MESSAGES_WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      reconnectAttemptsRef.current = 0;
      setIsConnected(true);
      console.log('[useConversations] Conectado ao servidor de mensagens', {
        userId,
        userType,
      });
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[useConversations] Desconectado do servidor de mensagens', { reason });
    });

    newSocket.on('connect_error', (error) => {
      reconnectAttemptsRef.current += 1;
      console.error('[useConversations] Erro ao conectar ao WebSocket', {
        error: error.message,
        attempts: reconnectAttemptsRef.current,
      });

      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[useConversations] Máximo de tentativas de reconexão atingido');
        newSocket.close();
        setError('Não foi possível conectar ao servidor de mensagens');
      }
    });

    // Event: Nova mensagem recebida
    newSocket.on('message:new', async (data: { conversationId: string; message: Message }) => {
      console.log('[useConversations] Nova mensagem recebida:', data);

      setConversations(prev => {
        const conversationExists = prev.some(c => c.id === data.conversationId);

        if (!conversationExists) {
          // Conversa não existe localmente
          console.log('[useConversations] Conversa não encontrada localmente, aguardando evento conversation:new');
          return prev;
        }

        // Atualizar preview e timestamp da conversa
        return prev.map(c =>
          c.id === data.conversationId
            ? {
                ...c,
                lastMessagePreview: data.message.content.substring(0, 100),
                lastMessageAt: data.message.sentAt,
                unreadCount: data.message.senderId === userId ? 0 : (c.unreadCount || 0) + 1,
              }
            : c
        ).sort((a, b) => {
          // Re-ordenar: bot sempre no topo
          if (a.isBotConversation && !b.isBotConversation) return -1;
          if (!a.isBotConversation && b.isBotConversation) return 1;

          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

          return dateB - dateA;
        });
      });

      // Callback para componente pai processar mensagem
      if (onNewMessage) {
        onNewMessage(data.message, data.conversationId);
      }

      // Mostrar notificação se mensagem não é do próprio usuário
      if (data.message.senderId !== userId) {
        toast({
          title: 'Nova mensagem',
          description: data.message.content.substring(0, 100),
        });

        // Desktop notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nova mensagem', {
            body: data.message.content.substring(0, 100),
            icon: '/logo.png',
          });
        }
      }
    });

    // Event: Nova conversa criada
    newSocket.on('conversation:new', async (data: { conversation: Conversation }) => {
      console.log('[useConversations] Nova conversa recebida:', data.conversation);

      // Enriquecer a nova conversa
      const enrichedConv = await enrichConversation(data.conversation);

      setConversations(prev => {
        const exists = prev.some(c => c.id === data.conversation.id);
        if (exists) return prev;

        // Adicionar e re-ordenar
        const updated = [enrichedConv, ...prev].sort((a, b) => {
          if (a.isBotConversation && !b.isBotConversation) return -1;
          if (!a.isBotConversation && b.isBotConversation) return 1;

          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

          return dateB - dateA;
        });

        return updated;
      });

      // Entrar na sala da conversa
      newSocket.emit('conversation:join', { conversationId: data.conversation.id });

      // Callback para componente pai
      if (onNewConversation) {
        onNewConversation(enrichedConv);
      }

      toast({
        title: 'Nova conversa',
        description: `Você tem uma nova conversa`,
      });
    });

    // Event: Mensagem lida
    newSocket.on('message:read', (data: { messageId: string; conversationId: string }) => {
      console.log('[useConversations] Mensagem marcada como lida:', data);
      // Frontend pode atualizar UI se necessário
    });

    // Event: Status de digitação
    newSocket.on('typing:start', (data: { conversationId: string; userId: string }) => {
      console.log('[useConversations] Usuário começou a digitar:', data);
    });

    newSocket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
      console.log('[useConversations] Usuário parou de digitar:', data);
    });

    setSocket(newSocket);

    // Solicitar permissão de notificação
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, [userId, userType, MESSAGES_WS_URL, enrichConversation, onNewConversation, onNewMessage, toast]);

  /**
   * Carregar conversas quando conectar
   */
  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  /**
   * Entrar automaticamente nas salas de conversas existentes
   */
  useEffect(() => {
    if (socket && isConnected && conversations.length > 0) {
      conversations.forEach(conv => {
        socket.emit('conversation:join', { conversationId: conv.id });
      });
    }
  }, [socket, isConnected, conversations]);

  /**
   * Enviar mensagem via WebSocket
   */
  const sendMessage = useCallback((conversationId: string, content: string, attachments?: any[]) => {
    if (!socket || !isConnected) {
      toast({
        title: 'Erro',
        description: 'Não conectado ao servidor de mensagens',
        variant: 'destructive',
      });
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise<{ success: boolean; message?: Message; error?: string }>((resolve) => {
      socket.emit(
        'message:send',
        {
          conversationId,
          content,
          attachments,
        },
        (response: any) => {
          if (response?.error) {
            toast({
              title: 'Erro',
              description: 'Não foi possível enviar a mensagem',
              variant: 'destructive',
            });
            resolve({ success: false, error: response.error });
          } else {
            resolve({ success: true, message: response.message });
          }
        }
      );
    });
  }, [socket, isConnected, toast]);

  /**
   * Marcar mensagem como lida
   */
  const markAsRead = useCallback((conversationId: string, messageId: string) => {
    if (socket && isConnected) {
      socket.emit('message:read', {
        conversationId,
        messageId,
      });
    }
  }, [socket, isConnected]);

  /**
   * Criar ou buscar conversa
   */
  const findOrCreateConversation = useCallback(async (
    recipientId: string,
    recipientType: 'CITIZEN' | 'SERVER'
  ): Promise<Conversation | null> => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/conversations/find-or-create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant2Id: recipientId,
          participant2Type: recipientType,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar conversa');
      }

      const conversation = await response.json();

      // Enriquecer conversa
      const enriched = await enrichConversation(conversation);

      // Adicionar à lista se não existir
      setConversations(prev => {
        const exists = prev.some(c => c.id === conversation.id);
        if (exists) return prev;

        return [enriched, ...prev].sort((a, b) => {
          if (a.isBotConversation && !b.isBotConversation) return -1;
          if (!a.isBotConversation && b.isBotConversation) return 1;

          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

          return dateB - dateA;
        });
      });

      // Entrar na sala da conversa
      if (socket) {
        socket.emit('conversation:join', { conversationId: conversation.id });
      }

      return enriched;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a conversa',
        variant: 'destructive',
      });
      return null;
    }
  }, [MESSAGES_API_URL, enrichConversation, socket, toast]);

  return {
    conversations,
    setConversations,
    socket,
    isConnected,
    loading,
    error,
    loadConversations,
    sendMessage,
    markAsRead,
    findOrCreateConversation,
  };
}

export default useConversations;
