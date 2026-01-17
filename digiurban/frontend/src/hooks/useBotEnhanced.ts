'use client';

import { useState, useCallback } from 'react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: 'CITIZEN' | 'BOT';
  createdAt: string;
  messageType: string;
  metadata?: any;
}

export function useBotEnhanced() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Erro ao enviar mensagem');

      const data = await response.json();

      // Adiciona mensagem do usuário
      const userMsg: Message = {
        id: Date.now().toString(),
        content: message,
        senderId: 'user',
        senderType: 'CITIZEN',
        createdAt: new Date().toISOString(),
        messageType: 'text',
      };

      // Adiciona resposta do bot
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        senderId: 'bot',
        senderType: 'BOT',
        createdAt: new Date().toISOString(),
        messageType: data.messageType,
        metadata: data.metadata || {},
      };

      setMessages(prev => [...prev, userMsg, botMsg]);

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await fetch('/api/bot/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Erro ao fazer upload');

    return response.json();
  }, []);

  const startFlow = useCallback(async (flowName: string) => {
    const response = await fetch('/api/bot/start-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flowName }),
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Erro ao iniciar fluxo');

    return response.json();
  }, []);

  const cancelFlow = useCallback(async () => {
    const response = await fetch('/api/bot/cancel-flow', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Erro ao cancelar fluxo');

    return response.json();
  }, []);

  const rateConversation = useCallback(async (rating: number, comment?: string) => {
    const response = await fetch('/api/bot/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Erro ao avaliar');

    return response.json();
  }, []);

  const loadHistory = useCallback(async () => {
    const response = await fetch('/api/bot/history', {
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Erro ao carregar histórico');

    const data = await response.json();
    setMessages(data.messages);

    return data.messages;
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    uploadFiles,
    startFlow,
    cancelFlow,
    rateConversation,
    loadHistory,
  };
}

export default useBotEnhanced;
