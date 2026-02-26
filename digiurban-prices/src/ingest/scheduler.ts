import { CronJob } from 'cron';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { triggerIngest } from './ingest.worker';
import type { IngestSource } from './ingest.orchestrator';

interface ScheduledSource {
  name: string;
  source: IngestSource;
  cron: string;
  job?: CronJob;
}

const SOURCES: ScheduledSource[] = [
  { name: 'PNCP',         source: 'pncp',          cron: config.ingest.cron },
  { name: 'ComprasNet',   source: 'comprasnet',    cron: config.ingest.cronComprasnet },
  { name: 'Transparencia',source: 'transparencia', cron: config.ingest.cronTransparencia },
  { name: 'BPS',          source: 'bps',           cron: config.ingest.cronBps },
  { name: 'FNDE',         source: 'fnde',          cron: config.ingest.cronFnde },
];

let started = false;

export function startIngestScheduler() {
  if (started) return;
  started = true;

  for (const src of SOURCES) {
    src.job = new CronJob(src.cron, async () => {
      logger.info('[Scheduler] Triggered scheduled ingest', { source: src.source, cron: src.cron });
      try {
        const jobId = await triggerIngest({
          source: src.source,
          triggeredBy: 'scheduled',
          sinceDays: config.ingest.sinceDays,
        });
        logger.info('[Scheduler] Ingest job enqueued', { source: src.source, jobId });
      } catch (err) {
        logger.error('[Scheduler] Failed to trigger ingest', {
          source: src.source,
          error: (err as Error).message,
        });
      }
    });

    src.job.start();
    logger.info('[Scheduler] Source scheduled', { source: src.source, cron: src.cron });
  }

  logger.info('[Scheduler] All ingest schedulers started', {
    sources: SOURCES.map((s) => s.source),
  });
}

export function stopIngestScheduler() {
  for (const src of SOURCES) {
    if (src.job) {
      src.job.stop();
      src.job = undefined;
    }
  }
  started = false;
  logger.info('[Scheduler] All ingest schedulers stopped');
}
