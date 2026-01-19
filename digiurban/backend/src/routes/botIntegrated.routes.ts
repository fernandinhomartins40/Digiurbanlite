/**
 * Bot Integrated Routes
 *
 * Rotas da API integrada do DigiBot com UltraZend Messages.
 * Estas rotas são chamadas pelo UltraZend Messages Server via WebSocket handlers.
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { BotIntegrationService } from '../services/bot/BotIntegrationService';
import { UltraZendMessagesAdapter } from '../services/bot/UltraZendMessagesAdapter';
import { ConversationFlowManager, FlowType } from '../services/bot/ConversationFlowManager';

const router = Router();
const prisma = new PrismaClient();

// Middleware de autenticação do serviço
const authenticateService = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const expectedToken = process.env.MESSAGES_SERVICE_TOKEN || 'ultrazend-messages-service-token-change-in-production';

  if (token !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

router.use(authenticateService);

const botIntegration = BotIntegrationService.getInstance();
const adapter = UltraZendMessagesAdapter.getInstance();
const flowManager = new ConversationFlowManager();

/**
 * POST /api/bot/conversation
 * Busca ou cria uma conversa do bot para o cidadão
 */
router.post('/conversation', async (req, res) => {
  try {
    const { citizenId } = req.body;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId é obrigatório' });
    }

    // Busca ou cria conversa
    const conversation = await adapter.findOrCreateBotConversation(citizenId);

    res.json({ conversationId: conversation.id });
  } catch (error: any) {
    console.error('[BotAPI] Erro em POST /conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bot/message
 * Processa uma mensagem do cidadão e retorna resposta do bot
 */
router.post('/message', async (req, res) => {
  try {
    const { conversationId, citizenId, message } = req.body;

    if (!conversationId || !citizenId || !message) {
      return res.status(400).json({ error: 'conversationId, citizenId e message são obrigatórios' });
    }

    console.log(`[BotAPI] Mensagem recebida - Conversa: ${conversationId}, Cidadão: ${citizenId}`);

    // 1. Salva mensagem do cidadão
    const userMessage = await adapter.sendCitizenMessage(
      conversationId,
      citizenId,
      message,
      'TEXT'
    );

    // 2. Busca a conversa
    const conversation = await adapter.getConversation(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // 3. Detecta intenção ou processa fluxo ativo
    let botResponse;

    if (conversation.botFlowType) {
      // Continua fluxo ativo
      botResponse = await flowManager.processFlowMessage(
        conversation,
        message,
        citizenId
      );
    } else {
      // Detecta nova intenção
      const detectedFlow = flowManager.detectFlowFromMessage(message);

      if (detectedFlow === FlowType.MENU_PRINCIPAL) {
        botResponse = await flowManager.showMainMenu(citizenId, conversationId);
      } else if (detectedFlow) {
        botResponse = await flowManager.startFlow(citizenId, conversationId, detectedFlow);
      } else {
        // Mensagem não reconhecida - mostra menu
        botResponse = {
          response: '🤔 Desculpe, não entendi.\n\nEscolha uma das opções abaixo:',
          messageType: 'interactive',
          metadata: {
            quickReplies: [
              '📋 Solicitar Serviço',
              '🔍 Consultar Protocolo',
              '📄 Enviar Documentos',
              '👤 Atualizar Perfil',
              '❓ Outras Dúvidas'
            ]
          }
        };
      }
    }

    // 4. Salva resposta do bot
    const botMessage = await adapter.sendBotMessage(conversationId, botResponse);

    // 5. Retorna ambas as mensagens para o WebSocket
    res.json({
      userMessage: {
        id: userMessage.id,
        content: userMessage.content,
        senderId: citizenId,
        senderType: 'CITIZEN',
        createdAt: userMessage.sentAt,
        messageType: 'text',
        metadata: {}
      },
      botMessage: {
        id: botMessage.id,
        content: botMessage.content,
        senderId: 'DIGIBOT_SYSTEM',
        senderType: 'SYSTEM',
        createdAt: botMessage.sentAt,
        messageType: (botMessage.metadata as any)?.messageType || 'text',
        metadata: botMessage.metadata
      }
    });
  } catch (error: any) {
    console.error('[BotAPI] Erro em POST /message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bot/files
 * Registra arquivos enviados pelo cidadão
 */
router.post('/files', async (req, res) => {
  try {
    const { conversationId, citizenId, files } = req.body;

    if (!conversationId || !citizenId || !files) {
      return res.status(400).json({ error: 'conversationId, citizenId e files são obrigatórios' });
    }

    console.log(`[BotAPI] Arquivos recebidos - Conversa: ${conversationId}, ${files.length} arquivo(s)`);

    // Busca a conversa
    const conversation = await adapter.getConversation(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Atualiza flowData com os arquivos
    const flowData = (conversation.botFlowData as any) || {};
    flowData.files = [...(flowData.files || []), ...files];

    await adapter.updateBotFlow(
      conversationId,
      conversation.botFlowType,
      conversation.botFlowStep,
      flowData
    );

    res.json({ success: true, filesCount: files.length });
  } catch (error: any) {
    console.error('[BotAPI] Erro em POST /files:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bot/mark-read
 * Marca mensagens do bot como lidas
 */
router.post('/mark-read', async (req, res) => {
  try {
    const { conversationId, citizenId } = req.body;

    if (!conversationId || !citizenId) {
      return res.status(400).json({ error: 'conversationId e citizenId são obrigatórios' });
    }

    await adapter.markMessagesAsRead(conversationId, citizenId, 'CITIZEN');

    res.json({ success: true });
  } catch (error: any) {
    console.error('[BotAPI] Erro em POST /mark-read:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bot/history
 * Retorna histórico de mensagens (para carregar ao abrir o chat)
 */
router.get('/history', async (req, res) => {
  try {
    const citizenId = req.query.citizenId as string;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId é obrigatório' });
    }

    // Busca conversa do bot
    const conversation = await prisma.conversation.findFirst({
      where: {
        participant1Id: citizenId,
        participant2Id: 'DIGIBOT_SYSTEM',
        isBotConversation: true
      }
    });

    if (!conversation) {
      return res.json({ messages: [], conversationId: null });
    }

    // Busca mensagens
    const messages = await adapter.getConversationMessages(conversation.id, 50, 0);

    // Formata para o frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderType: msg.senderType,
      createdAt: msg.sentAt,
      messageType: (msg.metadata as any)?.messageType || 'text',
      metadata: msg.metadata
    }));

    res.json({
      messages: formattedMessages.reverse(), // Mais antigas primeiro
      conversationId: conversation.id
    });
  } catch (error: any) {
    console.error('[BotAPI] Erro em GET /history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bot/proactive-notification
 * Endpoint para enviar notificações proativas do bot
 * (Chamado por outros serviços como ProtocolService)
 */
router.post('/proactive-notification', async (req, res) => {
  try {
    const { citizenId, notification } = req.body;

    if (!citizenId || !notification) {
      return res.status(400).json({ error: 'citizenId e notification são obrigatórios' });
    }

    console.log(`[BotAPI] Notificação proativa - Cidadão: ${citizenId}, Tipo: ${notification.type}`);

    // Envia notificação via BotIntegrationService
    await botIntegration.sendProactiveNotification(citizenId, notification);

    res.json({ success: true });
  } catch (error: any) {
    console.error('[BotAPI] Erro em POST /proactive-notification:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bot/stats
 * Retorna estatísticas do bot
 */
router.get('/stats', async (req, res) => {
  try {
    const period = (req.query.period as 'day' | 'week' | 'month') || 'day';

    const stats = await botIntegration.getBotStats(period);

    res.json(stats);
  } catch (error: any) {
    console.error('[BotAPI] Erro em GET /stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
