/**
 * Rotas de analytics e indicadores
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as analyticsService from '../services/analytics.service';

const router = Router();
router.use(authMiddleware);

// ============================================================================
// GET /analytics/dashboard — Dashboard principal
// ============================================================================

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const dashboard = await analyticsService.getDashboard();
    res.json(dashboard);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// GET /analytics/sla — Processos com SLA vencido
// ============================================================================

router.get('/sla', async (_req: Request, res: Response) => {
  try {
    const overdue = await analyticsService.getOverdueProcesses();
    res.json(overdue);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// GET /analytics/bottlenecks — Gargalos por setor
// ============================================================================

router.get('/bottlenecks', async (_req: Request, res: Response) => {
  try {
    const bottlenecks = await analyticsService.getBottlenecks();
    res.json(bottlenecks);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// GET /analytics/export/csv — Exportar CSV
// ============================================================================

router.get('/export/csv', async (req: Request, res: Response) => {
  try {
    const csv = await analyticsService.exportCSV({
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
