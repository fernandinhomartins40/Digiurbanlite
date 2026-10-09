import { Router } from 'express';
import cemiterioService from '../../services/apps-gerais/cemiterio.service';
import { requireDepartmentAccess } from '../../middleware/department-access';
import { handle } from './common';

/**
 * Cemitérios (Serviços Públicos, 2026-10-09)
 * Prefixo: /api/apps/cemiterios
 */
const router = Router();
router.use(...requireDepartmentAccess('SERVICOS_PUBLICOS'));

router.get('/stats', handle(async (_req, res) => res.json(await cemiterioService.stats())));
router.get('/cemiterios', handle(async (_req, res) => res.json(await cemiterioService.cemiterios())));

router.get(
  '/jazigos',
  handle(async (req, res) =>
    res.json(
      await cemiterioService.listJazigos({
        cemiterio: req.query.cemiterio as string | undefined,
        status: req.query.status as string | undefined,
        busca: req.query.busca as string | undefined,
      })
    )
  )
);
router.post('/jazigos', handle(async (req, res) => res.status(201).json(await cemiterioService.saveJazigo(null, req.body))));
router.put('/jazigos/:id', handle(async (req, res) => res.json(await cemiterioService.saveJazigo(req.params.id, req.body))));
router.post('/jazigos/:id/sepultamentos', handle(async (req, res) => res.status(201).json(await cemiterioService.registrarSepultamento(req.params.id, req.body))));

router.get(
  '/pedidos',
  handle(async (req, res) => res.json(await cemiterioService.listPedidos({ status: req.query.status as string | undefined, pendentes: req.query.pendentes === 'true' })))
);
router.post('/pedidos/:id/agendar', handle(async (req, res) => res.json(await cemiterioService.agendarExumacao(req.params.id, req.userId, req.body || {}))));
router.post('/pedidos/:id/atender', handle(async (req, res) => res.json(await cemiterioService.atender(req.params.id, req.userId, req.body || {}))));
router.post('/pedidos/:id/recusar', handle(async (req, res) => res.json(await cemiterioService.recusar(req.params.id, req.userId, req.body?.mensagem))));

export default router;
