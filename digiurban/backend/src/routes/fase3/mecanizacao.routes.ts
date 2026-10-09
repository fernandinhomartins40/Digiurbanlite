import { Router } from 'express';
import mecanizacaoService from '../../services/agricultura/mecanizacao.service';
import { requireDepartmentAccess } from '../../middleware/department-access';

/**
 * Mecanização agrícola (Fase 3 da auditoria de 2026-10-08)
 * Prefixo: /api/agricultura/mecanizacao
 */
const router = Router();
router.use(...requireDepartmentAccess('AGRICULTURA'));

const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro na operação' });
  }
};

router.get('/stats', handle(async (_req, res) => res.json(await mecanizacaoService.stats())));

router.get('/maquinas', handle(async (_req, res) => res.json(await mecanizacaoService.listMaquinas())));
router.post('/maquinas', handle(async (req, res) => res.status(201).json(await mecanizacaoService.saveMaquina(null, req.body))));
router.put('/maquinas/:id', handle(async (req, res) => res.json(await mecanizacaoService.saveMaquina(req.params.id, req.body))));
router.delete('/maquinas/:id', handle(async (req, res) => res.json(await mecanizacaoService.removeMaquina(req.params.id))));

router.get('/servicos', handle(async (req, res) => res.json(await mecanizacaoService.list({ status: req.query.status as string | undefined }))));
router.post('/servicos', handle(async (req, res) => res.status(201).json(await mecanizacaoService.create(req.body))));
router.post('/servicos/:id/agendar', handle(async (req, res) => res.json(await mecanizacaoService.agendar(req.params.id, req.userId, req.body || {}))));
router.post('/servicos/:id/iniciar', handle(async (req, res) => res.json(await mecanizacaoService.iniciar(req.params.id))));
router.post('/servicos/:id/concluir', handle(async (req, res) => res.json(await mecanizacaoService.concluir(req.params.id, req.userId, req.body || {}))));
router.post('/servicos/:id/recusar', handle(async (req, res) => res.json(await mecanizacaoService.recusar(req.params.id, req.userId, req.body?.motivo))));

export default router;
