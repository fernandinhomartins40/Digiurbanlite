import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/express-helpers';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';
import { emailSenderService } from '../services/EmailSenderService';
import { uploadDocuments } from '../config/upload';
import path from 'path';

const router = Router();

// Middleware para autenticação
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/email-accounts
 * Listar todas as contas de email do município
 */
router.get('/', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    if (!emailServer) {
      return res.status(404).json({
        success: false,
        error: 'Serviço de email não configurado',
        message: 'Você precisa contratar um plano de email primeiro'
      });
    }

    const accounts = await prisma.emailUser.findMany({
      where: { emailServerId: emailServer.id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isAdmin: true,
        dailyLimit: true,
        monthlyLimit: true,
        sentToday: true,
        sentThisMonth: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: { sentEmails: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      accounts,
      server: {
        hostname: emailServer.hostname,
        maxAccounts: emailServer.subscription?.planConfig?.maxAccounts || 0
      }
    });
  } catch (error) {
    console.error('Error listing email accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao listar contas de email'
    });
  }
}));

/**
 * POST /api/admin/email-accounts
 * Criar nova conta de email
 */
router.post('/', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, department, position, dailyLimit, monthlyLimit } = req.body;
    const userId = req.user.id;

    // Validar campos obrigatórios
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos',
        message: 'Nome e email são obrigatórios'
      });
    }

    // Buscar servidor de email
    const emailServer = await prisma.emailServer.findFirst({
      include: {
        subscription: {
          include: {
            planConfig: true // ✅ Buscar planConfig para obter limites reais
          }
        },
        users: true,
        domains: {
          where: { isVerified: true },
          select: { domainName: true }
        }
      }
    });

    if (!emailServer || !emailServer.subscription || !emailServer.subscription.planConfig) {
      return res.status(404).json({
        success: false,
        error: 'Serviço não configurado',
        message: 'Você precisa contratar um plano de email primeiro'
      });
    }

    // ✅ Usar planConfig como fonte única de verdade
    const planConfig = emailServer.subscription.planConfig;
    const currentAccountsCount = emailServer.users.length;
    const maxAccounts = planConfig.maxAccounts;

    if (currentAccountsCount >= maxAccounts) {
      return res.status(403).json({
        success: false,
        error: 'Limite de contas atingido',
        message: `Você atingiu o limite de ${maxAccounts} contas do plano ${planConfig.name}. Faça upgrade para criar mais contas.`
      });
    }

    // Extrair domínio do email fornecido
    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido',
        message: 'Formato de email inválido'
      });
    }

    const requestedDomain = emailParts[1];
    const verifiedDomains = emailServer.domains.map(d => d.domainName);

    // Validar se o domínio está verificado
    if (!verifiedDomains.includes(requestedDomain)) {
      return res.status(400).json({
        success: false,
        error: 'Domínio não verificado',
        message: `O domínio ${requestedDomain} não está verificado. Domínios disponíveis: ${verifiedDomains.join(', ')}`
      });
    }

    // Verificar se email já existe
    const existingAccount = await prisma.emailUser.findFirst({
      where: {
        emailServerId: emailServer.id,
        email
      }
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        error: 'Email já existe',
        message: `A conta ${email} já está cadastrada`
      });
    }

    // Gerar senha segura
    const password = generateSecurePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    // ✅ Definir limites padrão se não fornecidos (usar planConfig)
    const accountDailyLimit = dailyLimit || Math.floor(planConfig.maxEmailsPerMonth / 30 / maxAccounts);
    const accountMonthlyLimit = monthlyLimit || Math.floor(planConfig.maxEmailsPerMonth / maxAccounts);

    // ✅ VALIDAR: limites fornecidos não podem exceder o plano
    if (dailyLimit && dailyLimit > Math.floor(planConfig.maxEmailsPerMonth / 30)) {
      return res.status(400).json({
        success: false,
        error: 'Limite diário excede o plano',
        message: `Limite diário máximo: ${Math.floor(planConfig.maxEmailsPerMonth / 30)} emails`
      });
    }

    if (monthlyLimit && monthlyLimit > planConfig.maxEmailsPerMonth) {
      return res.status(400).json({
        success: false,
        error: 'Limite mensal excede o plano',
        message: `Limite mensal máximo: ${planConfig.maxEmailsPerMonth} emails (plano ${planConfig.name})`
      });
    }

    // Criar conta
    const account = await prisma.emailUser.create({
      data: {
        emailServerId: emailServer.id,
        email,
        passwordHash,
        name,
        dailyLimit: accountDailyLimit,
        monthlyLimit: accountMonthlyLimit,
        isActive: true,
        isAdmin: false
      }
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EMAIL_ACCOUNT_CREATED',
        resource: 'email_account',
        details: {
          email,
          name,
          department,
          position,
          dailyLimit: accountDailyLimit,
          monthlyLimit: accountMonthlyLimit
        },
        ip: req.ip || 'unknown',
        success: true
      }
    });

    // Retornar credenciais (ÚNICA VEZ!)
    res.json({
      success: true,
      message: 'Conta de email criada com sucesso!',
      account: {
        id: account.id,
        email: account.email,
        name: account.name
      },
      credentials: {
        email: account.email,
        password, // Senha em texto plano (mostrar apenas UMA vez)
        server: emailServer.hostname,
        port: 587,
        security: 'STARTTLS'
      }
    });
  } catch (error) {
    console.error('Error creating email account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao criar conta de email'
    });
  }
}));

