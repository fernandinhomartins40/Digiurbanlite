'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Search, Filter } from 'lucide-react';

interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount1: number;
  unreadCount2: number;
  status: string;
  protocolId?: string;
}

interface ConversationListProps {
  token: string;
  currentUserId: string;
  currentUserType: 'CITIZEN' | 'SERVER';
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
}

export default function ConversationList({
  token,
  currentUserId,
  currentUserType,
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

  useEffect(() => {
    loadConversations();
  }, [token]);

  const loadConversations = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
      const response = await fetch(`${apiUrl}/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnreadCount = (conv: Conversation) => {
    return conv.participant1Id === currentUserId ? conv.unreadCount1 : conv.unreadCount2;
  };

  const filteredConversations = conversations.filter((conv) => {
    // Filtro de busca
    if (searchQuery && !conv.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filtro de status
    if (filter === 'unread' && getUnreadCount(conv) === 0) {
      return false;
    }

    if (filter === 'archived' && conv.status !== 'ARCHIVED') {
      return false;
    }

    if (filter === 'all' && conv.status === 'ARCHIVED') {
      return false;
    }

    return true;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle size={24} />
          Mensagens
        </h2>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-3 border-b bg-gray-50">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1 rounded-full text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1 rounded-full text-sm font-medium transition ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Não lidas
        </button>
        <button
          onClick={() => setFilter('archived')}
          className={`px-4 py-1 rounded-full text-sm font-medium transition ${
            filter === 'archived'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Arquivadas
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <MessageCircle size={48} className="mb-4 text-gray-300" />
            <p className="text-center">
              {searchQuery
                ? 'Nenhuma conversa encontrada'
                : 'Você ainda não tem conversas'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const unreadCount = getUnreadCount(conv);
            const isSelected = conv.id === selectedConversationId;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-4 border-b hover:bg-gray-50 transition text-left ${
                  isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {conv.protocolId ? '📋' : '👤'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conv.protocolId ? `Protocolo ${conv.protocolId.slice(0, 8)}` : 'Suporte'}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatDate(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {conv.lastMessagePreview || 'Sem mensagens'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full flex-shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Total de não lidas */}
      {conversations.some(conv => getUnreadCount(conv) > 0) && (
        <div className="p-3 border-t bg-blue-50 text-center text-sm text-blue-700 font-medium">
          {conversations.reduce((sum, conv) => sum + getUnreadCount(conv), 0)} mensagem(ns) não lida(s)
        </div>
      )}
    </div>
  );
}
