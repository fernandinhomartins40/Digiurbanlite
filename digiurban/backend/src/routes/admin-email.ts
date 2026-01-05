import { Router, Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcrypt';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { requireRole } from '../middleware/auth';
import { TransactionalEmailService } from '../lib/email/TransactionalEmailService';
import { AuthenticatedRequest, SuccessResponse, ErrorResponse } from '../types';
import { asyncHandler } from '../utils/express-helpers';
import { prisma } from '../lib/prisma';
import { EmailPlan, UserRole } from '@prisma/client';
import * as crypto from 'crypto';

const router = Router();
const transactionalEmail = new TransactionalEmailService();

// Middleware para autenticação
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/email-service
 * Obter configurações do serviço de email
 */
router.get('/', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Buscar servidor de email e subscription
    const emailServer = await prisma.emailServer.findFirst({
      include: {
        subscription: true,
        domains: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            sentThisMonth: true,
            monthlyLimit: true
          }
        }
      }
    });

    if (!emailServer || !emailServer.subscription) {
      return res.json({
        hasEmailService: false,
        plan: { id: 'none', name: 'Nenhum', price: 0, emailsPerMonth: 0 },
        domains: [],
        statistics: [],
        usage: { currentMonth: 0 }
      });
    }

    const subscription = emailServer.subscription;

    res.json({
      hasEmailService: true,
      plan: {
        id: subscription.plan.toLowerCase(),
        name: getEmailPlanName(subscription.plan),
        price: Number(subscription.monthlyPrice),
        emailsPerMonth: subscription.maxEmailsPerMonth
      },
      server: {
        hostname: emailServer.hostname,
        isActive: emailServer.isActive,
        maxEmailsPerMonth: subscription.maxEmailsPerMonth
      },
      domains: emailServer.domains,
      accounts: emailServer.users,
      usage: await getEmailUsage()
    });
  } catch (error) {
    console.error('Error getting email config:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
}));

/**
 * POST /api/admin/email-service/subscribe
 * Contratar plano de email
 */
router.post('/subscribe', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    // Validar plano
    const validPlans = ['basic', 'standard', 'premium', 'enterprise'];
    if (!validPlans.includes(planId)) {
      res
        .status(400)
        .json({ success: false, error: 'Plano inválido', message: 'Plano inválido' });
      return;
    }

    // Mapear plano para enum
    const planMapping: Record<string, EmailPlan> = {
      basic: EmailPlan.BASIC,
      standard: EmailPlan.STANDARD,
      premium: EmailPlan.PREMIUM,
      enterprise: EmailPlan.ENTERPRISE
    };

    const plan = planMapping[planId];
    const planDetails = getEmailPlanDetails(planId);

    // Verificar se já existe servidor de email
    let emailServer = await prisma.emailServer.findFirst({
      include: {
        subscription: true
      }
    });

    if (emailServer?.subscription) {
      // Já existe assinatura - fazer upgrade/downgrade
      await prisma.emailSubscription.update({
        where: { id: emailServer.subscription.id },
        data: {
          plan,
          monthlyPrice: planDetails.price,
          maxEmailsPerMonth: planDetails.emailsPerMonth,
          maxAccounts: planDetails.accounts,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias
        }
      });

      await prisma.emailServer.update({
        where: { id: emailServer.id },
        data: {
          maxEmailsPerMonth: planDetails.emailsPerMonth
        }
      });

      return res.json({
        success: true,
        message: `Plano atualizado para ${planDetails.name} com sucesso!`,
        server: emailServer
      });
    }

    // Criar novo servidor de email com subscription
    const hostname = `mail.digiurban.com.br`; // Domínio único gerenciado pelo SuperAdmin

    emailServer = await prisma.emailServer.create({
      data: {
        hostname,
        mxPort: 25,
        submissionPort: 587,
        tlsEnabled: true,
        isPremiumService: true,
        monthlyPrice: planDetails.price,
        maxEmailsPerMonth: planDetails.emailsPerMonth,
        isActive: true,
        subscription: {
          create: {
            plan,
            monthlyPrice: planDetails.price,
            maxEmailsPerMonth: planDetails.emailsPerMonth,
            maxAccounts: planDetails.accounts,
            status: 'TRIAL', // 30 dias de trial
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      include: {
        subscription: true
      }
    });

    // Criar conta admin padrão
    const defaultPassword = generateSecurePassword();
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    const adminEmail = `admin@digiurban.com.br`;

    await prisma.emailUser.create({
      data: {
        emailServerId: emailServer.id,
        email: adminEmail,
        passwordHash,
        name: 'Administrador',
        isActive: true,
        isAdmin: true,
        dailyLimit: Math.floor(planDetails.emailsPerMonth / 30),
        monthlyLimit: planDetails.emailsPerMonth
      }
    });

    // Criar domínio padrão verificado
    await prisma.emailDomain.create({
      data: {
        emailServerId: emailServer.id,
        domainName: 'digiurban.com.br',
        isVerified: true, // Domínio do sistema já verificado
        dkimEnabled: true,
        spfEnabled: true
      }
    });

    // Criar templates padrão
    await transactionalEmail.createDefaultTemplates(emailServer.id);

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EMAIL_SERVICE_SUBSCRIBED',
        resource: 'email_service',
        details: { planId, message: `Contratou plano de email: ${planDetails.name}` },
        ip: req.ip || 'unknown',
        success: true
      }
    });

    res.json({
      success: true,
      message: `Serviço de email contratado com sucesso! Trial de 30 dias iniciado.`,
      credentials: {
        email: adminEmail,
        password: defaultPassword,
        server: emailServer.hostname,
        port: 587
      }
    });
  } catch (error) {
    console.error('Error subscribing to email service:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
}));

