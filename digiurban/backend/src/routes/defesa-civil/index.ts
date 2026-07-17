import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import defesaCivilService from '../../services/defesa-civil/defesa-civil.service';

/**
 * App Ocorrências & Áreas de Risco (Fase 2) — Defesa Civil
 * Prefixo: /api/apps/defesa-civil
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

// -------------------------------------------------------------- ocorrências
// Rotas fixas ANTES de /ocorrencias/:id
router.get(
  '/ocorrencias/stats',
  handle(async (_req, res) => res.json(await defesaCivilService.getStatistics()))
);

router.get(
  '/ocorrencias/mapa',
  handle(async (_req, res) => res.json(await defesaCivilService.listPontosMapa()))
);

// GET /api/apps/defesa-civil/ocorrencias?status=&tipo=&bairro=&gravidade=
router.get(
  '/ocorrencias',
  handle(async (req, res) => {
    const { status, tipo, bairro, gravidade } = req.query;
    res.json(
      await defesaCivilService.listOcorrencias({
        status: (status as string) || undefined,
        tipo: (tipo as string) || undefined,
        bairro: (bairro as string) || undefined,
        gravidade: (gravidade as string) || undefined,
      })
    );
  })
);

router.post(
  '/ocorrencias',
  handle(async (req, res) =>
    res.status(201).json(await defesaCivilService.createOcorrencia(req.body))
  )
);

router.get(
  '/ocorrencias/:id',
  handle(async (req, res) => {
    const ocorrencia = await defesaCivilService.findById(req.params.id);
    if (!ocorrencia) return res.status(404).json({ error: 'Ocorrência não encontrada' });
    res.json(ocorrencia);
  })
);

router.put(
  '/ocorrencias/:id',
  handle(async (req, res) =>
    res.json(await defesaCivilService.updateOcorrencia(req.params.id, req.body))
  )
);

router.post(
  '/ocorrencias/:id/iniciar-atendimento',
  handle(async (req, res) =>
    res.json(
      await defesaCivilService.iniciarAtendimento(
        req.params.id,
        req.body?.responsavelId || (req as any).userId
      )
    )
  )
);

router.post(
  '/ocorrencias/:id/registrar-vistoria',
  handle(async (req, res) =>
    res.json(
      await defesaCivilService.registrarVistoria(req.params.id, {
        laudo: req.body?.laudo,
        nivelRisco: req.body?.nivelRisco,
        interditar: !!req.body?.interditar,
        fotos: req.body?.fotos,
      })
    )
  )
);

router.post(
  '/ocorrencias/:id/monitorar',
  handle(async (req, res) => res.json(await defesaCivilService.monitorar(req.params.id)))
);

router.post(
  '/ocorrencias/:id/concluir',
  handle(async (req, res) =>
    res.json(await defesaCivilService.concluir(req.params.id, req.body?.observacao))
  )
);

router.post(
  '/ocorrencias/:id/cancelar',
  handle(async (req, res) =>
    res.json(await defesaCivilService.cancelar(req.params.id, req.body?.motivo))
  )
);

// ------------------------------------------------------------------ abrigos
router.get(
  '/abrigos',
  handle(async (_req, res) => res.json(await defesaCivilService.listAbrigos()))
);

router.post(
  '/abrigos',
  handle(async (req, res) => res.status(201).json(await defesaCivilService.createAbrigo(req.body)))
);

router.put(
  '/abrigos/:id',
  handle(async (req, res) => res.json(await defesaCivilService.updateAbrigo(req.params.id, req.body)))
);

// ----------------------------------------------------------------- famílias
// GET /api/apps/defesa-civil/familias?ocorrenciaId=&abrigoId=&situacao=
router.get(
  '/familias',
  handle(async (req, res) => {
    const { ocorrenciaId, abrigoId, situacao } = req.query;
    res.json(
      await defesaCivilService.listFamilias({
        ocorrenciaId: (ocorrenciaId as string) || undefined,
        abrigoId: (abrigoId as string) || undefined,
        situacao: (situacao as string) || undefined,
      })
    );
  })
);

router.post(
  '/familias',
  handle(async (req, res) => res.status(201).json(await defesaCivilService.createFamilia(req.body)))
);

router.put(
  '/familias/:id',
  handle(async (req, res) =>
    res.json(await defesaCivilService.updateFamilia(req.params.id, req.body))
  )
);

router.post(
  '/familias/:id/alojar',
  handle(async (req, res) => {
    if (!req.body?.abrigoId) return res.status(400).json({ error: 'abrigoId é obrigatório' });
    res.json(await defesaCivilService.alojarFamilia(req.params.id, req.body.abrigoId));
  })
);

router.post(
  '/familias/:id/retirar',
  handle(async (req, res) =>
    res.json(await defesaCivilService.retirarFamilia(req.params.id, req.body?.situacaoFinal))
  )
);

export default router;
