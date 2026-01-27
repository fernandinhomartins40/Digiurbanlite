/**
 * ============================================================================
 * ROTAS: NOTIFICATIONS - Server-Sent Events (SSE)
 * ============================================================================
 * Sistema de notificações em tempo real via SSE
 * ============================================================================
 */

import { Router, Response } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { prisma } from '../lib/prisma';

const router = Router();

// ============================================================================
// TIPOS
// ============================================================================

interface SSEClient {
  id: string;
  userId: string;
  response: Response;
  connectedAt: Date;
}

interface NotificationEvent {
  type: string;
  data: any;
  timestamp: Date;
}

// ============================================================================
// GERENCIAMENTO DE CONEXÕES SSE
// ============================================================================

const sseClients: Map<string, SSEClient[]> = new Map();

/**
 * Adiciona um cliente SSE à lista de conexões ativas
 */
function addSSEClient(userId: string, response: Response): string {
  const clientId = `${userId}-${Date.now()}`;

  const client: SSEClient = {
    id: clientId,
    userId,
    response,
    connectedAt: new Date(),
  };

  const userClients = sseClients.get(userId) || [];
  userClients.push(client);
  sseClients.set(userId, userClients);

  console.log(`[SSE] Cliente conectado: ${clientId} (Total: ${userClients.length} para user ${userId})`);

  return clientId;
}

/**
 * Remove um cliente SSE
 */
function removeSSEClient(clientId: string) {
  for (const [userId, clients] of sseClients.entries()) {
    const index = clients.findIndex((c) => c.id === clientId);

    if (index !== -1) {
      clients.splice(index, 1);

      if (clients.length === 0) {
        sseClients.delete(userId);
      } else {
        sseClients.set(userId, clients);
      }

      console.log(`[SSE] Cliente desconectado: ${clientId}`);
      return true;
    }
  }

  return false;
}

/**
 * Envia evento para um usuário específico
 */
export function sendNotificationToUser(userId: string, event: NotificationEvent) {
  const clients = sseClients.get(userId);

  if (!clients || clients.length === 0) {
    console.log(`[SSE] Nenhum cliente conectado para user ${userId}`);
    return;
  }

  const payload = {
    type: event.type,
    data: event.data,
    timestamp: event.timestamp.toISOString(),
  };

  const message = `data: ${JSON.stringify(payload)}\n\n`;

  clients.forEach((client) => {
    try {
      client.response.write(message);
      console.log(`[SSE] Evento enviado para ${client.id}:`, event.type);
    } catch (error) {
      console.error(`[SSE] Erro ao enviar para ${client.id}:`, error);
      removeSSEClient(client.id);
    }
  });
}

/**
 * Broadcast para todos os clientes conectados
 */
export function broadcastNotification(event: NotificationEvent) {
  let totalSent = 0;

  for (const [userId, clients] of sseClients.entries()) {
    sendNotificationToUser(userId, event);
    totalSent += clients.length;
  }

  console.log(`[SSE] Broadcast enviado para ${totalSent} cliente(s)`);
}

// ============================================================================
// ROTAS SSE
// ============================================================================

/**
 * GET /api/notifications/stream
 * Endpoint SSE para receber notificações em tempo real
 */
router.get('/stream', adminAuthMiddleware, async (req: any, res: Response) => {
  const userId = req.user.id;

  // Configurar headers SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Desabilita buffering do nginx

  // Enviar comentário inicial para estabelecer conexão
  res.write(': connected\n\n');

  // Adicionar cliente à lista
  const clientId = addSSEClient(userId, res);

  // Enviar evento de boas-vindas
  const welcomeEvent = {
    type: 'CONNECTED',
    data: {
      message: 'Conectado ao sistema de notificações',
      clientId,
    },
    timestamp: new Date(),
  };

  res.write(`data: ${JSON.stringify(welcomeEvent)}\n\n`);

  // Enviar estatísticas iniciais
  try {
    const [pendingSuggestions, pendingProtocols, pendingCitizens] = await Promise.all([
      prisma.citizenCategoryMatchSuggestion.count({
        where: { status: 'PENDING' },
      }),
      prisma.protocolSimplified.count({
        where: { status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA'] } },
      }),
      prisma.citizen.count({
        where: { verificationStatus: 'PENDING' }, // accountStatus doesn't exist, using verificationStatus
      }),
    ]);

    const statsEvent = {
      type: 'STATS_UPDATE',
      data: {
        pendingSuggestions,
        pendingProtocols,
        pendingCitizens,
      },
      timestamp: new Date(),
    };

    res.write(`data: ${JSON.stringify(statsEvent)}\n\n`);
  } catch (error) {
    console.error('[SSE] Erro ao buscar estatísticas iniciais:', error);
  }

  // Heartbeat a cada 30 segundos para manter conexão viva
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (error) {
      console.error(`[SSE] Erro no heartbeat para ${clientId}:`, error);
      clearInterval(heartbeatInterval);
      removeSSEClient(clientId);
    }
  }, 30000);

  // Cleanup ao fechar conexão
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    removeSSEClient(clientId);
    console.log(`[SSE] Conexão fechada: ${clientId}`);
  });

  req.on('error', (error: Error) => {
    console.error(`[SSE] Erro na conexão ${clientId}:`, error);
    clearInterval(heartbeatInterval);
    removeSSEClient(clientId);
  });
});

