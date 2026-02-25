import { Router, Request, Response, NextFunction } from 'express';
import { ingestAuthMiddleware } from '../middlewares/auth.middleware';
import { triggerIngest, getIngestStatus } from '../../ingest/ingest.worker';
import { prisma } from '../../models/prisma';
import { logger } from '../../utils/logger';

const router = Router();

// POST /api/v1/ingest/run — disparar ingestão manual
router.post('/ingest/run', ingestAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { since_days: sinceDays, uf } = req.body as {
      since_days?: number;
      uf?: string;
    };

    logger.info('[Ingest] Manual trigger via API', { sinceDays, uf });

    const jobId = await triggerIngest({
      sinceDays,
      uf,
      triggeredBy: 'api',
    });

    res.json({
      message: 'Ingestão enfileirada com sucesso',
      jobId,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/ingest/status
router.get('/ingest/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [queueStatus, lastRun] = await Promise.all([
      getIngestStatus(),
      prisma.ingestRun.findFirst({
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          itemsIngested: true,
          itemsUpdated: true,
          errors: true,
          triggeredBy: true,
          sinceDays: true,
        },
      }),
    ]);

    res.json({
      queue: queueStatus,
      lastRun,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
