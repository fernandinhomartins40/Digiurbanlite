import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import habitacaoService from '../../services/habitacao/habitacao.service';

/**
 * App Programas Habitacionais (Fase 2) — Habitação
 * Prefixo: /api/apps/habitacao
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

// ------------------------------------------------------------------ programas
router.get(
  '/programas',
  handle(async (req, res) =>
    res.json(await habitacaoService.listProgramas(req.query.incluirInativos === 'true'))
  )
);

router.post(
  '/programas',
  handle(async (req, res) => res.status(201).json(await habitacaoService.createPrograma(req.body)))
);

router.put(
  '/programas/:id',
  handle(async (req, res) => res.json(await habitacaoService.updatePrograma(req.params.id, req.body)))
);

router.post(
  '/programas/:id/sortear',
  handle(async (req, res) =>
    res.json(await habitacaoService.sortear(req.params.id, Number(req.body?.quantidade) || 1))
  )
);

// ------------------------------------------------------------------ conjuntos
router.get(
  '/conjuntos',
  handle(async (_req, res) => res.json(await habitacaoService.listConjuntos()))
);

router.post(
  '/conjuntos',
  handle(async (req, res) => res.status(201).json(await habitacaoService.createConjunto(req.body)))
);

// ----------------------------------------------------------------- inscrições
// Rotas fixas ANTES de /inscricoes/:id
router.get(
  '/inscricoes/stats',
  handle(async (_req, res) => res.json(await habitacaoService.getStatistics()))
);

// GET /api/apps/habitacao/inscricoes?programaId=&status=&busca=
router.get(
  '/inscricoes',
  handle(async (req, res) => {
    const { programaId, status, busca } = req.query;
    res.json(
      await habitacaoService.listInscricoes({
        programaId: (programaId as string) || undefined,
        status: (status as string) || undefined,
        busca: (busca as string) || undefined,
      })
    );
  })
);

router.post(
  '/inscricoes',
  handle(async (req, res) => res.status(201).json(await habitacaoService.createInscricao(req.body)))
);

router.get(
  '/inscricoes/:id',
  handle(async (req, res) => {
    const inscricao = await habitacaoService.findInscricaoById(req.params.id);
    if (!inscricao) return res.status(404).json({ error: 'Inscrição não encontrada' });
    res.json(inscricao);
  })
);

router.put(
  '/inscricoes/:id',
  handle(async (req, res) =>
    res.json(await habitacaoService.updateInscricao(req.params.id, req.body))
  )
);

router.post(
  '/inscricoes/:id/iniciar-analise',
  handle(async (req, res) => res.json(await habitacaoService.iniciarAnalise(req.params.id)))
);

router.post(
  '/inscricoes/:id/classificar',
  handle(async (req, res) => res.json(await habitacaoService.classificar(req.params.id)))
);

router.post(
  '/inscricoes/:id/indeferir',
  handle(async (req, res) =>
    res.json(await habitacaoService.indeferir(req.params.id, req.body?.motivo))
  )
);

router.post(
  '/inscricoes/:id/selecionar',
  handle(async (req, res) => res.json(await habitacaoService.selecionar(req.params.id)))
);

router.post(
  '/inscricoes/:id/contemplar',
  handle(async (req, res) =>
    res.json(
      await habitacaoService.contemplar(req.params.id, {
        conjuntoId: req.body?.conjuntoId,
        unidadeIdentificacao: req.body?.unidadeIdentificacao,
        contratoAssinadoEm: req.body?.contratoAssinadoEm,
      })
    )
  )
);

router.post(
  '/inscricoes/:id/cancelar',
  handle(async (req, res) =>
    res.json(await habitacaoService.cancelar(req.params.id, req.body?.motivo))
  )
);

export default router;
