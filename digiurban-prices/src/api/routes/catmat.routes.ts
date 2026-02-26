import { Router, Request, Response, NextFunction } from 'express';
import { searchCatmat, syncCatmatCatalog } from '../../services/catmat.service';
import { ingestAuthMiddleware } from '../middlewares/auth.middleware';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/v1/catmat/search?q=notebook&type=material&limit=20
router.get('/catmat/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type, limit } = req.query as {
      q?: string;
      type?: 'material' | 'service' | 'both';
      limit?: string;
    };

    if (!q || q.trim().length < 2) {
      res.status(400).json({ error: 'Parâmetro q deve ter pelo menos 2 caracteres' });
      return;
    }

    const results = await searchCatmat(
      q.trim(),
      type ?? 'both',
      Math.min(50, parseInt(limit ?? '20', 10)),
    );

    res.json({ results, total: results.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/catmat/sync — sincronizar catálogo (requer auth admin)
router.post('/catmat/sync', ingestAuthMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('[CATMAT] Manual sync triggered');
    // Executa assincronamente para não bloquear a resposta
    syncCatmatCatalog().catch((err) => {
      logger.error('[CATMAT] Sync error', { error: (err as Error).message });
    });

    res.json({ message: 'Sincronização do catálogo CATMAT/CATSER iniciada em background' });
  } catch (err) {
    next(err);
  }
});

export default router;
