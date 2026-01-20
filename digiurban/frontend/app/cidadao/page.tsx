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
  Hash,
  Users,
  User,
  Bot,
  Menu,
  LayoutDashboard,
  FileText,
  Folder,
  FileCheck,
  LogOut,
  Settings,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BottomNavigation } from '@/components/citizen/mobile/BottomNavigation';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: 'CITIZEN' | 'SERVER' | 'BOT' | 'SYSTEM';
  createdAt: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  messageType?: 'text' | 'card' | 'form' | 'quick_reply' | 'menu';
  metadata?: any;
}

interface Conversation {
  id: string;
  type: 'BOT' | 'DIRECT' | 'GROUP' | 'OFFICIAL';
  title: string;
  subtitle?: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  participants?: any[];
  avatar?: string;
  isPinned?: boolean;
  isBot?: boolean;
}

export default function CitizenDashboard() {
  const { citizen, isLoading: authLoading } = useCitizenAuth();
  const { logout } = useCitizenAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Conversa do Bot (sempre fixa no topo) - DEFINIR ANTES DOS ESTADOS
  const BOT_CONVERSATION: Conversation = {
    id: 'bot-digiurban',
    type: 'BOT',
    title: 'DigiBot',
    subtitle: 'Assistente Virtual',
    lastMessage: {
      content: 'Olá! Como posso ajudar você hoje?',
      createdAt: new Date().toISOString(),
      senderId: 'bot'
    },
    unreadCount: 0,
    avatar: '/bot-avatar.png',
    isPinned: true,
    isBot: true
  };

  // Estados - Inicializar conversas COM O BOT
  const [conversations, setConversations] = useState<Conversation[]>([BOT_CONVERSATION]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Não auto-selecionar mais - usuário escolhe da lista

  // Carregar mensagens quando uma conversa é selecionada
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Redirect se não autenticado
  useEffect(() => {
    if (!authLoading && !citizen) {
      router.push('/cidadao/login');
    }
  }, [citizen, authLoading, router]);

  // Conectar WebSocket
  useEffect(() => {
    if (!citizen) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

    socketRef.current = io(wsUrl, {
      auth: {
        userId: citizen.id,
        userType: 'CITIZEN',
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Conectado ao servidor de mensagens');
    });

    socketRef.current.on('message:new', (message: Message) => {
      if (selectedConversation && message.senderId !== citizen.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      fetchConversations();
    });

    socketRef.current.on('bot:response', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Desconectado do servidor de mensagens');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [citizen, selectedConversation]);

  // Carregar conversas
  const fetchConversations = async () => {
    if (!citizen) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/messages/conversations`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Adicionar bot no topo
        setConversations([BOT_CONVERSATION, ...(data.conversations || [])]);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      // Mesmo com erro, garantir que o bot apareça
      setConversations([BOT_CONVERSATION]);
    }
  };

  // Iniciar fluxo do bot
  const startBotFlow = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      console.log('🚀 [startBotFlow] Iniciando fluxo menu_principal...');

      const response = await fetch(`${apiUrl}/bot-flow/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ flowName: 'menu_principal' })
      });

      console.log('📡 [startBotFlow] Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 [startBotFlow] Resposta completa:', data);
        const botResponse = data.response;
        console.log('🤖 [startBotFlow] Bot response:', botResponse);

        setMessages([
          {
            id: `bot-${Date.now()}`,
            content: botResponse.message,
            senderId: 'bot',
            senderType: 'BOT',
            createdAt: new Date().toISOString(),
            status: 'READ',
            messageType: botResponse.options ? 'menu' : 'text',
            metadata: {
              options: botResponse.options,
              quickReplies: botResponse.options?.map((opt: any) => opt.label),
              needsInput: botResponse.needsInput
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Erro ao iniciar fluxo do bot:', error);
      // Mensagem de fallback
      setMessages([
        {
          id: '1',
          content: 'Olá! Sou o DigiBot, seu assistente virtual! 🤖\n\nEstou tendo dificuldades para conectar. Por favor, tente novamente em instantes.',
          senderId: 'bot',
          senderType: 'BOT',
          createdAt: new Date().toISOString(),
          status: 'READ',
          messageType: 'text'
        }
      ]);
    }
  };

  // Carregar mensagens
  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);

    // Se for o bot, carregar histórico do bot via SISTEMA DE FLUXOS
    if (conversationId === 'bot-digiurban') {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        console.log('🔍 [loadMessages] Buscando execução ativa...');

        // Tenta buscar execução ativa
        const response = await fetch(
          `${apiUrl}/bot-flow/active-execution`,
          { credentials: 'include' }
        );

        console.log('📡 [loadMessages] Status da resposta:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('📦 [loadMessages] Dados recebidos:', data);

          // Se há execução ativa, mostrar mensagem do fluxo
          if (data.execution && data.execution.currentState) {
            const state = data.execution.currentState;
            console.log('✅ [loadMessages] Execução ativa encontrada:', state);

            setMessages([
              {
                id: data.execution.id,
                content: state.message || 'Olá! Como posso ajudar você?',
                senderId: 'bot',
                senderType: 'BOT',
                createdAt: data.execution.updatedAt,
                status: 'READ',
                messageType: state.options ? 'menu' : 'text',
                metadata: {
                  options: state.options,
                  quickReplies: state.options?.map((opt: any) => opt.label),
                  needsInput: state.needsInput
                }
              }
            ]);
          } else {
            // Iniciar novo fluxo
            console.log('ℹ️ [loadMessages] Nenhuma execução ativa, iniciando novo fluxo...');
            await startBotFlow();
          }
        } else {
          // Iniciar novo fluxo
          console.log('⚠️ [loadMessages] Erro ao buscar execução, iniciando novo fluxo...');
          await startBotFlow();
        }
      } catch (error) {
        console.error('Erro ao carregar histórico do bot:', error);
        await startBotFlow();
      }
      setIsLoadingMessages(false);
      scrollToBottom();
      return;
    }

    // Conversa normal
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(
        `${apiUrl}/messages/conversations/${conversationId}/messages`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Selecionar conversa
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);

    if (isMobileView) {
      setShowConversationsList(false);
    }
  };

  // Enviar mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation || !citizen) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage.trim(),
      senderId: citizen.id,
      senderType: 'CITIZEN',
      createdAt: new Date().toISOString(),
      status: 'SENT',
      messageType: 'text'
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageContent = newMessage.trim();
    setNewMessage('');
    scrollToBottom();

    try {
      // Se for mensagem para o bot - USAR SISTEMA DE FLUXOS
      if (selectedConversation.id === 'bot-digiurban') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/bot-flow/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: messageContent })
        });

        if (response.ok) {
          const data = await response.json();
          const botResponse = data.response;

          console.log('📥 [page.tsx] Resposta do sistema de fluxos:', botResponse);

          setMessages(prev => [...prev, {
            id: `bot-${Date.now()}`,
            content: botResponse.message,
            senderId: 'bot',
            senderType: 'BOT',
            createdAt: new Date().toISOString(),
            status: 'READ',
            messageType: botResponse.options ? 'menu' : 'text',
            metadata: {
              options: botResponse.options,
              quickReplies: botResponse.options?.map((opt: any) => opt.label),
              needsInput: botResponse.needsInput
            }
          }]);
          scrollToBottom();
        }
      } else {
        // Mensagem normal via WebSocket
        socketRef.current?.emit('message:send', {
          conversationId: selectedConversation.id,
          content: messageContent,
        });
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

  // Scroll para o final
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Voltar para lista (mobile)
  const handleBackToList = () => {
    setShowConversationsList(true);
    setSelectedConversation(null);
    setMessages([]);
  };

  // Formatar hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Formatar data da conversa
  const formatConversationDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(dateString);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  // Carregar conversas iniciais
  useEffect(() => {
    if (citizen) {
      fetchConversations();
      // NÃO auto-selecionar - mostrar lista de conversas
    }
  }, [citizen]);

  // Auto-scroll quando novas mensagens chegam
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-white">
                  <AvatarFallback className="bg-white text-blue-600 font-bold">
                    {citizen?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <p className="font-semibold">{citizen?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-blue-100">Online</p>
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
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
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
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Nenhuma conversa</p>
            </div>
          ) : (
            conversations
              .filter(conv =>
                conv.title.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={cn(
                    "p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                    selectedConversation?.id === conversation.id && "bg-blue-50",
                    conversation.isBot && "bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-600"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className={cn(
                        "w-12 h-12",
                        conversation.isBot && "ring-2 ring-blue-600"
                      )}>
                        {conversation.isBot ? (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <>
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {conversation.title.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      {conversation.isBot && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            "font-medium truncate",
                            conversation.isBot && "text-blue-700 font-bold"
                          )}>
                            {conversation.title}
                          </h3>
                          {conversation.isBot && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              IA
                            </Badge>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatConversationDate(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      {conversation.subtitle && (
                        <p className="text-xs text-gray-500 mb-1">{conversation.subtitle}</p>
                      )}

                      {conversation.lastMessage && (
                        <p className={cn(
                          "text-sm truncate",
                          conversation.isBot ? "text-blue-600" : "text-gray-600"
                        )}>
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>

                    {conversation.unreadCount > 0 && (
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
              selectedConversation.isBot && "bg-gradient-to-r from-blue-600 to-purple-600"
            )}>
              <div className="flex items-center gap-3">
                {isMobileView && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToList}
                    className={selectedConversation.isBot ? "text-white hover:bg-white/20" : ""}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}

                <Avatar className={cn(
                  "w-10 h-10",
                  selectedConversation.isBot && "ring-2 ring-white"
                )}>
                  {selectedConversation.isBot ? (
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                  ) : (
                    <>
                      <AvatarImage src={selectedConversation.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedConversation.title.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                <div>
                  <h3 className={cn(
                    "font-medium flex items-center gap-2",
                    selectedConversation.isBot && "text-white"
                  )}>
                    {selectedConversation.title}
                    {selectedConversation.isBot && (
                      <Badge className="bg-white text-blue-600 text-xs">IA</Badge>
                    )}
                  </h3>
                  <p className={cn(
                    "text-xs",
                    selectedConversation.isBot ? "text-blue-100" : "text-gray-500"
                  )}>
                    {selectedConversation.isBot ? 'Sempre disponível' : 'Online'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!selectedConversation.isBot && (
                  <>
                    <Button variant="ghost" size="icon" className={selectedConversation.isBot ? "text-white hover:bg-white/20" : ""}>
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className={selectedConversation.isBot ? "text-white hover:bg-white/20" : ""}>
                      <Video className="w-5 h-5" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className={selectedConversation.isBot ? "text-white hover:bg-white/20" : ""}>
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
                    const isBot = message.senderType === 'BOT';
                    const showDate = index === 0 ||
                      new Date(messages[index - 1].createdAt).toDateString() !==
                      new Date(message.createdAt).toDateString();

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                              {new Date(message.createdAt).toLocaleDateString('pt-BR', {
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
                            {message.metadata?.quickReplies && message.metadata.quickReplies.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {message.metadata.quickReplies.map((reply: string, idx: number) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      console.log('🔘 [page.tsx] Botão clicado:', reply);
                                      setNewMessage(reply);
                                      // Auto-enviar a mensagem ao clicar
                                      setTimeout(() => {
                                        console.log('📤 [page.tsx] Auto-enviando mensagem:', reply);
                                        const form = document.querySelector('form');
                                        form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                                      }, 100);
                                    }}
                                    className="text-xs bg-white hover:bg-blue-50 border-blue-300 text-blue-700 hover:text-blue-800 hover:border-blue-400 transition-all shadow-sm"
                                  >
                                    <Sparkles className="w-3 h-3 mr-1.5" />
                                    {reply}
                                  </Button>
                                ))}
                              </div>
                            )}

                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">
                                {formatTime(message.createdAt)}
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
                  placeholder={selectedConversation.isBot ? "Pergunte ao DigiBot..." : "Digite uma mensagem..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />

                {newMessage.trim() ? (
                  <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Bem-vindo ao DigiUrban!</h3>
              <p className="text-sm text-gray-600 mb-6">
                Selecione uma conversa à esquerda ou clique no botão abaixo para conversar com o DigiBot
              </p>
              <Button
                onClick={() => handleSelectConversation(BOT_CONVERSATION)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Conversar com DigiBot
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Mobile - Mostrar apenas na lista de conversas */}
      {(!isMobileView || showConversationsList || !selectedConversation) && (
        <BottomNavigation />
      )}
    </div>
  );
}