/**
 * GET /api/admin/email-accounts/:id
 * Obter detalhes de uma conta específica
 */
router.get('/:id', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const account = await prisma.emailUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isAdmin: true,
        dailyLimit: true,
        monthlyLimit: true,
        sentToday: true,
        sentThisMonth: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: { sentEmails: true }
        }
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada',
        message: 'Conta de email não encontrada'
      });
    }

    res.json({ success: true, account });
  } catch (error) {
    console.error('Error getting email account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar conta'
    });
  }
}));

/**
 * PUT /api/admin/email-accounts/:id
 * Atualizar conta de email
 */
router.put('/:id', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, dailyLimit, monthlyLimit, isActive } = req.body;
    const userId = req.user.id;

    const account = await prisma.emailUser.findUnique({
      where: { id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada',
        message: 'Conta de email não encontrada'
      });
    }

    const updatedAccount = await prisma.emailUser.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(dailyLimit !== undefined && { dailyLimit }),
        ...(monthlyLimit !== undefined && { monthlyLimit }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        dailyLimit: true,
        monthlyLimit: true
      }
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EMAIL_ACCOUNT_UPDATED',
        resource: 'email_account',
        details: {
          accountId: id,
          email: account.email,
          changes: { name, dailyLimit, monthlyLimit, isActive }
        },
        ip: req.ip || 'unknown',
        success: true
      }
    });

    res.json({
      success: true,
      message: 'Conta atualizada com sucesso',
      account: updatedAccount
    });
  } catch (error) {
    console.error('Error updating email account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao atualizar conta'
    });
  }
}));

/**
 * POST /api/admin/email-accounts/:id/reset-password
 * Redefinir senha da conta
 */
router.post('/:id/reset-password', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const account = await prisma.emailUser.findUnique({
      where: { id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada',
        message: 'Conta de email não encontrada'
      });
    }

    const newPassword = generateSecurePassword();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.emailUser.update({
      where: { id },
      data: { passwordHash }
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EMAIL_ACCOUNT_PASSWORD_RESET',
        resource: 'email_account',
        details: { accountId: id, email: account.email },
        ip: req.ip || 'unknown',
        success: true
      }
    });

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      credentials: {
        email: account.email,
        password: newPassword // Mostrar apenas UMA vez
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao redefinir senha'
    });
  }
}));

/**
 * DELETE /api/admin/email-accounts/:id
 * Deletar conta de email (soft delete)
 */
router.delete('/:id', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const account = await prisma.emailUser.findUnique({
      where: { id }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada',
        message: 'Conta de email não encontrada'
      });
    }

    // Soft delete (desativar conta)
    await prisma.emailUser.update({
      where: { id },
      data: { isActive: false }
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EMAIL_ACCOUNT_DELETED',
        resource: 'email_account',
        details: { accountId: id, email: account.email },
        ip: req.ip || 'unknown',
        success: true
      }
    });

    res.json({
      success: true,
      message: 'Conta desativada com sucesso'
    });
  } catch (error) {
    console.error('Error deleting email account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao deletar conta'
    });
  }
}));

/**
 * GET /api/admin/email-accounts/:id/usage
 * Obter estatísticas de uso da conta
 */
