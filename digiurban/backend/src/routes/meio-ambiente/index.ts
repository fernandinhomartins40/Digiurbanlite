import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import meioAmbienteService from '../../services/meio-ambiente/meio-ambiente.service';

/**
 * App Licenciamento & Fiscalização Ambiental (Fase 2) — Meio Ambiente
 * Prefixo: /api/apps/meio-ambiente
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
  handle(async (_req, res) => res.json(await meioAmbienteService.getStatistics()))
);

// GET /api/apps/meio-ambiente/processos?status=&tipo=&bairro=
router.get(
  '/processos',
  handle(async (req, res) => {
    const { status, tipo, bairro } = req.query;
    res.json(
      await meioAmbienteService.listProcessos({
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
    res.status(201).json(await meioAmbienteService.createProcesso(req.body))
  )
);

router.get(
  '/processos/:id',
  handle(async (req, res) => {
    const processo = await meioAmbienteService.findById(req.params.id);
    if (!processo) return res.status(404).json({ error: 'Processo não encontrado' });
    res.json(processo);
  })
);

router.put(
  '/processos/:id',
  handle(async (req, res) =>
    res.json(await meioAmbienteService.updateProcesso(req.params.id, req.body))
  )
);

router.post(
  '/processos/:id/iniciar-analise',
  handle(async (req, res) =>
    res.json(
      await meioAmbienteService.iniciarAnalise(
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
      await meioAmbienteService.registrarParecer(req.params.id, {
        ...req.body,
        autorId: req.body?.autorId || (req as any).userId,
      })
    )
  )
);

router.post(
  '/processos/:id/agendar-vistoria',
  handle(async (req, res) =>
    res.status(201).json(
      await meioAmbienteService.agendarVistoria(req.params.id, {
        dataAgendada: req.body?.dataAgendada,
        fiscalId: req.body?.fiscalId || (req as any).userId,
        observacoes: req.body?.observacoes,
      })
    )
  )
);

router.post(
  '/vistorias/:id/registrar',
  handle(async (req, res) =>
    res.json(
      await meioAmbienteService.registrarResultadoVistoria(req.params.id, {
        ...req.body,
        fiscalId: req.body?.fiscalId || (req as any).userId,
      })
    )
  )
);

router.post(
  '/processos/:id/aprovar',
  handle(async (req, res) =>
    res.json(await meioAmbienteService.aprovar(req.params.id, (req as any).userId))
  )
);

router.post(
  '/processos/:id/indeferir',
  handle(async (req, res) =>
    res.json(
      await meioAmbienteService.indeferir(req.params.id, req.body?.motivo, (req as any).userId)
    )
  )
);

router.post(
  '/processos/:id/emitir-licenca',
  handle(async (req, res) =>
    res.json(
      await meioAmbienteService.emitirLicenca(req.params.id, {
        validadeMeses: req.body?.validadeMeses ? Number(req.body.validadeMeses) : undefined,
        condicionantes: Array.isArray(req.body?.condicionantes) ? req.body.condicionantes : undefined,
        autorId: (req as any).userId,
      })
    )
  )
);

router.post(
  '/processos/:id/renovar',
  handle(async (req, res) =>
    res.status(201).json(await meioAmbienteService.renovarLicenca(req.params.id))
  )
);

router.post(
  '/processos/:id/lavrar-auto',
  handle(async (req, res) =>
    res.status(201).json(
      await meioAmbienteService.lavrarAuto(req.params.id, {
        ...req.body,
        fiscalId: req.body?.fiscalId || (req as any).userId,
      })
    )
  )
);

router.put(
  '/autos/:id',
  handle(async (req, res) =>
    res.json(await meioAmbienteService.atualizarAuto(req.params.id, req.body || {}))
  )
);

router.post(
  '/processos/:id/arquivar',
  handle(async (req, res) =>
    res.json(
      await meioAmbienteService.arquivar(req.params.id, req.body?.motivo, (req as any).userId)
    )
  )
);

router.post(
  '/processos/:id/cancelar',
  handle(async (req, res) =>
    res.json(
      await meioAmbienteService.cancelar(req.params.id, req.body?.motivo, (req as any).userId)
    )
  )
);

export default router;
