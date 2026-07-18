import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import esportesService from '../../services/esportes/esportes.service';

/**
 * App Escolinhas & Espaços Esportivos (Fase 2) — Esportes
 * Prefixo: /api/apps/esportes
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

router.get(
  '/stats',
  handle(async (_req, res) => res.json(await esportesService.getStatistics()))
);

// ------------------------------------------------------------------- turmas
router.get(
  '/turmas',
  handle(async (req, res) =>
    res.json(await esportesService.listTurmas(req.query.incluirInativas === 'true'))
  )
);

router.post(
  '/turmas',
  handle(async (req, res) => res.status(201).json(await esportesService.createTurma(req.body)))
);

router.put(
  '/turmas/:id',
  handle(async (req, res) => res.json(await esportesService.updateTurma(req.params.id, req.body)))
);

router.get(
  '/turmas/:id/frequencias',
  handle(async (req, res) => res.json(await esportesService.listFrequencias(req.params.id)))
);

router.post(
  '/turmas/:id/frequencias',
  handle(async (req, res) =>
    res.status(201).json(
      await esportesService.registrarFrequencia(req.params.id, {
        data: req.body?.data,
        presentes: Array.isArray(req.body?.presentes) ? req.body.presentes : [],
        registradoPor: (req as any).userId,
      })
    )
  )
);

// --------------------------------------------------------------- matrículas
// GET /api/apps/esportes/matriculas?turmaId=&status=&busca=
router.get(
  '/matriculas',
  handle(async (req, res) => {
    const { turmaId, status, busca } = req.query;
    res.json(
      await esportesService.listMatriculas({
        turmaId: (turmaId as string) || undefined,
        status: (status as string) || undefined,
        busca: (busca as string) || undefined,
      })
    );
  })
);

router.post(
  '/matriculas',
  handle(async (req, res) => res.status(201).json(await esportesService.createMatricula(req.body)))
);

router.put(
  '/matriculas/:id',
  handle(async (req, res) =>
    res.json(await esportesService.atualizarMatricula(req.params.id, req.body))
  )
);

router.post(
  '/matriculas/:id/matricular',
  handle(async (req, res) => {
    if (!req.body?.turmaId) return res.status(400).json({ error: 'turmaId é obrigatório' });
    res.json(await esportesService.matricular(req.params.id, req.body.turmaId));
  })
);

// ------------------------------------------------------------------ espaços
router.get(
  '/espacos',
  handle(async (_req, res) => res.json(await esportesService.listEspacos()))
);

// ----------------------------------------------------------------- reservas
// GET /api/apps/esportes/reservas?espacoId=&status=&data=
router.get(
  '/reservas',
  handle(async (req, res) => {
    const { espacoId, status, data } = req.query;
    res.json(
      await esportesService.listReservas({
        espacoId: (espacoId as string) || undefined,
        status: (status as string) || undefined,
        data: (data as string) || undefined,
      })
    );
  })
);

router.post(
  '/reservas',
  handle(async (req, res) => res.status(201).json(await esportesService.createReserva(req.body)))
);

router.put(
  '/reservas/:id',
  handle(async (req, res) =>
    res.json(await esportesService.atualizarReserva(req.params.id, req.body))
  )
);

router.post(
  '/reservas/:id/confirmar',
  handle(async (req, res) => res.json(await esportesService.confirmarReserva(req.params.id)))
);

router.post(
  '/reservas/:id/recusar',
  handle(async (req, res) =>
    res.json(await esportesService.recusarReserva(req.params.id, req.body?.motivo))
  )
);

router.post(
  '/reservas/:id/cancelar',
  handle(async (req, res) =>
    res.json(await esportesService.cancelarReserva(req.params.id, req.body?.motivo))
  )
);

// -------------------------------------------------------------- competições
router.get(
  '/competicoes',
  handle(async (_req, res) => res.json(await esportesService.listCompeticoes()))
);

router.post(
  '/competicoes',
  handle(async (req, res) => res.status(201).json(await esportesService.createCompeticao(req.body)))
);

router.put(
  '/competicoes/:id',
  handle(async (req, res) =>
    res.json(await esportesService.atualizarCompeticao(req.params.id, req.body))
  )
);

// GET /api/apps/esportes/inscricoes-competicao?competicaoId=&status=
router.get(
  '/inscricoes-competicao',
  handle(async (req, res) => {
    const { competicaoId, status } = req.query;
    res.json(
      await esportesService.listInscricoesCompeticao({
        competicaoId: (competicaoId as string) || undefined,
        status: (status as string) || undefined,
      })
    );
  })
);

router.post(
  '/inscricoes-competicao',
  handle(async (req, res) =>
    res.status(201).json(await esportesService.createInscricaoCompeticao(req.body))
  )
);

router.post(
  '/inscricoes-competicao/:id/confirmar',
  handle(async (req, res) =>
    res.json(
      await esportesService.confirmarInscricaoCompeticao(req.params.id, req.body?.competicaoId)
    )
  )
);

router.post(
  '/inscricoes-competicao/:id/cancelar',
  handle(async (req, res) =>
    res.json(await esportesService.cancelarInscricaoCompeticao(req.params.id))
  )
);

// -------------------------------------------------------------- empréstimos
// GET /api/apps/esportes/emprestimos?status=
router.get(
  '/emprestimos',
  handle(async (req, res) =>
    res.json(
      await esportesService.listEmprestimos({
        status: (req.query.status as string) || undefined,
      })
    )
  )
);

router.post(
  '/emprestimos',
  handle(async (req, res) => res.status(201).json(await esportesService.createEmprestimo(req.body)))
);

router.post(
  '/emprestimos/:id/emprestar',
  handle(async (req, res) =>
    res.json(await esportesService.emprestar(req.params.id, req.body?.dataPrevistaDevolucao))
  )
);

router.post(
  '/emprestimos/:id/devolver',
  handle(async (req, res) => res.json(await esportesService.devolver(req.params.id)))
);

router.post(
  '/emprestimos/:id/cancelar',
  handle(async (req, res) =>
    res.json(await esportesService.cancelarEmprestimo(req.params.id, req.body?.motivo))
  )
);

export default router;
