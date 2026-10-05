/**
 * E-mail transacional do DigiUrban — porta única de envio.
 *
 * Toda mensagem vira uma linha em `emails` (status QUEUED) e um job na fila
 * `transactional-mail` (Redis/BullMQ). O worker entrega pelo VeloMail, tenta de
 * novo em falhas temporárias e o webhook do VeloMail atualiza para DELIVERED/FAILED.
 *
 * Substitui o servidor SMTP próprio (relay aberto, sem fila, sem DNS correto) e
 * os 3 serviços de envio que existiam.
 */

import crypto from 'crypto';
import fs from 'fs';
import { Queue } from 'bullmq';
import redis from '../../lib/redis';
import { prisma } from '../../lib/prisma';
import { runAsPlatform, tryGetTenantId } from '../../lib/tenant-context';
import { getPlatformMail, getTenantMailSettings } from './mail-settings.service';

export const MAIL_QUEUE = 'transactional-mail';

/** Prioridade na fila (BullMQ: menor = antes) */
export const MAIL_PRIORITY = {
  critical: 1, // troca de senha, confirmação de cadastro
  normal: 5, // notificações de protocolo, avisos
  low: 10, // leads, relatórios
} as const;

export interface MailAttachmentInput {
  filename: string;
  /** arquivo em disco (lido na hora do envio) */
  path?: string;
  content?: Buffer | string;
  contentType?: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** município do e-mail (padrão: o da requisição); null = plataforma */
  tenantId?: string | null;
  priority?: keyof typeof MAIL_PRIORITY;
  replyTo?: string | null;
  /** nome do remetente (padrão: o do município ou o da plataforma) */
  fromName?: string | null;
  tags?: string[];
  kind?: string;
  attachments?: MailAttachmentInput[];
  /** agendar para depois (ex.: lembrete) */
  sendAt?: Date | null;
}

let queue: Queue | null = null;
function getQueue() {
  if (!queue) {
    queue = new Queue(MAIL_QUEUE, {
      connection: redis,
      defaultJobOptions: {
        attempts: 8,
        backoff: { type: 'mail' },
        removeOnComplete: { age: 7 * 24 * 3600, count: 5000 },
        removeOnFail: { age: 30 * 24 * 3600 },
      },
    });
  }
  return queue;
}

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

export function isValidEmail(value: string | null | undefined): value is string {
  return Boolean(value && EMAIL_RE.test(value.trim()) && value.length <= 254);
}

function sanitizeHeaderText(value: string) {
  return value.replace(/[\r\n"<>]/g, ' ').trim().slice(0, 120);
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li|tr)>/gi, '\n')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Coloca um e-mail na fila. Não lança por problema de entrega (isso fica no
 * status do e-mail); lança só por dado inválido de quem chamou.
 */
export async function sendMail(input: SendMailInput): Promise<{ queued: boolean; emailId?: string; reason?: string }> {
  const to = String(input.to || '').trim().toLowerCase();
  if (!isValidEmail(to)) {
    return { queued: false, reason: 'Endereço de e-mail inválido' };
  }
  if (!input.subject?.trim() || !input.html?.trim()) {
    throw new Error('E-mail sem assunto ou sem conteúdo');
  }

  const platform = await getPlatformMail();
  const tenantId = input.tenantId === undefined ? tryGetTenantId() || null : input.tenantId;
  const tenantSettings = tenantId ? await getTenantMailSettings(tenantId) : null;

  // município desligou os avisos por e-mail: só passa o que é crítico (senha, cadastro)
  if (tenantSettings && tenantSettings.emailNotificationsEnabled === false && input.priority !== 'critical') {
    return { queued: false, reason: 'Avisos por e-mail desligados pelo município' };
  }

  const fromName = sanitizeHeaderText(input.fromName || tenantSettings?.senderName || platform.settings.fromName || 'DigiUrban');
  const replyTo = [input.replyTo, tenantSettings?.replyTo].find((item) => isValidEmail(item || '')) || null;

  const attachments = (input.attachments || []).slice(0, 5).map((item) => ({
    filename: sanitizeHeaderText(item.filename || 'anexo'),
    path: item.path || null,
    contentBase64: item.content ? Buffer.from(item.content).toString('base64') : null,
    contentType: item.contentType || null,
  }));

  const email = await runAsPlatform(async () =>
    prisma.email.create({
      data: {
        tenantId,
        messageId: `dgu-${crypto.randomUUID()}`,
        fromEmail: `"${fromName}" <${platform.settings.fromEmail}>`,
        toEmail: to,
        subject: input.subject.trim().slice(0, 255),
        htmlContent: input.html,
        textContent: input.text || htmlToText(input.html),
        attachments: attachments.length ? (attachments as any) : undefined,
        status: 'QUEUED',
        priority: MAIL_PRIORITY[input.priority || 'normal'],
        tags: (input.tags || []).slice(0, 10) as any,
        campaignId: input.kind || null,
        metadata: { replyTo, kind: input.kind || null, provider: 'velomail' } as any,
      },
    })
  );

  const delay = input.sendAt ? Math.max(input.sendAt.getTime() - Date.now(), 0) : 0;
  await getQueue().add('send', { emailId: email.id }, { priority: MAIL_PRIORITY[input.priority || 'normal'], jobId: email.id, delay });
  return { queued: true, emailId: email.id };
}

/** Anexo salvo em disco, lido na hora do envio */
export function readAttachment(item: { path: string | null; contentBase64: string | null }) {
  if (item.contentBase64) return item.contentBase64;
  if (item.path && fs.existsSync(item.path)) return fs.readFileSync(item.path).toString('base64');
  return null;
}

export async function mailQueueCounts() {
  return getQueue().getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed', 'prioritized');
}
