import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { CitizenAuthenticatedRequest } from '../types';

const router = Router();

/**
 * GET /api/messages/conversations
 * Obtém lista de conversas do cidadão
 *
 * NOTA: Esta rota retorna array vazio por enquanto.
 * O DigiBot é sempre adicionado no frontend.
 * Futuras conversas com atendentes humanos serão retornadas aqui.
 */
router.get('/conversations', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Por enquanto, retorna array vazio
    // O DigiBot é adicionado no frontend
    // Futuras conversas com atendentes serão buscadas do banco
    res.json({
      success: true,
      conversations: []
    });

  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

/**
 * GET /api/messages/conversations/:id/messages
 * Obtém mensagens de uma conversa específica
 */
router.get('/conversations/:id/messages', authenticateToken, async (req: CitizenAuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizen?.id;
    const conversationId = req.params.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Por enquanto, retorna array vazio
    // Mensagens do bot vêm de /api/bot/history
    res.json({
      success: true,
      messages: []
    });

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

export default router;