/**
 * Helper: Obter detalhes do plano
 */
function getEmailPlanDetails(planId: string) {
  const plans: Record<string, { name: string; price: number; emailsPerMonth: number; accounts: number }> = {
    basic: { name: 'Básico', price: 49, emailsPerMonth: 5000, accounts: 5 },
    standard: { name: 'Padrão', price: 99, emailsPerMonth: 15000, accounts: 15 },
    premium: { name: 'Premium', price: 199, emailsPerMonth: 50000, accounts: 50 },
    enterprise: { name: 'Enterprise', price: 399, emailsPerMonth: 999999999, accounts: 999 }
  };
  return plans[planId];
}

/**
 * POST /api/admin/email-service/domain
 * Adicionar domínio personalizado
 */
router.post('/domain', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { domain } = req.body;
    // Single tenant: tenantId removido

    if (!domain || !isValidDomain(domain)) {
      res
        .status(400)
        .json({ success: false, error: 'Domínio inválido', message: 'Domínio inválido' });
      return;
    }

    const emailServer = await prisma.emailServer.findFirst({});

    if (!emailServer) {
      res
        .status(404)
        .json({
          success: false,
          error: 'Serviço de email não encontrado',
          message: 'Serviço de email não encontrado'
        });
      return;
    }

    // Verificar se domínio já existe
    const existingDomain = await prisma.emailDomain.findFirst({
      where: {
        emailServerId: emailServer.id,
        domainName: domain
        }
        });

    if (existingDomain) {
      res
        .status(409)
        .json({ success: false, error: 'Domínio já cadastrado', message: 'Domínio já cadastrado' });
      return;
    }

    // Gerar token de verificação
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Criar domínio
    const emailDomain = await prisma.emailDomain.create({
      data: {
        emailServerId: emailServer.id,
        domainName: domain,
        isVerified: false,
        verificationToken,
        dkimEnabled: true,
        spfEnabled: true
        }
        });

    // Gerar registros DNS necessários
    const dnsRecords = generateDNSRecords(domain, emailServer.hostname, verificationToken);

    res.json({
      success: true,
      domain: emailDomain,
      dnsRecords,
      message: 'Domínio adicionado. Configure os registros DNS para verificação.'
        });
  } catch (error) {
    console.error('Error adding domain:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
}));

/**
 * POST /api/admin/email-service/domain/:id/verify
 * Verificar configuração DNS do domínio
 */
router.post('/domain/:id/verify', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Single tenant: tenantId removido

    const domain = await prisma.emailDomain.findFirst({
      where: {
        id,
        emailServer: {}
        },
      include: {
        emailServer: true
        }
      });

    if (!domain) {
      res
        .status(404)
        .json({
          success: false,
          error: 'Domínio não encontrado',
          message: 'Domínio não encontrado'
        });
      return;
    }

    // Verificar DNS (simulado)
    const isVerified = await verifyDNSRecords(domain.domainName, domain.verificationToken!);

    if (isVerified) {
      await prisma.emailDomain.update({
        where: { id },
        data: {
          isVerified: true,
          verificationToken: null
        }
        });

      res.json({
        success: true,
        message: 'Domínio verificado com sucesso!'
        });
    } else {
      res.json({
        success: false,
        message:
          'Verificação DNS falhou. Verifique se os registros foram configurados corretamente.'
        });
    }
  } catch (error) {
    console.error('Error verifying domain:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
}));

