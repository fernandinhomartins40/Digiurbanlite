import cron from 'node-cron';
import { logger } from '../config/logger.config';
import { emailServerHealthService } from '../services/email-server-health.service';
import { runAsPlatform } from '../lib/tenant-context';

// Fase A Multi-Tenant: monitor de e-mail é operação de PLATAFORMA (infra
// compartilhada) — contexto explícito evita o fail-soft para o tenant default.
const emailServerMonitorJob = cron.schedule(
  process.env.EMAIL_SERVER_MONITOR_CRON || '*/2 * * * *',
  () => runAsPlatform(async () => {
    try {
      const snapshot = await emailServerHealthService.checkHealth({
        triggerRecovery: true,
        source: 'cron'
      });

      logger.info('Monitor do servidor de email executado', {
        status: snapshot.status,
        smtpReachable: snapshot.details.smtpReachable,
        staleQueueCount: snapshot.details.staleQueueCount,
        failureRate: snapshot.details.failureRate
      });
    } catch (error) {
      logger.error('Falha no monitor do servidor de email', { error });
    }
  })
);

emailServerMonitorJob.stop();

let started = false;

export function startEmailServerMonitoring() {
  if (started) {
    return;
  }

  started = true;
  emailServerMonitorJob.start();

  logger.info('Monitor do servidor de email iniciado', {
    cron: process.env.EMAIL_SERVER_MONITOR_CRON || '*/2 * * * *'
  });

  runAsPlatform(() =>
    emailServerHealthService.checkHealth({
      triggerRecovery: false,
      source: 'startup'
    })
  ).catch((error) => {
    logger.error('Falha no health check inicial do servidor de email', { error });
  });
}

export async function runEmailServerHealthCheckOnce() {
  return runAsPlatform(() =>
    emailServerHealthService.checkHealth({
      triggerRecovery: false,
      source: 'manual-script'
    })
  );
}
