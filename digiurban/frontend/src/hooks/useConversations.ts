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
  // ✅ Campos queryable do bot
  isBotMessage?: boolean;
  botInteractionType?: string;
  botSelectedOption?: string;
  botStructuredData?: any;
  botFlowNodeId?: string;
}

// ✅ NOVO: Tipo para item da fila de handover
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

interface UseConversationsOptions {
  userId: string;
  userType: 'CITIZEN' | 'SERVER';
  apiUrl?: string;
  wsUrl?: string;
  departmentId?: string; // ✅ NOVO: Para filtrar fila de handover por departamento
  onNewConversation?: (conversation: Conversation) => void;
  onNewMessage?: (message: Message, conversationId: string) => void;
  onHandoverNew?: (handoverItem: HandoverQueueItem) => void; // ✅ NOVO
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
  departmentId,
  onNewConversation,
  onNewMessage,
  onHandoverNew,
}: UseConversationsOptions) {
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [handoverQueue, setHandoverQueue] = useState<HandoverQueueItem[]>([]); // ✅ NOVO
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const botEnsureAttemptedRef = useRef(false);
  const conversationRefreshInFlightRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null); // ✅ NOVO: Áudio de notificação
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Refs para callbacks e valores para evitar recriação do socket
  const onNewMessageRef = useRef(onNewMessage);
  const onNewConversationRef = useRef(onNewConversation);
  const onHandoverNewRef = useRef(onHandoverNew); // ✅ NOVO
  const userIdRef = useRef(userId);
  const userTypeRef = useRef(userType);
  const departmentIdRef = useRef(departmentId); // ✅ NOVO

  // ✅ NOVO: Inicializar áudio de notificação
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Atualizar refs quando valores mudarem
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onNewConversationRef.current = onNewConversation;
  }, [onNewConversation]);

  useEffect(() => {
    onHandoverNewRef.current = onHandoverNew; // ✅ NOVO
  }, [onHandoverNew]);

  useEffect(() => {
    userIdRef.current = userId;
    userTypeRef.current = userType;
    departmentIdRef.current = departmentId; // ✅ NOVO
    processedMessageIdsRef.current.clear();
  }, [userId, userType, departmentId]);

  // Estabilizar URLs usando useMemo
  const MESSAGES_API_URL = useMemo(() =>
    apiUrl || process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api',
    [apiUrl]
  );

  const normalizeSocketBaseUrl = (value: string) => {
    const raw = String(value || '').trim();
    if (!raw) return raw;

    // Socket.IO client espera http(s) como base. wss:// costuma quebrar em alguns cenários.
    if (raw.startsWith('wss://')) return `https://${raw.slice('wss://'.length)}`;
    if (raw.startsWith('ws://')) return `http://${raw.slice('ws://'.length)}`;

    return raw;
  };

  const MESSAGES_WS_URL = useMemo(() => {
    const raw =
      wsUrl ||
      process.env.NEXT_PUBLIC_MESSAGES_WS_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9001');

    return normalizeSocketBaseUrl(raw);
  }, [wsUrl]);

  const ensureBotConversation = useCallback(async () => {
    if (userTypeRef.current !== 'CITIZEN') {
      return false;
    }

    try {
      // Iniciar fluxo sem conversationId - o backend cria a conversa automaticamente
      const response = await fetch(`${MESSAGES_API_URL}/bot-flow/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowName: 'menu_principal' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[useConversations] Erro ao criar conversa do bot:', response.status, errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[useConversations] Erro de rede ao criar conversa do bot:', error);
      return false;
    }
  }, [MESSAGES_API_URL]);

  /**
   * Enriquecer conversa com informações do participante
   */
  const enrichConversation = useCallback(async (conv: Conversation): Promise<Conversation> => {
    try {
      // Usar refs para evitar dependências
      const currentUserId = userIdRef.current;
      const currentUserType = userTypeRef.current;

      // Identificar o outro participante (não o usuário atual)
      const isParticipant1 = conv.participant1Id === currentUserId && conv.participant1Type === currentUserType;
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

      // Identificar o nome correto do OUTRO participante
      // Usar citizen1Name/citizen2Name e server1Name/server2Name específicos,
      // pois citizenName genérico sempre pega o participant1 (que é o usuário logado)
      let participantName: string;
      const meta = conv.metadata as any;

      if (otherParticipantType === 'CITIZEN') {
        // O outro participante é cidadão — qual posição ele ocupa?
        const otherName = isParticipant1
          ? (meta?.citizen2Name || meta?.citizenName)   // eu sou p1, outro é p2
          : (meta?.citizen1Name || meta?.citizenName);   // eu sou p2, outro é p1
        participantName = otherName || `Cidadão ${otherParticipantId.substring(0, 8)}`;
      } else if (otherParticipantType === 'SERVER') {
        const otherName = isParticipant1
          ? (meta?.server2Name || meta?.serverName)
          : (meta?.server1Name || meta?.serverName);
        participantName = otherName || `Servidor ${otherParticipantId.substring(0, 8)}`;
      } else {
        participantName = `${otherParticipantType} ${otherParticipantId.substring(0, 8)}`;
      }

      // Avatar do outro participante (não do logado)
      const otherAvatar = isParticipant1
        ? (meta?.citizen2Avatar || meta?.avatar)
        : (meta?.citizen1Avatar || meta?.avatar);

      return {
        ...conv,
        title: participantName,
        citizenName: participantName,
        serverName: participantName,
        avatar: otherAvatar,
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
  }, []); // Sem dependências - usa refs

  /**
   * ✅ NOVO: Buscar fila de handover (bot→humano aguardando atendimento)
   */
  const fetchHandoverQueue = useCallback(async () => {
    // Só buscar se for usuário SERVER
    if (userTypeRef.current !== 'SERVER') {
      return;
    }

    try {
      const url = departmentIdRef.current
        ? `${MESSAGES_API_URL}/handover/queue?departmentId=${departmentIdRef.current}`
        : `${MESSAGES_API_URL}/handover/queue`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar fila de handover');
      }

      const data = await response.json();
      setHandoverQueue(data.queue || []);
    } catch (error) {
      console.error('[useConversations] Erro ao buscar fila de handover:', error);
    }
  }, [MESSAGES_API_URL]);

  /**
   * ✅ NOVO: Assumir conversa (takeover)
   */
  const takeoverConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/handover/takeover`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao assumir conversa');
      }

      const data = await response.json();

      toast({
        title: 'Conversa assumida',
        description: 'Você assumiu o atendimento desta conversa.',
      });

      // Remover da fila
      setHandoverQueue(prev => prev.filter(item => item.conversationId !== conversationId));

      // Recarregar conversas para atualizar status
      const sorted = await fetchConversations();
      setConversations(sorted);

      return data;
    } catch (error) {
      console.error('[useConversations] Erro ao assumir conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível assumir a conversa',
        variant: 'destructive',
      });
      throw error;
    }
  }, [MESSAGES_API_URL, toast]);

  /**
   * ✅ NOVO: Pausar bot
   */
  const pauseBot = useCallback(async (conversationId: string, reason?: string) => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/bot-flow/pause`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, reason }),
      });

      if (!response.ok) {
        throw new Error('Erro ao pausar bot');
      }

      toast({
        title: 'Bot pausado',
        description: 'O DigiBot foi pausado. Atendimento humano ativado.',
      });

      // Atualizar status da conversa localmente
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                metadata: {
                  ...conv.metadata,
                  botStatus: 'HUMAN_TAKEOVER',
                },
                conversationStatus: 'human',
              }
            : conv
        )
      );
    } catch (error) {
      console.error('[useConversations] Erro ao pausar bot:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível pausar o bot',
        variant: 'destructive',
      });
      throw error;
    }
  }, [MESSAGES_API_URL, toast]);

  /**
   * ✅ NOVO: Retomar bot
   */
  const resumeBot = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/bot-flow/resume`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao retomar bot');
      }

      toast({
        title: 'Bot retomado',
        description: 'O DigiBot voltou a atender esta conversa.',
      });

      // Atualizar status da conversa localmente
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                metadata: {
                  ...conv.metadata,
                  botStatus: 'ACTIVE',
                },
                conversationStatus: 'bot',
              }
            : conv
        )
      );
    } catch (error) {
      console.error('[useConversations] Erro ao retomar bot:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível retomar o bot',
        variant: 'destructive',
      });
      throw error;
    }
  }, [MESSAGES_API_URL, toast]);

  const fetchConversations = useCallback(async () => {
    const response = await fetch(`${MESSAGES_API_URL}/conversations`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar conversas');
    }

    const data = await response.json();
    const conversationList = Array.isArray(data) ? data : data.conversations || [];
    const enriched = await Promise.all(conversationList.map(enrichConversation));

    return enriched.sort((a, b) => {
      if (a.isBotConversation && !b.isBotConversation) return -1;
      if (!a.isBotConversation && b.isBotConversation) return 1;

      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

      return dateB - dateA;
    });
  }, [MESSAGES_API_URL, enrichConversation]);

  /**
   * Carregar conversas do backend
   */
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const sorted = await fetchConversations();
      setConversations(sorted);

      if (userTypeRef.current === 'CITIZEN' && !botEnsureAttemptedRef.current) {
        const hasBot = sorted.some(conv => conv.isBotConversation);

        if (!hasBot) {
          botEnsureAttemptedRef.current = true;
          const created = await ensureBotConversation();

          if (created) {
            const refreshed = await fetchConversations();
            setConversations(refreshed);
          }
        }
      }
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
      const wasReconnect = reconnectAttemptsRef.current > 0;
      reconnectAttemptsRef.current = 0;
      setIsConnected(true);
      console.log('[useConversations] Conectado ao servidor de mensagens', {
        userId,
        userType,
        wasReconnect,
      });

      // Se foi uma reconexão, recarregar conversas para sincronizar estado
      if (wasReconnect) {
        console.log('[useConversations] Reconexão detectada, recarregando conversas...');
        fetchConversations().then(sorted => {
          setConversations(sorted);
        }).catch(err => {
          console.error('[useConversations] Erro ao recarregar conversas após reconexão:', err);
        });
      }
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
      if (data.message?.id && processedMessageIdsRef.current.has(data.message.id)) {
        return;
      }

      if (data.message?.id) {
        processedMessageIdsRef.current.add(data.message.id);
      }

      console.log('[useConversations] Nova mensagem recebida:', data);

      setConversations(prev => {
        const conversationExists = prev.some(c => c.id === data.conversationId);

        if (!conversationExists) {
          // Conversa não existe localmente: isso acontece quando o outro lado cria a conversa
          // e envia a primeira mensagem. Recarregar a lista para sincronizar.
          console.log('[useConversations] Conversa não encontrada localmente, recarregando conversas...');

          if (!conversationRefreshInFlightRef.current) {
            conversationRefreshInFlightRef.current = true;
            fetchConversations()
              .then(sorted => {
                setConversations(sorted);
              })
              .catch(err => {
                console.error('[useConversations] Erro ao recarregar conversas após message:new:', err);
              })
              .finally(() => {
                conversationRefreshInFlightRef.current = false;
              });
          }

          return prev;
        }

        // Atualizar preview e timestamp da conversa
        return prev.map(c =>
          c.id === data.conversationId
            ? {
                ...c,
                lastMessagePreview: data.message.content.substring(0, 100),
                lastMessageAt: data.message.sentAt,
                unreadCount: data.message.senderId === userIdRef.current ? 0 : (c.unreadCount || 0) + 1,
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
      if (onNewMessageRef.current) {
        onNewMessageRef.current(data.message, data.conversationId);
      }

      // Mostrar notificação se mensagem não é do próprio usuário
      if (data.message.senderId !== userIdRef.current) {
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
      if (onNewConversationRef.current) {
        onNewConversationRef.current(enrichedConv);
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

    // ✅ NOVO: Event: Nova conversa na fila de handover (só para SERVER)
    newSocket.on('handover:new', (data: HandoverQueueItem) => {
      if (userTypeRef.current !== 'SERVER') return;

      console.log('[useConversations] Nova conversa na fila de handover:', data);

      // Tocar som de notificação
      audioRef.current?.play().catch((err) => console.warn('Erro ao tocar som:', err));

      // Mostrar toast com ação
      toast({
        title: 'Nova conversa aguardando atendimento',
        description: `${data.citizenName} - Clique em "Ver Fila" para atender`,
        duration: 10000,
      });

      // Callback para componente pai
      if (onHandoverNewRef.current) {
        onHandoverNewRef.current(data);
      }

      // Atualizar fila
      fetchHandoverQueue();
    });

    // ✅ NOVO: Event: Conversa assumida por outro servidor
    newSocket.on('handover:takeover', (data: { conversationId: string; serverId: string }) => {
      if (userTypeRef.current !== 'SERVER') return;

      console.log('[useConversations] Conversa assumida por outro servidor:', data);

      // Remover da fila local
      setHandoverQueue(prev => prev.filter(item => item.conversationId !== data.conversationId));
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
  }, [userId, userType, MESSAGES_WS_URL]);

  /**
   * Carregar conversas quando conectar
   */
  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  /**
   * ✅ CORRIGIDO: Entrar automaticamente nas salas de conversas existentes
   * Rastreia quais conversas já foram joined para evitar loops
   */
  const joinedConversationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (socket && isConnected && conversations.length > 0) {
      conversations.forEach(conv => {
        // Só entrar se ainda não entrou nesta conversa
        if (!joinedConversationsRef.current.has(conv.id)) {
          console.log('[useConversations] Entrando na sala da conversa:', conv.id);
          socket.emit('conversation:join', { conversationId: conv.id });
          joinedConversationsRef.current.add(conv.id);
        }
      });
    }
  }, [socket, isConnected, conversations]);

  // Limpar joined conversations quando desconectar
  useEffect(() => {
    if (!isConnected) {
      joinedConversationsRef.current.clear();
    }
  }, [isConnected]);

  /**
   * ✅ NOVO: Auto-refresh da fila de handover a cada 30s (só para SERVER)
   */
  useEffect(() => {
    if (userTypeRef.current !== 'SERVER') return;

    // Buscar imediatamente
    fetchHandoverQueue();

    // Auto-refresh a cada 30s
    const interval = setInterval(() => {
      fetchHandoverQueue();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchHandoverQueue]);

  /**
   * Enviar mensagem via WebSocket
   */
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    attachments?: any[]
  ): Promise<{ success: boolean; message?: Message; error?: string }> => {
    // Preferir WebSocket quando conectado
    if (socket && isConnected) {
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
              const message = response.message as Message | undefined;

              // Evitar duplicar quando o servidor também emite `message:new` para o remetente.
              if (message?.id) {
                processedMessageIdsRef.current.add(message.id);
              }

              // Atualizar preview/timestamp localmente (a conversa sobe na lista).
              if (message?.content) {
                setConversations(prev => {
                  const exists = prev.some(c => c.id === conversationId);
                  if (!exists) return prev;

                  const updated = prev.map(c =>
                    c.id === conversationId
                      ? {
                          ...c,
                          lastMessagePreview: message.content.substring(0, 100),
                          lastMessageAt: message.sentAt,
                        }
                      : c
                  ).sort((a, b) => {
                    if (a.isBotConversation && !b.isBotConversation) return -1;
                    if (!a.isBotConversation && b.isBotConversation) return 1;

                    const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                    const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

                    return dateB - dateA;
                  });

                  return updated;
                });
              }

              // Notificar consumidor imediatamente (especialmente útil se o socket
              // ainda não entrou na room da conversa).
              if (message && onNewMessageRef.current) {
                onNewMessageRef.current(message, conversationId);
              }

              resolve({ success: true, message });
            }
          }
        );
      });
    }

    // Fallback HTTP (permite envio mesmo se WS cair)
    try {
      const response = await fetch(`${MESSAGES_API_URL}/messages/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content, attachments }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error || `Erro ${response.status} ao enviar mensagem`;
        throw new Error(msg);
      }

      const message = (await response.json()) as Message;

      // Atualizar preview/timestamp localmente
      setConversations(prev => {
        const exists = prev.some(c => c.id === conversationId);

        if (!exists) {
          return prev;
        }

        const updated = prev.map(c =>
          c.id === conversationId
            ? {
                ...c,
                lastMessagePreview: message.content.substring(0, 100),
                lastMessageAt: message.sentAt,
              }
            : c
        ).sort((a, b) => {
          if (a.isBotConversation && !b.isBotConversation) return -1;
          if (!a.isBotConversation && b.isBotConversation) return 1;

          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

          return dateB - dateA;
        });

        return updated;
      });

      // Notificar componente consumidor (ex: página) para atualizar a lista de mensagens
      if (onNewMessageRef.current) {
        onNewMessageRef.current(message, conversationId);
      }

      return { success: true, message };
    } catch (error: any) {
      console.error('[useConversations] Falha ao enviar mensagem (HTTP fallback):', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem',
        variant: 'destructive',
      });
      return { success: false, error: error?.message || 'Falha ao enviar mensagem' };
    }
  }, [socket, isConnected, toast, MESSAGES_API_URL]);

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

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      await fetch(`${MESSAGES_API_URL}/conversations/${conversationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0, unreadCount1: 0, unreadCount2: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Erro ao marcar conversa como lida:', error);
    }
  }, [MESSAGES_API_URL]);

  /**
   * Criar ou buscar conversa
   */
  const findOrCreateConversation = useCallback(async (
    recipientId: string,
    recipientType: 'CITIZEN' | 'SERVER'
  ): Promise<Conversation | null> => {
    try {
      // CRÍTICO: Enviar participant1 (usuário atual) E participant2 (destinatário)
      const response = await fetch(`${MESSAGES_API_URL}/conversations/find-or-create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant1Id: userIdRef.current,
          participant1Type: userTypeRef.current,
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
    handoverQueue, // ✅ NOVO
    socket,
    isConnected,
    loading,
    error,
    loadConversations,
    fetchHandoverQueue, // ✅ NOVO
    takeoverConversation, // ✅ NOVO
    pauseBot, // ✅ NOVO
    resumeBot, // ✅ NOVO
    sendMessage,
    markAsRead,
    markConversationAsRead,
    findOrCreateConversation,
    ensureBotConversation, // ✅ NOVO: Expor para uso externo
  };
}

export default useConversations;
