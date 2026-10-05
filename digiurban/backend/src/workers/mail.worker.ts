/**
 * Entrega da fila `transactional-mail` pelo VeloMail.
 *
 * - Falha temporária (rede, 5xx, limite por minuto 429): tenta de novo, até 8
 *   vezes, com espera crescente (1 min → ~2 h) ou o tempo pedido pelo VeloMail.
 * - Falha definitiva (chave inválida, domínio não verificado, dado inválido):
 *   marca FAILED na hora, sem repetir.
 * - Envio desligado no painel ou sem chave: o e-mail espera na fila (tenta de novo).
 */

import { Job, UnrecoverableError, Worker } from 'bullmq';
import redis from '../lib/redis';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';
import { MAIL_QUEUE, readAttachment } from '../services/mail/mailer';
import { getPlatformMail } from '../services/mail/mail-settings.service';
import { mailRetryDelay, sendViaVeloMail, VeloMailError } from '../services/mail/velomail.client';
import { logger } from '../config/logger.config';

const MAX_ATTEMPTS = 8;

function backoff(attemptsMade: number, _type?: string, err?: Error) {
  return mailRetryDelay(attemptsMade, err);
}

async function markFailed(emailId: string, message: string) {
  await prisma.email.update({
    where: { id: emailId },
    data: { status: 'FAILED', failedAt: new Date(), errorMessage: message.slice(0, 500) },
  });
  await prisma.emailEvent.create({ data: { emailId, type: 'FAILED', data: { reason: message.slice(0, 500) } } });
}

async function processMail(job: Job<{ emailId: string }>) {
  return runAsPlatform(async () => {
    const email = await prisma.email.findUnique({ where: { id: job.data.emailId } });
    if (!email || (email.status !== 'QUEUED' && email.status !== 'PROCESSING')) return;

    const platform = await getPlatformMail();
    if (!platform.settings.enabled || !platform.apiKey) {
      await prisma.email.update({
        where: { id: email.id },
        data: { errorMessage: 'Envio de e-mail desligado ou sem chave no painel (Super-admin › E-mail transacional)' },
      });
      throw new Error('Envio de e-mail não configurado');
    }

    await prisma.email.update({ where: { id: email.id }, data: { status: 'PROCESSING', retryCount: job.attemptsMade } });

    const metadata = (email.metadata && typeof email.metadata === 'object' ? email.metadata : {}) as Record<string, any>;
    const attachments = Array.isArray(email.attachments) ? (email.attachments as any[]) : [];

    try {
      const result = await sendViaVeloMail(platform.settings.apiBaseUrl, platform.apiKey, {
        from: email.fromEmail,
        to: email.toEmail,
        subject: email.subject,
        html: email.htmlContent || undefined,
        text: email.textContent || undefined,
        reply_to: metadata.replyTo || undefined,
        tags: Array.isArray(email.tags) ? (email.tags as string[]).slice(0, 10) : undefined,
        attachments: attachments
          .map((item) => {
            const content = readAttachment(item);
            return content ? { filename: item.filename, content, contentType: item.contentType || undefined, encoding: 'base64' } : null;
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item)),
        // e-mail de governo: sem pixel de abertura e sem troca dos links (LGPD)
        tracking_enabled: false,
      });

      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          errorMessage: null,
          metadata: { ...metadata, velomailMessageId: result.messageId } as any,
        },
      });
      await prisma.emailEvent.create({ data: { emailId: email.id, type: 'SENT', data: { velomailMessageId: result.messageId } } });
    } catch (error: any) {
      const veloError = error instanceof VeloMailError ? error : null;
      const message = veloError ? `${veloError.code || veloError.status}: ${veloError.message}` : String(error?.message || error);

      if (veloError && !veloError.retryable) {
        await markFailed(email.id, message);
        if (veloError.status === 401 || veloError.status === 403 || veloError.code === 'DOMAIN_NOT_VERIFIED') {
          logger.error('E-mail transacional: VeloMail recusou por configuração (chave/domínio)', { code: veloError.code, status: veloError.status });
        }
        throw new UnrecoverableError(message);
      }

      if (job.attemptsMade + 1 >= MAX_ATTEMPTS) {
        await markFailed(email.id, `Desistimos após ${MAX_ATTEMPTS} tentativas — ${message}`);
      } else {
        await prisma.email.update({ where: { id: email.id }, data: { status: 'QUEUED', errorMessage: message.slice(0, 500) } });
      }
      throw error;
    }
  });
}

let worker: Worker | null = null;

export function startMailWorker() {
  if (worker) return worker;
  worker = new Worker(MAIL_QUEUE, processMail, {
    connection: redis,
    concurrency: 2,
    // respeita o VeloMail: no máximo 30 envios por minuto a partir deste servidor
    limiter: { max: 30, duration: 60_000 },
    settings: { backoffStrategy: backoff },
  });
  worker.on('failed', (job, error) => {
    if (job) logger.warn('E-mail transacional: tentativa falhou', { emailId: job.data?.emailId, attempt: job.attemptsMade, error: error?.message });
  });
  return worker;
}
