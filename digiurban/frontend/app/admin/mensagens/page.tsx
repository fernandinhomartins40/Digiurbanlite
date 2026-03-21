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
  Mic,
  Archive,
  Trash2,
  Eraser,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { NewConversationDialog } from '@/src/components/Messages/NewConversationDialog';
import Link from 'next/link';

// Hook e helpers unificados
import { useConversations, Message, Conversation, HandoverQueueItem } from '@/src/hooks/useConversations';
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
  const [confirmAction, setConfirmAction] = useState<{
    type: 'clear-for-me' | 'clear' | 'archive' | 'delete';
    conversationId: string;
    title: string;
  } | null>(null);
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

  // Hook unificado de conversas (✅ COM HANDOVER)
  const {
    conversations,
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
    markConversationAsRead,
    findOrCreateConversation,
  } = useConversations({
    userId: user?.id || '',
    userType: 'SERVER',
    departmentId: user?.departmentId, // ✅ NOVO: Filtrar fila por departamento
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
    onHandoverNew: (handoverItem) => {
      // ✅ NOVO: Callback quando nova conversa entra na fila
      console.log('[Admin] Nova conversa na fila:', handoverItem);
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

  useEffect(() => {
    if (isMobileView) {
      setShowConversationsList(!selectedConversation);
    }
  }, [isMobileView, selectedConversation]);

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
   * ✅ ATUALIZADO: Assumir conversa usando função do hook
   */
  const handleTakeOver = async () => {
    if (!selectedConversation) return;

    try {
      await pauseBot(selectedConversation.id, 'server_takeover');

      // Enviar mensagem de boas-vindas
      if (socket) {
        await sendMessage(selectedConversation.id, 'Um atendente assumiu a conversa. Como posso ajudar?');
      }
    } catch (err) {
      console.error('Erro ao assumir conversa:', err);
    }
  };

  /**
   * ✅ ATUALIZADO: Devolver ao bot usando função do hook
   */
  const handleHandBackToBot = async () => {
    if (!selectedConversation) return;

    try {
      await resumeBot(selectedConversation.id);
    } catch (err) {
      console.error('Erro ao retornar ao bot:', err);
    }
  };

  /**
   * ✅ NOVO: Assumir conversa da fila de handover
   */
  const handleTakeoverFromQueue = async (conversationId: string) => {
    try {
      await takeoverConversation(conversationId);

      // Encontrar e selecionar a conversa
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
        if (isMobileView) {
          setShowConversationsList(false);
        }
      }
    } catch (err) {
      console.error('Erro ao assumir da fila:', err);
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

  // === Gerenciamento de conversas (limpar para mim, limpar para todos, arquivar, deletar) ===
  const handleClearForMe = async (conversationId: string) => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/conversations/${conversationId}/clear-for-me`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao limpar mensagens');
      }
      if (selectedConversation?.id === conversationId) {
        setMessages([]);
      }
      await loadConversations();
      toast({ title: 'Mensagens limpas', description: 'As mensagens foram apagadas para você.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível limpar as mensagens', variant: 'destructive' });
    }
    setConfirmAction(null);
  };

  const handleClearMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/conversations/${conversationId}/clear`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao limpar mensagens');
      }
      if (selectedConversation?.id === conversationId) {
        setMessages([]);
      }
      await loadConversations();
      toast({ title: 'Mensagens limpas', description: 'Todas as mensagens foram removidas.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível limpar as mensagens', variant: 'destructive' });
    }
    setConfirmAction(null);
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/conversations/${conversationId}/archive`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao arquivar conversa');
      }
      setSelectedConversation(null);
      setMessages([]);
      await loadConversations();
      toast({ title: 'Conversa arquivada', description: 'A conversa foi movida para Arquivadas.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível arquivar a conversa', variant: 'destructive' });
    }
    setConfirmAction(null);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao excluir conversa');
      }
      setSelectedConversation(null);
      setMessages([]);
      await loadConversations();
      toast({ title: 'Conversa excluída', description: 'A conversa foi excluída definitivamente.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível excluir a conversa', variant: 'destructive' });
    }
    setConfirmAction(null);
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    switch (confirmAction.type) {
      case 'clear-for-me': handleClearForMe(confirmAction.conversationId); break;
      case 'clear': handleClearMessages(confirmAction.conversationId); break;
      case 'archive': handleArchiveConversation(confirmAction.conversationId); break;
      case 'delete': handleDeleteConversation(confirmAction.conversationId); break;
    }
  };

  const isProtectedConversation = selectedConversation?.isBotConversation;

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
  const showConversationPane = !isMobileView || showConversationsList;
  const showChatPane = !isMobileView || !showConversationsList;

  if (loading && conversations.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:h-[calc(100dvh-8rem)] md:h-[calc(100dvh-9rem)]">
      {/* Sidebar Menu Lateral */}
      {showSidebar && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-full max-w-[22rem] flex-col bg-white shadow-xl">
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
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[24rem] flex-col bg-white shadow-xl">
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
        className={cn(
          'min-h-0 flex-col bg-white',
          showConversationPane ? 'flex' : 'hidden',
          isMobileView
            ? 'w-full min-w-0'
            : 'w-[22rem] min-w-[22rem] border-r border-slate-200 lg:w-[24rem] lg:min-w-[24rem] xl:w-[26rem] xl:min-w-[26rem] 2xl:w-[28rem] 2xl:min-w-[28rem]'
        )}
      >
        {/* Header da Lista */}
        <div className="border-b bg-gradient-to-r from-blue-600 to-purple-600 p-3 sm:p-4">
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

        {/* ✅ NOVO: Tabs com Lista de Conversas + Fila de Handover */}
        <Tabs defaultValue="conversations" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-2 mt-2 grid w-auto grid-cols-2 rounded-xl bg-slate-100 p-1">
            <TabsTrigger value="conversations">
              Conversas ({conversations.length})
            </TabsTrigger>
            <TabsTrigger value="handover">
              Aguardando
              {handoverQueue.length > 0 && (
                <Badge className="ml-2 bg-orange-500">{handoverQueue.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Lista de Conversas */}
          <TabsContent value="conversations" className="m-0 min-h-0 flex-1">
            <ScrollArea className="h-full">
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
                    "cursor-pointer border-b px-3 py-3 transition-colors hover:bg-gray-50 sm:px-4 sm:py-4",
                    selectedConversation?.id === conversation.id && "bg-blue-50",
                    conversation.isBotConversation && "border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-purple-50"
                  )}
                >
                  <div className="flex min-w-0 items-start gap-3">
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
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h3 className={cn(
                            "min-w-0 truncate font-medium",
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
                          <span className="shrink-0 text-xs text-gray-500">
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
          </TabsContent>

          {/* ✅ NOVO: Tab: Fila de Handover */}
          <TabsContent value="handover" className="m-0 min-h-0 flex-1">
            <ScrollArea className="h-full">
              {handoverQueue.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Nenhuma conversa aguardando</p>
                  <p className="text-xs mt-1">Conversas pausadas aparecerão aqui</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {handoverQueue.map((item) => {
                    const waitMinutes = Math.floor(item.waitTime / 60);
                    const waitSeconds = item.waitTime % 60;

                    return (
                      <Card key={item.conversationId} className="border-orange-200 bg-orange-50/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-orange-100 text-orange-700">
                                  {getInitials(item.citizenName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-sm">{item.citizenName}</CardTitle>
                                <CardDescription className="text-xs flex items-center gap-1 mt-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Aguardando há {waitMinutes}min {waitSeconds}s
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-orange-700 border-orange-300">
                              Bot Pausado
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {item.lastMessage && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {item.lastMessage}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleTakeoverFromQueue(item.conversationId)}
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Assumir Agora
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Área de Chat */}
      <div
        className={cn(
          'min-h-0 min-w-0 flex-1 flex-col bg-white',
          showChatPane ? 'flex' : 'hidden'
        )}
      >
        {selectedConversation ? (
          <>
            {/* Header do Chat */}
            <div className={cn(
              "flex flex-col gap-3 border-b px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:px-6",
              selectedConversation.isBotConversation && "bg-gradient-to-r from-blue-600 to-purple-600"
            )}>
              <div className="flex min-w-0 items-center gap-3">
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
                  "w-10 h-10 shrink-0",
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

                <div className="min-w-0">
                  <h3 className={cn(
                    "flex items-center gap-2 font-medium",
                    selectedConversation.isBotConversation && "text-white"
                  )}>
                    <span className="truncate">
                      {selectedConversation.title || selectedConversation.citizenName}
                    </span>
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

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {getConversationStatus(selectedConversation) === 'bot' ? (
                  <Button
                    size="sm"
                    onClick={handleTakeOver}
                    className="gap-2 whitespace-nowrap bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    Assumir
                  </Button>
                ) : getConversationStatus(selectedConversation) === 'human' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleHandBackToBot}
                    className="gap-2 whitespace-nowrap"
                  >
                    <Bot className="w-4 h-4" />
                    Devolver ao Bot
                  </Button>
                ) : null}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={selectedConversation.isBotConversation ? "text-white hover:bg-white/20" : ""}>
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() =>
                        setConfirmAction({
                          type: 'clear-for-me',
                          conversationId: selectedConversation.id,
                          title: 'Apagar para mim?',
                        })
                      }
                    >
                      <Eraser className="w-4 h-4 mr-2" />
                      Apagar para mim
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setConfirmAction({
                          type: 'clear',
                          conversationId: selectedConversation.id,
                          title: 'Apagar para todos?',
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Apagar para todos
                    </DropdownMenuItem>
                    {!isProtectedConversation && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmAction({
                              type: 'archive',
                              conversationId: selectedConversation.id,
                              title: 'Arquivar conversa?',
                            })
                          }
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Arquivar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() =>
                            setConfirmAction({
                              type: 'delete',
                              conversationId: selectedConversation.id,
                              title: 'Excluir conversa?',
                            })
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir conversa
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="min-h-0 flex-1 bg-gray-50 px-3 py-4 sm:px-4 lg:px-6">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-5xl space-y-4">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderType === 'SERVER';
                    const isBot = message.senderId === 'DIGIBOT_SYSTEM' && message.senderType === 'SYSTEM';
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
                              "w-fit max-w-[88%] rounded-2xl px-4 py-2 shadow-sm sm:max-w-[78%] xl:max-w-[68%]",
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

                            {/* ✅ Quick Replies - Usando campos queryable */}
                            {message.isBotMessage && message.botInteractionType === 'menu' && message.botStructuredData && (
                              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs text-blue-700 font-semibold mb-2">Opções disponíveis:</p>
                                <div className="flex flex-col gap-1">
                                  {(message.botStructuredData as any[]).map((option: any) => (
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
            <form onSubmit={handleSendMessage} className="border-t bg-white px-3 py-3 sm:px-4 lg:px-6">
              <div className="mx-auto flex w-full max-w-5xl items-center gap-1.5 sm:gap-2">
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
                  className="min-w-0 flex-1"
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
          <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-gray-500 sm:p-8 lg:p-10">
            <div className="max-w-md text-center">
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

      {/* Dialog de confirmação para ações destrutivas */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'clear-for-me' &&
                'As mensagens serão removidas apenas para você. O outro participante continuará vendo as mensagens.'}
              {confirmAction?.type === 'clear' &&
                'Todas as mensagens desta conversa serão removidas para todos os participantes.'}
              {confirmAction?.type === 'archive' &&
                'A conversa será movida para a aba Arquivadas. Você poderá acessá-la novamente quando quiser.'}
              {confirmAction?.type === 'delete' &&
                'A conversa e todas as suas mensagens serão excluídas definitivamente. Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmAction}
              className={cn(
                (confirmAction?.type === 'delete' || confirmAction?.type === 'clear') && 'bg-red-600 hover:bg-red-700'
              )}
            >
              {confirmAction?.type === 'clear-for-me' && 'Apagar para mim'}
              {confirmAction?.type === 'clear' && 'Apagar para todos'}
              {confirmAction?.type === 'archive' && 'Arquivar'}
              {confirmAction?.type === 'delete' && 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
