import { Router } from 'express';
import segurancaService from '../../services/seguranca/seguranca.service';
import { requireDepartmentAccess } from '../../middleware/department-access';

/**
 * Ocorrências de Segurança (Fase 3 da auditoria de 2026-10-08) — Segurança Pública
 * Prefixo: /api/apps/seguranca-publica
 */
const router = Router();
router.use(...requireDepartmentAccess('SEGURANCA_PUBLICA'));

const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro na operação' });
  }
};

router.get('/stats', handle(async (_req, res) => res.json(await segurancaService.stats())));
router.get('/ocorrencias/mapa', handle(async (_req, res) => res.json(await segurancaService.mapa())));
router.get(
  '/ocorrencias',
  handle(async (req, res) =>
    res.json(
      await segurancaService.list({
        status: req.query.status as string | undefined,
        tipo: req.query.tipo as string | undefined,
        abertas: req.query.abertas === 'true',
      })
    )
  )
);
router.post('/ocorrencias', handle(async (req, res) => res.status(201).json(await segurancaService.create(req.body, req.userId))));
router.post('/ocorrencias/:id/assumir', handle(async (req, res) => res.json(await segurancaService.assumir(req.params.id, req.userId, req.body?.equipe))));
router.put(
  '/ocorrencias/:id/prioridade',
  handle(async (req, res) => res.json(await segurancaService.definirPrioridade(req.params.id, req.userId, String(req.body?.prioridade || ''))))
);
router.post('/ocorrencias/:id/providencia', handle(async (req, res) => res.json(await segurancaService.registrarProvidencia(req.params.id, req.userId, req.body?.texto))));
router.post(
  '/ocorrencias/:id/encerrar',
  handle(async (req, res) => res.json(await segurancaService.encerrar(req.params.id, req.userId, { resultado: req.body?.resultado, mensagem: req.body?.mensagem })))
);

export default router;
