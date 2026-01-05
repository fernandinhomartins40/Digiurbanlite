import { Router, Response } from 'express';
import { superAdminAuth } from '../middleware/super-admin-auth';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/express-helpers';
import { prisma } from '../lib/prisma';
import { EmailPlan } from '@prisma/client';

const router = Router();

// Middleware para autenticação de Super Admin
router.use(superAdminAuth);

/**
 * GET /api/super-admin/email/plans
 * Listar todos os planos de email
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const plans = await prisma.emailPlanConfig.findMany({
      include: {
        allowedDomains: {
          include: {
            domain: true
          }
        },
        _count: {
          select: {
            subscriptions: true
          }
        }
      },
      orderBy: { monthlyPrice: 'asc' }
    });

    // Calcular MRR (Monthly Recurring Revenue)
    const totalMRR = plans.reduce((sum, plan) => {
      return sum + (Number(plan.monthlyPrice) * plan._count.subscriptions);
    }, 0);

    // Contar assinantes ativos
    const totalSubscribers = plans.reduce((sum, plan) => {
      return sum + plan._count.subscriptions;
    }, 0);

    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        code: plan.code,
        monthlyPrice: Number(plan.monthlyPrice),
        maxEmailsPerMonth: plan.maxEmailsPerMonth,
        maxAccounts: plan.maxAccounts,
        features: plan.features,
        isActive: plan.isActive,
        allowedDomains: plan.allowedDomains.map(ad => ({
          id: ad.id,
          domainId: ad.domainId,
          domainName: ad.domain.domainName,
          isVerified: ad.domain.isVerified
        })),
        subscribers: plan._count.subscriptions,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      })),
      stats: {
        totalPlans: plans.length,
        activePlans: plans.filter(p => p.isActive).length,
        totalSubscribers,
        totalMRR
      }
    });
  } catch (error) {
    console.error('Error fetching email plans:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar planos de email'
    });
  }
}));

/**
 * GET /api/super-admin/email/plans/:id
 * Obter detalhes de um plano específico
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await prisma.emailPlanConfig.findUnique({
      where: { id },
      include: {
        allowedDomains: {
          include: {
            domain: true
          }
        },
        subscriptions: {
          include: {
            emailServer: {
              select: {
                id: true,
                hostname: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        message: 'Plano não encontrado'
      });
    }

    res.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        monthlyPrice: Number(plan.monthlyPrice),
        maxEmailsPerMonth: plan.maxEmailsPerMonth,
        maxAccounts: plan.maxAccounts,
        features: plan.features,
        isActive: plan.isActive,
        allowedDomains: plan.allowedDomains.map(ad => ({
          id: ad.id,
          domainId: ad.domainId,
          domainName: ad.domain.domainName,
          isVerified: ad.domain.isVerified
        })),
        subscriptions: plan.subscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          emailServer: sub.emailServer
        })),
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching plan details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar detalhes do plano'
    });
  }
}));

/**
 * POST /api/super-admin/email/plans
 * Criar novo plano de email
 */
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      code,
      monthlyPrice,
      maxEmailsPerMonth,
      maxAccounts,
      features,
      isActive,
      allowedDomainIds
    } = req.body;

    // Validações
    if (!name || !code || monthlyPrice === undefined || !maxEmailsPerMonth || !maxAccounts) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Campos obrigatórios: name, code, monthlyPrice, maxEmailsPerMonth, maxAccounts'
      });
    }

    // Verificar se o código já existe
    const existingPlan = await prisma.emailPlanConfig.findUnique({
      where: { code }
    });

    if (existingPlan) {
      return res.status(409).json({
        success: false,
        error: 'Plan code already exists',
        message: `Já existe um plano com o código '${code}'`
      });
    }

    // Criar plano
    const plan = await prisma.emailPlanConfig.create({
      data: {
        name,
        code,
        monthlyPrice,
        maxEmailsPerMonth,
        maxAccounts,
        features: features || [],
        isActive: isActive !== undefined ? isActive : true,
        allowedDomains: allowedDomainIds && allowedDomainIds.length > 0 ? {
          create: allowedDomainIds.map((domainId: string) => ({
            domainId
          }))
        } : undefined
      },
      include: {
        allowedDomains: {
          include: {
            domain: true
          }
        }
      }
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'EMAIL_PLAN_CREATED',
        resource: 'email_plan',
        details: {
          planId: plan.id,
          name: plan.name,
          code: plan.code,
          monthlyPrice: Number(plan.monthlyPrice)
        },
        ip: req.ip || 'unknown',
        success: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Plano criado com sucesso',
      plan: {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        monthlyPrice: Number(plan.monthlyPrice),
        maxEmailsPerMonth: plan.maxEmailsPerMonth,
        maxAccounts: plan.maxAccounts,
        features: plan.features,
        isActive: plan.isActive,
        allowedDomains: plan.allowedDomains.map(ad => ({
          id: ad.id,
          domainId: ad.domainId,
          domainName: ad.domain.domainName
        }))
      }
    });
  } catch (error) {
    console.error('Error creating email plan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao criar plano de email'
    });
  }
}));

