import { Router } from 'express';
import agendaService, { AGENDA_DEPARTMENTS } from '../../services/apps-gerais/agenda-atendimentos.service';
import { brasiliaDayKey } from '../../services/agenda-medica/brasilia-time';
import { appGeralAccess, handle } from './common';

/**
 * Agenda de Atendimentos (app geral, 2026-10-09)
 * Prefixo: /api/apps/agenda-atendimentos
 */
const router = Router();
router.use(...appGeralAccess(AGENDA_DEPARTMENTS));

router.get('/secretarias', (req: any, res) => res.json(req.appScope || AGENDA_DEPARTMENTS));
router.get('/stats', handle(async (req, res) => res.json(await agendaService.stats(req.appScope, brasiliaDayKey(new Date())))));
router.get('/profissionais', handle(async (req, res) => res.json(await agendaService.profissionais(req.appScope))));
router.get(
  '/atendimentos',
  handle(async (req, res) =>
    res.json(
      await agendaService.list(req.appScope, {
        status: req.query.status as string | undefined,
        dia: req.query.dia as string | undefined,
        departmentCode: req.query.departmentCode as string | undefined,
        abertos: req.query.abertos === 'true',
      })
    )
  )
);
router.post('/atendimentos', handle(async (req, res) => res.status(201).json(await agendaService.create(req.appScope, req.body, req.userId))));
router.post('/atendimentos/:id/agendar', handle(async (req, res) => res.json(await agendaService.agendar(req.params.id, req.appScope, req.userId, req.body))));
router.post(
  '/atendimentos/:id/resultado',
  handle(async (req, res) => res.json(await agendaService.registrarResultado(req.params.id, req.appScope, req.userId, { resultado: req.body?.resultado, mensagem: req.body?.mensagem })))
);
router.post('/atendimentos/:id/cancelar', handle(async (req, res) => res.json(await agendaService.cancelar(req.params.id, req.appScope, req.userId, req.body?.motivo))));

export default router;
