'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Paperclip, Smile, MoreVertical } from 'lucide-react';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'CITIZEN' | 'SERVER';
  content: string;
  contentType: string;
  attachments?: any[];
  status: string;
  sentAt: string;
  readAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  token: string;
  currentUserId: string;
  currentUserType: 'CITIZEN' | 'SERVER';
}

export default function ChatWindow({
  conversationId,
  token,
  currentUserId,
  currentUserType,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Conectar ao WebSocket
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_MESSAGES_WS_URL || 'http://localhost:9001';

    const newSocket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to messages server');

      // Entrar na sala da conversa
      newSocket.emit('conversation:join', { conversationId }, (response: any) => {
        if (response?.error) {
          console.error('Error joining conversation:', response.error);
        }
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from messages server');
    });

    // Receber nova mensagem
    newSocket.on('message:new', (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);

        // Marcar como lida se não for minha
        if (data.message.senderId !== currentUserId) {
          newSocket.emit('message:read', {
            messageId: data.message.id,
            conversationId,
          });
        }
      }
    });

    // Indicador de digitação
    newSocket.on('typing:start', (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setIsTyping(true);
      }
    });

    newSocket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setIsTyping(false);
      }
    });

    // Mensagem lida
    newSocket.on('message:read', (data: { messageId: string; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === data.messageId
              ? { ...msg, status: 'READ', readAt: new Date().toISOString() }
              : msg
          )
        );
      }
    });

    setSocket(newSocket);

    // Carregar mensagens anteriores
    loadMessages();

    return () => {
      newSocket.emit('conversation:leave', { conversationId });
      newSocket.close();
    };
  }, [conversationId, token]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Carregar mensagens
  const loadMessages = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
      const response = await fetch(
        `${apiUrl}/conversations/${conversationId}/messages?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Enviar mensagem
  const sendMessage = () => {
    if (!inputMessage.trim() || !socket) return;

    socket.emit(
      'message:send',
      {
        conversationId,
        content: inputMessage.trim(),
      },
      (response: any) => {
        if (response?.error) {
          console.error('Error sending message:', response.error);
        } else {
          setInputMessage('');

          // Parar indicador de digitação
          socket.emit('typing:stop', { conversationId });
        }
      }
    );
  };

  // Indicador de digitação
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (!socket) return;

    // Emitir typing:start
    socket.emit('typing:start', { conversationId });

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emitir typing:stop após 2 segundos de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId });
    }, 2000);
  };

  // Formatar hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div>
          <h3 className="font-semibold text-lg">Chat</h3>
          <p className="text-xs text-blue-100">
            {isConnected ? (
              <>
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                Online
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                Conectando...
              </>
            )}
          </p>
        </div>
        <button className="p-2 hover:bg-blue-800 rounded-full transition">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                  isOwn
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <p className="text-sm break-words">{message.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
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

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
            <Paperclip size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
            <Smile size={20} />
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !isConnected}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
