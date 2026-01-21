'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  Search,
  Filter,
  Users,
  Bot,
  Clock,
  CheckCheck,
  MoreVertical,
  ArrowLeft,
  User,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Sparkles,
  PlayCircle,
  PauseCircle,
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
// Tabs removido - sistema simplificado tipo WhatsApp
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { io, Socket } from 'socket.io-client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { NewConversationDialog } from '@/src/components/Messages/NewConversationDialog';

interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1Type: string;
  participant2Type: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount1: number;
  unreadCount2: number;
  status: string;
  protocolId?: string;
  metadata?: {
    botStatus?: 'ACTIVE' | 'PAUSED' | 'HUMAN_TAKEOVER';
    assignedTo?: string;
    citizenName?: string;
    serverName?: string;
  };
  // Campos computados no frontend
  citizenName?: string;
  unreadCount?: number;
  conversationStatus?: 'bot' | 'human' | 'closed';
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'CITIZEN' | 'SERVER' | 'BOT';
  content: string;
  contentType: string;
  attachments?: any[];
  status: string;
  sentAt: string;
  readAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
  senderName?: string;
}

interface Stats {
  totalConversations: number;
  activeConversations: number;
  botConversations: number;
  humanConversations: number;
  averageResponseTime: string;
  satisfactionRate: number;
}

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // Removido: sistema de tabs desnecessário para app tipo WhatsApp
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    activeConversations: 0,
    botConversations: 0,
    humanConversations: 0,
    averageResponseTime: '0s',
    satisfactionRate: 0
  });

  const MESSAGES_API_URL = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
  const MESSAGES_WS_URL = process.env.NEXT_PUBLIC_MESSAGES_WS_URL || 'http://localhost:9001';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Conectar WebSocket
  useEffect(() => {
    if (!user) return;

    const newSocket = io(MESSAGES_WS_URL, {
      withCredentials: true, // Envia cookies (redundância)
      auth: {
        // Também envia via auth object (redundância segura)
        userId: user.id,
        userType: 'SERVER',
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[Admin] Conectado ao servidor de mensagens');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Admin] Desconectado do servidor de mensagens');
    });

    // Receber nova mensagem
    newSocket.on('message:new', (data: { conversationId: string; message: Message }) => {
      console.log('[Admin] Nova mensagem recebida:', data);

      // CRÍTICO: Usar setState com função para ter acesso ao estado mais recente
      setConversations(prev => {
        const conversationExists = prev.some(conv => conv.id === data.conversationId);

        if (!conversationExists) {
          // NOVA CONVERSA: Recarregar lista completa (estilo WhatsApp)
          console.log('[Admin] Nova conversa detectada, recarregando lista...');

          // Fazer socket entrar na sala da conversa IMEDIATAMENTE
          newSocket.emit('conversation:join', { conversationId: data.conversationId });

          // Trigger reload (mas retornar lista atual para evitar perda de estado)
          loadConversations();
          return prev;
        } else {
          // Conversa existente: Atualizar na lista
          return prev.map(conv =>
            conv.id === data.conversationId
              ? {
                  ...conv,
                  lastMessagePreview: data.message.content.substring(0, 100),
                  lastMessageAt: data.message.sentAt,
                  unreadCount: conv.unreadCount ? conv.unreadCount + 1 : 1
                }
              : conv
          );
        }
      });

      // Se a conversa selecionada é a que recebeu mensagem, adicionar
      if (selectedConversation?.id === data.conversationId) {
        setMessages(prev => [...prev, data.message]);

        // Marcar como lida automaticamente
        newSocket.emit('message:read', {
          messageId: data.message.id,
          conversationId: data.conversationId
        });
      } else {
        // Mostrar notificação
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nova mensagem', {
            body: data.message.content.substring(0, 100),
            icon: '/logo.png'
          });
        }
      }
    });

    // Mensagem lida
    newSocket.on('message:read', (data: { messageId: string; conversationId: string }) => {
      if (selectedConversation?.id === data.conversationId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === data.messageId
              ? { ...msg, status: 'READ', readAt: new Date().toISOString() }
              : msg
          )
        );
      }
    });

    setSocket(newSocket);

    // Solicitar permissão de notificação
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.close();
    };
  }, [MESSAGES_WS_URL, selectedConversation, user]);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar conversas
  useEffect(() => {
    loadConversations();
    loadStats();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${MESSAGES_API_URL}/conversations`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar conversas');
      }

      const data = await response.json();

      // Enriquecer conversas com nomes reais dos participantes
      const enrichedConversations = await Promise.all(
        data.map(async (conv: Conversation) => {
          let participantName = 'Usuário';

          // Identificar o outro participante (não o admin atual)
          const isParticipant1 = conv.participant1Id === user?.id && conv.participant1Type === 'SERVER';
          const otherParticipantId = isParticipant1 ? conv.participant2Id : conv.participant1Id;
          const otherParticipantType = isParticipant1 ? conv.participant2Type : conv.participant1Type;

          try {
            // Buscar nome do outro participante na API do DigiUrban
            if (otherParticipantType === 'CITIZEN') {
              const citizenRes = await fetch(`${API_URL}/citizens/${otherParticipantId}`, {
                credentials: 'include'
              });
              if (citizenRes.ok) {
                const citizen = await citizenRes.json();
                participantName = citizen.name || 'Cidadão';
              }
            } else if (otherParticipantType === 'SERVER') {
              const adminRes = await fetch(`${API_URL}/admin/users/${otherParticipantId}`, {
                credentials: 'include'
              });
              if (adminRes.ok) {
                const admin = await adminRes.json();
                participantName = admin.name || 'Servidor';
              }
            }
          } catch (err) {
            console.warn('Erro ao buscar nome do participante:', err);
          }

          return {
            ...conv,
            citizenName: participantName,
            unreadCount: conv.unreadCount2 || 0
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
      setError('Não foi possível carregar as conversas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/admin/stats`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalConversations: data.totalConversations || 0,
          activeConversations: data.activeConversations || 0,
          botConversations: data.botConversations || 0,
          humanConversations: data.humanConversations || 0,
          averageResponseTime: data.averageResponseTime || '0s',
          satisfactionRate: data.satisfactionRate || 0
        });
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);

    try {
      // Carregar mensagens
      const response = await fetch(
        `${MESSAGES_API_URL}/conversations/${conversation.id}/messages?limit=50`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);

        // Entrar na sala do WebSocket
        if (socket) {
          socket.emit('conversation:join', { conversationId: conversation.id });
        }

        // Marcar mensagens não lidas como lidas
        if (conversation.unreadCount && conversation.unreadCount > 0) {
          // Atualizar contador local
          setConversations(prev => prev.map(conv =>
            conv.id === conversation.id
              ? { ...conv, unreadCount: 0 }
              : conv
          ));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as mensagens.',
        variant: 'destructive'
      });
    } finally {
      setLoadingMessages(false);
    }

    if (isMobileView) {
      setShowConversationsList(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !socket) return;

    socket.emit(
      'message:send',
      {
        conversationId: selectedConversation.id,
        content: newMessage.trim(),
      },
      (response: any) => {
        if (response?.error) {
          console.error('Erro ao enviar mensagem:', response.error);
          toast({
            title: 'Erro',
            description: 'Não foi possível enviar a mensagem.',
            variant: 'destructive'
          });
        } else {
          setNewMessage('');
        }
      }
    );
  };

  const handleTakeOver = async () => {
    if (!selectedConversation) return;

    try {
      // 1. Pausar o bot
      await fetch(`${API_URL}/bot-flow/pause`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          citizenId: selectedConversation.participant1Id
        })
      });

      // 2. Atualizar conversa localmente
      setSelectedConversation({
        ...selectedConversation,
        conversationStatus: 'human',
        metadata: {
          ...selectedConversation.metadata,
          botStatus: 'HUMAN_TAKEOVER',
          assignedTo: user?.id
        }
      });

      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              conversationStatus: 'human',
              metadata: {
                ...conv.metadata,
                botStatus: 'HUMAN_TAKEOVER',
                assignedTo: user?.id
              }
            }
          : conv
      ));

      // 3. Enviar mensagem automática
      if (socket) {
        socket.emit('message:send', {
          conversationId: selectedConversation.id,
          content: 'Um atendente assumiu a conversa. Como posso ajudar?',
        });
      }

      toast({
        title: 'Atendimento assumido',
        description: 'Você assumiu a conversa. O bot foi pausado.',
      });
    } catch (err) {
      console.error('Erro ao assumir conversa:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível assumir a conversa.',
        variant: 'destructive'
      });
    }
  };

  const handleHandBackToBot = async () => {
    if (!selectedConversation) return;

    try {
      // 1. Retomar o bot
      await fetch(`${API_URL}/bot-flow/resume`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          citizenId: selectedConversation.participant1Id
        })
      });

      // 2. Atualizar conversa localmente
      setSelectedConversation({
        ...selectedConversation,
        conversationStatus: 'bot',
        metadata: {
          ...selectedConversation.metadata,
          botStatus: 'ACTIVE',
          assignedTo: undefined
        }
      });

      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              conversationStatus: 'bot',
              metadata: {
                ...conv.metadata,
                botStatus: 'ACTIVE',
                assignedTo: undefined
              }
            }
          : conv
      ));

      toast({
        title: 'Conversa retornada ao bot',
        description: 'O DigiBot voltou a atender esta conversa.',
      });
    } catch (err) {
      console.error('Erro ao retornar ao bot:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível retornar a conversa ao bot.',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  // Filtrar apenas por busca - sistema simplificado tipo WhatsApp
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = (conv.citizenName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie conversas e atendimentos {isConnected && <span className="text-green-600">● Online</span>}
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={loadConversations}>
            <Filter className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Conversas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-xs text-green-600 mt-1">
                +{stats.activeConversations} ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Atendidas por IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.botConversations}</p>
                <Bot className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {stats.activeConversations > 0
                  ? Math.round((stats.botConversations / stats.activeConversations) * 100)
                  : 0}% do total ativo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Atendimento Humano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.humanConversations}</p>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Tempo médio: {stats.averageResponseTime}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Satisfação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.satisfactionRate}/5</p>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-xs text-green-600 mt-1">
                Avaliação média
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Chat Interface */}
        <div className="h-[600px] flex bg-white rounded-lg border shadow-sm overflow-hidden">
          {/* Lista de Conversas */}
          <div
            className={`${
              isMobileView
                ? showConversationsList ? 'w-full' : 'hidden'
                : 'w-96 border-r'
            } flex flex-col`}
          >
            {/* Header da Lista */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar conversas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  size="icon"
                  variant="default"
                  onClick={() => setShowNewConversation(true)}
                  title="Nova conversa"
                  className="shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Lista */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                      selectedConversation?.id === conv.id && "bg-blue-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {(conv.citizenName || 'C').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">{conv.citizenName}</h4>
                          {conv.lastMessageAt && (
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(conv.lastMessageAt)}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conv.lastMessagePreview || 'Sem mensagens'}
                        </p>

                        <div className="flex items-center gap-2">
                          {conv.conversationStatus === 'bot' ? (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              IA
                            </Badge>
                          ) : conv.conversationStatus === 'human' ? (
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Humano
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 text-xs">
                              Fechada
                            </Badge>
                          )}

                          {conv.unreadCount && conv.unreadCount > 0 && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Área de Chat */}
          <div
            className={`${
              isMobileView
                ? showConversationsList ? 'hidden' : 'w-full'
                : 'flex-1'
            } flex flex-col`}
          >
            {selectedConversation ? (
              <>
                {/* Header do Chat */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isMobileView && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowConversationsList(true)}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                    )}

                    <Avatar>
                      <AvatarFallback>
                        {(selectedConversation.citizenName || 'C').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="font-medium">{selectedConversation.citizenName}</h3>
                      <p className="text-xs text-gray-500">
                        {selectedConversation.conversationStatus === 'bot'
                          ? 'Atendido por DigiBot'
                          : selectedConversation.conversationStatus === 'human'
                          ? 'Atendimento humano'
                          : 'Conversa encerrada'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedConversation.conversationStatus === 'bot' ? (
                      <Button size="sm" onClick={handleTakeOver} className="gap-2">
                        <UserCheck className="w-4 h-4" />
                        Assumir Conversa
                      </Button>
                    ) : selectedConversation.conversationStatus === 'human' ? (
                      <Button size="sm" variant="outline" onClick={handleHandBackToBot} className="gap-2">
                        <Bot className="w-4 h-4" />
                        Devolver ao Bot
                      </Button>
                    ) : null}

                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Mensagens */}
                <ScrollArea className="flex-1 p-4 bg-gray-50">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-4xl mx-auto">
                      {messages.map((message) => {
                        const isOwn = message.senderType === 'SERVER';
                        const isBot = message.senderType === 'BOT';

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-lg px-4 py-2 shadow-sm",
                                isOwn
                                  ? 'bg-blue-600 text-white'
                                  : isBot
                                  ? 'bg-gradient-to-br from-purple-50 to-blue-50 text-gray-900 border border-purple-200'
                                  : 'bg-white text-gray-900'
                              )}
                            >
                              {!isOwn && (
                                <p className={`text-xs font-semibold mb-1 ${isBot ? 'text-purple-700' : 'text-gray-700'}`}>
                                  {isBot ? 'DigiBot' : selectedConversation.citizenName}
                                </p>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${
                                isOwn ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                <span className="text-xs">
                                  {formatTime(message.sentAt)}
                                </span>
                                {isOwn && (
                                  <span className="text-xs">
                                    {message.status === 'READ' ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input de Mensagem */}
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Digite uma mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={!isConnected || selectedConversation.conversationStatus === 'closed'}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!isConnected || !newMessage.trim() || selectedConversation.conversationStatus === 'closed'}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    Selecione uma conversa
                  </h3>
                  <p className="text-sm">
                    Escolha uma conversa da lista para visualizar as mensagens
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Dialog para criar nova conversa */}
      {user && (
        <NewConversationDialog
          isOpen={showNewConversation}
          onClose={() => setShowNewConversation(false)}
          currentUserId={user.id}
          currentUserType="SERVER"
          onConversationCreated={(conversation) => {
            setConversations(prev => [conversation, ...prev]);
            setSelectedConversation(conversation);
            setShowNewConversation(false);
            if (isMobileView) {
              setShowConversationsList(false);
            }
            toast({
              title: 'Conversa iniciada',
              description: `Conversa com ${conversation.title} iniciada com sucesso!`,
            });
          }}
        />
      )}
    </div>
  );
}