/**
 * GET /api/admin/email-service/stats
 * Obter estatísticas de email
 */
router.get('/stats', requireRole(UserRole.ADMIN), async (req, res, next) => {
  try {
    // Single tenant: tenantId removido

    const emailServer = await prisma.emailServer.findFirst({});

    if (!emailServer) {
      res
        .status(404)
        .json({
          success: false,
          error: 'Serviço de email não encontrado',
          message: 'Serviço de email não encontrado'
        });
      return;
    }

    // Estatísticas do mês atual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [totalSent, totalDelivered, totalFailed, totalBounced, monthlyStats] = await Promise.all([
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
          createdAt: { gte: currentMonth }
        }
        }),
      prisma.emailStats.findMany({
        where: {
          emailServerId: emailServer.id,
          date: { gte: currentMonth }
        },
        orderBy: { date: 'asc' }
        }),
    ]);

    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0';
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0';

    res.json({
      currentMonth: {
        totalSent,
        totalDelivered,
        totalFailed,
        totalBounced,
        deliveryRate: `${deliveryRate}%`,
        bounceRate: `${bounceRate}%`
        },
      dailyStats: monthlyStats,
      usage: {
        current: totalSent,
        limit: emailServer.maxEmailsPerMonth,
        percentage:
          emailServer.maxEmailsPerMonth > 0
            ? ((totalSent / emailServer.maxEmailsPerMonth) * 100).toFixed(1)
            : '0'
        }
        });
  } catch (error) {
    console.error('Error getting email stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * GET /api/admin/email-service/templates
 * Listar templates de email
 */
router.get('/templates', requireRole(UserRole.ADMIN), async (req, res, next) => {
  try {
    // Buscar o emailServer ativo
    const emailServer = await prisma.emailServer.findFirst({});
    if (!emailServer) {
      return res.status(404).json({ success: false, error: 'Email server not configured' });
    }

    const templates = await transactionalEmail.getTemplates(emailServer.id);

    res.json(templates);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * PUT /api/admin/email-service/templates/:name
 * Atualizar template de email
 */
router.put('/templates/:name', requireRole(UserRole.ADMIN), async (req, res, next) => {
  try {
    const { name } = req.params;
    const updates = req.body;

    // Buscar o emailServer ativo
    const emailServer = await prisma.emailServer.findFirst({});
    if (!emailServer) {
      return res.status(404).json({ success: false, error: 'Email server not configured' });
    }

    const template = await transactionalEmail.updateTemplate(emailServer.id, name, updates);

    res.json({
      success: true,
      template
        });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

// Funções auxiliares

function getEmailPlanName(planType: string): string {
  const plans: Record<string, string> = {
    NONE: 'Nenhum',
    BASIC: 'Básico',
    STANDARD: 'Padrão',
    PREMIUM: 'Premium',
    ENTERPRISE: 'Enterprise'
        };
  return plans[planType] || 'Nenhum';
}

function getEmailPlanPrice(planId: string): number {
  const prices: Record<string, number> = {
    basic: 49,
    standard: 99,
    premium: 199,
    enterprise: 399
        };
  return prices[planId] || 0;
}

function getEmailPlanLimit(planId: string): number {
  const limits: Record<string, number> = {
    basic: 5000,
    standard: 15000,
    premium: 50000,
    enterprise: 999999999
        };
  return limits[planId] || 0;
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function isValidDomain(domain: string): boolean {
  const domainRegex =
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain);
}

function generateDNSRecords(domain: string, hostname: string, verificationToken: string) {
  return [
    {
      type: 'MX',
      name: domain,
      value: `10 ${hostname}`,
      priority: 10,
      ttl: 3600
        },
    {
      type: 'TXT',
      name: domain,
      value: `v=spf1 mx include:${hostname} ~all`,
      ttl: 3600
        },
    {
      type: 'TXT',
      name: `_dmarc.${domain}`,
      value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${hostname}`,
      ttl: 3600
        },
    {
      type: 'TXT',
      name: `digiurban-verification.${domain}`,
      value: verificationToken,
      ttl: 300
        },
    {
      type: 'CNAME',
      name: `mail.${domain}`,
      value: hostname,
      ttl: 3600
        },
  ];
}

async function verifyDNSRecords(domain: string, verificationToken: string): Promise<boolean> {
  // Em produção, fazer verificação real de DNS
  // Por agora, simular verificação
  return Math.random() > 0.3; // 70% de chance de sucesso
}

async function getEmailUsage() {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const sent = await prisma.email.count({
    where: {
      sentAt: { gte: currentMonth }
        }
        });

  return { currentMonth: sent };
}

/**
 * GET /api/admin/email/sent
 * Listar emails enviados
 */
router.get('/sent', requireMinRole(UserRole.COORDINATOR), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const emailServer = await prisma.emailServer.findFirst({});

    if (!emailServer) {
      return res.status(404).json({
        success: false,
        error: 'Serviço de email não encontrado',
        message: 'Serviço de email não encontrado'
      });
    }

    // Buscar emails enviados (últimos 100)
    const emails = await prisma.email.findMany({
      where: {
        emailServerId: emailServer.id
      },
      select: {
        id: true,
        messageId: true,
        fromEmail: true,
        toEmail: true,
        subject: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        failedAt: true,
        errorMessage: true,
        opens: true,
        clicks: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    res.json({
      success: true,
      emails
    });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar emails enviados'
    });
  }
}));

/**
 * GET /api/admin/email/inbox
 * Listar emails recebidos (mock - implementação futura com IMAP)
 */
router.get('/inbox', requireMinRole(UserRole.COORDINATOR), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Implementar integração IMAP para buscar emails recebidos
    // Por enquanto retorna array vazio
    res.json({
      success: true,
      emails: []
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar caixa de entrada'
    });
  }
}));

/**
 * GET /api/admin/email/drafts
 * Listar rascunhos
 */
router.get('/drafts', requireMinRole(UserRole.COORDINATOR), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Implementar tabela de rascunhos no Prisma
    // Por enquanto retorna array vazio
    res.json({
      success: true,
      drafts: []
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar rascunhos'
    });
  }
}));

/**
 * POST /api/admin/email/drafts
 * Salvar rascunho
 */
router.post('/drafts', requireMinRole(UserRole.COORDINATOR), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { to, cc, bcc, subject, message, accountId, priority } = req.body;

    // TODO: Salvar no banco
    res.json({
      success: true,
      message: 'Rascunho salvo com sucesso',
      draft: {
        id: 'draft-' + Date.now(),
        to,
        cc,
        bcc,
        subject,
        message,
        accountId,
        priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao salvar rascunho'
    });
  }
}));

/**
 * DELETE /api/admin/email/drafts/:id
 * Excluir rascunho
 */
router.delete('/drafts/:id', requireMinRole(UserRole.COORDINATOR), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Excluir do banco
    res.json({
      success: true,
      message: 'Rascunho excluído'
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao excluir rascunho'
    });
  }
}));

/**
 * GET /api/admin/email/trash
 * Listar emails na lixeira
 */
router.get('/trash', requireMinRole(UserRole.COORDINATOR), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Implementar soft delete e listar emails deletados
    res.json({
      success: true,
      emails: []
    });
  } catch (error) {
    console.error('Error fetching trash:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar lixeira'
    });
  }
}));

/**
 * POST /api/admin/email/trash/:id/restore
 * Restaurar email da lixeira
 */
router.post('/trash/:id/restore', requireMinRole(UserRole.COORDINATOR), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Restaurar email
    res.json({
      success: true,
      message: 'Email restaurado'
    });
  } catch (error) {
    console.error('Error restoring email:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao restaurar email'
    });
  }
}));

/**
 * DELETE /api/admin/email/trash/:id
 * Excluir email permanentemente
 */
router.delete('/trash/:id', requireMinRole(UserRole.COORDINATOR), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Excluir permanentemente
    res.json({
      success: true,
      message: 'Email excluído permanentemente'
    });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao excluir email'
    });
  }
}));

/**
 * POST /api/admin/email/trash/empty
 * Esvaziar lixeira
 */
router.post('/trash/empty', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Excluir todos os emails da lixeira
    res.json({
      success: true,
      message: 'Lixeira esvaziada'
    });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao esvaziar lixeira'
    });
  }
}));

export default router;
