import { Router } from 'express';
import { superAdminAuth } from '../middleware/super-admin-auth';
import { prisma } from '../lib/prisma';

const router = Router();

// Middleware de autenticação SuperAdmin
router.use(superAdminAuth);

/**
 * GET /api/super-admin/email-subscriptions
 * Listar todas as subscriptions
 */
router.get('/email-subscriptions', async (req, res) => {
  try {
    const subscriptions = await prisma.emailSubscription.findMany({
      include: {
        emailServer: {
          select: {
            id: true,
            hostname: true,
            isActive: true
          }
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
            dueDate: true,
            paidAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        addons: {
          select: {
            id: true,
            addonType: true,
            quantity: true,
            price: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar assinaturas'
    });
  }
});

/**
 * GET /api/super-admin/email-subscriptions/:id
 * Obter detalhes de uma subscription
 */
router.get('/email-subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.emailSubscription.findUnique({
      where: { id },
      include: {
        emailServer: {
          include: {
            users: {
              select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
                sentThisMonth: true,
                monthlyLimit: true
              }
            },
            domains: true
          }
        },
        invoices: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        addons: true
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription não encontrada',
        message: 'Subscription não encontrada'
      });
    }

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar assinatura'
    });
  }
});

/**
 * PUT /api/super-admin/email-subscriptions/:id/status
 * Atualizar status da subscription
 */
router.put('/email-subscriptions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido',
        message: 'Status inválido'
      });
    }

    const subscription = await prisma.emailSubscription.update({
      where: { id },
      data: { status }
    });

    // Ativar/desativar servidor baseado no status
    const isActive = status === 'ACTIVE' || status === 'TRIAL';
    await prisma.emailServer.update({
      where: { id: subscription.emailServerId },
      data: { isActive }
    });

    res.json({
      success: true,
      message: `Status atualizado para ${status}`,
      subscription
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao atualizar status'
    });
  }
});

/**
 * GET /api/super-admin/email-stats
 * Estatísticas globais do serviço de email
 */
router.get('/email-stats', async (req, res) => {
  try {
    // Contar subscriptions por status
    const subscriptionsByStatus = await prisma.emailSubscription.groupBy({
      by: ['status'],
      _count: true
    });

    // Contar por plano
    const subscriptionsByPlan = await prisma.emailSubscription.groupBy({
      by: ['plan'],
      _count: true
    });

    // Calcular MRR
    const activeSubscriptions = await prisma.emailSubscription.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        monthlyPrice: true
      }
    });

    const mrr = activeSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.monthlyPrice.toString()), 0);
    const arr = mrr * 12;

    // Total de contas de email criadas
    const totalEmailAccounts = await prisma.emailUser.count();

    // Total de emails enviados (mês atual)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const emailsSentThisMonth = await prisma.email.count({
      where: {
        sentAt: { gte: currentMonth }
      }
    });

    res.json({
      success: true,
      stats: {
        subscriptionsByStatus,
        subscriptionsByPlan,
        mrr,
        arr,
        totalEmailAccounts,
        emailsSentThisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar estatísticas'
    });
  }
});

export default router;
