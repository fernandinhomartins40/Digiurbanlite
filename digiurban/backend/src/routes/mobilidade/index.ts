import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import mobilidadeService from '../../services/mobilidade/mobilidade.service';

/**
 * App Carteiras & Gratuidades (Fase 3) — Mobilidade Urbana
 * Prefixo: /api/apps/mobilidade-urbana
 */
const router = Router();

const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro na operação' });
  }
};

// Validação pública do QR da carteira — SEM autenticação (fiscal/motorista
// escaneia o código). Retorna dados mascarados, nunca CPF.
router.get(
  '/validar/:codigo',
  handle(async (req, res) => res.json(await mobilidadeService.validarPorCodigo(req.params.codigo)))
);

router.use(authenticateAdmin);

router.get(
  '/stats',
  handle(async (_req, res) => res.json(await mobilidadeService.getStatistics()))
);

// ---------------------------------------------------------------- carteiras
// GET /api/apps/mobilidade-urbana/carteiras?tipo=&status=&busca=
router.get(
  '/carteiras',
  handle(async (req, res) => {
    const { tipo, status, busca } = req.query;
    res.json(
      await mobilidadeService.listCarteiras({
        tipo: (tipo as string) || undefined,
        status: (status as string) || undefined,
        busca: (busca as string) || undefined,
      })
    );
  })
);

router.post(
  '/carteiras',
  handle(async (req, res) => res.status(201).json(await mobilidadeService.createCarteira(req.body)))
);

router.put(
  '/carteiras/:id',
  handle(async (req, res) =>
    res.json(await mobilidadeService.atualizarCarteira(req.params.id, req.body))
  )
);

router.post(
  '/carteiras/:id/iniciar-analise',
  handle(async (req, res) => res.json(await mobilidadeService.iniciarAnalise(req.params.id)))
);

router.post(
  '/carteiras/:id/emitir',
  handle(async (req, res) =>
    res.json(await mobilidadeService.emitirCarteira(req.params.id, req.body?.validadeMeses))
  )
);

router.post(
  '/carteiras/:id/indeferir',
  handle(async (req, res) =>
    res.json(await mobilidadeService.indeferirCarteira(req.params.id, req.body?.motivo))
  )
);

router.post(
  '/carteiras/:id/renovar',
  handle(async (req, res) =>
    res.json(await mobilidadeService.renovarCarteira(req.params.id, req.body?.validadeMeses))
  )
);

router.post(
  '/carteiras/:id/segunda-via',
  handle(async (req, res) => res.json(await mobilidadeService.segundaVia(req.params.id)))
);

router.post(
  '/carteiras/:id/suspender',
  handle(async (req, res) =>
    res.json(await mobilidadeService.suspenderCarteira(req.params.id, req.body?.motivo))
  )
);

router.post(
  '/carteiras/:id/reativar',
  handle(async (req, res) => res.json(await mobilidadeService.reativarCarteira(req.params.id)))
);

router.post(
  '/carteiras/:id/cancelar',
  handle(async (req, res) =>
    res.json(await mobilidadeService.cancelarCarteira(req.params.id, req.body?.motivo))
  )
);

export default router;
