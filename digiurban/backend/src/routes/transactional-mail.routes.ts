/**
 * E-mail transacional (VeloMail).
 *
 *   POST /api/webhooks/velomail        retorno do VeloMail (assinatura HMAC SHA-256)
 *   /api/platform/mail/*               Super-admin: chave, remetente, teste, situação
 *   /api/admin/mail/*                  Prefeitura: remetente, resposta e e-mails enviados
 */

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { runAsPlatform, tryGetTenantId } from '../lib/tenant-context';
import { platformAuthMiddleware, requirePlatformRole, PlatformAuthenticatedRequest } from '../middleware/platform-auth';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import {
  VELOMAIL_API_KEY,
  VELOMAIL_WEBHOOK_SECRET,
  getPlatformMail,
  getTenantMailSettings,
  savePlatformSecret,
  updatePlatformMailSettings,
  upsertTenantMailSettings,
} from '../services/mail/mail-settings.service';
import { isValidEmail, mailQueueCounts, sendMail } from '../services/mail/mailer';
import { verifyVeloMailSignature } from '../services/mail/velomail.client';
import { logAuditEvent } from '../utils/audit-logger';

// ---------------------------------------------------------------------------
// Webhook do VeloMail
// ---------------------------------------------------------------------------

export const velomailWebhookRouter = Router();

const EVENT_TO_STATUS: Record<string, { status?: 'DELIVERED' | 'FAILED' | 'BOUNCED' | 'COMPLAINED'; event: string }> = {
  'email.sent': { event: 'SENT' },
  'email.delivered': { status: 'DELIVERED', event: 'DELIVERED' },
  'email.failed': { status: 'FAILED', event: 'FAILED' },
  'email.bounced': { status: 'BOUNCED', event: 'BOUNCED' },
  'email.spam_complaint': { status: 'COMPLAINED', event: 'COMPLAINED' },
};

export { verifyVeloMailSignature };

