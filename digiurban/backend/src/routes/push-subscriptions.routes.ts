/**
 * ============================================================================
 * PUSH SUBSCRIPTIONS ROUTES - Gerenciar subscriptions de push notifications
 * ============================================================================
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';

const router = Router();

// Schema de validação
const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

/**
 * POST /api/push/subscribe
 * Registrar subscription de push notification
 */
router.post('/subscribe', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { subscription } = req.body;
    const validated = subscriptionSchema.parse(subscription);

    // Determinar tipo de usuário
    const recipientType = req.user ? 'user' : 'citizen';
    const recipientId = req.user?.id || req.citizen?.id;

    if (!recipientId) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    // Criar ou atualizar subscription
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: validated.endpoint },
      create: {
        [recipientType === 'citizen' ? 'citizenId' : 'userId']: recipientId,
        endpoint: validated.endpoint,
        p256dh: validated.keys.p256dh,
        auth: validated.keys.auth,
        userAgent: req.headers['user-agent'] || null,
      },
      update: {
        lastUsed: new Date(),
        p256dh: validated.keys.p256dh,
        auth: validated.keys.auth,
      },
    });

    console.log(`✅ [Push] Subscription registered for ${recipientType}:${recipientId}`);

    res.json({
      success: true,
      message: 'Subscription registrada com sucesso',
      subscription: {
        id: sub.id,
        createdAt: sub.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Push] Error registering subscription:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao registrar subscription',
      error: error.message,
    });
  }
});

/**
 * POST /api/push/unsubscribe
 * Remover subscription de push notification
 */
router.post('/unsubscribe', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint é obrigatório',
      });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });

    console.log(`✅ [Push] Subscription removed for endpoint: ${endpoint}`);

    res.json({
      success: true,
      message: 'Subscription removida com sucesso',
    });
  } catch (error: any) {
    console.error('[Push] Error unsubscribing:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover subscription',
      error: error.message,
    });
  }
});

/**
 * GET /api/push/subscriptions
 * Listar subscriptions ativas do usuário
 */
router.get('/subscriptions', adminAuthMiddleware, async (req: any, res) => {
  try {
    const recipientType = req.user ? 'user' : 'citizen';
    const recipientId = req.user?.id || req.citizen?.id;

    if (!recipientId) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        [recipientType === 'citizen' ? 'citizenId' : 'userId']: recipientId,
      },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: { lastUsed: 'desc' },
    });

    res.json({
      success: true,
      subscriptions,
      total: subscriptions.length,
    });
  } catch (error: any) {
    console.error('[Push] Error listing subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar subscriptions',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/push/subscriptions/:id
 * Remover subscription específica
 */
router.delete('/subscriptions/:id', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const recipientType = req.user ? 'user' : 'citizen';
    const recipientId = req.user?.id || req.citizen?.id;

    if (!recipientId) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    // Verificar se a subscription pertence ao usuário
    const subscription = await prisma.pushSubscription.findFirst({
      where: {
        id,
        [recipientType === 'citizen' ? 'citizenId' : 'userId']: recipientId,
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription não encontrada',
      });
    }

    await prisma.pushSubscription.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Subscription removida com sucesso',
    });
  } catch (error: any) {
    console.error('[Push] Error deleting subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover subscription',
      error: error.message,
    });
  }
});

/**
 * GET /api/push/vapid-public-key
 * Retornar chave pública VAPID (público)
 */
router.get('/vapid-public-key', (_req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(503).json({
      success: false,
      message: 'Push notifications não configuradas',
    });
  }

  res.json({
    success: true,
    publicKey,
  });
});

export default router;
