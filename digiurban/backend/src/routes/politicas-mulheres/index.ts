import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import casoMulherService from '../../services/politicas-mulheres/caso-mulher.service';

/**
 * App Rede de Atendimento à Mulher (Fase 2, B7 — sigilo máximo)
 * Prefixo: /api/apps/politicas-mulheres
 *
 * ATENÇÃO: por decisão de projeto este app NÃO tem endpoint de export (CSV
 * ou outro). Ficha completa só para a equipe do caso; leituras auditadas.
 */
const router = Router();
router.use(authenticateAdmin);

const ctx = (req: any) => ({ userId: req.userId as string, role: req.userRole as string });

const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(error?.status || 400).json({ error: error.message || 'Erro na operação' });
  }
};

// Rotas fixas ANTES de /casos/:id
router.get(
  '/casos/stats',
  handle(async (_req, res) => res.json(await casoMulherService.getStatistics()))
);

// GET /api/apps/politicas-mulheres/casos?status=&tipo=&risco=
router.get(
  '/casos',
  handle(async (req, res) => {
    const { status, tipo, risco } = req.query;
    res.json(
      await casoMulherService.listCasos(ctx(req), {
        status: (status as string) || undefined,
        tipo: (tipo as string) || undefined,
        risco: (risco as string) || undefined,
      })
    );
  })
);

router.post(
  '/casos',
  handle(async (req, res) =>
    res.status(201).json(await casoMulherService.createCaso(req.body, ctx(req)))
  )
);

router.get(
  '/casos/:id',
  handle(async (req, res) => {
    const caso = await casoMulherService.findById(req.params.id, ctx(req));
    if (!caso) return res.status(404).json({ error: 'Caso não encontrado' });
    res.json(caso);
  })
);

router.put(
  '/casos/:id',
  handle(async (req, res) =>
    res.json(await casoMulherService.updateCaso(req.params.id, req.body, ctx(req)))
  )
);

router.post(
  '/casos/:id/equipe',
  handle(async (req, res) =>
    res.json(
      await casoMulherService.atualizarEquipe(
        req.params.id,
        {
          adicionar: Array.isArray(req.body?.adicionar) ? req.body.adicionar : [],
          remover: Array.isArray(req.body?.remover) ? req.body.remover : [],
        },
        ctx(req)
      )
    )
  )
);

router.post(
  '/casos/:id/atendimentos',
  handle(async (req, res) =>
    res.status(201).json(
      await casoMulherService.registrarAtendimento(
        req.params.id,
        { tipo: req.body?.tipo, relato: req.body?.relato },
        ctx(req)
      )
    )
  )
);

router.post(
  '/casos/:id/encaminhamentos',
  handle(async (req, res) =>
    res.status(201).json(
      await casoMulherService.registrarEncaminhamento(
        req.params.id,
        { destino: req.body?.destino, detalhes: req.body?.detalhes },
        ctx(req)
      )
    )
  )
);

router.put(
  '/encaminhamentos/:id',
  handle(async (req, res) =>
    res.json(
      await casoMulherService.atualizarEncaminhamento(req.params.id, req.body?.status, ctx(req))
    )
  )
);

router.post(
  '/casos/:id/encerrar',
  handle(async (req, res) =>
    res.json(await casoMulherService.encerrar(req.params.id, req.body?.motivo, ctx(req)))
  )
);

router.post(
  '/casos/:id/reabrir',
  handle(async (req, res) => res.json(await casoMulherService.reabrir(req.params.id, ctx(req))))
);

export default router;
