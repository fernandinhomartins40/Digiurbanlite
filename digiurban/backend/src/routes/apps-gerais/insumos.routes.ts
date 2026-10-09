import { Router } from 'express';
import pedidoInsumoService from '../../services/agricultura/pedido-insumo.service';
import { requireDepartmentAccess } from '../../middleware/department-access';
import { handle } from './common';

/**
 * Pedidos de sementes, mudas, adubo e calcário do portal (2026-10-09)
 * Prefixo: /api/agricultura/pedidos-insumos
 */
const router = Router();
router.use(...requireDepartmentAccess('AGRICULTURA'));

router.get('/', handle(async (req, res) => res.json(await pedidoInsumoService.list({ status: req.query.status as string | undefined, pendentes: req.query.pendentes === 'true' }))));
router.post('/:id/entregar', handle(async (req, res) => res.json(await pedidoInsumoService.entregar(req.params.id, req.userId, req.body || {}))));
router.post('/:id/recusar', handle(async (req, res) => res.json(await pedidoInsumoService.recusar(req.params.id, req.userId, req.body?.mensagem))));

export default router;
