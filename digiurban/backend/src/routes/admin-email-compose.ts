import { Router, Response } from 'express';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/express-helpers';
import { prisma } from '../lib/prisma';
import { uploadDocuments } from '../config/upload';
import { emailSenderService } from '../services/EmailSenderService';
import { emailServerHealthService } from '../services/email-server-health.service';
import { logAuditEvent } from '../utils/audit-logger';

const router = Router();
const EMAIL_COMPOSER_MIN_ROLE = UserRole.COORDINATOR;
const SEND_ALLOWED_SUBSCRIPTION_STATUSES = new Set(['ACTIVE', 'TRIAL']);

router.use(adminAuthMiddleware);

router.get('/senders', requireMinRole(EMAIL_COMPOSER_MIN_ROLE), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const emailServer = await prisma.emailServer.findFirst({
    include: {
      subscription: {
        include: {
          planConfig: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
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
    where: {
      emailServerId: emailServer.id,
      isActive: true
    },
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
      createdAt: true
    },
    orderBy: [
      { isAdmin: 'desc' },
      { createdAt: 'asc' }
    ]
  });

  const preferredAccount =
    accounts.find((account) => account.email.toLowerCase() === req.user.email.toLowerCase()) ||
    accounts.find((account) => account.isAdmin) ||
    accounts[0] ||
    null;

  return res.json({
    success: true,
    accounts,
    preferredAccountId: preferredAccount?.id || null,
    server: {
      hostname: emailServer.hostname,
      isActive: emailServer.isActive,
      subscriptionStatus: emailServer.subscription?.status || null
    }
  });
}));

router.get('/health', requireMinRole(EMAIL_COMPOSER_MIN_ROLE), asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const health = await emailServerHealthService.checkHealth({
    triggerRecovery: false,
    source: 'email-compose-route'
  });

  res.json({
    success: true,
    health
  });
}));

