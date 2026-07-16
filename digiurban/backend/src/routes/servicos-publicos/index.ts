import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import ordemServicoService from '../../services/servicos-publicos/ordem-servico.service';

/**
 * App Ordens de Serviço — Serviços Públicos (Fase 1D)
 * Prefixo: /api/apps/servicos-publicos
 */
const router = Router();
router.use(authenticateAdmin);

const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro na operação' });
  }
};

// ==================== EQUIPES ====================

// GET /api/apps/servicos-publicos/equipes — Teams ativos da secretaria
router.get(
  '/equipes',
  handle(async (_req, res) => res.json(await ordemServicoService.listEquipes()))
);

// ==================== ORDENS DE SERVIÇO ====================

// Rotas fixas ANTES de /os/:id
router.get(
  '/os/stats',
  handle(async (_req, res) => res.json(await ordemServicoService.getStatistics()))
);

router.get(
  '/os/mapa',
  handle(async (_req, res) => res.json(await ordemServicoService.getMapa()))
);

// GET /api/apps/servicos-publicos/os?status=&tipo=&bairro=&prioridade=&equipeId=
router.get(
  '/os',
  handle(async (req, res) => {
    const { status, tipo, bairro, prioridade, equipeId } = req.query;
    res.json(
      await ordemServicoService.listOrdens({
        status: (status as string) || undefined,
        tipo: (tipo as string) || undefined,
        bairro: (bairro as string) || undefined,
        prioridade: (prioridade as string) || undefined,
        equipeId: (equipeId as string) || undefined,
      })
    );
  })
);

router.post(
  '/os',
  handle(async (req, res) => res.status(201).json(await ordemServicoService.createOrdem(req.body)))
);

router.get(
  '/os/:id',
  handle(async (req, res) => {
    const ordem = await ordemServicoService.findById(req.params.id);
    if (!ordem) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    res.json(ordem);
  })
);

// PUT /os/:id — triagem (tipo, prioridade, SLA, local)
router.put(
  '/os/:id',
  handle(async (req, res) => res.json(await ordemServicoService.updateOrdem(req.params.id, req.body)))
);

router.post(
  '/os/:id/despachar',
  handle(async (req, res) =>
    res.json(
      await ordemServicoService.despachar(req.params.id, {
        equipeId: req.body?.equipeId,
        responsavelId: req.body?.responsavelId,
        observacoes: req.body?.observacoes,
        userId: (req as any).userId,
      })
    )
  )
);

router.post(
  '/os/:id/iniciar',
  handle(async (req, res) =>
    res.json(await ordemServicoService.iniciar(req.params.id, (req as any).userId))
  )
);

router.post(
  '/os/:id/apontamentos',
  handle(async (req, res) =>
    res.status(201).json(
      await ordemServicoService.registrarApontamento(req.params.id, {
        ...req.body,
        userId: req.body?.userId || (req as any).userId,
      })
    )
  )
);

router.post(
  '/os/:id/concluir',
  handle(async (req, res) =>
    res.json(
      await ordemServicoService.concluir(req.params.id, {
        ...req.body,
        userId: req.body?.userId || (req as any).userId,
      })
    )
  )
);

router.post(
  '/os/:id/cancelar',
  handle(async (req, res) =>
    res.json(
      await ordemServicoService.cancelar(req.params.id, {
        motivo: req.body?.motivo,
        userId: (req as any).userId,
      })
    )
  )
);

export default router;
