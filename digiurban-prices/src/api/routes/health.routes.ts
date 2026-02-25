import { Router, Request, Response } from 'express';
import { prisma } from '../../models/prisma';
import { pingOpenSearch } from '../../search_index/opensearch.client';
import { getPncpClient } from '../../connectors/pncp/pncp.client';

const router = Router();

// GET /health — liveness probe
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'digiurban-prices',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// GET /ready — readiness probe (verifica DB + OpenSearch)
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, 'ok' | 'error'> = {};

  // PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // OpenSearch
  try {
    const osOk = await pingOpenSearch();
    checks.opensearch = osOk ? 'ok' : 'error';
  } catch {
    checks.opensearch = 'error';
  }

  // PNCP (não crítico — não falha readiness)
  try {
    const pncpOk = await getPncpClient().ping();
    checks.pncp = pncpOk ? 'ok' : 'error';
  } catch {
    checks.pncp = 'error';
  }

  const isReady = checks.database === 'ok';
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;
