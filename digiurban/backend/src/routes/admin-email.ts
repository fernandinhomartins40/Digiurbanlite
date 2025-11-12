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
    // Single tenant: tenantId removido

    // DIA 3: DISABLED - tenant model removed - returning empty data
    res.status(501).json({
      success: false,
      error: 'Not Implemented',
      message: 'Funcionalidade de email service desabilitada temporariamente'
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
    // Single tenant: tenantId removido
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
    const planMapping = {
      basic: EmailPlan.BASIC,
      standard: EmailPlan.STANDARD,
      premium: EmailPlan.PREMIUM,
      enterprise: EmailPlan.ENTERPRISE
        };

    // DIA 3: DISABLED - tenant model removed
    res
      .status(501)
      .json({ success: false, error: 'Not Implemented', message: 'Funcionalidade desabilitada temporariamente' });
    return;

    // DIA 3: DISABLED - código comentado abaixo (tenant removido)
    // const emailServer = await prisma.emailServer.upsert({
    //       //   update: {
    //     monthlyPrice: getEmailPlanPrice(planId),
    //     maxEmailsPerMonth: getEmailPlanLimit(planId),
    //     isActive: true,
    //   },
    //   create: {
    //         //     hostname: `mail.${tenant.name.toLowerCase().replace(/\s+/g, '-')}.digiurban.com.br`,
    //     monthlyPrice: getEmailPlanPrice(planId),
    //     maxEmailsPerMonth: getEmailPlanLimit(planId),
    //     isActive: true,
    //   },
    // });
    //
    // const defaultPassword = generateSecurePassword();
    // const passwordHash = await bcrypt.hash(defaultPassword, 12);
    //
    // await prisma.emailUser.upsert({
    //   where: {
    //     emailServerId_email: {
    //       emailServerId: emailServer.id,
    //       email: `admin@${tenant.name.toLowerCase().replace(/\s+/g, '-')}.digiurban.com.br`,
    //     },
    //   },
    //   update: {
    //     isActive: true,
    //   },
    //   create: {
    //     emailServerId: emailServer.id,
    //     email: `admin@${tenant.name.toLowerCase().replace(/\s+/g, '-')}.digiurban.com.br`,
    //     passwordHash,
    //     name: 'Administrador',
    //     isActive: true,
    //     isAdmin: true,
    //     dailyLimit: Math.floor(getEmailPlanLimit(planId) / 30),
    //     monthlyLimit: getEmailPlanLimit(planId),
    //   },
    // });
    //
    // await prisma.emailDomain.upsert({
    //   where: {
    //     emailServerId_domainName: {
    //       emailServerId: emailServer.id,
    //       domainName: `${tenant.name.toLowerCase().replace(/\s+/g, '-')}.digiurban.com.br`,
    //     },
    //   },
    //   update: {
    //     isVerified: true,
    //   },
    //   create: {
    //     emailServerId: emailServer.id,
    //     domainName: `${tenant.name.toLowerCase().replace(/\s+/g, '-')}.digiurban.com.br`,
    //     isVerified: true,
    //     dkimEnabled: true,
    //     spfEnabled: true,
    //   },
    // });
    //
    // await transactionalEmail.createDefaultTemplates(tenantId);
    //
    // await prisma.auditLog.create({
    //   data: {
    //         //     userId,
    //     action: 'EMAIL_SERVICE_SUBSCRIBED',
    //     resource: 'email_service',
    //     details: { planId, message: `Contratou plano de email: ${planId}` },
    //     ip: req.ip || 'unknown',
    //     success: true,
    //   },
    // });
    //
    // res.json({
    //   success: true,
    //   message: 'Serviço de email contratado com sucesso!',
    //   credentials: {
    //     email: `admin@${tenant.name.toLowerCase().replace(/\s+/g, '-')}.digiurban.com.br`,
    //     password: defaultPassword,
    //     server: emailServer.hostname,
    //     port: 587,
    //   },
    // });
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

export default router;
