import { Router } from 'express';
import cursosService, { CURSOS_DEPARTMENTS } from '../../services/apps-gerais/cursos.service';
import { appGeralAccess, handle } from './common';

/**
 * Cursos e Capacitações (app geral, 2026-10-09)
 * Prefixo: /api/apps/cursos
 */
const router = Router();
router.use(...appGeralAccess(CURSOS_DEPARTMENTS));

router.get('/secretarias', (req: any, res) => res.json(req.appScope || CURSOS_DEPARTMENTS));
router.get('/stats', handle(async (req, res) => res.json(await cursosService.stats(req.appScope))));

router.get('/cursos', handle(async (req, res) => res.json(await cursosService.listCursos(req.appScope, req.query.todos === 'true'))));
router.post('/cursos', handle(async (req, res) => res.status(201).json(await cursosService.saveCurso(req.appScope, null, req.body))));
router.put('/cursos/:id', handle(async (req, res) => res.json(await cursosService.saveCurso(req.appScope, req.params.id, req.body))));
router.post('/cursos/:id/iniciar', handle(async (req, res) => res.json(await cursosService.iniciarCurso(req.params.id, req.appScope))));
router.post('/cursos/:id/concluir', handle(async (req, res) => res.json(await cursosService.concluirCurso(req.params.id, req.appScope, req.userId))));
router.post('/cursos/:id/cancelar', handle(async (req, res) => res.json(await cursosService.cancelarCurso(req.params.id, req.appScope, req.userId, req.body?.motivo))));

router.get(
  '/inscricoes',
  handle(async (req, res) =>
    res.json(
      await cursosService.listInscricoes(req.appScope, {
        status: req.query.status as string | undefined,
        cursoId: req.query.cursoId as string | undefined,
        esperando: req.query.esperando === 'true',
      })
    )
  )
);
router.post('/inscricoes', handle(async (req, res) => res.status(201).json(await cursosService.createInscricao(req.appScope, req.body, req.userId))));
router.post('/inscricoes/:id/turma', handle(async (req, res) => res.json(await cursosService.colocarNaTurma(req.params.id, req.body?.cursoId, req.appScope, req.userId))));
router.put('/inscricoes/:id/frequencia', handle(async (req, res) => res.json(await cursosService.lancarFrequencia(req.params.id, req.appScope, req.body?.presencas))));
router.post(
  '/inscricoes/:id/encerrar',
  handle(async (req, res) => res.json(await cursosService.encerrarInscricao(req.params.id, req.appScope, req.userId, { tipo: req.body?.tipo, mensagem: req.body?.mensagem })))
);

export default router;
