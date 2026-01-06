import { Router, Request, Response } from 'express';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/express-helpers';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

const router = Router();

// Middleware para autenticação
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/email-service
 * Retorna configuração do serviço de email do município
 */
router.get('/', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const emailServer = await prisma.emailServer.findFirst({
      include: {
        subscription: {
          include: {
            planConfig: true
          }
        },
        domains: {
          where: { isVerified: true },
          select: {
            id: true,
            domainName: true,
            isVerified: true,
            dkimEnabled: true,
            spfEnabled: true
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    if (!emailServer || !emailServer.subscription) {
      return res.json({
        hasEmailService: false
      });
    }

    // Calcular uso do mês atual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const emailsSentThisMonth = await prisma.email.count({
      where: {
        emailServerId: emailServer.id,
        sentAt: { gte: currentMonth }
      }
    });

    res.json({
      hasEmailService: true,
      plan: {
        id: emailServer.subscription.planConfig?.id,
        name: emailServer.subscription.planConfig?.name,
        code: emailServer.subscription.planConfig?.code,
        price: Number(emailServer.subscription.monthlyPrice),
        emailsPerMonth: emailServer.subscription.planConfig?.maxEmailsPerMonth || 0,
        maxAccounts: emailServer.subscription.planConfig?.maxAccounts || 0
      },
      server: {
        hostname: emailServer.hostname,
        isActive: emailServer.isActive,
        subscription: {
          planConfig: {
            maxEmailsPerMonth: emailServer.subscription.planConfig?.maxEmailsPerMonth || 0
          }
        }
      },
      domains: emailServer.domains,
      accounts: emailServer.users,
      usage: {
        currentMonth: emailsSentThisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching email service:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar serviço de email'
    });
  }
}));

/**
 * GET /api/admin/email-service/stats
 * Retorna estatísticas de uso do email
 */
router.get('/stats', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const emailServer = await prisma.emailServer.findFirst({
      include: {
        subscription: {
          include: {
            planConfig: true
          }
        }
      }
    });

    if (!emailServer || !emailServer.subscription) {
      return res.status(404).json({
        success: false,
        error: 'Email service not found',
        message: 'Serviço de email não configurado'
      });
    }

    // Estatísticas do mês atual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [totalSent, totalDelivered, totalFailed, totalBounced] = await Promise.all([
      prisma.email.count({
        where: {
          emailServerId: emailServer.id,
          sentAt: { gte: currentMonth }
        }
      }),
      prisma.email.count({
        where: {
          emailServerId: emailServer.id,
          status: 'DELIVERED',
          deliveredAt: { gte: currentMonth }
        }
      }),
      prisma.email.count({
        where: {
          emailServerId: emailServer.id,
          status: 'FAILED',
          failedAt: { gte: currentMonth }
        }
      }),
      prisma.email.count({
        where: {
          emailServerId: emailServer.id,
          status: 'BOUNCED',
          bouncedAt: { gte: currentMonth }
        }
      })
    ]);

    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0';
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0';

    const maxEmailsPerMonth = emailServer.subscription.planConfig?.maxEmailsPerMonth || 0;
    const usagePercentage = maxEmailsPerMonth > 0
      ? ((totalSent / maxEmailsPerMonth) * 100).toFixed(1)
      : '0';

    // Estatísticas diárias dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await prisma.emailStats.findMany({
      where: {
        emailServerId: emailServer.id,
        date: { gte: thirtyDaysAgo }
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        totalSent: true,
        totalDelivered: true,
        totalFailed: true
      }
    });

    res.json({
      currentMonth: {
        totalSent,
        totalDelivered,
        totalFailed,
        totalBounced,
        deliveryRate: `${deliveryRate}%`,
        bounceRate: `${bounceRate}%`
      },
      usage: {
        current: totalSent,
        limit: maxEmailsPerMonth,
        percentage: `${usagePercentage}%`
      },
      dailyStats: dailyStats.map(stat => ({
        date: stat.date.toISOString().split('T')[0],
        sent: stat.totalSent,
        delivered: stat.totalDelivered,
        failed: stat.totalFailed
      }))
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar estatísticas'
    });
  }
}));