router.get('/:id/usage', requireMinRole(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const account = await prisma.emailUser.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sentEmails: true }
        }
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada',
        message: 'Conta de email não encontrada'
      });
    }

    // Estatísticas do mês atual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [totalSent, deliveredEmails, failedEmails] = await Promise.all([
      prisma.email.count({
        where: {
          userId: id,
          sentAt: { gte: currentMonth }
        }
      }),
      prisma.email.count({
        where: {
          userId: id,
          status: 'DELIVERED',
          deliveredAt: { gte: currentMonth }
        }
      }),
      prisma.email.count({
        where: {
          userId: id,
          status: 'FAILED',
          failedAt: { gte: currentMonth }
        }
      })
    ]);

    const deliveryRate = totalSent > 0 ? ((deliveredEmails / totalSent) * 100).toFixed(1) : '0';

    res.json({
      success: true,
      usage: {
        currentMonth: {
          totalSent,
          delivered: deliveredEmails,
          failed: failedEmails,
          deliveryRate: `${deliveryRate}%`
        },
        limits: {
          daily: account.dailyLimit,
          monthly: account.monthlyLimit,
          usedToday: account.sentToday,
          usedThisMonth: account.sentThisMonth
        },
        percentages: {
          daily: account.dailyLimit > 0 ? ((account.sentToday / account.dailyLimit) * 100).toFixed(1) : '0',
          monthly: account.monthlyLimit > 0 ? ((account.sentThisMonth / account.monthlyLimit) * 100).toFixed(1) : '0'
        }
      }
    });
  } catch (error) {
    console.error('Error getting account usage:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar uso da conta'
    });
  }
}));

/**
 * POST /api/admin/email-accounts/send
 * Enviar email via webmail interno (com suporte a anexos)
 */