router.post('/send', requireMinRole(EMAIL_COMPOSER_MIN_ROLE), uploadDocuments, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let accountId = req.body.accountId;
  let to = req.body.to;
  let cc = req.body.cc;
  let bcc = req.body.bcc;
  const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
  const text = typeof req.body.text === 'string' ? req.body.text : undefined;
  const html = typeof req.body.html === 'string' ? req.body.html : undefined;
  const body = typeof req.body.body === 'string' ? req.body.body : undefined;
  const priorityInput = req.body.priority;

  try {
    if (typeof to === 'string' && to.trim().startsWith('[')) {
      to = JSON.parse(to);
    }
    if (typeof cc === 'string' && cc.trim().startsWith('[')) {
      cc = JSON.parse(cc);
    }
    if (typeof bcc === 'string' && bcc.trim().startsWith('[')) {
      bcc = JSON.parse(bcc);
    }
  } catch (error) {
    console.warn('Falha ao fazer parse dos destinatários do composer:', error);
  }

  const uploadedFiles = (req.files as Express.Multer.File[]) || [];
  const userId = req.user.id;
  const emailBody = body || text || html || '';
  const toEmails = normalizeRecipientList(to);
  const ccEmails = normalizeRecipientList(cc);
  const bccEmails = normalizeRecipientList(bcc);
  const invalidRecipients = [...toEmails, ...ccEmails, ...bccEmails].filter((email) => !isValidEmail(email));
  const normalizedPriority = normalizePriority(priorityInput);

  if (!accountId || toEmails.length === 0 || !subject || !emailBody.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Dados incompletos',
      message: 'accountId, to, subject e body/text/html são obrigatórios'
    });
  }

  if (invalidRecipients.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Destinatários inválidos',
      message: `Os seguintes emails são inválidos: ${invalidRecipients.join(', ')}`
    });
  }

  const account = await prisma.emailUser.findUnique({
    where: { id: accountId },
    include: {
      emailServer: {
        include: {
          subscription: {
            include: {
              planConfig: true
            }
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

  if (!account.emailServer.isActive) {
    return res.status(503).json({
      success: false,
      error: 'Servidor inativo',
      message: 'O servidor de email está temporariamente indisponível'
    });
  }

  const subscription = account.emailServer.subscription;
  if (!subscription || !SEND_ALLOWED_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return res.status(403).json({
      success: false,
      error: 'Assinatura inativa',
      message: 'A assinatura de email está inativa, suspensa ou expirada.'
    });
  }

  const subscriptionEndDate =
    subscription.status === 'TRIAL'
      ? subscription.trialEndsAt || subscription.currentPeriodEnd
      : subscription.currentPeriodEnd;

  if (subscriptionEndDate < new Date()) {
    return res.status(402).json({
      success: false,
      error: 'Assinatura expirada',
      message: 'A assinatura de email expirou. Renove para continuar enviando emails.'
    });
  }

  if (account.sentToday >= account.dailyLimit) {
    return res.status(429).json({
      success: false,
      error: 'Limite diário atingido',
      message: `Você atingiu o limite de ${account.dailyLimit} emails por dia.`
    });
  }

  if (account.sentThisMonth >= account.monthlyLimit) {
    return res.status(429).json({
      success: false,
      error: 'Limite mensal atingido',
      message: `Você atingiu o limite de ${account.monthlyLimit} emails por mês.`
    });
  }

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const serverEmailsSent = await prisma.email.count({
    where: {
      emailServerId: account.emailServer.id,
      status: {
        in: ['SENT', 'DELIVERED']
      },
      sentAt: { gte: currentMonth }
    }
  });

  const planConfig = subscription.planConfig;
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
      message: `O limite mensal do servidor foi atingido (${planConfig.maxEmailsPerMonth} emails).`
    });
  }

  const messageId = `<${crypto.randomBytes(16).toString('hex')}@${account.emailServer.hostname}>`;
  const attachmentsData = uploadedFiles.length > 0
    ? uploadedFiles.map((file) => ({
        filename: file.originalname,
        path: file.path,
        contentType: file.mimetype,
        size: file.size
      }))
    : undefined;

  const email = await prisma.email.create({
    data: {
      emailServerId: account.emailServer.id,
      userId: accountId,
      messageId,
      fromEmail: account.email,
      toEmail: toEmails.join(', '),
      ccEmails: ccEmails.length > 0 ? ccEmails : undefined,
      bccEmails: bccEmails.length > 0 ? bccEmails : undefined,
      subject,
      textContent: text || stripHtml(emailBody),
      htmlContent: html || emailBody,
      status: 'QUEUED',
      priority: normalizedPriority,
      attachments: attachmentsData as any,
      metadata: {
        requestedByUserId: userId,
        requestedByUserEmail: req.user.email,
        requestedByUserRole: req.user.role,
        toRecipients: toEmails,
        ccRecipients: ccEmails,
        bccRecipients: bccEmails,
        attachmentCount: uploadedFiles.length
      }
    }
  });

  try {
    const sendResult = await emailSenderService.sendEmailWithRetry(email.id);

    const postSendTasks = await Promise.allSettled([
      prisma.emailUser.update({
        where: { id: accountId },
        data: {
          sentToday: { increment: 1 },
          sentThisMonth: { increment: 1 }
        }
      }),
      upsertEmailStats(account.emailServer.id, {
        totalSent: 1
      }),
      logAuditEvent({
        userId,
        action: 'EMAIL_SENT',
        resource: 'email',
        details: {
          accountId,
          from: account.email,
          to: toEmails,
          cc: ccEmails,
          bcc: bccEmails,
          subject,
          messageId: email.messageId,
          attachmentCount: uploadedFiles.length
        },
        ip: req.ip || 'unknown',
        success: true
      })
    ]);

    postSendTasks.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[Email Compose] Falha na rotina pós-envio #${index + 1}:`, result.reason);
      }
    });

    return res.json({
      success: true,
      message: uploadedFiles.length > 0
        ? `Email enviado com sucesso com ${uploadedFiles.length} anexo(s)!`
        : 'Email enviado com sucesso!',
      email: {
        id: email.id,
        messageId: sendResult.messageId,
        from: email.fromEmail,
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject: email.subject,
        sentAt: sendResult.sentAt,
        attachmentCount: uploadedFiles.length
      }
    });
  } catch (sendError: any) {
    const failureTasks = await Promise.allSettled([
      upsertEmailStats(account.emailServer.id, {
        totalFailed: 1
      }),
      logAuditEvent({
        userId,
        action: 'EMAIL_SEND_FAILED',
        resource: 'email',
        details: {
          accountId,
          from: account.email,
          to: toEmails,
          cc: ccEmails,
          bcc: bccEmails,
          subject,
          messageId: email.messageId,
          attachmentCount: uploadedFiles.length
        },
        ip: req.ip || 'unknown',
        success: false,
        errorMessage: sendError instanceof Error ? sendError.message : 'Falha no envio'
      }),
      emailServerHealthService.checkHealth({
        triggerRecovery: true,
        source: 'send-failure'
      })
    ]);

    failureTasks.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[Email Compose] Falha na rotina de recuperação #${index + 1}:`, result.reason);
      }
    });

    return res.status(502).json({
      success: false,
      error: 'Falha no servidor de email',
      message:
        sendError instanceof Error
          ? sendError.message
          : 'O servidor SMTP não conseguiu processar o envio'
    });
  }
}));

function normalizeRecipientList(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeRecipientList(entry)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePriority(value: unknown): number {
  const parsed = typeof value === 'string' || typeof value === 'number'
    ? Number(value)
    : NaN;

  if (!Number.isFinite(parsed)) {
    return 3;
  }

  return Math.min(5, Math.max(1, Math.trunc(parsed)));
}

function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function upsertEmailStats(
  emailServerId: string,
  increments: {
    totalSent?: number;
    totalFailed?: number;
  }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.emailStats.upsert({
    where: {
      emailServerId_date: {
        emailServerId,
        date: today
      }
    },
    update: {
      ...(increments.totalSent
        ? { totalSent: { increment: increments.totalSent } }
        : {}),
      ...(increments.totalFailed
        ? { totalFailed: { increment: increments.totalFailed } }
        : {})
    },
    create: {
      emailServerId,
      date: today,
      totalSent: increments.totalSent || 0,
      totalDelivered: 0,
      totalFailed: increments.totalFailed || 0,
      totalBounced: 0,
      totalComplained: 0,
      totalOpens: 0,
      totalClicks: 0,
      uniqueOpens: 0,
      uniqueClicks: 0
    }
  });
}

export default router;
