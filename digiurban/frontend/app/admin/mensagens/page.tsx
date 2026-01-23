'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  Search,
  Filter,
  Users,
  Bot,
  CheckCheck,
  MoreVertical,
  ArrowLeft,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Loader2,
  AlertCircle,
  Plus,
  Menu,
  X,
  Settings,
  BarChart3,
  UserCircle,
  LogOut,
  Check,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { NewConversationDialog } from '@/src/components/Messages/NewConversationDialog';
import Link from 'next/link';

// Hook e helpers unificados
import { useConversations, Message, Conversation } from '@/src/hooks/useConversations';
import {
  formatTime,
  formatRelativeTime,
  getInitials,
  filterConversations,
  getConversationStatus,
  getStatusBadgeColor,
  getStatusLabel,
} from '@/src/utils/conversationHelpers';

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

  // Estados locais
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    activeConversations: 0,
    botConversations: 0,
    humanConversations: 0,
    averageResponseTime: '0s',
    satisfactionRate: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MESSAGES_API_URL = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Itens do menu lateral (admin)
  const menuItems = [
    { name: 'Chat', href: '/admin/mensagens', icon: MessageCircle },
    { name: 'Estatísticas', onClick: () => setShowStats(!showStats), icon: BarChart3 },
    { name: 'Cidadãos', href: '/admin/cidadaos', icon: Users },
    { name: 'Servidores', href: '/admin/servidores', icon: UserCircle },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings }
  ];

  // Hook unificado de conversas
  const {
    conversations,
    socket,
    isConnected,
    loading,
    error,
    loadConversations,
    sendMessage,
    markConversationAsRead,
    findOrCreateConversation,
  } = useConversations({
    userId: user?.id || '',
    userType: 'SERVER',
    onNewMessage: (message, conversationId) => {
      // Se é mensagem para conversa selecionada, adicionar à lista
      if (selectedConversation?.id === conversationId) {
        setMessages(prev => (prev.some(item => item.id === message.id) ? prev : [...prev, message]));
        scrollToBottom();

        if (message.senderId !== user?.id) {
          markConversationAsRead(conversationId);
        }
      }
    },
    onNewConversation: (conversation) => {
      toast({
        title: 'Nova conversa',
        description: `Nova conversa com ${conversation.title}`,
      });
    },
  });

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar estatísticas
  useEffect(() => {
    loadStats();
  }, []);

  // Carregar mensagens quando conversa é selecionada
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Carregar estatísticas
   */
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

  /**
   * Carregar mensagens de uma conversa
   */
  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);

    try {
      const response = await fetch(
        `${MESSAGES_API_URL}/conversations/${conversationId}/messages?limit=50`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : data.messages || []);

        // Entrar na sala do WebSocket
        if (socket) {
          socket.emit('conversation:join', { conversationId });
        }

        // Marcar mensagens não lidas como lidas
        const conv = conversations.find(c => c.id === conversationId);
        if (conv && conv.unreadCount && conv.unreadCount > 0) {
          // Atualizar contador local via hook
          // O hook já trata isso automaticamente
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
  };

  /**
   * Selecionar conversa
   */
  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    markConversationAsRead(conversation.id);

    if (isMobileView) {
      setShowConversationsList(false);
    }
  };

  /**
   * Enviar mensagem
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !socket) return;

    const result = await sendMessage(selectedConversation.id, newMessage.trim());

    if (result.success) {
      setNewMessage('');
    }
  };

  /**
   * Assumir conversa (Bot -> Humano)
   */
  const handleTakeOver = async () => {
    if (!selectedConversation) return;

    try {
      // 1. Pausar o bot
      await fetch(`${MESSAGES_API_URL}/bot-flow/pause`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          citizenId: selectedConversation.participant1Id
        })
      });

      // 2. Enviar mensagem automática
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

      // Recarregar conversa para atualizar status
      await loadConversations();
    } catch (err) {
      console.error('Erro ao assumir conversa:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível assumir a conversa.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Devolver ao bot (Humano -> Bot)
   */
  const handleHandBackToBot = async () => {
    if (!selectedConversation) return;

    try {
      // 1. Retomar o bot
      await fetch(`${MESSAGES_API_URL}/bot-flow/resume`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          citizenId: selectedConversation.participant1Id
        })
      });

      toast({
        title: 'Conversa retornada ao bot',
        description: 'O DigiBot voltou a atender esta conversa.',
      });

      // Recarregar conversa para atualizar status
      await loadConversations();
    } catch (err) {
      console.error('Erro ao retornar ao bot:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível retornar a conversa ao bot.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Scroll para o final
   */
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  /**
   * Voltar para lista (mobile)
   */
  const handleBackToList = () => {
    setShowConversationsList(true);
    setSelectedConversation(null);
    setMessages([]);
  };

  /**
   * Filtrar conversas
   */
  const filteredConversations = filterConversations(conversations, searchQuery);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar Menu Lateral */}
      {showSidebar && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl flex flex-col">
            {/* Header Sidebar */}
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-white">
                  <AvatarFallback className="bg-white text-blue-600 font-bold">
                    {getInitials(user?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <p className="font-semibold">{user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-blue-100">{isConnected ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Menu Items */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  if (item.onClick) {
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          item.onClick();
                          setShowSidebar(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                          {item.name}
                        </span>
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      href={item.href!}
                      onClick={() => setShowSidebar(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Logout */}
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  // Implementar logout
                  window.location.href = '/admin/login';
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Stats Overlay */}
      {showStats && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowStats(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600">
              <h3 className="font-bold text-white">Estatísticas</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStats(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
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
            </ScrollArea>
          </div>
        </>
      )}
      {/* Lista de Conversas */}
      <div
        className={`${
          isMobileView
            ? showConversationsList ? 'w-full' : 'hidden'
            : 'w-96 border-r'
        } bg-white flex flex-col`}
      >
        {/* Header da Lista */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(true)}
                className="text-white hover:bg-white/20"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                DigiUrban Admin
              </h2>
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setShowNewConversation(true)}
              title="Nova conversa"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/90 border-0"
            />
          </div>
        </div>

        {/* Lista de Conversas */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const status = getConversationStatus(conversation);
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={cn(
                    "p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                    selectedConversation?.id === conversation.id && "bg-blue-50",
                    conversation.isBotConversation && "bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-600"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className={cn(
                        "w-12 h-12",
                        conversation.isBotConversation && "ring-2 ring-blue-600"
                      )}>
                        {conversation.isBotConversation ? (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <>
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getInitials(conversation.title || conversation.citizenName || '')}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      {conversation.isBotConversation && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            "font-medium truncate",
                            conversation.isBotConversation && "text-blue-700 font-bold"
                          )}>
                            {conversation.title || conversation.citizenName || 'Conversa'}
                          </h3>
                          {conversation.isBotConversation && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              IA
                            </Badge>
                          )}
                          {status === 'human' && (
                            <Badge className="bg-orange-600 text-white text-xs">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Humano
                            </Badge>
                          )}
                        </div>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(conversation.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      {conversation.lastMessagePreview && (
                        <p className={cn(
                          "text-sm truncate",
                          conversation.isBotConversation ? "text-blue-600" : "text-gray-600"
                        )}>
                          {conversation.lastMessagePreview}
                        </p>
                      )}
                    </div>

                    {(conversation.unreadCount || 0) > 0 && (
                      <Badge className="bg-blue-600 text-white">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* Área de Chat */}
      <div
        className={`${
          isMobileView
            ? showConversationsList ? 'hidden' : 'w-full'
            : 'flex-1'
        } flex flex-col bg-white`}
      >
        {selectedConversation ? (
          <>
            {/* Header do Chat */}
            <div className={cn(
              "p-4 border-b flex items-center justify-between",
              selectedConversation.isBotConversation && "bg-gradient-to-r from-blue-600 to-purple-600"
            )}>
              <div className="flex items-center gap-3">
                {isMobileView && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToList}
                    className={selectedConversation.isBotConversation ? "text-white hover:bg-white/20" : ""}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}

                <Avatar className={cn(
                  "w-10 h-10",
                  selectedConversation.isBotConversation && "ring-2 ring-white"
                )}>
                  {selectedConversation.isBotConversation ? (
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                  ) : (
                    <>
                      <AvatarImage src={selectedConversation.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(selectedConversation.title || selectedConversation.citizenName || '')}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                <div>
                  <h3 className={cn(
                    "font-medium flex items-center gap-2",
                    selectedConversation.isBotConversation && "text-white"
                  )}>
                    {selectedConversation.title || selectedConversation.citizenName}
                    {selectedConversation.isBotConversation && (
                      <Badge className="bg-white text-blue-600 text-xs">IA</Badge>
                    )}
                  </h3>
                  <p className={cn(
                    "text-xs",
                    selectedConversation.isBotConversation ? "text-blue-100" : "text-gray-500"
                  )}>
                    {selectedConversation.isBotConversation ? 'Sempre disponível' : (isConnected ? 'Online' : 'Offline')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getConversationStatus(selectedConversation) === 'bot' ? (
                  <Button
                    size="sm"
                    onClick={handleTakeOver}
                    className="gap-2 bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    Assumir
                  </Button>
                ) : getConversationStatus(selectedConversation) === 'human' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleHandBackToBot}
                    className="gap-2"
                  >
                    <Bot className="w-4 h-4" />
                    Devolver ao Bot
                  </Button>
                ) : null}

                <Button variant="ghost" size="icon" className={selectedConversation.isBotConversation ? "text-white hover:bg-white/20" : ""}>
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderType === 'SERVER';
                    const isBot = message.senderType === 'BOT' || message.senderType === 'SYSTEM';
                    const showDate = index === 0 ||
                      new Date(messages[index - 1].sentAt).toDateString() !==
                      new Date(message.sentAt).toDateString();

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                              {new Date(message.sentAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}

                        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg px-4 py-2 shadow-sm",
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : isBot
                                ? 'bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900 border border-blue-200'
                                : 'bg-white text-gray-900'
                            )}
                          >
                            {isBot && !isOwnMessage && (
                              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-200">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-700">DigiBot</span>
                              </div>
                            )}
                            {!isBot && !isOwnMessage && (
                              <p className="text-xs font-semibold text-gray-700 mb-1">
                                {selectedConversation.citizenName}
                              </p>
                            )}
                            <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>

                            {/* Quick Replies - Para admin visualizar apenas */}
                            {(message as any).metadata?.options && (message as any).metadata.options.length > 0 && (
                              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs text-blue-700 font-semibold mb-2">Opções disponíveis:</p>
                                <div className="flex flex-col gap-1">
                                  {(message as any).metadata.options.map((option: any) => (
                                    <div key={option.id} className="text-xs text-gray-700">
                                      • {option.label}
                                      {option.description && <span className="text-gray-500"> - {option.description}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">
                                {formatTime(message.sentAt)}
                              </span>
                              {isOwnMessage && (
                                message.status === 'READ' ? (
                                  <CheckCheck className="w-3 h-3 text-blue-200" />
                                ) : message.status === 'DELIVERED' ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )
                              )}
                            </div>
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
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <Button type="button" variant="ghost" size="icon" className="text-gray-500">
                  <Smile className="w-5 h-5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="text-gray-500">
                  <Paperclip className="w-5 h-5" />
                </Button>

                <Input
                  type="text"
                  placeholder="Digite uma mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  disabled={!isConnected || selectedConversation.status === 'CLOSED'}
                />

                {newMessage.trim() ? (
                  <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700" disabled={!isConnected}>
                    <Send className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="icon" className="text-gray-500">
                    <Mic className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center p-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Painel Admin - DigiUrban</h3>
              <p className="text-sm text-gray-600 mb-6">
                Selecione uma conversa à esquerda para gerenciar atendimentos
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog para criar nova conversa */}
      {user && (
        <NewConversationDialog
          isOpen={showNewConversation}
          onClose={() => setShowNewConversation(false)}
          onConversationCreated={async ({ contactId, contactType }) => {
            const newConv = await findOrCreateConversation(contactId, contactType);

            if (newConv) {
              setSelectedConversation(newConv);
              setShowNewConversation(false);

              if (isMobileView) {
                setShowConversationsList(false);
              }

              toast({
                title: 'Conversa iniciada',
                description: `Conversa com ${newConv.title} iniciada com sucesso!`,
              });
            }
          }}
        />
      )}
    </div>
  );
}