velomailWebhookRouter.post('/velomail', async (req: Request, res: Response) => {
  const rawBody: Buffer | undefined = (req as any).rawBody;
  const { webhookSecret } = await getPlatformMail();
  if (!rawBody || !webhookSecret || !verifyVeloMailSignature(rawBody, String(req.headers['x-webhook-signature'] || ''), webhookSecret)) {
    return res.status(401).json({ error: 'Assinatura inválida' });
  }

  const payload = req.body || {};
  const eventName = String(payload.event || req.headers['x-webhook-event'] || '');
  const mapping = EVENT_TO_STATUS[eventName];
  const velomailMessageId = payload?.data?.message_id || payload?.data?.messageId || null;

  // responde rápido; eventos desconhecidos (abertura/clique, que deixamos desligados) são ignorados
  if (!mapping || !velomailMessageId) return res.status(200).json({ ok: true, ignored: true });

  try {
    await runAsPlatform(async () => {
      const email = await prisma.email.findFirst({
        where: { metadata: { path: ['velomailMessageId'], equals: String(velomailMessageId) } },
        select: { id: true, status: true },
      });
      if (!email) return;

      const already = await prisma.emailEvent.findFirst({
        where: { emailId: email.id, type: mapping.event as any, timestamp: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
        select: { id: true },
      });
      if (already) return; // o VeloMail repete o webhook: sem duplicar

      await prisma.emailEvent.create({
        data: {
          emailId: email.id,
          type: mapping.event as any,
          data: { reason: payload?.data?.error || payload?.data?.reason || null, at: payload.timestamp || null } as any,
        },
      });
      if (mapping.status && !(email.status === 'DELIVERED' && mapping.status === 'FAILED')) {
        await prisma.email.update({
          where: { id: email.id },
          data: {
            status: mapping.status,
            ...(mapping.status === 'DELIVERED' ? { deliveredAt: new Date() } : { failedAt: new Date() }),
            ...(mapping.status !== 'DELIVERED' ? { errorMessage: String(payload?.data?.error || payload?.data?.reason || eventName).slice(0, 500) } : {}),
          },
        });
      }
    });
  } catch (error) {
    console.error('[velomail-webhook]', error);
    return res.status(500).json({ error: 'Erro ao registrar o evento' });
  }
  return res.status(200).json({ ok: true });
});

// ---------------------------------------------------------------------------
// Super-admin (plataforma)
// ---------------------------------------------------------------------------

export const platformMailRouter = Router();
platformMailRouter.use(platformAuthMiddleware);
const PLATFORM_ADMIN = requirePlatformRole('PLATFORM_ADMIN');

function audit(req: Request, action: string, details: Record<string, unknown>) {
  void logAuditEvent({
    action,
    resource: req.originalUrl,
    method: req.method,
    details: { context: 'platform', platformUserId: (req as PlatformAuthenticatedRequest).platformUser?.id, ...details },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  }).catch(() => undefined);
}

async function platformStatus() {
  const { settings, apiKey, webhookSecret } = await getPlatformMail();
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [byStatus, queue, lastFailures] = await Promise.all([
    runAsPlatform(async () => prisma.email.groupBy({ by: ['status'], where: { createdAt: { gte: since } }, _count: true })),
    mailQueueCounts().catch(() => null),
    runAsPlatform(async () =>
      prisma.email.findMany({
        where: { status: 'FAILED', createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, toEmail: true, subject: true, errorMessage: true, createdAt: true, tenantId: true },
      })
    ),
  ]);
  return {
    settings: { enabled: settings.enabled, fromEmail: settings.fromEmail, fromName: settings.fromName, apiBaseUrl: settings.apiBaseUrl, teamEmail: settings.teamEmail, updatedAt: settings.updatedAt },
    hasApiKey: Boolean(apiKey),
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}` : null,
    hasWebhookSecret: Boolean(webhookSecret),
    webhookUrl: `${(process.env.PUBLIC_BASE_URL || 'https://digiurban.com.br').replace(/\/$/, '')}/api/webhooks/velomail`,
    last24h: Object.fromEntries(byStatus.map((row) => [row.status, row._count])),
    queue,
    lastFailures: lastFailures.map((item) => ({ ...item, toEmail: maskEmail(item.toEmail) })),
  };
}

platformMailRouter.get('/', async (_req, res) => {
  try {
    res.json({ success: true, ...(await platformStatus()) });
  } catch (error) {
    console.error('[platform-mail]', error);
    res.status(500).json({ error: 'Erro ao carregar o e-mail transacional' });
  }
});

platformMailRouter.put('/', PLATFORM_ADMIN, async (req, res) => {
  try {
    const body = z
      .object({
        enabled: z.boolean().optional(),
        fromEmail: z.string().email('Remetente inválido').max(254).optional(),
        fromName: z.string().min(2).max(80).optional(),
        apiBaseUrl: z.string().url().max(200).optional(),
        teamEmail: z.union([z.string().email('E-mail da equipe inválido').max(254), z.literal(''), z.null()]).optional(),
        apiKey: z.string().regex(/^re_[A-Za-z0-9_-]{10,}$/, 'A chave de envio do VeloMail começa com re_').optional(),
        webhookSecret: z.string().min(16, 'Segredo do webhook muito curto').max(200).optional(),
      })
      .parse(req.body);

    const { apiKey, webhookSecret, teamEmail, ...rest } = body;
    const settings = { ...rest, ...(teamEmail !== undefined ? { teamEmail: teamEmail || null } : {}) };
    if (apiKey) await savePlatformSecret(VELOMAIL_API_KEY, apiKey);
    if (webhookSecret) await savePlatformSecret(VELOMAIL_WEBHOOK_SECRET, webhookSecret);
    if (Object.keys(settings).length) await updatePlatformMailSettings(settings, (req as PlatformAuthenticatedRequest).platformUser?.id);

    audit(req, 'platform_mail_updated', { ...settings, apiKeyChanged: Boolean(apiKey), webhookSecretChanged: Boolean(webhookSecret) });
    res.json({ success: true, ...(await platformStatus()) });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Dados inválidos' });
    console.error('[platform-mail]', error);
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

/** Gera um segredo novo para o webhook (o mesmo valor vai no cadastro do webhook no VeloMail) */
platformMailRouter.post('/webhook-secret', PLATFORM_ADMIN, async (req, res) => {
  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
  await savePlatformSecret(VELOMAIL_WEBHOOK_SECRET, secret);
  audit(req, 'platform_mail_webhook_secret_rotated', {});
  res.json({ success: true, webhookSecret: secret, message: 'Copie agora: o segredo não é mostrado de novo.' });
});

platformMailRouter.post('/test', PLATFORM_ADMIN, async (req, res) => {
  const to = String(req.body?.to || '').trim();
  if (!isValidEmail(to)) return res.status(400).json({ error: 'Informe um e-mail válido para o teste' });
  const result = await sendMail({
    to,
    tenantId: null,
    priority: 'critical',
    kind: 'platform-test',
    subject: 'Teste de envio — DigiUrban',
    html: '<p>Este é um e-mail de teste do DigiUrban.</p><p>Se chegou na caixa de entrada (e não no spam), o envio pelo VeloMail está funcionando.</p>',
  });
  audit(req, 'platform_mail_test', { to: maskEmail(to), queued: result.queued });
  res.json({ success: result.queued, ...result });
});

// ---------------------------------------------------------------------------
// Prefeitura
// ---------------------------------------------------------------------------

export const tenantMailRouter = Router();
tenantMailRouter.use(adminAuthMiddleware);

tenantMailRouter.get('/settings', requireMinRole(UserRole.MANAGER), async (req, res) => {
  const tenantId = tryGetTenantId();
  const [settings, platform] = await Promise.all([getTenantMailSettings(tenantId), getPlatformMail()]);
  res.json({
    success: true,
    settings: {
      senderName: settings?.senderName || '',
      replyTo: settings?.replyTo || '',
      emailNotificationsEnabled: settings?.emailNotificationsEnabled ?? true,
    },
    platform: { enabled: platform.settings.enabled && Boolean(platform.apiKey), fromEmail: platform.settings.fromEmail },
  });
});

tenantMailRouter.put('/settings', requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const body = z
      .object({
        senderName: z.string().max(80).nullable().optional(),
        replyTo: z.string().max(254).nullable().optional(),
        emailNotificationsEnabled: z.boolean().optional(),
      })
      .parse(req.body);
    if (body.replyTo && !isValidEmail(body.replyTo)) return res.status(400).json({ error: 'E-mail para respostas inválido' });
    const tenantId = tryGetTenantId();
    if (!tenantId) return res.status(400).json({ error: 'Município não identificado' });
    const saved = await upsertTenantMailSettings(tenantId, {
      senderName: body.senderName?.trim() || null,
      replyTo: body.replyTo?.trim() || null,
      ...(body.emailNotificationsEnabled !== undefined ? { emailNotificationsEnabled: body.emailNotificationsEnabled } : {}),
    });
    res.json({ success: true, settings: saved });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Dados inválidos' });
    console.error('[tenant-mail]', error);
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

const SENT_STATUSES = ['QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'COMPLAINED'];

/** E-mails enviados pelo município (só os dele; endereço do cidadão mascarado) */
tenantMailRouter.get('/sent', requireMinRole(UserRole.ADMIN), async (req, res) => {
  const tenantId = tryGetTenantId();
  if (!tenantId) return res.status(400).json({ error: 'Município não identificado' });
  const take = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const skip = Math.max(Number(req.query.offset) || 0, 0);
  const status = typeof req.query.status === 'string' && SENT_STATUSES.includes(req.query.status) ? req.query.status : undefined;
  const where: any = { tenantId, ...(status ? { status } : {}) };
  const [items, total] = await runAsPlatform(async () =>
    Promise.all([
      prisma.email.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: { id: true, toEmail: true, subject: true, status: true, campaignId: true, createdAt: true, sentAt: true, deliveredAt: true, failedAt: true, errorMessage: true, retryCount: true },
      }),
      prisma.email.count({ where }),
    ])
  );
  res.json({
    success: true,
    total,
    items: items.map((item) => ({ ...item, kind: item.campaignId, toEmail: maskEmail(item.toEmail) })),
  });
});

function maskEmail(value: string) {
  const [user, domain] = String(value || '').split('@');
  if (!domain) return value;
  return `${user.slice(0, 2)}***@${domain}`;
}