/**
 * GET /api/admin/email-service/available-plans
 * Lista planos de email disponíveis
 */
router.get('/available-plans', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const plans = await prisma.emailPlanConfig.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        monthlyPrice: true,
        maxEmailsPerMonth: true,
        maxAccounts: true,
        features: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      plans: plans.map(plan => ({
        ...plan,
        monthlyPrice: Number(plan.monthlyPrice)
      }))
    });
  } catch (error) {
    console.error('Error fetching available plans:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar planos disponíveis'
    });
  }
}));

/**
 * POST /api/admin/email-service/subscribe
 * Contratar ou fazer upgrade de plano
 */
router.post('/subscribe', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Missing plan ID',
        message: 'ID do plano é obrigatório'
      });
    }

    // Buscar plano
    const plan = await prisma.emailPlanConfig.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        message: 'Plano não encontrado ou inativo'
      });
    }

    // Verificar se já existe EmailServer
    let emailServer = await prisma.emailServer.findFirst({
      include: { subscription: true }
    });

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    if (!emailServer) {
      // Criar novo servidor de email
      emailServer = await prisma.emailServer.create({
        data: {
          hostname: 'ultrazend-smtp',
          mxPort: 25,
          submissionPort: 587,
          isActive: true,
          isPremiumService: true,
          monthlyPrice: plan.monthlyPrice,
          tlsEnabled: true,
          subscription: {
            create: {
              plan: plan.code as any,
              planConfigId: plan.id,
              monthlyPrice: plan.monthlyPrice,
              status: 'ACTIVE',
              currentPeriodStart,
              currentPeriodEnd
            }
          }
        },
        include: { subscription: true }
      });

      // Criar conta admin automaticamente
      const bcrypt = require('bcrypt');
      const defaultPassword = await bcrypt.hash('Admin@2025', 12);

      await prisma.emailUser.create({
        data: {
          emailServerId: emailServer.id,
          email: 'admin@digiurban.com.br',
          passwordHash: defaultPassword,
          name: 'Administrador',
          isActive: true,
          isAdmin: true,
          dailyLimit: Math.floor(plan.maxEmailsPerMonth / 30),
          monthlyLimit: plan.maxEmailsPerMonth
        }
      });
    } else {
      // Atualizar subscription existente
      if (emailServer.subscription) {
        await prisma.emailSubscription.update({
          where: { id: emailServer.subscription.id },
          data: {
            plan: plan.code as any,
            planConfigId: plan.id,
            monthlyPrice: plan.monthlyPrice,
            status: 'ACTIVE',
            currentPeriodStart,
            currentPeriodEnd
          }
        });
      } else {
        // Criar subscription nova
        await prisma.emailSubscription.create({
          data: {
            emailServerId: emailServer.id,
            plan: plan.code as any,
            planConfigId: plan.id,
            monthlyPrice: plan.monthlyPrice,
            status: 'ACTIVE',
            currentPeriodStart,
            currentPeriodEnd
          }
        });
      }

      // Atualizar servidor
      await prisma.emailServer.update({
        where: { id: emailServer.id },
        data: {
          monthlyPrice: plan.monthlyPrice,
          isActive: true
        }
      });
    }

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EMAIL_SERVICE_SUBSCRIBED',
        resource: 'email_subscription',
        details: {
          planId,
          planName: plan.name,
          monthlyPrice: Number(plan.monthlyPrice)
        },
        ip: req.ip || 'unknown',
        success: true
      }
    });

    res.json({
      success: true,
      message: 'Plano contratado com sucesso!',
      credentials: emailServer.subscription ? undefined : {
        email: 'admin@digiurban.com.br',
        password: 'Admin@2025',
        server: 'ultrazend-smtp',
        port: 587
      }
    });
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao contratar plano'
    });
  }
}));

/**
 * GET /api/admin/email-service/templates
 * Lista templates de email (placeholder - implementar futuramente)
 */
router.get('/templates', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Por enquanto retornar array vazio
  // TODO: Implementar sistema de templates
  res.json([]);
}));

export default router;
