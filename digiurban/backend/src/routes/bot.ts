import { Router, Request, Response } from 'express';
import BotService from '../services/bot/BotService';
import ContextManager from '../services/bot/ContextManager';
import ServiceKnowledgeBase from '../services/bot/ServiceKnowledgeBase';
import RecommendationEngine from '../services/bot/RecommendationEngine';
import { authenticateToken } from '../middleware/auth';
import { CitizenAuthenticatedRequest } from '../types';

const router = Router();

/**
 * POST /api/bot/message
 * Envia uma mensagem para o bot e recebe resposta
 */
router.post('/message', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;
    const citizenId = req.citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem inválida' });
    }

    console.log(`🤖 [Bot] Mensagem recebida de ${citizenId}: "${message}"`);

    // Processar mensagem
    const response = await BotService.processMessage(citizenId, message.trim());

    // Adicionar ao histórico
    await ContextManager.addToHistory(citizenId, 'user', message.trim());
    await ContextManager.addToHistory(citizenId, 'bot', response.response);

    res.json({
      success: true,
      response: response.response,
      messageType: response.messageType,
      metadata: response.metadata,
      quickReplies: response.quickReplies,
      cards: response.cards,
      form: response.form,
      messageId: `bot-${Date.now()}`
    });

  } catch (error) {
    console.error('Erro ao processar mensagem do bot:', error);
    res.status(500).json({
      error: 'Erro ao processar mensagem',
      response: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
    });
  }
});

/**
 * GET /api/bot/history
 * Obtém histórico de conversa com o bot
 */
router.get('/history', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizen?.id;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const history = await ContextManager.getHistory(citizenId, limit);

    // Converter histórico para formato de mensagens
    const messages = history.map((item, index) => ({
      id: `${item.role}-${index}`,
      content: item.content,
      senderId: item.role === 'bot' ? 'bot' : citizenId,
      senderType: item.role === 'bot' ? 'BOT' : 'CITIZEN',
      createdAt: item.timestamp.toISOString(),
      status: 'READ',
      messageType: 'text'
    }));

    res.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Erro ao buscar histórico do bot:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

/**
 * POST /api/bot/clear-history
 * Limpa histórico de conversa com o bot
 */
router.post('/clear-history', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    await ContextManager.clearContext(citizenId);

    res.json({
      success: true,
      message: 'Histórico limpo com sucesso'
    });

  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    res.status(500).json({ error: 'Erro ao limpar histórico' });
  }
});

/**
 * GET /api/bot/recommendations
 * Obtém recomendações personalizadas
 */
router.get('/recommendations', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizen?.id;
    const limit = parseInt(req.query.limit as string) || 5;
    const context = req.query.context as string;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const recommendations = await RecommendationEngine.getRecommendations(
      citizenId,
      context,
      limit
    );

    res.json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error('Erro ao buscar recomendações:', error);
    res.status(500).json({ error: 'Erro ao buscar recomendações' });
  }
});

/**
 * GET /api/bot/trending
 * Obtém serviços em tendência
 */
router.get('/trending', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const trending = await RecommendationEngine.getTrending(limit);

    res.json({
      success: true,
      trending
    });

  } catch (error) {
    console.error('Erro ao buscar trending:', error);
    res.status(500).json({ error: 'Erro ao buscar trending' });
  }
});

/**
 * GET /api/bot/next-steps
 * Recomenda próximos passos baseado no histórico
 */
router.get('/next-steps', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const nextSteps = await RecommendationEngine.recommendNextSteps(citizenId);

    res.json({
      success: true,
      ...nextSteps
    });

  } catch (error) {
    console.error('Erro ao recomendar próximos passos:', error);
    res.status(500).json({ error: 'Erro ao recomendar próximos passos' });
  }
});

/**
 * GET /api/bot/search-services
 * Busca serviços na knowledge base
 */
router.get('/search-services', authenticateToken, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      return res.status(400).json({ error: 'Query de busca é obrigatória' });
    }

    const services = await ServiceKnowledgeBase.searchServices(query, limit);

    res.json({
      success: true,
      services,
      total: services.length
    });

  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

/**
 * GET /api/bot/stats
 * Obtém estatísticas do bot
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [contextStats, knowledgeBaseStats] = await Promise.all([
      ContextManager.getStats(),
      ServiceKnowledgeBase.getStats()
    ]);

    res.json({
      success: true,
      context: contextStats,
      knowledgeBase: knowledgeBaseStats,
      redisConnected: ContextManager.isRedisConnected()
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

/**
 * POST /api/bot/start-flow
 * Inicia um fluxo de conversa multi-step
 */
router.post('/start-flow', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizen?.id;
    const { flowName, initialData } = req.body;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!flowName) {
      return res.status(400).json({ error: 'Nome do fluxo é obrigatório' });
    }

    await ContextManager.startFlow(citizenId, flowName, initialData);

    res.json({
      success: true,
      message: `Fluxo "${flowName}" iniciado`
    });

  } catch (error) {
    console.error('Erro ao iniciar fluxo:', error);
    res.status(500).json({ error: 'Erro ao iniciar fluxo' });
  }
});

/**
 * POST /api/bot/update-flow
 * Atualiza dados do fluxo atual
 */
router.post('/update-flow', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizen?.id;
    const { data } = req.body;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    await ContextManager.updateFlowData(citizenId, data);

    res.json({
      success: true,
      message: 'Fluxo atualizado'
    });

  } catch (error) {
    console.error('Erro ao atualizar fluxo:', error);
    res.status(500).json({ error: 'Erro ao atualizar fluxo' });
  }
});

/**
 * POST /api/bot/end-flow
 * Finaliza o fluxo atual
 */
router.post('/end-flow', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const flowData = await ContextManager.endFlow(citizenId);

    res.json({
      success: true,
      message: 'Fluxo finalizado',
      flowData
    });

  } catch (error) {
    console.error('Erro ao finalizar fluxo:', error);
    res.status(500).json({ error: 'Erro ao finalizar fluxo' });
  }
});

/**
 * GET /api/bot/current-flow
 * Obtém informações do fluxo atual
 */
router.get('/current-flow', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const flow = await ContextManager.getCurrentFlow(citizenId);

    res.json({
      success: true,
      ...flow
    });

  } catch (error) {
    console.error('Erro ao obter fluxo atual:', error);
    res.status(500).json({ error: 'Erro ao obter fluxo atual' });
  }
});

export default router;
