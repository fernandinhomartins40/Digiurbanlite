'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  Search,
  Bot,
  CheckCheck,
  Check,
  MoreVertical,
  ArrowLeft,
  UserCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BotMessageRenderer } from '@/src/components/bot';

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

interface MessagesInterfaceProps {
  userId: string;
  userType: 'CITIZEN' | 'SERVER';
  mode: 'citizen' | 'admin';
  showStats?: boolean;
  showManagement?: boolean;
}

export function MessagesInterface({
  userId,
  userType,
  mode,
  showStats = false,
  showManagement = false,
}: MessagesInterfaceProps) {
  const { toast } = useToast();

  // Estados locais
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MESSAGES_API_URL = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';

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
    userId,
    userType,
    onNewMessage: (message, conversationId) => {
      // Se é mensagem para conversa selecionada, adicionar à lista
      if (selectedConversation?.id === conversationId) {
        setMessages((prev) => (prev.some(item => item.id === message.id) ? prev : [...prev, message]));
        scrollToBottom();

        if (message.senderId !== userId) {
          markConversationAsRead(conversationId);
        }
      }
    },
  });

  // Detectar mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll para o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar mensagens da conversa selecionada
  const loadMessages = async (conversation: Conversation) => {
    if (!conversation) return;

    setLoadingMessages(true);
    try {
      const response = await fetch(
        `${MESSAGES_API_URL}/conversations/${conversation.id}/messages`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar mensagens');
      }

      let data = await response.json();

      if (conversation.isBotConversation && mode === 'citizen' && data.length === 0) {
        await fetch(`${MESSAGES_API_URL}/bot-flow/start`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flowName: 'menu_principal', conversationId: conversation.id }),
        });

        const refreshResponse = await fetch(
          `${MESSAGES_API_URL}/conversations/${conversation.id}/messages`,
          { credentials: 'include' }
        );

        if (refreshResponse.ok) {
          data = await refreshResponse.json();
        }
      }

      setMessages(data);

      // Entrar na sala da conversa via socket
      if (socket) {
        socket.emit('conversation:join', { conversationId: conversation.id });
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as mensagens',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Selecionar conversa
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation);
    markConversationAsRead(conversation.id);
    if (isMobileView) {
      setShowConversationsList(false);
    }
  };

  // Voltar para lista (mobile)
  const handleBackToList = () => {
    setSelectedConversation(null);
    setShowConversationsList(true);
    setMessages([]);
  };

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      // Se é bot e modo cidadão, enviar via bot-flow
      if (selectedConversation.isBotConversation && mode === 'citizen') {
        await handleBotMessage(content);
      } else {
        await sendMessage(selectedConversation.id, content);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  // Enviar mensagem para o bot
  const handleBotMessage = async (payload: any) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(`${MESSAGES_API_URL}/bot-flow/message`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          message: payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem para o bot');
      }

      const data = await response.json();

      if (data.userMessage) {
        setMessages((prev) => (prev.some(item => item.id === data.userMessage.id) ? prev : [...prev, data.userMessage]));
      }

      if (data.botMessage) {
        setMessages((prev) => (prev.some(item => item.id === data.botMessage.id) ? prev : [...prev, data.botMessage]));
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem para o bot:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar mensagem para o bot',
        variant: 'destructive',
      });
    }
  };

  const handleBotUpload = async (files: File[]) => {
    if (!selectedConversation) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('conversationId', selectedConversation.id);

    const response = await fetch(`${MESSAGES_API_URL}/bot-flow/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar arquivos');
    }

    const data = await response.json();

    if (data.userMessage) {
      setMessages((prev) => (prev.some(item => item.id === data.userMessage.id) ? prev : [...prev, data.userMessage]));
    }

    if (data.botMessage) {
      setMessages((prev) => (prev.some(item => item.id === data.botMessage.id) ? prev : [...prev, data.botMessage]));
    }
  };

  const handleBotInteraction = async (interaction: any) => {
    try {
      if (Array.isArray(interaction) && interaction.length > 0 && interaction[0] instanceof File) {
        await handleBotUpload(interaction);
        return;
      }

      if (interaction && typeof interaction === 'object' && !Array.isArray(interaction)) {
        if (interaction.label && interaction.id) {
          await handleBotMessage(interaction.label);
          return;
        }
      }

      await handleBotMessage(interaction);
    } catch (err: any) {
      console.error('Erro ao processar interacao do bot:', err);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel enviar a resposta para o bot',
        variant: 'destructive',
      });
    }
  };

  // Assumir conversa (Admin)
  const handleTakeOver = async () => {
    if (!selectedConversation || !showManagement) return;

    try {
      await fetch(`${MESSAGES_API_URL}/bot-flow/pause`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          citizenId: selectedConversation.participant1Id,
        }),
      });

      await sendMessage(selectedConversation.id, 'Um atendente assumiu a conversa.');
      await loadConversations();
      toast({
        title: 'Sucesso',
        description: 'Você assumiu a conversa',
      });
    } catch (error) {
      console.error('Erro ao assumir conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível assumir a conversa',
        variant: 'destructive',
      });
    }
  };

  // Devolver ao bot (Admin)
  const handleHandBackToBot = async () => {
    if (!selectedConversation || !showManagement) return;

    try {
      await fetch(`${MESSAGES_API_URL}/bot-flow/resume`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          citizenId: selectedConversation.participant1Id,
        }),
      });

      await sendMessage(selectedConversation.id, 'Conversa devolvida ao DigiBot.');
      await loadConversations();
      toast({
        title: 'Sucesso',
        description: 'Conversa devolvida ao bot',
      });
    } catch (error) {
      console.error('Erro ao devolver conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível devolver a conversa',
        variant: 'destructive',
      });
    }
  };

  // Filtrar conversas
  const filteredConversations = filterConversations(conversations, searchQuery);

  // Status da conversa
  const conversationStatus = selectedConversation
    ? getConversationStatus(selectedConversation)
    : null;

  const isConversationClosed = selectedConversation?.status === 'CLOSED';
  const lastBotMessage = [...messages]
    .reverse()
    .find((msg) => msg.senderId === 'DIGIBOT_SYSTEM' && msg.senderType === 'SYSTEM');
  const lastBotType = lastBotMessage?.metadata?.messageType;
  const botStructuredInput =
    mode === 'citizen' &&
    lastBotMessage?.metadata?.needsInput &&
    ['menu', 'form', 'upload', 'location'].includes(lastBotType || '');
  const botInputHint = botStructuredInput
    ? 'Selecione ou preencha as informacoes acima para continuar'
    : '';
  const botInputPlaceholder = botStructuredInput
    ? lastBotType === 'menu'
      ? 'Selecione uma opcao acima...'
      : lastBotType === 'form'
      ? 'Preencha o formulario acima...'
      : lastBotType === 'upload'
      ? 'Envie os arquivos acima...'
      : lastBotType === 'location'
      ? 'Informe a localizacao acima...'
      : 'Aguarde a resposta acima...'
    : 'Digite sua mensagem...';

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-gray-50">
      {/* ERRO */}
      {error && (
        <div className="absolute top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* LISTA DE CONVERSAS */}
      <div
        className={cn(
          'bg-white border-r flex flex-col transition-all duration-200',
          isMobileView
            ? showConversationsList
              ? 'w-full'
              : 'hidden'
            : 'w-80'
        )}
      >
        {/* Header da lista */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Conversas</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {isConnected ? '🟢 Online' : '🔴 Offline'}
              </Badge>
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </div>

        {/* Lista */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <MessageCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">Nenhuma conversa</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conv) => {
                const status = getConversationStatus(conv);
                const isBot = conv.isBotConversation || conv.isBot;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      'w-full p-4 hover:bg-gray-50 transition-colors text-left',
                      selectedConversation?.id === conv.id &&
                        'bg-blue-50 border-l-4 border-blue-600'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className={cn(isBot && 'ring-2 ring-blue-500')}>
                          <AvatarImage src={conv.avatar} />
                          <AvatarFallback
                            className={cn(
                              'text-sm font-medium',
                              isBot && 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                            )}
                          >
                            {isBot ? (
                              <Sparkles className="w-4 h-4" />
                            ) : (
                              getInitials(conv.title || 'U')
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {isBot && status === 'bot' && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">{conv.title || 'Sem nome'}</p>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {conv.lastMessageAt
                              ? formatRelativeTime(conv.lastMessageAt)
                              : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 truncate flex-1">
                            {conv.lastMessagePreview || 'Sem mensagens'}
                          </p>

                          {/* Badge de status */}
                          {isBot && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                status === 'bot' && 'bg-purple-100 text-purple-700',
                                status === 'human' && 'bg-orange-100 text-orange-700'
                              )}
                            >
                              {status === 'bot' ? (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  IA
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Humano
                                </>
                              )}
                            </Badge>
                          )}

                          {/* Badge de não lidas */}
                          {(conv.unreadCount || 0) > 0 && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ÁREA DE CHAT */}
      <div
        className={cn(
          'flex flex-col flex-1 bg-white',
          isMobileView && !showConversationsList ? 'flex' : isMobileView ? 'hidden' : 'flex'
        )}
      >
        {selectedConversation ? (
          <>
            {/* Header do chat */}
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                {isMobileView && (
                  <Button variant="ghost" size="sm" onClick={handleBackToList}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}

                <Avatar>
                  <AvatarImage src={selectedConversation.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {selectedConversation.isBot ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      getInitials(selectedConversation.title || 'U')
                    )}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-medium">{selectedConversation.title || 'Sem nome'}</p>
                  {conversationStatus && (
                    <p className="text-xs text-gray-500">
                      {conversationStatus === 'bot' && 'Atendido por DigiBot'}
                      {conversationStatus === 'human' && 'Atendimento humano'}
                      {conversationStatus === 'closed' && 'Conversa encerrada'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Botões de gerenciamento (Admin) */}
                {showManagement && conversationStatus === 'bot' && (
                  <Button size="sm" variant="outline" onClick={handleTakeOver}>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assumir
                  </Button>
                )}
                {showManagement && conversationStatus === 'human' && (
                  <Button size="sm" variant="outline" onClick={handleHandBackToBot}>
                    <Bot className="w-4 h-4 mr-2" />
                    Devolver ao Bot
                  </Button>
                )}

                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Envie uma mensagem para iniciar a conversa
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === userId;
                    const isBot = message.senderId === 'DIGIBOT_SYSTEM' && message.senderType === 'SYSTEM';

                    return (
                      <div
                        key={message.id || index}
                        className={cn('flex gap-2', isOwn && 'flex-row-reverse')}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback
                            className={cn(
                              'text-xs',
                              isBot && 'bg-gradient-to-br from-purple-500 to-blue-500 text-white',
                              isOwn && !isBot && 'bg-blue-600 text-white',
                              !isOwn && !isBot && 'bg-gray-300 text-gray-700'
                            )}
                          >
                            {isBot ? (
                              <Sparkles className="w-3 h-3" />
                            ) : (
                              getInitials(message.senderName || 'U')
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col gap-2 max-w-[70%]">
                          {isBot ? (
                            <div className="space-y-2">
                              <BotMessageRenderer
                                message={message}
                                onInteraction={handleBotInteraction}
                              />
                              <span className="text-xs text-gray-500">
                                {formatTime(message.sentAt)}
                              </span>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                'rounded-lg p-3',
                                isOwn && !isBot && 'bg-blue-600 text-white',
                                !isOwn && !isBot && 'bg-gray-100'
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <div
                                className={cn(
                                  'flex items-center gap-1 mt-1',
                                  isOwn ? 'justify-end' : 'justify-start'
                                )}
                              >
                                <span
                                  className={cn(
                                    'text-xs',
                                    isOwn ? 'text-white/70' : 'text-gray-500'
                                  )}
                                >
                                  {formatTime(message.sentAt)}
                                </span>
                                {isOwn && message.status === 'READ' && (
                                  <CheckCheck className="w-3 h-3 text-blue-300" />
                                )}
                                {isOwn && message.status !== 'READ' && (
                                  <Check className="w-3 h-3 text-white/70" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input de mensagem */}
            <div className="p-4 border-t bg-white">
              {isConversationClosed ? (
                <div className="text-center text-sm text-gray-500 py-2">
                  Esta conversa foi encerrada
                </div>
              ) : (
                <>
                  {botStructuredInput && (
                    <div className="mb-2 text-xs text-center text-blue-600 bg-blue-50 py-1 px-3 rounded">
                      {botInputHint}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder={botInputPlaceholder}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={!isConnected || botStructuredInput}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        !newMessage.trim() ||
                        !isConnected ||
                        botStructuredInput
                      }
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {mode === 'citizen' ? 'Bem-vindo ao DigiUrban' : 'Selecione uma conversa'}
            </h3>
            <p className="text-sm text-center max-w-md">
              {mode === 'citizen'
                ? 'Converse com nosso assistente inteligente ou selecione uma conversa ao lado'
                : 'Escolha uma conversa da lista para visualizar as mensagens'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
