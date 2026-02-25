import { Router, Request, Response, NextFunction } from 'express';
import { listAudits } from '../../services/audit.service';

const router = Router();

// GET /api/v1/audits
router.get('/audits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      user_id: userId,
      from,
      to,
      page = '1',
      page_size: pageSize = '20',
    } = req.query as Record<string, string>;

    const result = await listAudits({
      userId,
      from,
      to,
      page: Math.max(1, parseInt(page, 10)),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10))),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
