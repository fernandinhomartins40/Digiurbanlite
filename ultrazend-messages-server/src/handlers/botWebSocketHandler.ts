/**
 * Bot WebSocket Handler
 *
 * Handler específico para eventos do DigiBot via WebSocket.
 * Processa mensagens do bot e encaminha para o ConversationFlowManager do backend DigiUrban.
 */

import { Socket } from 'socket.io';
import axios from 'axios';

const DIGIURBAN_API_URL = process.env.DIGIURBAN_API_URL || 'http://localhost:3001';
const MESSAGES_SERVICE_TOKEN = process.env.MESSAGES_SERVICE_TOKEN || 'ultrazend-messages-service-token-change-in-production';

interface BotMessageData {
  conversationId?: string;
  content: string;
}

interface BotFilesData {
  conversationId: string;
  files: Array<{
    filename: string;
    url: string;
    size: number;
    mimetype: string;
  }>;
}

/**
 * Registra os handlers de eventos do bot para um socket
 */
export function registerBotHandlers(socket: Socket, userId: string) {
  console.log(`[BotWSHandler] Registrando handlers do bot para socket ${socket.id} (user: ${userId})`);

  /**
   * bot:get_conversation
   * Busca ou cria uma conversa do bot para o cidadão
   */
  socket.on('bot:get_conversation', async () => {
    try {
      console.log(`[BotWSHandler] bot:get_conversation - Cidadão: ${userId}`);

      const response = await axios.post(
        `${DIGIURBAN_API_URL}/api/bot/conversation`,
        { citizenId: userId },
        {
          headers: {
            'Authorization': `Bearer ${MESSAGES_SERVICE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const conversationId = response.data.conversationId;

      // Entra na sala da conversa
      socket.join(`conversation:${conversationId}`);

      // Notifica o cliente
      socket.emit('bot:conversation_ready', { conversationId });

      console.log(`[BotWSHandler] Conversa do bot criada/encontrada: ${conversationId}`);
    } catch (error: any) {
      console.error('[BotWSHandler] Erro ao buscar conversa do bot:', error.message);
      socket.emit('bot:error', {
        message: 'Erro ao criar conversa com o bot',
        code: 'BOT_CONVERSATION_ERROR'
      });
    }
  });

  /**
   * bot:send_message
   * Envia uma mensagem do cidadão para o bot
   */
  socket.on('bot:send_message', async (data: BotMessageData) => {
    try {
      const { conversationId, content } = data;

      if (!conversationId || !content) {
        socket.emit('bot:error', {
          message: 'conversationId e content são obrigatórios',
          code: 'INVALID_DATA'
        });
        return;
      }

      console.log(`[BotWSHandler] bot:send_message - Conversa: ${conversationId}`);

      // Envia para o backend DigiUrban processar
      const response = await axios.post(
        `${DIGIURBAN_API_URL}/api/bot/message`,
        {
          conversationId,
          citizenId: userId,
          message: content
        },
        {
          headers: {
            'Authorization': `Bearer ${MESSAGES_SERVICE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      // As mensagens (cidadão + bot) já foram salvas no banco pelo backend
      // Agora precisamos notificar via WebSocket

      const { userMessage, botMessage } = response.data;

      // Emite mensagem do cidadão
      socket.emit('message:sent', userMessage);

      // Emite mensagem do bot
      socket.emit('message:new', botMessage);

      // Também envia para a sala da conversa (se houver outros conectados)
      socket.to(`conversation:${conversationId}`).emit('message:new', userMessage);
      socket.to(`conversation:${conversationId}`).emit('message:new', botMessage);

      console.log(`[BotWSHandler] Mensagens enviadas e resposta do bot recebida`);
    } catch (error: any) {
      console.error('[BotWSHandler] Erro ao processar mensagem do bot:', error.message);
      socket.emit('bot:error', {
        message: 'Erro ao processar mensagem',
        code: 'BOT_MESSAGE_ERROR',
        details: error.response?.data || error.message
      });
    }
  });

  /**
   * bot:files_uploaded
   * Notifica o backend sobre arquivos anexados
   */
  socket.on('bot:files_uploaded', async (data: BotFilesData) => {
    try {
      const { conversationId, files } = data;

      if (!conversationId || !files || files.length === 0) {
        socket.emit('bot:error', {
          message: 'conversationId e files são obrigatórios',
          code: 'INVALID_DATA'
        });
        return;
      }

      console.log(`[BotWSHandler] bot:files_uploaded - Conversa: ${conversationId}, ${files.length} arquivo(s)`);

      // Notifica o backend sobre os arquivos
      await axios.post(
        `${DIGIURBAN_API_URL}/api/bot/files`,
        {
          conversationId,
          citizenId: userId,
          files
        },
        {
          headers: {
            'Authorization': `Bearer ${MESSAGES_SERVICE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      socket.emit('bot:files_uploaded_success', {
        conversationId,
        filesCount: files.length
      });

      console.log(`[BotWSHandler] Arquivos registrados com sucesso`);
    } catch (error: any) {
      console.error('[BotWSHandler] Erro ao registrar arquivos:', error.message);
      socket.emit('bot:error', {
        message: 'Erro ao registrar arquivos',
        code: 'BOT_FILES_ERROR'
      });
    }
  });

  /**
   * bot:mark_read
   * Marca mensagens do bot como lidas
   */
  socket.on('bot:mark_read', async (data: { conversationId: string }) => {
    try {
      const { conversationId } = data;

      if (!conversationId) {
        return;
      }

      console.log(`[BotWSHandler] bot:mark_read - Conversa: ${conversationId}`);

      // Marca mensagens como lidas
      await axios.post(
        `${DIGIURBAN_API_URL}/api/bot/mark-read`,
        {
          conversationId,
          citizenId: userId
        },
        {
          headers: {
            'Authorization': `Bearer ${MESSAGES_SERVICE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log(`[BotWSHandler] Mensagens marcadas como lidas`);
    } catch (error: any) {
      console.error('[BotWSHandler] Erro ao marcar mensagens como lidas:', error.message);
      // Não emite erro pois não é crítico
    }
  });

  /**
   * bot:typing
   * Indica que o usuário está digitando
   */
  socket.on('bot:typing', (data: { conversationId: string; isTyping: boolean }) => {
    try {
      const { conversationId, isTyping } = data;

      if (!conversationId) return;

      // Emite para a sala da conversa
      socket.to(`conversation:${conversationId}`).emit('bot:user_typing', {
        userId,
        isTyping
      });
    } catch (error: any) {
      console.error('[BotWSHandler] Erro ao processar typing:', error.message);
    }
  });
}

/**
 * Envia uma mensagem proativa do bot para um cidadão
 * (Chamado externamente quando o backend precisa notificar)
 */
export async function sendProactiveBotMessage(
  io: any,
  citizenId: string,
  message: any
) {
  try {
    console.log(`[BotWSHandler] Enviando mensagem proativa para cidadão ${citizenId}`);

    // Busca sockets conectados do cidadão
    const sockets = await io.in(`user:${citizenId}`).fetchSockets();

    if (sockets.length === 0) {
      console.warn(`[BotWSHandler] Cidadão ${citizenId} não está conectado`);
      return false;
    }

    // Emite a mensagem para todos os sockets do cidadão
    io.to(`user:${citizenId}`).emit('message:new', message);

    console.log(`[BotWSHandler] Mensagem proativa enviada para ${sockets.length} socket(s)`);
    return true;
  } catch (error: any) {
    console.error('[BotWSHandler] Erro ao enviar mensagem proativa:', error.message);
    return false;
  }
}

export default {
  registerBotHandlers,
  sendProactiveBotMessage
};
