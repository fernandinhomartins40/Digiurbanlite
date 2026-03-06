/**
 * Worker BullMQ para verificação periódica de SLA
 * Verifica processos com prazo vencido e marca como urgente/notifica
 */
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { config } from '../config/config';

const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

export const slaQueue = new Queue('flow-sla-check', { connection });

/**
 * Iniciar worker de verificação de SLA
 */
export function startSLAWorker() {
  const worker = new Worker(
    'flow-sla-check',
    async () => {
      logger.info('SLA check: iniciando verificação...');
      const now = new Date();

      try {
        // Buscar processos com prazo vencido que ainda estão ativos
        const overdueProcesses = await prisma.internalProcess.findMany({
          where: {
            dueAt: { lt: now },
            status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
          },
          select: {
            id: true,
            number: true,
            subject: true,
            dueAt: true,
            currentOrganizationalUnitName: true,
            currentUserName: true,
          },
        });

        if (overdueProcesses.length > 0) {
          logger.warn(`SLA check: ${overdueProcesses.length} processos com prazo vencido`, {
            processes: overdueProcesses.map((p) => p.number),
          });
        } else {
          logger.info('SLA check: nenhum processo com prazo vencido');
        }

        // Buscar processos próximos do vencimento (24h)
        const nearDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nearDueProcesses = await prisma.internalProcess.findMany({
          where: {
            dueAt: { gt: now, lt: nearDueDate },
            status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
          },
          select: { id: true, number: true },
        });

        if (nearDueProcesses.length > 0) {
          logger.info(`SLA check: ${nearDueProcesses.length} processos próximos do vencimento (24h)`);
        }

        return {
          checked: true,
          overdue: overdueProcesses.length,
          nearDue: nearDueProcesses.length,
        };
      } catch (error) {
        logger.error('SLA check: erro na verificação', { error });
        throw error;
      }
    },
    {
      connection,
      concurrency: 1,
    }
  );

  worker.on('completed', (job) => {
    logger.info('SLA check: concluído', { result: job.returnvalue });
  });

  worker.on('failed', (job, err) => {
    logger.error('SLA check: falhou', { error: err.message });
  });

  // Agendar verificação periódica
  schedulePeriodicCheck();

  logger.info('SLA Worker iniciado');
  return worker;
}

async function schedulePeriodicCheck() {
  // Adicionar job repetitivo
  await slaQueue.add(
    'periodic-sla-check',
    {},
    {
      repeat: {
        every: config.slaCheckIntervalMs, // 5 minutos por padrão
      },
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 5 },
    }
  );

  logger.info(`SLA check agendado a cada ${config.slaCheckIntervalMs / 1000}s`);
}
