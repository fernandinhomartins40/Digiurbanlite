/**
 * Rotas de caixa de entrada (inbox) — processos pendentes por setor/usuário
 */
import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import * as dispatchService from '../services/dispatch.service';

const router = Router();
router.use(authMiddleware);

// ============================================================================
// GET /inbox — Processos pendentes do setor/usuário
// ============================================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const sectorId = req.query.sectorId as string;
    const userId = req.query.userId as string;

    if (!sectorId) {
      res.status(400).json({ error: 'sectorId é obrigatório' });
      return;
    }

    const processes = await dispatchService.getInbox(sectorId, userId);
    res.json(processes);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// GET /inbox/count — Contagem por status
// ============================================================================

router.get('/count', async (req: Request, res: Response) => {
  try {
    const sectorId = req.query.sectorId as string;
    const userId = req.query.userId as string;

    if (!sectorId) {
      res.status(400).json({ error: 'sectorId é obrigatório' });
      return;
    }

    const counts = await dispatchService.getInboxCount(sectorId, userId);
    res.json(counts);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
