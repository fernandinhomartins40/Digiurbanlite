'use client';

import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
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
  PauseCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  citizenName: string;
  citizenId: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  status: 'bot' | 'human' | 'closed';
  avatar?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'citizen' | 'admin' | 'bot';
  timestamp: string;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'bot' | 'human' | 'closed'>('all');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [botPaused, setBotPaused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<Stats>({
    totalConversations: 127,
    activeConversations: 23,
    botConversations: 18,
    humanConversations: 5,
    averageResponseTime: '2m 15s',
    satisfactionRate: 4.7
  });

  // Mock data
  const mockConversations: Conversation[] = [
    {
      id: '1',
      citizenName: 'João Silva',
      citizenId: 'cit-1',
      lastMessage: 'Preciso de ajuda com meu protocolo',
      timestamp: new Date().toISOString(),
      unreadCount: 2,
      status: 'bot',
      avatar: undefined
    },
    {
      id: '2',
      citizenName: 'Maria Santos',
      citizenId: 'cit-2',
      lastMessage: 'Gostaria de solicitar um serviço',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      unreadCount: 0,
      status: 'human',
      avatar: undefined
    },
    {
      id: '3',
      citizenName: 'Pedro Oliveira',
      citizenId: 'cit-3',
      lastMessage: 'Obrigado pela ajuda!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      unreadCount: 0,
      status: 'closed',
      avatar: undefined
    }
  ];

  useEffect(() => {
    setConversations(mockConversations);
  }, []);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Carregar mensagens
    setMessages([
      {
        id: '1',
        content: 'Olá! Como posso ajudar?',
        sender: 'citizen',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        senderName: conversation.citizenName
      },
      {
        id: '2',
        content: 'Olá! Vou te ajudar com isso.',
        sender: conversation.status === 'bot' ? 'bot' : 'admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        senderName: conversation.status === 'bot' ? 'DigiBot' : 'Atendente'
      }
    ]);

    if (isMobileView) {
      setShowConversationsList(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'admin',
      timestamp: new Date().toISOString(),
      senderName: 'Você'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleTakeOver = () => {
    if (!selectedConversation) return;

    setSelectedConversation({
      ...selectedConversation,
      status: 'human'
    });

    setBotPaused(true);

    toast({
      title: 'Atendimento assumido',
      description: 'Você assumiu a conversa. O bot foi pausado.',
    });
  };

  const handleHandBackToBot = () => {
    if (!selectedConversation) return;

    setSelectedConversation({
      ...selectedConversation,
      status: 'bot'
    });

    setBotPaused(false);

    toast({
      title: 'Conversa retornada ao bot',
      description: 'O DigiBot voltou a atender esta conversa.',
    });
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

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.citizenName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'bot' && conv.status === 'bot') ||
      (activeTab === 'human' && conv.status === 'human') ||
      (activeTab === 'closed' && conv.status === 'closed');

    return matchesSearch && matchesTab;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie conversas e atendimentos
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
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
                {Math.round((stats.botConversations / stats.activeConversations) * 100)}% do total ativo
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
                +0.3 vs mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

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
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
                  <TabsTrigger value="bot" className="text-xs">IA</TabsTrigger>
                  <TabsTrigger value="human" className="text-xs">Humano</TabsTrigger>
                  <TabsTrigger value="closed" className="text-xs">Fechadas</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Lista */}
            <ScrollArea className="flex-1">
              {filteredConversations.map((conv) => (
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
                        {conv.citizenName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">{conv.citizenName}</h4>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(conv.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 truncate mb-1">
                        {conv.lastMessage}
                      </p>

                      <div className="flex items-center gap-2">
                        {conv.status === 'bot' ? (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            IA
                          </Badge>
                        ) : conv.status === 'human' ? (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Humano
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 text-xs">
                            Fechada
                          </Badge>
                        )}

                        {conv.unreadCount > 0 && (
                          <Badge className="bg-blue-600 text-white text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                        {selectedConversation.citizenName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="font-medium">{selectedConversation.citizenName}</h3>
                      <p className="text-xs text-gray-500">
                        {selectedConversation.status === 'bot'
                          ? 'Atendido por DigiBot'
                          : selectedConversation.status === 'human'
                          ? 'Atendimento humano'
                          : 'Conversa encerrada'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedConversation.status === 'bot' ? (
                      <Button size="sm" onClick={handleTakeOver} className="gap-2">
                        <UserCheck className="w-4 h-4" />
                        Assumir Conversa
                      </Button>
                    ) : selectedConversation.status === 'human' ? (
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
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {messages.map((message) => {
                      const isOwn = message.sender === 'admin';
                      const isBot = message.sender === 'bot';

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
                              <p className="text-xs font-semibold mb-1">
                                {message.senderName}
                              </p>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              isOwn ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input de Mensagem */}
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Digite uma mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon">
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
      </div>
    </AdminLayout>
  );
}
