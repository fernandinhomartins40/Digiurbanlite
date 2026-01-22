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
  Plus
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

  // Hook unificado de conversas
  const {
    conversations,
    socket,
    isConnected,
    loading,
    error,
    loadConversations,
    sendMessage,
    findOrCreateConversation,
  } = useConversations({
    userId: user?.id || '',
    userType: 'SERVER',
    onNewMessage: (message, conversationId) => {
      // Se é mensagem para conversa selecionada, adicionar à lista
      if (selectedConversation?.id === conversationId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
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
        setMessages(data);

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
   * Filtrar conversas
   */
  const filteredConversations = filterConversations(conversations, searchQuery);

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
              filteredConversations.map((conv) => {
                const status = getConversationStatus(conv);

                return (
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
                          {getInitials(conv.title || conv.citizenName || 'U')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {conv.title || conv.citizenName || 'Conversa'}
                          </h4>
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
                          <Badge className={getStatusBadgeColor(status)}>
                            {status === 'bot' && <Sparkles className="w-3 h-3 mr-1" />}
                            {status === 'human' && <UserCheck className="w-3 h-3 mr-1" />}
                            {getStatusLabel(status)}
                          </Badge>

                          {(conv.unreadCount || 0) > 0 && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
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
                      {getInitials(selectedConversation.title || selectedConversation.citizenName || 'U')}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="font-medium">
                      {selectedConversation.title || selectedConversation.citizenName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {getConversationStatus(selectedConversation) === 'bot'
                        ? 'Atendido por DigiBot'
                        : getConversationStatus(selectedConversation) === 'human'
                        ? 'Atendimento humano'
                        : 'Conversa encerrada'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getConversationStatus(selectedConversation) === 'bot' ? (
                    <Button size="sm" onClick={handleTakeOver} className="gap-2">
                      <UserCheck className="w-4 h-4" />
                      Assumir Conversa
                    </Button>
                  ) : getConversationStatus(selectedConversation) === 'human' ? (
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
                    disabled={!isConnected || selectedConversation.status === 'CLOSED'}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!isConnected || !newMessage.trim() || selectedConversation.status === 'CLOSED'}
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
          onConversationCreated={async (conversation) => {
            // Buscar ou criar conversa via hook
            const newConv = await findOrCreateConversation(
              conversation.id,
              conversation.type === 'SERVER' ? 'SERVER' : 'CITIZEN'
            );

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
