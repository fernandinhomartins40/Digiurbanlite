/**
 * Worker BullMQ para envio de notificações
 * Processa fila de notificações geradas por despachos e ações
 */
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger';
import { config } from '../config/config';

const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

export const notifyQueue = new Queue('flow-notifications', { connection });

export interface NotificationJob {
  type: 'dispatch' | 'sla_warning' | 'sla_overdue' | 'conclusion' | 'return';
  processId: string;
  processNumber: string;
  toSectorId?: string;
  toSectorName?: string;
  toUserId?: string;
  message: string;
}

/**
 * Iniciar worker de notificações
 */
export function startNotifyWorker() {
  const worker = new Worker<NotificationJob>(
    'flow-notifications',
    async (job) => {
      const { type, processNumber, toSectorName, message } = job.data;

      logger.info(`Notificação [${type}]: ${processNumber} → ${toSectorName || 'sistema'}`, {
        message,
      });

      // Aqui pode integrar com o sistema de notificações do backend principal
      // via DigiUrban Integration (POST /api/internal/notifications)
      // Por enquanto, apenas log

      return { sent: true, type, processNumber };
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.debug('Notificação enviada', { type: job.data.type });
  });

  worker.on('failed', (job, err) => {
    logger.error('Falha ao enviar notificação', {
      error: err.message,
      type: job?.data.type,
    });
  });

  logger.info('Notify Worker iniciado');
  return worker;
}

/**
 * Enfileirar notificação de despacho
 */
export async function queueDispatchNotification(data: {
  processId: string;
  processNumber: string;
  toSectorId: string;
  toSectorName: string;
  toUserId?: string;
  fromUserName: string;
  note?: string;
}) {
  await notifyQueue.add('dispatch', {
    type: 'dispatch',
    processId: data.processId,
    processNumber: data.processNumber,
    toSectorId: data.toSectorId,
    toSectorName: data.toSectorName,
    toUserId: data.toUserId,
    message: `Processo ${data.processNumber} recebido de ${data.fromUserName}${data.note ? `: ${data.note}` : ''}`,
  });
}

/**
 * Enfileirar notificação de SLA
 */
export async function queueSLANotification(data: {
  processId: string;
  processNumber: string;
  toSectorId: string;
  toSectorName: string;
  type: 'sla_warning' | 'sla_overdue';
}) {
  await notifyQueue.add(data.type, {
    type: data.type,
    processId: data.processId,
    processNumber: data.processNumber,
    toSectorId: data.toSectorId,
    toSectorName: data.toSectorName,
    message:
      data.type === 'sla_warning'
        ? `Processo ${data.processNumber} próximo do vencimento de prazo`
        : `Processo ${data.processNumber} com prazo VENCIDO`,
  });
}
