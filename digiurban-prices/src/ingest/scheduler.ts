import { CronJob } from 'cron';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { triggerIngest } from './ingest.worker';

let schedulerJob: CronJob | null = null;

export function startIngestScheduler() {
  if (schedulerJob) return;

  const cronExpression = config.ingest.cron;

  schedulerJob = new CronJob(cronExpression, async () => {
    logger.info('[Scheduler] Triggered scheduled ingest', { cron: cronExpression });
    try {
      const jobId = await triggerIngest({ triggeredBy: 'scheduled' });
      logger.info('[Scheduler] Ingest job enqueued', { jobId });
    } catch (err) {
      logger.error('[Scheduler] Failed to trigger ingest', { error: (err as Error).message });
    }
  });

  schedulerJob.start();
  logger.info('[Scheduler] Ingest scheduler started', { cron: cronExpression });
}

export function stopIngestScheduler() {
  if (schedulerJob) {
    schedulerJob.stop();
    schedulerJob = null;
    logger.info('[Scheduler] Ingest scheduler stopped');
  }
}
