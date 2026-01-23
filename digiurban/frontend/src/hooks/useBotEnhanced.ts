/**
 * useBotEnhanced - Hook React para integração com DigiBot via UltraZend Messages
 *
 * VERSÃO INTEGRADA:
 * - Conecta ao WebSocket do UltraZend Messages Server (porta 9001)
 * - Recebe mensagens em tempo real
 * - Envia mensagens via WebSocket (não mais HTTP polling)
 * - Suporta todos os tipos de mensagens do bot (cards, quick replies, etc.)
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const ULTRAZEND_WS_URL = process.env.NEXT_PUBLIC_MESSAGES_WS_URL || 'http://localhost:9001';
const MESSAGES_API_URL = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: 'CITIZEN' | 'SYSTEM';
  createdAt: string;
  messageType: string;
  metadata?: any;
}

export function useBotEnhanced() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  /**
   * Conecta ao WebSocket do UltraZend
   */
  useEffect(() => {
    // Busca o token de autenticação (assumindo que está em cookie/localStorage)
    const token = getAuthToken();

    if (!token) {
      console.warn('[useBotEnhanced] Token não encontrado, WebSocket não será conectado');
      return;
    }

    // Conecta ao UltraZend Messages Server
    const socket = io(ULTRAZEND_WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Eventos de conexão
    socket.on('connect', () => {
      console.log('[useBotEnhanced] ✅ Conectado ao WebSocket');
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('[useBotEnhanced] ❌ Desconectado do WebSocket');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[useBotEnhanced] Erro de conexão:', err);
      setError('Erro ao conectar ao servidor de mensagens');
    });

    // Evento: Nova mensagem recebida
    socket.on('message:new', (message: Message) => {
      console.log('[useBotEnhanced] 📥 Nova mensagem recebida:', message);

      // Se for mensagem do bot (SYSTEM), adiciona à lista
      if (message.senderType === 'SYSTEM') {
        setMessages(prev => [...prev, message]);
      }
    });

    // Evento: Mensagem enviada com sucesso
    socket.on('message:sent', (message: Message) => {
      console.log('[useBotEnhanced] ✅ Mensagem enviada:', message);

      // Adiciona mensagem do cidadão à lista
      if (message.senderType === 'CITIZEN') {
        setMessages(prev => [...prev, message]);
      }
    });

    // Evento: Conversa do bot criada/encontrada
    socket.on('bot:conversation_ready', (data: { conversationId: string }) => {
      console.log('[useBotEnhanced] 🤖 Conversa do bot pronta:', data.conversationId);
      conversationIdRef.current = data.conversationId;
    });

    // Cleanup ao desmontar
    return () => {
      console.log('[useBotEnhanced] Desconectando WebSocket...');
      socket.disconnect();
    };
  }, []);

  /**
   * Envia uma mensagem via WebSocket
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Não conectado ao servidor');
      throw new Error('WebSocket não conectado');
    }

    setLoading(true);
    setError(null);

    try {
      // Se não tem conversationId, solicita ao servidor
      if (!conversationIdRef.current) {
        console.log('[useBotEnhanced] Solicitando conversa do bot...');
        socketRef.current.emit('bot:get_conversation');

        // Aguarda resposta (timeout 5s)
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout ao buscar conversa')), 5000);

          socketRef.current?.once('bot:conversation_ready', (data) => {
            clearTimeout(timeout);
            conversationIdRef.current = data.conversationId;
            resolve(data);
          });
        });
      }

      // Adiciona mensagem do usuário localmente (otimista)
      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        content: message,
        senderId: 'user',
        senderType: 'CITIZEN',
        createdAt: new Date().toISOString(),
        messageType: 'text',
      };
      setMessages(prev => [...prev, userMsg]);

      // Envia via WebSocket
      console.log('[useBotEnhanced] 📤 Enviando mensagem:', message);
      socketRef.current.emit('bot:send_message', {
        conversationId: conversationIdRef.current,
        content: message
      });

      // A resposta chegará via evento 'message:new'
      setLoading(false);
    } catch (err: any) {
      console.error('[useBotEnhanced] Erro ao enviar mensagem:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Upload de arquivos
   */
  const uploadFiles = useCallback(async (files: File[]) => {
    if (!conversationIdRef.current) {
      throw new Error('Nenhuma conversa ativa');
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('conversationId', conversationIdRef.current);

    const response = await fetch(`${MESSAGES_API_URL}/bot-flow/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Erro ao fazer upload');

    const result = await response.json();

    // Notifica o WebSocket sobre os arquivos
    socketRef.current?.emit('bot:files_uploaded', {
      conversationId: conversationIdRef.current,
      files: result.files
    });

    return result;
  }, []);

  /**
   * Carrega histórico de mensagens
   */
  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/bot-flow/active-execution`, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('[useBotEnhanced] Nenhuma execução ativa, iniciando conversa...');

        // Se não tem execução ativa, solicita conversa inicial via WebSocket
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('bot:get_conversation');
        }

        return [];
      }

      const data = await response.json();

      if (data.execution) {
        conversationIdRef.current = data.execution.id;
        // O histórico virá via WebSocket ou já está em execução

        // Se não tem conversationId mas socket conectado, solicita conversa
        if (!conversationIdRef.current && socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('bot:get_conversation');
        }
      }

      return [];
    } catch (error) {
      console.error('[useBotEnhanced] Erro ao carregar histórico:', error);

      // Em caso de erro, tenta iniciar conversa via WebSocket
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('bot:get_conversation');
      }

      return [];
    }
  }, []);

  /**
   * Marca mensagens como lidas
   */
  const markAsRead = useCallback(() => {
    if (socketRef.current && conversationIdRef.current) {
      socketRef.current.emit('bot:mark_read', {
        conversationId: conversationIdRef.current
      });
    }
  }, []);

  /**
   * Limpa o histórico local
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    error,
    connected,
    sendMessage,
    uploadFiles,
    loadHistory,
    markAsRead,
    clearMessages,
  };
}

/**
 * Helper para buscar token de autenticação
 */
function getAuthToken(): string | null {
  // Tenta buscar de localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) return token;

    // Tenta buscar de cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken' || name === 'token') {
        return value;
      }
    }
  }

  return null;
}

export default useBotEnhanced;
