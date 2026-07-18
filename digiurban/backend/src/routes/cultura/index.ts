import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import culturaService from '../../services/cultura/cultura.service';

/**
 * App Espaços & Oficinas Culturais (Fase 3) — Cultura
 * Prefixo: /api/apps/cultura
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
  handle(async (_req, res) => res.json(await culturaService.getStatistics()))
);

// ----------------------------------------------------------------- oficinas
router.get(
  '/oficinas',
  handle(async (req, res) =>
    res.json(await culturaService.listOficinas(req.query.incluirInativas === 'true'))
  )
);

router.post(
  '/oficinas',
  handle(async (req, res) => res.status(201).json(await culturaService.createOficina(req.body)))
);

router.put(
  '/oficinas/:id',
  handle(async (req, res) => res.json(await culturaService.updateOficina(req.params.id, req.body)))
);

router.get(
  '/oficinas/:id/frequencias',
  handle(async (req, res) => res.json(await culturaService.listFrequencias(req.params.id)))
);

router.post(
  '/oficinas/:id/frequencias',
  handle(async (req, res) =>
    res.status(201).json(
      await culturaService.registrarFrequencia(req.params.id, {
        data: req.body?.data,
        presentes: Array.isArray(req.body?.presentes) ? req.body.presentes : [],
        registradoPor: (req as any).userId,
      })
    )
  )
);

// --------------------------------------------------------------- matrículas
// GET /api/apps/cultura/matriculas?oficinaId=&status=&busca=
router.get(
  '/matriculas',
  handle(async (req, res) => {
    const { oficinaId, status, busca } = req.query;
    res.json(
      await culturaService.listMatriculas({
        oficinaId: (oficinaId as string) || undefined,
        status: (status as string) || undefined,
        busca: (busca as string) || undefined,
      })
    );
  })
);

router.post(
  '/matriculas',
  handle(async (req, res) => res.status(201).json(await culturaService.createMatricula(req.body)))
);

router.put(
  '/matriculas/:id',
  handle(async (req, res) =>
    res.json(await culturaService.atualizarMatricula(req.params.id, req.body))
  )
);

router.post(
  '/matriculas/:id/matricular',
  handle(async (req, res) => {
    if (!req.body?.oficinaId) return res.status(400).json({ error: 'oficinaId é obrigatório' });
    res.json(await culturaService.matricular(req.params.id, req.body.oficinaId));
  })
);

// ------------------------------------------------------------------ espaços
router.get(
  '/espacos',
  handle(async (_req, res) => res.json(await culturaService.listEspacos()))
);

// ----------------------------------------------------------------- reservas
// GET /api/apps/cultura/reservas?espacoId=&status=&data=
router.get(
  '/reservas',
  handle(async (req, res) => {
    const { espacoId, status, data } = req.query;
    res.json(
      await culturaService.listReservas({
        espacoId: (espacoId as string) || undefined,
        status: (status as string) || undefined,
        data: (data as string) || undefined,
      })
    );
  })
);

router.post(
  '/reservas',
  handle(async (req, res) => res.status(201).json(await culturaService.createReserva(req.body)))
);

router.put(
  '/reservas/:id',
  handle(async (req, res) =>
    res.json(await culturaService.atualizarReserva(req.params.id, req.body))
  )
);

router.post(
  '/reservas/:id/confirmar',
  handle(async (req, res) => res.json(await culturaService.confirmarReserva(req.params.id)))
);

router.post(
  '/reservas/:id/recusar',
  handle(async (req, res) =>
    res.json(await culturaService.recusarReserva(req.params.id, req.body?.motivo))
  )
);

router.post(
  '/reservas/:id/cancelar',
  handle(async (req, res) =>
    res.json(await culturaService.cancelarReserva(req.params.id, req.body?.motivo))
  )
);

// ------------------------------------------------------------------ editais
router.get(
  '/editais',
  handle(async (_req, res) => res.json(await culturaService.listEditais()))
);

router.post(
  '/editais',
  handle(async (req, res) => res.status(201).json(await culturaService.createEdital(req.body)))
);

router.put(
  '/editais/:id',
  handle(async (req, res) => res.json(await culturaService.atualizarEdital(req.params.id, req.body)))
);

// ----------------------------------------------------------------- projetos
// GET /api/apps/cultura/projetos?editalId=&status=&busca=
router.get(
  '/projetos',
  handle(async (req, res) => {
    const { editalId, status, busca } = req.query;
    res.json(
      await culturaService.listProjetos({
        editalId: (editalId as string) || undefined,
        status: (status as string) || undefined,
        busca: (busca as string) || undefined,
      })
    );
  })
);

router.post(
  '/projetos',
  handle(async (req, res) => res.status(201).json(await culturaService.createProjeto(req.body)))
);

router.put(
  '/projetos/:id',
  handle(async (req, res) =>
    res.json(await culturaService.atualizarProjeto(req.params.id, req.body))
  )
);

router.post(
  '/projetos/:id/iniciar-analise',
  handle(async (req, res) => res.json(await culturaService.iniciarAnaliseProjeto(req.params.id)))
);

router.post(
  '/projetos/:id/pareceres',
  handle(async (req, res) => {
    const user = (req as any).user;
    res.status(201).json(
      await culturaService.adicionarParecer(req.params.id, {
        texto: req.body?.texto,
        recomendacao: req.body?.recomendacao,
        autorId: (req as any).userId,
        autorNome: user?.name,
      })
    );
  })
);

router.post(
  '/projetos/:id/aprovar',
  handle(async (req, res) =>
    res.json(await culturaService.aprovarProjeto(req.params.id, req.body?.editalId))
  )
);

router.post(
  '/projetos/:id/reprovar',
  handle(async (req, res) =>
    res.json(await culturaService.reprovarProjeto(req.params.id, req.body?.motivo))
  )
);

router.post(
  '/projetos/:id/cancelar',
  handle(async (req, res) => res.json(await culturaService.cancelarProjeto(req.params.id)))
);

// -------------------------------------------------------------- empréstimos
// GET /api/apps/cultura/emprestimos?status=
router.get(
  '/emprestimos',
  handle(async (req, res) =>
    res.json(
      await culturaService.listEmprestimos({
        status: (req.query.status as string) || undefined,
      })
    )
  )
);

router.post(
  '/emprestimos',
  handle(async (req, res) => res.status(201).json(await culturaService.createEmprestimo(req.body)))
);

router.post(
  '/emprestimos/:id/emprestar',
  handle(async (req, res) =>
    res.json(await culturaService.emprestar(req.params.id, req.body?.dataPrevistaDevolucao))
  )
);

router.post(
  '/emprestimos/:id/devolver',
  handle(async (req, res) => res.json(await culturaService.devolver(req.params.id)))
);

router.post(
  '/emprestimos/:id/cancelar',
  handle(async (req, res) =>
    res.json(await culturaService.cancelarEmprestimo(req.params.id, req.body?.motivo))
  )
);

export default router;
