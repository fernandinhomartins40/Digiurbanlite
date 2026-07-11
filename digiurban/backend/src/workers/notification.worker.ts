/**
 * ============================================================================
 * NOTIFICATION WORKER - Processa fila de notificações
 * ============================================================================
 */

import { Worker, Job } from 'bullmq';
import redis from '../lib/redis';
import { prisma } from '../lib/prisma';
import { sendSSE } from '../services/notification-channels/sse';
import { sendPush } from '../services/notification-channels/push';
import { sendEmail } from '../services/notification-channels/email';
import { sendSMS } from '../services/notification-channels/sms';
import { sendWhatsApp } from '../services/notification-channels/whatsapp';
import { NotificationPayload, NotificationChannel } from '../types/notification.types';
import { runAsTenant, DEFAULT_TENANT_ID } from '../lib/tenant-context';

interface NotificationJobData {
  notificationId?: string;
  channel: NotificationChannel;
  payload: NotificationPayload;
  /** Fase A Multi-Tenant: carimbado pelo producer (notification.service.ts) */
  tenantId?: string;
}

const worker = new Worker<NotificationJobData>(
  'notifications',
  async (job: Job<NotificationJobData>) => {
    // Fase A Multi-Tenant: o worker roda fora do ciclo HTTP — restabelecer o
    // contexto do tenant que enfileirou. Jobs legados (sem tenantId, drenagem
    // da fila antiga) processam como default, com aviso.
    let tenantId = job.data.tenantId;
    if (!tenantId) {
      console.warn(`[Worker] Job ${job.id} sem tenantId (legado) — processando como tenant default`);
      tenantId = DEFAULT_TENANT_ID;
    }
    return runAsTenant(tenantId, () => processNotificationJob(job));
  },
  {
    connection: redis,
    concurrency: 10, // Processar 10 notificações em paralelo
  }
);

async function processNotificationJob(job: Job<NotificationJobData>) {
    const { channel, payload, notificationId } = job.data;

    console.log(`[Worker] Processing ${channel} notification for ${payload.type}`);

    try {
      let result: any;

      switch (channel) {
        case 'web':
          result = await sendSSE(payload);
          break;
        case 'push':
          result = await sendPush(payload);
          break;
        case 'email':
          result = await sendEmail(payload);
          break;
        case 'sms':
          result = await sendSMS(payload);
          break;
        case 'whatsapp':
          result = await sendWhatsApp(payload);
          break;
        default:
          throw new Error(`Unknown channel: ${channel}`);
      }

      // Log de sucesso
      await prisma.notificationLog.create({
        data: {
          notificationId,
          [payload.recipientType === 'citizen' ? 'citizenId' : 'userId']: payload.recipientId,
          type: payload.type,
          channel: channel.toUpperCase(),
          status: 'SENT',
          payload: payload as any,
          sentAt: new Date(),
        },
      });

      return result;
    } catch (error: any) {
      // Log de erro
      await prisma.notificationLog.create({
        data: {
          notificationId,
          [payload.recipientType === 'citizen' ? 'citizenId' : 'userId']: payload.recipientId,
          type: payload.type,
          channel: channel.toUpperCase(),
          status: 'FAILED',
          payload: payload as any,
          error: error.message,
        },
      });

      throw error; // BullMQ vai fazer retry
    }
}

worker.on('completed', (job) => {
  console.log(`✅ [Worker] Notification sent: ${job.id} (${job.data.channel})`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Notification failed: ${job?.id}`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ [Worker] Error:', err);
});

console.log('✅ Notification worker started');

export default worker;
