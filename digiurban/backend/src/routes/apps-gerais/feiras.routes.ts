import { Router } from 'express';
import feirasService, { FEIRAS_DEPARTMENTS } from '../../services/apps-gerais/feiras.service';
import { appGeralAccess, handle } from './common';

/**
 * Feiras e Mercados (app geral, 2026-10-09)
 * Prefixo: /api/apps/feiras-mercados
 */
const router = Router();
router.use(...appGeralAccess(FEIRAS_DEPARTMENTS));

router.get('/secretarias', (req: any, res) => res.json(req.appScope || FEIRAS_DEPARTMENTS));
router.get('/stats', handle(async (req, res) => res.json(await feirasService.stats(req.appScope))));

router.get('/espacos', handle(async (req, res) => res.json(await feirasService.listEspacos(req.appScope))));
router.post('/espacos', handle(async (req, res) => res.status(201).json(await feirasService.saveEspaco(req.appScope, null, req.body))));
router.put('/espacos/:id', handle(async (req, res) => res.json(await feirasService.saveEspaco(req.appScope, req.params.id, req.body))));

router.get(
  '/permissoes',
  handle(async (req, res) => res.json(await feirasService.listPermissoes(req.appScope, { status: req.query.status as string | undefined, pendentes: req.query.pendentes === 'true' })))
);
router.post('/permissoes/:id/conceder', handle(async (req, res) => res.json(await feirasService.conceder(req.params.id, req.appScope, req.userId, req.body || {}))));
router.post('/permissoes/:id/recusar', handle(async (req, res) => res.json(await feirasService.recusar(req.params.id, req.appScope, req.userId, req.body?.mensagem))));
router.post('/permissoes/:id/revogar', handle(async (req, res) => res.json(await feirasService.revogar(req.params.id, req.appScope, req.userId, req.body?.motivo))));
router.post('/permissoes/:id/renovar', handle(async (req, res) => res.json(await feirasService.renovar(req.params.id, req.appScope, req.userId, req.body?.validade))));

export default router;
