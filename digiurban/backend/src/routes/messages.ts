import { Router, Response } from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';
import { CitizenAuthenticatedRequest } from '../types';

const router = Router();
const messagesBaseUrl = process.env.MESSAGES_SERVER_URL || 'http://ultrazend-messages:9001';
const messagesClient = axios.create({
  baseURL: messagesBaseUrl,
  timeout: 15000,
});

const getAuthToken = (req: CitizenAuthenticatedRequest) => {
  return (
    req.cookies?.digiurban_admin_token ||
    req.cookies?.digiurban_citizen_token ||
    req.headers.authorization?.replace('Bearer ', '')
  );
};

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
    const token = getAuthToken(req);

    if (!token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const response = await messagesClient.get('/api/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json({
      success: true,
      conversations: response.data,
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
    const conversationId = req.params.id;
    const token = getAuthToken(req);

    if (!token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const response = await messagesClient.get(`/api/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json({
      success: true,
      messages: response.data,
    });

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

export default router;
