import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { runIngestJob, IngestJobOptions } from './ingest.job';

const QUEUE_NAME = 'prices-ingest';

let queue: Queue | null = null;
let worker: Worker | null = null;

function getRedisConnection() {
  return new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export function getIngestQueue(): Queue {
  if (!queue) {
    const connection = getRedisConnection();
    queue = new Queue(QUEUE_NAME, { connection });
  }
  return queue;
}

export function startIngestWorker(): Worker {
  if (worker) return worker;

  const connection = getRedisConnection();

  worker = new Worker(
    QUEUE_NAME,
    async (job: Job<IngestJobOptions>) => {
      logger.info('[IngestWorker] Processing job', { jobId: job.id, data: job.data });
      const result = await runIngestJob(job.data);
      logger.info('[IngestWorker] Job done', { jobId: job.id, result });
      return result;
    },
    {
      connection,
      concurrency: 1, // Processar uma ingestão por vez para não sobrecarregar
    },
  );

  worker.on('completed', (job) => {
    logger.info('[IngestWorker] Completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('[IngestWorker] Failed', { jobId: job?.id, error: err.message });
  });

  logger.info('[IngestWorker] Worker started');
  return worker;
}

// Disparar ingestão (via API ou scheduler)
export async function triggerIngest(options: IngestJobOptions = {}): Promise<string> {
  const q = getIngestQueue();
  const job = await q.add('ingest-run', options, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    jobId: options.source ? `${options.source}_${Date.now()}` : undefined,
  });
  logger.info('[IngestWorker] Job enqueued', { jobId: job.id, source: options.source });
  return job.id ?? 'unknown';
}

// Status da fila
export async function getIngestStatus(): Promise<{
  active: number;
  waiting: number;
  completed: number;
  failed: number;
}> {
  const q = getIngestQueue();
  const [active, waiting, completed, failed] = await Promise.all([
    q.getActiveCount(),
    q.getWaitingCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
  ]);
  return { active, waiting, completed, failed };
}

export async function closeIngestWorker() {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}
