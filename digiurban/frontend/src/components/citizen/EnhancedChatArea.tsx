'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot } from 'lucide-react';
import { BotMessageRenderer } from '@/src/components/bot';
import { useBotEnhanced } from '@/src/hooks/useBotEnhanced';
import { TypingIndicator } from '@/src/components/bot/TypingIndicator';

export function EnhancedChatArea() {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const interactionInFlightRef = useRef(false);
  const {
    messages,
    loading,
    sendMessage,
    uploadFiles,
    loadHistory,
  } = useBotEnhanced();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || loading) return;
    const message = inputMessage;
    setInputMessage('');
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleInteraction = async (data: any) => {
    if (loading || interactionInFlightRef.current) return;
    interactionInFlightRef.current = true;

    let message = '';

    try {
      if (typeof data === 'string') {
        message = data;
      } else if (data instanceof Date) {
        message = data.toLocaleDateString('pt-BR');
      } else if (Array.isArray(data) && data.length > 0 && data[0] instanceof File) {
        const uploadPayload = data.map((file: File, index: number) => ({
          docId: `upload-${index}`,
          documentType: file.name,
          required: false,
          file,
        }));
        await uploadFiles(uploadPayload);
        return;
      } else if (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0] &&
        typeof data[0] === 'object' &&
        data[0].file instanceof File
      ) {
        await uploadFiles(data);
        return;
      } else if (data.formattedAddress) {
        message = data.formattedAddress;
      } else {
        message = JSON.stringify(data);
      }

      if (message) {
        await sendMessage(message);
      }
    } catch (error) {
      console.error('Erro na interacao do bot:', error);
    } finally {
      interactionInFlightRef.current = false;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-4 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Bot className="w-7 h-7 text-blue-600" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-semibold text-lg leading-tight">DigiBot</h2>
            <p className="text-blue-100 text-sm leading-tight">Assistente Virtual • Online</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Olá! Sou o DigiBot</h3>
            <p className="text-gray-500">Como posso ajudar você hoje?</p>
          </div>
        )}

        {messages.map((message: any) => (
          <div
            key={message.id}
            className={`flex w-full ${
              message.senderType === 'CITIZEN' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.senderId === 'DIGIBOT_SYSTEM' && message.senderType === 'SYSTEM' ? (
              // Mensagens do bot ocupam a largura total disponível
              <div className="w-full min-w-0 overflow-hidden">
                <BotMessageRenderer
                  message={message}
                  onInteraction={handleInteraction}
                  disabled={loading}
                />
              </div>
            ) : (
              // Mensagens do cidadão ficam alinhadas à direita com largura máxima
              <div className="max-w-[78%] min-w-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl px-4 py-3 shadow-md">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                <span className="text-xs text-blue-100 mt-1 block text-right">
                  {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-3 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 text-sm"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || loading}
            className="shrink-0 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnhancedChatArea;
