'use client';

import { useState, useEffect, useRef } from 'react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Mic,
  Plus,
  X,
  Menu,
  User,
  FileText,
  Folder,
  FileCheck,
  LogOut,
  Settings,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BottomNavigation } from '@/components/citizen/mobile/BottomNavigation';
import { NewConversationDialog } from '@/src/components/Messages/NewConversationDialog';

// Hook unificado
import { useConversations, Message, Conversation } from '@/src/hooks/useConversations';

// Helpers
import {
  formatTime,
  formatRelativeTime,
  getInitials,
  filterConversations,
} from '@/src/utils/conversationHelpers';

export default function CitizenDashboard() {
  const { citizen, isLoading: authLoading, logout } = useCitizenAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Estados
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook unificado de conversas
  const {
    conversations,
    socket,
    isConnected,
    loading,
    sendMessage,
    markConversationAsRead,
    findOrCreateConversation,
  } = useConversations({
    userId: citizen?.id || '',
    userType: 'CITIZEN',
    onNewMessage: (message, conversationId) => {
      // Se é mensagem para conversa selecionada, adicionar à lista
      if (selectedConversation?.id === conversationId) {
        setMessages(prev => (prev.some(item => item.id === message.id) ? prev : [...prev, message]));
        scrollToBottom();
        if (message.senderId !== citizen?.id) {
          markConversationAsRead(conversationId);
        }
      }
    },
  });

  // Itens do menu lateral
  const menuItems = [
    { name: 'Chat', href: '/cidadao', icon: MessageCircle },
    { name: 'Serviços', href: '/cidadao/servicos', icon: FileText },
    { name: 'Protocolos', href: '/cidadao/protocolos', icon: Folder },
    { name: 'Documentos', href: '/cidadao/documentos', icon: FileCheck },
    { name: 'Perfil', href: '/cidadao/perfil', icon: User },
    { name: 'Configurações', href: '/cidadao/mais', icon: Settings }
  ];

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirect se não autenticado
  useEffect(() => {
    if (!authLoading && !citizen) {
      router.push('/cidadao/login');
    }
  }, [citizen, authLoading, router]);

  // Carregar mensagens quando uma conversa é selecionada
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Auto-scroll quando novas mensagens chegam
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Iniciar fluxo do bot
   */
  const startBotFlow = async (conversationId: string) => {
    try {
      const messagesApiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
      await fetch(`${messagesApiUrl}/bot-flow/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ flowName: 'menu_principal', conversationId })
      });
    } catch (error) {
      console.error('Erro ao iniciar fluxo do bot:', error);
    }
  };

  /**
   * Carregar mensagens de uma conversa
   */
  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);

    const conv = conversations.find(c => c.id === conversationId);

    try {
      const messagesApiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
      const response = await fetch(
        `${messagesApiUrl}/conversations/${conversationId}/messages?limit=50`,
        { credentials: 'include' }
      );

      if (response.ok) {
        let data = await response.json();
        const normalized = Array.isArray(data) ? data : data.messages || [];

        if (conv?.isBotConversation && normalized.length === 0) {
          await startBotFlow(conversationId);

          const refreshResponse = await fetch(
            `${messagesApiUrl}/conversations/${conversationId}/messages?limit=50`,
            { credentials: 'include' }
          );

          if (refreshResponse.ok) {
            data = await refreshResponse.json();
          }
        }

        setMessages(Array.isArray(data) ? data : data.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  /**
   * Selecionar conversa
   */
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    markConversationAsRead(conversation.id);

    if (isMobileView) {
      setShowConversationsList(false);
    }

    // Entrar na sala via socket
    if (socket) {
      socket.emit('conversation:join', { conversationId: conversation.id });
    }
  };

  /**
   * Enviar mensagem
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation || !citizen) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    scrollToBottom();

    try {
      const conv = conversations.find(c => c.id === selectedConversation.id);

      // Se for mensagem para o bot - USAR SISTEMA DE FLUXOS
      if (conv?.isBotConversation) {
        const messagesApiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
        const response = await fetch(`${messagesApiUrl}/bot-flow/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: messageContent,
            conversationId: selectedConversation.id,
          })
        });

        if (response.ok) {
          const data = await response.json();

          if (data.userMessage) {
            setMessages(prev => (prev.some(item => item.id === data.userMessage.id) ? prev : [...prev, data.userMessage]));
          }

          if (data.botMessage) {
            setMessages(prev => (prev.some(item => item.id === data.botMessage.id) ? prev : [...prev, data.botMessage]));
          }

          scrollToBottom();
        }
      } else {
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          content: messageContent,
          senderId: citizen.id,
          senderType: 'CITIZEN',
          contentType: 'TEXT',
          sentAt: new Date().toISOString(),
          status: 'SENT',
          isEdited: false,
          isDeleted: false,
          conversationId: selectedConversation.id,
        };

        setMessages(prev => [...prev, tempMessage]);
        await sendMessage(selectedConversation.id, messageContent);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem',
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

  if (authLoading) {
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
                    {getInitials(citizen?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <p className="font-semibold">{citizen?.name?.split(' ')[0]}</p>
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
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
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
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
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
                DigiUrban
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
            filteredConversations.map((conversation) => (
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
                            {getInitials(conversation.title || '')}
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
                        {getInitials(selectedConversation.title || '')}
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
                {!selectedConversation.isBotConversation && (
                  <>
                    <Button variant="ghost" size="icon">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="w-5 h-5" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className={selectedConversation.isBotConversation ? "text-white hover:bg-white/20" : ""}>
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderId === citizen?.id;
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
                            <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>

                            {/* Quick Replies - Botões clicáveis */}
                            {(message as any).metadata?.options && (message as any).metadata.options.length > 0 && (
                              <div className="mt-3 flex flex-col gap-2">
                                {(message as any).metadata.options.map((option: any) => (
                                  <Button
                                    key={option.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      console.log('🔘 [page.tsx] Opção selecionada:', option);

                                      const userMsg: Message = {
                                        id: `temp-${Date.now()}`,
                                        content: option.label,
                                        senderId: citizen?.id || '',
                                        senderType: 'CITIZEN',
                                        contentType: 'TEXT',
                                        sentAt: new Date().toISOString(),
                                        status: 'SENT',
                                        isEdited: false,
                                        isDeleted: false,
                                        conversationId: selectedConversation.id,
                                      };
                                      setMessages(prev => [...prev, userMsg]);

                                      try {
                                        const messagesApiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
                                        const response = await fetch(`${messagesApiUrl}/bot-flow/message`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                          body: JSON.stringify({ message: option.id, conversationId: selectedConversation.id })
                                        });

                                        if (response.ok) {
                                          const data = await response.json();
                                          if (data.botMessage) {
                                            setMessages(prev => (prev.some(item => item.id === data.botMessage.id) ? prev : [...prev, data.botMessage]));
                                          }
                                          scrollToBottom();
                                        }
                                      } catch (error) {
                                        console.error('Erro ao enviar opção:', error);
                                      }
                                    }}
                                    className="text-sm bg-white hover:bg-blue-50 border-blue-300 text-blue-700 hover:text-blue-800 hover:border-blue-400 transition-all shadow-sm flex items-start justify-start text-left p-3"
                                  >
                                    <div className="flex-1">
                                      <div className="font-semibold flex items-center gap-2">
                                        {option.label}
                                      </div>
                                      {option.description && (
                                        <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                                      )}
                                    </div>
                                  </Button>
                                ))}
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
              {(() => {
                const lastMessage = messages[messages.length - 1];
                const hasActiveMenu = lastMessage &&
                                     (lastMessage.senderType === 'BOT' || lastMessage.senderType === 'SYSTEM') &&
                                     (lastMessage as any).metadata?.options &&
                                     (lastMessage as any).metadata.options.length > 0;

                const needsTextInput = lastMessage &&
                                      (lastMessage.senderType === 'BOT' || lastMessage.senderType === 'SYSTEM') &&
                                      (lastMessage as any).metadata?.needsInput &&
                                      (!(lastMessage as any).metadata?.options || (lastMessage as any).metadata.options.length === 0);

                if (hasActiveMenu) {
                  return (
                    <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto py-2">
                      <div className="text-center text-sm text-gray-500">
                        👆 Selecione uma das opções acima para continuar
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <Button type="button" variant="ghost" size="icon" className="text-gray-500">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="text-gray-500">
                      <Paperclip className="w-5 h-5" />
                    </Button>

                    <Input
                      type="text"
                      placeholder={
                        selectedConversation.isBotConversation && needsTextInput
                          ? "Digite sua resposta..."
                          : selectedConversation.isBotConversation
                          ? "Aguarde o DigiBot..."
                          : "Digite uma mensagem..."
                      }
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                      disabled={!isConnected}
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
                );
              })()}
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center p-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Bem-vindo ao DigiUrban!</h3>
              <p className="text-sm text-gray-600 mb-6">
                Selecione uma conversa à esquerda ou converse com o DigiBot
              </p>
              {conversations.find(c => c.isBotConversation) && (
                <Button
                  onClick={() => handleSelectConversation(conversations.find(c => c.isBotConversation)!)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Conversar com DigiBot
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Mobile */}
      {(!isMobileView || showConversationsList || !selectedConversation) && (
        <BottomNavigation />
      )}

      {/* Dialog de Nova Conversa */}
      {citizen && (
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













