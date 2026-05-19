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
  Sparkles,
  Users,
  UserCheck,
  Archive,
  Trash2,
  Eraser,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BottomNavigation } from '@/components/citizen/mobile/BottomNavigation';
import { NewConversationDialog } from '@/src/components/Messages/NewConversationDialog';
import { BotMessageRenderer } from '@/src/components/bot';

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
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'clear-for-me' | 'clear' | 'archive' | 'delete';
    conversationId: string;
    title: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previousMessageIdsRef = useRef<string[]>([]);
  const forceBottomOnNextMessagesRef = useRef(false);
  const botRequestInFlightRef = useRef(false);
  const MESSAGES_API_URL = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';

  type BotUploadItem = {
    docId?: string;
    documentType?: string;
    required?: boolean;
    file: File;
  };

  // Hook unificado de conversas (✅ COM BOT AUTO-INICIADO)
  const {
    conversations,
    socket,
    isConnected,
    loading,
    sendMessage,
    markConversationAsRead,
    findOrCreateConversation,
    loadConversations,
    ensureBotConversation, // ✅ NOVO
  } = useConversations({
    userId: citizen?.id || '',
    userType: 'CITIZEN',
    onNewMessage: (message, conversationId) => {
      // Se é mensagem para conversa selecionada, adicionar à lista
      if (selectedConversation?.id === conversationId) {
        setMessages(prev => (prev.some(item => item.id === message.id) ? prev : [...prev, message]));
        if (message.senderId !== citizen?.id) {
          markConversationAsRead(conversationId);
        }
      }

      // ✅ NOVO: Parar indicador de digitação do bot quando mensagem chegar
      if (message.senderId === 'DIGIBOT_SYSTEM') {
        setIsBotTyping(false);
      }
    },
  });

  // Itens do menu lateral
  const menuItems = [
    { name: 'Chat', href: '/cidadao', icon: MessageCircle },
    { name: 'Serviços', href: '/cidadao/servicos', icon: FileText },
    { name: 'Protocolos', href: '/cidadao/protocolos', icon: Folder },
    { name: 'Documentos', href: '/cidadao/documentos', icon: FileCheck },
    { name: 'Minha Família', href: '/cidadao/familia', icon: Users },
    { name: 'Perfil', href: '/cidadao/perfil', icon: User },
    { name: 'Mais', href: '/cidadao/mais', icon: Menu }
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

  // Não redirecionar em desktop: o chat do DigiBot precisa ser acessível em todas as telas.

  // Carregar mensagens quando uma conversa é selecionada
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Auto-scroll contextual: mensagens do cidadao vao ao fim; respostas do bot alinham no inicio do novo bloco.
  useEffect(() => {
    if (messages.length === 0) {
      previousMessageIdsRef.current = [];
      return;
    }

    const currentIds = messages.map((message) => message.id);
    const previousIds = previousMessageIdsRef.current;
    const previousSet = new Set(previousIds);
    const newMessages = messages.filter((message) => !previousSet.has(message.id));

    if (previousIds.length === 0 || forceBottomOnNextMessagesRef.current) {
      forceBottomOnNextMessagesRef.current = false;
      scrollToBottom('auto');
    } else if (newMessages.length > 0) {
      const firstBotMessage = newMessages.find(isSystemBotMessage);
      const lastNewMessage = newMessages[newMessages.length - 1];

      if (firstBotMessage) {
        scrollToMessage(firstBotMessage.id, 'start');
      } else if (lastNewMessage?.senderId === citizen?.id) {
        scrollToBottom();
      }
    }

    previousMessageIdsRef.current = currentIds;
  }, [messages, citizen?.id]);

  /**
   * ✅ NOVO: Auto-iniciar bot quando cidadão abre a página
   */
  useEffect(() => {
    if (citizen?.id && conversations.length > 0) {
      const botConv = conversations.find(c => c.isBotConversation);
      if (!botConv) {
        // Se não tem conversa com bot, criar
        console.log('[Cidadao] Bot não encontrado, criando...');
        ensureBotConversation();
      } else {
        // Selecionar conversa com bot automaticamente
        if (!selectedConversation) {
          setSelectedConversation(botConv);
          if (isMobileView) {
            setShowConversationsList(false);
          }
        }
      }
    }
  }, [citizen?.id, conversations.length, ensureBotConversation]);

  /**
   * Carregar mensagens de uma conversa
   */
  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);

    try {
      const response = await fetch(
        `${MESSAGES_API_URL}/conversations/${conversationId}/messages?limit=50`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        const normalized = Array.isArray(data) ? data : data.messages || [];
        forceBottomOnNextMessagesRef.current = true;
        setMessages(normalized);
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

  const handleBotMessage = async (payload: any) => {
    if (!selectedConversation) return;
    if (botRequestInFlightRef.current) return;

    botRequestInFlightRef.current = true;
    setIsBotTyping(true);

    try {
      const response = await fetch(`${MESSAGES_API_URL}/bot-flow/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: payload,
          conversationId: selectedConversation.id,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 401) {
          toast({
            variant: 'destructive',
            title: 'Sessao expirada',
            description: 'Sua sessao expirou. Faca login novamente.',
          });
          return;
        }
        throw new Error(`Erro ${status} ao enviar mensagem para o bot`);
      }

      const data = await response.json();

      if (data.userMessage) {
        setMessages((prev) =>
          prev.some((item) => item.id === data.userMessage.id)
            ? prev
            : [...prev, data.userMessage]
        );
      }

      if (data.botMessage) {
        setMessages((prev) =>
          prev.some((item) => item.id === data.botMessage.id)
            ? prev
            : [...prev, data.botMessage]
        );
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem para o bot:', error);
      const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch';
      toast({
        variant: 'destructive',
        title: isNetworkError ? 'Sem conexao' : 'Erro',
        description: isNetworkError
          ? 'Verifique sua conexao com a internet e tente novamente.'
          : 'Nao foi possivel enviar a mensagem. Tente novamente.',
      });
    } finally {
      botRequestInFlightRef.current = false;
      setIsBotTyping(false);
    }
  };

  const handleBotUpload = async (filesOrItems: File[] | BotUploadItem[]) => {
    if (!selectedConversation) return;
    if (botRequestInFlightRef.current) return;

    botRequestInFlightRef.current = true;
    setIsBotTyping(true);

    try {
      const formData = new FormData();
      const uploadItems = filesOrItems
        .map((item) => {
          if (item instanceof File) {
            return {
              file: item,
              docId: undefined,
              documentType: undefined,
              required: true,
            };
          }

          if (item?.file instanceof File) {
            return {
              file: item.file,
              docId: item.docId,
              documentType: item.documentType,
              required: item.required !== false,
            };
          }

          return null;
        })
        .filter(Boolean) as Array<{
        file: File;
        docId?: string;
        documentType?: string;
        required: boolean;
      }>;

      uploadItems.forEach(({ file }) => formData.append('files', file));
      formData.append(
        'fileMetadata',
        JSON.stringify(
          uploadItems.map(({ docId, documentType, required }) => ({
            docId,
            documentType,
            required,
          }))
        )
      );
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
        setMessages((prev) =>
          prev.some((item) => item.id === data.userMessage.id)
            ? prev
            : [...prev, data.userMessage]
        );
      }

      if (data.botMessage) {
        setMessages((prev) =>
          prev.some((item) => item.id === data.botMessage.id)
            ? prev
            : [...prev, data.botMessage]
        );
      }

    } catch (error) {
      console.error('Erro ao enviar arquivos para o bot:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nao foi possivel enviar os arquivos. Tente novamente.',
      });
    } finally {
      botRequestInFlightRef.current = false;
      setIsBotTyping(false);
    }
  };

  const handleBotInteraction = async (interaction: any) => {
    if (isBotTyping || botRequestInFlightRef.current) return;

    try {
      // Caso 1: Upload de arquivos (array de File ou payload estruturado do BotDocumentUpload)
      if (
        Array.isArray(interaction) &&
        interaction.length > 0 &&
        (interaction[0] instanceof File || interaction[0]?.file instanceof File)
      ) {
        await handleBotUpload(interaction);
        return;
      }

      // Determinar o tipo da última mensagem do bot para distinguir menu vs form
      const currentBotMessageType = lastBotMessage?.metadata?.messageType;

      if (interaction && typeof interaction === 'object' && !Array.isArray(interaction)) {
        // Caso 2: Opção de menu - enviar { optionId, label } para matching exato no FlowEngine
        if (currentBotMessageType === 'menu' && interaction.label) {
          if (interaction.id) {
            await handleBotMessage({
              optionId: interaction.id,
              label: interaction.label,
            });
          } else {
            await handleBotMessage(interaction.label);
          }
          return;
        }

        // Caso 3: Dados de formulário - enviar objeto completo
        if (currentBotMessageType === 'form') {
          await handleBotMessage(interaction);
          return;
        }

        // Caso 4: Fallback para objetos com label+id (menu sem messageType)
        if (interaction.label && interaction.id) {
          await handleBotMessage({
            optionId: interaction.id,
            label: interaction.label,
          });
          return;
        }
      }

      // Caso 5: Texto simples, localização ou qualquer outro tipo
      await handleBotMessage(interaction);
    } catch (error) {
      console.error('Erro ao processar interacao do bot:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nao foi possivel enviar a resposta para o bot',
      });
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

    try {
      const conv = conversations.find(c => c.id === selectedConversation.id);

      // Se for mensagem para o bot - USAR SISTEMA DE FLUXOS
      if (conv?.isBotConversation) {
        await handleBotMessage(messageContent);
      } else {
        // Não inserir mensagem "temp" aqui: o hook `useConversations.sendMessage()` já
        // dispara `onNewMessage` e evita duplicação com o evento `message:new`.
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
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }, 100);
  };

  const scrollToMessage = (messageId: string, block: ScrollLogicalPosition = 'start') => {
    setTimeout(() => {
      messageRefs.current[messageId]?.scrollIntoView({
        behavior: 'smooth',
        block,
        inline: 'nearest',
      });
    }, 100);
  };

  const isSystemBotMessage = (message: Message) =>
    message.senderId === 'DIGIBOT_SYSTEM' && message.senderType === 'SYSTEM';

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
  const lastBotMessage = [...messages]
    .reverse()
    .find((msg) => msg.senderId === 'DIGIBOT_SYSTEM' && msg.senderType === 'SYSTEM');
  const lastBotType = lastBotMessage?.metadata?.messageType;
  const botStructuredInput = Boolean(
    selectedConversation?.isBotConversation &&
      lastBotMessage?.metadata?.needsInput &&
      ['menu', 'form', 'upload', 'location'].includes(lastBotType || '')
  );
  const botInputHint = botStructuredInput
    ? 'Selecione ou preencha as informacoes acima para continuar'
    : '';
  const defaultPlaceholder = selectedConversation?.isBotConversation
    ? 'Digite sua mensagem...'
    : 'Digite uma mensagem...';
  const botInputPlaceholder = botStructuredInput
    ? lastBotType === 'menu'
      ? 'Selecione uma opcao acima...'
      : lastBotType === 'form'
      ? 'Preencha o formulario acima...'
      : lastBotType === 'upload'
      ? 'Envie os arquivos acima...'
      : lastBotType === 'location'
      ? 'Informe a localizacao acima...'
      : defaultPlaceholder
    : defaultPlaceholder;

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
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-800 via-blue-700 to-teal-700">
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
        <div className="p-4 border-b bg-gradient-to-r from-blue-800 via-blue-700 to-teal-700">
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
                Digiurban
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
                  conversation.isBotConversation && "bg-blue-50/70 border-l-4 border-l-teal-600"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className={cn(
                      "w-12 h-12",
                      conversation.isBotConversation && "ring-2 ring-blue-600"
                    )}>
                      {conversation.isBotConversation ? (
                        <div className="w-full h-full bg-gradient-to-br from-blue-700 to-teal-700 flex items-center justify-center">
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
              selectedConversation.isBotConversation && "bg-gradient-to-r from-blue-800 via-blue-700 to-teal-700"
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
                    <div className="w-full h-full bg-white/15 border border-white/25 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
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
                      <Badge className="bg-white/10 text-white border border-white/15 text-xs">IA</Badge>
                    )}
                  </h3>
                  <p className={cn(
                    "text-xs",
                    selectedConversation.isBotConversation ? "text-blue-50/90" : "text-gray-500"
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
            <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-2.5 bg-gradient-to-b from-blue-50/45 via-slate-50 to-teal-50/30">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="w-full min-w-0 overflow-hidden space-y-4">
                  {/* ✅ NOVO: Alert de status do bot */}
                  {selectedConversation.isBotConversation && selectedConversation.metadata?.botStatus === 'HUMAN_TAKEOVER' && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <UserCheck className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-900">Atendente humano conectado</AlertTitle>
                      <AlertDescription className="text-orange-700">
                        Um servidor assumiu sua conversa. Responderemos em breve!
                      </AlertDescription>
                    </Alert>
                  )}

                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderId === citizen?.id;
                    const isBot = message.senderId === 'DIGIBOT_SYSTEM' && message.senderType === 'SYSTEM';
                    const showDate = index === 0 ||
                      new Date(messages[index - 1].sentAt).toDateString() !==
                      new Date(message.sentAt).toDateString();

                    return (
                      <div
                        key={message.id}
                        ref={(node) => {
                          messageRefs.current[message.id] = node;
                        }}
                      >
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="bg-white px-3 py-1 rounded-md text-xs text-gray-500 shadow-sm">
                              {new Date(message.sentAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}

                        <div className={`flex w-full min-w-0 overflow-hidden ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          {isBot ? (
                            <div className="w-full min-w-0 max-w-full overflow-hidden space-y-2">
                              <div className="flex min-w-0 items-center gap-2 text-blue-800">
                                <Sparkles className="w-4 h-4 text-teal-700" />
                                <span className="text-xs font-semibold">DigiBot</span>
                              </div>
                              <BotMessageRenderer
                                message={message}
                                onInteraction={handleBotInteraction}
                                disabled={isBotTyping}
                              />
                              <div className="flex items-center justify-end gap-1 mt-1 text-gray-500">
                                <span className="text-xs">{formatTime(message.sentAt)}</span>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "max-w-[86%] min-w-0 overflow-hidden rounded-lg px-3 py-2 shadow-sm",
                                isOwnMessage
                                  ? 'bg-gradient-to-br from-blue-700 to-teal-700 text-white'
                                  : 'bg-white text-gray-900'
                              )}
                            >
                              <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${
                                isOwnMessage ? 'text-blue-50/85' : 'text-gray-500'
                              }`}>
                                <span className="text-xs">
                                  {formatTime(message.sentAt)}
                                </span>
                                {isOwnMessage && (
                                  message.status === 'READ' ? (
                                    <CheckCheck className="w-3 h-3 text-blue-50/85" />
                                  ) : message.status === 'DELIVERED' ? (
                                    <CheckCheck className="w-3 h-3" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Typing indicator */}
                  {isBotTyping && (
                    <div className="flex justify-start">
                      <div className="w-full min-w-0 overflow-hidden space-y-2">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Sparkles className="w-4 h-4 text-teal-700" />
                          <span className="text-xs font-semibold">DigiBot</span>
                        </div>
                        <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input de Mensagem */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
              {botStructuredInput && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="text-center text-sm text-gray-500">
                    {botInputHint}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-500"
                  disabled={!isConnected || botStructuredInput || isBotTyping}
                >
                  <Smile className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-500"
                  disabled={!isConnected || botStructuredInput}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>

                <Input
                  type="text"
                  placeholder={botInputPlaceholder}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  disabled={!isConnected || botStructuredInput}
                />

                {newMessage.trim() ? (
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-gradient-to-br from-blue-700 to-teal-700 hover:from-blue-800 hover:to-teal-800"
                    disabled={!isConnected || botStructuredInput || isBotTyping}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-500"
                    disabled={!isConnected || botStructuredInput}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-slate-50">
            <div className="text-center p-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-700 to-teal-700 rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Bem-vindo ao Digiurban!</h3>
              <p className="text-sm text-gray-600 mb-6">
                Selecione uma conversa à esquerda ou converse com o DigiBot
              </p>
              {conversations.find(c => c.isBotConversation) && (
                <Button
                  onClick={() => handleSelectConversation(conversations.find(c => c.isBotConversation)!)}
                  className="bg-gradient-to-br from-blue-700 to-teal-700 hover:from-blue-800 hover:to-teal-800"
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