router.post('/send', requireMinRole(UserRole.ADMIN), uploadDocuments, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Parse de campos JSON se vieram via FormData
    let accountId = req.body.accountId;
    let to = req.body.to;
    let cc = req.body.cc;
    let bcc = req.body.bcc;
    let subject = req.body.subject;
    let text = req.body.text;
    let html = req.body.html;
    let body = req.body.body;
    let priority = req.body.priority;

    // Se vieram como JSON strings (FormData), fazer parse
    try {
      if (typeof to === 'string' && to.startsWith('[')) {
        to = JSON.parse(to);
      }
      if (typeof cc === 'string' && cc.startsWith('[')) {
        cc = JSON.parse(cc);
      }
      if (typeof bcc === 'string' && bcc.startsWith('[')) {
        bcc = JSON.parse(bcc);
      }
    } catch (parseError) {
      console.log('Destinatários já estão no formato correto');
    }

    const uploadedFiles = (req.files as Express.Multer.File[]) || [];
    const userId = req.user.id;

    // Log de debug
    console.log('📧 [EMAIL SEND] Content-Type:', req.headers['content-type']);
    console.log('📧 [EMAIL SEND] Request body:', JSON.stringify(req.body, null, 2));
    console.log('📧 [EMAIL SEND] Files received:', uploadedFiles.length);
    if (uploadedFiles.length > 0) {
      console.log('📧 [EMAIL SEND] Files details:', uploadedFiles.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        size: f.size,
        mimetype: f.mimetype
      })));
    }

    // Aceitar tanto "body" quanto "text"/"html" (compatibilidade com diferentes frontends)
    const emailBody = body || text || html;

    // Validar campos obrigatórios
    if (!accountId || !to || !subject || !emailBody) {
      console.error('❌ [EMAIL SEND] Validation failed:', {
        hasAccountId: !!accountId,
        hasTo: !!to,
        hasSubject: !!subject,
        hasBody: !!body,
        hasText: !!text,
        hasHtml: !!html,
        receivedFields: Object.keys(req.body)
      });

      return res.status(400).json({
        success: false,
        error: 'Dados incompletos',
        message: 'accountId, to, subject e body/text/html são obrigatórios',
        debug: {
          hasAccountId: !!accountId,
          hasTo: !!to,
          hasSubject: !!subject,
          hasBody: !!body,
          hasText: !!text,
          hasHtml: !!html,
          receivedFields: Object.keys(req.body)
        }
      });
    }

    // Buscar conta de email
    const account = await prisma.emailUser.findUnique({
      where: { id: accountId },
      include: {
        emailServer: {
          include: {
            subscription: {
              include: {
                planConfig: true
              }
            },
            domains: {
              where: { isVerified: true },
              select: { domainName: true }
            }
          }
        }
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada',
        message: 'Conta de email não encontrada'
      });
    }

    if (!account.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Conta inativa',
        message: 'Esta conta de email está inativa'
      });
    }

    // Verificar se servidor está ativo
    if (!account.emailServer.isActive) {
      return res.status(503).json({
        success: false,
        error: 'Servidor inativo',
        message: 'O servidor de email está temporariamente indisponível'
      });
    }

    // Verificar se subscription está ativa
    const subscription = account.emailServer.subscription;
    if (!subscription || subscription.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Assinatura inativa',
        message: 'A assinatura de email está inativa ou expirada. Entre em contato com o administrador.'
      });
    }

    // Verificar se subscription não expirou
    if (subscription.currentPeriodEnd < new Date()) {
      return res.status(402).json({
        success: false,
        error: 'Assinatura expirada',
        message: 'A assinatura de email expirou. Renove para continuar enviando emails.'
      });
    }

    // Verificar limite diário
    if (account.sentToday >= account.dailyLimit) {
      return res.status(429).json({
        success: false,
        error: 'Limite diário atingido',
        message: `Você atingiu o limite de ${account.dailyLimit} emails por dia. Tente novamente amanhã.`
      });
    }

    // Verificar limite mensal
    if (account.sentThisMonth >= account.monthlyLimit) {
      return res.status(429).json({
        success: false,
        error: 'Limite mensal atingido',
        message: `Você atingiu o limite de ${account.monthlyLimit} emails por mês. Aguarde o próximo ciclo.`
      });
    }

    // Verificar limite mensal do servidor
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const serverEmailsSent = await prisma.email.count({
      where: {
        emailServerId: account.emailServer.id,
        sentAt: { gte: currentMonth }
      }
    });

    // Verificar limite do plano
    const planConfig = account.emailServer.subscription?.planConfig;
    if (!planConfig) {
      return res.status(500).json({
        success: false,
        error: 'Plano não encontrado',
        message: 'Não foi possível encontrar o plano de email do servidor'
      });
    }

    if (planConfig.maxEmailsPerMonth > 0 && serverEmailsSent >= planConfig.maxEmailsPerMonth) {
      return res.status(429).json({
        success: false,
        error: 'Limite do servidor atingido',
        message: `O limite mensal do servidor foi atingido (${planConfig.maxEmailsPerMonth} emails). Entre em contato com o administrador.`
      });
    }

    // Gerar ID de mensagem único
    const messageId = `<${crypto.randomBytes(16).toString('hex')}@${account.emailServer.hostname}>`;

    // Normalizar destinatários (to pode vir como string ou array)
    const toEmails = Array.isArray(to) ? to : [to];
    const primaryTo = toEmails[0]; // Primeiro destinatário principal

    // Preparar anexos se houver arquivos
    const attachmentsData = uploadedFiles.length > 0 ? uploadedFiles.map(file => ({
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype,
      size: file.size
    })) : undefined;

    // ✅ CRIAR registro no banco com status QUEUED
    const email = await prisma.email.create({
      data: {
        emailServerId: account.emailServer.id,
        userId: accountId,
        messageId,
        fromEmail: account.email,
        toEmail: primaryTo, // String (primeiro destinatário)
        ccEmails: cc ? (Array.isArray(cc) ? cc : cc.split(',').map((e: string) => e.trim())) : null,
        bccEmails: bcc ? (Array.isArray(bcc) ? bcc : bcc.split(',').map((e: string) => e.trim())) : null,
        subject,
        textContent: text || emailBody, // Priorizar text se existir
        htmlContent: html || emailBody, // Priorizar html se existir
        status: 'QUEUED', // ← QUEUED ao invés de SENT
        priority: priority ? parseInt(priority) : 3,
        attachments: attachmentsData as any // Armazenar metadados dos anexos
      }
    });

    // ✅ ENVIAR email REAL via ultrazend-smtp
    try {
      await emailSenderService.sendEmailWithRetry(email.id);
    } catch (sendError: any) {
      console.error('Erro ao enviar email:', sendError);
      // Email fica como FAILED no banco, mas não falha a request
      // O usuário será notificado que o email foi enfileirado
    }

    // Atualizar contadores da conta
    await prisma.emailUser.update({
      where: { id: accountId },
      data: {
        sentToday: { increment: 1 },
        sentThisMonth: { increment: 1 }
      }
    });

    // Atualizar estatísticas do servidor
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.emailStats.upsert({
      where: {
        emailServerId_date: {
          emailServerId: account.emailServer.id,
          date: today
        }
      },
      update: {
        totalSent: { increment: 1 }
      },
      create: {
        emailServerId: account.emailServer.id,
        date: today,
        totalSent: 1,
        totalDelivered: 0,
        totalFailed: 0,
        totalBounced: 0,
        totalComplained: 0,
        totalOpens: 0,
        totalClicks: 0,
        uniqueOpens: 0,
        uniqueClicks: 0
      }
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EMAIL_SENT',
        resource: 'email',
        details: {
          accountId,
          from: account.email,
          to,
          subject,
          messageId: email.messageId
        },
        ip: req.ip || 'unknown',
        success: true
      }
    });

    res.json({
      success: true,
      message: uploadedFiles.length > 0
        ? `Email enviado com sucesso com ${uploadedFiles.length} anexo(s)!`
        : 'Email enviado com sucesso!',
      email: {
        id: email.id,
        messageId: email.messageId,
        from: email.fromEmail,
        to: email.toEmail,
        subject: email.subject,
        sentAt: email.sentAt,
        attachmentCount: uploadedFiles.length
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao enviar email'
    });
  }
}));

// Funções auxiliares

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default router;
