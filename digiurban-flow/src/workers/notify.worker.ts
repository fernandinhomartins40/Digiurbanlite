/**
 * BullMQ worker for notifications.
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
  toDepartmentId?: string;
  toOrganizationalUnitId?: string;
  toOrganizationalUnitName?: string;
  toUserId?: string;
  message: string;
}

export function startNotifyWorker() {
  const worker = new Worker<NotificationJob>(
    'flow-notifications',
    async (job) => {
      const { type, processNumber, toOrganizationalUnitName, message } = job.data;

      logger.info(`Notificacao [${type}]: ${processNumber} -> ${toOrganizationalUnitName || 'sistema'}`, {
        message,
      });

      return { sent: true, type, processNumber };
    },
    {
      connection,
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    logger.debug('Notificacao enviada', { type: job.data.type });
  });

  worker.on('failed', (job, err) => {
    logger.error('Falha ao enviar notificacao', {
      error: err.message,
      type: job?.data.type,
    });
  });

  logger.info('Notify Worker iniciado');
  return worker;
}

export async function queueDispatchNotification(data: {
  processId: string;
  processNumber: string;
  toDepartmentId?: string;
  toOrganizationalUnitId: string;
  toOrganizationalUnitName: string;
  toUserId?: string;
  fromUserName: string;
  note?: string;
}) {
  await notifyQueue.add('dispatch', {
    type: 'dispatch',
    processId: data.processId,
    processNumber: data.processNumber,
    toDepartmentId: data.toDepartmentId,
    toOrganizationalUnitId: data.toOrganizationalUnitId,
    toOrganizationalUnitName: data.toOrganizationalUnitName,
    toUserId: data.toUserId,
    message: `Processo ${data.processNumber} recebido de ${data.fromUserName}${data.note ? `: ${data.note}` : ''}`,
  });
}

export async function queueSLANotification(data: {
  processId: string;
  processNumber: string;
  toDepartmentId?: string;
  toOrganizationalUnitId: string;
  toOrganizationalUnitName: string;
  type: 'sla_warning' | 'sla_overdue';
}) {
  await notifyQueue.add(data.type, {
    type: data.type,
    processId: data.processId,
    processNumber: data.processNumber,
    toDepartmentId: data.toDepartmentId,
    toOrganizationalUnitId: data.toOrganizationalUnitId,
    toOrganizationalUnitName: data.toOrganizationalUnitName,
    message:
      data.type === 'sla_warning'
        ? `Processo ${data.processNumber} proximo do vencimento de prazo`
        : `Processo ${data.processNumber} com prazo vencido`,
  });
}
