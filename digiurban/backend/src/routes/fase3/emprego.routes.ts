import { Router } from 'express';
import empregoService, { ESCOLARIDADES_EMPREGO } from '../../services/emprego/emprego.service';
import { requireDepartmentAccess } from '../../middleware/department-access';

/**
 * Balcão de Empregos (Fase 3 da auditoria de 2026-10-08) — Desenvolvimento Econômico
 * Prefixo: /api/apps/desenvolvimento-economico
 */
const router = Router();
router.use(...requireDepartmentAccess('DESENVOLVIMENTO_ECONOMICO'));

const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro na operação' });
  }
};

router.get('/stats', handle(async (_req, res) => res.json({ ...(await empregoService.stats()), escolaridades: ESCOLARIDADES_EMPREGO })));

router.get(
  '/curriculos',
  handle(async (req, res) => res.json(await empregoService.listCurriculos({ status: req.query.status as string | undefined, busca: req.query.busca as string | undefined })))
);
router.post('/curriculos', handle(async (req, res) => res.status(201).json(await empregoService.saveCurriculo(null, req.body))));
router.put('/curriculos/:id', handle(async (req, res) => res.json(await empregoService.saveCurriculo(req.params.id, req.body))));

router.get('/vagas', handle(async (req, res) => res.json(await empregoService.listVagas({ status: req.query.status as string | undefined }))));
router.post('/vagas', handle(async (req, res) => res.status(201).json(await empregoService.saveVaga(null, req.body))));
router.put('/vagas/:id', handle(async (req, res) => res.json(await empregoService.saveVaga(req.params.id, req.body))));
// Vaga com encaminhados e candidatos sugeridos
router.get('/vagas/:id', handle(async (req, res) => res.json(await empregoService.vagaComCandidatos(req.params.id))));
router.post(
  '/vagas/:id/encaminhar',
  handle(async (req, res) => {
    if (!req.body?.curriculoId) return res.status(400).json({ error: 'Escolha o trabalhador' });
    res.status(201).json(await empregoService.encaminhar(req.params.id, req.body.curriculoId, req.userId));
  })
);
router.put('/encaminhamentos/:id', handle(async (req, res) => res.json(await empregoService.resultado(req.params.id, String(req.body?.status || ''), req.body?.observacao))));

export default router;
