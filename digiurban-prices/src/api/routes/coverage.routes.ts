import { Router, Request, Response, NextFunction } from 'express';
import { getCoverageOverview } from '../../services/coverage.service';

const router = Router();

// GET /api/v1/coverage
router.get('/coverage', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coverage = await getCoverageOverview();
    res.json(coverage);
  } catch (err) {
    next(err);
  }
});

export default router;

