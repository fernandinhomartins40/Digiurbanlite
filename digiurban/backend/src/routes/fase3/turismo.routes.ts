import { Router } from 'express';
import turismoService from '../../services/turismo/turismo.service';
import { requireDepartmentAccess } from '../../middleware/department-access';

/**
 * Cadastro do Turismo (Fase 3 da auditoria de 2026-10-08)
 * Prefixo: /api/apps/turismo
 */
const router = Router();
router.use(...requireDepartmentAccess('TURISMO'));

const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro na operação' });
  }
};

router.get('/stats', handle(async (_req, res) => res.json(await turismoService.stats())));

router.get(
  '/prestadores',
  handle(async (req, res) =>
    res.json(
      await turismoService.listPrestadores({
        tipo: req.query.tipo as string | undefined,
        status: req.query.status as string | undefined,
        busca: req.query.busca as string | undefined,
      })
    )
  )
);
router.post('/prestadores', handle(async (req, res) => res.status(201).json(await turismoService.savePrestador(null, req.body))));
router.put('/prestadores/:id', handle(async (req, res) => res.json(await turismoService.savePrestador(req.params.id, req.body))));
router.post('/prestadores/:id/analisar', handle(async (req, res) => res.json(await turismoService.analisar(req.params.id, req.userId))));
router.post('/prestadores/:id/aprovar', handle(async (req, res) => res.json(await turismoService.aprovar(req.params.id, req.userId, req.body || {}))));
router.post('/prestadores/:id/indeferir', handle(async (req, res) => res.json(await turismoService.indeferir(req.params.id, req.userId, req.body?.motivo))));
router.post('/prestadores/:id/renovar', handle(async (req, res) => res.json(await turismoService.renovar(req.params.id, req.body?.validadeMeses))));
router.post('/prestadores/:id/suspender', handle(async (req, res) => res.json(await turismoService.suspender(req.params.id, req.body?.motivo))));
router.post('/prestadores/:id/reativar', handle(async (req, res) => res.json(await turismoService.reativar(req.params.id))));
router.put('/prestadores/:id/publicar', handle(async (req, res) => res.json(await turismoService.publicar(req.params.id, req.body?.publicado === true))));

router.get('/eventos', handle(async (req, res) => res.json(await turismoService.listEventos({ status: req.query.status as string | undefined }))));
// Evento lançado pela própria equipe já nasce aprovado
router.post('/eventos', handle(async (req, res) => res.status(201).json(await turismoService.saveEvento(null, { ...req.body, status: 'APROVADO' }))));
router.put('/eventos/:id', handle(async (req, res) => res.json(await turismoService.saveEvento(req.params.id, { ...req.body, status: undefined }))));
router.post('/eventos/:id/aprovar', handle(async (req, res) => res.json(await turismoService.aprovarEvento(req.params.id, req.userId, req.body || {}))));
router.post('/eventos/:id/indeferir', handle(async (req, res) => res.json(await turismoService.indeferirEvento(req.params.id, req.userId, req.body?.motivo))));
router.post(
  '/eventos/:id/situacao',
  handle(async (req, res) => res.json(await turismoService.situacaoEvento(req.params.id, req.body?.status === 'CANCELADO' ? 'CANCELADO' : 'REALIZADO')))
);

export default router;
