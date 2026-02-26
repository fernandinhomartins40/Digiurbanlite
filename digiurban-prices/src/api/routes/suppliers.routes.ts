import { Router, Request, Response, NextFunction } from 'express';
import { getSupplierMap } from '../../services/supplier-map.service';

const router = Router();

// GET /api/v1/suppliers/map?q=notebook&uf=SP&period=12m&limit=20
router.get('/suppliers/map', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, uf, source, period, limit } = req.query as {
      q?: string;
      uf?: string;
      source?: string;
      period?: string;
      limit?: string;
    };

    if (!q || q.trim().length < 2) {
      res.status(400).json({ error: 'Parâmetro q deve ter pelo menos 2 caracteres' });
      return;
    }

    const result = await getSupplierMap(q.trim(), {
      uf,
      source,
      period,
      limit: Math.min(50, parseInt(limit ?? '20', 10)),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
