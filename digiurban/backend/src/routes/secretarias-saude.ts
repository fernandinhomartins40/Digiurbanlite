import { Router, Request, Response } from 'express';

const router = Router();

// Mock de estatísticas da secretaria de saúde
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    res.json({
      totalUnidades: 0,
      totalProfissionais: 0,
      atendimentosHoje: 0,
      atendimentosMes: 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    res.json({
      totalUnidades: 0,
      totalProfissionais: 0,
      atendimentosHoje: 0,
      atendimentosMes: 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/health-units/stats', async (req: Request, res: Response) => {
  try {
    res.json({
      total: 0,
      ativas: 0,
      tipos: {},
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