/**
 * PUT /api/super-admin/email/plans/:id
 * Atualizar plano de email existente
 */
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      monthlyPrice,
      maxEmailsPerMonth,
      maxAccounts,
      features,
      isActive,
      allowedDomainIds
    } = req.body;

    // Verificar se o plano existe
    const existingPlan = await prisma.emailPlanConfig.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        message: 'Plano não encontrado'
      });
    }

    // Atualizar domínios permitidos se fornecidos
    if (allowedDomainIds !== undefined) {
      // Remover domínios antigos
      await prisma.emailPlanAllowedDomain.deleteMany({
        where: { planId: id }
      });

      // Adicionar novos domínios
      if (allowedDomainIds.length > 0) {
        await prisma.emailPlanAllowedDomain.createMany({
          data: allowedDomainIds.map((domainId: string) => ({
            planId: id,
            domainId
          }))
        });
      }
    }

    // Atualizar plano
    const updatedPlan = await prisma.emailPlanConfig.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(monthlyPrice !== undefined && { monthlyPrice }),
        ...(maxEmailsPerMonth !== undefined && { maxEmailsPerMonth }),
        ...(maxAccounts !== undefined && { maxAccounts }),
        ...(features !== undefined && { features }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        allowedDomains: {
          include: {
            domain: true
          }
        }
      }
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'EMAIL_PLAN_UPDATED',
        resource: 'email_plan',
        details: {
          planId: id,
          changes: { name, monthlyPrice, maxEmailsPerMonth, maxAccounts, isActive }
        },
        ip: req.ip || 'unknown',
        success: true
      }
    });

    res.json({
      success: true,
      message: 'Plano atualizado com sucesso',
      plan: {
        id: updatedPlan.id,
        name: updatedPlan.name,
        code: updatedPlan.code,
        monthlyPrice: Number(updatedPlan.monthlyPrice),
        maxEmailsPerMonth: updatedPlan.maxEmailsPerMonth,
        maxAccounts: updatedPlan.maxAccounts,
        features: updatedPlan.features,
        isActive: updatedPlan.isActive,
        allowedDomains: updatedPlan.allowedDomains.map(ad => ({
          id: ad.id,
          domainId: ad.domainId,
          domainName: ad.domain.domainName
        }))
      }
    });
  } catch (error) {
    console.error('Error updating email plan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao atualizar plano'
    });
  }
}));

/**
 * DELETE /api/super-admin/email/plans/:id
 * Deletar (soft delete) plano de email
 */
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se o plano existe
    const plan = await prisma.emailPlanConfig.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        message: 'Plano não encontrado'
      });
    }

    // Verificar se há assinaturas ativas
    if (plan._count.subscriptions > 0) {
      return res.status(400).json({
        success: false,
        error: 'Plan has active subscriptions',
        message: `Este plano tem ${plan._count.subscriptions} assinatura(s) ativa(s). Desative o plano ao invés de deletá-lo.`
      });
    }

    // Soft delete - apenas desativar
    await prisma.emailPlanConfig.update({
      where: { id },
      data: { isActive: false }
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'EMAIL_PLAN_DELETED',
        resource: 'email_plan',
        details: {
          planId: id,
          planName: plan.name
        },
        ip: req.ip || 'unknown',
        success: true
      }
    });

    res.json({
      success: true,
      message: 'Plano desativado com sucesso'
    });
  } catch (error) {
    console.error('Error deleting email plan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao deletar plano'
    });
  }
}));

/**
 * GET /api/super-admin/email/plans/:id/subscriptions
 * Listar todas as assinaturas de um plano
 */
router.get('/:id/subscriptions', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subscriptions = await prisma.emailSubscription.findMany({
      where: { planConfigId: id },
      include: {
        emailServer: {
          select: {
            id: true,
            hostname: true,
            isActive: true,
            users: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        trialEndsAt: sub.trialEndsAt,
        emailServer: sub.emailServer,
        createdAt: sub.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching plan subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar assinaturas do plano'
    });
  }
}));

/**
 * GET /api/super-admin/email/available-domains
 * Listar domínios disponíveis para vincular aos planos
 */
router.get('/domains/available', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const domains = await prisma.emailDomain.findMany({
      where: {
        isVerified: true
      },
      select: {
        id: true,
        domainName: true,
        isVerified: true,
        dkimEnabled: true,
        spfEnabled: true,
        dmarcEnabled: true,
        createdAt: true
      },
      orderBy: { domainName: 'asc' }
    });

    res.json({
      success: true,
      domains
    });
  } catch (error) {
    console.error('Error fetching available domains:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar domínios disponíveis'
    });
  }
}));

export default router;