/**
 * GET /api/notifications/connected-clients
 * Retorna estatísticas de clientes conectados (admin only)
 */
router.get('/connected-clients', adminAuthMiddleware, async (req: any, res) => {
  try {
    const stats = {
      totalUsers: sseClients.size,
      totalConnections: Array.from(sseClients.values()).reduce(
        (sum, clients) => sum + clients.length,
        0
      ),
      users: Array.from(sseClients.entries()).map(([userId, clients]) => ({
        userId,
        connections: clients.length,
        connectedAt: clients[0]?.connectedAt,
      })),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Erro ao buscar clientes conectados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar clientes conectados',
      error: error.message,
    });
  }
});

/**
 * POST /api/notifications/test-broadcast
 * Envia notificação de teste (development only)
 */
router.post('/test-broadcast', adminAuthMiddleware, async (req: any, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Endpoint disponível apenas em desenvolvimento',
      });
    }

    const { type, data } = req.body;

    const event: NotificationEvent = {
      type: type || 'TEST',
      data: data || { message: 'Notificação de teste' },
      timestamp: new Date(),
    };

    broadcastNotification(event);

    res.json({
      success: true,
      message: 'Notificação de teste enviada',
      event,
    });
  } catch (error: any) {
    console.error('Erro ao enviar notificação de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar notificação de teste',
      error: error.message,
    });
  }
});

// ============================================================================
// FUNÇÕES AUXILIARES PARA OUTROS MÓDULOS
// ============================================================================

/**
 * Notifica sobre nova sugestão de categoria
 */
export function notifyNewCategorySuggestion(data: {
  serviceId: string;
  serviceName: string;
  categoryName: string;
  confidence: number;
}) {
  const event: NotificationEvent = {
    type: 'NEW_CATEGORY_SUGGESTION',
    data: {
      ...data,
      message: `Nova sugestão: ${data.serviceName} → ${data.categoryName} (${data.confidence}%)`,
    },
    timestamp: new Date(),
  };

  broadcastNotification(event);
}

/**
 * Notifica sobre aprovação de sugestão
 */
export function notifySuggestionApproved(data: {
  serviceId: string;
  serviceName: string;
  categoryName: string;
}) {
  const event: NotificationEvent = {
    type: 'SUGGESTION_APPROVED',
    data: {
      ...data,
      message: `Categoria aprovada: ${data.serviceName} → ${data.categoryName}`,
    },
    timestamp: new Date(),
  };

  broadcastNotification(event);
}

/**
 * Notifica sobre atualização de estatísticas
 */
export async function notifyStatsUpdate() {
  try {
    const [pendingSuggestions, pendingProtocols, pendingCitizens] = await Promise.all([
      prisma.citizenCategoryMatchSuggestion.count({
        where: { status: 'PENDING' },
      }),
      prisma.protocolSimplified.count({
        where: { status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA'] } },
      }),
      prisma.citizen.count({
        where: { verificationStatus: 'PENDING' }, // accountStatus doesn't exist, using verificationStatus
      }),
    ]);

    const event: NotificationEvent = {
      type: 'STATS_UPDATE',
      data: {
        pendingSuggestions,
        pendingProtocols,
        pendingCitizens,
      },
      timestamp: new Date(),
    };

    broadcastNotification(event);
  } catch (error) {
    console.error('[SSE] Erro ao notificar atualização de stats:', error);
  }
}

export default router;
