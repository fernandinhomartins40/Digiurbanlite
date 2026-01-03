'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Radio, Calendar } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  subscriberCount: number;
  messageCount: number;
  isSubscribed?: boolean;
}

interface ChannelMessage {
  id: string;
  channelId: string;
  title?: string;
  content: string;
  attachments?: any[];
  publishedAt: string;
  readCount: number;
  deliveredCount: number;
}

interface ChannelFeedProps {
  token: string;
  citizenId: string;
}

export default function ChannelFeed({ token, citizenId }: ChannelFeedProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'channels' | 'feed'>('channels');

  useEffect(() => {
    loadChannels();
  }, [token]);

  useEffect(() => {
    if (selectedChannel) {
      loadChannelMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  const loadChannels = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
      const response = await fetch(`${apiUrl}/channels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Buscar minhas inscrições
        const subsResponse = await fetch(`${apiUrl}/channels/my-subscriptions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (subsResponse.ok) {
          const subscriptions = await subsResponse.json();
          const subscribedIds = subscriptions.map((s: any) => s.channelId);

          const channelsWithSubs = data.map((ch: Channel) => ({
            ...ch,
            isSubscribed: subscribedIds.includes(ch.id),
          }));

          setChannels(channelsWithSubs);
        } else {
          setChannels(data);
        }
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChannelMessages = async (channelId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
      const response = await fetch(`${apiUrl}/channels/${channelId}/messages?limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading channel messages:', error);
    }
  };

  const handleSubscribe = async (channelId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
      const response = await fetch(`${apiUrl}/channels/${channelId}/subscribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setChannels(prev =>
          prev.map(ch => (ch.id === channelId ? { ...ch, isSubscribed: true } : ch))
        );
      }
    } catch (error) {
      console.error('Error subscribing to channel:', error);
    }
  };

  const handleUnsubscribe = async (channelId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
      const response = await fetch(`${apiUrl}/channels/${channelId}/unsubscribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setChannels(prev =>
          prev.map(ch => (ch.id === channelId ? { ...ch, isSubscribed: false } : ch))
        );
      }
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (view === 'channels') {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Radio size={24} />
            Canais Oficiais
          </h2>
          <p className="text-sm text-purple-100 mt-1">
            Receba atualizações dos serviços municipais
          </p>
        </div>

        {/* Channels Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  setSelectedChannel(channel);
                  setView('feed');
                }}
              >
                {/* Banner */}
                {channel.bannerUrl && (
                  <div className="w-full h-24 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={channel.bannerUrl}
                      alt={channel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Icon + Name */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xl flex-shrink-0">
                    {channel.iconUrl ? (
                      <img src={channel.iconUrl} alt="" className="w-full h-full rounded-full" />
                    ) : (
                      '📢'
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{channel.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{channel.description}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{channel.subscriberCount} inscritos</span>
                  <span>{channel.messageCount} mensagens</span>
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    channel.isSubscribed
                      ? handleUnsubscribe(channel.id)
                      : handleSubscribe(channel.id);
                  }}
                  className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    channel.isSubscribed
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {channel.isSubscribed ? (
                    <>
                      <BellOff size={16} />
                      Inscrito
                    </>
                  ) : (
                    <>
                      <Bell size={16} />
                      Inscrever-se
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {channels.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Radio size={48} className="mb-4 text-gray-300" />
              <p className="text-center">Nenhum canal disponível no momento</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View: Feed de mensagens do canal
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <button
          onClick={() => setView('channels')}
          className="text-sm mb-2 hover:underline flex items-center gap-1"
        >
          ← Voltar aos canais
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
            {selectedChannel?.iconUrl ? (
              <img
                src={selectedChannel.iconUrl}
                alt=""
                className="w-full h-full rounded-full"
              />
            ) : (
              '📢'
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{selectedChannel?.name}</h2>
            <p className="text-sm text-purple-100">{selectedChannel?.subscriberCount} inscritos</p>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Calendar size={48} className="mb-4 text-gray-300" />
            <p>Nenhuma mensagem publicada ainda</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
              {/* Title */}
              {msg.title && (
                <h3 className="text-lg font-bold text-gray-900 mb-2">{msg.title}</h3>
              )}

              {/* Content */}
              <p className="text-gray-700 whitespace-pre-wrap mb-3">{msg.content}</p>

              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {msg.attachments.map((att: any, idx: number) => (
                    <div key={idx} className="rounded-lg overflow-hidden">
                      {att.type === 'image' && (
                        <img src={att.url} alt="" className="w-full h-auto" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                <span>{formatDate(msg.publishedAt)}</span>
                <span>{msg.readCount} visualizações</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
