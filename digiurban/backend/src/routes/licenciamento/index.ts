import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import licenciamentoService from '../../services/licenciamento/licenciamento.service';

/**
 * App Licenciamento Urbano (Fase 2) — Obras Públicas + Planejamento Urbano
 * Prefixo: /api/apps/licenciamento
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

// Rotas fixas ANTES de /processos/:id
router.get(
  '/processos/stats',
  handle(async (_req, res) => res.json(await licenciamentoService.getStatistics()))
);

// GET /api/apps/licenciamento/processos?status=&tipo=&bairro=
router.get(
  '/processos',
  handle(async (req, res) => {
    const { status, tipo, bairro } = req.query;
    res.json(
      await licenciamentoService.listProcessos({
        status: (status as string) || undefined,
        tipo: (tipo as string) || undefined,
        bairro: (bairro as string) || undefined,
      })
    );
  })
);

router.post(
  '/processos',
  handle(async (req, res) =>
    res.status(201).json(await licenciamentoService.createProcesso(req.body))
  )
);

router.get(
  '/processos/:id',
  handle(async (req, res) => {
    const processo = await licenciamentoService.findById(req.params.id);
    if (!processo) return res.status(404).json({ error: 'Processo não encontrado' });
    res.json(processo);
  })
);

router.put(
  '/processos/:id',
  handle(async (req, res) =>
    res.json(await licenciamentoService.updateProcesso(req.params.id, req.body))
  )
);

router.post(
  '/processos/:id/iniciar-analise',
  handle(async (req, res) =>
    res.json(
      await licenciamentoService.iniciarAnalise(
        req.params.id,
        req.body?.responsavelId || (req as any).userId
      )
    )
  )
);

router.post(
  '/processos/:id/pareceres',
  handle(async (req, res) =>
    res.status(201).json(
      await licenciamentoService.registrarParecer(req.params.id, {
        ...req.body,
        autorId: req.body?.autorId || (req as any).userId,
      })
    )
  )
);

router.post(
  '/processos/:id/solicitar-vistoria',
  handle(async (req, res) =>
    res.json(
      await licenciamentoService.solicitarVistoria(
        req.params.id,
        req.body?.observacoes,
        (req as any).userId
      )
    )
  )
);

router.post(
  '/processos/:id/aprovar',
  handle(async (req, res) =>
    res.json(await licenciamentoService.aprovar(req.params.id, (req as any).userId))
  )
);

router.post(
  '/processos/:id/indeferir',
  handle(async (req, res) =>
    res.json(
      await licenciamentoService.indeferir(req.params.id, req.body?.motivo, (req as any).userId)
    )
  )
);

router.post(
  '/processos/:id/emitir-licenca',
  handle(async (req, res) =>
    res.json(
      await licenciamentoService.emitirLicenca(req.params.id, {
        validadeMeses: req.body?.validadeMeses ? Number(req.body.validadeMeses) : undefined,
        autorId: (req as any).userId,
      })
    )
  )
);

router.post(
  '/processos/:id/cancelar',
  handle(async (req, res) =>
    res.json(
      await licenciamentoService.cancelar(req.params.id, req.body?.motivo, (req as any).userId)
    )
  )
);

export default router;
