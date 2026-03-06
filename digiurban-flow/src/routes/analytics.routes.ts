/**
 * Analytics routes.
 */
import { Router, Request, Response } from 'express';
import {
  authMiddleware,
  AuthenticatedRequest,
  toFlowAuthContext,
} from '../middleware/auth.middleware';
import * as analyticsService from '../services/analytics.service';

const router = Router();
router.use(authMiddleware);

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const dashboard = await analyticsService.getDashboard(auth);
    res.json(dashboard);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/sla', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const overdue = await analyticsService.getOverdueProcesses(auth);
    res.json(overdue);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/bottlenecks', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const bottlenecks = await analyticsService.getBottlenecks(auth);
    res.json(bottlenecks);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/export/csv', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const csv = await analyticsService.exportCSV(auth, {
      status: req.query.status as string,
      typeId: req.query.typeId as string,
    });

    const buffer = Buffer.from(csv, 'utf-8');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="processos_internos.csv"');
    res.setHeader('Content-Length', buffer.byteLength);
    res.send(buffer);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
