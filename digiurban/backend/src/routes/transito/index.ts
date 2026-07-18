import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import transitoService from '../../services/transito/transito.service';

/**
 * App Credenciamentos & Vistorias (Fase 3) — Transportes e Trânsito
 * Prefixo: /api/apps/transportes-transito
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

router.get(
  '/stats',
  handle(async (_req, res) => res.json(await transitoService.getStatistics()))
);

// -------------------------------------------------------------- credenciais
// GET /api/apps/transportes-transito/credenciais?tipo=&status=&busca=
router.get(
  '/credenciais',
  handle(async (req, res) => {
    const { tipo, status, busca } = req.query;
    res.json(
      await transitoService.listCredenciais({
        tipo: (tipo as string) || undefined,
        status: (status as string) || undefined,
        busca: (busca as string) || undefined,
      })
    );
  })
);

router.post(
  '/credenciais',
  handle(async (req, res) => res.status(201).json(await transitoService.createCredencial(req.body)))
);

router.put(
  '/credenciais/:id',
  handle(async (req, res) =>
    res.json(await transitoService.atualizarCredencial(req.params.id, req.body))
  )
);

router.post(
  '/credenciais/:id/iniciar-analise',
  handle(async (req, res) => res.json(await transitoService.iniciarAnaliseCredencial(req.params.id)))
);

router.post(
  '/credenciais/:id/emitir',
  handle(async (req, res) =>
    res.json(await transitoService.emitirCredencial(req.params.id, req.body?.validadeMeses))
  )
);

router.post(
  '/credenciais/:id/indeferir',
  handle(async (req, res) =>
    res.json(await transitoService.indeferirCredencial(req.params.id, req.body?.motivo))
  )
);

router.post(
  '/credenciais/:id/renovar',
  handle(async (req, res) =>
    res.json(await transitoService.renovarCredencial(req.params.id, req.body?.validadeMeses))
  )
);

router.post(
  '/credenciais/:id/suspender',
  handle(async (req, res) =>
    res.json(await transitoService.suspenderCredencial(req.params.id, req.body?.motivo))
  )
);

router.post(
  '/credenciais/:id/reativar',
  handle(async (req, res) => res.json(await transitoService.reativarCredencial(req.params.id)))
);

router.post(
  '/credenciais/:id/cancelar',
  handle(async (req, res) =>
    res.json(await transitoService.cancelarCredencial(req.params.id, req.body?.motivo))
  )
);

// ---------------------------------------------------------------- vistorias
// GET /api/apps/transportes-transito/vistorias?status=&credencialId=
router.get(
  '/vistorias',
  handle(async (req, res) => {
    const { status, credencialId } = req.query;
    res.json(
      await transitoService.listVistorias({
        status: (status as string) || undefined,
        credencialId: (credencialId as string) || undefined,
      })
    );
  })
);

router.post(
  '/vistorias',
  handle(async (req, res) => res.status(201).json(await transitoService.createVistoria(req.body)))
);

router.post(
  '/vistorias/:id/agendar',
  handle(async (req, res) =>
    res.json(
      await transitoService.agendarVistoria(
        req.params.id,
        req.body?.agendadaPara,
        req.body?.credencialId
      )
    )
  )
);

router.post(
  '/vistorias/:id/resultado',
  handle(async (req, res) =>
    res.json(
      await transitoService.registrarResultadoVistoria(req.params.id, {
        resultado: req.body?.resultado,
        itens: req.body?.itens,
        vistoriador: req.body?.vistoriador || (req as any).user?.name,
        observacoes: req.body?.observacoes,
      })
    )
  )
);

router.post(
  '/vistorias/:id/cancelar',
  handle(async (req, res) =>
    res.json(await transitoService.cancelarVistoria(req.params.id, req.body?.motivo))
  )
);

// ------------------------------------------------------------------ defesas
// GET /api/apps/transportes-transito/defesas?status=&busca=
router.get(
  '/defesas',
  handle(async (req, res) => {
    const { status, busca } = req.query;
    res.json(
      await transitoService.listDefesas({
        status: (status as string) || undefined,
        busca: (busca as string) || undefined,
      })
    );
  })
);

router.post(
  '/defesas',
  handle(async (req, res) => res.status(201).json(await transitoService.createDefesa(req.body)))
);

router.post(
  '/defesas/:id/iniciar-analise',
  handle(async (req, res) => res.json(await transitoService.iniciarAnaliseDefesa(req.params.id)))
);

router.post(
  '/defesas/:id/julgar',
  handle(async (req, res) =>
    res.json(
      await transitoService.julgarDefesa(req.params.id, {
        decisao: req.body?.decisao,
        parecer: req.body?.parecer,
      })
    )
  )
);

router.post(
  '/defesas/:id/cancelar',
  handle(async (req, res) => res.json(await transitoService.cancelarDefesa(req.params.id)))
);

export default router;
